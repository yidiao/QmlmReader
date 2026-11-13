#!/usr/bin/env node
/**
 * 生成服务端 Prompt 数据表
 *
 * 用法：node _tools/build_marxist_prompts.cjs
 * 输出：api/marxist-prompts.generated.js（CJS，供 api/marxist-prompt-assembler.cjs require）
 *
 * 设计：客户端与服务端共用同一份"事实源"——js/marxist/prompt-guards.js + js/marxist/mentors/*.js。
 * 本脚本在 Node 的 vm 沙箱里加载这些浏览器 IIFE，按（导师 × 时期）生成完整 System Prompt 前缀，
 * 并连同护栏、输入类型档位、语气光谱一起序列化为数据表。这样服务端升级不再需要手抄 Prompt。
 *
 * 注意：片段选择用确定性规则（按时期取前 3 条），保证重复生成 diff 稳定；
 * 运行时随机片段只存在于客户端直连回退路径。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.env.MARXIST_PROMPTS_OUT
  ? path.resolve(process.env.MARXIST_PROMPTS_OUT)
  : path.join(ROOT, 'api/marxist-prompts.generated.js');

const SOURCES = [
  'js/marxist/prompt-guards.js',
  'js/marxist/mentors/stalin.js',
  'js/marxist/mentors/lenin.js',
  'js/marxist/mentors/marx.js',
  'js/marxist/mentors/engels.js',
  'js/marxist/mentors/mao.js'
];

const MENTORS = [
  ['stalin', 'StalinMentor'],
  ['lenin', 'LeninMentor'],
  ['marx', 'MarxMentor'],
  ['engels', 'EngelsMentor'],
  ['mao', 'MaoMentor']
];

const PERIOD_KEYS = ['standard', 'period1', 'period2', 'period3'];

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function loadSources() {
  const ctx = { window: {}, console: { log() {}, warn() {}, error() {} } };
  vm.createContext(ctx);
  for (const rel of SOURCES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) throw new Error('缺少源文件：' + rel);
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: rel });
  }
  return ctx;
}

function pickFixedFragments(mod, period) {
  const frags = Array.isArray(mod.fragments) ? mod.fragments : [];
  const byPeriod = frags.filter(function (f) { return String(f.period) === String(period); });
  const pool = byPeriod.length >= 3 ? byPeriod : frags;
  return pool.slice(0, 3);
}

function main() {
  const ctx = loadSources();
  const G = ctx.window.MarxistGuards;
  if (!G) throw new Error('prompt-guards.js 未导出 window.MarxistGuards');

  const prompts = {};
  for (const [id, key] of MENTORS) {
    const mod = ctx.window[key];
    if (!mod || !mod.periods) throw new Error('导师模块缺失或结构错误：' + key);
    prompts[id] = {};
    for (const pk of PERIOD_KEYS) {
      if (!mod.periods[pk]) continue;
      if (typeof mod.buildPrompt !== 'function') throw new Error(key + ' 缺少 buildPrompt');
      const frags = pickFixedFragments(mod, pk);
      prompts[id][pk] = mod.buildPrompt('', pk, null, frags);
    }
  }

  const tones = {};
  const toneMeta = [];
  G.TONES.forEach(function (t) {
    tones[t.key] = t.prompt;
    toneMeta.push({ key: t.key, label: t.label, desc: t.desc });
  });

  const sources = {};
  for (const rel of SOURCES) {
    sources[rel] = sha256(fs.readFileSync(path.join(ROOT, rel)));
  }

  const data = {
    version: 'prompts-gen-v1.0',
    guardsVersion: G.VERSION,
    generatedBy: '_tools/build_marxist_prompts.cjs',
    sources: sources,
    authors: MENTORS.map(function (m) { return m[0]; }),
    periods: PERIOD_KEYS,
    inputTypes: Object.keys(G.INPUT_GUIDES),
    prompts: prompts,
    inputGuides: G.INPUT_GUIDES,
    guards: {
      structureAim: G.STRUCTURE_AIM,
      antiPatterns: G.ANTI_PATTERNS,
      weaponDowngrade: G.WEAPON_DOWNGRADE,
      rewriteMode: G.REWRITE_MODE,
      debateFourSteps: G.DEBATE_FOUR_STEPS,
      invalidZoneGeneric: G.INVALID_ZONE_GENERIC,
      outputFormat: G.OUTPUT_FORMAT,
      longForm: G.LONG_FORM,
      longFormThreshold: G.LONG_FORM_THRESHOLD
    },
    tones: tones,
    toneMeta: toneMeta
  };

  const header = [
    '/**',
    ' * 马列体生成器 — 服务端 Prompt 数据表（自动生成，请勿手改）',
    ' *',
    ' * 生成：node _tools/build_marxist_prompts.cjs',
    ' * 校验：node _tools/check_marxist_prompts.cjs',
    ' * 事实源：js/marxist/prompt-guards.js + js/marxist/mentors/*.js',
    ' * 服务端组装：api/marxist-prompt-assembler.cjs',
    ' */',
    '',
    "'use strict';",
    '',
    'module.exports = ' + JSON.stringify(data, null, 2) + ';',
    ''
  ].join('\n');

  fs.writeFileSync(OUT, header, 'utf8');

  const total = Object.keys(prompts).reduce(function (n, a) {
    return n + Object.keys(prompts[a]).reduce(function (m, p) { return m + prompts[a][p].length; }, 0);
  }, 0);
  const sizes = Object.keys(prompts).map(function (a) {
    return a + ':' + Object.keys(prompts[a]).length + '时期/' +
      Object.keys(prompts[a]).reduce(function (m, p) { return m + prompts[a][p].length; }, 0) + '字';
  });
  console.log('[build_marxist_prompts] 已写入 ' + path.relative(ROOT, OUT));
  console.log('  ' + sizes.join('  '));
  console.log('  prompt 前缀合计 ' + total + ' 字；护栏 ' + G.VERSION + '；输出 ' +
    Math.round(header.length / 1024) + ' KB');
}

main();