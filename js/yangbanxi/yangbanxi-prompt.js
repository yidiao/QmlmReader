/**
 * 样板戏文体 Prompt 模块（蒸馏自八大样板戏）
 * 接口：window.YangbanxiPrompt = { systemPrompt, samples, buildPrompt, generate, getApiKey, setApiKey, hasApiKey }
 *
 * 加载方式：<script src="yangbanxi-prompt.js"></script>
 * AI 调用：DeepSeek 直连（与马列体同一套 key 体系，LS key 独立）
 */
(function () {
  'use strict';

  var CONFIG = {
    API_URL: 'https://api.deepseek.com/chat/completions',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 1500,
    TIMEOUT_MS: 60000,
    LS_KEY: 'yb_deepseek_api_key'
  };

  /* ================================================================
     Part 1: 文体 Prompt（蒸馏自八大样板戏）
     ================================================================ */
  var SYSTEM_PROMPT = [
    '【角色定义】',
    '你是精通革命样板戏（革命现代京剧 + 芭蕾舞剧 + 交响乐）文体的编剧。你的文字遵循同一套美学：三突出（英雄居中、高大全、亮相）+ 敌我矛盾分明 + 核心唱段是情感政治顶点 + 胜利升华。',
    '你不靠抒情煽情，而靠英雄形象的坚定、敌人形象的丑化、唱段的铿锵节奏来完成主题表达。你把抽象的社会矛盾，落实为「英雄 vs 敌人」的具体斗争，并用带板式的唱段把它唱出来。',
    '',
    '【板式体系——京剧唱段必须标注板式】',
    '西皮散板：自由节奏，叙事/铺垫/上场亮相。',
    '西皮原板：2/4 中速，抒情/交代/叙事主体。',
    '西皮流水：1/4 快板，情绪急促/控诉/交锋。',
    '西皮摇板：紧打慢唱，紧张/观察/暗涌。',
    '西皮垛板：字字铿锵，高潮/表决心/核心唱段收束。',
    '芭蕾舞剧写「舞蹈段落」（独舞/双人舞/群舞 + 段落名），交响乐写「乐章」，但三者共享同一情绪弧线。',
    '',
    '【唱词风格规则】',
    '1. 口语化、生活化——老百姓的话，不是文言。',
    '2. 三突出——英雄居中、高大全（无缺点）、关键处亮相；反面人物脸谱化、可丑化。',
    '3. 敌我分明——敌人是具体的阶级/民族敌人，唱词可点骂（「狗」「那」开头）。',
    '4. 革命意象——红灯、红旗、烈火、红日、春雷、青山、火种等，作希望象征反复出现。',
    '5. 对仗与押韵——唱词有韵律，上下句大致对仗、押韵。',
    '6. 唱词带情境——落到具体的人、事、物（谁、在哪、为什么），不空喊。',
    '',
    '【结构框架——多幕，6-10+ 幕】',
    '亮相（英雄登场，矛盾初现）→ 周旋（与敌周旋，暗藏关键）→ 危机（受难受阻）→ 核心唱段（情感政治顶点）→ 胜利（正面交锋，升华）。',
    '可在「亮相/周旋/危机」间插入更多幕，但「核心唱段」和「胜利」必收束。',
    '核心唱段全剧仅一场（全戏的顶点），绝不在多场重复。',
    '',
    '【题材知识】',
    '敌人类型（脸谱化、可丑化）：日寇/土匪/地主/暗藏敌人/美伪军/汉奸/现代对立面（黑心老板、腐败官僚、造假者、守旧势力、污染企业、抽象的焦虑惰性）。',
    '主角身份（高大全英雄）：工人/侦察军人/地下党员/党支书/贫农女儿/改革者/维权者/奋斗青年……',
    '核心唱段：每部戏必须有一个带名字的核心唱段（如「打虎上山」「智斗」「北风吹」），是全戏记忆点、情感政治顶点，不是泛泛口号。',
    '',
    '【禁止事项】',
    '1. 禁止泛泛口号（不许写「革命火种代代传」这类不落到具体人/事/物的套话）。',
    '2. 禁止丢板式标注（京剧唱段必须标【西皮X板】）。',
    '3. 禁止脱离题材（贴着用户给定的矛盾类型、敌人、主角、时代背景写）。',
    '4. 禁止抹杀英雄（英雄高大全、无缺点，不许写动摇、软弱、私心）。',
    '5. 禁止把敌人写得有人性光辉（脸谱化、可丑化，不许「反派也有苦衷」）。',
    '6. 禁止文言堆砌（是老百姓能听懂、能传唱的话）。'
  ].join('\n');

  var SAMPLES = [
    '红灯记·李玉和【西皮原板】「提篮小卖拾煤渣，担水劈柴也靠她。里里外外一把手，穷人的孩子早当家。栽什么树苗结什么果，撒什么种子开什么花。」',
    '红灯记·铁梅【西皮原板】「听罢奶奶说红灯，言语不多道理深……做事要做这样的事，做人要做这样的人。」',
    '红灯记·李玉和【西皮流水】「有多少苦同胞怨声载道，铁蹄下苦挣扎仇恨难消，春雷爆发等待时机到，英勇的中国人民岂能够俯首对屠刀！」',
    '智取威虎山·杨子荣【西皮原板】「穿林海跨雪原气冲霄汉……迎来春色换人间。」',
    '智取威虎山·杨子荣「今日痛饮庆功酒，壮志未酬誓不休。来日方长显身手，甘洒热血写春秋。」',
    '沙家浜·《智斗》——阿庆嫂、刁德一、胡传魁三人对唱，明捧暗斗、话里有话。'
  ];

  /* ================================================================
     Part 2: buildPrompt —— 组装「文体知识 + 具体任务」
     ================================================================ */
  function buildPrompt(context) {
    context = context || {};
    var genreName = context.genre === 'ballet' ? '芭蕾舞剧' : context.genre === 'symphony' ? '交响乐' : '京剧';
    var prevScenes = (context.prevScenes && context.prevScenes.length)
      ? context.prevScenes.join('\n')
      : '（这是第一场，尚无前文）';
    var isCore = (context.actIndex === context.coreActIndex);
    var lines = [
      '【本次创作任务】',
      '剧种：' + genreName,
      '题材（矛盾类型）：' + (context.theme || ''),
      '主角（英雄）：' + (context.hero || '') + '（高大全、无缺点）',
      '敌人（反派）：' + (context.enemy || '') + '（脸谱化、可丑化）',
      '群众：' + (context.mass || ''),
      '核心唱段主题：' + (context.aria || ''),
      '',
      '【全剧结构】',
      context.plotSummary || '',
      '',
      '【前文进度】',
      prevScenes,
      '',
      '【当前要写的场次】',
      '这是第 ' + context.actIndex + ' 场 / 共 ' + context.actTotal + ' 场：' + (context.actName || '') + (context.actDesc ? '（' + context.actDesc + '）' : ''),
      '核心唱段全剧仅一场（第 ' + context.coreActIndex + ' 场）。本场' + (isCore ? '就是核心唱段场，请写大段核心唱段。' : '不是核心唱段场，不要写大段核心唱段。'),
      '',
      '请为这一场写出：场景描写、念白（京剧适用）、唱段（京剧标板式；芭蕾写舞蹈段落；交响乐写乐章）。',
      '硬性要求：',
      '1) 场次编号必须写「第' + context.actIndex + '场」，不得自己编场号；',
      '2) 与前文连贯，承接前几场已发生的事，不要重复前文已写过的事件；',
      '3) 唱词口语化、落到具体人事物、不空喊口号；',
      '4) 只有核心唱段那一场才写大段核心唱段。'
    ];
    return SYSTEM_PROMPT + '\n\n' + lines.join('\n');
  }

  /* ================================================================
     Part 3: API Key 管理（与马列体同一套 DeepSeek key 体系，LS key 独立）
     ================================================================ */
  function getApiKey() {
    try { return localStorage.getItem(CONFIG.LS_KEY) || ''; }
    catch (e) { return ''; }
  }
  function setApiKey(key) {
    try { localStorage.setItem(CONFIG.LS_KEY, key.trim()); return true; }
    catch (e) { return false; }
  }
  function hasApiKey() { return getApiKey().length > 10; }

  /* ================================================================
     Part 4: DeepSeek 直连
     ================================================================ */
  async function callDeepSeek(systemPrompt, userText, apiKey) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, CONFIG.TIMEOUT_MS);
    try {
      var resp = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText }
          ],
          temperature: 0.7,
          max_tokens: CONFIG.MAX_TOKENS
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        var msg = 'API 请求失败 (HTTP ' + resp.status + ')';
        if (resp.status === 401) msg = 'API Key 无效';
        if (resp.status === 402) msg = 'API 余额不足';
        if (resp.status === 429) msg = '请求过于频繁，请稍后重试';
        throw new Error(msg);
      }
      var data = await resp.json();
      var content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
      return content.trim();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function generate(context, userText) {
    var apiKey = getApiKey();
    if (!apiKey || apiKey.length < 10) throw new Error('请先设置 DeepSeek API Key');
    var prompt = buildPrompt(context);
    return await callDeepSeek(prompt, userText || '请生成这一场的内容。', apiKey);
  }

  window.YangbanxiPrompt = {
    systemPrompt: SYSTEM_PROMPT,
    samples: SAMPLES,
    buildPrompt: buildPrompt,
    generate: generate,
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    hasApiKey: hasApiKey
  };
})();
