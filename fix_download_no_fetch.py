#!/usr/bin/env python3
"""
修复下载按钮：移除 fetch() 调用（file:// 协议下跨域失败）
改为在 JS 中直接内嵌该文章的下载链接 HTML
"""

import os
import json
import re
import glob

MANIFEST = "D:/Qmlmreader/downloads/manifest.json"

with open(MANIFEST, 'r', encoding='utf-8') as f:
    DATA = json.load(f)

SLUG_ENTRY = {}
for a in DATA.get('articles', []):
    SLUG_ENTRY[a['slug']] = a
for r in DATA.get('rectify', []):
    SLUG_ENTRY[r['slug']] = r


def build_js(slug):
    """生成不含 fetch 的 JS，直接写死下载链接"""
    entry = SLUG_ENTRY.get(slug, {})
    pdf = entry.get('pdf', '')
    txt = entry.get('txt', '')

    links_html = ''
    if pdf:
        links_html += '<a class="dl-link" href="../{0}">📄 下载 PDF</a>'.format(pdf)
    if txt:
        links_html += '<a class="dl-link" href="../{0}">📝 下载 TXT</a>'.format(txt)
    if not links_html:
        links_html = '<span style="color:#999;font-size:0.85rem;">暂无下载资源</span>'

    # JS 代码，注意：不用 f-string，用 .format() 或 % 来避免大括号冲突
    js = (
        '<script>\n'
        '(function(){{\n'
        '    const fab = document.getElementById("downloadFab");\n'
        '    const menu = document.getElementById("downloadMenu");\n'
        '    const linksDiv = document.getElementById("downloadLinks");\n'
        '\n'
        '    // 直接写入下载链接（不依赖 fetch）\n'
        '    if (linksDiv.children.length === 0) {{\n'
        '        linksDiv.innerHTML = {0};\n'
        '    }}\n'
        '\n'
        '    fab.addEventListener("click", () => {{\n'
        '        if (menu.classList.contains("show")) {{\n'
        '            menu.classList.remove("show");\n'
        '            return;\n'
        '        }}\n'
        '        menu.classList.add("show");\n'
        '    }});\n'
        '\n'
        '    document.addEventListener("click", e => {{\n'
        '        if (!fab.contains(e.target) && !menu.contains(e.target)) {{\n'
        '            menu.classList.remove("show");\n'
        '        }}\n'
        '    }});\n'
        '}})();\n'
        '</script>\n'
    ).format(json.dumps(links_html))

    return js


def fix_file(filepath):
    basename = os.path.basename(filepath).replace('.html', '')
    slug = basename

    if slug not in SLUG_ENTRY:
        return False, 'slug 不在 manifest 中'

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_js = build_js(slug)

    # 找原先注入的 <script>（包含 downloadFab 的）
    pattern = r'<script>\s*\(function\(\)\{.*?</script>'
    match = re.search(pattern, content, re.DOTALL)

    if match:
        old = match.group(0)
        content = content.replace(old, new_js)
    else:
        # 没找到，在 </body> 前追加
        content = content.replace('</body>', new_js + '</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    entry = SLUG_ENTRY.get(slug, {})
    return True, 'pdf={0}, txt={1}'.format('pdf' in entry, 'txt' in entry)


def main():
    articles_dir = "D:/Qmlmreader/articles"
    files = sorted([
        f for f in glob.glob(os.path.join(articles_dir, '*.html'))
        if not os.path.basename(f).startswith('_')
    ])

    print('找到 {0} 个文章HTML文件\n'.format(len(files)))
    for f in files:
        name = os.path.basename(f)
        ok, msg = fix_file(f)
        status = '✅' if ok else '❌'
        print('  {0} {1} — {2}'.format(status, name, msg))

    print('\n完成！请刷新浏览器测试下载按钮。')


if __name__ == '__main__':
    main()
