#!/usr/bin/env python3
"""
修复 rectify/ 下正名文章的下载按钮
移除 fetch()，直接内嵌下载链接
rectify 文件在两层子目录下，href 需要 ../../ 前缀
"""

import os
import json
import re
import glob

MANIFEST = "D:/Qmlmreader/downloads/manifest.json"

with open(MANIFEST, 'r', encoding='utf-8') as f:
    DATA = json.load(f)

SLUG_ENTRY = {}
for r in DATA.get('rectify', []):
    SLUG_ENTRY[r['slug']] = r

# 文件名（不含.html）-> slug 映射
FILE_SLUG_MAP = {
    'stalin-era': 'rectify-stalin-era',
    'gorky-lenin': 'rectify-gorky-leiden',
    'finland-war': 'rectify-finland-war',
    'soviet-afghanistan': 'rectify-soviet-afghanistan',
    'soviet-agriculture': 'rectify-soviet-agriculture',
    'wisdom-of-elites': 'rectify-wisdom-of-elites',
    'human-nature': 'rectify-human-nature',
}


def build_js(slug):
    entry = SLUG_ENTRY.get(slug, {})
    pdf = entry.get('pdf', '')
    txt = entry.get('txt', '')

    links_html = ''
    if pdf:
        links_html += '<a class="dl-link" href="../../{0}">📄 下载 PDF</a>'.format(pdf)
    if txt:
        links_html += '<a class="dl-link" href="../../{0}">📝 下载 TXT</a>'.format(txt)
    if not links_html:
        links_html = '<span style="color:#999;font-size:0.85rem;">暂无下载资源</span>'

    js = (
        '<script>\n'
        '(function(){{\n'
        '    const fab = document.getElementById("downloadFab");\n'
        '    const menu = document.getElementById("downloadMenu");\n'
        '    const linksDiv = document.getElementById("downloadLinks");\n'
        '\n'
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
    slug = FILE_SLUG_MAP.get(basename, basename)

    if slug not in SLUG_ENTRY:
        return False, 'slug={0} 不在 manifest 中'.format(slug)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_js = build_js(slug)

    # 找原先注入的 <script>
    pattern = r'<script>\s*\(function\(\)\{.*?</script>'
    match = re.search(pattern, content, re.DOTALL)

    if match:
        old = match.group(0)
        content = content.replace(old, new_js)
    else:
        content = content.replace('</body>', new_js + '</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    entry = SLUG_ENTRY.get(slug, {})
    return True, 'pdf={0}, txt={1}'.format('pdf' in entry, 'txt' in entry)


def main():
    rectify_dir = "D:/Qmlmreader/rectify"
    files = sorted(glob.glob(os.path.join(rectify_dir, '**', '*.html'), recursive=True))

    print('找到 {0} 个正名文章HTML文件\n'.format(len(files)))
    for f in files:
        name = os.path.relpath(f, rectify_dir)
        ok, msg = fix_file(f)
        status = '✅' if ok else '❌'
        print('  {0} {1} — {2}'.format(status, name, msg))

    print('\n完成！请刷新浏览器测试下载按钮。')


if __name__ == '__main__':
    main()
