/**
 * 马列主义经典文章数据库
 * 用于 AI 生成时的风格参照、逆向分析和持续蒸馏。
 *
 * 结构：每篇文章 = { title, author, period, year, topics, excerpt }
 * 查询：n-gram 中文文本相似度匹配（替代关键词白名单）
 * 风格比对：输出文本 vs 原文语料 → 差距分析 → 反馈注入下次生成
 * 蒸馏日志：每次生成结果记录到 localStorage，支持历史模式聚合
 */
(function () {
  'use strict';

  /* ================================================================
     Part 0: 中文文本分析工具
     ================================================================ */

  /** 提取中文 bigram（二字词） */
  function extractBigrams(text) {
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (/[一-鿿]/.test(c)) chars.push(c);
    }
    var grams = {};
    for (var i = 0; i < chars.length - 1; i++) {
      var gram = chars[i] + chars[i + 1];
      grams[gram] = (grams[gram] || 0) + 1;
    }
    return grams;
  }

  /** 计算两个 bigram 集合的余弦相似度 */
  function cosineSimilarity(gramsA, gramsB) {
    var dot = 0, magA = 0, magB = 0;
    for (var k in gramsA) {
      magA += gramsA[k] * gramsA[k];
      if (gramsB[k]) dot += gramsA[k] * gramsB[k];
    }
    for (var k in gramsB) {
      magB += gramsB[k] * gramsB[k];
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  /** 计算任意两段中文文本的相似度（0-1） */
  function textSimilarity(textA, textB) {
    if (!textA || !textB) return 0;
    var gramsA = extractBigrams(textA);
    var gramsB = extractBigrams(textB);
    return cosineSimilarity(gramsA, gramsB);
  }

  /** 从文本中提取高频 bigram（用于诊断显示） */
  function topBigrams(text, n) {
    n = n || 10;
    var grams = extractBigrams(text);
    var sorted = Object.keys(grams).sort(function (a, b) { return grams[b] - grams[a]; });
    return sorted.slice(0, n).map(function (g) { return g + '(' + grams[g] + ')'; });
  }

  /* ================================================================
     Part 1: 文章数据库（ARTICLES 对象保持不变）
     ================================================================ */
  var ARTICLES = {
    stalin: [
      // ---- 时期1：法典化（1924-1930） ----
      {
        title: '论列宁主义基础',
        author: 'stalin', period: 'period1', year: 1924,
        topics: ['列宁主义', '理论', '方法', '无产阶级专政', '农民问题', '民族问题', '战略策略', '党', '工作作风'],
        excerpt: '什么是列宁主义呢？列宁主义就是帝国主义和无产阶级革命时代的马克思主义。确切地说，列宁主义一般是无产阶级革命的理论和策略，特别是无产阶级专政的理论和策略。列宁主义的方法就是在斗争中检验一切理论原理，在群众的行动中考验它们，按照实际经验来校正它们。'
      },
      {
        title: '论列宁主义的几个问题',
        author: 'stalin', period: 'period1', year: 1926,
        topics: ['列宁主义', '定义', '不断革命', '无产阶级专政', '一国建成社会主义', '农民', '合作社'],
        excerpt: '由此得出的结论是：社会主义可能在一个国家内胜利。这是列宁主义的最重要的原理之一。无产阶级专政不是目的本身。无产阶级专政是走向社会主义的手段、工具和道路。'
      },
      {
        title: '十月革命和俄国共产党人的策略',
        author: 'stalin', period: 'period1', year: 1924,
        topics: ['十月革命', '策略', '不断革命论', '托洛茨基', '无产阶级革命'],
        excerpt: '十月革命的内外环境决定了它的特殊性质。没有也不可能有任何"第三条道路"。在这个问题上没有中间地带。'
      },
      {
        title: '托洛茨基主义还是列宁主义？',
        author: 'stalin', period: 'period1', year: 1924,
        topics: ['托洛茨基', '列宁主义', '十月革命', '论战', '党的统一'],
        excerpt: '托洛茨基主义还是列宁主义？这个问题必须明确地回答。在这个问题上不能有任何含糊。'
      },
      {
        title: '论列宁',
        author: 'stalin', period: 'period1', year: 1924,
        topics: ['列宁', '领袖', '风格', '组织者'],
        excerpt: '列宁是俄国共产党的组织者和领袖。列宁的学说不是书斋里的空论，而是行动的指南。'
      },

      // ---- 时期2：动员（1930-1940） ----
      {
        title: '论经济工作人员的任务',
        author: 'stalin', period: 'period2', year: 1931,
        topics: ['工业化', '技术', '干部', '学习', '经济建设', '速度'],
        excerpt: '必须掌握技术，必须成为内行。必须使自己的业务知识臻于完善。必须有勇气面对自己的无知，不是遮遮掩掩，而是坦白承认。由此得出的实际结论是：学习，学习，再学习。速度决定一切。延缓速度就是落后。而落后者是要挨打的。'
      },
      {
        title: '在克里姆林宫学员毕业典礼上的讲话',
        author: 'stalin', period: 'period2', year: 1935,
        topics: ['干部', '技术', '人才', '组织'],
        excerpt: '技术决定一切。干部决定一切。没有技术，就没有生产力。没有干部，技术就是死的。'
      },
      {
        title: '第一个五年计划的总结',
        author: 'stalin', period: 'period2', year: 1933,
        topics: ['五年计划', '工业化', '建设', '成就', '困难'],
        excerpt: '我们不能不感到，我们正在走向胜利。这个胜利不是自然而然地到来的——它是在克服困难中争取来的。问题不在于困难，而在于如何克服困难。'
      },
      {
        title: '论党的工作缺点和消灭托洛茨基两面派的办法',
        author: 'stalin', period: 'period2', year: 1937,
        topics: ['党', '清洗', '托洛茨基', '两面派', '警惕'],
        excerpt: '必须提高革命警惕性。必须揭露两面派。必须把党从不可靠分子手中清洗干净。'
      },

      // ---- 时期3：定论（1945-1953） ----
      {
        title: '马克思主义和语言学问题',
        author: 'stalin', period: 'period3', year: 1950,
        topics: ['语言', '上层建筑', '经济基础', '阶级', '马克思主义', '辩证法'],
        excerpt: '语言不是上层建筑。语言不是阶级性的。语言是全社会共同的交际工具。上层建筑是由经济基础产生的，但这决不是说上层建筑只是消极地反映基础。相反地，上层建筑一旦产生，就成为极大的积极力量。马克思主义不承认绝对适应于一切时代和一切时期的不变的结论和公式。马克思主义是一切教条主义的敌人。'
      },
      {
        title: '苏联社会主义经济问题',
        author: 'stalin', period: 'period3', year: 1952,
        topics: ['经济', '规律', '社会主义', '商品生产', '价值规律', '客观规律'],
        excerpt: '经济发展的规律是反映不以人们的意志为转移的经济发展过程的客观规律。人们能够发现这些规律，认识它们，但不能消灭它们或创造新的经济规律。否认这一点，就是否认科学。不容置疑。'
      },
      {
        title: '马克思主义和民族问题',
        author: 'stalin', period: 'period1', year: 1913,
        topics: ['民族', '民族运动', '文化自治', '自决权', '崩得'],
        excerpt: '民族是人们在历史上形成的一个有共同语言、共同地域、共同经济生活以及表现于共同文化上的共同心理素质的稳定的共同体。'
      },
      {
        title: '无政府主义还是社会主义？',
        author: 'stalin', period: 'period1', year: 1906,
        topics: ['无政府主义', '社会主义', '辩证法', '唯物主义', '无产阶级'],
        excerpt: '什么是辩证方法呢？社会生活处在不断运动和不断发展的状态中。世界上一切都在变化，生活中一切都在发展。'
      }
    ],

    mao: [
      // ---- 时期1：早期本土化（1925-1937） ----
      {
        title: '中国社会各阶级的分析',
        author: 'mao', period: 'period1', year: 1925,
        topics: ['阶级分析', '革命', '农民', '敌人', '朋友', '无产阶级'],
        excerpt: '谁是我们的敌人？谁是我们的朋友？这个问题是革命的首要问题。中国过去一切革命斗争成效甚少，其基本原因就是因为不能团结真正的朋友，以攻击真正的敌人。'
      },
      {
        title: '湖南农民运动考察报告',
        author: 'mao', period: 'period1', year: 1927,
        topics: ['农民', '革命', '乡村', '阶级', '调查', '土地'],
        excerpt: '农民的主要攻击目标是土豪劣绅，不法地主，旁及各种宗法的思想和制度，城里的贪官污吏，乡村的恶劣习惯。这个攻击的形势，简直是急风暴雨，顺之者存，违之者灭。革命不是请客吃饭，不是做文章，不是绘画绣花，不能那样雅致，那样从容不迫，文质彬彬，那样温良恭俭让。'
      },
      {
        title: '中国的红色政权为什么能够存在？',
        author: 'mao', period: 'period1', year: 1928,
        topics: ['红色政权', '根据地', '军阀', '革命', '武装斗争'],
        excerpt: '一国之内，在四围白色政权的包围中，有一小块或若干小块红色政权的区域长期地存在，这是世界各国从来没有的事。这种奇事的发生，有其独特的原因。'
      },
      {
        title: '井冈山的斗争',
        author: 'mao', period: 'period1', year: 1928,
        topics: ['井冈山', '根据地', '武装斗争', '土地革命', '红军', '党的建设'],
        excerpt: '整个的革命势力，不论是主观的或客观的，不论是反帝国主义的或反封建的，不论是军事的或政治的，不论是党的或群众的，都有组织得不好的地方。'
      },
      {
        title: '星星之火，可以燎原',
        author: 'mao', period: 'period1', year: 1930,
        topics: ['革命', '根据地', '红军', '高潮', '悲观', '战略'],
        excerpt: '马克思主义者不是算命先生，未来的发展和变化，只应该也只能说出个大的方向，不应该也不可能机械地规定时日。但我所说的中国革命高潮快要到来，决不是如有些人所谓"有到来之可能"那样完全没有行动意义的、可望而不可即的一种空的东西。'
      },
      {
        title: '反对本本主义',
        author: 'mao', period: 'period1', year: 1930,
        topics: ['调查', '教条主义', '实事求是', '实践', '方法论'],
        excerpt: '没有调查，就没有发言权。调查就像"十月怀胎"，解决问题就像"一朝分娩"。调查就是解决问题。离开实际调查就要产生唯心的阶级估量和唯心的工作指导，那末，它的结果，不是机会主义，便是盲动主义。'
      },
      {
        title: '中国革命战争的战略问题',
        author: 'mao', period: 'period1', year: 1936,
        topics: ['战争', '战略', '军事', '革命', '辩证法'],
        excerpt: '战争——从有私有财产和有阶级以来就开始了的、用以解决阶级和阶级、民族和民族、国家和国家、政治集团和政治集团之间、在一定发展阶段上的矛盾的一种最高的斗争形式。'
      },
      {
        title: '实践论',
        author: 'mao', period: 'period1', year: 1937,
        topics: ['实践', '认识论', '辩证法', '哲学', '真理', '知行'],
        excerpt: '通过实践而发现真理，又通过实践而证实真理和发展真理。从感性认识而能动地发展到理性认识，又从理性认识而能动地指导革命实践，改造主观世界和客观世界。实践、认识、再实践、再认识，这种形式，循环往复以至无穷。'
      },
      {
        title: '矛盾论',
        author: 'mao', period: 'period1', year: 1937,
        topics: ['矛盾', '辩证法', '对立统一', '哲学', '方法论'],
        excerpt: '事物的矛盾法则，即对立统一的法则，是唯物辩证法的最根本的法则。外因是变化的条件，内因是变化的根据，外因通过内因而起作用。鸡蛋因得适当的温度而变为鸡子，但温度不能使石头变为鸡子，因为二者的根据是不同的。'
      },

      // ---- 时期2：抗战动员（1937-1945） ----
      {
        title: '论持久战',
        author: 'mao', period: 'period2', year: 1938,
        topics: ['抗日战争', '持久战', '战略', '军事', '游击战', '亡国论', '速胜论'],
        excerpt: '于是问题是：中国会亡吗？答复：不会亡，最后胜利是中国的。中国能够速胜吗？答复：不能速胜，抗日战争是持久战。武器是战争的重要因素，但不是决定因素。决定的因素是人不是物。'
      },
      {
        title: '中国共产党在民族战争中的地位',
        author: 'mao', period: 'period2', year: 1938,
        topics: ['党', '民族战争', '先锋队', '爱国主义', '国际主义'],
        excerpt: '共产党员应在民族战争中表现其高度的积极性；而这种积极性，应使之具体地表现于各方面，即应在各方面起其先锋的模范的作用。'
      },
      {
        title: '战争和战略问题',
        author: 'mao', period: 'period2', year: 1938,
        topics: ['战争', '战略', '军队', '游击战', '武装斗争'],
        excerpt: '每个共产党员都应懂得这个真理："枪杆子里面出政权"。我们的原则是党指挥枪，而决不容许枪指挥党。'
      },
      {
        title: '新民主主义论',
        author: 'mao', period: 'period2', year: 1940,
        topics: ['新民主主义', '革命', '文化', '政治', '经济', '社会主义'],
        excerpt: '中国革命的历史进程，必须分为两步，其第一步是民主主义的革命，其第二步是社会主义的革命，这是性质不同的两个革命过程。而所谓民主主义，现在已不是旧范畴的民主主义，已不是旧民主主义，而是新范畴的民主主义，而是新民主主义。'
      },
      {
        title: '在延安文艺座谈会上的讲话',
        author: 'mao', period: 'period2', year: 1942,
        topics: ['文艺', '群众', '路线', '知识分子', '工农兵'],
        excerpt: '我们的文艺是为什么人的？我们的文艺，第一是为工人的，这是领导革命的阶级。第二是为农民的，他们是革命中最广大最坚决的同盟军。第三是为武装起来了的工人农民即八路军、新四军和其他人民武装队伍的，这是革命战争的主力。'
      },
      {
        title: '论联合政府',
        author: 'mao', period: 'period2', year: 1945,
        topics: ['联合政府', '统一战线', '民主', '抗战', '建国'],
        excerpt: '全心全意地为人民服务，一刻也不脱离群众；一切从人民的利益出发，而不是从个人或小集团的利益出发；向人民负责和向党的领导机关负责的一致性；这些就是我们的出发点。'
      },

      // ---- 时期3：建设探索（1949-1965） ----
      {
        title: '论人民民主专政',
        author: 'mao', period: 'period3', year: 1949,
        topics: ['人民民主专政', '国家', '政权', '建国', '阶级'],
        excerpt: '总结我们的经验，集中到一点，就是工人阶级（经过共产党）领导的以工农联盟为基础的人民民主专政。这就是我们的公式，这就是我们的主要经验，这就是我们的主要纲领。'
      },
      {
        title: '论十大关系',
        author: 'mao', period: 'period3', year: 1956,
        topics: ['经济建设', '重工业', '农业', '沿海', '内地', '苏联经验', '矛盾'],
        excerpt: '这里就发生一个问题，你对发展重工业究竟是真想还是假想，想得厉害一点，还是差一点？你如果是假想，或者想得差一点，那就打击农业轻工业，对它们少投点资。你如果是真想，或者想得厉害，那你就要注重农业轻工业。'
      },
      {
        title: '关于正确处理人民内部矛盾的问题',
        author: 'mao', period: 'period3', year: 1957,
        topics: ['矛盾', '人民内部矛盾', '敌我矛盾', '辩证法', '批评', '马克思主义'],
        excerpt: '在我们的面前有两类社会矛盾，这就是敌我之间的矛盾和人民内部的矛盾。这是性质完全不同的两类矛盾。马克思主义是一种科学真理，它是不怕批评的。如果马克思主义害怕批评，如果可以批评倒，那末马克思主义就没有用了。'
      }
    ],

    lenin: [
      // === 时期1：早期论战 (1894-1905) ===
      {
        title: '什么是"人民之友"以及他们如何攻击社会民主党人？',
        author: 'lenin', period: 'period1', year: 1894,
        topics: ['民粹派', '唯物史观', '辩证法', '主观社会学', '论战', '方法论'],
        excerpt: '马克思的理论不只是对资本主义的科学分析——它同时是对这个社会的革命的批判。而"批评家"们恰恰抛弃了这一点——抛弃之后，还自称是"马克思的学生"。'
      },
      {
        title: '怎么办？',
        author: 'lenin', period: 'period1', year: 1902,
        topics: ['建党', '自发性和自觉性', '灌输论', '职业革命家', '经济派', '组织', '全俄政治报'],
        excerpt: '没有革命的理论，就不会有革命的运动。自发的工人运动就是工联主义的运动，而工联主义正是意味着工人受资产阶级思想的奴役。'
      },
      {
        title: '进一步，退两步',
        author: 'lenin', period: 'period1', year: 1904,
        topics: ['党章', '集中制', '自治制', '组织原则', '孟什维克', '马尔托夫'],
        excerpt: '全部问题就在于：不要把现象当作本质。党章第1条的争论不是文字之争——它是两条组织路线之争。'
      },
      {
        title: '社会民主党在民主革命中的两种策略',
        author: 'lenin', period: 'period1', year: 1905,
        topics: ['民主革命', '无产阶级领导权', '工农民主专政', '临时政府', '策略'],
        excerpt: '社会民主党在民主革命中的任务不是降低自己的纲领到农民的立场——而是把农民提高到自己的纲领的水平。'
      },

      // === 时期2：理论突破 (1905-1917) ===
      {
        title: '马克思主义和修正主义',
        author: 'lenin', period: 'period2', year: 1908,
        topics: ['修正主义', '伯恩施坦', '马克思主义', '辩证法', '改良主义'],
        excerpt: '修正主义就是背叛。用对马克思学说的"修正"来掩饰对资产阶级的投降。马克思主义在理论上的胜利，逼得它的敌人装扮成马克思主义者。'
      },
      {
        title: '唯物主义和经验批判主义',
        author: 'lenin', period: 'period2', year: 1908,
        topics: ['唯物主义', '经验批判主义', '马赫主义', '认识论', '反映论', '实践', '真理', '物质'],
        excerpt: '物质是标志客观实在的哲学范畴，这种客观实在是人通过感觉感知的，它不依赖于我们的感觉而存在，为我们的感觉所复写、摄影、反映。生活、实践的观点，应该是认识论的首先的和基本的观点。'
      },
      {
        title: '马克思主义的三个来源和三个组成部分',
        author: 'lenin', period: 'period2', year: 1913,
        topics: ['马克思主义', '哲学', '政治经济学', '科学社会主义', '辩证法', '剩余价值', '阶级斗争'],
        excerpt: '马克思主义是由三个部分组成的：哲学、政治经济学和科学社会主义。马克思的学说在整个文明世界中引起了全部资产阶级科学最大的仇视和憎恨。'
      },
      {
        title: '论民族自决权',
        author: 'lenin', period: 'period2', year: 1914,
        topics: ['民族自决权', '民族问题', '分离', '国家', '马克思主义'],
        excerpt: '所谓民族自决，就是民族脱离异族集合体的国家分离，就是成立独立的民族国家。在分析任何一个社会问题时，马克思主义理论的绝对要求就是把问题提到一定的历史范围之内。'
      },
      {
        title: '论欧洲联邦口号',
        author: 'lenin', period: 'period2', year: 1915,
        topics: ['欧洲联邦', '不平衡发展', '一国胜利', '帝国主义', '世界联邦'],
        excerpt: '经济和政治发展的不平衡是资本主义的绝对规律。由此就应得出结论：社会主义可能首先在少数甚至在单独一个资本主义国家内获得胜利。'
      },
      {
        title: '谈谈辩证法问题',
        author: 'lenin', period: 'period2', year: 1915,
        topics: ['辩证法', '对立统一', '矛盾', '个别和一般', '相对和绝对', '认识论'],
        excerpt: '统一物之分为两个部分以及对它的矛盾着的部分的认识——是辩证法的实质。从最简单、最普通、最常见的东西开始——从任何一个命题开始。在这里就已经有辩证法：个别就是一般。'
      },
      {
        title: '帝国主义是资本主义的最高阶段',
        author: 'lenin', period: 'period2', year: 1916,
        topics: ['帝国主义', '垄断', '金融资本', '资本输出', '瓜分世界', '寄生性', '腐朽性'],
        excerpt: '帝国主义是资本主义的垄断阶段。金融资本和托拉斯不是削弱而是加强了世界经济各个部分在发展速度上的差异。既然实力对比发生了变化，那么在资本主义制度下，除了用实力来解决矛盾，还有什么别的办法呢？'
      },
      {
        title: '第二国际的破产',
        author: 'lenin', period: 'period2', year: 1915,
        topics: ['第二国际', '机会主义', '社会沙文主义', '考茨基', '背叛', '革命'],
        excerpt: '称考茨基为娼妓是完全正确的。没有比这更准确的字眼了。在口头上是社会主义和国际主义，在行动上是沙文主义和投降——这就是第二国际领袖们的全部真相。'
      },

      // === 时期3：革命建设 (1917-1923) ===
      {
        title: '论无产阶级在这次革命中的任务（四月提纲）',
        author: 'lenin', period: 'period3', year: 1917,
        topics: ['四月提纲', '苏维埃', '革命转变', '和平过渡', '临时政府'],
        excerpt: '不给临时政府任何支持。全部政权归苏维埃。必须从革命的第一阶段过渡到第二阶段。'
      },
      {
        title: '国家与革命',
        author: 'lenin', period: 'period3', year: 1917,
        topics: ['国家', '阶级', '无产阶级专政', '民主', '消亡', '暴力革命', '巴黎公社'],
        excerpt: '国家是阶级矛盾不可调和的产物和表现。在阶级矛盾客观上不能调和的地方、时候和条件下，便产生了国家。革命就是一部分人用非常权威的手段强迫另一部分人接受自己的意志。'
      },
      {
        title: '苏维埃政权的当前任务',
        author: 'lenin', period: 'period3', year: 1918,
        topics: ['苏维埃', '管理', '组织', '纪律', '计算和监督', '劳动生产率', '学习'],
        excerpt: '要向德国人学习！历史的发展是迂回曲折的。正是德国人，除了体现残暴的帝国主义，同时又体现了纪律、组织、在现代机器工业基础上的紧密协作以及极严格的计算与监督的原则。而这正是我们所缺少的。这正是我们要学会的。'
      },
      {
        title: '无产阶级革命和叛徒考茨基',
        author: 'lenin', period: 'period3', year: 1918,
        topics: ['考茨基', '无产阶级专政', '民主', '苏维埃', '立宪会议', '背叛'],
        excerpt: '考茨基把马克思主义中任何活的革命的东西都抛弃了，把资产阶级民主的破烂当作宝贝献给工人。'
      },
      {
        title: '共产主义运动中的"左派"幼稚病',
        author: 'lenin', period: 'period3', year: 1920,
        topics: ['策略', '议会斗争', '工会', '妥协', '领袖-政党-阶级-群众', '纪律'],
        excerpt: '提纲的作者们陷入了混乱，他们忘记了多次革命甚至是所有革命的一条经验：在革命时期，把反动议会外的群众行动和议会内部同情革命的反对派的活动配合起来，是特别有益的。'
      },
      {
        title: '青年团的任务',
        author: 'lenin', period: 'period3', year: 1920,
        topics: ['青年', '道德', '教育', '共产主义', '学习', '纪律'],
        excerpt: '究竟在什么意义上我们否定道德？是在资产阶级所宣传的道德的意义上。我们说这是欺骗，这是为了地主和资本家的利益来愚弄工农，禁锢工农的头脑。我们的道德完全服从无产阶级阶级斗争的利益。'
      },
      {
        title: '论粮食税',
        author: 'lenin', period: 'period3', year: 1921,
        topics: ['新经济政策', '粮食税', '国家资本主义', '商品交换', '过渡', '农民'],
        excerpt: '粮食税就是从战时共产主义到正常的社会主义产品交换的一种过渡形式。在过渡时期，必须允许商品交换在一定范围内存在。'
      },
      {
        title: '论合作社',
        author: 'lenin', period: 'period3', year: 1923,
        topics: ['合作社', '社会主义', '文化革命', '制度', '农民'],
        excerpt: '在生产资料公有制的条件下，在无产阶级对资产阶级取得了阶级胜利的条件下，文明的合作社工作者的制度就是社会主义的制度。'
      },
      {
        title: '论我国革命',
        author: 'lenin', period: 'period3', year: 1923,
        topics: ['革命', '特殊性', '一般规律', '苏汉诺夫', '文明', '政权'],
        excerpt: '既然建立社会主义需要有一定的文化水平，我们为什么不能首先用革命手段取得达到这个一定水平的前提，然后在工农政权和苏维埃制度的基础上赶上别国人民呢？'
      },
      {
        title: '宁肯少些，但要好些',
        author: 'lenin', period: 'period3', year: 1923,
        topics: ['国家机关', '改革', '工农检查院', '质量', '文化', '学习'],
        excerpt: '宁肯少些，但要好些。在改善我们国家机关的问题上，不应当追求数量和急于求成。全部问题在于：不要以为我们已经学会了管理。不。我们没有学会。'
      }
    ],

    marx: [
      // ---- 时期1：青年（1843-1848） ----
      {
        title: '《黑格尔法哲学批判》导言',
        author: 'marx', period: 'period1', year: 1843,
        topics: ['宗教批判', '哲学', '无产阶级', '革命', '德国', '解放'],
        excerpt: '宗教里的苦难既是现实的苦难的表现，又是对这种现实的苦难的抗议。宗教是被压迫生灵的叹息，是无情世界的情感。宗教是人民的鸦片。批判的武器当然不能代替武器的批判，物质力量只能用物质力量来摧毁；但是理论一经掌握群众，也会变成物质力量。'
      },
      {
        title: '1844年经济学哲学手稿（节选）',
        author: 'marx', period: 'period1', year: 1844,
        topics: ['异化劳动', '私有财产', '共产主义', '对象化', '人的本质'],
        excerpt: '劳动者生产的财富越多，他的产品的力量和数量越大，他就越贫穷。劳动者创造的商品越多，他就越变成廉价的商品。物的世界的增值同人的世界的贬值成正比。'
      },
      {
        title: '关于费尔巴哈的提纲',
        author: 'marx', period: 'period1', year: 1845,
        topics: ['实践', '唯物主义', '费尔巴哈', '人的本质', '改变世界'],
        excerpt: '哲学家们只是用不同的方式解释世界，问题在于改变世界。人的本质不是单个人所固有的抽象物，在其现实性上，它是一切社会关系的总和。'
      },
      {
        title: '德意志意识形态（节选）',
        author: 'marx', period: 'period1', year: 1845,
        topics: ['唯物史观', '意识形态', '分工', '共产主义', '生产力', '交往形式'],
        excerpt: '不是意识决定生活，而是生活决定意识。统治阶级的思想在每一时代都是占统治地位的思想。共产主义对我们来说不是应当确立的状况，不是现实应当与之相适应的理想。我们所称为共产主义的是那种消灭现存状况的现实的运动。'
      },

      // ---- 时期2：盛年（1848-1859） ----
      {
        title: '共产党宣言',
        author: 'marx', period: 'period2', year: 1848,
        topics: ['资产阶级', '无产阶级', '阶级斗争', '共产主义', '革命', '政党'],
        excerpt: '一个幽灵，共产主义的幽灵，在欧洲游荡。资产阶级不仅锻造了置自身于死地的武器；它还产生了将要运用这种武器的人——现代的工人，即无产者。无产者在这个革命中失去的只是锁链。他们获得的将是整个世界。'
      },
      {
        title: '雇佣劳动与资本',
        author: 'marx', period: 'period2', year: 1849,
        topics: ['雇佣劳动', '资本', '工资', '剩余价值', '生产关系'],
        excerpt: '资本不仅包括生活资料、劳动工具和原料，不仅包括物质产品，并且还包括交换价值。资本所包括的一切产品都是商品。所以，资本不仅是若干物质产品的总和，并且也是若干商品、若干交换价值、若干社会量的总和。'
      },
      {
        title: '路易·波拿巴的雾月十八日',
        author: 'marx', period: 'period2', year: 1852,
        topics: ['国家', '阶级斗争', '革命', '波拿巴主义', '农民', '历史'],
        excerpt: '黑格尔在某个地方说过，一切伟大的世界历史事变和人物，可以说都出现两次。他忘记补充一点：第一次是作为悲剧出现，第二次是作为笑剧出现。人们自己创造自己的历史，但是他们并不是随心所欲地创造。'
      },
      {
        title: '1848年至1850年的法兰西阶级斗争',
        author: 'marx', period: 'period2', year: 1850,
        topics: ['阶级斗争', '革命', '无产阶级专政', '法国', '社会主义'],
        excerpt: '革命是历史的火车头。革命的社会主义就是宣布不断革命，就是无产阶级的阶级专政，这种专政是达到消灭一切阶级差别，达到消灭这些差别所由产生的一切生产关系的过渡阶段。'
      },

      // ---- 时期3：晚年（1859-1883） ----
      {
        title: '《政治经济学批判》序言',
        author: 'marx', period: 'period3', year: 1859,
        topics: ['唯物史观', '生产力', '生产关系', '社会形态', '意识形态'],
        excerpt: '物质生活的生产方式制约着整个社会生活、政治生活和精神生活的过程。不是人们的意识决定人们的存在，相反，是人们的社会存在决定人们的意识。无论哪一个社会形态，在它所能容纳的全部生产力发挥出来以前，是决不会灭亡的。'
      },
      {
        title: '《资本论》第一卷（节选）',
        author: 'marx', period: 'period3', year: 1867,
        topics: ['商品', '货币', '资本', '剩余价值', '劳动', '拜物教'],
        excerpt: '资本来到世间，从头到脚，每个毛孔都滴着血和肮脏的东西。商品形式的奥秘不过在于：商品形式在人们面前把人们本身劳动的社会性质反映成劳动产品本身的物的性质。我把这叫做拜物教。'
      },
      {
        title: '法兰西内战',
        author: 'marx', period: 'period2', year: 1871,
        topics: ['巴黎公社', '国家', '无产阶级专政', '工人阶级', '革命'],
        excerpt: '工人阶级不能简单地掌握现成的国家机器，并运用它来达到自己的目的。工人的巴黎及其公社将永远作为新社会的光辉先驱而为人所称颂。'
      },
      {
        title: '哥达纲领批判',
        author: 'marx', period: 'period3', year: 1875,
        topics: ['社会主义', '共产主义', '按需分配', '过渡时期', '无产阶级专政'],
        excerpt: '在资本主义社会和共产主义社会之间，有一个从前者变为后者的革命转变时期。同这个时期相适应的也有一个政治上的过渡时期，这个时期的国家只能是无产阶级的革命专政。在共产主义社会高级阶段——各尽所能，按需分配！'
      }
    ],

    engels: [
      // ---- 时期1：青年（1839-1848） ----
      {
        title: '国民经济学批判大纲',
        author: 'engels', period: 'period1', year: 1844,
        topics: ['国民经济学', '私有制', '竞争', '垄断', '商业'],
        excerpt: '国民经济学的产生是商业扩展的自然结果，随着它的出现，一个成熟的允许欺诈的体系、一门完整的发财致富的科学代替了简单的不科学的生意经。'
      },
      {
        title: '英国工人阶级状况（节选）',
        author: 'engels', period: 'period1', year: 1845,
        topics: ['工人阶级', '产业革命', '资本主义', '工人运动', '英国'],
        excerpt: '工人阶级的状况是当代一切社会运动的真正基础和出发点，因为它是我们目前社会一切灾难的最尖锐、最露骨的表现。'
      },

      // ---- 时期2：盛年（1848-1870） ----
      {
        title: '德国的革命和反革命',
        author: 'engels', period: 'period2', year: 1852,
        topics: ['德国革命', '阶级分析', '革命策略', '奥地利', '普鲁士'],
        excerpt: '革命是一种与其说受其领导者的任性、不如说受客观必然性支配的过程。一种不以单个人或单一政党意志为转移的、归根到底由物质生活条件决定的运动。'
      },
      {
        title: '共产主义原理',
        author: 'engels', period: 'period1', year: 1847,
        topics: ['共产主义', '无产阶级', '私有制', '革命', '政党'],
        excerpt: '共产主义是关于无产阶级解放的条件的学说。废除私有制是共产主义者的主要要求。'
      },

      // ---- 时期3：晚年（1870-1895） ----
      {
        title: '论住宅问题',
        author: 'engels', period: 'period3', year: 1873,
        topics: ['住宅', '城市', '资本主义', '蒲鲁东主义', '工人阶级'],
        excerpt: '只要资本主义生产方式还继续存在，单独地解决住宅问题或任何其他同工人命运有关的社会问题，都是愚蠢的。真正解决在于废除资本主义生产方式。'
      },
      {
        title: '论权威',
        author: 'engels', period: 'period3', year: 1873,
        topics: ['权威', '革命', '组织', '无政府主义', '大工业'],
        excerpt: '想消灭大工业中的权威，就等于想消灭工业本身。革命无疑是天下最权威的东西。革命就是一部分人用枪杆、刺刀、大炮，即用非常权威的手段强迫另一部分人接受自己的意志。'
      },
      {
        title: '反杜林论',
        author: 'engels', period: 'period3', year: 1878,
        topics: ['哲学', '政治经济学', '社会主义', '辩证法', '唯物主义'],
        excerpt: '原则不是研究的出发点，而是它的最终结果；这些原则不是被应用于自然界和人类历史，而是从它们中抽象出来的；不是自然界和人类去适应原则，而是原则只有在符合自然界和历史的情况下才是正确的。'
      },
      {
        title: '社会主义从空想到科学的发展',
        author: 'engels', period: 'period3', year: 1880,
        topics: ['社会主义', '唯物史观', '剩余价值', '科学社会主义', '空想'],
        excerpt: '这两个伟大的发现——唯物主义历史观和通过剩余价值揭开资本主义生产的秘密——都应当归功于马克思。由于这些发现，社会主义变成了科学。'
      },
      {
        title: '自然辩证法（节选）',
        author: 'engels', period: 'period3', year: 1883,
        topics: ['辩证法', '自然界', '科学', '劳动', '人类起源'],
        excerpt: '劳动是整个人类生活的第一个基本条件，而且达到这样的程度，以致我们在某种意义上不得不说：劳动创造了人本身。'
      },
      {
        title: '家庭、私有制和国家的起源',
        author: 'engels', period: 'period3', year: 1884,
        topics: ['家庭', '私有制', '国家', '阶级', '氏族', '文明'],
        excerpt: '根据唯物主义观点，历史中的决定性因素，归根结蒂是直接生活的生产和再生产。国家并不是从来就有的。国家是文明社会的概括，它在一切典型的时期毫无例外地都是统治阶级的国家。'
      },
      {
        title: '路德维希·费尔巴哈和德国古典哲学的终结',
        author: 'engels', period: 'period3', year: 1886,
        topics: ['费尔巴哈', '黑格尔', '唯物主义', '辩证法', '哲学基本问题'],
        excerpt: '全部哲学，特别是近代哲学的重大的基本问题，是思维和存在的关系问题。人们决心在理解现实世界时按照它本身在每一个不以先入为主的唯心主义怪想来对待它的人面前所呈现的那样来理解。'
      },
      {
        title: '法德农民问题',
        author: 'engels', period: 'period3', year: 1894,
        topics: ['农民', '土地', '合作社', '工农联盟', '无产阶级'],
        excerpt: '我们预见到小农必然灭亡，但我们无论如何不要以自己的干预去加速其灭亡。当我们掌握了国家权力的时候，我们永远不会考虑用暴力去剥夺小农。'
      },
      {
        title: '卡·马克思《1848年至1850年的法兰西阶级斗争》一书导言',
        author: 'engels', period: 'period3', year: 1895,
        topics: ['革命策略', '普选权', '街垒战', '议会斗争', '马克思主义'],
        excerpt: '历史表明我们也曾经错了，我们当时所持的观点只是一个幻想。历史清楚地表明，当时欧洲大陆经济发展的状况还远没有成熟到可以铲除资本主义生产的程度。'
      }
    ]
  };

  /* ================================================================
     Part 2: 查询接口 — n-gram 文本相似度匹配
     ================================================================ */

  /** 按导师+时期筛选文章 */
  function getArticles(author, period) {
    var pool = ARTICLES[author] || [];
    if (!period || period === 'standard') return pool;
    return pool.filter(function (a) { return a.period === period; });
  }

  /**
   * 增强匹配：n-gram 中文相似度评分
   * 同时比对输入文本和文章 excerpt + topics 拼接
   * 返回 { article, score, detail: { excerptSim, topicSim, matchedPhrases } }
   */
  function matchByContent(author, text, topN) {
    topN = topN || 3;
    var pool = ARTICLES[author] || [];
    if (pool.length === 0) return [];

    var scored = pool.map(function (a) {
      // excerpt 文本相似度（主权重）
      var excerptSim = textSimilarity(text, a.excerpt || '');
      // topics 文本相似度（辅权重——把 topics 拼成文本）
      var topicText = (a.topics || []).join(' ');
      var topicSim = textSimilarity(text, topicText);
      // 综合分：excerpt 60% + topics 40%
      var score = excerptSim * 0.6 + topicSim * 0.4;
      return { article: a, score: score, detail: { excerptSim: excerptSim, topicSim: topicSim } };
    });

    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, topN);
  }

  /** 综合查询（增强版）：匹配 + 随机补充，返回带分数的结果 */
  function queryArticles(author, text, period, n) {
    n = n || 3;
    var pool = period && period !== 'standard'
      ? getArticles(author, period)
      : (ARTICLES[author] || []);
    if (pool.length === 0) return [];

    var scored = pool.map(function (a) {
      var excerptSim = textSimilarity(text, a.excerpt || '');
      var topicText = (a.topics || []).join(' ');
      var topicSim = textSimilarity(text, topicText);
      return { article: a, score: excerptSim * 0.6 + topicSim * 0.4 };
    });
    scored.sort(function (a, b) { return b.score - a.score; });

    // 取 top N，保证至少有 n 条（不足则随机补）
    var result = scored.slice(0, n);
    if (result.length < n) {
      var remaining = pool.filter(function (a) {
        return !result.some(function (r) { return r.article === a; });
      });
      while (result.length < n && remaining.length > 0) {
        var idx = Math.floor(Math.random() * remaining.length);
        result.push({ article: remaining[idx], score: 0 });
        remaining.splice(idx, 1);
      }
    }
    return result.map(function (r) { return r.article; });
  }

  /**
   * 风格比对：输出文本 vs 原文语料
   * 返回结构性差距报告，供 regeneration 时注入 Prompt
   */
  function compareStyle(outputText, author) {
    var pool = ARTICLES[author] || [];
    if (pool.length === 0) return null;

    // 1. 找 top 3 最相似的真实文章
    var matches = matchByContent(author, outputText, 3);

    // 2. 提取输出文本的风格特征
    var outputFeatures = extractStyleFeatures(outputText);

    // 3. 提取匹配文章的风格特征并取平均
    var corpusFeatures = { sentenceLength: 0, connectorDensity: 0, questionDensity: 0, exclaimDensity: 0, count: 0 };
    matches.forEach(function (m) {
      var feats = extractStyleFeatures(m.article.excerpt || '');
      corpusFeatures.sentenceLength += feats.sentenceLength;
      corpusFeatures.connectorDensity += feats.connectorDensity;
      corpusFeatures.questionDensity += feats.questionDensity;
      corpusFeatures.exclaimDensity += feats.exclaimDensity;
      corpusFeatures.count++;
    });

    if (corpusFeatures.count > 0) {
      for (var k in corpusFeatures) {
        if (k !== 'count') corpusFeatures[k] /= corpusFeatures.count;
      }
    }

    // 4. 生成差距报告
    var gaps = buildStyleGapReport(outputFeatures, corpusFeatures, author, matches);

    return {
      outputFeatures: outputFeatures,
      corpusFeatures: corpusFeatures,
      matchedArticles: matches.map(function (m) { return { title: m.article.title, excerpt: m.article.excerpt, score: m.score }; }),
      gaps: gaps,
      suggestions: buildSuggestions(gaps, author)
    };
  }

  /** 提取文本风格特征 */
  function extractStyleFeatures(text) {
    if (!text) return { sentenceLength: 0, connectorDensity: 0, questionDensity: 0, exclaimDensity: 0 };

    // 分句（按 。！？；\n）
    var sentences = text.split(/[。！？；\n]+/).filter(function (s) { return s.trim().length > 0; });
    var totalChars = text.replace(/[\s\n]/g, '').length;
    var sentenceCount = sentences.length || 1;

    // 平均句长（字符）
    var avgSentenceLen = totalChars / sentenceCount;

    // 连接词密度（由此可见/因此/但是/然而/所以/于是/从而/因而）
    var connectors = (text.match(/由此可见|因此|但是|然而|所以|于是|从而|因而|诚然|相反/g) || []).length;
    var connectorDensity = connectors / Math.max(totalChars / 100, 1); // 每100字

    // 反问密度
    var questions = (text.match(/[？?]/g) || []).length;
    var questionDensity = questions / Math.max(totalChars / 100, 1);

    // 感叹密度
    var exclams = (text.match(/[！!]/g) || []).length;
    var exclaimDensity = exclams / Math.max(totalChars / 100, 1);

    // 隐喻标记（"像""如""好比""仿佛""正如""一样"）
    var metaphors = (text.match(/像|如|好比|仿佛|正如|一样/g) || []).length;

    return {
      sentenceLength: Math.round(avgSentenceLen),
      connectorDensity: Math.round(connectorDensity * 10) / 10,
      questionDensity: Math.round(questionDensity * 10) / 10,
      exclaimDensity: Math.round(exclaimDensity * 10) / 10,
      metaphorCount: metaphors,
      totalChars: totalChars
    };
  }

  /** 生成风格差距报告 */
  function buildStyleGapReport(output, corpus, author, matches) {
    var gaps = [];

    // 句长差距
    var slGap = output.sentenceLength - corpus.sentenceLength;
    if (Math.abs(slGap) > 8) {
      gaps.push({
        type: 'sentenceLength',
        direction: slGap > 0 ? '过长' : '过短',
        output: output.sentenceLength + '字/句',
        corpus: corpus.sentenceLength + '字/句',
        severity: Math.abs(slGap) > 15 ? 'high' : 'medium',
        hint: slGap > 0
          ? '句子比' + (author === 'marx' ? '马克思' : '恩格斯') + '原文长' + Math.abs(Math.round(slGap)) + '字。尝试把长句拆成两段，让论证节奏更接近原文。'
          : '句子比原文短' + Math.abs(Math.round(slGap)) + '字。适当展开中间论证步骤。'
      });
    }

    // 连接词密度差距
    var cdGap = output.connectorDensity - corpus.connectorDensity;
    if (Math.abs(cdGap) > 0.5) {
      gaps.push({
        type: 'connectorDensity',
        direction: cdGap > 0 ? '过多' : '不足',
        output: output.connectorDensity + '/百字',
        corpus: corpus.connectorDensity + '/百字',
        severity: Math.abs(cdGap) > 1 ? 'high' : 'medium',
        hint: cdGap > 0
          ? '连接词使用频率高于原文。减少"因此""但是"的显式使用——让论证本身的结构承担过渡功能。'
          : '连接词使用不足。' + (author === 'marx' ? '马克思' : '恩格斯') + '的原文中"因此""但是""由此可见"是论证的骨架标志——你需要它们来标出论证的转折点。'
      });
    }

    // 反问密度差距
    var qGap = output.questionDensity - corpus.questionDensity;
    if (Math.abs(qGap) > 0.3) {
      gaps.push({
        type: 'questionDensity',
        direction: qGap > 0 ? '过多' : '偏少',
        output: output.questionDensity + '/百字',
        corpus: corpus.questionDensity + '/百字',
        severity: 'low',
        hint: qGap > 0
          ? '反问句使用频率超过原文。减少反问，让判断句直接说出——不需要用问句铺垫。'
          : '可以在关键转折处加入1个反问句来激活论证——' + (author === 'marx' ? '马克思在《宣言》中经常这样做。' : '但不要学列宁的连续反问。')
      });
    }

    // 隐喻密度
    if (output.metaphorCount === 0 && matches.length > 0) {
      gaps.push({
        type: 'metaphor',
        direction: '缺失',
        output: '0处',
        corpus: '原文中有类比/比喻',
        severity: 'medium',
        hint: author === 'marx'
          ? '输出中没有出现类比或隐喻。马克思经常用"正如……""就像一个……"来照亮抽象概念。检查是否有合适的位置加入一处具体类比。'
          : '输出中没有比喻。恩格斯善于用日常事物的比喻来降低抽象概念的阅读难度——"啃酸果""高超的胡说"之类的干燥幽默。'
      });
    }

    return gaps;
  }

  /** 根据差距生成再生建议（注入 Prompt） */
  function buildSuggestions(gaps, author) {
    if (gaps.length === 0) return null;

    var high = gaps.filter(function (g) { return g.severity === 'high'; });
    var med  = gaps.filter(function (g) { return g.severity === 'medium'; });

    var lines = [];
    lines.push('【风格比对反馈——上一次生成的不足】');
    if (high.length > 0) {
      lines.push('以下问题较严重，本次请优先修正：');
      high.forEach(function (g) { lines.push('- ' + g.hint); });
    }
    if (med.length > 0) {
      lines.push('以下可改进：');
      med.forEach(function (g) { lines.push('- ' + g.hint); });
    }
    return lines.join('\n');
  }

  /** 获取随机文章（无匹配时回退） */
  function getRandom(author, period, n) {
    n = n || 2;
    var pool = getArticles(author, period);
    if (pool.length === 0) return [];
    var result = [];
    var used = {};
    while (result.length < n && result.length < pool.length) {
      var idx = Math.floor(Math.random() * pool.length);
      if (!used[idx]) { used[idx] = true; result.push(pool[idx]); }
    }
    return result;
  }

  /* ================================================================
     Part 3: 蒸馏日志
     ================================================================ */
  var LOG_KEY = 'ms_distillation_log';
  var MAX_LOG_ENTRIES = 200;

  function logGeneration(entry) {
    try {
      var log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      var record = {
        timestamp: new Date().toISOString(),
        author: entry.author || '',
        period: entry.period || '',
        input_length: (entry.input || '').length,
        output_length: (entry.output || '').length,
        tokens: entry.tokens || 0,
        matched_articles: (entry.articles || []).map(function (a) { return a.title; }),
        input_type: entry.inputType || ''
      };
      // 如果有风格分析结果，一并保存
      if (entry.styleAnalysis) {
        record.styleAnalysis = {
          gaps: entry.styleAnalysis.gaps || [],
          outputFeatures: entry.styleAnalysis.outputFeatures || {},
          corpusFeatures: entry.styleAnalysis.corpusFeatures || {}
        };
      }
      log.push(record);
      if (log.length > MAX_LOG_ENTRIES) log = log.slice(-MAX_LOG_ENTRIES);
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
      return log.length;
    } catch (e) {
      return 0;
    }
  }

  function getDistillationLog() {
    try {
      return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch (e) { return []; }
  }

  function exportDistillationLog() {
    return JSON.stringify(getDistillationLog(), null, 2);
  }

  /* ================================================================
     Part 4: 导出
     ================================================================ */
  /**
   * 从蒸馏日志中读取最近 N 条某导师的记录
   * 聚合风格差距 → 用于 regeneration 时注入历史反馈
   */
  function getRecentFeedback(author, n) {
    n = n || 5;
    var log = getDistillationLog();
    var authorLogs = log.filter(function (entry) { return entry.author === author; }).slice(-n);
    if (authorLogs.length === 0) return null;

    // 如果有存储的风格分析结果，聚合它们
    var allGaps = [];
    authorLogs.forEach(function (entry) {
      if (entry.styleAnalysis && entry.styleAnalysis.gaps) {
        allGaps = allGaps.concat(entry.styleAnalysis.gaps);
      }
    });

    if (allGaps.length === 0) return null;

    // 按类型聚合最常见差距
    var gapTypes = {};
    allGaps.forEach(function (g) {
      if (!gapTypes[g.type]) gapTypes[g.type] = { count: 0, hint: g.hint, severity: g.severity };
      gapTypes[g.type].count++;
    });

    var sorted = Object.keys(gapTypes).sort(function (a, b) { return gapTypes[b].count - gapTypes[a].count; });
    var recurring = sorted.filter(function (k) { return gapTypes[k].count >= 2; }); // 出现2次以上的模式

    if (recurring.length === 0) return null;

    var lines = ['【历史模式——你在最近' + authorLogs.length + '次生成中反复出现以下问题】'];
    recurring.forEach(function (k) {
      lines.push('[' + gapTypes[k].count + '/' + authorLogs.length + '次] ' + gapTypes[k].hint);
    });
    return lines.join('\n');
  }

  window.ArticleDB = {
    articles: ARTICLES,
    getArticles: getArticles,
    matchByContent: matchByContent,
    getRandom: getRandom,
    queryArticles: queryArticles,
    // 风格比对闭环
    compareStyle: compareStyle,
    textSimilarity: textSimilarity,
    // 蒸馏日志
    logGeneration: logGeneration,
    getDistillationLog: getDistillationLog,
    exportDistillationLog: exportDistillationLog,
    getRecentFeedback: getRecentFeedback
  };

  console.log('[ArticleDB] V2.0 n-gram匹配 — Marx:' + (ARTICLES.marx || []).length + '篇, Engels:' + (ARTICLES.engels || []).length + '篇, Lenin:' + (ARTICLES.lenin || []).length + '篇, Stalin:' + (ARTICLES.stalin || []).length + '篇, Mao:' + (ARTICLES.mao || []).length + '篇');
})();
