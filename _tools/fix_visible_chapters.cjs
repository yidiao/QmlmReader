const fs = require('fs');
const path = require('path');

const root = 'D:\\AI Pj\\Qmlmreader';
const sourceRoot = 'D:\\AI Pj\\金星与赤旗\\著作提取\\_txt';

function read(file){ return fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function paraHtml(text){
  return text.split(/\r?\n\s*\r?\n|\r?\n/).map(s=>s.trim()).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
}
function replaceOriginal(html, original){
  const start = html.indexOf('<div class="tab-content active" id="original">');
  const reading = html.indexOf('<div class="tab-content" id="reading">', start);
  if(start<0 || reading<0) throw new Error('missing original boundary');
  return html.slice(0,start)+original+'\n\n        '+html.slice(reading);
}
function cleanTail(html){
  html = html.replace(/<script>\s*function switchTab\([\s\S]*?<\/script>\s*/g,'');
  html = html.replace(/`n/g,'\n');
  html = html.replace(/(?:\s*<script src="\.\.\/\.\.\/\.\.\/js\/(?:article-common|site-data|main|darkmode|cursor)\.js"><\/script>\s*)+\s*<\/body>/g,
`\n    <script src="../../../js/article-common.js"></script>\n    <script src="../../../js/site-data.js"></script>\n    <script src="../../../js/main.js"></script>\n    <script src="../../../js/darkmode.js"></script>\n    <script src="../../../js/cursor.js"></script>\n</body>`);
  return html;
}
function originalSection(title, chapters){
  return `<div class="tab-content active" id="original">\n            <div class="original-text">\n                <div class="text-intro"><p><strong>原文：</strong>${esc(title)}</p></div>\n                <div style="text-align:right;"><button class="chapter-toggle-all" onclick="toggleAllChapters()" id="chapterToggleBtn">收起全部</button></div>\n                ${chapters.map(ch=>`<div class="chapter"><h3 class="chapter-title" onclick="toggleChapter(this)"><span class="toggle-icon"></span>${esc(ch.title)}</h3><div class="chapter-content">${paraHtml(ch.body)}</div></div>`).join('\n')}\n            </div>\n        </div>`;
}
function splitByMarkers(content, defs){
  const titleLine = content.split(/\r?\n/).find(Boolean)?.trim() || '';
  let body = content;
  const positions = defs.map(d => ({...d, idx: body.indexOf(d.marker)})).filter(d=>d.idx>=0).sort((a,b)=>a.idx-b.idx);
  if(!positions.length) throw new Error('no markers');
  return positions.map((d,i)=>({ title:d.title, body: body.slice(d.idx, i+1<positions.length ? positions[i+1].idx : body.length).trim() }));
}

const maoDunHtml = path.join(root,'html','articles','Mao','mao-dun-lun.html');
const maoDunSrc = path.join(sourceRoot,'毛泽东','毛泽东选集十卷合订本 67年版 无删减版','★★★★★-017-矛盾论.txt');
let html = read(maoDunHtml);
let content = read(maoDunSrc);
let chapters = splitByMarkers(content, [
  {title:'一 两种宇宙观', marker:'一两种宇宙观'},
  {title:'二 矛盾的普遍性', marker:'二矛盾的普遍性'},
  {title:'三 矛盾的特殊性', marker:'三矛盾的特殊性'},
  {title:'四 主要的矛盾和主要的矛盾方面', marker:'四主要的矛盾和主要的矛盾方面'},
  {title:'五 矛盾诸方面的同一性和斗争性', marker:'五矛盾诸方面的同一性和斗争性'},
  {title:'六 对抗在矛盾中的地位', marker:'六对抗在矛盾中的地位'},
  {title:'七 结论', marker:'七结论'},
]);
html = replaceOriginal(html, originalSection('矛盾论', chapters));
html = cleanTail(html);
fs.writeFileSync(maoDunHtml, html, 'utf8');

const leninHtml = path.join(root,'html','articles','Lenin','lun-wo-guo-ge-ming.html');
html = read(leninHtml);
const start = html.indexOf('<div class="tab-content active" id="original">');
const reading = html.indexOf('<div class="tab-content" id="reading">', start);
if(start>=0 && reading>=0){
  const orig = html.slice(start, reading);
  let updated = orig.replace(/<h3 class="chapter-title" onclick="toggleChapter\(this\)"><span class="toggle-icon"><\/span>第1部分<\/h3>/, '<h3 class="chapter-title" onclick="toggleChapter(this)"><span class="toggle-icon"></span>一 革命的辩证法</h3>');
  html = html.slice(0,start)+updated+html.slice(reading);
}
html = cleanTail(html);
fs.writeFileSync(leninHtml, html, 'utf8');

console.log(JSON.stringify({fixed:['Mao/mao-dun-lun.html','Lenin/lun-wo-guo-ge-ming.html']}));
