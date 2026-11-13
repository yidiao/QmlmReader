#!/usr/bin/env node
/**
 * 马列体 Prompt 一致性校验
 *
 * 用法：node _tools/check_marxist_prompts.cjs
 *
 * 校验五件事：
 * 1) 生成的 api/marxist-prompts.generated.js 与事实源（guards + 五导师模块）完全同步，无手改/漂移；
 * 2) 服务端组装器对 5 导师 × 4 时期都能产出完整护栏、不重复、长度可控，且时期真实生效；
 * 3) 语气/输入类型/非法值回退等分支行为正确；
 * 4) 五导师的考证数据（tensions / dossier）完整，且张力只注入标准时期；
 * 5) C1 每段片段带学习要点并注入 prompt；C5 article-db 78 篇逐篇有独立论敌字段。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GENERATOR = path.join(ROOT, '_tools/build_marxist_prompts.cjs');
const COMMITTED = path.join(ROOT, 'api/marxist-prompts.generated.js');
const MENTOR_DIR = path.join(ROOT, 'js/marxist/mentors');

let pass = 0;
const failures = [];

function ok(name, cond, detail) {
  if (cond) {
    pass++;
  } else {
    failures.push(name + (detail !== undefined ? ' — ' + detail : ''));
  }
}

/** 在 vm 沙箱里加载导师模块（浏览器模块用 window 挂载 + console.log） */
function loadMentor(file, globalName) {
  const sandbox = { window: {}, console: { log: function () {}, warn: function () {}, error: function () {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(MENTOR_DIR, file), 'utf8'), sandbox, { filename: file });
  return sandbox.window[globalName];
}

function main() {
  // 1) 漂移检查：重新生成到临时文件，与已提交文件逐字节比对
  const tmp = path.join(os.tmpdir(), 'marxist-prompts-check-' + process.pid + '.js');
  try {
    execFileSync(process.execPath, [GENERATOR], {
      env: Object.assign({}, process.env, { MARXIST_PROMPTS_OUT: tmp }),
      stdio: 'pipe'
    });
    const fresh = fs.readFileSync(tmp, 'utf8');
    const committed = fs.readFileSync(COMMITTED, 'utf8');
    ok('生成表与事实源同步（无漂移）', fresh === committed,
      '请运行 node _tools/build_marxist_prompts.cjs 重新生成');
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }

  // 2) 服务端组装器断言
  const asm = require(path.join(ROOT, 'api/marxist-prompt-assembler.cjs'));

  ok('导师数量为 5', asm.AUTHORS.length === 5, asm.AUTHORS.join(','));
  ok('时期数量为 4', asm.PERIODS.length === 4, asm.PERIODS.join(','));
  ok('语气数量为 8', asm.TONES.length === 8, asm.TONES.join(','));

  for (const author of asm.AUTHORS) {
    for (const period of asm.PERIODS) {
      const built = asm.buildSystemPrompt({ author, period, inputType: 'opinion', tone: 'auto' });
      const s = built.systemPrompt;
      const tag = author + '/' + period;
      ok(tag + ' 含结构准星', s.includes('【批判准星'));
      ok(tag + ' 七条禁令不重复', (s.match(/【七条文风禁令/g) || []).length === 1);
      ok(tag + ' 含武器降维', s.includes('【武器降维'));
      ok(tag + ' 含改写态', s.includes('【改写态'));
      ok(tag + ' 含工具失效区（导师级）', s.includes('【工具失效区'));
      ok(tag + ' 工具失效区不重复', (s.match(/【工具失效区/g) || []).length === 1,
        (s.match(/【工具失效区/g) || []).length);
      ok(tag + ' 含输出格式', s.includes('【输出格式】'));
      ok(tag + ' 长度在预算内', s.length >= 1200 && s.length <= 9600, s.length);
      if (period === 'standard') {
        ok(tag + ' 标准时期注入内在张力（唯一）',
          (s.match(/【内在张力/g) || []).length === 1,
          (s.match(/【内在张力/g) || []).length);
      } else {
        ok(tag + ' 非标准时期不注入张力', !s.includes('【内在张力'));
        const std = asm.buildSystemPrompt({ author, period: 'standard', inputType: 'opinion', tone: 'auto' }).systemPrompt;
        ok(tag + ' 时期真实生效', s !== std);
      }
    }
  }

  // 3) 语气 / 输入类型 / 回退
  const calm = asm.buildSystemPrompt({ author: 'marx', period: 'standard', tone: 'calm' }).systemPrompt;
  const irony = asm.buildSystemPrompt({ author: 'marx', period: 'standard', tone: 'irony' }).systemPrompt;
  ok('语气 calm 生效', calm.includes('【语气：冷静-分析性】'));
  ok('语气 irony 生效', irony.includes('【语气：讽刺-嘲弄】'));
  ok('不同语气输出不同', calm !== irony);

  const casual = asm.buildSystemPrompt({ author: 'mao', period: 'standard', inputType: 'casual', tone: 'auto' }).systemPrompt;
  const opinion = asm.buildSystemPrompt({ author: 'mao', period: 'standard', inputType: 'opinion', tone: 'auto' }).systemPrompt;
  ok('输入类型 casual 生效', casual.includes('这是一段日常文本'));
  ok('不同输入类型输出不同', casual !== opinion);

  ok('非法作者回退 stalin', asm.normalize({ author: 'bogus' }).author === 'stalin');
  ok('非法时期回退 standard', asm.normalize({ author: 'marx', period: 'period9' }).period === 'standard');
  ok('非法语气回退 auto', asm.normalize({ author: 'marx', tone: 'bogus' }).tone === 'auto');
  ok('promptVersion 含导师与时期', /stalin\/period2/.test(
    asm.buildSystemPrompt({ author: 'stalin', period: 'period2' }).meta.promptVersion));

  // 3.5) 长文模式：短输入不注入，长输入注入且预算仍可控
  const shortPrompt = asm.buildSystemPrompt({ author: 'mao', period: 'standard', tone: 'auto' }).systemPrompt;
  const longPrompt = asm.buildSystemPrompt({ author: 'mao', period: 'standard', tone: 'auto', longForm: true }).systemPrompt;
  ok('短输入不注入长文模式', !shortPrompt.includes('【长文模式'));
  ok('长文模式块已注入', longPrompt.includes('【长文模式——输入超过 800 字时启用】'));
  ok('长文模式要求保真与不缩水', longPrompt.includes('保真优先') && longPrompt.includes('篇幅不缩水'));
  ok('长文模式长度在预算内', longPrompt.length <= 10400, longPrompt.length);
  ok('长文模式 meta 标记', asm.buildSystemPrompt({ author: 'mao', longForm: true }).meta.longForm === true);
  ok('长文模式不改变 promptVersion 结构',
    /mao\/standard\/auto/.test(asm.buildSystemPrompt({ author: 'mao', longForm: true }).meta.promptVersion));

  // 4) 导师考证数据（tensions / dossier）完整性与张力注入
  const MENTORS = [
    { file: 'stalin.js', name: 'StalinMentor', label: '斯大林' },
    { file: 'lenin.js', name: 'LeninMentor', label: '列宁' },
    { file: 'marx.js', name: 'MarxMentor', label: '马克思' },
    { file: 'engels.js', name: 'EngelsMentor', label: '恩格斯' },
    { file: 'mao.js', name: 'MaoMentor', label: '毛泽东' }
  ];

  for (const m of MENTORS) {
    const mod = loadMentor(m.file, m.name);
    ok(m.label + ' 模块可加载', !!mod);
    if (!mod) continue;

    const ts = mod.tensions;
    ok(m.label + ' tensions 存在且 3-4 条',
      Array.isArray(ts) && ts.length >= 3 && ts.length <= 4, ts && ts.length);
    if (Array.isArray(ts)) {
      ts.forEach(function (t, i) {
        ok(m.label + ' 张力' + (i + 1) + ' 用「标题：解释」格式',
          typeof t === 'string' && t.includes('：'));
        ok(m.label + ' 张力' + (i + 1) + ' 长度≤60',
          typeof t === 'string' && t.length <= 60, typeof t === 'string' ? t.length : t);
      });
    }

    const d = mod.dossier;
    ok(m.label + ' dossier 存在', !!d);
    if (d) {
      ok(m.label + ' 身份卡 5 条',
        Array.isArray(d.identityCard) && d.identityCard.length === 5,
        d.identityCard && d.identityCard.length);
      ok(m.label + ' 时间线 8-12 条',
        Array.isArray(d.timeline) && d.timeline.length >= 8 && d.timeline.length <= 12,
        d.timeline && d.timeline.length);
      ok(m.label + ' 认识论 4-6 条',
        Array.isArray(d.epistemology) && d.epistemology.length >= 4 && d.epistemology.length <= 6,
        d.epistemology && d.epistemology.length);
      ok(m.label + ' 论敌 6-9 条',
        Array.isArray(d.opponents) && d.opponents.length >= 6 && d.opponents.length <= 9,
        d.opponents && d.opponents.length);
      ok(m.label + ' 书单 ≥3 类',
        Array.isArray(d.booklist) && d.booklist.length >= 3,
        d.booklist && d.booklist.length);
      ok(m.label + ' 论敌字段完整',
        (d.opponents || []).every(function (o) { return o && o.opponent && o.attitude && o.point; }));
      ok(m.label + ' 时间线字段完整',
        (d.timeline || []).every(function (t) { return t && t.year && t.event && t.impact; }));
      ok(m.label + ' 认识论字段完整',
        (d.epistemology || []).every(function (e) { return e && e.name && e.content && e.limit; }));
      ok(m.label + ' 书单字段完整',
        (d.booklist || []).every(function (b) { return b && b.category && Array.isArray(b.titles) && b.titles.length > 0; }));
    }

    const std = mod.buildPrompt('测试文本', 'standard', null, null);
    const p1 = mod.buildPrompt('测试文本', 'period1', null, null);
    ok(m.label + ' buildPrompt 标准时期注入张力（唯一）',
      (std.match(/【内在张力/g) || []).length === 1,
      (std.match(/【内在张力/g) || []).length);
    ok(m.label + ' buildPrompt 非标准时期不注入张力', !p1.includes('【内在张力'));

    // C1：每段经典片段都必须有「学习要点」，且注入 prompt 时可见
    const frags = mod.fragments || [];
    ok(m.label + ' 片段数量 28-30', frags.length >= 28 && frags.length <= 30, frags.length);
    ok(m.label + ' 片段全部带学习要点',
      frags.every(function (f) { return f && typeof f.point === 'string' && f.point.length >= 4 && f.point.length <= 40; }),
      frags.filter(function (f) { return !f || typeof f.point !== 'string' || f.point.length < 4 || f.point.length > 40; }).length + ' 段异常');
    const picked = mod.pickFragments('standard', '测试文本', 3);
    const withFrags = mod.buildPrompt('测试文本', 'standard', null, picked);
    ok(m.label + ' 学习要点注入 prompt', withFrags.includes('[要点：'));
  }

  // C5：article-db 独立论敌库——78 篇逐篇标注
  const dbBox = { console: { log: function () {} }, window: {}, setTimeout: setTimeout, localStorage: { getItem: function () { return null; }, setItem: function () {} } };
  vm.createContext(dbBox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/marxist/mentors/article-db.js'), 'utf8'), dbBox, { filename: 'article-db.js' });
  const DB = dbBox.window.ArticleDB;
  ok('article-db 可加载', !!DB && !!DB.articles);
  if (DB && DB.articles) {
    const list = [];
    Object.keys(DB.articles).forEach(function (a) { list.push.apply(list, DB.articles[a]); });
    ok('文章库 78 篇', list.length === 78, list.length);
    ok('每篇都有独立论敌字段 2-5 条',
      list.every(function (a) { return Array.isArray(a.opponents) && a.opponents.length >= 2 && a.opponents.length <= 5; }),
      list.filter(function (a) { return !Array.isArray(a.opponents) || a.opponents.length < 2 || a.opponents.length > 5; }).length + ' 篇异常');
    ok('论敌字段非空字符串',
      list.every(function (a) { return a.opponents.every(function (o) { return typeof o === 'string' && o.length > 0; }); }));
  }

  // 报告
  const total = pass + failures.length;
  console.log('[check_marxist_prompts] ' + pass + '/' + total + ' 项通过');
  if (failures.length > 0) {
    failures.forEach(function (f) { console.error('  ✗ ' + f); });
    process.exit(1);
  }
  console.log('  ✓ 生成表无漂移；5 导师 × 4 时期护栏齐全；考证数据完整；张力仅注入标准时期；片段要点与文章论敌齐全');
}

main();
