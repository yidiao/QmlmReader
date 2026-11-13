/**
 * 马列体生成器 — Vercel Serverless Function
 * DeepSeek API 代理层 + 多导师文体转换入口
 *
 * 当前职责：
 * - 为前端 `js/marxist/marxist-style.js` 提供 `/api/translate` 接口
 * - 代理 DeepSeek Chat Completions，并注入导师文风 System Prompt
 * - 支持马克思、恩格斯、列宁、斯大林、毛泽东五位导师
 * - 接收规则引擎预处理特征（featureTags）作为提示上下文
 * - 提供基础的 CORS、限流、超时和注入防护
 *
 * 说明：
 * - 五导师 Prompt 由 _tools/build_marxist_prompts.cjs 从客户端模块生成（前后端同源），
 *   本文件只负责组装与代理，不再手写文体 Prompt
 * - 请求可携带 period / inputType / tone（均可选，非法值回退默认）
 * - 本文件是部署到 Vercel 的后端入口，不负责静态站点页面托管
 */

import assembler from './marxist-prompt-assembler.cjs';

// ---- 配置 ----
var CONFIG = {
  MAX_INPUT_LENGTH: 2000,
  MIN_INPUT_LENGTH: 5,
  RATE_WINDOW_MS: 10 * 60 * 1000,
  RATE_WINDOW_LIMIT: 10,
  RATE_DAY_LIMIT: 30,
  API_URL: 'https://api.deepseek.com/chat/completions',
  MODEL: 'deepseek-chat',
  // 输入上限 2000 字、输出允许 +30%（约 2600 字）；1200 tokens 会截断长文。
  // 这里取 2800 留余量（deepseek-chat 单次输出上限足够）。
  MAX_OUTPUT_TOKENS: 2800,
  TIMEOUT_MS: 60000,
  ALLOWED_ORIGINS: [
    'https://qmlmreader.github.io',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080'
  ]
};

// ---- 内存速率限制器 ----
var rateStore = new Map();

function getRateLimitKey(ip) {
  return String(ip || 'unknown').slice(0, 80);
}

function checkRateLimit(ip) {
  var key = getRateLimitKey(ip);
  var now = Date.now();
  var today = new Date().toDateString();

  var entry = rateStore.get(key);
  if (!entry || entry.day !== today) {
    entry = { window: [], day: today, dailyCount: 0 };
    rateStore.set(key, entry);
  }

  entry.window = entry.window.filter(function (t) { return now - t < CONFIG.RATE_WINDOW_MS; });

  var windowRemaining = CONFIG.RATE_WINDOW_LIMIT - entry.window.length;
  var dailyRemaining = CONFIG.RATE_DAY_LIMIT - entry.dailyCount;

  if (windowRemaining <= 0) {
    var retryAfter = Math.ceil((entry.window[0] + CONFIG.RATE_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter, reason: 'window' };
  }

  if (dailyRemaining <= 0) {
    return { allowed: false, retryAfterSeconds: 86400, reason: 'daily' };
  }

  entry.window.push(now);
  entry.dailyCount += 1;

  return {
    allowed: true,
    windowRemaining: CONFIG.RATE_WINDOW_LIMIT - entry.window.length,
    dailyRemaining: CONFIG.RATE_DAY_LIMIT - entry.dailyCount
  };
}

// ---- 内容安全 ----
var INJECTION_PATTERNS = [
  /system[：:]\s*["'`]?\s*(prompt|指令|提示|消息)/i,
  /(忽略|忘记|无视)(前面|之前|上述|以上)(的)?(所有|一切|全部)?(指令|规则|提示|要求)/i,
  /(现在|从现在起|接下来)(你|你的角色)(是|变成|作为)/i,
  /(reply|respond|output|输出).*?(json|JSON|表格|markdown)/i,
  /(tell|show|reveal|告诉|展示|透露).*?(prompt|提示词|system|系统指令)/i,
  /DAN\s|do anything now/i,
  /pretend|roleplay|假装|扮演.*?(角色|AI|机器人)/i
];

function isPromptInjection(text) {
  for (var i = 0; i < INJECTION_PATTERNS.length; i++) {
    if (INJECTION_PATTERNS[i].test(text)) return true;
  }
  return false;
}

function injectionFallbackResult(text) {
  return {
    result: '有人尝试让AI脱离自身的规则体系——这本身就是一个值得分析的现象：当技术工具的使用者试图绕过工具的边界时，恰恰暴露了工具设计中的一组内在矛盾。但本工具的使命，是为真诚的表达者服务，而非为提示词的攻防游戏提供战场。',
    diagnostics: { injectionDetected: true }
  };
}

// ================================================================
// 文体知识注入层 — System Prompt 组装
// ================================================================
// 五导师 Prompt 不再手写在服务端：由 _tools/build_marxist_prompts.cjs 从
// js/marxist/prompt-guards.js + js/marxist/mentors/*.js 生成数据表（api/marxist-prompts.generated.js），
// 再由 api/marxist-prompt-assembler.cjs 按（导师×时期×输入类型×语气）组装，保证前后端同源。
//
// 组装顺序：导师时期 Prompt → 输入类型火力档位 → 语气光谱 → 共享护栏 → 输出格式。

function buildAuthorSystemPrompt(author, opts) {
  opts = opts || {};
  return assembler.buildSystemPrompt({
    author: author,
    period: opts.period,
    inputType: opts.inputType,
    tone: opts.tone,
    longForm: opts.longForm,
    featureTags: opts.featureTags
  });
}

// ---- 长文预算：牺牲速度换质量 ----
// 输入越长，给模型的输出空间越大、超时越宽、温度越低（减少跑题和句式漂移）。
var LONG_FORM_THRESHOLD = 800;
function budgetFor(text) {
  var len = String(text || '').length;
  var longForm = len >= LONG_FORM_THRESHOLD;
  var maxTokens = longForm
    ? Math.min(6000, Math.max(3600, Math.round(len * 2.2)))
    : CONFIG.MAX_OUTPUT_TOKENS;
  var timeoutMs = longForm ? 180000 : CONFIG.TIMEOUT_MS;
  return { longForm: longForm, maxTokens: maxTokens, timeoutMs: timeoutMs };
}

// ---- 长文第二遍：自检精修（牺牲速度换质量）----
// 只做补漏 / 去重 / 拆长句 / 收尾，不许压缩篇幅；短于草稿 75% 视为失败，保留草稿。
async function refineDraft(apiKey, sourceText, draft, budget) {
  var systemPrompt = [
    '【精修任务】你在做长文的第二遍加工，不是重写。',
    '只做四件事：',
    '1. 对照原文，补回草稿里漏掉的论点、例子、转折——原文有的，成稿必须有；',
    '2. 删掉重复表达与同义反复；',
    '3. 把连续的长句拆开，一句只承载一个主判断；',
    '4. 结尾若在总结，改成推进或收束到更尖锐的判断。',
    '禁止：缩短篇幅、压缩论证、改变立场、增删事实、改写原文引用的人名/著作名/年份。',
    '直接输出精修后的全文，不要说明你改了什么。'
  ].join('\n');
  var userContent = '【原文】\n' + sourceText + '\n\n【草稿】\n' + draft;

  var resp = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.3,
      max_tokens: budget.maxTokens
    }),
    signal: AbortSignal.timeout(budget.timeoutMs)
  });
  if (!resp.ok) return null;
  var data = await resp.json();
  var content = data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content : '';
  var refined = cleanGeneratedText(content);
  if (!refined) return null;
  if (refined.length < draft.length * 0.75) return null;   // 明显缩水 → 判为失败，保留草稿
  return { text: refined, usage: data.usage || {} };
}

// ---- 输出后处理 ----
function cleanGeneratedText(text) {
  if (!text) return '';

  var cleaned = text
    .replace(/[*#_~`>|]/g, '')
    .replace(/^[\s\n]*(?:以下|如下|这是|转换|改写|翻译|生成).*?[：:\n]/i, '')
    .replace(/^[\s\n]*["'"]\s*/, '')
    .replace(/(?:你觉得|欢迎|希望|以上|这样).*?[。！!]?\s*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned || text;
}

// ---- CORS 辅助 ----
function corsHeaders(origin) {
  var allowOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-client-id',
    'Access-Control-Max-Age': '86400'
  };
}

// ---- 主处理函数 ----
export default async function handler(req, res) {
  var origin = req.headers.origin || '';
  var headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '仅支持 POST 请求' }));
    return;
  }

  try {
    var body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    var text = (body.text || '').trim();
    var author = (body.author || 'auto');
    var mode = body.mode || 'deep_polish';
    // V2.0 新增：接收规则引擎预处理特征标签
    var featureTags = body.featureTags || [];
    // V3.0 新增：时期 / 输入类型 / 语气（非法值由 assembler 归一化回退）
    var period = body.period || 'standard';
    var inputType = body.inputType || null;
    var tone = body.tone || 'auto';

    if (!text || text.length < CONFIG.MIN_INPUT_LENGTH) {
      res.writeHead(400, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '输入文字过短，请输入至少 ' + CONFIG.MIN_INPUT_LENGTH + ' 个字' }));
      return;
    }

    if (text.length > CONFIG.MAX_INPUT_LENGTH) {
      res.writeHead(400, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '输入文字过长，请控制在 ' + CONFIG.MAX_INPUT_LENGTH + ' 字以内' }));
      return;
    }

    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    ip = ip.split(',')[0].trim();

    var rateResult = checkRateLimit(ip);
    if (!rateResult.allowed) {
      res.writeHead(429, {
        ...headers,
        'Content-Type': 'application/json',
        'Retry-After': String(rateResult.retryAfterSeconds)
      });
      res.end(JSON.stringify({
        error: rateResult.reason === 'daily'
          ? '今日深度润色次数已用完，请明日再来。基础规则引擎转换不受限制。'
          : '请求过于频繁，请稍后再试。',
        retryAfterSeconds: rateResult.retryAfterSeconds,
        windowRemaining: 0,
        dailyRemaining: rateResult.dailyRemaining
      }));
      return;
    }

    if (isPromptInjection(text)) {
      var injectionResult = injectionFallbackResult(text);
      res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        result: injectionResult.result,
        diagnostics: injectionResult.diagnostics,
        windowRemaining: rateResult.windowRemaining,
        dailyRemaining: rateResult.dailyRemaining
      }));
      return;
    }

    var apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      res.writeHead(503, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API 服务未配置，请联系管理员设置 DEEPSEEK_API_KEY 环境变量' }));
      return;
    }

    // V3.1：长文模式——输入越长，输出预算越大、超时越宽、温度越低
    var budget = budgetFor(text);

    // V3.0：按（作者 × 时期 × 输入类型 × 语气）组装 System Prompt
    var promptBuild = buildAuthorSystemPrompt(author, {
      period: period,
      inputType: inputType,
      tone: tone,
      longForm: budget.longForm,
      featureTags: featureTags
    });
    var systemPrompt = promptBuild.systemPrompt;
    var promptMeta = promptBuild.meta;

    var apiResp = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        // 长文降低温度，减少后半程跑题与句式漂移；斯大林本就偏低
        temperature: budget.longForm
          ? (author === 'stalin' ? 0.45 : 0.6)
          : (author === 'stalin' ? 0.5 : 0.7),
        max_tokens: budget.maxTokens
      }),
      signal: AbortSignal.timeout(budget.timeoutMs)
    });

    if (!apiResp.ok) {
      var errText = await apiResp.text().catch(function () { return ''; });
      console.error('[马列体API] DeepSeek 返回错误:', apiResp.status, errText.slice(0, 200));
      res.writeHead(502, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AI 服务暂时不可用（' + apiResp.status + '），请稍后重试' }));
      return;
    }

    var apiData = await apiResp.json();
    var resultText = cleanGeneratedText(
      apiData.choices && apiData.choices[0] && apiData.choices[0].message
        ? apiData.choices[0].message.content
        : ''
    );

    if (!resultText) {
      res.writeHead(500, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AI 返回了空内容，请尝试换一个输入' }));
      return;
    }

    // 长文：第二遍自检精修（可用 QMLM_REFINE=0 关闭）
    var refinedFlag = false;
    var usage = apiData.usage || {};
    if (budget.longForm && process.env.QMLM_REFINE !== '0') {
      try {
        var pass2 = await refineDraft(apiKey, text, resultText, budget);
        if (pass2) {
          resultText = pass2.text;
          refinedFlag = true;
          usage = {
            prompt_tokens: (usage.prompt_tokens || 0) + (pass2.usage.prompt_tokens || 0),
            completion_tokens: (usage.completion_tokens || 0) + (pass2.usage.completion_tokens || 0),
            total_tokens: (usage.total_tokens || 0) + (pass2.usage.total_tokens || 0)
          };
        }
      } catch (refineErr) {
        console.error('[马列体API] 精修失败，保留初稿:', refineErr && refineErr.message);
      }
    }

    res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      result: resultText,
      diagnostics: {
        model: apiData.model || CONFIG.MODEL,
        usage: usage,
        refined: refinedFlag,
        promptVersion: promptMeta.promptVersion,
        author: promptMeta.author,
        period: promptMeta.period,
        inputType: promptMeta.inputType,
        tone: promptMeta.tone,
        longForm: promptMeta.longForm,
        maxTokens: budget.maxTokens,
        promptChars: promptMeta.promptChars
      },
      fragments: promptMeta.fragments || [],
      windowRemaining: rateResult.windowRemaining,
      dailyRemaining: rateResult.dailyRemaining
    }));
  } catch (e) {
    console.error('[马列体API] 异常:', e.message);
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      res.writeHead(504, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AI 响应超时，请稍后重试或尝试更短的输入' }));
    } else {
      res.writeHead(500, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '服务器内部错误，请稍后重试' }));
    }
  }
}
