#!/usr/bin/env node
/**
 * local_server.cjs — 本地调试服务器（不依赖 Vercel）
 *
 * 一个进程同时做两件事：
 *   1) 静态托管整个仓库（等同 GitHub Pages 的目录结构），页面路径与线上一致；
 *   2) 在 /api/translate 上跑 api/translate.js 的同一份代码（ESM→CJS 现场转换），
 *      所以时期/语气/输入类型/溯源片段的行为与部署版完全一致。
 *
 * 页面里 `_getApiBase()` 默认指向 Vercel 域名；本服务在返回 HTML 时注入
 * `window.QMLM_API_BASE = location.origin`，让页面改打本机接口，仓库文件不改。
 *
 * API Key 读取顺序：
 *   1) 环境变量 DEEPSEEK_API_KEY
 *   2) 仓库内 `_local/deepseek.key`（已 gitignore，一行纯文本）
 * 两者都没有时：/api/translate 返回 503，页面会自动回退到「个人 API Key」直连
 * （DeepSeek 允许浏览器跨域，页面里粘 Key 即可用）。
 *
 * 用法：
 *   node _tools/local_server.cjs                 # http://127.0.0.1:8787
 *   node _tools/local_server.cjs --port 9000
 *   node _tools/local_server.cjs --mock          # 不调 API，返回占位文本，只验 UI 链路
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
function argVal(name, dflt) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
}
const PORT = parseInt(argVal('--port', process.env.QMLM_PORT || '8787'), 10);
const HOST = argVal('--host', '127.0.0.1');
const MOCK = args.indexOf('--mock') !== -1;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf'
};

// ---- API Key ----
function loadApiKey() {
  if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim()) {
    return { key: process.env.DEEPSEEK_API_KEY.trim(), source: 'env' };
  }
  const keyFile = path.join(ROOT, '_local/deepseek.key');
  try {
    const k = fs.readFileSync(keyFile, 'utf8').trim();
    if (k) return { key: k, source: 'file' };
  } catch (e) { /* 无文件 */ }
  return { key: '', source: 'none' };
}

// ---- 载入 api/translate.js（ESM 源码现场转 CJS）----
let translateHandler = null;
function loadTranslateHandler() {
  if (translateHandler) return translateHandler;
  const src = fs.readFileSync(path.join(ROOT, 'api/translate.js'), 'utf8');
  const assemblerPath = path.join(ROOT, 'api/marxist-prompt-assembler.cjs').replace(/\\/g, '/');
  const transformed = src
    .replace(/import\s+assembler\s+from\s+'\.\/marxist-prompt-assembler\.cjs';/,
      "const assembler = require('" + assemblerPath + "');")
    .replace(/export\s+default\s+async\s+function\s+handler/, 'async function handler')
    .concat('\nmodule.exports = handler;\n');
  const dir = path.join(ROOT, '_local');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'translate.local.cjs');
  fs.writeFileSync(out, transformed, 'utf8');
  delete require.cache[require.resolve(out)];
  translateHandler = require(out);
  return translateHandler;
}

// ---- 静态文件 ----
function safePath(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const abs = path.resolve(ROOT, '.' + p);
  if (!abs.startsWith(ROOT + path.sep) && abs !== ROOT) return null;
  return abs;
}

function injectApiBase(html) {
  const tag = '<script>window.QMLM_API_BASE = window.location.origin;</script>';
  // 页面里已有硬编码的 Vercel 域名：就地改成同源，保证本地请求打到本服务
  if (/window\.QMLM_API_BASE\s*=/.test(html)) {
    return html.replace(/window\.QMLM_API_BASE\s*=\s*'[^']*';/, 'window.QMLM_API_BASE = window.location.origin;');
  }
  return html.replace(/<head([^>]*)>/i, '<head$1>\n    ' + tag);
}

function serveStatic(req, res) {
  const file = safePath(req.url);
  if (!file) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(file, function (err, st) {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found: ' + req.url); return; }
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(file, function (e2, buf) {
      if (e2) { res.writeHead(500); res.end('read error'); return; }
      let body = buf;
      // 只给会调接口的页面注入本地 API 基址
      if (ext === '.html' && /marxist-style\.html$/.test(file)) {
        body = Buffer.from(injectApiBase(buf.toString('utf8')), 'utf8');
      }
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': body.length,
        'Cache-Control': 'no-store'
      });
      res.end(body);
    });
  });
}

// ---- /api/translate ----
function readBody(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on('data', function (c) {
      size += c.length;
      if (size > 1024 * 1024) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', reject);
  });
}

function mockResponse(body) {
  const A = require(path.join(ROOT, 'api/marxist-prompt-assembler.cjs'));
  const text0 = String(body.text || '');
  const longForm = text0.length >= 800;
  let built;
  try {
    built = A.buildSystemPrompt({
      author: body.author || 'marx',
      period: body.period || 'standard',
      inputType: body.inputType || null,
      tone: body.tone || 'auto',
      longForm: longForm
    });
  } catch (e) {
    built = { systemPrompt: '', meta: {} };
  }
  const text = String(body.text || '');
  const head = '【本地模拟输出】未配置 API Key，以下为占位文本，用于验证页面链路。\n\n';
  const info = '（导师：' + (body.author || 'marx') + ' · 时期：' + (body.period || 'standard')
    + ' · 语气：' + (body.tone || 'auto') + ' · 输入类型：' + (body.inputType || 'auto') + '）\n\n';
  return {
    result: head + info + '原文：' + text + '\n\n这段占位文本证明：页面 → 本地接口 → 时期/语气/输入类型参数 → 溯源片段 的链路是通的。'
      + '把 DEEPSEEK_API_KEY 写进环境变量或 _local/deepseek.key，重启本服务即可得到真实生成。',
    diagnostics: {
      mock: true,
      model: 'local-mock',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      promptVersion: built.meta.promptVersion || 'mock',
      author: built.meta.author,
      period: built.meta.period,
      inputType: built.meta.inputType,
      tone: built.meta.tone,
      longForm: longForm,
      pageIndex: Number.isInteger(body.pageIndex) ? body.pageIndex : 0,
      pageCount: Number.isInteger(body.pageCount) ? body.pageCount : 1,
      hasContext: !!(body.context && String(body.context).trim()),
      maxTokens: longForm ? Math.min(6000, Math.max(3600, Math.round(text0.length * 2.2))) : 2800,
      promptChars: built.meta.promptChars || 0
    },
    fragments: built.meta.fragments || [],
    windowRemaining: 999,
    dailyRemaining: 999
  };
}

async function handleTranslate(req, res) {
  let body;
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: '请求体不是合法 JSON' }));
    return;
  }

  if (MOCK) {
    const payload = mockResponse(body);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
    console.log('[mock] ' + (body.author || '?') + '/' + (body.period || '?') + '/' + (body.tone || '?')
      + (body.pageCount > 1 ? ' page ' + ((body.pageIndex || 0) + 1) + '/' + body.pageCount : '')
      + ' ' + String(body.text || '').length + ' 字 → 占位输出，片段 ' + payload.fragments.length + ' 条');
    return;
  }

  const k = loadApiKey();
  if (!k.key) {
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      error: '本地服务未配置 DEEPSEEK_API_KEY（可设置环境变量，或写入 _local/deepseek.key，或改用页面「个人 API Key」直连；只想验 UI 可加 --mock 启动）'
    }));
    console.log('[api] 503 未配置 Key');
    return;
  }
  process.env.DEEPSEEK_API_KEY = k.key;

  // 交给与 Vercel 完全相同的 handler；req.body 由 Vercel 预解析，这里补上
  req.body = JSON.stringify(body);
  const handler = loadTranslateHandler();
  const t0 = Date.now();
  try {
    await handler(req, res);
    console.log('[api] ' + (body.author || '?') + '/' + (body.period || '?') + '/' + (body.tone || '?')
      + ' ' + String(body.text || '').length + ' 字 → ' + (Date.now() - t0) + 'ms');
  } catch (e) {
    console.error('[api] handler 异常:', e && e.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '本地服务异常：' + (e && e.message) }));
    }
  }
}

// ---- 启动 ----
const server = http.createServer(function (req, res) {
  const url = req.url || '/';
  if (url === '/__health') {
    const k = loadApiKey();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      mode: MOCK ? 'mock' : (k.key ? 'live' : 'no-key'),
      keySource: k.source,
      port: PORT,
      root: ROOT
    }));
    return;
  }
  if (url.split('?')[0] === '/api/translate') {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '仅支持 POST' }));
      return;
    }
    handleTranslate(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, HOST, function () {
  const k = loadApiKey();
  const mode = MOCK ? 'mock（占位输出）' : (k.key ? 'live（Key 来源：' + k.source + '）' : 'no-key（页面可回退个人 Key）');
  console.log('马列体本地调试服务已启动');
  console.log('  页面：http://' + HOST + ':' + PORT + '/html/experimental/marxist-style.html');
  console.log('  健康：http://' + HOST + ':' + PORT + '/__health');
  console.log('  模式：' + mode);
  console.log('  根目录：' + ROOT);
  console.log('  Ctrl+C 停止；重启会重置内存限流计数');
});
