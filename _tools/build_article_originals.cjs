const fs = require('fs');
const path = require('path');

const root = 'D:\\AI Pj\\Qmlmreader';
const manifestPath = path.join(root, 'data', 'articles-json', 'manifest.json');
const sourceRoot = 'D:\\AI Pj\\金星与赤旗\\著作提取\\_txt';
const dataRoot = path.join(root, 'data', 'articles-json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));

function readUtf8(file) { return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function sourceFor(row) {
  if (row.html.endsWith('shi-jian-lun.html')) {
    return fs.readdirSync(path.join(sourceRoot, '毛泽东'), { recursive: true })
      .map(p => path.join(sourceRoot, '毛泽东', p))
      .find(p => p.endsWith('.txt') && path.basename(p).includes('实践论'));
  }
  return row.source;
}
function mentorFor(row) {
  if (row.html.includes('\\Engels\\')) return 'Engels';
  if (row.html.includes('\\Lenin\\')) return 'Lenin';
  if (row.html.includes('\\Marx\\')) return 'Marx';
  if (row.html.includes('\\Stalin\\')) return 'Stalin';
  return 'Mao';
}
function starFor(file) {
  return (path.basename(file).match(/^[★☆]+/) || [''])[0];
}
function makeData(row, source) {
  const content = readUtf8(source);
  const mentor = mentorFor(row);
  const star = starFor(source) || row.star || '未分级';
  const data = { title: row.title, mentor, star, slug: path.basename(row.html, '.html'), source, content };
  const dir = path.join(dataRoot, mentor, star);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${data.slug}.json`), JSON.stringify(data, null, 2), 'utf8');
  return { ...row, mentor, star, source, status: 'matched', json: path.join(dir, `${data.slug}.json`) };
}
function originalHtml(row) {
  const source = sourceFor(row);
  if (!source || !fs.existsSync(source)) throw new Error(`missing source: ${row.html}`);
  const content = readUtf8(source);
  const lines = content.split(/\r?\n/);
  const title = lines.shift()?.trim() || row.title;
  let paragraphs = lines.join('\n').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  if (paragraphs.length < 2) paragraphs = lines.join('\n').split(/\n+/).map(s => s.trim()).filter(Boolean);
  const chunkSize = 18;
  const chapters = [];
  for (let i = 0; i < paragraphs.length; i += chunkSize) chapters.push(paragraphs.slice(i, i + chunkSize));
  const body = chapters.map((ps, i) => `<div class="chapter"><h3 class="chapter-title" onclick="toggleChapter(this)"><span class="toggle-icon"></span>第${i + 1}部分</h3><div class="chapter-content">${ps.map(p => `<p>${escapeHtml(p)}</p>`).join('')}</div></div>`).join('\n');
  return `<div class="tab-content active" id="original">\n            <div class="original-text">\n                <div class="text-intro"><p><strong>原文：</strong>${escapeHtml(title)}</p></div>\n                <div style="text-align:right;"><button class="chapter-toggle-all" onclick="toggleAllChapters()" id="chapterToggleBtn">收起全部</button></div>\n                ${body}\n            </div>\n        </div>\n\n        `;
}
const results = [];
for (const row of manifest) {
  const source = sourceFor(row);
  if (!source || !fs.existsSync(source)) { results.push({ ...row, status: 'missing-source' }); continue; }
  const updated = makeData(row, source);
  const htmlPath = row.html;
  let html = readUtf8(htmlPath);
  if (htmlPath.endsWith('shi-jian-lun.html')) html = html.replace(/<title>[^<]*/, '<title>实践论').replace(/<h1>[^<]*/, '<h1>实践论');
  const start = html.indexOf('<div class="tab-content active" id="original">') >= 0 ? html.indexOf('<div class="tab-content active" id="original">') : html.indexOf('<div class="tab-content" id="original">');
  const reading = html.indexOf('<div class="tab-content" id="reading">', start) >= 0 ? html.indexOf('<div class="tab-content" id="reading">', start) : html.indexOf('<div class="tab-content active" id="reading">', start);
  if (start < 0 || reading < 0) throw new Error(`original boundaries missing: ${htmlPath}`);
  html = html.slice(0, start) + originalHtml(row) + html.slice(reading);
  fs.writeFileSync(htmlPath, html, 'utf8');
  results.push(updated);
}
fs.writeFileSync(path.join(dataRoot, 'manifest.generated.json'), JSON.stringify(results, null, 2), 'utf8');
console.log(JSON.stringify({ pages: results.length, matched: results.filter(r => r.status === 'matched').length, missing: results.filter(r => r.status !== 'matched').map(r => r.html) }, null, 2));
