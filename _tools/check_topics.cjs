#!/usr/bin/env node
/**
 * check_topics.cjs — 议题库校验（C4）
 *
 * 校验 js/marxist/topics.js：
 *   - 一百问 100 条，编号 1..100 连续，分类/标签齐全
 *   - 青马题库 79 条，阵营属于六大派，弱点属于四种论证类型
 *   - all() 合计 179 条，id 唯一
 *   - 不包含生成结果字段（只做素材，不预置答案）
 *
 * 用法：node _tools/check_topics.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'js/marxist/topics.js');

let pass = 0;
const failures = [];
function assert(cond, name, detail) { cond ? pass++ : failures.push(name + (detail ? ' — ' + detail : '')); }

assert(fs.existsSync(FILE), 'topics.js 存在');
const sandbox = { console: { log: function () {} }, window: {} };
vm.createContext(sandbox);
try {
  vm.runInContext(fs.readFileSync(FILE, 'utf8'), sandbox, { filename: 'topics.js' });
  pass++;
} catch (e) {
  failures.push('topics.js 可解析 — ' + e.message);
}

const T = sandbox.window.MarxistTopics;
assert(!!T, 'window.MarxistTopics 导出');
if (!T) {
  console.log('议题库校验：' + pass + ' 通过 / ' + failures.length + ' 失败');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(1);
}

assert(T.version === 'topics-v1.0', '版本号 topics-v1.0');

// 一百问
assert(Array.isArray(T.hundred) && T.hundred.length === 100, '一百问 100 条', '实际 ' + (T.hundred || []).length);
const nums = (T.hundred || []).map(function (q) { return q.n; });
assert(nums.join(',') === Array.from({ length: 100 }, function (_, i) { return i + 1; }).join(','), '一百问编号 1..100 连续');
const badHundred = (T.hundred || []).filter(function (q) {
  return !q.question || q.question.length < 6 || !q.category || !Array.isArray(q.tags) || q.tags.length === 0;
});
assert(badHundred.length === 0, '一百问字段齐全', badHundred.length + ' 条异常');

// 青马题库
assert(Array.isArray(T.qingma) && T.qingma.length === 79, '青马题库 79 条', '实际 ' + (T.qingma || []).length);
const FACTIONS = ['古董派', '裂土派', '外来派', '闭目派', '极左派', '虚无派'];
const WEAKNESS = ['理性辩证', '归谬反诘', '阶级批判', '感性批判'];
const badQingma = (T.qingma || []).filter(function (q) {
  return !q.id || !q.topic || FACTIONS.indexOf(q.faction) === -1 || WEAKNESS.indexOf(q.weakness) === -1;
});
assert(badQingma.length === 0, '青马字段齐全（阵营/弱点合法）', badQingma.length + ' 条异常');

// 合并视图
const all = typeof T.all === 'function' ? T.all() : [];
assert(all.length === 179, 'all() 合计 179 条', '实际 ' + all.length);
const ids = all.map(function (t) { return t.id; });
assert(new Set(ids).size === ids.length, 'id 唯一');
const badAll = all.filter(function (t) { return !t.title || !t.source || !Array.isArray(t.tags); });
assert(badAll.length === 0, 'all() 字段齐全');

// 不预置答案：素材里不应出现生成结果字段
const raw = fs.readFileSync(FILE, 'utf8');
['result:', 'output:', 'answer:', 'generated:'].forEach(function (k) {
  assert(raw.indexOf(k) === -1, '不预置生成结果字段 ' + k);
});

console.log('议题库校验：' + pass + ' 通过 / ' + failures.length + ' 失败');
if (failures.length) {
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
  process.exit(1);
}
console.log('  ✓ 一百问 100 + 青马 79 = 179 条，字段与编号全部正常');
