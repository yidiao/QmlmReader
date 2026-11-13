#!/usr/bin/env node
/**
 * train_topics.cjs — 议题训练集生成器（C4 强化训练）
 *
 * 把议题库（一百问 100 + 青马题库 79）编排成一份可复现的“训练课程表”：
 * 每条议题轮转分配 导师 / 时期 / 语气 / 输入类型，用线上同一套 prompt 装配器
 * （api/marxist-prompt-assembler.cjs）生成 systemPrompt 指纹，输出 JSONL。
 *
 * 默认只写元数据（体积小，可入库）；加 --full 才把完整 systemPrompt 写进 JSONL。
 *
 * 用法：
 *   node _tools/train_topics.cjs                 # 写 doc/.../议题训练集.jsonl
 *   node _tools/train_topics.cjs --full          # 额外写出 prompt 全文
 *   node _tools/train_topics.cjs --out <path>    # 自定义输出路径
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const A = require(path.join(ROOT, 'api/marxist-prompt-assembler.cjs'));

const args = process.argv.slice(2);
const FULL = args.indexOf('--full') !== -1;
const outIdx = args.indexOf('--out');
const OUT = outIdx !== -1 && args[outIdx + 1]
  ? path.resolve(args[outIdx + 1])
  : path.join(ROOT, 'doc/pages/experimental/research/马列体/议题训练集.jsonl');

// 载入议题库
const sandbox = { console: { log: function () {} }, window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/marxist/topics.js'), 'utf8'), sandbox, { filename: 'topics.js' });
const topics = sandbox.window.MarxistTopics.all();

const AUTHORS = A.AUTHORS;                       // ['stalin','lenin','marx','engels','mao']
const PERIODS = A.PERIODS;                       // ['standard','period1','period2','period3']
const TONES = A.TONES;

const lines = [];
const stats = { authors: {}, periods: {}, tones: {}, sources: {} };

topics.forEach(function (t, i) {
  const author = AUTHORS[i % AUTHORS.length];
  const period = PERIODS[i % PERIODS.length];
  const tone = TONES[i % TONES.length];
  const inputType = t.source === 'hundred' ? 'abstract' : 'opinion';
  const built = A.buildSystemPrompt({ author: author, period: period, inputType: inputType, tone: tone });

  const rec = {
    id: t.id,
    source: t.source,
    title: t.title,
    tags: t.tags,
    category: t.category,
    author: author,
    period: period,
    tone: tone,
    inputType: inputType,
    promptVersion: built.meta.promptVersion,
    promptChars: built.meta.promptChars,
    promptSha256: crypto.createHash('sha256').update(built.systemPrompt, 'utf8').digest('hex').slice(0, 16)
  };
  if (FULL) rec.systemPrompt = built.systemPrompt;
  lines.push(JSON.stringify(rec));

  stats.authors[author] = (stats.authors[author] || 0) + 1;
  stats.periods[period] = (stats.periods[period] || 0) + 1;
  stats.tones[tone] = (stats.tones[tone] || 0) + 1;
  stats.sources[t.source] = (stats.sources[t.source] || 0) + 1;
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');

const size = fs.statSync(OUT).size;
console.log('议题训练集：' + lines.length + ' 条 → ' + path.relative(ROOT, OUT).replace(/\\/g, '/'));
console.log('  体积 ' + (size / 1024).toFixed(1) + ' KB' + (FULL ? '（含 prompt 全文）' : '（仅元数据，--full 含全文）'));
console.log('  来源：' + JSON.stringify(stats.sources));
console.log('  导师：' + JSON.stringify(stats.authors));
console.log('  时期：' + JSON.stringify(stats.periods));
console.log('  语气：' + JSON.stringify(stats.tones));
