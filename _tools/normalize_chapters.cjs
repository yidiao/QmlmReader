const fs = require('fs');
const path = require('path');

const root = 'D:\\AI Pj\\Qmlmreader';
const pages = fs.readdirSync(path.join(root, 'html', 'articles'), { withFileTypes: true });

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.isFile() && p.endsWith('.html') && !p.endsWith('_template-v2.html') && !p.endsWith('articles.html') ? [p] : [];
  });
}

function esc(v) {
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const htmlFiles = walk(path.join(root, 'html', 'articles'));
for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  // remove per-page chapter toggle inline scripts if they exist
  html = html.replace(/<script>\s*\(function\(\)\{[\s\S]*?<\/script>/g, '');
  html = html.replace(/<script>\s*document\.addEventListener\(['"]DOMContentLoaded['"],[\s\S]*?<\/script>/g, '');
  html = html.replace(/<script src="\.\.\.\/\.\.\/\.\.\/js\/article-json\.js"><\/script>\s*/g, '');
  html = html.replace(/<script src="\.\.\/\.\.\/\.\.\/js\/article-json\.js"><\/script>\s*/g, '');

  // unify to public article-common only once before site-data/main/darkmode/cursor scripts
  if (!html.includes('../../../js/article-common.js')) {
    html = html.replace(/<script src="\.\.\/\.\.\/\.\.\/js\/site-data\.js"><\/script>/, '<script src="../../../js/article-common.js"></script>\n    <script src="../../../js/site-data.js"></script>');
  }

  // normalize chapter titles for pages that still say 第x部分 where we can infer better from data json
  const jsonPath = path.join(root, 'data', 'articles-json', path.basename(path.dirname(file)), path.basename(file, '.html') + '.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, ''));
    if (data.title === '论我国革命') {
      html = html.replace(/<h3 class="chapter-title" onclick="toggleChapter\(this\)"><span class="toggle-icon"><\/span>第1部分<\/h3>/g,
        '<h3 class="chapter-title" onclick="toggleChapter(this)"><span class="toggle-icon"></span>一 革命辩证法</h3>');
    }
    if (data.title === '矛盾论') {
      html = html.replace(/>第\d+部分<\/h3>/g, (m, idx) => m);
    }
  }

  fs.writeFileSync(file, html, 'utf8');
}
console.log(JSON.stringify({ files: htmlFiles.length }, null, 2));
