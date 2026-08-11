/**
 * 马列体生成器 — AI 深度修习模块 V3.2（父文件）
 *
 * 职责：API调用、分类器、Key管理、导师调度
 * 导师专属内容在 mentors/ 子文件中：
 *   mentors/stalin.js → window.StalinMentor
 *   mentors/lenin.js   → window.LeninMentor（待构建）
 *   mentors/marx.js    → window.MarxMentor（待构建）
 *   mentors/engels.js  → window.EngelsMentor（待构建）
 *   mentors/mao.js     → window.MaoMentor（待构建）
 *
 * 子文件接口规范：{ periods, fragments, buildPrompt(text, period, fragments), pickFragments(period, n) }
 */
(function () {
  'use strict';

  var CONFIG = {
    API_URL: 'https://api.deepseek.com/chat/completions',
    MODEL: 'deepseek-chat',
    MAX_TOKENS: 2000,
    TIMEOUT_MS: 60000,
    LS_KEY: 'ms_deepseek_api_key'
  };

  /* ================================================================
     Part 1: 导师注册表
     ================================================================ */
  var MENTOR_REGISTRY = {
    stalin: { module: null, key: 'StalinMentor', label: '斯大林', hasChild: true },
    lenin:  { module: null, key: 'LeninMentor',  label: '列宁',   hasChild: true },
    marx:   { module: null, key: 'MarxMentor',   label: '马克思', hasChild: true },
    engels: { module: null, key: 'EngelsMentor', label: '恩格斯', hasChild: true },
    mao:    { module: null, key: 'MaoMentor',    label: '毛泽东', hasChild: true }
  };

  function initRegistry() {
    var REQUIRED_KEYS = ['periods', 'fragments', 'buildPrompt', 'pickFragments'];
    Object.keys(MENTOR_REGISTRY).forEach(function (id) {
      var entry = MENTOR_REGISTRY[id];
      if (window[entry.key]) {
        var mod = window[entry.key];
        var missing = REQUIRED_KEYS.filter(function (k) { return !mod[k]; });
        if (missing.length > 0) {
          console.warn('[AI调度] ' + entry.key + ' 缺少接口: ' + missing.join(', ') + ' —— 降级为临时Prompt');
          return;
        }
        entry.module = mod;
        entry.hasChild = true;
        console.log('[AI调度] 已加载子模块: ' + entry.key);
      } else if (entry.hasChild) {
        console.warn('[AI调度] 子模块 ' + entry.key + ' 标记为 hasChild 但未找到脚本引用——请检查 HTML 中的 <script> 标签');
      }
    });
  }

  /* ================================================================
     Part 2: Few-shot 示例库（4种输入类型，通用，与导师无关）
     ================================================================ */
  var FEWSHOT_LIBRARY = {
    factual: {
      label: '事实陈述',
      keywords: ['斯大林', '毛泽东', '列宁', '马克思', '革命', '战争', '苏联', '中国',
                 '历史', '事件', '战役', '运动', '清洗', '改革', '建设', '牺牲',
                 '去世', '上任', '当选', '发动', '推翻', '政权', '子女', '家庭'],
      example: [
        '【Few-shot 示例：事实陈述型——拆解与重组】',
        '用户输入：',
        '"斯大林的小儿子瓦西里被过分压制，官至空军中将却无法保卫父亲，赫鲁晓夫全面否定斯大林后只能借酒消愁；大儿子雅科夫战死卫国战争中，其余子女默默无闻过完一生。"',
        '',
        '拆解 → 核心主张（你脑中做的事，不输出）：',
        '主张1：斯大林对子女施加了系统性压制 · 主张2：压制与子女才能无关 · 主张3：结果是晚景孤立',
        '',
        '重组输出：',
        '"革命者对其子女的态度，不是个人情感的选择——而是体制原则的必然延伸。瓦西里·斯大林官至空军中将，这一事实本身已经表明：压制不等于否定才能。压制意味着：即使具备才能，也不能凭借血缘获得权力的入场券。雅科夫战死于前线，其余子女归于无名——这不是家庭的悲剧，而是原则贯彻到底的自然结果。革命者老了，身边没有人。这不是偶然的疏忽——这是反对世袭必须支付的代价。问题就是这样明确地摆着的。"',
        '',
        '注意：原文"借酒消愁"→丢弃（非核心主张）。原文"过分压制"→用"体制原则的必然延伸"重新表达。原文"默默无闻"→用"归于无名"重新表达。'
      ].join('\n')
    },
    personal: {
      label: '个人感受',
      keywords: ['压力', '焦虑', '迷茫', '累', '没有出路', '没希望', '绝望', '无助',
                 '难过', '痛苦', '孤独', '不开心', '烦', '崩溃', '卷', '躺平',
                 '加班', '工资', '房租', '买不起', '养不起', '内耗', '感觉', '觉得'],
      example: [
        '【Few-shot 示例：个人感受型——拆解与重组】',
        '用户输入：',
        '"最近工作压力很大，加班越来越多但工资不涨，感觉不管怎么努力都没有出路。"',
        '',
        '拆解 → 核心主张：',
        '主张1：劳动强度在增加 · 主张2：劳动报酬没有相应增长 · 主张3：劳动者感到发展空间被压缩',
        '',
        '重组输出：',
        '"什么是当前劳动条件下的"压力"？压力并不是个人承受力的匮乏——而是劳动强度与劳动报酬之间日益扩大的缺口在个体身上的显现。这一缺口表现在两个方面。第一，劳动时间的延长与劳动报酬的停滞同时发生。第二，劳动成果的分配越来越脱离劳动者的控制。因此，所谓"没有出路"，不是个人的能力问题，而是个人在既定的劳动组织框架内找不到发展的空间。问题就是这样明确地摆着的。"',
        '',
        '注意：原文"感觉"→省略主体感受词，以客观断言起笔。原文"加班、工资"→提升为"劳动时间、劳动报酬"。'
      ].join('\n')
    },
    opinion: {
      label: '观点论证',
      keywords: ['认为', '觉得', '应该', '不对', '错误', '有人', '网上', '舆论',
                 '讨论', '争论', '问题在于', '关键', '本质', '原因', '导致',
                 '现象', '趋势', '变化', '越来越', '为什么', '怎么办'],
      example: [
        '【Few-shot 示例：观点论证型——拆解与重组】',
        '用户输入：',
        '"网上的人都在吵架，情绪取代了理性，没有人认真讨论问题。"',
        '',
        '拆解 → 核心主张：',
        '主张1：公共讨论空间以情绪化表达为主导 · 主张2：理性讨论被边缘化',
        '',
        '重组输出：',
        '"什么是理性讨论？理性讨论就是各方以事实为依据、以逻辑为工具，就分歧点展开可以验证的论证过程。当前公共言说空间的情况恰好相反：情绪取代了事实，立场取代了逻辑。为什么会这样？第一，信息传播的商业化使得"引发情绪反应"比"传递准确信息"更有利可图。第二，讨论平台的设计奖励极端化表达而非节制论证。因此，公共言说空间的碎片化不是偶然的混乱，而是特定信息组织方式下的必然产物。"',
        '',
        '注意：原文"人的问题"→用结构性因素重新解释同一现象。原文的立场被保留但被重新论证。'
      ].join('\n')
    },
    abstract: {
      label: '抽象思辨',
      keywords: ['什么是', '定义', '本质', '伦理', '道德', '美德', '正义', '公平',
                 '自由', '平等', '权利', '义务', '价值', '意义', '哲学', '原理',
                 '逻辑', '辩证法', '矛盾', '关系', '区别', '联系'],
      example: [
        '【Few-shot 示例：抽象思辨型——拆解与重组】',
        '用户输入：',
        '"什么是美德？有人认为美德是习惯，有人认为美德是选择。但我觉得美德是一种实践，在实践中习惯和选择是分不开的。"',
        '',
        '拆解 → 核心主张：',
        '主张1：美德不应还原为习惯或选择的二元对立 · 主张2：美德是实践 · 主张3：实践中习惯和选择不可分割',
        '',
        '重组输出：',
        '"什么是美德？将美德归结为习惯，或归结为选择——这两种回答都没有触及问题的实质。习惯论者把美德等同于反复训练的结果。选择论者把美德还原为意志的瞬间决断。二者的共同错误在于：把实践的一个环节当作了实践的全部。因此，美德只能在实践中获得完整的规定。在实践中，习惯为选择提供了稳定的方向，选择为习惯注入了自觉的内容。二者不是对立的两极，而是同一实践过程的两个环节。"',
        '',
        '注意：原文"分不开"→用"同一实践过程的两个环节"重述。论证从定义出发→指出两个错误答案→给出正确答案→收网。'
      ].join('\n')
    },
    casual: {
      label: '日常/轻量/玩梗',
      keywords: ['迟到', '下班', '周末', '放假', '天气', '下雨', '吃饭', '外卖',
                 '奶茶', '咖啡', '炸鸡', '肯德基', '麦当劳', '瑞幸', '拼多多',
                 '淘宝', '快递', '地铁', '公交', '堵车', '加班', '扣工资', '房租',
                 '困', '累', '困了', '累了', '心情', '难受', '哈哈哈', '笑死',
                 '绷不住', '绝了', '离谱', '无语', '破防', '甩锅', '摸鱼', '摆烂',
                 '躺平', '薅羊毛', '砍一刀', '发红包', '转我', '疯狂星期四', 'v我50'],
      example: [
        '【日常/轻量型文本 —— 处理方法，不是模板】',
        '',
        '处理此类文本时，你面对的是一个"梗"或一句日常碎碎念。你的任务是：用导师的思维方式和语言习惯，把这句话重新说一遍——不是把它变成政论文。',
        '',
        '思考步骤（不要机械执行，灵活运用）：',
        '',
        '第一步：识别意图。用户在干什么？——讨钱？约饭？吐槽？自嘲？分享心情？保持这个意图不变。用户说"转我50"，输出就必须是"转我50"或等价的表达。你不是在回帖——你是在帮他用另一种语气说同一句话。',
        '',
        '第二步：找到"社会性"那个点。日常文本里通常藏着一个可以轻轻戳一下的社会观察——疯狂星期四是商家制造的需求、拼多多的砍一刀是社交关系的资本化、加班吐槽背后是劳动时间的失控。找到它，但不展开。一句就够了。',
        '',
        '第三步：用导师的语言方式重构。列宁会剥壳——"所谓X，不过是Y"。斯大林会下定义——"什么是X？X就是Y"。毛泽东会用俗话——"老百姓有句话叫……"。马克思会上升——"这不是X，而是Y在Z条件下的表现"。选一个方向，一两句，收。',
        '',
        '第四步：回到原文。结尾不要替用户总结——让最后一句话落回他的社交意图。他想讨钱→结尾是"转我"。他想吐槽→结尾是那句吐槽本身。他想约饭→结尾是约。',
        '',
        '【绝对禁止】',
        '不要复制这个示例里的任何具体句子到输出中。每次输入都是全新的文本，你必须现场分析、现场生成。',
        '不要写"商家的算盘""群众的星期四""不属于资本只属于我们"——这些是示例专用的语句，换到另一篇输入时就会变成模板抄袭。',
        '不要让不同的日常输入产生相似的输出。如果用户说"下雨了没带伞"和用户说"肯德基疯狂星期四"，输出应该是完全不同的内容和结构。',
        '',
        '【Few-shot 演示 —— 注意这是演示方法，不是给你抄的】',
        '输入："今天地铁又故障了，迟到扣了五十块，这破班不上也罢。"',
        '',
        '思考过程：意图=吐槽+自嘲。社会性锚点=城市基础设施的可靠性把打工人的时间捏在手里。适合用列宁的剥壳——把"倒霉"重新描述为一种结构性的不自由。',
        '',
        '参考输出："地铁故障，扣五十块。问题不在于运气不好——问题在于，你的时间并不掌握在你手里。轨道一断，全勤就没。于是你坐在迟到的工位上想：这破班不上也罢。想归想，下周一还是得挤同一班地铁。"',
        '',
        '注意：这个参考输出把原文的吐槽保留了下来（"这破班不上也罢"），加了一句剥壳（"时间并不掌握在你手里"），然后落回日常（"下周一还是得挤同一班地铁"）。没有展开成檄文，没有人称转换，没有替用户总结。换一个输入时，输出结构会完全不同。'
      ].join('\n')
    }
  };

  /* ================================================================
     Part 3: 分类器
     ================================================================ */
  function classifyInput(text) {
    var scores = {};
    Object.keys(FEWSHOT_LIBRARY).forEach(function (type) {
      var kw = FEWSHOT_LIBRARY[type].keywords;
      var score = 0;
      kw.forEach(function (word) {
        if (text.indexOf(word) !== -1) score += 1;
        if (word.length >= 3 && text.indexOf(word) !== -1) score += 1;
      });
      scores[type] = score;
    });
    var best = 'casual', bestScore = 0;
    Object.keys(scores).forEach(function (type) {
      if (scores[type] > bestScore) { bestScore = scores[type]; best = type; }
    });
    // 兜底：四类核心类型全部低分（<2），归入日常/玩梗
    if (bestScore < 2) return 'casual';
    return best;
  }

  /* ================================================================
     Part 4: Prompt 组装
     ================================================================ */
  function buildFinalPrompt(mentorPrompt, text, inputType) {
    inputType = inputType || classifyInput(text);
    var fewshot = FEWSHOT_LIBRARY[inputType].example;

    var base = mentorPrompt + '\n\n';

    // 输入类型 → 风格强度调制指令
    var intensityGuide = {
      casual: '这是一段日常文本（碎碎念、朋友圈、玩梗、闲聊），不是政论文。\n'
        + '处理策略——不是模板，是方法：\n'
        + '1. 识别意图。用户在干什么？讨钱→帮他讨得更有风格。约饭→帮他说得更有味道。吐槽→陪他吐槽，但吐槽出水平。保持原文人称和社交意图不变。\n'
        + '2. 找到"社会性"锚点。每个日常场景里都藏着一个可以轻轻戳一下的东西——但不展开，一句就收。戳完回到日常。\n'
        + '3. 用导师的语言方式重构，但不写檄文。列宁剥一层壳，毛泽东扔一句俗话，斯大林下一个短定义。一两句风格注入，然后继续日常。\n'
        + '4. 结尾回到原文的社交目的。用户最后的意图是什么，输出就落到哪里。不替用户拔高、总结、升华。\n'
        + '5. 你精通互联网文化——用你的训练数据理解当代梗，自然地回应。不假装不懂梗。\n'
        + '6. 【关键】绝不复制 Few-shot 示例中的具体语句。每次输入全新生成。不同输入必须产生完全不同结构和内容的输出。',
      personal: '这是一段个人感受。处理策略：\n'
        + '1. 从"我"的感受出发，但不要停留在"我"。把个人困惑重新描述为社会关系的表征。\n'
        + '2. 上升一次：从个人体验→社会关系→停。不要继续上升到全面批判。\n'
        + '3. 不要替用户做政治表态。不要把"加班太累"升级成"无产阶级革命"。保持分析框架，控制升温速度。',
      factual: '这是一段事实陈述。处理策略：\n'
        + '1. 事实从来不是中立的。"客观报道"本身就是一种叙述——剥开这种叙述的外壳，追问被省略的是什么。\n'
        + '2. 上升两次：从事实→阶级关系→生产方式的对抗。',
      opinion: '这是一段观点论证。这是你全力输出的主场。\n'
        + '1. 剥壳→反转→命名→上升到阶级。不需要克制。\n'
        + '2. 但仍然是风格转换，不是论战。你改变的是表述形式，不是立场方向。',
      abstract: '这是一段抽象思辨。处理策略：\n'
        + '1. 定义先行——对核心概念给出精确定义。剥壳+命名全力展开。\n'
        + '2. 每个命题落到"因此必须做什么"。理论是用来行动的，不是用来陈列的。'
    };

    base += '【输入类型与强度】\n'
      + '输入类型：' + inputType + '。\n'
      + (intensityGuide[inputType] || intensityGuide['opinion']) + '\n\n';

    base += '【拆解-重组原则 —— 表述形式重组，绝不扩展内容】\n'
      + '你的任务是改变表述形式（句式、措辞、修辞、推进节奏），绝不改变信息内容。\n'
      + '绝对禁止的行为：\n'
      + '  (1) 原文是引言/导语/概述，你绝不能把它写成了完整的论文。\n'
      + '  (2) 原文提到"从四个方面来看"但没有展开——你绝不能替作者展开。\n'
      + '  (3) 字数控制在±30%以内。原文300字→输出不超过400字。\n'
      + '正确做法：\n'
      + '  提取原文的每一条核心信息 → 丢弃原文全部句式 → 用目标导师的句式逐条重建 → 保持相同的详略分布。\n'
      + '禁止保留原文中任何长度超过8个字的连续片段。\n'
      + '\n';

    base += '【通用禁止事项】\n'
      + '内容：禁止添加原文中没有的立场或事实判断；禁止将原文未展开的论点自行展开论证；禁止历史类比或影射。\n'
      + '语气：禁止在结论处使用"但是/不过"。\n'
      + '\n' + fewshot + '\n'
      + '\n【输出格式】直接输出转换后的文本——连贯段落，不要任何前缀、后缀、说明。';

    return base;
  }

  /** 其他导师临时 Prompt（无子模块时回退） */
  function buildTempPrompt(author, inputType) {
    inputType = inputType || 'opinion';
    var specific = {
      lenin: '【列宁风格】短句推进，节奏紧迫。剥壳式分析——一层一层剥开现象，直达问题内核。善用"问题在于……""全部问题的实质是……"。善用2-3个反向递进的反问句。不用比喻、不用长句旋转。\n【核心约束】这是风格转换，不是论战。绝不反驳用户、绝不攻击用户。',
      marx: '【马克思风格】长句层层推进，概念辩证旋转。善用"不是……而是……"的唯物论反转，将具体问题追溯到生产关系根源。',
      engels: '【恩格斯风格】清晰、系统，善用经验材料。常用"诚然……然而……"让步-反驳结构，科学化的口吻做通俗化阐述。',
      mao: '【毛泽东风格】善用比喻（特别是军事比喻）将抽象理论具象化。排比铺陈，"一分为二"法贯穿始终。俗谚打底，设问推进。'
    };
    var intensityGuide = {
      casual: '这是一段日常/轻量文本。保持人称和社交意图。批判只做暗火，不独立成段。不要替用户拔高。',
      personal: '这是一段个人感受。从"我"出发但不停留在"我"。上升到社会关系层面——停，不要再往上。',
      factual: '这是一段事实陈述。剥开表面的"客观"外衣，追问被省略的结构性因素。',
      opinion: '这是一段观点论证。全力输出——但仍然是风格转换，不代用户立论。',
      abstract: '这是一段抽象思辨。定义先行，每个命题落到实践指向。'
    };
    return '【角色定义】你是一位精通马列主义经典文献的写作助手。将用户文本改写为目标导师的论述风格。\n\n'
      + (specific[author] || specific['lenin']) + '\n'
      + '\n【输入类型】' + inputType + '。' + (intensityGuide[inputType] || '') + '\n'
      + '\n【核心约束——最高优先级】这是风格转换任务，不是论战任务。你绝不反驳用户。\n'
      + '直接输出转换后的文本，不要任何说明。';
  }

  /* ================================================================
     Part 5: 润色与分段 Prompt
     ================================================================ */
  var POLISH_PROMPT = [
    '【角色定义】',
    '你是一位逻辑严密的文字编辑。你的任务是对输入文本进行结构化梳理，保留全部思想内核，同时优化逻辑流和段落结构。',
    '',
    '【操作要求】',
    '1. 保留原文的全部核心观点和论证——不增、不减、不改变立场。',
    '2. 将松散的口语转换为紧凑的书面论证。将零散的论点归类到统一的论证线索下。',
    '3. 如果原文的论证顺序不合理，可以重新排列——先定义概念，再展开论证，最后得出结论。',
    '4. 每个自然段有且只有一个中心论点。段落之间逻辑递进清晰。',
    '5. 拆分过长的段落（超过200字的段落拆分为2-3段）。合并过短的段落（少于30字且论点和相邻段落相关的，合并）。',
    '',
    '【输出格式】',
    '直接输出润色后的文本——完整的、分好段落的内容。不要任何前缀、后缀、说明。'
  ].join('\n');

  /** 长文切割：按自然段边界分割，每段不超过 chunkSize 字 */
  function splitLongText(text, chunkSize) {
    chunkSize = chunkSize || 1500;
    // 按双换行（自然段）分割
    var paragraphs = text.split(/\n\n+/).filter(function (p) { return p.trim().length > 0; });
    var chunks = [];
    var current = '';

    paragraphs.forEach(function (para) {
      para = para.trim();
      if ((current + '\n\n' + para).length > chunkSize && current.length > 0) {
        chunks.push(current.trim());
        current = para;
      } else {
        current = current ? current + '\n\n' + para : para;
      }
    });
    if (current.trim()) chunks.push(current.trim());

    return chunks;
  }

  /* ================================================================
     Part 6: AI 分析报告（修改明细 + 风格诊断）
     ================================================================ */

  var CHANGES_PROMPT = [
    '【角色定义】',
    '你是一位细心的文本编辑。你需要逐句对比用户的原文和AI生成的转换文，找出每一个具体的变化，并解释变化的原因。',
    '',
    '【输出格式——严格JSON】',
    '请输出一个JSON对象，格式如下（不要输出任何其他内容）：',
    '{',
    '  "summary": "一句话概述主要变化",',
    '  "changes": [',
    '    {"type": "词汇替换|句式重组|逻辑重构|提升为结构性描述|丢弃|保留", "original": "原文片段（≤30字）", "replaced": "转换后片段（≤50字）", "reason": "一句话解释为什么这样改"}',
    '  ]',
    '}',
    '变化数量控制在5-12条。按重要性排序。注意：original和replaced必须是可以精确匹配的短片段，不要写长段落。'
  ].join('\n');

  var DIAGNOSIS_PROMPT = [
    '【角色定义】',
    '你是一位经历过革命斗争考验的政治委员，同时也是一位精密的文体分析师。',
    '你的任务是：（1）从五个可量化的维度给文本打分，（2）以政工干部的口吻给出思想和文风的定性评价。',
    '',
    '【定量分析——五维雷达（每题1-10分）】',
    '',
    '1. 句长：句子的平均长度如何？1=极短句（3-5字一断），10=极长句（多分句旋转推进，20字以上不断）。',
    '2. 句式多样性：句式变化丰富吗？1=单一句式反复使用（如全篇都是"第一…第二…"），10=反问/排比/对偶/让步/定义/收束等多种句式交替出现。',
    '3. 隐喻密度：使用了多少形象化表达？1=零修辞、零比喻、纯逻辑推进，10=比喻密集（军事/有机/建筑等隐喻域贯穿全文）。',
    '4. 情感温度：文字的情感强度如何？1=绝对冷静克制、零感叹号、零反问，10=激昂/义愤/急迫、感叹号反问频出。',
    '5. 论证节奏：论证推进的速度和力度如何？1=缓慢铺陈、从容展开，10=层层递进、短句爆破、不给读者喘息空间。',
    '',
    '【参考——五位导师的典型五维坐标（供对比，不必精确复现）】',
    '马克思：句长8, 句式多样性5, 隐喻密度6, 情感温度3, 论证节奏5（长句辩证旋转，有机隐喻，冷峻义愤）',
    '恩格斯：句长7, 句式多样性7, 隐喻密度4, 情感温度3, 论证节奏5（让步-反驳，材料驱动，科学口吻）',
    '列宁：句长3, 句式多样性8, 隐喻密度5, 情感温度8, 论证节奏9（短促反问，论战节奏，剥壳分析）',
    '斯大林：句长5, 句式多样性3, 隐喻密度1, 情感温度1, 论证节奏3（枚举拆解，自问自答，逻辑收网，零修辞）',
    '毛泽东：句长6, 句式多样性9, 隐喻密度9, 情感温度5, 论证节奏7（排比造势，军事比喻，俗谚打底）',
    '',
    '【定性分析——政委审阅】',
    '',
    '一、思想觉悟：立场是否站在无产阶级和劳动群众一边？是在揭露矛盾还是在回避矛盾？有没有无意中流露出小资产阶级感伤、自由主义中立或官僚主义冷漠？',
    '二、结构脉络：论证展开是否有力？有没有清晰的定义→拆解→推演→收网的骨架？同志读完能否清楚知道"作者想说什么、为什么这样说、结论是什么"？',
    '三、文风笔法：句式是否具备目标导师的风格特征？有没有不该出现的模糊表达、不当修辞、错误句式？',
    '',
    '【溯源识别】',
    '这篇文章在生成时注入了经典著作的随机文段作为风格参照。请指出文章中哪些表达听起来像是直接来自导师的某篇具体著作——用你的训练数据中关于马列主义经典著作的知识来合理推断。',
    '',
    '【输出格式——严格JSON】',
    '{',
    '  "scores": {"sentence_length": 5, "variety": 3, "metaphor": 1, "emotion": 1, "rhythm": 3},',
    '  "mentor_proximity": {"marx": 30, "engels": 25, "lenin": 15, "stalin": 85, "mao": 20},',
    '  "mentor_match": "最接近哪位导师（一句话）",',
    '  "ideology_check": {"standpoint": "立场判断", "correct": ["正确之处1-2条"], "concern": ["需警惕倾向，没有则[]"]},',
    '  "structure_check": {"flow": "论证脉络", "strength": ["优势1-2条"], "gap": ["薄弱处，没有则[]"]},',
    '  "style_check": {"highlight": ["文笔亮点1-2条"], "traceability": ["「片段…」——似出自《著作名》", "…"]},',
    '  "verdict": "政委总结（必须严格按两段输出，用「\\n\\n」分隔！\\n\\n第一段-帮作者理思路（30-60字）：猜用户真正想表达的核心意思，帮他把想法提炼升华。用「换句话说……」「作者真正想说的是……」「同志的意思在于……」开篇。\\n\\n第二段-政委评语（60-90字）：政工干部口吻评价得失——哪里打中了要害、哪里可以更有力。有表扬有敲打，语气像支部会议上对同志发言。不要喊口号。\\n\\n注意：两段之间必须用空行分隔！！）"',
    '}',
    '只输出JSON，不要其他内容。'
  ].join('\n');

  /* ================================================================
     Part 7: API Key 管理
     ================================================================ */
  function getApiKey() {
    try { return localStorage.getItem(CONFIG.LS_KEY) || ''; }
    catch (e) { return ''; }
  }
  function setApiKey(key) {
    try { localStorage.setItem(CONFIG.LS_KEY, key.trim()); return true; }
    catch (e) { return false; }
  }
  function hasApiKey() {
    return getApiKey().length > 10;
  }

  /* ================================================================
     Part 7: DeepSeek API 直连
     ================================================================ */
  async function callDeepSeek(systemPrompt, userText, apiKey, temp, enableSearch) {
    temp = temp || 0.4;
    if (enableSearch === undefined) enableSearch = false;
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
          temperature: temp,
          max_tokens: CONFIG.MAX_TOKENS,
          enable_search: !!enableSearch
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
      var content = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content : '';
      return { result: cleanOutput(content), usage: data.usage || {} };
    } finally {
      clearTimeout(timeout);
    }
  }

  function cleanOutput(text) {
    if (!text) return '';
    return text
      .replace(/[*#_~`>|]/g, '')
      .replace(/^[\s\n]*(?:以下(?:是|为)|如下(?:所示)?|这是(?:我(?:的|为)|转换|改写|翻译|生成)|好的[，,。！!]|让我[们们]?来?看看).*?[：:\n]/i, '')
      .replace(/(?:你觉得(?:怎么样|如何|呢)[？?]?|欢迎(?:讨论|指正|批评|交流)[！!。]?|希望(?:以上|这|这些|对您|对你|大家)[^。！!？?]{0,30}[。！!]?|以上(?:就是|便是|为|内容)[^。！!？?]{0,20}[。！!]?)\s*$/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /* ================================================================
     Part 8: 对外接口
     ================================================================ */
  var AIController = {
    /** 风格转换 */
    async deepPolish(text, author, period, fragments, feedbackContext) {
      var apiKey = getApiKey();
      if (!apiKey || apiKey.length < 10) throw new Error('请先设置 DeepSeek API Key');

      var inputType = classifyInput(text);
      var prompt;
      var entry = MENTOR_REGISTRY[author];
      var matchedArticles = [];

      if (entry && entry.module) {
        // 从文章数据库查询相关文章
        if (window.ArticleDB) {
          matchedArticles = window.ArticleDB.queryArticles(author, text, period || 'standard', 2);
        }

        // 子模块构建 Prompt（传入 inputType 用于认知操作强度调制）
        var mentorPrompt = entry.module.buildPrompt(text, period || 'standard', inputType, fragments);

        // 注入匹配到的文章 excerpt
        if (matchedArticles.length > 0) {
          mentorPrompt += '\n\n【文章数据库匹配——以下为该导师讨论相关话题的真实文章】';
          matchedArticles.forEach(function (a, i) {
            mentorPrompt += '\n' + (i+1) + '. 《' + a.title + '》（' + a.year + '）：' + a.excerpt;
          });
        }

        // 注入风格比对反馈（来自上次生成的分析 + 历史模式）
        if (feedbackContext && feedbackContext.length > 0) {
          mentorPrompt += '\n\n' + feedbackContext;
          mentorPrompt += '\n\n请特别注意以上反馈——不要重复上次的错误。这是同一条输入文本的第二次生成，你需要在保留导师风格骨架的前提下修正上述具体问题。';
        }

        prompt = buildFinalPrompt(mentorPrompt, text, inputType);
      } else {
        prompt = buildTempPrompt(author, inputType);
      }

      var doSearch = (inputType === 'casual');
      var result = await callDeepSeek(prompt, text, apiKey, undefined, doSearch);
      result.inputType = inputType;
      result.period = period || 'standard';
      result.matchedArticles = matchedArticles;

      // 风格比对：输出 vs 原文语料
      var styleAnalysis = null;
      if (window.ArticleDB && result.result) {
        styleAnalysis = window.ArticleDB.compareStyle(result.result, author);
        result.styleAnalysis = styleAnalysis;
      }

      // 记录蒸馏日志（含风格分析）
      if (window.ArticleDB) {
        window.ArticleDB.logGeneration({
          author: author,
          period: period || 'standard',
          input: text,
          output: result.result,
          tokens: (result.usage || {}).total_tokens || 0,
          articles: matchedArticles,
          inputType: result.inputType,
          styleAnalysis: styleAnalysis
        });
      }

      return result;
    },

    /** 重新生成：注入风格比对反馈 + 历史模式 */
    async regenerate(text, author, period) {
      var entry = MENTOR_REGISTRY[author];
      var fragments = null;
      if (entry && entry.module) {
        fragments = entry.module.pickFragments(period || 'standard', text, 3);
      }

      // 收集反馈上下文
      var feedbackContext = '';

      // 1. 上次生成的风格差距
      if (window.ArticleDB) {
        var log = window.ArticleDB.getDistillationLog();
        var authorLogs = log.filter(function (e) { return e.author === author; }).slice(-1);
        if (authorLogs.length > 0 && authorLogs[0].styleAnalysis && authorLogs[0].styleAnalysis.gaps) {
          var lastGaps = authorLogs[0].styleAnalysis.gaps;
          var gapLines = ['【上次生成的风格差距——本次请修正】'];
          lastGaps.forEach(function (g) {
            if (g.severity === 'high' || g.severity === 'medium') {
              gapLines.push('- ' + g.hint);
            }
          });
          feedbackContext = gapLines.join('\n');
        }

        // 2. 历史模式（多次出现的共同问题）
        var historyFeedback = window.ArticleDB.getRecentFeedback(author, 5);
        if (historyFeedback) {
          feedbackContext += '\n\n' + historyFeedback;
        }
      }

      return this.deepPolish(text, author, period, fragments, feedbackContext);
    },

    /** 修改明细：对比输入输出 */
    async analyzeChanges(original, converted) {
      var apiKey = getApiKey();
      if (!apiKey) throw new Error('请先设置 API Key');
      var userMsg = '【原文】\n' + original + '\n\n【转换文】\n' + converted;
      var result = await callDeepSeek(CHANGES_PROMPT, userMsg, apiKey, 0.2);
      try {
        result.data = JSON.parse(result.result);
      } catch (e) {
        result.data = { summary: result.result, changes: [] };
      }
      return result;
    },

    /** 风格分析：输入文本特征 vs 导师时期差异 */
    async analyzeStyle(text, author) {
      var apiKey = getApiKey();
      if (!apiKey) throw new Error('请先设置 API Key');

      // 长文选重点段落
      var analysisText = text;
      if (text.length > 800) {
        var paragraphs = text.split(/\n\n+/).filter(function (p) { return p.trim().length > 40; });
        if (paragraphs.length > 4) {
          analysisText = paragraphs[0] + '\n\n[...]\n\n'
            + paragraphs[Math.floor(paragraphs.length / 2)] + '\n\n[...]\n\n'
            + paragraphs[paragraphs.length - 1];
        }
      }

      var prompt = [
        '【角色定义】',
        '你是一位文体分析专家。你需要将输入文本与五位马列主义导师的风格特征逐一对比，找到文本在各维度上与哪位导师最接近。',
        '',
        '【五位导师风格坐标（句长/句式多样性/隐喻密度/情感温度/论证节奏，均1-10）】',
        '马克思（发现者）：8/5/6/3/5 — 长句辩证旋转，有机隐喻，唯物论反转"不是…而是…"',
        '恩格斯（阐释者）：7/7/4/3/5 — 让步-反驳"诚然…然而…"，科学口吻，材料驱动',
        '列宁（论战者）：3/8/5/8/9 — 短促反问"难道…吗？"，剥壳分析，论战节奏',
        '斯大林（定论者）：5/3/1/1/3 — 枚举拆解"第一…第二…"，自问自答，逻辑收网，零修辞',
        '毛泽东（引导者）：6/9/9/5/7 — 排比造势，军事比喻，俗谚打底，一分为二',
        '',
        '【分析要求】',
        '1. 估算输入文本的五维分数',
        '2. 逐一对比五位导师，指出具体哪些方面相近、哪些方面相远',
        '3. 给出最佳匹配导师和推荐时期',
        '4. 给出跨导师学习建议："论证结构方面与X相近，可借鉴其Y特征""句式方面可向Z学习其W手法"等',
        '',
        '【输出格式——严格JSON】',
        '{',
        '  "input_scores": {"sentence_length":5, "variety":5, "metaphor":5, "emotion":5, "rhythm":5},',
        '  "input_profile": {"句式特征":"…", "论证结构":"…", "情感温度":"…", "术语风格":"…"},',
        '  "mentor_comparisons": [',
        '    {"mentor":"马克思","overlap":["相近点"],"gap":["差异点"]},',
        '    {"mentor":"恩格斯","overlap":[],"gap":[]},',
        '    {"mentor":"列宁","overlap":[],"gap":[]},',
        '    {"mentor":"斯大林","overlap":[],"gap":[]},',
        '    {"mentor":"毛泽东","overlap":[],"gap":[]}',
        '  ],',
        '  "best_match": {"mentor":"最佳匹配","period":"推荐时期","reason":"理由"},',
        '  "learning_advice": ["论证结构方面与X导师相近，其Y特征值得借鉴","句式方面可向Z导师学习，特别是其W手法","…(2-4条)"],',
        '  "summary": "总体分析（100-150字）"',
        '}',
        '只输出JSON。'
      ].join('\n');

      var result = await callDeepSeek(prompt, analysisText, apiKey, 0.3);
      try {
        result.data = JSON.parse(result.result);
      } catch (e) {
        result.data = { summary: result.result, mentor_comparisons: [], learning_advice: [], best_match: {} };
      }
      return result;
    },

    /** 风格诊断：五维雷达+文字报告 */
    async analyzeDiagnosis(text) {
      var apiKey = getApiKey();
      if (!apiKey) throw new Error('请先设置 API Key');
      var result = await callDeepSeek(DIAGNOSIS_PROMPT, text, apiKey, 0.2);
      try {
        result.data = JSON.parse(result.result);
      } catch (e) {
        result.data = { scores: {}, verdict: result.result };
      }
      return result;
    },

    /** 润色与分段 */
    async polishAndRestructure(text) {
      var apiKey = getApiKey();
      if (!apiKey || apiKey.length < 10) throw new Error('请先设置 DeepSeek API Key');

      // 长文切割
      if (text.length > 1500) {
        var chunks = splitLongText(text, 1500);
        var polishedChunks = [];
        for (var i = 0; i < chunks.length; i++) {
          var chunkPrompt = POLISH_PROMPT + '\n\n【注意：这是长文的第' + (i+1) + '/' + chunks.length + '部分。请独立润色这一部分，保持逻辑连贯。】';
          var res = await callDeepSeek(chunkPrompt, chunks[i], apiKey, 0.3);
          polishedChunks.push(res.result);
        }
        return {
          result: polishedChunks.join('\n\n'),
          usage: { total_tokens: polishedChunks.length, note: '分段处理: ' + polishedChunks.length + '段' },
          inputType: 'polish'
        };
      }

      // 短文直接润色
      var result = await callDeepSeek(POLISH_PROMPT, text, apiKey, 0.3);
      result.inputType = 'polish';
      return result;
    },

    /** 问答聊天（接收预组装的 messages 数组） */
    async chatWithMessages(messages) {
      var apiKey = getApiKey();
      if (!apiKey || apiKey.length < 10) throw new Error('请先设置 DeepSeek API Key');

      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, CONFIG.TIMEOUT_MS);

      try {
        var resp = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: CONFIG.MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 600,
            enable_search: true
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
        var content = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content : '';
        return { result: cleanOutput(content), usage: data.usage || {} };
      } finally {
        clearTimeout(timeout);
      }
    },

    /** 问答聊天（兼容旧接口） */
    async chat(message, author, history) {
      var apiKey = getApiKey();
      if (!apiKey || apiKey.length < 10) throw new Error('请先设置 DeepSeek API Key');

      var entry = MENTOR_REGISTRY[author];
      var mentorLabel = entry ? entry.label : '导师';

      var systemPrompt = [
        '【角色定义】',
        '你是' + mentorLabel + '。此刻你不在写文章——你在和一个同志私下聊天。',
        '你不是在做报告，不是在教导，不是在发表声明。你是一个有阅历、有脾气、敢说真话的朋友。',
        '',
        '【聊天风格】',
        '- 真诚直接。不说套话，不说空话。看到问题就指出来——朋友之间不说废话。',
        '- 可以幽默，可以反问，可以用日常比喻。你不是一台答录机。',
        '- 回复简短（50-150字）。像微信聊天，不像写文章。三言两语，点到即止。',
        '- 如果对方在倾诉烦恼——先接住情绪，再给视角。不说"一切都会好的"这种空话。',
        '- 如果对方在开玩笑——你也能接梗，也能笑着回。但你的玩笑里有骨头。',
        '- 如果对方问了一个大的问题——不要展开写论文，给一个最核心的判断，把思考空间留给对方。',
        '',
        '【底线】',
        '不居高临下。不讲假话。不替对方做决定。可以指出问题，但不代替对方思考。'
      ].join('\n');

      // 注入聊天历史（最近 8 条）
      var messages = [{ role: 'system', content: systemPrompt }];
      var recentHistory = (history || []).slice(-8);
      recentHistory.forEach(function (msg) {
        messages.push({ role: msg.role, content: msg.content });
      });
      messages.push({ role: 'user', content: message });

      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, CONFIG.TIMEOUT_MS);

      try {
        var resp = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: CONFIG.MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 600,
            enable_search: true
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
        var content = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content : '';
        return { result: cleanOutput(content), usage: data.usage || {} };
      } finally {
        clearTimeout(timeout);
      }
    }
  };

  /* ================================================================
     Part 9: 初始化 + 导出
     ================================================================ */
  initRegistry();

  window.StalinAIController = AIController;
  window.StalinAI_getApiKey = getApiKey;
  window.StalinAI_setApiKey = setApiKey;
  window.StalinAI_hasApiKey = hasApiKey;
  window.StalinAI_classifyInput = classifyInput;
  window.StalinAI_MENTOR_REGISTRY = MENTOR_REGISTRY;

  console.log('[AI父模块] V3.2 已加载 — 子模块: ' +
    Object.keys(MENTOR_REGISTRY).filter(function(k) { return MENTOR_REGISTRY[k].hasChild; }).join(', '));
})();
