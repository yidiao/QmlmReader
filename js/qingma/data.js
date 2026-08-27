/* ================================================================
   data.js — 敌人定义 · 题库 · 道具
   青马的奇妙冒险 v0.1
   ================================================================ */

// ── 枚举 ──────────────────────────────────────────────
const ArgumentType = {
  RATIONAL:  '理性辩证',
  REDUCTIO:  '归谬反诘',
  CLASS_CRITIQUE: '阶级批判',
  EMOTIONAL: '感性批判',
};

const Faction = {
  GU_DONG: '古董派',   // 封建/极右/复辟
  LIE_TU:  '裂土派',   // 分裂主义
  WAI_LAI: '外来派',   // 自由主义/境外势力
  BI_MU:   '闭目派',   // 机械静止/拒绝反思
  JI_ZUO:  '极左派',   // 脱离实际的左倾
  XU_WU:   '虚无派',   // 历史虚无/消解严肃
};

// ── 敌人定义 ──────────────────────────────────────────
const ENEMIES = {
  huang_han:  { name: '蝗旱',   faction: Faction.GU_DONG, desc: '极端汉族主义者，视其他民族为附庸。', weakness: ArgumentType.RATIONAL, guide: '用历史唯物主义拆解"正统观"，点破中华文明本就是多民族共同创造。', hp: 2, special: '无特殊能力', taunt: '「汉族才是中华正统，少数民族都是依附者罢了。」', story: '蝗旱总觉得自己是"中华文明的唯一继承者"，逢人就翻人家家谱。他翻来翻去，发现他自己往上数八代也沾着少数民族血统。从那以后他顿悟了，设计了一套基于手机尾号判断种族纯净的规则。' },
  hua_na:     { name: '华钠',   faction: Faction.GU_DONG, desc: '比皇汉更激进，带有纳粹式的种族优越论。', weakness: ArgumentType.RATIONAL, guide: '戳破其种族优越论背后的虚构与自卑。', hp: 2, special: '无特殊能力', taunt: '「人种决定智商，优等民族天生就该统治。」', story: '华钠整天鼓吹"种族优越论"，宣扬自己在元素周期表无与伦比的位置。可是有一天爱上了一个卤素女子——“我们优越的种族结合后一定会诞生无与伦比的怪物！”他这样幻想着他不存在的孩子，氯化钠的完美未来。' },
  kong_lao_da:{ name: '孔牢大', faction: Faction.GU_DONG, desc: '封建礼教的卫道士，一切以古为尊。', weakness: ArgumentType.REDUCTIO, guide: '归谬"传统=智慧"的静止观，点破礼教吃人。', hp: 2, special: '含精英个体（5 血）', taunt: '「传统就是老祖宗的智慧，改不得，改了就是数典忘祖。」', story: '孔牢大把"礼教"挂在嘴边，自己却用智能手机刷短视频。一天他刷到了千年老药方：一硫二硝三木炭便包治百病，他亲自动物实验后果然有效：腰不酸腿不疼，就连心脏也不跳了！但是没有人同意他的推销——除非火药也算药。' },
  fen_lie:    { name: '酚鬣',   faction: Faction.LIE_TU,  desc: '分裂势力的鼓吹者，煽动地方民族情绪。', weakness: ArgumentType.RATIONAL, guide: '用民族平等与大一统历史拆解分裂话术。', hp: 2, special: '无特殊能力', taunt: '「我们民族要独立，不能继续被奴役。」', story: '酚鬣和那草原上的鬣狗远亲不一样。那帮子穷亲戚只会抢猎豹们的食物吃，而他们却自食其力地吸着本土的血的同时，那颗渴望着“复国”的拳拳之心却始终没有被“腐化”。“美蜥鲂还是聪明，知道望梅止渴哩，画的甜甜圈果然比手里的馒头好吃。”那些不眠的夜里他这样想着。' },
  du_chong:   { name: '蠹虫',   faction: Faction.LIE_TU,  desc: '各种独立运动的代言人，啃噬统一之根基。', weakness: ArgumentType.RATIONAL, guide: '揭穿其"自决"背后的外部势力操控。', hp: 2, special: '无特殊能力', taunt: '「我们有权自决，这是国际法保障的。」', story: '蠹虫小时候在看见有人在厕所门前卖“专属厕纸”，买完之后就能宣告自己能包下公厕的一个小单间。可是当他把写着所谓“规则”的厕纸用掉后，就有下一个宣告“坑位自决”的人占了坑了。卖厕纸那人说：手里没钱，肚中无货，便把蠹虫赶出了公厕。' },
  man_yi:     { name: '鳗衣',   faction: Faction.LIE_TU,  desc: '精神清朝贵族，幻想复辟旧秩序。', weakness: ArgumentType.REDUCTIO, guide: '归谬其复辟妄想，点破旧秩序早被历史埋葬。', hp: 2, special: '无特殊能力', taunt: '「大清要是不亡，我们现在还是天朝上国。」', story: '别人问鳗衣为什么纹着鳗鱼却单单不纹眼睛，他说如果纹了，鳗人就会重新活过来，自己不过是一件被骑在头上的鳗人用之即弃的破旧衣裳罢了。' },
  mu_tian:    { name: '牧田',   faction: Faction.WAI_LAI, desc: '自由派旗手，迷信市场万能。', weakness: ArgumentType.RATIONAL, guide: '用政治经济学揭示"市场万能"背后的资本逻辑。', hp: 2, special: '无特殊能力', taunt: '「市场是万能的，政府别管，让看不见的手来调节。」', story: '牧田喜欢自由的生活，喜欢自由地生，自由地死，自由地选择失业或被剥削。某天他心血来潮做了个人格测试，结果发现自己并不是耶稣，而是希*勒。' },
  mei_xi_fang: { name: '美蜥鲂', faction: Faction.WAI_LAI, desc: '境外美帝国主义的精神买办。', weakness: ArgumentType.RATIONAL, guide: '揭穿其"普世价值"背后的霸权与双标。', hp: 2, special: '无特殊能力', taunt: '「美国是自由灯塔，全世界都该向它学习。」', story: '美蜥鲂逢人就说"给我一个杠杆，我能撬动整个股市"，但是他一个杠杆下去，把背着几十年房贷的房子撬没了。' },
  she_mian:    { name: '蛇黾',   faction: Faction.WAI_LAI, desc: '社会民主主义者，鼓吹改良妥协、反对革命。', weakness: ArgumentType.RATIONAL, guide: '用"改良不能触及根本矛盾"驳斥其妥协路线。', hp: 2, special: '可教化（觉悟≥7）', taunt: '「革命太激进了，走议会道路慢慢改良多好。」', story: '蛇黾年轻时也热血过，后来进了体制，学会了"成熟"。如今他最爱说"要讲策略"，翻译过来就是：我已经有编制了，你们继续。', redeemable: true },
  xiao_fen_hong:{ name: '小粉红', faction: Faction.BI_MU,  desc: '无脑鼓吹抽象的中国、极端排外的网络小将。', weakness: ArgumentType.REDUCTIO, guide: '归谬极端排外，点破"盲目排外"不等于爱国。', hp: 2, special: '可教化（觉悟≥7）', taunt: '「不买国产就是不爱国，滚出中国！」', story: '小粉红把抽象的"爱国"挂在嘴上，逢人就扣帽子。冲国优先！不买冲国制造一律叛徒！但某日他下班途中看到消防车需要搭把手时，却以“有事要忙”视而不见。再然后，他的家被烧了精光。', redeemable: true },
  jian_zhi:   { name: '剪纸',   faction: Faction.BI_MU,   desc: '建制派，机械静止地拥护现行一切。', weakness: ArgumentType.RATIONAL, guide: '用矛盾运动观拆解"现状即合理"的静止思维。', hp: 2, special: '无特殊能力', taunt: '「现状就是最好的，改什么改，别添乱。」', story: '剪纸有所期待。他们期待着世界运行的规律一成不变，他们期待着蛋糕做得足够大就会让所有人吃饱，他们期待着多解决问题、少谈点主义，他们期待着当下不过是一时的阵痛、不过是穷尽智慧下的无奈选择。他们期待着，直到夕阳落山，明日永不再来。' },
  tao_zhong_ren:{ name: '套中人', faction: Faction.BI_MU, desc: '政治冷淡者，自以为清醒实则麻木。', weakness: ArgumentType.EMOTIONAL, guide: '用情感唤醒其麻木，点破"遗世独立"的虚妄。', hp: 2, special: '可教化（觉悟≥7）', taunt: '「政治跟我没关系，我过好自己的小日子就行。」', story: '那双自诩看穿一切的眼睛，不过是早夭的火种。被私有制和资产阶级法权潜移默化的思想，使得装在套子里的人成为了旧制度忠实的卫道士，可悲的是，在幡然醒悟前，他们自以为保卫自己的“田园牧歌”不受政治冲击，而不是充当资本家和官僚主义者的口舌。', redeemable: true },
  tuo_pai:    { name: '沱牌',   faction: Faction.JI_ZUO,  desc: '托派，脱离现实条件空谈革命。', weakness: ArgumentType.RATIONAL, guide: '用"具体问题具体分析"驳斥其脱离实际的空谈。', hp: 2, special: '无特殊能力', taunt: '「现在的一切都不纯粹，都是修正主义！」', story: '在成为沱牌前，他更像一位优秀的数学家，无论多么庞杂的数据，他都能无限细分。在成为沱牌之后，他的得意之作则是不下325种永动机专利权——据我所知，其中324项还在审批。剩下的？哦，我当时缺纸用了。' },
  wang_zuo:   { name: '旺座小鬼', faction: Faction.JI_ZUO, desc: '不学无术的网络"左派"小鬼。', weakness: ArgumentType.RATIONAL, guide: '用扎实的理论功底碾压其半吊子"左"话术。', hp: 2, special: '可教化（觉悟≥7）', taunt: '「细节左，细节右，细节细节」', story: '旺座小鬼张口闭口"左派"，实际一本原著都没读完。他最大的理论成果，是在看完视频后到处刷烂梗。他很得意，仿佛春天般分享着不能被打断的热情，并且自豪地联系起自己和左翼运动有50%的联系。就我所知，他还和香蕉有约60%的基因相同。', redeemable: true },
  xu_wu:      { name: '虚无主义者', faction: Faction.XU_WU, desc: '历史虚无主义者，无法正确认识历史。', weakness: ArgumentType.EMOTIONAL, guide: '用历史事实与情感力量戳穿其"历史无用"的虚无。', hp: 2, special: '无特殊能力', taunt: '「历史都是胜利者写的，哪有什么真相。」', story: '虚无主义者和套中人论过谁更看破红尘，虽然后来虚无主义者选择性遗忘了他失败的历史。' },
  jiang_tai_gong:{ name: '姜太公', faction: Faction.XU_WU, desc: '直钩钓鱼的乐子人，消解一切严肃讨论。', weakness: ArgumentType.EMOTIONAL, guide: '别接钩，用感性批判戳破其"消解一切"背后的冷漠。', hp: 2, special: '无特殊能力', taunt: '「咦？这都有鱼上钩的哟」', story: '一个人喜欢看着一群人因为自己揣着明白装糊涂而吵起来。一个人喜欢被两批人厌烦。一个人，一个人、如果这样也算对生活的热爱，为消解严肃、从热情至无感。' },
};

// ── 题库 ──────────────────────────────────────────────
// 每题：id, enemyType, content, weakness, comboThreshold, options[]
// option: text, type, stars, effect: { hp, confidence, dialectic, classStand }

const QUESTIONS = [

  // ═══ 蝗旱（极端汉族主义）═══
  {
    id: 'huang_han_01', enemyType: 'huang_han',
    content: '汉族是中华文明的唯一创造者，少数民族不过是依附者罢了。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '中华文明本身就是多民族共同创造的结果——从北魏到元朝到清朝，各民族的制度和文化都深刻塑造了今天的中国。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '按你的逻辑，汉族的胡服骑射、胡床、葡萄都是从少数民族学的，你是不是也该把自己开除出汉族？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '说这种话的人，翻翻自己家谱，往上数八代还不一定是什么族呢。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: '把中华文明说成汉族一家之功，是把历史上的阶级压迫、民族压迫统统抹掉，用"血统论"代替历史唯物主义——这才是对多民族共同奋斗史的最大背叛。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
      { text: '【杀招】民族问题的实质是阶级问题在民族关系上的表现——只有消灭阶级压迫，才能真正实现民族平等。这是历史唯物主义的根本结论，不容诡辩。',
        type: ArgumentType.RATIONAL, stars: 4, requires: { attr: 'confidence', above: 7 }, effect: { hp: -4, confidence: 2, dialectic: 1, classStand: 1 } },
    ],
  },
  {
    id: 'huang_han_02', enemyType: 'huang_han',
    content: '少数民族优惠政策是对汉族的逆向歧视！凭什么高考给他们加分？',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '民族政策的核心是平等而非平均。少数民族在历史上长期处于边缘地位，教育资源和经济发展存在客观差距，优惠政策是弥补结构性不平等的手段，而不是特权。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 0, classStand: 1 } },
      { text: '你是不是也觉得给贫困地区加分是逆向歧视富人？教育公平的本质是补偿性正义，不是每个人在同一条起跑线上。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你盯着那几分不放的样子，到底是在乎公平，还是在乎自己少了几分优势？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: -1, dialectic: 0, classStand: 0 } },
      { text: '盯着几分的加分算计，恰恰暴露了既得利益者的心态：把民族平等当零和游戏，却看不见少数民族在历史上被剥削、被边缘化的结构性不公。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'huang_han_03', enemyType: 'huang_han',
    content: '少数民族应该融入汉族主流文化，保留自己的语言习俗就是搞特殊化。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '民族融合不等于民族同化。马克思主义民族观的核心是各民族一律平等，包括文化上的平等——保留本民族语言和习俗是基本权利，不是特殊化。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '那你先让全世界汉族把英语扔了，毕竟那也是"别人的语言"——保留自己文化叫特殊化，那你这辈子别吃肯德基了。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你所谓的"主流文化"，不就是想让人家忘掉自己是谁吗？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: '所谓"融入主流"，本质是让少数民族放弃自己的文化身份、向占统治地位的文化臣服——这是文化霸权，不是民族平等。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'huang_han_04', enemyType: 'huang_han',
    content: '你看看那些少数民族自治区，拿了多少转移支付？全是汉族在养他们！',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '转移支付是国家宏观调控的手段，东部沿海也拿了西部输送的能源和资源。用"谁养谁"来理解国家经济，是把民族关系简化成了菜市场算账。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '那你把西气东输、西电东送的账也算算？新疆的天然气、内蒙古的煤炭运到东部的时候，你咋不说汉族在吸少数民族的血？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"养"这个字从你嘴里说出来，透着一股市侩气和优越感。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: -1, dialectic: 0, classStand: 0 } },
      { text: '"谁养谁"的算计，把劳动人民内部的互助关系歪曲成民族对立，却不去问真正靠剥削过活的是谁——这是挑动民族矛盾，替真正的剥削者转移视线。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'huang_han_05', enemyType: 'huang_han',
    content: '中华文明五千年，汉族才是正统。其他民族建立的朝代都不算数。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '"正统"本身就是封建王朝的政治概念，不是历史唯物主义的标准。元朝的大一统、清朝的疆域奠定——没有这些，今天的中国版图根本就不存在。历史不是汉族一家的家谱。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '照你这标准，唐朝李家有鲜卑血统，是不是也得开除？那中华文明就不是五千年了，你先减掉一大半再说话。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你心中的"正统"不过是一面镜子，照出来的只有你自己的狭隘。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: '"正统"是封建王朝用来维护等级秩序的话语，今天还抱着它不放，就是替旧时代的压迫等级招魂。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 华钠（纳粹式种族主义）═══
  {
    id: 'hua_na_01', enemyType: 'hua_na',
    content: '中华民族需要保持血统纯正，混血就是在稀释我们的优良基因。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '中华民族本身就是一个不断融合的概念——从春秋战国的蛮夷戎狄到魏晋南北朝的民族大迁徙，"纯正血统"在历史上从未存在过。你的"基因论"抄的是纳粹的人种学，不是中国历史。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 0, classStand: 0 } },
      { text: '"优良基因"？那按你的标准，你是不是应该先去做个基因检测？万一测出来祖上有匈奴鲜卑血统，你是不是要把自己先"提纯"了？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '用"基因"和"血统"来定义民族，你已经滑到法西斯那一边去了。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把血统当基因优劣，不过是旧贵族维护特权的遮羞布。劳动者从不靠出身立足，靠的是双手创造世界。这套血统论，只为分化人民、掩盖阶级剥削。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'hua_na_02', enemyType: 'hua_na',
    content: '你看看犹太人控制了多少美国媒体和金融？咱们中国也得防着这一手。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '反犹主义是欧洲资本主义危机的替罪羊，马克思在《论犹太人问题》里早就分析过——把社会矛盾嫁祸给一个民族，是统治阶级转移视线的手段。你在中国用这套话术，学得倒挺快。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 0, classStand: 0 } },
      { text: '你这套词儿，把"犹太人"换成"中国人"，就是19世纪美国排华法案的宣传单原文。自己变成自己骂过的人，感觉如何？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '把复杂的世界归结为"某群人控制了某样东西"——这种思维不是批判，是懒惰。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把华尔街的掠夺说成“犹太人控制”，是用民族标签掩盖金融资本剥削全世界的真相。劳动者该警惕的是资本垄断，不是某个族群。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'hua_na_03', enemyType: 'hua_na',
    content: '强者就该支配弱者，这是自然法则。中国强大了就该当老大，有什么错？',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '社会达尔文主义不是马克思主义。人类社会的发展方向不是"强者支配弱者"，而是消灭一切人对人的支配。用丛林法则来理解国际关系，恰恰落入了帝国主义的逻辑陷阱。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '你这套说辞跟19世纪英国殖民者一模一样——"我们征服印度是为了传播文明"。侵略者永远有借口，你不过是换了个马甲。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '把法西斯叫作"自然法则"，你缺的不是知识，是良心。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把丛林法则包装成天经地义，不过是替垄断资本张目。劳动者创造的价值被掠夺，却要我们感恩强者的施舍。历史由人民书写，不是靠拳头称王。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'hua_na_04', enemyType: 'hua_na',
    content: '你看北欧那些国家，就是因为人种优秀才发达。中国要强大也得靠人种优势。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '北欧的发达是特定历史条件和制度选择的结果，不是人种。冰岛一千年前还是欧洲最穷的地方之一，人种没变，是生产方式和社会制度变了。你的"人种决定论"连基本的历史事实都解释不了。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 0, classStand: 0 } },
      { text: '哦，那为什么同一个"优秀人种"在维京时代还在划船抢劫，到了现代突然就发达了？基因突变了几百年才生效是吧？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你眼里的世界就是人种优劣排列——这种世界观本身，就是最劣等的。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: -1, dialectic: 0, classStand: 1 } },
      { text: "把发展归因于人种，不过是为资本垄断开脱。真正创造财富的劳动者被抹杀，剥削制度倒成了“优秀”的证明。无产阶级要的是打破阶级壁垒，不是比拼血统。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'hua_na_05', enemyType: 'hua_na',
    content: '我们现在就应该建立以汉族为核心的中央集权帝国，把周边都纳入版图。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '帝国主义扩张从来不是为了人民的利益，而是为了资本和统治者的利益。马克思主义反对一切形式的民族压迫——你今天去压迫别的民族，明天你就会被自己的统治者压迫得更狠。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '你这话跟当年日本军部说的"大东亚共荣圈"有什么区别？换个民族当主角，核心逻辑一模一样。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你想当帝国的皇帝，但你只会是帝国第一个被碾碎的炮灰。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "将民族压迫包装成“帝国伟业”，暴露的是地主买办阶级扩张私利的野心，与工农大众求解放、谋幸福的根本利益背道而驰。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 孔牢大（封建复辟）═══
  {
    id: 'kong_lao_da_01', enemyType: 'kong_lao_da',
    content: '当今社会道德沦丧，就是因为抛弃了儒家传统。三纲五常才是治世之道。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '儒家思想中有值得继承的文化精华，但"三纲"本质上是封建等级制度——君为臣纲、父为子纲、夫为妻纲，是服务于封建地主阶级的意识形态。用封建伦理来解决现代社会问题，是开历史的倒车。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '按"三纲"来，你老板就是你爹，你得无条件服从——你真愿意在公司里管领导叫爸爸？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '把"道德沦丧"归咎于不读《弟子规》——你怕是没见过那些一边背《论语》一边捞钱的伪君子。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "将“三纲五常”奉为治世灵药，不过是替旧地主阶级招魂，为压迫秩序辩护。劳动者要的是平等解放，而非跪着求来的“纲常”。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'kong_lao_da_02', enemyType: 'kong_lao_da',
    content: '女子无才便是德。现在女权太过了，女人就该回归家庭。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '妇女解放是社会进步的标尺。恩格斯在《家庭、私有制和国家的起源》中早就指出，妇女受压迫的根源是私有制，不是"天性"。让女性回归家庭，本质上是让女性重新沦为男性的私有财产。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '"女子无才便是德"——说这话的人自己科举落第了几次？自己没本事就想让所有女人也别有本事。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你口中"该回归家庭"的女人，正是被你这句话剥夺了她自己选择人生的权利。你凭什么替她做决定？',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这话是拿旧道德给封建余孽当遮羞布，替剥削阶级压住女人的手脚。可劳动妇女从来是生产的主力，谁想用灶台捆住她们，谁就是替老板省工钱。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'kong_lao_da_03', enemyType: 'kong_lao_da',
    content: '传统就是老祖宗的智慧，不能随便改。改了就是数典忘祖。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '传统本身也是不断演变的——今天的"传统"可能是两百年前的"改革"。历史唯物主义告诉我们，上层建筑必须适应经济基础，死守不变的传统只会阻碍社会发展。缠足也是传统，你打算恢复吗？',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '按照这个逻辑，你现在就应该穿汉服、写甲骨文、坐马车——毕竟都是"老祖宗的智慧"。你用手机发这条消息的时候，数典忘祖了吗？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '把传统当神像供着的人，往往连自己供的是什么都不知道。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "传统是统治阶级写就的护身符，劳动者从来只是被规定的对象。守住旧规矩，就是守住既得利益者的饭碗。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'kong_lao_da_04', enemyType: 'kong_lao_da',
    content: '年轻人就该听长辈的，这是天经地义。什么独立思考，就是叛逆。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '尊重长辈不等于盲从。马克思主义的认识论强调实践是检验真理的唯一标准，不是年龄。如果年轻人的独立思考就是叛逆，那五四运动的先辈们全都是"叛逆"，你今天还能坐在这里说话吗？',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你说的"天经地义"在鲁迅那个年代叫"吃人的礼教"。长辈说的都对——这话你自己信吗？你小时候你爸还跟你说吃西瓜籽肚子里会长西瓜呢。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你不是在维护"孝道"，你是在维护控制别人的权力。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这话是替旧规矩站台，好让年轻人继续当听话的耗材。长辈若站在剥削那头，听他的就是替资本家磨刀。劳动者要翻身，靠的是自己睁眼看路。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'kong_lao_da_05', enemyType: 'kong_lao_da',
    content: '礼崩乐坏的时代，就需要圣人出来重新定规矩。你们这些马克思主义者就是太讲平等，把社会搞乱了。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '"圣人定规矩"是英雄史观，不是群众史观。马克思主义认为历史是人民群众创造的，不是圣人创造的。你所怀念的"规矩"，不过是封建等级制——那才是真正的"礼崩乐坏"：崩的是劳动者的尊严，坏的是被压迫者的自由。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '你说的"圣人"——孔子周游列国的时候被各国国君赶得到处跑，孟子一辈子也没当上大官。真按你的标准，他们自己就是当时社会的失败者。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你口中"太讲平等"的社会，正是几千万人摆脱贫困的社会。你不喜欢的不是"乱"，是人民站起来了。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "所谓“圣人定规”，不过是替旧秩序缝补裂痕的遮羞布。礼乐从来有阶级，奴隶主定礼，地主定法，今天谁定规矩，谁就握紧鞭子。劳动者要的是自己掌尺，不是换一个圣人来量。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 酚鬣（分裂势力）═══
  {
    id: 'fen_lie_01', enemyType: 'fen_lie',
    content: '我们有自己的语言和文化，凭什么要跟你们在一起？独立建国才是出路。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '民族自决权不等于分离权。列宁明确区分了"民族自决"和"民族分离"——在统一的多民族国家框架内实现民族区域自治，才是符合各族人民根本利益的道路。分裂只会让所有民族沦为外部势力的棋子。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '有自己的语言文化就要独立——那广东人说粤语、吃早茶，是不是也该独立？语言文化多样性恰恰是统一国家的常态，不是分裂的理由。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"独立建国"——你说的这几个字，背后是多少普通人的血与火？你准备自己上前线，还是让别人替你送命？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把语言和文化当作割据的筹码，暴露的是地方权贵想借“独立”之名垄断资源、奴役劳动者的私心。真正该打破的，是阶级压迫的边界，而非人民的团结。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'fen_lie_02', enemyType: 'fen_lie',
    content: '民族区域自治是虚假的自治，实权都在中央手里。我们要的是真正的自决。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '民族区域自治制度保障了少数民族在语言、教育、文化、干部选拔等方面的权利。自治不是主权——在多民族国家中，中央与地方的关系是民主集中制下的统一，而不是邦联式的各自为政。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '你说的"真正的自决"是什么？是像科索沃那样——从南联盟分裂出去，然后变成美国的军事基地？你的"理想"实现了，你的人民却是去当炮灰。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你口中的"虚假自治"，恰恰保护了你的同胞能用自己的语言上学、看病、打官司。你想要的是权力，不是人民的福祉。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把民族问题包装成“自决”幌子，不过是想替旧势力夺回特权。各民族劳动者要的是共同发展，不是谁再骑到谁头上。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'fen_lie_03', enemyType: 'fen_lie',
    content: '历史上我们本来就是一个独立的国家，只是后来被吞并了。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '历史不是静止的切片。中国历史上各民族政权之间的关系是复杂的历史进程——有战争也有和亲、有对峙也有融合。用现代民族国家的概念去切割古代历史，本身就是非历史的。今天的统一多民族国家是长期历史发展的结果，不是谁"吞并"了谁。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '历史上"独立"——你说的是哪个朝代？吐蕃王朝？那按这个逻辑，意大利应该恢复罗马帝国、埃及应该恢复法老王朝。历史疆域不是你现在搞分裂的筹码。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你拿几百年前的事为今天的分裂背书，不过是在借古人的尸骨给自己搭台阶。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“独立”挂在嘴边的人，从没问过矿工和佃农是否分到过一亩田。他们怀念的，不过是自己祖上能骑在劳动者头上收租的旧时光。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'fen_lie_04', enemyType: 'fen_lie',
    content: '看看全世界，苏格兰在公投、加泰罗尼亚在公投——我们为什么不能公投？',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '苏格兰公投是英国法律框架内的程序，加泰罗尼亚公投被西班牙宪法法院判定非法——你举的两个例子恰好说明：分裂公投在绝大多数国家都是违宪的。民族自决权不等于单方面宣布独立的权利。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '苏格兰公投失败了，加泰罗尼亚的组织者流亡了——你接着举例子啊。闹独立的人被抓了，你在网上喊口号，这叫"共同奋斗"？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '别人的分裂公投，给你当论据——这跟"别人家孩子也打架所以我打架没错"有什么区别？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把民族自决挂在嘴边的人，从不提苏格兰油田利润流向谁的口袋。公投旗号下，是资产阶级借选票转移阶级矛盾，让工人继续为资本卖命。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'fen_lie_05', enemyType: 'fen_lie',
    content: '我们被压迫了几百年！现在是时候清算这笔账了。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '历史上的民族压迫是客观存在的，但清算历史旧账不是走向未来的方式。新中国的民族政策恰恰是要终结历史上一切形式的民族压迫——把历史仇恨当作政治动员的工具，最终伤害的不是"压迫者"，而是你自己民族的未来。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '清算是吧？那你先算算——你祖上是谁压迫的、压迫了多少年、怎么赔偿——算得清吗？你要的不是正义，你要的是一本永远算不完的账，好让自己永远有理由仇恨。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你在这里喊"清算"的时候，你的同胞需要的是工作、教育和未来——不是你的仇恨。你把他们绑在你的政治野心上，是在害他们。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把受剥削的苦难过成讨债的生意，不过是想换个位置继续吃人。劳动者要的是砸碎锁链，不是争当新锁链的工匠。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 蠹虫（各类独立运动）═══
  {
    id: 'du_chong_01', enemyType: 'du_chong',
    content: '我们有不同的历史遭遇和发展道路，统一本来就是强加的。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '统一不是强加的，是中国各族人民在近代反帝反封建斗争中共同缔造的。各民族共同抵御外侮、共同建立新中国——这段共同的历史比任何差异都更有分量。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '按你的逻辑，不同的历史遭遇就该分家——那中国每个省历史遭遇都不一样，是不是该分成三十四国？多样性不等于分裂的理由。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你说"统一是强加的"——但分裂的代价你付得起吗？流血的不是你，是那些被你煽动起来的老百姓。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“统一”说成强加，不过是旧特权阶层为保住割据利益编的遮羞布。劳动者从来靠团结求生存，分裂只会让资本分而治之，榨取更狠。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'du_chong_02', enemyType: 'du_chong',
    content: '你看那些小国——新加坡、卢森堡——不也过得很好？小国更有灵活性。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '新加坡和卢森堡的成功有极其特殊的历史和地缘条件，无法复制。绝大多数小国在国际体系中处于依附地位——经济上受制于人、安全上仰人鼻息。这不是"灵活"，是脆弱。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你只挑了成功的例子。海地也是小国，索马里也是小国——你怎么不提？拿幸存者偏差当论据，这叫选择性失明。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你想当新加坡——但你更可能变成下一个海地。到那时候，你还会说"小国更好"吗？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "小国的繁荣是依附性红利，是国际资本链条上的特例，掩盖着全球南方亿万劳工的剥削。你们只见弹丸之地的橱窗，却看不见跨国资本抽干的血汗。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'du_chong_03', enemyType: 'du_chong',
    content: '国际上那么多国家支持我们！国际社会站在我们这边。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '国际承认不是一个道德标准——它是大国博弈的结果。美国承认科索沃但不承认克里米亚，承认南苏丹但封锁古巴——你以为的"国际社会支持"，不过是某些大国把你当棋子。棋子的下场从来不是自己说了算的。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '那你数数，联合国193个成员国里，有几个承认你口中那个"国家"？一个巴掌数得过来吧？这就是你说的"国际社会"？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"国际支持"——当年日本侵略中国的时候也说"国际社会支持建立大东亚共荣圈"。侵略者永远有"国际支持"。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“国际支持”挂在嘴边的，从来不是码头工人和田间农户，而是分食利益的买办与食利者。他们借洋人声势，压本国劳动者，这“支持”二字，不过是他们分赃宴上的祝酒词。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'du_chong_04', enemyType: 'du_chong',
    content: '我们不是要分裂，我们是要民主自决——这是普世价值！',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '"民主自决"的前提是承认一个政治共同体的存在。你所在的地区从来不是独立的政治实体，而是中国领土不可分割的一部分。把分离主义包装成"民主"，不过是给分裂披上一件好看的外衣。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"普世价值"——你说这句话的时候，用的是美国政府的标准还是联合国宪章的标准？联合国宪章讲的是主权国家领土完整，没讲过鼓励分裂。你引用错文件了，回去重看。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '把"分裂"叫作"民主"，就像把抢劫叫作"财富再分配"——换个好听的名字，改变不了本质。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把“民主自决”挂在嘴边的，从不是田间工厂里的劳动者，而是想夺权分利的旧势力。他们怕的正是工农团结成铁板一块，才拿漂亮话当刀，割开我们本就不多的家底。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'du_chong_05', enemyType: 'du_chong',
    content: '统一给我们的经济带来什么好处了？我们的人均GDP还不如对岸！',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '经济差距是发展过程中的不平衡问题，不是分裂的理由。统一市场的规模效应、财政转移支付、基础设施互联互通——这些才是缩小差距的基础。分裂只会让落后地区更加边缘化。看看世界各地，最穷的国家几乎都是分裂和内战的产物。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '那你看看对岸——军费占GDP多少？邦交国剩下几个？你以为经济好是靠分裂来的？靠的是统一的大陆市场给它输血。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你只盯着GDP数字——但你的同胞需要的是稳定的工作和生活，不是你的政治野心。分裂之后GDP就能涨？你拿什么保证？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: -1, dialectic: 0, classStand: 0 } },
      { text: "把两岸发展差异归咎于统一，是拿买办资本的账本算劳动者的饭碗。对岸的GDP里有几成是血汗工厂的加班费？我们的人均，是十四亿人分蛋糕，不是四万人分金库。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 鳗衣（满清复辟）═══
  {
    id: 'man_yi_01', enemyType: 'man_yi',
    content: '清朝是中国疆域最辽阔的朝代，没有大清就没有今天的中国版图！',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '清朝的疆域是历史条件（包括帝国主义扩张和民族征服）下的产物，不是清朝的恩赐。今天的中国版图是各族人民共同缔造的结果——把功劳归于一个封建王朝，是唯心主义的历史观。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '按你的逻辑，元朝疆域比清朝还大，你是不是该感谢蒙古西征？大清最后几十年割了多少地、赔了多少款——你算过账吗？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你夸耀的是皇上的疆域——但你的祖上在清朝大概率是被统治的奴才，不是坐江山的主子。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把疆土数字当作功绩来炫耀，却绝口不提这版图下多少农奴被鞭子抽弯了脊梁。他们歌颂的从来不是人民，而是自己坐稳了的龙椅。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'man_yi_02', enemyType: 'man_yi',
    content: '满族文化正在消亡！我们必须恢复满洲传统，不能让它断了根。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '保护少数民族文化是民族政策的重要内容——满语保护、满族文化研究、非物质文化遗产传承，这些工作一直在做。但"恢复传统"不等于复辟封建统治——文化保护和复古倒退是两回事。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你说的"恢复传统"是恢复什么？留辫子？穿花盆底鞋？还是恢复八旗等级制？你的文化认同不需要一个封建皇权来背书。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你不是在保护满族文化——你是在把满族文化绑在一具已经腐烂的封建尸骨上。你的族人需要的是文化传承，不是你的政治表演。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“文化断根”的焦虑包装成全民危机，掩盖的却是旧权贵对失去特权的恐慌。真正该抢救的，是山沟里失学的孩子和下岗工人的饭碗，而非哪个旗人的祖宗牌位。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'man_yi_03', enemyType: 'man_yi',
    content: '辛亥革命推翻了清朝，但民国比大清更乱——说明推翻清朝本身就是错的。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '封建王朝覆灭后出现动荡，说明的是旧制度崩溃后的转型之痛，不能反证封建制度应该保留。奴隶制废除后也有经济混乱——难道应该恢复奴隶制？历史的前进从来不是直线，走弯路不等于走错了方向。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '民国乱，是因为半殖民地半封建社会的矛盾没解决——这不能说明清朝好，只能说明资产阶级革命不彻底。你的逻辑是：退烧之后嗓子疼，所以发烧更好？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你怀念的大清，是慈禧太后的鸦片烟、是八国联军的炮火、是马关条约的两亿两白银。这就是你说的"好"？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "革命不是请客吃饭，民国之乱恰是地主买办与军阀争权夺利，劳动人民依旧被压榨。这言论无视阶级本质，只为旧王朝招魂，暴露其维护封建特权的立场。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'man_yi_04', enemyType: 'man_yi',
    content: '康熙乾隆都是千古一帝！现在的政治家哪个比得上？',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '康乾时期的确在封建治理上达到了高峰，但封建帝王的功绩不能脱离阶级本质和历史局限。康乾盛世的背后是文字狱、闭关锁国、农民疾苦——用封建帝王的标准来衡量现代政治，本身就是错位的。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '康熙乾隆比现在的政治家好？那乾隆朝人均寿命不到40岁、文盲率90%以上、一场饥荒死几十万人——你愿意活在那个时代吗？你不愿意，就别拿皇帝来贬低现代政治。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"千古一帝"——这四个字的背后，是几亿农民一辈子没见过皇上一面，却要交一辈子的皇粮。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把帝王功业捧成救世主，正是为剥削制度招魂。劳动者用血汗铸就的江山，凭什么跪拜几个封建主子？今天的成就，是人民挣来的，不是龙椅赐的。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'man_yi_05', enemyType: 'man_yi',
    content: '你们批判清朝，不过是汉族中心主义！满族的历史贡献被你们抹杀了。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '批判封建制度不等于否定满族的历史贡献。满族人民和各族人民一样，都是历史的创造者——但满族封建贵族对各族人民的压迫是历史事实，两者不能混为一谈。把对封建制度的批判说成是民族歧视，是概念偷换。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '我们批判的是封建制度，不是满族。你把封建贵族和满族人民捆绑在一起——到底是谁在绑架满族人民？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你不要躲在民族情感后面为你那些封建偶像辩护。满族人民的真正贡献是劳动和创造，不是给皇上磕头。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "批判清朝，不是批满洲兄弟，是批那帮骑在农奴和佃户头上吸血的八旗贵族。谁抹杀满族劳动人民的苦？正是拿民族当挡箭牌的旧主子。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 牧田（自由派）═══
  {
    id: 'mu_tian_01', enemyType: 'mu_tian',
    content: '中国的国有企业都是低效的僵尸企业，全面私有化才能提高效率。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '国有企业的效率不能只用利润来衡量——它们在基础设施、能源安全、公共服务等领域承担了社会责任。全面私有化的俄罗斯"休克疗法"导致GDP腰斩，这不是你想要的"效率"吧？公有制为主体、多种所有制共同发展，才是适合国情的选择。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '私有化就一定高效？安然诈骗、雷曼破产——这些全是私企。你把中国的电网、铁路、石油全卖给私人，是想学美国德州电网大雪天断电收天价电费吗？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"全面私有化"——你说这话的时候，想过这些国有资产落到谁手里吗？不会是落到你手里的。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这种论调站在资本立场，替少数人夺回公有资产开路；劳动者失去依靠，只会被更狠地剥削。国企效率再论，也轮不到私有化来断送工人的饭碗。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mu_tian_02', enemyType: 'mu_tian',
    content: '政府管得越少越好。市场经济有看不见的手，会自动调节一切。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '"看不见的手"的理论前提是完全竞争市场——这在现实中根本不存在。信息不对称、外部性、公共品、垄断——每一个都是市场失灵的原因。2008年金融危机就是"看不见的手"差点把全球经济推进深渊。宏观调控不是政府管得太多，是市场本身不够完美。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '那只"看不见的手"在2008年差点把自己掐死——美国政府砸了几万亿美元救市，你嘴里那只手怎么不自己调节了？危机的时候要政府救，好的时候要政府滚——真够双标的。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你相信的那只"看不见的手"，本质上是在相信——资本家不会太贪婪。这种信仰，比任何宗教都天真。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "说得轻巧！市场这只看不见的手，从来都是攥在资本手里的。管得少，不过是让大资本掐住工人脖子的手更松快些。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mu_tian_03', enemyType: 'mu_tian',
    content: '中国改革开放的成功恰恰是因为走向了西方式的市场经济。承认吧，是资本主义救了中国。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '中国改革开放的成就是因为坚持了社会主义市场经济——公有制为主体、按劳分配为主、国家宏观调控——而不是照搬西方模式。把一切经济发展都归功于"资本主义"，跟把一切失败都归咎于"社会主义"一样，是意识形态偏见，不是经济学分析。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '"资本主义救了中国"——那为什么同样搞资本主义的拉美、非洲、东欧没有复制中国的成功？你的"资本主义"解释不了为什么中国是唯一成功的案例。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把亿万劳动者的汗水和智慧归结为"资本主义"——你眼里只有资本，看不见人。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这种论调掩盖了工人阶级用血汗筑起的发展基石，却把功劳记在资本账上。改革红利若只肥了少数人，劳动者被边缘化，那就不是社会主义的胜利。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mu_tian_04', enemyType: 'mu_tian',
    content: '没有绝对的产权保护就没有经济发展。公有制本质上就是对私有产权的侵害。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '产权制度是社会关系的法律表现，不是天赋的自然权利。中国宪法明确保护合法的私有财产——同时规定了自然资源等属于国家所有。混合所有制不是对产权的"侵害"，而是产权在现代经济中的多种实现形式。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你口中"产权不可侵犯"——那英国工业革命时期的圈地运动把农民的土地圈走，合法吗？美国的土地是靠屠杀印第安人"合法获取"的——你那份绝对的产权观，本质上是"强盗的产权"。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 1 } },
      { text: '你口中的"产权"，保护的是有产者的财产——无产者的劳动被剥削，你怎么不说产权侵害了他们的权利？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“绝对产权”奉为天条，暴露的只是食利阶层的贪婪。牧田的论调，是为少数人垄断资源开道，而劳动者失去的却是安身立命的根基。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mu_tian_05', enemyType: 'mu_tian',
    content: '西方的民主制度才是人类政治文明的终点。中国迟早也要走这条路。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '民主是社会主义的本质要求，不是西方的专利。中国的全过程人民民主与西方的选举民主是不同的制度形式——不存在唯一的"政治文明终点"。历史终结论的提出者福山自己都修正了观点——你把西方民主神圣化，犯的是形而上学错误。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '福山说"历史的终结"——他自己后来都承认错了。你还在拿着人家扔掉的理论当圣经，你是不是比福山还福山？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把西方民主当成宗教来信——问题是，你崇拜的这个"神"，在阿富汗、伊拉克、利比亚制造了无数地狱。这就是你的"终点"？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这套说辞的实质，是让资本永续统治的迷魂汤。鼓吹终点论的人，从不提劳动者被剥削的真相。我们只信一条：政权属于人民，绝非资本代理人。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 美蜥鲂（境外势力/帝国主义）═══
  {
    id: 'mei_xi_fang_01', enemyType: 'mei_xi_fang',
    content: '美国是自由世界的灯塔。中国应该虚心向美国学习，而不是跟美国对抗。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '学习是必要的——但不能跪着学。美国的技术和管理经验值得借鉴，但美国的对华政策从来不是无私的"帮助"，而是服务于其全球霸权。对抗不是中国选择的，是美国发动贸易战、科技封锁强加的。你想学习可以，但要分清哪些是知识、哪些是陷阱。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '"自由世界的灯塔"——这座灯塔在过去二十年照过的地方：阿富汗、伊拉克、叙利亚、利比亚。照到哪里，哪里就是废墟。你的灯塔是个探照灯，照到谁谁死。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 1 } },
      { text: '你把美国叫作"灯塔"——但灯塔是给迷航的人指路的，美国的"灯塔"是照着别人好瞄准轰炸的。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“自由”挂在嘴边的，从来是资本的自由，不是劳动者的自由。这套说辞掩盖的，是华尔街对全球劳工的剥削秩序。劳动者要认清，向资本俯首，就是向自己的锁链致敬。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mei_xi_fang_02', enemyType: 'mei_xi_fang',
    content: '美元是全球储备货币，美国的经济制度就是最优的。质疑美国就是反智。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '美元霸权是二战后布雷顿森林体系的遗产，加上石油美元体系和军事霸权的支撑——这不是"最优制度"的证明，而是历史和政治权力结构的产物。美国国债已超34万亿美元，这不是什么制度优势的表现。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"质疑美国就是反智"——那美国自己一半选民质疑选举结果、三分之一的人不信任CDC——全美国都是反智？你连美国人都替你美国爹反了。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '把"质疑美国"等同于"反智"——你已经被殖民到了精神深处。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这套话术的阶级本质，是为金融垄断资本收割全球劳动人民辩护。它把剥削包装成真理，把反抗污名成愚昧，只为维护少数人的特权。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mei_xi_fang_03', enemyType: 'mei_xi_fang',
    content: '美国的科技领先中国几十年，中国再怎么努力也赶不上。不如老老实实给人当下游。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '科技差距是历史发展阶段的差距，不是种族的差距也不是制度的差距。中国在高铁、5G、量子计算、新能源等领域已经走在世界前列。按照历史唯物主义的观点，后发优势和学习曲线——追赶是完全可以实现的。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"中国赶不上"——四十年前你说中国经济赶不上日本，三十年前你说中国制造赶不上韩国，二十年前你说中国互联网赶不上美国。你每说一次就被打一次脸，你的脸还没肿够？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你跪着说话不腰疼——几十万中国科研人员在实验室熬夜攻关的时候，你在网上劝他们放弃。你不配替他们认输。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这话暴露了买办阶层的软骨病。劳动者从来不信科技神坛，只信双手创造。谁掌握生产资料，谁就掌握未来。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mei_xi_fang_04', enemyType: 'mei_xi_fang',
    content: '中美应该合作共赢，你们这些整天反美的人就是民族主义民粹。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '中国始终主张中美合作共赢——但合作需要双方相向而行。是美国在单方面发动贸易战、限制技术出口、在南海挑衅、在台海玩火。反对霸权不等于反对合作，正如反对侵略不等于反对和平。你把反对霸权污名化为"民粹"，是在为霸权的霸道洗地。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '合作共赢？美国国会三天两头通过反华法案，商务部的实体清单越来越长——你去劝劝美国"合作共赢"呗？只要求中国合作、不要求美国收敛，你这不是劝和，是拉偏架。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你口中的"反美"，恰恰反的是霸权。你把霸权包装成"合作"，把反抗污蔑为"民粹"——你的话术比美国的航母还熟练。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“合作共赢”挂在嘴边的人，从不提美国资本对全球工人的剥削。所谓共赢，是华尔街分账，不是劳动者分羹。站哪边，得看你的工资和血汗归谁。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'mei_xi_fang_05', enemyType: 'mei_xi_fang',
    content: '美国是移民国家，代表着人类的未来。民族国家已经过时了。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '美国式的"多元文化"是以盎格鲁-撒克逊文化和英语霸权为核心的熔炉式同化——不是真正的多元平等。而中国的民族区域自治是多民族和谐共处的不同模式。把美国说成"人类未来"，而它内部的种族矛盾、贫富分化——说明这个未来并不美好。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '"人类的未来"——未来是建墙拦移民、白人至上主义抬头、亚裔老人在地铁站被人推下轨道？你这个未来，我敬谢不敏。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"移民国家"这个词掩盖了一个事实：美国是建立在原住民种族灭绝基础上的。你口中的"未来"，是先抹掉过去才成立的。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“人类未来”挂在嘴边，却闭口不谈移民中绝大多数是流离失所的劳动者。这不过是资本在全球调配廉价劳动力的遮羞布，好让跨国财团继续吸干工人的血汗。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 小粉红（盲目排外）═══
  {
    id: 'xiao_fen_hong_01', enemyType: 'xiao_fen_hong',
    content: '不买华为就是不爱国！用苹果手机的都是汉奸！',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '爱国主义的核心是对国家和人民利益的忠诚，不是对某个品牌的忠诚。把消费选择等同于爱国与否，是把爱国主义庸俗化——恰恰是资产阶级消费主义对爱国精神的消解。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '用苹果就是汉奸——那所有在中国生产的苹果手机是谁造的？富士康的工人用双手生产出来的手机，一转手就变成"汉奸证据"了？你这爱国逻辑，先把中国工人开除国籍了。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把"爱国"变成了一根大棒，到处打人——你爱的不是国，是打人的权力。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把爱国标价成手机品牌，暴露的是资本收编民族情绪的生意经。劳动者用啥工具干活，轮不到买办代言人定性。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xiao_fen_hong_02', enemyType: 'xiao_fen_hong',
    content: '所有外国都是亡我之心不死的敌人。跟外国有往来就是卖国贼。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '把复杂的国际关系简化为"全是敌人"，是机械的、非辩证的思维。中国的发展离不开与世界各国的合作——一带一路、RCEP、中欧投资协定——都在证明。真正有害的不是对外交流，而是你这种闭关锁国式的伪爱国。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '外国"全是敌人"——那你手机里的操作系统（安卓/iOS）、你上网的互联网协议（TCP/IP）、你看病的各种仪器——全是外国人发明的。按你的标准，你每天都在当"卖国贼"？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把14亿中国人民的朋友圈缩成孤家寡人——这不是爱国，这是害国。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: -1, dialectic: 0, classStand: 0 } },
      { text: "这种论调把复杂的国际阶级关系简化为敌我标签，实则是为转移国内劳资矛盾，替资本扩张披上爱国外衣，让劳动者为少数人的利益买单。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xiao_fen_hong_03', enemyType: 'xiao_fen_hong',
    content: '批评中国的都是境外势力资助的！不许你说中国不好。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '批评和监督是社会主义民主的组成部分。正常的批评与境外势力渗透有本质区别——前者出于对国家的关心，后者出于对国家的破坏。你把一切批评都扣上"境外势力"的帽子，恰恰是在帮境外势力——把可以团结的人推到对立面。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '你说批评中国的都是收了境外势力的钱——那我问你，你批评中国男足的时候，是收了谁的钱？阿根廷吗？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '真正的自信不是不许别人说话——而是不怕别人说话。你的敏感恰恰暴露了你的脆弱。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把爱国当生意做，用大帽子堵住劳动者的嘴，这恰恰暴露了买办资本家的心虚——他们最怕工人农民看清自己被谁出卖。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xiao_fen_hong_04', enemyType: 'xiao_fen_hong',
    content: '中国现在就是世界第一！美国的GDP都是注水的，再过两年我们就全面超越美国。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '中国的确在许多领域取得了巨大成就，但"全面超越"需要客观冷静的判断。中国的人均GDP仍然只有美国的约六分之一，关键核心技术仍有差距。盲目自大和妄自菲薄都是错误——实事求是的态度才是真正的自信。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"美国GDP注水"——那你算一个不注水的版本出来我看看？你连GDP怎么算的都不知道，就说人家注水，你比美联储还懂统计学。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你口中的"世界第一"不需要口号，需要的是每一个普通人的生活改善。你只顾喊口号，底层的苦你看不见。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把国家实力等同于GDP数字，恰恰暴露了买办资本的焦虑。真正的世界第一，该是劳动者不必为房贷透支三十年，该是流水线上的工人能挺直腰杆说话。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xiao_fen_hong_05', enemyType: 'xiao_fen_hong',
    content: '外国的东西都不好，中国文化才是最棒的。我们不需要向任何人学习。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '文化自信不等于文化封闭。马克思主义本身就是从西方传入的科学理论——我们把它与中国实际结合，才有了今天的道路。拒绝学习一切外来文化，既违背了马克思主义的开放精神，也与中华文明兼容并蓄的传统相悖。文明因交流而丰富，不是因封闭而强大。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '外国的东西都不好——那马克思主义是德国人创立的，十月革命是俄国人搞的，你是不是也不该学？你的"中国文化自信"里，核心内容恰好是外来的，讽刺不讽刺？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你这种自大，和当年乾隆的"天朝物产丰盈无所不有"一模一样——几十年后就被坚船利炮轰开了国门。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这种盲目自大恰恰暴露了精神贵族的软弱：靠贬低外来文化来掩盖自身脱离生产实践的虚空，真正劳动者从不拒绝学习，只拒绝被谁定义高低。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 剪纸（保守建制派）═══
  {
    id: 'jian_zhi_01', enemyType: 'jian_zhi',
    content: '现行政策都是经过充分论证的，不需要改。改就是否定过去的成绩。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '改革是社会主义的自我完善，不是对过去成绩的否定。马克思主义辩证法告诉我们，事物在不断发展变化——过去的正确决策在新的历史条件下可能需要调整，这不是否定，是实事求是。改革开放本身就是在不断改革中前进的。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '按你的逻辑，改革开放之前实行了几十年的计划经济也是"经过充分论证的"——那后来为什么改？改了就是否定过去的成绩？你是在用现在否定改革开放。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你觉得一切都完美——那为什么政策还在不断调整和优化？你比制定政策的人还满足于现状，这不叫拥护，这叫懒惰。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "这套说辞的底气，来自既得利益者害怕失去分蛋糕的刀叉。你们守着旧规，是因为改朝换代动了你们的奶酪，而劳动者要的是饭碗里多几粒米。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jian_zhi_02', enemyType: 'jian_zhi',
    content: '我们是发展中国家，先把经济搞上去，别的以后再说。什么环保、什么劳工权益，那都是西方的陷阱。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '经济增长与社会公平、环境保护不是先后关系，而是辩证统一的关系。绿水青山就是金山银山——这个判断本身就否定了"先发展后治理"的旧路。劳动者的权益保障是发展的目的，不是发展的障碍。把人民利益当作"以后再说"的事——这才是违背了发展的初心。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '"先发展后治理"——伦敦在1952年雾霾死了上万人之后才知道治理，你是不是要等中国也死上万人再说？劳工权益是西方陷阱——那八小时工作制也是西方来的，你是不是要恢复996？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你口中的"陷阱"——是劳动者体面的工资、安全的工地和干净的空气。把这些叫做"陷阱"的人，你没在工地上干过一天活吧。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这套说辞的妙处，在于让劳动者用“大局”吞下自己的血汗。可经济搞上去的利润，究竟进了谁的口袋？环保欠账和工伤代价，又由谁的脊梁来偿还？", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jian_zhi_03', enemyType: 'jian_zhi',
    content: '稳定压倒一切。那些在网上提意见的人就是在破坏社会稳定。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '稳定与发展是辩证统一的——没有稳定的环境就无法发展，但脱离发展的稳定是不可持续的。正常的意见表达是社会主义民主的体现，与破坏社会稳定是两回事。把一切意见都视为威胁——这不是维护稳定，而是制造对立。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '按你的标准，当年在延安窑洞里给共产党提意见的李鼎铭先生也是在"破坏稳定"。那精兵简政是怎么来的？没有批评建议，我们连延安都走不出来。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把"稳定"当成拒绝一切改变的挡箭牌——这种稳定，本质上是一潭死水。死水是不起波澜，但也会发臭。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "拿剪刀的手，从来不怕纸扎的稳。真正动摇根基的，是替少数人捂住盖子、却让多数人咽下苦果的那套把戏。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jian_zhi_04', enemyType: 'jian_zhi',
    content: '这些社会问题都是极少数别有用心的人挑起的，大家不讨论自然就没了。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '社会问题的根源在社会存在，不在言论。马克思主义认为社会存在决定社会意识——问题不是因为讨论才存在，而是因为存在才被讨论。回避讨论不能解决问题，只会让问题在地下发酵。正视问题、分析问题，才是解决问题的第一步。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"不讨论问题就没了"——那你家漏水了你也不修，蒙上眼睛就当没漏。等楼塌了，你再说不讨论楼就不会塌？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你说这些话的时候，你自己信吗？还是你只是害怕——害怕面对问题，害怕承认不完美？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: -1, dialectic: 0, classStand: 0 } },
      { text: "剪纸人坐在暖阁里剪掉所有棱角，当然看不见窗外寒风割破的指头。捂住千万张嘴，盖不住账本上吸血的笔迹。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jian_zhi_05', enemyType: 'jian_zhi',
    content: '我们是社会主义国家，所以不存在剥削。你说有剥削就是否定社会主义。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '社会主义是一个不断发展的过程，不是一蹴而就的完美状态。中国仍处于并将长期处于社会主义初级阶段——在这个阶段，多种所有制并存意味着在部分非公经济中仍存在一定程度的剥削现象。承认问题的存在并逐步解决它，才是对社会主义的负责——鸵鸟心态才是真正在否定社会主义。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '你说不存在剥削——那你解释一下996、解释一下拖欠农民工工资。这些都是"社会主义的优越性"吗？你不让说剥削，剥削就不存在了？你的社会主义是纸糊的，经不起一句实话。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你在用"社会主义"四个大字遮住问题——这不是捍卫社会主义，这是在消费社会主义。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把“不存在剥削”挂在嘴边的人，正靠着剪刀差吸走劳动者的血汗。他们怕你看见账本，才急着给社会主义贴金。劳动者的手上有老茧，账本上有真相。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 套中人（政治冷淡）═══
  {
    id: 'tao_zhong_ren_01', enemyType: 'tao_zhong_ren',
    content: '政治关我什么事？我过好自己的小日子就行了，争来争去不还是那样。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '政治不是遥远的事情——它决定了你的工资、你的医保、你孩子的教育、你父母的养老。你以为在"政治之外"生活——但实际上你生活的每一个方面都是政治决策的结果。不关心政治，不等于政治不关心你。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你"过自己的小日子"——你的小日子能过下去，恰恰是因为有人在为你争取：争取劳动法、争取教育公平、争取医疗保障。你享受着别人斗争的成果，然后说"跟我没关系"。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你这种态度，鲁迅早就骂过了——"苟活者在淡红的血色中，会依稀看见微茫的希望"。你不是超脱，你是麻木。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这种“不关我事”的冷漠，正是小资产阶级的自私软骨病。你们躲进小日子，却忘了饭碗和安宁全靠劳动者撑着。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tao_zhong_ren_02', enemyType: 'tao_zhong_ren',
    content: '你们这些讨论政治的，不是被利用就是太闲。专心赚钱不好吗？',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '关心公共事务和赚钱不是对立的——一个健康的社会需要公民的参与。况且——当996卷到你头上、当房价涨到你的工资追不上、当你的孩子上不起学——你还能说这跟你没关系吗？',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '专心赚钱——你觉得赚钱跟政治无关？最低工资标准是政治定的，税收是政治定的，连你上班走的路都是政府用财政修的路——你赚的每一分钱里都有政治。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你说"被利用"——但你"专心赚钱"就不被人利用了吗？你的老板利用你的劳动创造剩余价值，你怎么不觉得是被利用？',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "这种论调透着精致的利己主义，用“赚钱”麻痹劳动者，掩盖资本剥削。真正该被质问的是：谁在利用你，让你连讨论自身处境的权力都甘愿放弃？", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tao_zhong_ren_03', enemyType: 'tao_zhong_ren',
    content: '天下乌鸦一般黑，什么主义都一样。我谁也不信。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '把一切政治制度等同起来，是典型的虚无主义——而且是一个经验上的错误。北欧和非洲、中国和清朝——它们的社会制度真的"都一样"吗？否定一切差别的结果不是智慧，而是放弃判断——而这恰好会让最坏的制度肆无忌惮。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"什么都一样"——那你去医院的时候，医生给你打青霉素还是打农药，是不是也"都一样"？区别是客观存在的，你假装看不见，不代表别人也看不见。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '这不是智慧，是懒惰。"我谁也不信"的另一面是"我什么也不想做"——你把自己包裹在犬儒主义里，以为那是铠甲，其实是枷锁。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把“都一样”挂在嘴边的，从来不是被剥削者，而是既得利益者的遮羞布。你躲进套子，可工人农民却在风雨里挣命。不信主义，不过是不敢站队，怕脏了你的体面。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tao_zhong_ren_04', enemyType: 'tao_zhong_ren',
    content: '历史都是胜利者写的，所以研究历史没有意义。谁知道哪个是真的？',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '"历史是胜利者写的"——这句话本身就是一种粗糙的历史观。历史研究的任务恰恰是通过史料考证、考古发现、多方印证来逼近真相。马克思主义史学不因为立场而否定客观事实——恰恰相反，唯物史观的基础就在于历史事实的客观存在。你把一切历史都归为"谁赢了谁写"，是在用相对主义消解所有严肃的历史研究。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '按你的说法，南京大屠杀也是"胜利者写的"所以没意义？那30万死难者的白骨、外国记者的照片、幸存者的证言——都是编的？你的"相对主义"，在死难者面前不值一文。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 1 } },
      { text: '你说"不知道哪个是真的"——但其实你根本没去查过。你不是找不到真相，你是不想找。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把历史当骗局，不过是有闲阶级的消遣。劳动者从血泪教训里认清剥削，从斗争经验里找到方向，这比任何故纸堆都真实。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tao_zhong_ren_05', enemyType: 'tao_zhong_ren',
    content: '你们这些有立场的人，都是被洗脑了。我没有立场，所以我最客观。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '没有立场本身就是一种立场——维护现状的保守立场。马克思主义不掩饰自己的阶级立场——因为它是为最广大人民利益服务的。所谓的"零立场"不过是把现存秩序的意识形态自然化，假装它是"客观"的。这比有立场更隐蔽，但同样是一种立场。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你说"没有立场最客观"——那你在街上看到有人在打一个人，你"客观"地站旁边看，不帮受害者——你的"客观"就是在帮施暴者。不站队，也是一种站队。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把"没有立场"当成优越感——但你的"没有立场"让你在面对不公时一句话都不敢说。这叫什么客观？这叫懦弱。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "所谓“无立场”本身就是资产阶级的立场，是用超然姿态掩盖对劳动者剥削的辩护。真正客观，是站在被压迫者一边，揭露这种伪装的冷漠。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 沱牌（托派）═══
  {
    id: 'tuo_pai_01', enemyType: 'tuo_pai',
    content: '中国现在搞的不是社会主义，是国家资本主义！官僚阶级窃取了革命果实。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '中国的社会主义处于初级阶段——这个判断本身就意味着它还不完善、不成熟。把一切现存问题归因为"国家资本主义"和"官僚阶级"，是用标签代替分析。在社会主义框架内推动改革和完善——与全盘否定现行制度——是改革与颠覆的根本区别。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '"国家资本主义"——这个标签能解释中国8亿人脱贫吗？能解释中国的高铁和空间站吗？你的理论如果解释不了现实，不是现实错了，是你的理论太简陋了。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把几代人艰苦奋斗换来的建设成就扣上"官僚阶级窃取"的帽子——你这不是批判，是侮辱。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "说这话的人，是站在旧资产阶级残渣的立场上，替被剥夺的剥削者鸣冤。他们看不见工人阶级当家作主的事实，只想把公有制改回私有制，让劳动者重新躺回血汗工厂的流水线。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tuo_pai_02', enemyType: 'tuo_pai',
    content: '不搞世界革命就不是真正的马克思主义者！一国建成社会主义是不可能的。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '马克思主义活的灵魂是具体问题具体分析——不是机械套用某句话。在帝国主义时代，列宁就论证了一国或数国可以首先取得社会主义胜利——这是对马克思主义的发展，不是对它的背叛。把"世界革命"抽象化为空洞的口号——而忽视具体的、现实的建设——才是真正的背离。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '"一国建成不可能"——那你看看中国：从一穷二白到世界第二大经济体，14亿人整体脱贫。如果这叫"不可能"，那你所谓的"可能"长什么样？是不是只存在于你写的传单里？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"世界革命"——这些年在全世界发动战争制造灾难的，恰恰是美帝国主义。你高喊世界革命，美国在全世界干坏事的时候你上过街吗？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把世界革命挂在嘴边，不过是用空谈掩盖国内资本对劳动者的剥削。真正的马克思主义者，先得让工人农民掌握自己国家的命运。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tuo_pai_03', enemyType: 'tuo_pai',
    content: '你们这些建制左派比右派还可恶！你们背叛了工人阶级。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '工人阶级的利益不是用口号来维护的——而是靠实际的政策：最低工资标准的提高、扶贫攻坚的推进、社会保障体系的完善。把一切不是"纯粹革命"的努力都打成"背叛"，结果只能是自我孤立——脱离群众而自诩代表群众，这不是马克思主义，是精英主义。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 1 } },
      { text: '你说"背叛工人阶级"——但真正的工人现在在工厂里上班赚钱养家，不是在网上陪你喊口号。你去过工厂吗？你跟工人说过话吗？你代表工人阶级——谁选的你？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"你们比右派还可恶"——这句话暴露了你的真实逻辑：你不是在搞革命，你是在搞圈子。你眼中最大的敌人不是资产阶级，而是跟你意见不同的左派。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "打着工人旗号攻击左翼，恰恰暴露了脱离工厂车间的 petty-bourgeois 躁动。工人阶级要的是组织与斗争，不是拿身份当棍子。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tuo_pai_04', enemyType: 'tuo_pai',
    content: '马克思主义已经被后现代主义超越了。阶级分析过时了，现在是身份政治的时代。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '阶级分析没有过时——全球贫富分化的加剧恰恰证明了它的解释力。身份政治聚焦于种族、性别等具体压迫形式是有价值的——但它不能替代阶级分析，反而需要与阶级分析结合。脱离阶级谈身份，恰恰会落入资产阶级文化政治的陷阱——关心符号而不改变结构。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"阶级过时了"——那为什么全球最富的1%拥有45%的财富？为什么亚马逊工人罢工、星巴克员工组工会——这些工人是不是没读过你的"后现代主义"？他们的阶级意识比你清醒多了。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你从马克思跳到福柯，跳过了其间一百五十年工人阶级的斗争史——你是在用学术时髦逃避现实。',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: -1, dialectic: 0, classStand: 1 } },
      { text: "把“阶级”换成“身份”，恰是资本最爱的障眼法：它让工人为肤色、性别争吵，却任由酒厂利润流进同一只钱袋。沱牌该问问自己，流水线上谁在喝风。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'tuo_pai_05', enemyType: 'tuo_pai',
    content: '一切资产阶级政党都是同一个阶级的统治工具，选举毫无意义。我们拒绝参与任何改良。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '革命与改良不是绝对对立的。在革命条件不成熟的时期，通过改良改善人民生活、积蓄革命力量——这是马克思主义的策略性思维。拒绝一切改良的"纯粹革命"，最终的结局不是革命胜利，而是永远在等待中自我边缘化。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你不参与任何改良——那你做了什么呢？罢工你不在、维权你不在、社区服务你不在。你只是在网上发帖批判一切——这叫"革命"？这叫评论区的革命家。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你说选举没意义——但工人阶级争取到的八小时工作制、最低工资、社会保障，哪一样不是在改良中一步步拿到的？在你等"革命"的这几十年里，改良已经救了无数人。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "将劳动者排斥在政治生活之外，恰恰暴露了你们脱离群众的特权本质。真正的革命者从不逃避现实斗争，而是在每一次群众运动中锻造阶级力量。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 旺座小鬼（不学无术的自诩左派）═══
  {
    id: 'wang_zuo_01', enemyType: 'wang_zuo',
    content: '打工人团结起来！打倒资本家！不革命不是中国人！',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '革命不是空洞的口号——它需要科学的理论分析、正确的战略策略和对客观条件的准确判断。只会喊"打倒"而不分析具体矛盾、不提出建设性方案——这不是革命，是网络行为艺术。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你把"革命"当游戏皮肤——今天喊打倒资本家，明天是不是喊打倒房东，后天打倒你老板？你每喊一次"革命"，真正的革命者就替你脸红一次。你连《共产党宣言》读完了没有？',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你这些口号轻飘飘地说出口——但革命不是请客吃饭，是会流血的。你准备好了吗？还是你只是在找一种让自己感觉牛逼的身份？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "嘴上喊着团结，心里盘算的却是把工人当枪使。真到了分果实那天，你猜谁先跑？劳动者的拳头，从不认口号认利益。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'wang_zuo_02', enemyType: 'wang_zuo',
    content: '我看你用了好多马克思主义的词，你肯定是学院派的书呆子。真正的革命不需要理论。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '没有革命的理论，就不会有革命的运动——这是列宁的原话。从马克思到毛泽东，没有一个革命者是靠"不要理论"成功的。理论不是装饰品，是分析现实矛盾的工具。你鄙视理论，不是因为理论无用，而是因为你不愿意下功夫学。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"真正的革命不需要理论"——那巴黎公社为什么失败？就是因为缺乏统一的理论指导和纪律。你比巴黎公社的革命者还厉害？他们用生命换来的教训，你一句话就否定了。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你在用键盘贬低理论——但你连自己信奉的"理论"是什么都说不清楚。你不反对理论——你只反对你听不懂的东西。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "轻视理论的论调，恰是坐享其成者麻痹劳动者的伎俩。没有科学指南，工农的汗水只会喂饱新权贵。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'wang_zuo_03', enemyType: 'wang_zuo',
    content: '我已经看透了一切。这个世界就是统治阶级在压迫被统治阶级，其他都是洗脑。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '阶级分析是马克思主义的基本方法，但"看透了一切"不等于分析了一切。经济基础和上层建筑、主要矛盾和次要矛盾、量变和质变——如果只看得到一个"压迫"二字，你看到的不是本质，而是本质的粗糙漫画。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你把所有复杂的社会现象简化成一句话——这跟那些说"一切都是上帝的旨意"的教徒有什么区别？你把马克思主义活生生搞成了另一种宗教。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你每说一次"我看透了一切"——实际上是在说"我不想再思考了"。这不是觉醒，是放弃思考。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "你所谓的“看透”，不过是小资产阶级的颓丧呻吟。真正的压迫不在空谈，而在工厂与田垄的每一滴血汗里。站起来，劳动者，别用虚无替剥削开脱。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'wang_zuo_04', enemyType: 'wang_zuo',
    content: '我虽然没读过原著，但我能感觉到这个社会有问题。有感觉就够了。',
    weakness: ArgumentType.REDUCTIO,
    comboThreshold: 1,
    options: [
      { text: '感觉是认识的起点，但不是认识的终点。从感性认识到理性认识的飞跃——这正是毛泽东在《实践论》中阐述的。停留在"感觉"上而不去研究具体问题——你的"感觉"永远只是情绪，永远不能转化为改变世界的力量。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"有感觉就够了"——你生病的时候感觉肚子疼，但不去医院检查。你觉得"我感觉到了"能治好你的病吗？对社会问题的分析与看病是一个道理——感觉只是症状，病因需要诊断。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你满足于"感觉"——但那些资本家也在"感觉"：他们感觉你的愤怒无关紧要，因为你永远不会去做任何实质的事。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "感觉代替思考，是懒怠的遮羞布。不读原著却谈社会问题，这轻飘飘的“感觉”掩盖了谁的利益？劳动者的痛，从来不是靠感觉解决的。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'wang_zuo_05', enemyType: 'wang_zuo',
    content: '所有不支持我们的人都是工贼和小资产阶级。要跟他们划清界限。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '统一战线是革命胜利的重要法宝——毛泽东在《中国社会各阶级的分析》中明确指出要分清敌友。你把一切不赞同你的人都打成"工贼"和"小资"，不是在分清敌友，是在四面树敌。真正的革命者懂得团结一切可以团结的力量，而不是满足于一小群人的自我纯洁。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '你把所有人开除出革命队伍——最后队伍里就剩你和你手机里的几个表情包。这是闹革命还是玩社团？你搞的不是先锋队，是粉丝群。',
        type: ArgumentType.REDUCTIO, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你动不动就扣帽子——"工贼""小资""叛徒"——你这些帽子的产量，比工厂的生产线还高。你是在搞斗争还是在生产帽子？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "用阶级标签压人，恰恰暴露了你们脱离劳动者的心虚。真正的人民，从不靠辱骂异见者来证明自己站在哪一边。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 虚无主义者（历史虚无）═══
  {
    id: 'xu_wu_01', enemyType: 'xu_wu',
    content: '历史都是任人打扮的小姑娘。你说这些有什么意义？谁掌握了话语权谁就掌握了历史。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '历史叙事确实存在建构的成分，但这不等于历史事实不存在。南京大屠杀有30万遇难者——这是事实，不是叙事。马克思主义史学要求我们区分历史事实和历史解释——你不能因为解释有争议，就连事实一起否定。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"话语权掌握历史"——那你去南京大屠杀纪念馆跟那些幸存者说——"你们的苦难只是胜利者的话语建构"。你敢吗？你不敢——因为你知道这句话连你自己都不信。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你把一切历史都说成是谎言——但你这句"历史是谎言"恰好是在为那些真正的谎言家开脱。你帮的不是真相，是作恶者。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "历史从来不是谁的玩物，而是劳动者用血汗写就的奋斗史。你所谓的话语权，不过是剥削者妄图抹杀人民创造力的遮羞布。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xu_wu_02', enemyType: 'xu_wu',
    content: '你信仰的这些主义，历史上造成了多少灾难？任何意识形态都是洗脑工具。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '马克思主义恰恰是对一切意识形态虚假性的批判——但不是通过否定一切来批判，而是通过揭示意识形态背后的物质利益和阶级基础。你把一切主义等同起来——这种等同本身就是在为最坏的主义开绿灯：如果没有好坏之分，那法西斯主义和社会主义就"都一样"，这显然荒谬。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"任何意识形态都是洗脑"——那你这套"反意识形态"的意识形态呢？你这句话本身就是一种意识形态——只不过你没意识到而已。你否定一切的同时把自己排除在外，这叫"我的理论不适用于我自己"。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你拿"历史上造成的灾难"来审判一切主义——但那些灾难里有多少是打着主义的旗号、实际上为了利益和权力？你把锅甩给主义，真凶在背后笑。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "这套说辞的底色，是失意者把一切抗争都污名化为灾难，好让劳动者放弃武器，永远跪着挨饿。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xu_wu_03', enemyType: 'xu_wu',
    content: '中国近代史就是一部屈辱史，有什么可骄傲的？我也不觉得现在有什么了不起。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '中国近代史既是屈辱史也是抗争史——从鸦片战争到抗日战争、从辛亥革命到新中国成立——正是因为不认命，才有今天的中国。屈辱不是自卑的理由，而是自强的起点。你看不到成就是因为你不愿意看——客观地说，中国用几十年走完了西方国家几百年的工业化道路。',
        type: ArgumentType.RATIONAL, stars: 2, effect: { hp: -2, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"没什么可骄傲的"——那你出门坐高铁的时候、用手机支付的时候，怎么不下跪感恩西方文明的恩赐呢？你在享受发展成果的同时否定发展本身——你的人格是分裂的。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你觉得屈辱就是全部——但你的祖辈在那段屈辱史里挺过来了、活下来了、生下了你的父辈——才有了你。你否定他们的苦难和韧性，就是在否定你自己的存在。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "把民族苦难当谈资，暴露的是脱离人民的旁观者姿态。劳动者在抗争与建设中挺起脊梁，而你们只配在废墟上冷笑。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xu_wu_04', enemyType: 'xu_wu',
    content: '所有国家都是为了统治阶级的利益。爱国主义就是让你心甘情愿地去送死。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1,
    options: [
      { text: '国家是阶级统治的工具——这是马克思主义的基本观点。但在民族面临外部威胁时，保卫国家也是保卫本民族人民的生存权利。抗日战争的爱国主义，是保卫中华民族不被殖民奴役——这种爱国主义与统治阶级煽动的狭隘民族主义有本质区别。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"爱国主义就是送死"——那抗日英烈在你眼里就是被骗的傻子？你坐在他们用命换来的和平里，说他们死得不值——你比侵略者还侮辱他们。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 1 } },
      { text: '你把一切爱国主义都等同于愚昧——但你说出这句话的时候，恰恰暴露了你自己的无知。你分不清侵略和自卫——不是分不清，你是不想分。',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
      { text: "将全体劳动者绑上“统治阶级”的标签，恰恰抹杀了无产阶级与资产阶级的根本对立。真正的爱国，是劳动者捍卫自己阶级解放的战场，而非为任何剥削者殉葬。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'xu_wu_05', enemyType: 'xu_wu',
    content: '历史没有规律，只有偶然。你说历史有方向——那方向在哪？不过是事后诸葛亮。',
    weakness: ArgumentType.RATIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '历史的规律不是机械决定论——而是通过人的实践活动来实现的趋势。生产力决定生产关系、经济基础决定上层建筑——这不是"事后解释"，而是被反复验证的历史唯物主义基本原理。奴隶社会→封建社会→资本主义社会→社会主义社会——这个演进过程在全球范围内是客观存在的。你看到了偶然，就否定了必然——这是只见树木不见森林。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '"历史没有规律"——那为什么全世界的文明都从采集狩猎走向农业、从农业走向工业？为什么没有哪个国家从资本主义"偶然"成原始社会？这不叫规律叫什么——"所有人的巧合"？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你说历史是偶然——但你这辈子做的每一个决定，上学、工作、结婚——你都说得出原因。你自己的人生有因果，全人类的历史就没有？',
        type: ArgumentType.EMOTIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把历史归结为偶然，不过是让劳动者放弃改变命运的斗争，好让既得利益者永远稳坐江山。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 姜太公（网络钓鱼/乐子人）═══
  {
    id: 'jiang_tai_gong_01', enemyType: 'jiang_tai_gong',
    content: '打这么多字不累吗？我就是随便说说，你还当真了。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '你所谓的"随便说说"——实际上是在所有严肃讨论里投放干扰。一个人的无所谓、十个人的无所谓——加起来就是公共讨论的崩溃。你不是无辜的旁观者，你是帮凶。',
        type: ArgumentType.RATIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: '"随便说说"——但你每一句"随便说说"都在消解别人认真讨论的努力。你就像一个在图书馆里大声打电话的人，别人让你小声点，你说"没事，我就打一会"。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你不是随便说说——你这是把无聊当个性。你用"随便"来掩饰自己的空洞——真正有东西的人不会随便，只有空无一物的人才什么都无所谓。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把劳动人民的认真当作笑话，把剥削者的轻佻当作体面，这轻飘飘一句里，藏着不事生产者的傲慢与对劳动者的轻蔑。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jiang_tai_gong_02', enemyType: 'jiang_tai_gong',
    content: '你这么认真干嘛？大家都是在网上吹水。来，喝杯茶冷静一下。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '网络空间是亿万民众的精神家园——把一切公共讨论都归为"吹水"，是在消解公民参与公共事务的正当性。你享受着别人认真讨论换来的社会进步，然后嘲笑他们太认真——这叫忘恩负义。',
        type: ArgumentType.RATIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: '你让我"冷静一下"——你每次说这句话的时候，都觉得自己比别人成熟。但你想想：你冷静了一辈子，你有什么东西值得别人认真对待的？冷静不是成熟，是空虚。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"大家都是在吹水"——你一个人吹水无所谓，但你这种人多了，整个社会就只剩吹水了。到那时候你想找人认真说话——对不起，全是你这种人。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把阶级斗争说成“吹水”，正是剥削者消解反抗的惯用话术。劳动者流汗挣命时，可没闲心端茶谈笑。这杯茶，敬的是麻痹斗志的麻醉剂。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jiang_tai_gong_03', enemyType: 'jiang_tai_gong',
    content: '你发的这段话我根本就没看完。不过没关系，你高兴就好。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '不看对方的论述就回应——这恰恰是对讨论最大的不尊重。你不看不是因为没时间——你是在用"不看"来维持自己虚幻的优越感。你真的不看？那你还回什么。',
        type: ArgumentType.RATIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: '你没看完就回——这跟你没看菜单就点菜一样。你端上来的全都是空气，然后说"反正吃了也不饱"。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '"你高兴就好"——这句话是你的最后一招。当你的脑子跟不上的时候，你就用这句话假装大度，然后退场。这不是宽容，这是逃跑。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把“看不看完”当成特权，暴露的正是食利者高高在上的傲慢。劳动者用血汗换来的真理，岂容你轻飘飘一句“高兴就好”打发？这种消解斗争的姿态，才是真正的精神剥削。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jiang_tai_gong_04', enemyType: 'jiang_tai_gong',
    content: '我是来网上找乐子的，不是来上课的。你们那么严肃累不累啊？',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1, isElite: true,
    options: [
      { text: '网络有娱乐功能，但不是只有娱乐功能。你把一切严肃讨论都当成"上课"——但正是这些"上课"的人在揭露不公、推动改变。你吃的瓜、看的戏——里面有多少是别人的痛苦？你的乐子是建立在别人的苦难上的。',
        type: ArgumentType.RATIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: '你找乐子——那你为什么老往严肃话题里钻？你上网找乐子，结果跑到政治讨论里来找乐子——你就是那种去殡仪馆讲笑话的人，还嫌别人不笑。你的乐子是一种病。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '你不是在找乐子——你是在找存在感。因为你除了"找乐子"以外，不知道自己活着的意义是什么。你笑所有人太严肃——其实是所有人都在往前走，只有你停在原地在笑。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "把消遣当自由，是因为你从不用为三餐发愁。劳动者的每一分钟都是活命的成本，你的“乐子”踩着的正是他们的汗水。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },
  {
    id: 'jiang_tai_gong_05', enemyType: 'jiang_tai_gong',
    content: '你赢了行了吧。反正这话题也不重要，我去打游戏了。',
    weakness: ArgumentType.EMOTIONAL,
    comboThreshold: 1,
    options: [
      { text: '这不是谁赢谁输的问题——你从一开始就没打算认真讨论。你用"我去打游戏了"来退场，看起来是你主动离开——实际上是你不愿意面对自己无话可说的事实。你可以退场，但问题不会因为你不讨论就消失。',
        type: ArgumentType.RATIONAL, stars: 1, effect: { hp: -1, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: '"我去打游戏了"——对，你去吧。你每次都这样：搅完浑水就跑，等水清了再回来搅。你这种人最可恶的地方在于：你把别人的认真当成你的消遣。打完游戏记得回来——下次你还会是这副德性。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '走好。但你要知道——你关掉这个网页之后，你逃避了的那些问题还在那里。有一天它们会来找你，那时候你连"打游戏"这个借口都用不上了。',
        type: ArgumentType.EMOTIONAL, stars: 3, effect: { hp: -3, confidence: 0, dialectic: 0, classStand: 0 } },
      { text: "打游戏逃避的是现实，可劳动者连逃避的资格都得靠加班去换。你输赢无所谓，是因为你压根没站在被剥削的队列里。", type: ArgumentType.CLASS_CRITIQUE, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 2 } },
    ],
  },

  // ═══ 蛇黾（社会民主主义）═══
  {
    id: 'she_mian_01', enemyType: 'she_mian',
    content: '革命太激进了。我们完全可以通过议会选举、和平请愿，一步步改良社会，何必流血推翻？',
    weakness: ArgumentType.CLASS_CRITIQUE,
    comboThreshold: 1,
    options: [
      { text: '议会民主是资产阶级统治的合法外壳。当改良触及资本根本利益时，资产阶级会毫不犹豫撕下民主面具——历史上改良派的每一次让步，都是在革命压力下被迫做出的，而不是议会恩赐。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '如果议会道路真能改变社会，那西方搞了一百多年普选，怎么贫富差距反而越来越大？你的"改良"改了一百年，资本家还是资本家，工人还是工人。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '改良路线的本质，是让无产阶级放弃夺取政权、永远在资本主义框架内乞讨。议会是资产阶级的议会，选来选去都是资本代言人——这就是阶级的铁律，不是姿态问题。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 0, classStand: 2 } },
      { text: '你口口声声"和平改良"，可那些被拖欠工资、被强拆、被逼到天台上的劳动者，等得及你慢慢改良吗？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
    ],
  },
  {
    id: 'she_mian_02', enemyType: 'she_mian',
    content: '资本主义确实有问题，但可以靠福利国家、高税收、强大工会来调节，用不着推翻。',
    weakness: ArgumentType.CLASS_CRITIQUE,
    comboThreshold: 1,
    options: [
      { text: '福利国家是在工人运动和社会主义阵营的压力下被迫形成的，本质是资本为稳定统治而付出的"维稳费"。一旦资本觉得不划算了，福利随时可以收回——新自由主义四十年已经把福利拆得七零八落。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '北欧福利那么好，为什么瑞典的贫富差距还是在拉大？为什么大资本照样控制命脉产业？你的"调节"调节了谁？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '只要生产资料私有制还在，福利就永远是资本对劳动者的施舍，而不是劳动者的权利。高税收、工会都只能在资本的框架内讨价还价，改变不了谁剥削谁的根本格局。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 0, classStand: 2 } },
      { text: '你说的"福利国家"，多少劳动者一辈子都拿不到像样的保障，反而要感恩资本家的"仁慈"？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
    ],
  },
  {
    id: 'she_mian_03', enemyType: 'she_mian',
    content: '阶级斗争那套早过时了，现在是多元社会，劳资可以协商共赢。',
    weakness: ArgumentType.CLASS_CRITIQUE,
    comboThreshold: 1,
    options: [
      { text: '只要存在雇佣劳动关系，就存在剥削，就存在阶级。所谓"多元社会"不过是用身份、性别、族裔的议题，掩盖劳资之间最根本的对立。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '劳资协商共赢？那你去跟你的老板说"我要求分一半利润"，看他跟不跟你"协商"。你们之间谈的不是共赢，是利润怎么分，而分配权从来在老板手里。',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '否认阶级斗争，本身就是站在资本一边。因为只有既得利益者才希望被剥削者安于现状、放弃反抗。阶级矛盾不会因为你不承认就消失，只会以更激烈的形式爆发。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 0, classStand: 2 } },
      { text: '你坐在办公室里谈"共赢"的时候，外卖骑手在风雨里抢时间，矿工在井下讨生活——你跟谁共赢？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
    ],
  },
  {
    id: 'she_mian_04', enemyType: 'she_mian',
    content: '工人争取到工会权益和最低工资就够了，何必搞什么夺权革命？',
    weakness: ArgumentType.CLASS_CRITIQUE,
    comboThreshold: 1,
    options: [
      { text: '工会权益和最低工资是工人斗争换来的成果，但它们只能改善出卖劳动力的条件，改变不了"必须出卖劳动力"这个事实。只要政权和资本绑在一起，这些权益随时可以被法律和暴力收回。',
        type: ArgumentType.RATIONAL, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 1, classStand: 0 } },
      { text: '最低工资够活吗？工会能阻止裁员吗？资本一搬家、一机器换人，你争取到的那些"权益"还剩多少？',
        type: ArgumentType.REDUCTIO, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 1, classStand: 0 } },
      { text: '夺权不是目的，而是手段。工人阶级只有掌握政权，才能从根本上废除雇佣劳动制度，而不是在雇佣劳动制度下讨价还价。把"要权益"当成终点，就是放弃了劳动者的根本解放。',
        type: ArgumentType.CLASS_CRITIQUE, stars: 3, effect: { hp: -3, confidence: 1, dialectic: 0, classStand: 2 } },
      { text: '你问问那些被欠薪、被辞退、连最低工资都拿不到的工人，"够了吗"三个字你对他们说得出口吗？',
        type: ArgumentType.EMOTIONAL, stars: 2, effect: { hp: -2, confidence: 0, dialectic: 0, classStand: 1 } },
    ],
  },

];

// ── 道具 ──────────────────────────────────────────────
// price.currency: 'confidence' | 'dialectic' | 'classStand' | 'hp'
const ITEMS = [
  {
    id: 'contradiction',
    name: '《矛盾论》摘抄',
    desc: '本题论证类型匹配时，额外+1伤害。',
    effect: { type: 'boostMatch', value: 1 },
    usableIn: 'battle',
    icon: '◆',
    price: { currency: 'dialectic', cost: 1 },
  },
  {
    id: 'worker_interview',
    name: '工人访谈录',
    desc: '面对裂土派敌人时，跳过本题（群众路线buff）。',
    effect: { type: 'skipFaction', faction: Faction.LIE_TU },
    usableIn: 'battle',
    icon: '◇',
    price: { currency: 'classStand', cost: 2 },
  },
  {
    id: 'history_mirror',
    name: '历史镜鉴',
    desc: '恢复2点HP。',
    effect: { type: 'restoreHp', value: 2 },
    usableIn: 'any',
    icon: '○',
    price: { currency: 'confidence', cost: 2 },
  },
  {
    id: 'internationale',
    name: '国际歌',
    desc: '锁定阶级觉悟，接下来3题不掉。',
    effect: { type: 'lockAttr', attr: 'classStand', duration: 3 },
    usableIn: 'any',
    icon: '♪',
    price: { currency: 'classStand', cost: 3 },
  },
  {
    id: 'capital_notes',
    name: '《资本论》笔记',
    desc: '面对外来派敌人时，本题伤害+2。',
    effect: { type: 'boostFaction', faction: Faction.WAI_LAI, value: 2 },
    usableIn: 'battle',
    icon: '□',
    price: { currency: 'dialectic', cost: 2 },
  },
  {
    id: 'comrade',
    name: '革命战友',
    desc: '解除本题中因属性不足而被锁定的选项。',
    effect: { type: 'unlockOption' },
    usableIn: 'any',
    icon: '▲',
    price: { currency: 'confidence', cost: 3 },
  },
  {
    id: 'practice_theory',
    name: '实践论',
    desc: '辩证力+2，持续3题。',
    effect: { type: 'boostAttr', attr: 'dialectic', value: 2, duration: 3 },
    usableIn: 'any',
    icon: '△',
    price: { currency: 'dialectic', cost: 3 },
  },
  {
    id: 'mass_line',
    name: '群众路线',
    desc: '本题所选选项星级+1。',
    effect: { type: 'boostStar', value: 1 },
    usableIn: 'battle',
    icon: '☆',
    price: { currency: 'hp', cost: 1 },
  },
  {
    id: 'practice_notes',
    name: '《实践论》残页',
    desc: '立即恢复 3 点 HP。',
    effect: { type: 'restoreHp', value: 3 },
    usableIn: 'any',
    icon: '◈',
    price: { currency: 'dialectic', cost: 2 },
  },
  {
    id: 'theory_pamphlet',
    name: '理论小册子',
    desc: '本题所选选项伤害 +2。',
    effect: { type: 'boostStar', value: 2 },
    usableIn: 'battle',
    icon: '◉',
    price: { currency: 'confidence', cost: 3 },
  },
  {
    id: 'mass_base',
    name: '群众基础',
    desc: '接下来 3 回合负面事件概率减半。',
    effect: { type: 'eventGuard', duration: 3 },
    usableIn: 'any',
    icon: '▣',
    price: { currency: 'classStand', cost: 2 },
  },
  {
    id: 'faith_badge',
    name: '信仰徽章',
    desc: '锁定阶级觉悟 4 回合不掉。',
    effect: { type: 'lockAttr', attr: 'classStand', duration: 4 },
    usableIn: 'any',
    icon: '◈',
    price: { currency: 'hp', cost: 2 },
  },
];

// ── 事件 ──────────────────────────────────────────────
// 每 10 题触发一次；chooseEnemy 事件展示敌人选择器
const EVENTS = [
  {
    id: 'rally',
    title: '街头集会',
    desc: '你路过一场群众集会，人群情绪高涨，有人请你上台讲两句。',
    options: [
      { text: '上台演讲，旗帜鲜明', effect: { classStand: 2, confidence: 1 } },
      { text: '台下倾听，记下要点', effect: { dialectic: 2 } },
      { text: '婉拒，继续赶路', effect: {} },
    ],
  },
  {
    id: 'reading',
    title: '偶得旧书',
    desc: '旧书摊上，一本泛黄的《资本论》第一卷映入眼帘。',
    options: [
      { text: '买下细读，做满批注', effect: { confidence: 2, dialectic: 1 } },
      { text: '翻看目录，记住框架', effect: { dialectic: 1 } },
      { text: '囊中羞涩，放下离开', effect: { confidence: -1 } },
    ],
  },
  {
    id: 'comrade_hurt',
    title: '同志受挫',
    desc: '一位并肩作战的同志因辩不过敌人而灰心丧气，想要放弃。',
    options: [
      { text: '耐心开导，一起复盘', effect: { classStand: 2, confidence: 1 } },
      { text: '让他独自冷静', effect: {} },
      { text: '批评他立场不坚', effect: { classStand: -1 } },
    ],
  },
  {
    id: 'choose_enemy',
    title: '主动出击',
    desc: '你决定主动出击，挑一个对手正面交锋。',
    chooseEnemy: true,
    options: [],
  },
  {
    id: 'shop',
    title: '革命书店',
    desc: '你路过一家旧书店，进去补给一下吧。',
    shop: true,
    options: [],
  },
  {
    id: 'debate',
    title: '内部辩论',
    desc: '学习小组里，一位同志对你的方法提出质疑，气氛有些紧张。',
    options: [
      { text: '据理力争，坚持己见', effect: { confidence: 2, dialectic: 1, classStand: -1 } },
      { text: '虚心听取，吸收合理部分', effect: { dialectic: 2 } },
      { text: '回避争论', effect: { confidence: -1 } },
    ],
  },
  {
    id: 'mass_letter',
    title: '群众来信',
    desc: '一位受过你帮助的群众寄来感谢信，字里行间满是真诚。',
    options: [
      { text: '读完，深受鼓舞', effect: { classStand: 2, confidence: 1 } },
      { text: '收进包里继续赶路', effect: { classStand: 1 } },
    ],
  },
  {
    id: 'theory_study',
    title: '系统学习',
    desc: '你抽出一段完整时间，系统研读经典原著。',
    options: [
      { text: '精读并做批注', effect: { confidence: 2, dialectic: 2 } },
      { text: '通读一遍', effect: { confidence: 1 } },
    ],
  },
  {
    id: 'cyber_attack',
    title: '网络围攻',
    desc: '你的言论被断章取义，一群水军蜂拥而上围攻你。',
    negative: true,
    options: [
      { text: '正面回应，逐条驳斥', effect: { confidence: -1, dialectic: 1 } },
      { text: '不予理会，保存证据', effect: { confidence: -1 } },
      { text: '退出网络冷静一下', effect: { classStand: -1 } },
    ],
  },
  {
    id: 'comrade_wobble',
    title: '同志动摇',
    desc: '一位并肩作战的同志开始怀疑路线是否正确。',
    negative: true,
    options: [
      { text: '花时间耐心劝导', effect: { confidence: -1, classStand: 1 } },
      { text: '让他自己想想', effect: { confidence: -2 } },
    ],
  },
  {
    id: 'hard_choice',
    title: '艰难抉择',
    desc: '形势严峻，你必须做出一个艰难的决定。',
    negative: true,
    options: [
      { text: '接下来 3 次遭遇精英敌人', effect: { flag: 'elite3' } },
      { text: '扣除阶级觉悟 3', effect: { classStand: -3 } },
      { text: '失去所有道具', effect: { flag: 'loseItems' } },
    ],
  },
  {
    id: 'faction_raid',
    title: '遭遇伏击',
    desc: '情报显示，接下来你会接连撞上同一阵营的敌人。',
    negative: true,
    options: [
      { text: '接下来 3 次遭遇古董派', effect: { flag: 'forceFaction', faction: Faction.GU_DONG, turns: 3 } },
      { text: '接下来 3 次遭遇裂土派', effect: { flag: 'forceFaction', faction: Faction.LIE_TU, turns: 3 } },
      { text: '接下来 3 次遭遇外来派', effect: { flag: 'forceFaction', faction: Faction.WAI_LAI, turns: 3 } },
      { text: '接下来 3 次遭遇闭目派', effect: { flag: 'forceFaction', faction: Faction.BI_MU, turns: 3 } },
      { text: '接下来 3 次遭遇极左派', effect: { flag: 'forceFaction', faction: Faction.JI_ZUO, turns: 3 } },
      { text: '接下来 3 次遭遇虚无派', effect: { flag: 'forceFaction', faction: Faction.XU_WU, turns: 3 } },
    ],
  },
  {
    id: 'blockade',
    title: '物资封锁',
    desc: '敌人切断了你的补给线。',
    negative: true,
    options: [
      { text: '硬撑（接下来 3 回合无法使用道具）', effect: { flag: 'noItems', turns: 3 } },
      { text: '花时间打通补给线（HP -1）', effect: { hp: -1 } },
    ],
  },
  {
    id: 'lock_cap',
    title: '能力桎梏',
    desc: '你感到某项能力的成长撞上了瓶颈，上限被锁死（只减不增）。',
    negative: true,
    options: [
      { text: '理论信心上限锁定 5 回合', effect: { flag: 'lockAttr', attr: 'confidence', turns: 5 } },
      { text: '辩证力上限锁定 5 回合', effect: { flag: 'lockAttr', attr: 'dialectic', turns: 5 } },
      { text: '阶级觉悟上限锁定 5 回合', effect: { flag: 'lockAttr', attr: 'classStand', turns: 5 } },
    ],
  },
  {
    id: 'shortcut',
    title: '捷径',
    desc: '有条小路能绕过前方几名敌人，但代价不小。',
    negative: true,
    options: [
      { text: '抄近道（跳过 3 名敌人，扣 3 HP）', effect: { flag: 'skipEnemies', count: 3, hp: -3 } },
      { text: '按原路走', effect: {} },
    ],
  },
  {
    id: 'attr_restore',
    title: '休整补给',
    desc: '你找到一处安全的地方稍作休整。',
    options: [
      { text: '复习理论，恢复信心', effect: { confidence: 2 } },
      { text: '梳理思路，恢复辩证力', effect: { dialectic: 2 } },
      { text: '联系群众，恢复觉悟', effect: { classStand: 2 } },
    ],
  },
  {
    id: 'attr_drain',
    title: '心力交瘁',
    desc: '连日论战让你身心俱疲，某项能力开始下滑。',
    negative: true,
    options: [
      { text: '信心受挫（信心 -1）', effect: { confidence: -1 } },
      { text: '思路迟滞（辩证力 -1）', effect: { dialectic: -1 } },
      { text: '信念动摇（觉悟 -1）', effect: { classStand: -1 } },
    ],
  },
];

// ── BOSS 战（三段论证专属） ───────────────────────────
// 三个 BOSS 池，每 10 题后随机抽一个
const BossStance = {
  ATTACK:  '攻',
  DEFEND:  '守',
  PROVOKE: '挑衅',
};

// 姿态 → 克制它的论证类型（拆招成功条件）
const BOSS_COUNTER = {
  '攻': ArgumentType.REDUCTIO,       // 归谬反诘克制「攻」
  '守': ArgumentType.RATIONAL,       // 理性辩证克制「守」
  '挑衅': ArgumentType.CLASS_CRITIQUE, // 阶级批判克制「挑衅」
};

const BOSS_POOLS = [
  ['fen_lie', 'jiang_tai_gong', 'wang_zuo', 'man_yi'],
  ['mu_tian', 'du_chong', 'she_mian', 'xiao_fen_hong'],
  ['mei_xi_fang', 'tao_zhong_ren', 'jian_zhi', 'hua_na', 'tuo_pai'],
];

const BOSS_TITLES = {
  fen_lie: '裂土魁首·酚鬣',
  jiang_tai_gong: '直钩钓客·姜太公',
  wang_zuo: '半吊子左将·旺座小鬼',
  man_yi: '复辟遗老·鳗衣',
  mu_tian: '市场万能教主·牧田',
  du_chong: '啃基之蠹·蠹虫',
  she_mian: '改良妥协家·蛇黾',
  xiao_fen_hong: '排外小将·小粉红',
  mei_xi_fang: '灯塔买办·美蜥鲂',
  tao_zhong_ren: '遗世套中人',
  jian_zhi: '机械建制者·剪纸',
  hua_na: '种族优越论者·华钠',
  tuo_pai: '无限细分者·沱牌',
};

// 三段论证三步（论点 → 论据 → 反击），每步 3 个论证类型选项（内容独立）
const BOSS_ARG_STEPS = [
  {
    key: '论点',
    options: [
      { type: ArgumentType.RATIONAL, text: '以历史唯物主义的根本结论立论' },
      { type: ArgumentType.REDUCTIO, text: '抓住对方逻辑的荒谬处立论' },
      { type: ArgumentType.CLASS_CRITIQUE, text: '从阶级本质出发立论' },
    ],
  },
  {
    key: '论据',
    options: [
      { type: ArgumentType.RATIONAL, text: '援引政治经济学的铁证' },
      { type: ArgumentType.REDUCTIO, text: '把对方逻辑推向极致作反证' },
      { type: ArgumentType.CLASS_CRITIQUE, text: '点破其背后的阶级利益' },
    ],
  },
  {
    key: '反击',
    options: [
      { type: ArgumentType.RATIONAL, text: '用矛盾分析法正面反击' },
      { type: ArgumentType.REDUCTIO, text: '反将一军，让其自相矛盾' },
      { type: ArgumentType.CLASS_CRITIQUE, text: '直指其立场的阶级本质' },
    ],
  },
];

// ── 杀招（build / 职业专精） ─────────────────────────
// 击败 BOSS 后在商店解锁，选择自己钟爱的杀招组合；所有杀招共享冷却
const ULTIMATES = [
  {
    id: 'theory_crush',
    name: '理论碾压',
    type: ArgumentType.RATIONAL,
    desc: '以历史唯物主义的根本结论正面击溃，造成 5 伤害',
    condition: { attr: 'confidence', above: 15, preciseHits: 3 },
    damage: 5,
    cooldown: 3,
    sideEffect: null,
  },
  {
    id: 'reductio_gambit',
    name: '归谬杀招',
    type: ArgumentType.REDUCTIO,
    desc: '把对方逻辑推向极致暴露荒谬，造成 5 伤害',
    condition: { attr: 'dialectic', above: 15, preciseHits: 3 },
    damage: 5,
    cooldown: 3,
    sideEffect: null,
  },
  {
    id: 'class_judgment',
    name: '阶级审判',
    type: ArgumentType.CLASS_CRITIQUE,
    desc: '从阶级立场给出致命一击，造成 5 伤害',
    condition: { attr: 'classStand', above: 15, preciseHits: 3 },
    damage: 5,
    cooldown: 3,
    sideEffect: null,
  },
  {
    id: 'desperate_strike',
    name: '背水一战',
    type: ArgumentType.EMOTIONAL,
    desc: '无条件释放，造成 4 伤害，但自身 -2 HP',
    condition: null,
    damage: 4,
    cooldown: 2,
    sideEffect: { hp: -2 },
  },
];

// ── 敌人特点 + 特殊能力（图鉴 / 机械生效） ──────────
// mechanic.type：weaknessAmplify=弱点增伤/非弱点减伤；onDefeatShift=被击败时属性高低转移
// 特殊能力分级：普通 1 个 / 精英 2 个 / BOSS 3 个（abilities 数组按顺序取）
const ENEMY_SPECIALS = {
  huang_han:   { trait: '惯用「血统论」为汉族独尊辩护', special: '血统清算（亡语）· 概率动摇觉悟 · BOSS 封印选项', abilities: [
    { type: 'weaknessAmplify', bonus: 1, penalty: -1 },
    { type: 'debuffPlayer', attr: 'classStand', value: -1, chance: 0.25 },
    { type: 'sealOption', chance: 0.3 },
  ] },
  hua_na:      { trait: '把种族优越论包装成「科学」', special: '优等幻想（弱点增伤）· 吸血 · BOSS 封印选项', abilities: [
    { type: 'weaknessAmplify', bonus: 1, penalty: -1 },
    { type: 'lifesteal', value: 1 },
    { type: 'sealOption', chance: 0.35 },
  ] },
  kong_lao_da: { trait: '以「传统」为名复辟封建礼教', special: '礼教自愈 · 亡语（信心转移）', abilities: [
    { type: 'buffSelf', value: 1, chance: 0.3 },
    { type: 'deathrattle', attr: 'confidence', threshold: 8, below: -1, above: 1 },
  ] },
  fen_lie:     { trait: '煽动地方民族情绪、召唤蠹虫', special: '招蠹（弱点增伤）· 概率动摇辩证 · BOSS 封印选项', abilities: [
    { type: 'weaknessAmplify', bonus: 1, penalty: -1 },
    { type: 'debuffPlayer', attr: 'dialectic', value: -1, chance: 0.25 },
    { type: 'sealOption', chance: 0.3 },
  ] },
  du_chong:    { trait: '啃噬统一根基的独立代言人', special: '啃基（吸血）· 概率动摇辩证', abilities: [
    { type: 'lifesteal', value: 1 },
    { type: 'debuffPlayer', attr: 'dialectic', value: -1, chance: 0.2 },
  ] },
  man_yi:      { trait: '精神清朝贵族，幻想复辟旧秩序', special: '复辟遗毒（亡语）· 自愈', abilities: [
    { type: 'deathrattle', attr: 'confidence', threshold: 8, below: -1, above: 1 },
    { type: 'buffSelf', value: 1, chance: 0.3 },
  ] },
  mu_tian:     { trait: '迷信「市场万能」的自由派旗手', special: '市场神话（弱点增伤）· 自愈 · BOSS 封印选项', abilities: [
    { type: 'weaknessAmplify', bonus: 1, penalty: -1 },
    { type: 'buffSelf', value: 1, chance: 0.25 },
    { type: 'sealOption', chance: 0.3 },
  ] },
  mei_xi_fang: { trait: '境外势力的精神买办', special: '灯塔炫目（弱点+2）· 吸血 · BOSS 封印选项', abilities: [
    { type: 'weaknessAmplify', bonus: 2, penalty: -1 },
    { type: 'lifesteal', value: 1 },
    { type: 'sealOption', chance: 0.4 },
  ] },
  she_mian:    { trait: '鼓吹改良妥协、反对革命', special: '改良麻痹：可教化；概率动摇觉悟 · 自愈', abilities: [
    { type: 'debuffPlayer', attr: 'classStand', value: -1, chance: 0.2 },
    { type: 'buffSelf', value: 1, chance: 0.25 },
  ] },
  xiao_fen_hong:{ trait: '无脑鼓吹抽象中国、极端排外', special: '盲目排外：可教化；弱点增伤 · 概率动摇信心', abilities: [
    { type: 'weaknessAmplify', bonus: 1, penalty: 0 },
    { type: 'debuffPlayer', attr: 'confidence', value: -1, chance: 0.2 },
  ] },
  jian_zhi:    { trait: '机械静止地拥护现行一切', special: '僵化建制：自愈 · 吸血', abilities: [
    { type: 'buffSelf', value: 1, chance: 0.3 },
    { type: 'lifesteal', value: 1 },
  ] },
  tao_zhong_ren:{ trait: '自以为清醒的政治冷淡者', special: '麻木外壳（弱点+2）· 自愈 · BOSS 封印选项', abilities: [
    { type: 'weaknessAmplify', bonus: 2, penalty: -1 },
    { type: 'buffSelf', value: 1, chance: 0.3 },
    { type: 'sealOption', chance: 0.3 },
  ] },
  tuo_pai:     { trait: '脱离现实条件空谈革命', special: '无限细分：概率动摇辩证 · 吸血', abilities: [
    { type: 'debuffPlayer', attr: 'dialectic', value: -1, chance: 0.25 },
    { type: 'lifesteal', value: 1 },
  ] },
  wang_zuo:    { trait: '不学无术的网络「左派」小鬼', special: '半吊子：可教化；弱点增伤 · 概率动摇辩证', abilities: [
    { type: 'weaknessAmplify', bonus: 1, penalty: 0 },
    { type: 'debuffPlayer', attr: 'dialectic', value: -1, chance: 0.2 },
  ] },
  xu_wu:       { trait: '以「历史无真相」消解严肃', special: '历史虚无（亡语）· 概率动摇信心', abilities: [
    { type: 'deathrattle', attr: 'confidence', threshold: 8, below: -1, above: 1 },
    { type: 'debuffPlayer', attr: 'confidence', value: -1, chance: 0.2 },
  ] },
  jiang_tai_gong:{ trait: '直钩钓鱼的乐子人', special: '直钩（弱点增伤）· 吸血', abilities: [
    { type: 'weaknessAmplify', bonus: 1, penalty: -1 },
    { type: 'lifesteal', value: 1 },
  ] },
};

// ── 游戏常量 ──────────────────────────────────────────
const GAME_CONFIG = {
  questionsPerRun: 30,        // 每局抽题数（30 题普通 + 3 BOSS 关）
  startingHp: 10,
  startingItemCount: 0,       // 开局无道具，打精英怪掉落
  maxItems: 6,                // 道具上限
  comboChanceOnLowConfidence: 0.3,  // 理论信心过低时连环题概率
  lowConfidenceThreshold: 6,  // 属性低于此值视为「过低」导致伤害下降（0-20 区间，平衡待调）
  statMin: 0,
  statMax: 20,                // 属性上限
  overflowMax: 20,            // 属性溢出上限（与上限一致，不再溢出）
  hpMax: 10,                  // HP 上限（独立于属性上限）
  normalHp: 2,                // 普通怪基础血量
  eliteHp: 5,                 // 精英怪基础血量
  // 开局三属性：各 5~10 浮动、总和固定 24
  startAttrMin: 5,
  startAttrMax: 10,
  startAttrSum: 24,
  // 难度三档（题 1-10 / 11-20 / 21-30）：血量加成
  diffHpBonusNormal: [0, 1, 1],
  diffHpBonusElite:  [0, 2, 2],
  diffHpBonusBoss:   [0, 3, 3],
  hardDamagePenalty: 1,       // 困难档默认 -1 伤害
  hardSelfHarmHp: 1,          // 困难档 0 伤倒扣 HP
  immunityAttrThreshold: 15,  // 属性 > 此值免除困难档惩罚（成长体现）
  ultimateDamageCap: 6,       // 杀招/特殊选项伤害上限（突破普通 3）
  bossBaseHp: 8,              // BOSS 基础血量
  bossChainDamage: 2,         // 拆招成功（非杀招）对 BOSS 伤害
  bossFinisherDamage: 6,      // 三段论证杀招伤害
  bossAttackDamage: 2,        // 「攻」姿态拆招失败玩家扣血
  bossDefendHeal: 2,          // 「守」姿态拆招失败 BOSS 回血
  bossProvokeDebuff: 1,       // 「挑衅」姿态拆招失败玩家掉属性
};
