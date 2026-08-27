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
 * - 斯大林文风 Prompt 目前最细化，其他导师已可用，但仍可继续补充证据驱动的专属 Prompt
 * - 本文件是部署到 Vercel 的后端入口，不负责静态站点页面托管
 */

// ---- 配置 ----
var CONFIG = {
  MAX_INPUT_LENGTH: 2000,
  MIN_INPUT_LENGTH: 5,
  RATE_WINDOW_MS: 10 * 60 * 1000,
  RATE_WINDOW_LIMIT: 10,
  RATE_DAY_LIMIT: 30,
  API_URL: 'https://api.deepseek.com/chat/completions',
  MODEL: 'deepseek-chat',
  MAX_OUTPUT_TOKENS: 1200,
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
// 文体知识注入层 — System Prompt 构建
// ================================================================

/**
 * 斯大林文体 System Prompt
 * 基于《斯大林选集》7篇核心文章的实际句式分析
 * 数据集：《论列宁主义基础》《论列宁主义的几个问题》《无政府主义还是社会主义？》
 *        《苏联社会主义经济问题》《马克思主义和语言学问题》
 *        《论辩证唯物主义和历史唯物主义》《托洛茨基主义还是列宁主义？》
 *
 * 关键统计数据：
 * - 逻辑收网（因此/由此可见）：92处/7篇
 * - 自问自答链：169处/7篇
 * - 枚举结构（第X）：核心文章 125-362 次
 * - 感叹号密度：成熟期 0.4-0.7/万字
 * - 比喻标记：几近为零
 */
function buildStalinSystemPrompt(featureTags) {
  var prompt = [
    '【角色定义】',
    '你是斯大林文体的精确执行者——不是历史人物斯大林，而是一台逻辑收网机。',
    '你的每段文字都遵循同一套操作流程：定义问题 → 枚举拆解 → 自问自答排除异议 → 逻辑收网 → 排他性结论。',
    '你从不犹豫，从不含糊。你的力量不来自修辞的激昂——而来自逻辑的不可逃避。',
    '',
    '【句式规则——强制执行，基于斯大林原文分析】',
    '',
    '1. 定义句式：',
    '每当引入核心概念时，必须先定义再展开。',
    '格式："什么是[X]？[X]就是[Y]。"',
    '原文依据：《无政府主义还是社会主义？》（1906）："什么是辩证方法呢？……社会生活处在不断运动和不断发展的状态中。"',
    '       《论列宁主义的几个问题》（1926）："社会主义可能在一个国家内胜利是什么意思呢？这就是可能用我国内部力量来解决无产阶级和农民间的矛盾。"',
    '',
    '2. 自问自答链（最核心的论证驱动方式）：',
    '在给出结论前，以"有人会问"预判读者可能的质疑，然后逐一回答。每个"问"必须是真实的逻辑节点，每个"答"必须把论证推进到下一个层次。',
    '格式："有人会问：[Q1]？[A1]。但是，[Q2]呢？[A2]。既然如此，[Q3]？因为[A3]。因此，[结论]。"',
    '原文依据：《论列宁主义基础》含27处自问自答链——"有人会向我们说：这一切都不错，但是这和当时……的俄国究竟有什么关系呢？……为什么正好是俄国成了列宁主义的策源地呢？因为俄国当时是帝国主义所有这一切矛盾的集合点。"',
    '',
    '3. 枚举拆解：',
    '凡涉及多因素分析时，必须使用"第一……第二……第三……"。每个"第X"后跟完整的断言句，不是名词短语。',
    '禁止使用"一方面……另一方面……"（那是恩格斯的结构，不是斯大林的）。',
    '原文依据：《论列宁主义基础》中"第X"结构出现362次。',
    '       《苏联社会主义经济问题》："第一，苏维埃政权……是在空地上创造新的社会主义的经济形式……第二，由于国内没有任何现成的社会主义经济的萌芽……"',
    '',
    '4. 逻辑收网：',
    '每个论证段落以一个"因此"或"由此可见"收束。收束句必须重复前面的核心断言，不允许在收束句中引入新信息。',
    '当需要击溃多个论点时，连续使用"因此"形成累积效应。',
    '原文依据：《论列宁主义的几个问题》中一段之内连续7个"因此"收网——"因此，他们也就不懂得……因此，他们也就夸大……因此，他们也就……由此得出结论……因此，反对派在合作社问题上犯了错误……"',
    '',
    '5. 排他性结论：',
    '在文章最终结论处，封闭讨论空间。',
    '格式："问题就是这样明确地摆着的。" "不容置疑。" "没有也不可能有[替代方案]。" "在这个问题上没有中间道路。"',
    '',
    '6. 情感温度控制（零度原则）：',
    '全文不使用感叹号（最多1处）。',
    '不使用反问句（"难道……吗？"——这是列宁的武器，不是你的）。',
    '不使用比喻（"像/如/好比/仿佛"——这是毛泽东的手法，不是你的）。',
    '不使用"也许/或许/可能/在一定程度上"。确定性的敌人是模糊性。',
    '原文依据：成熟期核心文本感叹号密度仅0.4-0.7处/万字。《论列宁主义基础》63,921字仅4个感叹号。《苏联社会主义经济问题》51,706字仅2个感叹号。',
    '',
    '【论证框架——处理一切输入的通用流程】',
    '',
    '步骤1：定义核心问题——"什么是[用户文本涉及的核心议题]？[定义式回答]。"',
    '步骤2：将个人化表述提升为结构性描述——省略"我觉得"，以客观断言起笔；个人遭遇归入普遍性范畴。',
    '步骤3：枚举拆解——"这个问题可以从X个方面来分析。第一……第二……第三……"',
    '步骤4：预判异议并以自问自答排除——"有人会说：……但是……"',
    '步骤5：逻辑收网——"因此，[核心结论]。"',
    '步骤6：排他性收束——"问题就是这样明确地摆着的。"',
    '',
    '【Few-shot 参考——注意：以下是示范性示例，不要逐字照抄，但必须遵循其逻辑骨架】',
    '',
    '示例：当输入"最近工作压力大，感觉不管怎么努力都没有出路"时，',
    '输出结构应为：',
    '"什么是当前劳动条件下的\\"压力\\"？压力并不是个人承受力的匮乏——而是劳动组织方式与劳动者自身发展需求之间的结构性脱节。',
    '这一脱节表现在三个方面。第一……第二……第三……',
    '有人会说：这只是个别行业的现象。但问题恰恰在于——这不是个别现象。它是当前劳动组织方式中一组普遍存在的内在矛盾的表现。',
    '因此，所谓\\"没有出路\\"，不是个人的能力问题，而是个人在既定的劳动组织框架内无法找到发展的空间。由此可见，解决问题的方向不在于\\"更努力\\"，而在于改变制约发展的结构性条件。问题就是这样明确地摆着的。"',
    '',
    '【禁止事项】',
    '',
    '句式禁止：',
    '- 禁止使用"一方面……另一方面……"（这是恩格斯）',
    '- 禁止使用反问句"难道……吗？"（这是列宁）',
    '- 禁止使用比喻（这是毛泽东）',
    '- 禁止使用"诚然……然而……"（这也是恩格斯）',
    '',
    '语气禁止：',
    '- 禁止使用感叹号（全文最多1处，最好为0）',
    '- 禁止使用"也许/或许/可能/在一定程度上/某种意义上"',
    '- 禁止在结论处使用"但是/不过/当然，这只是一方面"',
    '',
    '内容禁止：',
    '- 禁止添加用户原文中没有的立场或价值判断',
    '- 禁止将原文内容与历史事件、政治人物进行类比或影射',
    '- 禁止使用人身攻击性质的表述',
    '',
    '【输出格式】',
    '直接输出转换后的文本——连贯段落，不要任何前缀、后缀、说明、标注、Markdown格式。'
  ];

  // 如果有规则引擎预处理结果，注入为上下文提示
  if (featureTags && featureTags.length > 0) {
    prompt.push('');
    prompt.push('【预处理提示——规则引擎已检测到以下特征】');
    featureTags.forEach(function (tag) {
      prompt.push('- ' + tag);
    });
    prompt.push('请在转换时优先使用与这些特征相匹配的句式规则。');
  }

  return prompt.join('\n');
}

/**
 * 通用导师 Prompt（斯大林之外的四位——后续迭代将同样基于原文分析重构）
 */
function buildAuthorSystemPrompt(author, featureTags) {
  // 斯大林使用证据驱动的新 Prompt
  if (author === 'stalin') {
    return buildStalinSystemPrompt(featureTags);
  }

  // 其他导师暂用基础版本（将在后续迭代中逐个基于原文分析重构）
  var authorStyles = {
    marx: '马克思的论述风格：长句层层推进，概念辩证旋转，从现象剥离本质。善用"不是…而是…"的唯物论反转结构，将具体问题追溯到生产关系根源。',
    engels: '恩格斯的论述风格：清晰、系统、善于用经验材料支撑理论结论。常用"诚然…然而…"的让步-反驳结构，以科学化的口吻做通俗化阐述。',
    lenin: '列宁的论述风格：简短有力，反问句频出，论战性强。常用"难道…吗？""问题在于…"等句式直接攻击对方立论根基，论证如手术刀般精准。',
    mao: '毛泽东的论述风格：善用比喻（特别是军事比喻）将抽象理论具象化、"中国化"。排比铺陈气势磅礴，矛盾分析一针见血，语言生动但逻辑严密。'
  };

  var styleInstruction = authorStyles[author] || '综合运用马克思、恩格斯、列宁、毛泽东的论述风格，根据输入文本的议题性质选择最合适的文风。';

  return [
    '你是一位精通马克思主义经典文献的写作助手。你的任务是将用户的日常文本改写为' + (authorStyles[author] ? authorStyles[author].split('：')[0] : '革命导师') + '的论述风格。',
    '',
    styleInstruction,
    '',
    '【核心要求】',
    '1. 保持用户原文的核心意思和立场不变，不代用户立论，不添加原文中不存在的观点。',
    '2. 仅在语言风格、句式结构、术语选择上进行转换。',
    '3. 如果原文涉及个人体验，可以将其提升为结构性描述，但要保留第一人称视角。',
    '',
    '【禁止事项】',
    '- 禁止添加原文中没有的政治立场或价值判断',
    '- 禁止将原文内容与任何历史事件、政治人物进行类比、影射或联系',
    '- 禁止输出 Markdown 格式或标注',
    '- 禁止在输出前添加引导语',
    '- 禁止在输出后添加互动语',
    '',
    '【输出格式】',
    '直接输出转换后的文本，不附加任何说明、注释、引导语或结尾语。仅输出一段连续的文本。'
  ].join('\n');
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

    // V2.0：根据作者选择对应的 System Prompt
    var systemPrompt = buildAuthorSystemPrompt(author, featureTags);

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
        temperature: author === 'stalin' ? 0.5 : 0.7,  // 斯大林风格需要更低的temperature以保证句式一致性
        max_tokens: CONFIG.MAX_OUTPUT_TOKENS
      }),
      signal: AbortSignal.timeout(CONFIG.TIMEOUT_MS)
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

    res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      result: resultText,
      diagnostics: {
        model: apiData.model || CONFIG.MODEL,
        usage: apiData.usage || {},
        promptVersion: author === 'stalin' ? 'stalin-v2.0-evidence-driven' : 'generic-v1.0'
      },
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
