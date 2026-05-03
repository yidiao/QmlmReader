#!/usr/bin/env python3
"""
给 articles/ 下所有文章详情页添加"⬇ 下载原文"浮动按钮
按钮读取 ../downloads/manifest.json，根据 slug 匹配提供 PDF 和/或 TXT 下载
"""

import os
import re
import glob

ARTICLES_DIR = "D:/Qmlmreader/articles"
CSS_TO_INJECT = """
    /* ⬇ 下载原文浮动按钮 */
    .download-fab {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--party-primary, #c41e3a);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 22px;
        z-index: 1000;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .download-fab:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(0,0,0,0.4); }
    .download-menu {
        position: fixed;
        bottom: 96px;
        right: 30px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 1rem 1.2rem;
        min-width: 180px;
        display: none;
        z-index: 1001;
    }
    body.dark-mode .download-menu { background: #2a2a2a; color: white; }
    .download-menu.show { display: block; }
    .download-menu h4 { margin: 0 0 0.6rem 0; font-size: 0.95rem; }
    body.dark-mode .download-menu h4 { color: #ccc; }
    .dl-link {
        display: block; padding: 7px 10px; margin: 4px 0;
        background: #f5f5f5; border-radius: 6px;
        text-decoration: none; color: #333; font-size: 0.9rem;
        transition: all 0.2s;
    }
    body.dark-mode .dl-link { background: #3a3a3a; color: #eee; }
    .dl-link:hover { background: var(--party-primary, #c41e3a); color: white; }
"""

HTML_TO_INJECT = """
<button class="download-fab" id="downloadFab" title="下载原文">⬇</button>
<div class="download-menu" id="downloadMenu">
    <h4>📥 下载原文</h4>
    <div id="downloadLinks"></div>
</div>
"""

JS_TO_INJECT = """
<script>
(function(){
    const fab = document.getElementById('downloadFab');
    const menu = document.getElementById('downloadMenu');
    const linksDiv = document.getElementById('downloadLinks');
    let loaded = false;

    fab.addEventListener('click', async () => {
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
            return;
        }
        if (!loaded) {
            await loadLinks();
            loaded = true;
        }
        menu.classList.add('show');
    });

    document.addEventListener('click', e => {
        if (!fab.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
        }
    });

    async function loadLinks() {
        try {
            const path = window.location.pathname;
            const slug = path.substring(path.lastIndexOf('/') + 1).replace('.html', '');
            const resp = await fetch('../downloads/manifest.json');
            const data = await resp.json();

            // 先查 articles
            let entry = (data.articles || []).find(a => a.slug === slug);
            // 再查 rectify
            if (!entry) entry = (data.rectify || []).find(r => r.slug === slug);

            if (!entry) {
                linksDiv.innerHTML = '<span style="color:#999;font-size:0.85rem;">暂无下载资源</span>';
                return;
            }
            if (entry.pdf) {
                const a = document.createElement('a');
                a.className = 'dl-link';
                a.href = '../' + entry.pdf;
                a.download = '';
                a.innerHTML = '📄 下载 PDF';
                linksDiv.appendChild(a);
            }
            if (entry.txt) {
                const a = document.createElement('a');
                a.className = 'dl-link';
                a.href = '../' + entry.txt;
                a.download = '';
                a.innerHTML = '📝 下载 TXT';
                linksDiv.appendChild(a);
            }
            if (!entry.pdf && !entry.txt) {
                linksDiv.innerHTML = '<span style="color:#999;font-size:0.85rem;">暂无下载资源</span>';
            }
        } catch(e) {
            linksDiv.innerHTML = '<span style="color:#999;font-size:0.85rem;">加载失败</span>';
            console.error('Download menu error:', e);
        }
    }
})();
</script>
"""

def inject_to_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. 注入 CSS（在 </head> 前）
    if '.download-fab' not in content:
        content = content.replace('</head>', '<style>\n' + CSS_TO_INJECT + '</style>\n</head>')
        modified = True

    # 2. 注入 HTML（在 </body> 前）
    if 'id="downloadFab"' not in content:
        content = content.replace('</body>', HTML_TO_INJECT + '\n</body>')
        modified = True

    # 3. 注入 JS（在 </body> 前，但在 HTML 之后）
    if 'function loadLinks' not in content and 'id="downloadFab"' not in content:
        # 如果 HTML 还没注入（理论上不会到这里），先注入 HTML
        pass

    # 更稳健：检查 JS 是否已注入
    if 'function loadLinks' not in content:
        # 在 </body> 前注入 JS
        content = content.replace('</body>', JS_TO_INJECT + '\n</body>')
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    html_files = glob.glob(os.path.join(ARTICLES_DIR, '*.html'))
    # 排除模板文件
    html_files = [f for f in html_files if not os.path.basename(f).startswith('_')]

    print(f"找到 {len(html_files)} 个文章HTML文件")
    count = 0
    for f in html_files:
        name = os.path.basename(f)
        try:
            changed = inject_to_file(f)
            if changed:
                print(f"  ✅ 已更新: {name}")
                count += 1
            else:
                print(f"  ⏭ 跳过(已有): {name}")
        except Exception as e:
            print(f"  ❌ 失败: {name} - {e}")

    print(f"\n共更新 {count} 个文件")

if __name__ == '__main__':
    main()
