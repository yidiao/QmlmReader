const fs = require('fs');
const path = require('path');

const root = 'D:\\AI Pj\\Qmlmreader';
const dataRoot = path.join(root, 'data', 'articles-json');
const metaRoot = path.join(dataRoot, '_meta');
const manifest = JSON.parse(fs.readFileSync(path.join(metaRoot, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const htmlRoot = path.join(root, 'html', 'articles');

function readUtf8(file) { return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); }
function esc(v) { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function slug(file) { return path.basename(file, '.html'); }
function mentorName(file) { if (file.includes('\\Lenin\\')) return 'Lenin'; if (file.includes('\\Mao\\')) return 'Mao'; if (file.includes('\\Marx\\')) return 'Marx'; if (file.includes('\\Engels\\')) return 'Engels'; return 'Stalin'; }
function sourceFor(row) {
  if (row.html.endsWith('shi-jian-lun.html')) {
    return path.join('D:\\AI Pj\\金星与赤旗\\著作提取\\_txt\\毛泽东\\毛泽东选集十卷合订本 67年版 无删减版\\★★★★★-016-实践论 ——论认识和实践的关系——知和行的关系.txt');
  }
  return row.source;
}
function titleFromContent(content, fallback) {
  const first = (content.split(/\r?\n/).find(Boolean) || '').trim();
  return first || fallback;
}
function splitPractice(content) {
  const paras = content.split(/\r?\n\s*\r?\n/).map(s => s.trim()).filter(Boolean);
  const chapters = [
    ['马克思以前的唯物论，离开人的社会性，离开人的历史发展，去观察认识问题，因此不能了解认识对社会实践的依赖关系，即认识对生产和阶级斗争的依赖关系。',
     '首先，马克思主义者认为人类的生产活动是最基本的实践活动，是决定其他一切活动的东西。人的认识，主要地依赖于物质的生产活动，逐渐地了解自然的现象、自然的性质、自然的规律性、人和自然的关系；而且经过生产活动，也在各种不同程度上逐渐地认识了人和人的一定的相互关系。一切这些知识，离开生产活动是不能得到的。'],
    ['人的社会实践，不限于生产活动一种形式，还有多种其他的形式，阶级斗争，政治生活，科学和艺术的活动，总之社会实际生活的一切领域都是社会的人所参加的。',
     '马克思主义者认为人类社会的生产活动，是一步又一步地由低级向高级发展，因此，人们的认识，不论对于自然界方面，对于社会方面，也都是一步又一步地由低级向高级发展，即由浅入深，由片面到更多的方面。'],
    ['马克思主义者认为，只有人们的社会实践，才是人们对于外界认识的真理性的标准。',
     '然而人的认识究竟怎样从实践发生，而又服务于实践呢？这只要看一看认识的发展过程就会明了的。'],
    ['原来人在实践过程中，开始只是看到过程中各个事物的现象方面，看到各个事物的片面，看到各个事物之间的外部联系。',
     '社会实践的继续，使人们在实践中引起感觉和印象的东西反复了多次，于是在人们的脑里生起了一个认识过程中的突变（即飞跃），产生了概念。'],
    ['认识的真正任务在于经过感觉而到达于思维，到达于逐步了解客观事物的内部矛盾，了解它的规律性，了解这一过程和那一过程间的内部联系，即到达于论理的认识。',
     '这种基于实践的由浅入深的辩证唯物论的关于认识发展过程的理论，在马克思主义以前，是没有一个人这样解决过的。'],
    ['我们的实践证明：感觉到了的东西，我们不能立刻理解它，只有理解了的东西才更深刻地感觉它。',
     '知识的问题是一个科学问题，来不得半点的虚伪和骄傲，决定地需要的倒是其反面——诚实和谦逊的态度。'],
    ['为了明了基于变革现实的实践而产生的辩证唯物论的认识运动——认识的逐渐深化的运动，下面再举出几个具体的例子。',
     '我们再来看战争。战争的领导者，如果他们是一些没有战争经验的人，对于一个具体的战争，在开始阶段是不了解的。']
  ];
  return chapters.map((c, idx) => ({ title: ['一 认识和实践','二 认识的来源','三 真理的标准','四 从感性到理性','五 论理认识','六 知识与实践','七 具体例子与结论'][idx], paras: c }));
}
function chapterHtml(chapters) {
  return chapters.map((ch, i) => `<div class="chapter"><h3 class="chapter-title" onclick="toggleChapter(this)"><span class="toggle-icon"></span>${esc(ch.title)}</h3><div class="chapter-content">${ch.paras.map(p => `<p>${esc(p)}</p>`).join('')}</div></div>`).join('\n');
}
function originalSection(row, content) {
  const title = titleFromContent(content, row.title);
  let chapters;
  if (row.html.endsWith('shi-jian-lun.html')) chapters = splitPractice(content);
  else {
    const paras = content.split(/\r?\n\s*\r?\n/).map(s => s.trim()).filter(Boolean);
    const chunk = paras.length > 14 ? 14 : 10;
    chapters = [];
    for (let i = 0; i < paras.length; i += chunk) chapters.push({ title: `第${chapters.length + 1}部分`, paras: paras.slice(i, i + chunk) });
  }
  return `<div class="tab-content active" id="original">\n            <div class="original-text">\n                <div class="text-intro"><p><strong>原文：</strong>${esc(title)}</p></div>\n                <div style="text-align:right;"><button class="chapter-toggle-all" onclick="toggleAllChapters()" id="chapterToggleBtn">收起全部</button></div>\n                ${chapterHtml(chapters)}\n            </div>\n        </div>`;
}

for (const row of manifest) {
  const source = sourceFor(row);
  if (!fs.existsSync(source)) continue;
  const content = readUtf8(source);
  const mentor = mentorName(row.html);
  const star = (path.basename(source).match(/^[★☆]+/) || ['未分级'])[0];
  const jsonDir = path.join(dataRoot, mentor, star);
  fs.mkdirSync(jsonDir, { recursive: true });
  fs.writeFileSync(path.join(jsonDir, `${slug(row.html)}.json`), JSON.stringify({ title: row.title, mentor, star, slug: slug(row.html), source, content }, null, 2), 'utf8');

  let html = readUtf8(row.html);
  if (row.html.endsWith('shi-jian-lun.html')) {
    html = html.replace(/<title>.*?<\/title>/, '<title>实践论 - 青年马列毛主义驿站</title>');
    html = html.replace(/<h1>.*?<\/h1>/, '<h1>实践论</h1>');
    html = html.replace(/<div class="article-subtitle">.*?<\/div>/, '<div class="article-subtitle">关于认识和实践的关系——知和行的关系</div>');
    html = html.replace(/<span class="date">.*?<\/span>/, '<span class="date">1937年7月</span>');
    html = html.replace(/<span class="word-count">.*?<\/span>/, '<span class="word-count">约9,400字</span>');
  }
  const start = html.indexOf('<div class="tab-content active" id="original">');
  const reading = html.indexOf('<div class="tab-content" id="reading">', start);
  const original = originalSection(row, content);
  html = html.slice(0, start) + original + '\n\n        ' + html.slice(reading);
  fs.writeFileSync(row.html, html, 'utf8');
}

console.log('rebuilt');
