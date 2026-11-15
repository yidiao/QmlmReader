/* 批次A：新增截面 1848 / 1864 / 1889 / 1905 + 1905 事件 + 出处登记。
 * 全部事实已核到原文页（marxists.org 原文与文献档案），详见交付说明。
 * 幂等：已存在同 id 则先移除再插入，保持时间序。 */
const fs = require('fs');
const path = 'data/international/atlas.json';
const a = JSON.parse(fs.readFileSync(path, 'utf8'));

/* ---------- 1. camps.sources 登记（快照/国家分期出处库） ---------- */
const campSources = {
  manifesto: {
    title: '马克思、恩格斯：《共产党宣言》及各版序言',
    url: 'https://www.marxists.org/archive/marx/works/1848/communist-manifesto/',
    kind: '历史原文',
    date: '1848年2月伦敦出版／后续序言'
  },
  first1864: {
    title: '马克思：国际工人协会成立宣言（页面载明1864年9月28日圣马丁堂成立大会）',
    url: 'https://www.marxists.org/archive/marx/works/1864/10/27.htm',
    kind: '历史原文',
    date: '1864'
  },
  second1889: {
    title: '第二国际成立大会（1889年7月14—20日巴黎）会议记录档案',
    url: 'https://www.marxists.org/history/international/social-democracy/1889/marxists-congress/index.htm',
    kind: '历史文献档案',
    date: '1889-07-14／20'
  },
  second1889intro: {
    title: '第二国际决议集导言：1889年成立大会与1890年五一节的确立',
    url: 'https://www.marxists.org/history/international/social-democracy/second-international-resolutions-book/introduction.htm',
    kind: '档案整理导言，立场归整理者',
    date: '整理本页更新于2025-09-23'
  },
  lenin1905: {
    title: '列宁：《俄国革命的开始》（《前进报》第4号，1905年1月31日（18日））',
    url: 'https://www.marxists.org/archive/lenin/works/1905/jan/25.htm',
    kind: '历史原文',
    date: '1905-01-31'
  },
  russia1905: {
    title: '俄国1905年革命文献汇编（含编年、回忆与评论目录）',
    url: 'https://www.marxists.org/history/ussr/events/1905/index.htm',
    kind: '历史文献档案；概述性文字为档案站整理',
    date: '1905／汇编页面持续更新'
  }
};
for (const [k, v] of Object.entries(campSources)) a.camps.sources[k] = v;

/* ---------- 2. 顶层 sources 登记（1905 事件用） ---------- */
a.sources.lenin1905 = {
  title: '列宁：《俄国革命的开始》（《前进报》第4号）',
  url: 'https://www.marxists.org/archive/lenin/works/1905/jan/25.htm',
  kind: '历史原文',
  date: '1905-01-31'
};
a.sources.russia1905 = {
  title: '俄国1905年革命文献汇编（MIA历史档案）',
  url: 'https://www.marxists.org/history/ussr/events/1905/index.htm',
  kind: '历史文献档案',
  date: '1905／汇编'
};

/* ---------- 3. 快照（按年代插入正确位置） ---------- */
const newSnaps = [
  {
    id: '1848',
    title: '宣言元年：纲领先于政权',
    date: '1848-12-31',
    members: {},
    notes: '本截面刻意不涂任何国家：社会主义在这一年是纲领与运动，还不是国家现象。《共产党宣言》1848年2月在伦敦出版；同年欧洲多国爆发革命，巴黎六月起义把工人与统治阶级的武装冲突推上政治中心。底图不是1848年历史疆界复原。',
    sources: ['manifesto'],
    federations: [],
    activeStates: [],
    uncertainStates: [],
    nature: {}
  },
  {
    id: '1864',
    title: '第一国际成立',
    date: '1864-09-28',
    members: {},
    notes: '本截面同样不涂任何国家：国际工人协会是跨国的组织网络，不是政权。1864年9月28日各国工人代表在伦敦圣马丁堂举行成立大会；马克思起草成立宣言与共同章程。底图不是这一时期的历史疆界复原。',
    sources: ['first1864'],
    federations: [],
    activeStates: [],
    uncertainStates: [],
    nature: {}
  },
  {
    id: '1889',
    title: '第二国际成立',
    date: '1889-07-14',
    members: {},
    notes: '本截面不涂任何国家：此时群众性工人政党正在各国形成，夺取政权尚未提上日程。1889年7月14日至20日，马克思主义派国际工人大会在巴黎召开（与可能主义派大会同期）；大会赞同美国工人联合会关于八小时工作日的倡议，确定1890年5月1日为国际示威与罢工日。底图不是这一时期的历史疆界复原。',
    sources: ['second1889', 'second1889intro'],
    federations: [],
    activeStates: [],
    uncertainStates: [],
    nature: {}
  },
  {
    id: '1905',
    title: '俄国第一次革命与苏维埃的诞生',
    date: '1905-12-31',
    members: {},
    notes: '本截面不涂任何国家：1905年革命提出了政权问题，但尚没有留下工人国家。1月9日"流血星期日"（列宁称其为国内战争的深刻教训）后，罢工浪潮席卷俄国，工人代表苏维埃在罢工中诞生；12月起义被镇压后革命转入低潮。苏维埃此年是斗争机关而非国家政权——这正是与1917年对照的看点。底图不是这一时期的历史疆界复原。',
    sources: ['lenin1905', 'russia1905'],
    federations: [],
    activeStates: [],
    uncertainStates: [],
    nature: {}
  }
];
for (const s of newSnaps) {
  const i = a.camps.snapshots.findIndex(x => x.id === s.id);
  if (i >= 0) a.camps.snapshots.splice(i, 1);
  /* 数组本身按年代排列：插到第一个年份严格更大的快照之前（同年保持原序） */
  const y = parseInt(s.date, 10);
  let insertAt = a.camps.snapshots.findIndex(x => parseInt(x.date, 10) > y);
  if (insertAt < 0) insertAt = a.camps.snapshots.length;
  a.camps.snapshots.splice(insertAt, 0, s);
}

/* ---------- 4. 1905 事件（检索室"历史节点"视图） ---------- */
if (!a.events.some(e => e.id === 'russia-1905')) {
  const ev = {
    id: 'russia-1905',
    year: 1905,
    date: '1905年',
    title: '俄国第一次革命与苏维埃的诞生',
    country: 'RUS',
    category: 'revolution',
    summary: '从"流血星期日"到全国罢工浪潮，工人代表苏维埃第一次登上政治舞台。',
    paragraphs: [
      '1905年1月9日，圣彼得堡工人向沙皇递交请愿书，遭军队开枪，史称"流血星期日"。列宁在《俄国革命的开始》中称之为国内战争的深刻教训，并指出工人对沙皇的信任被子弹打碎。',
      '罢工浪潮中诞生了工人代表苏维埃这一新的斗争组织形式；年底的武装起义被镇压后革命转入低潮，但"苏维埃"保留了下来。1905年在国际共运史上通常被视为1917年革命的预演。'
    ],
    question: '为什么1905年的斗争形式，能够在1917年转变为国家政权的形式？',
    sources: ['lenin1905', 'russia1905'],
    era: 'origins',
    keywords: ['苏维埃', '1905', '流血星期日']
  };
  /* 保持 events 数组按 year 插入位置（1905 在 1889 与 1914 之间） */
  let evPos = a.events.findIndex(e => e.year > 1905);
  if (evPos < 0) evPos = a.events.length;
  a.events.splice(evPos, 0, ev);
}

/* ---------- 5. 更新时间戳并写回 ---------- */
a.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path, JSON.stringify(a));
console.log('batch A done. snapshots:', a.camps.snapshots.map(s => s.id).join(','));
console.log('events:', a.events.length, 'sources:', Object.keys(a.sources).length, 'camps.sources:', Object.keys(a.camps.sources).length);
