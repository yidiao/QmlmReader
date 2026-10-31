const fs = require('fs');
const path = require('path');
const root = 'D:\\AI Pj\\Qmlmreader';
const manifest = JSON.parse(fs.readFileSync(path.join(root,'data','articles-json','_meta','manifest.json'),'utf8').replace(/^\uFEFF/,''));

function read(f){return fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'');}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function paras(content){return content.split(/\r?\n\s*\r?\n|\r?\n/).map(s=>s.trim()).filter(Boolean).filter(s=>!/^[-—_\s]+$/.test(s));}
function titleOf(i,total,ps){
  const nums=['第一节','第二节','第三节','第四节','第五节','第六节','第七节','第八节','第九节','第十节','第十一节','第十二节'];
  const first=(ps[0]||'').replace(/\s+/g,' ').slice(0,26);
  return `${nums[i]||`第${i+1}节`} ${first}`;
}
function section(title, chunks, originalTitle){
  return `<div class="tab-content active" id="original">\n            <div class="original-text">\n                <div class="text-intro"><p><strong>原文：</strong>${esc(originalTitle)}</p></div>\n                <div style="text-align:right;"><button class="chapter-toggle-all" onclick="toggleAllChapters()" id="chapterToggleBtn">收起全部</button></div>\n                ${chunks.map((ch,i)=>`<div class="chapter"><h3 class="chapter-title" onclick="toggleChapter(this)"><span class="toggle-icon"></span>${esc(ch.title)}</h3><div class="chapter-content">${ch.paras.map(p=>`<p>${esc(p)}</p>`).join('')}</div></div>`).join('\n')}\n            </div>\n        </div>`;
}
function replaceOriginal(html, original){
 const start=html.indexOf('<div class="tab-content active" id="original">');
 const reading=html.indexOf('<div class="tab-content" id="reading">', start);
 if(start<0||reading<0) return html;
 return html.slice(0,start)+original+'\n\n        '+html.slice(reading);
}
function clean(html){
 html=html.replace(/<script>\s*function switchTab\([\s\S]*?<\/script>\s*/g,'');
 html=html.replace(/`n/g,'\n');
 return html;
}
const skip = new Set(['shi-jian-lun.html','mao-dun-lun.html']);
let changed=[];
for(const row of manifest){
 const file=row.html;
 const base=path.basename(file);
 if(skip.has(base)) continue;
 if(!fs.existsSync(file)||!fs.existsSync(row.source)) continue;
 let html=read(file);
 const current=(html.match(/class="chapter"/g)||[]).length;
 if(current>1) continue;
 const ps=paras(read(row.source));
 if(ps.length<3) continue;
 const originalTitle=ps[0] || row.title;
 const body=ps.slice(1);
 const per=Math.max(6, Math.ceil(body.length/Math.min(8, Math.ceil(body.length/8))));
 const chunks=[];
 for(let i=0;i<body.length;i+=per){ const c=body.slice(i,i+per); chunks.push({title:titleOf(chunks.length,0,c), paras:c}); }
 html=replaceOriginal(html, section(row.title, chunks, originalTitle));
 html=clean(html);
 fs.writeFileSync(file, html, 'utf8');
 changed.push(path.relative(path.join(root,'html','articles'), file));
}
console.log(JSON.stringify({changed:changed.length, files:changed}, null, 2));
