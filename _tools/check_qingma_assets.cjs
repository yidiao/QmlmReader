#!/usr/bin/env node
/**
 * check_qingma_assets.cjs — 青马页面资源与加载顺序回归校验
 *
 * 背景：2026-11-13 有反馈称 html/experimental/qingma.html 中
 * `<script src="../../js/qingma/data.js?v=3">` 一行“找不到”。核查结论是：
 * 该行在 工作区 / HEAD / origin/main / 线上 GitHub Pages 均存在（第 297 行）。
 * 本脚本把“脚本标签 + 文件存在 + 题库可解析”固化为回归断言，
 * 以后若迁移目录或改路径漏改，会在这里直接失败。
 *
 * 用法：node _tools/check_qingma_assets.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'html/experimental/qingma.html');

let pass = 0;
const failures = [];
function ok(name) { pass++; }
function bad(name, detail) { failures.push(name + (detail ? ' — ' + detail : '')); }
function assert(cond, name, detail) { cond ? ok(name) : bad(name, detail); }

// 1. HTML 存在且包含四个脚本标签，顺序为 data → engine → ui → main
assert(fs.existsSync(HTML), 'qingma.html 存在');
const html = fs.readFileSync(HTML, 'utf8');

const ORDER = [
  '../../js/qingma/data.js?v=3',
  '../../js/qingma/engine.js?v=3',
  '../../js/qingma/ui.js?v=3',
  '../../js/qingma/main.js'
];
let last = -1;
ORDER.forEach(function (src) {
  const idx = html.indexOf('src="' + src + '"');
  assert(idx !== -1, '脚本标签存在：' + src);
  assert(idx > last, '脚本顺序正确：' + src);
  last = idx;
});

// 2. 被引用的文件都存在且非空
ORDER.forEach(function (src) {
  const clean = src.replace(/\?.*$/, '');
  const file = path.resolve(path.dirname(HTML), clean);
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  assert(fs.existsSync(file), '文件存在：' + rel);
  if (fs.existsSync(file)) {
    assert(fs.statSync(file).size > 0, '文件非空：' + rel);
  }
});

// 3. CSS 存在
const css = path.resolve(path.dirname(HTML), '../../css/qingma/style.css');
assert(fs.existsSync(css), 'css/qingma/style.css 存在');

// 4. 题库可解析：data.js 在 vm 中加载后 QUESTIONS / ENEMIES / GAME_CONFIG 齐全
const sandbox = { console: { log: function () {} }, window: {} };
vm.createContext(sandbox);
try {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/qingma/data.js'), 'utf8'), sandbox, { filename: 'data.js' });
  ok('data.js 可解析');
} catch (e) {
  bad('data.js 可解析', e.message);
}

function get(name) {
  try { return vm.runInContext(name, sandbox); } catch (e) { return undefined; }
}
const QUESTIONS = get('QUESTIONS');
const ENEMIES = get('ENEMIES');
const GAME_CONFIG = get('GAME_CONFIG');

assert(Array.isArray(QUESTIONS) && QUESTIONS.length === 79, '题库 79 题', '实际 ' + (QUESTIONS && QUESTIONS.length));
assert(ENEMIES && Object.keys(ENEMIES).length === 16, '敌人 16 种', '实际 ' + (ENEMIES && Object.keys(ENEMIES).length));
assert(GAME_CONFIG && typeof GAME_CONFIG.bossBaseHp === 'number', 'GAME_CONFIG 可读');

if (Array.isArray(QUESTIONS)) {
  const badQ = QUESTIONS.filter(function (q) {
    return !q || !q.id || !q.content || !Array.isArray(q.options) || q.options.length < 2;
  });
  assert(badQ.length === 0, '每题含 id/content/options', badQ.length + ' 题异常');
}

// 5. 页面内联脚本不重复声明题库常量（避免 SyntaxError 导致整页空白）
['const QUESTIONS', 'const ENEMIES', 'const GAME_CONFIG'].forEach(function (decl) {
  assert(html.indexOf(decl) === -1, '页面不重复声明 ' + decl);
});

console.log('qingma 资源校验：' + pass + ' 通过 / ' + failures.length + ' 失败');
if (failures.length) {
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(1);
}
console.log('  ✓ 脚本标签、加载顺序、文件存在、题库解析全部正常');
