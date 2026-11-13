/**
 * 马列体生成器 — 服务端 System Prompt 组装器
 *
 * 纯 CJS，便于本地用 node 直接 require 做断言测试；数据来自自动生成的
 * api/marxist-prompts.generated.js（由 _tools/build_marxist_prompts.cjs 从客户端模块生成）。
 *
 * 组装顺序（与客户端 buildFinalPrompt 保持一致）：
 *   导师时期 Prompt → 输入类型火力档位 → 语气 → 共享护栏（A1/A2/A3/B1/B3/C3）→ 输出格式
 *   → 规则引擎 featureTags（可选）
 */
'use strict';

var P = require('./marxist-prompts.generated.js');

var AUTHORS = P.authors;
var PERIODS = P.periods;
var INPUT_TYPES = P.inputTypes;
var TONES = Object.keys(P.tones);

function normalize(opts) {
  opts = opts || {};
  var author = AUTHORS.indexOf(opts.author) >= 0 ? opts.author : 'stalin';
  var period = PERIODS.indexOf(opts.period) >= 0 ? opts.period : 'standard';
  if (!P.prompts[author] || !P.prompts[author][period]) period = 'standard';
  var inputType = INPUT_TYPES.indexOf(opts.inputType) >= 0 ? opts.inputType : null;
  var tone = TONES.indexOf(opts.tone) >= 0 ? opts.tone : 'auto';
  return { author: author, period: period, inputType: inputType, tone: tone, longForm: !!opts.longForm };
}

function buildSystemPrompt(opts) {
  var o = normalize(opts);
  var parts = [P.prompts[o.author][o.period]];

  if (o.inputType) {
    parts.push('【输入类型与强度】\n输入类型：' + o.inputType + '。\n' + P.inputGuides[o.inputType]);
  }

  parts.push(P.tones[o.tone]);
  parts.push(P.guards.structureAim);
  parts.push(P.guards.antiPatterns);
  parts.push(P.guards.weaponDowngrade);
  parts.push(P.guards.rewriteMode);
  parts.push(P.guards.debateFourSteps);
  // 五导师均已自带专属失效区；仅在缺失时补通用版，避免同一段落重复两次
  if (parts.join('\n').indexOf('【工具失效区') === -1) {
    parts.push(P.guards.invalidZoneGeneric);
  }
  if (o.longForm) parts.push(P.guards.longForm);
  parts.push(P.guards.outputFormat);

  if (Array.isArray(opts && opts.featureTags) && opts.featureTags.length > 0) {
    var lines = ['【预处理提示——规则引擎已检测到以下特征】'];
    opts.featureTags.forEach(function (tag) {
      lines.push('- ' + String(tag).slice(0, 200));
    });
    lines.push('请在转换时优先使用与这些特征相匹配的句式规则。');
    parts.push(lines.join('\n'));
  }

  var systemPrompt = parts.join('\n\n');
  var meta = {
    author: o.author,
    period: o.period,
    inputType: o.inputType || 'auto',
    tone: o.tone,
    longForm: !!o.longForm,
    promptVersion: P.version + '/' + P.guardsVersion + '/' + o.author + '/' + o.period + '/' + o.tone,
    promptChars: systemPrompt.length,
    fragments: extractFragments(systemPrompt),
    sources: P.sources
  };

  return { systemPrompt: systemPrompt, meta: meta };
}

/**
 * 从已组装的 systemPrompt 里反解出本次实际注入的经典片段（篇名 + 学习要点）。
 * 生成表的片段行格式：片段N（篇名）[要点：…]：原文
 * 前端「溯源」用它渲染「去读原文」，保证链接与真正进入 Prompt 的片段一致。
 */
function extractFragments(systemPrompt) {
  var out = [];
  var re = /片段\d+（([^）]+)）(?:\[要点：([^\]]*)\])?：/g;
  var m;
  while ((m = re.exec(systemPrompt)) !== null) {
    out.push({ work: m[1], point: m[2] || '' });
  }
  return out;
}

module.exports = {
  AUTHORS: AUTHORS,
  PERIODS: PERIODS,
  INPUT_TYPES: INPUT_TYPES,
  TONES: TONES,
  TONE_META: P.toneMeta,
  PROMPTS_VERSION: P.version,
  GUARDS_VERSION: P.guardsVersion,
  normalize: normalize,
  buildSystemPrompt: buildSystemPrompt,
  extractFragments: extractFragments
};