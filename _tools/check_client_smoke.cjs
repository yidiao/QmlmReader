#!/usr/bin/env node
/**
 * check_client_smoke.cjs — 客户端（无构建）冒烟校验
 *
 * 用 vm + 最小 DOM 桩，按页面真实顺序加载：
 *   prompt-guards → topics → 五导师 → article-db → marxist-style-ai → marxist-style
 * 断言：
 *   1) 全部脚本可加载，控制器/导师/议题库导出齐全；
 *   2) UIController.init() 不抛错；
 *   3) C4 议题抽取：_fillRandomTopic 能把题目填进输入框；
 *   4) C3 溯源：_renderResult 把匹配文章与片段渲染成「去读原文」站内链接。
 *
 * 用法：node _tools/check_client_smoke.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

let pass = 0;
const failures = [];
function assert(cond, name, detail) { cond ? pass++ : failures.push(name + (detail ? ' — ' + detail : '')); }

function fakeEl(id) {
  const el = {
    id: id, style: { setProperty() {}, removeProperty() {}, getPropertyValue() { return ''; } }, dataset: {}, children: [], value: '', textContent: '', innerHTML: '',
    disabled: false, className: '',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { return c; }, removeChild() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return fakeEl(); }, querySelectorAll() { return []; },
    scrollIntoView() {}, focus() {}, click() {}, remove() {},
    getBoundingClientRect() { return { top: 0, left: 0, width: 100, height: 100 }; }
  };
  return el;
}

const els = {};
const document = {
  readyState: 'complete',
  addEventListener() {},
  getElementById(id) { return els[id] || (els[id] = fakeEl(id)); },
  querySelector() { return fakeEl(); },
  querySelectorAll() { return []; },
  createElement(t) { return fakeEl(t); },
  createTextNode(t) { return { textContent: t }; },
  body: fakeEl('body'), documentElement: fakeEl('html'), head: fakeEl('head')
};

const sandbox = {
  console: { log() {}, warn() {}, error() {} },
  document: document,
  setTimeout, clearTimeout, setInterval, clearInterval,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'smoke' },
  location: { href: 'http://x/html/experimental/marxist-style.html', pathname: '/html/experimental/marxist-style.html' },
  fetch: function () { return Promise.reject(new Error('no network in smoke')); },
  alert() {}, confirm() { return true; }, prompt() { return ''; },
  Math, JSON, Date, RegExp, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent,
  Image: function () { this.src = ''; this.onload = null; this.onerror = null; },
  Blob: function () {}, URL: { createObjectURL() { return 'blob:x'; }, revokeObjectURL() {} },
  SITE_DATA: {
    articleIndex: [
      { title: '论持久战', file: 'articles/Mao/lun-chi-jiu-zhan.html', authorKey: 'mao' },
      { title: '路德维希·费尔巴哈和德国古典哲学的终结', file: 'articles/Engels/feuerbach.html', authorKey: 'engels' }
    ]
  }
};
sandbox.window = sandbox;
sandbox.window.SITE_DATA = sandbox.SITE_DATA;
vm.createContext(sandbox);

const FILES = [
  'js/marxist/prompt-guards.js',
  'js/marxist/topics.js',
  'js/marxist/mentors/stalin.js',
  'js/marxist/mentors/lenin.js',
  'js/marxist/mentors/marx.js',
  'js/marxist/mentors/engels.js',
  'js/marxist/mentors/mao.js',
  'js/marxist/mentors/article-db.js',
  'js/marxist/marxist-style-ai.js',
  'js/marxist/marxist-style.js'
];
FILES.forEach(function (f) {
  try {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
    pass++;
  } catch (e) {
    failures.push('加载 ' + f + ' — ' + e.message);
  }
});

assert(!!sandbox.window.MarxistGuards, 'MarxistGuards 导出');
assert(!!sandbox.window.MarxistTopics, 'MarxistTopics 导出');
['StalinMentor', 'LeninMentor', 'MarxMentor', 'EngelsMentor', 'MaoMentor'].forEach(function (k) {
  assert(!!sandbox.window[k], k + ' 导出');
});
assert(!!sandbox.window.ArticleDB, 'ArticleDB 导出');
assert(typeof sandbox.window.StalinAIController.deepPolish === 'function', 'StalinAIController.deepPolish 存在');
assert(!!sandbox.window.UIController, 'UIController 导出');

// 2) init 不抛错
try {
  sandbox.window.UIController.init();
  pass++;
} catch (e) {
  failures.push('UIController.init() — ' + e.message);
}

// 3) 议题抽屉 + 抽取
try {
  const ui = sandbox.window.UIController;
  ui.elements.topicCurrent = fakeEl('ms-topic-current');
  ui.elements.inputText = fakeEl('ms-input-text');
  ui.elements.charCount = fakeEl('ms-char-count');

  // 抽屉列表：默认全部 179 条，标题与来源元信息都要渲染
  ui.elements.topicList = fakeEl('ms-topic-list');
  ui.elements.topicCount = fakeEl('ms-topic-count');
  ui.elements.topicOpen = fakeEl('ms-topic-open');
  ui.topicSource = 'all';
  ui.topicQuery = '';
  ui._renderTopicList();
  const html = ui.elements.topicList.innerHTML;
  assert((html.match(/ms-topic-item"/g) || []).length === 179, '抽屉渲染 179 条议题',
    String((html.match(/ms-topic-item"/g) || []).length));
  assert(ui.elements.topicCount.textContent === '179', '抽屉计数 179', ui.elements.topicCount.textContent);
  const allT = sandbox.window.MarxistTopics.all();
  const metaH = ui._topicMeta(allT.filter(function (x) { return x.source === 'hundred'; })[0]);
  const metaQ = ui._topicMeta(allT.filter(function (x) { return x.source === 'qingma'; })[0]);
  assert(metaH.indexOf('一百问') !== -1 && metaQ.indexOf('青马') !== -1, '抽屉元信息区分两个来源', metaH + ' | ' + metaQ);

  // 搜索过滤
  ui.topicQuery = '法团主义';
  ui._renderTopicList();
  const filtered = ui.elements.topicList.innerHTML;
  assert(filtered.indexOf('ms-topic-item"') !== -1 && filtered !== html, '搜索能过滤议题');

  // 来源筛选 + 随机抽题
  ui.topicQuery = '';
  ui.topicSource = 'qingma';
  ui._renderTopicList();
  assert((ui.elements.topicList.innerHTML.match(/ms-topic-item"/g) || []).length === 79, '青马筛选 79 条');
  ui._fillRandomTopic();
  const v = ui.elements.inputText.value;
  assert(typeof v === 'string' && v.length > 4, '议题抽取填入输入框', v && v.slice(0, 20));
  assert(ui.elements.topicCurrent.textContent.indexOf('青马') !== -1, '议题来源标签正确', ui.elements.topicCurrent.textContent);

  // 点选具体议题
  const firstId = sandbox.window.MarxistTopics.qingma[0].id;
  ui._applyTopic(firstId);
  assert(ui.elements.inputText.value === sandbox.window.MarxistTopics.qingma[0].topic, '点选议题填入输入框', ui.elements.inputText.value);
} catch (e) {
  failures.push('议题抽屉/抽取 — ' + e.message);
}

// 4) 溯源渲染
try {
  const ui = sandbox.window.UIController;
  const meta = fakeEl('ms-ai-meta');
  ui._renderResult({
    result: '测试输出',
    usage: { total_tokens: 12 },
    inputType: 'opinion',
    matchedArticles: [{ title: '论持久战', year: 1938 }],
    fragments: [{ work: '论持久战', text: 'x', point: 'y' }, { work: '综合', text: 'z' }]
  }, null, meta, '测试文本', 'vercel');
  assert(meta.innerHTML.indexOf('去读原文') !== -1, '结果区出现「去读原文」');
  assert(meta.innerHTML.indexOf('../articles/Mao/lun-chi-jiu-zhan.html') !== -1, '原文链接路径正确', meta.innerHTML.slice(0, 160));
  assert(meta.innerHTML.indexOf('溯源片段') !== -1, '结果区出现溯源片段');

  // 别名/OCR 标题匹配：费尔巴哈论 → 路德维希·费尔巴哈和德国古典哲学的终结
  const meta2 = fakeEl('ms-ai-meta');
  ui._renderResult({
    result: 'x', usage: { total_tokens: 1 }, inputType: 'opinion',
    matchedArticles: [], fragments: [{ work: '费尔巴哈论', text: 'x' }]
  }, null, meta2, 't', 'vercel');
  assert(meta2.innerHTML.indexOf('../articles/Engels/feuerbach.html') !== -1, '别名篇名可解析原文链接', meta2.innerHTML.slice(0, 160));
} catch (e) {
  failures.push('溯源渲染 — ' + e.message);
}

console.log('客户端冒烟：' + pass + ' 通过 / ' + failures.length + ' 失败');
if (failures.length) {
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(1);
}
console.log('  ✓ 脚本加载、初始化、议题抽取、溯源链接全部正常');
