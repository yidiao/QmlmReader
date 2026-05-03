"""
修复下载功能：
1. 给所有 dl-link 的 <a> 标签添加 download 属性（HTML直接写入和innerHTML字符串两种形式）
2. 修复 gorky-leiden.txt 文件名引用（改为 rectify-gorky-linux.txt）
"""
import os, re

BASE = 'D:/Qmlmreader'

def get_html_files():
    files = []
    # articles 目录
    art_dir = os.path.join(BASE, 'articles')
    for fn in sorted(os.listdir(art_dir)):
        if fn.endswith('.html') and 'backup' not in fn:
            files.append(os.path.join(art_dir, fn))
    # rectify 子目录
    for root, dirs, fns in os.walk(os.path.join(BASE, 'rectify')):
        for fn in sorted(fns):
            if fn.endswith('.html'):
                files.append(os.path.join(root, fn))
    return files

def add_download_to_escaped(html):
    """
    处理 innerHTML 赋值中的转义 a 标签:
    <a class=\"dl-link\" href=\"../data/xxx.txt\">
    -> 添加 download=\"xxx.txt\"
    """
    def replacer(m):
        full = m.group(0)
        href_val = m.group(1)
        filename = os.path.basename(href_val)
        if 'download=' in full:
            return full
        # 在 href=\"PATH\" 后插入 download=\"FILENAME\"
        return full.replace(
            f'href=\\"{href_val}\\"',
            f'href=\\"{href_val}\\" download=\\"{filename}\\"'
        )
    # 匹配 href=\"PATH.txt或pdf\"
    return re.sub(
        r'<a[^>]*href=\\"([^"\\]+\.(?:txt|pdf))\\"[^>]*>',
        replacer,
        html
    )

def add_download_to_normal(html):
    """
    处理正常 HTML 中的 a 标签（非转义）:
    <a class="dl-link" href="../data/xxx.txt">
    """
    def replacer(m):
        full = m.group(0)
        href_val = m.group(1)
        filename = os.path.basename(href_val)
        if 'download=' in full:
            return full
        return full.replace(
            f'href="{href_val}"',
            f'href="{href_val}" download="{filename}"'
        )
    return re.sub(
        r'<a[^>]*href="([^"]+\.(?:txt|pdf))"[^>]*>',
        replacer,
        html
    )

def fix_gorky_filename(html):
    """修复 gorky-leiden.txt -> rectify-gorky-linux.txt"""
    # 实际文件名是 rectify-gorky-linux.txt
    # 但 memory 里说文件名叫 rectify-gorky-leiden.txt
    # 让我们用更正确的名字 rectify-gorky-Lenin.txt（已有的文件是 rectify-gorky-linux.txt，实为 gorky-Lenin）
    # 保守做法：把 gorky-leiden.txt 改成 rectify-gorky-linux.txt
    html = html.replace('rectify-gorky-leiden.txt', 'rectify-gorky-linux.txt')
    html = html.replace('rectify-gorky-leiden', 'rectify-gorky-linux')
    return html

# 执行修复
files = get_html_files()
print(f'Found {len(files)} HTML files\n')

modified = []
for fp in files:
    with open(fp, 'r', encoding='utf-8') as f:
        original = f.read()
    
    content = original
    content = add_download_to_escaped(content)
    content = add_download_to_normal(content)
    content = fix_gorky_filename(content)
    
    if content != original:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)
        rel = fp.replace(BASE + '/', '').replace(BASE + '\\', '')
        modified.append(rel)
        print(f'✅ {rel}')
    else:
        rel = fp.replace(BASE + '/', '').replace(BASE + '\\', '')
        print(f'   {rel} (unchanged)')

print(f'\n=== 修复完成：{len(modified)}/{len(files)} 个文件已更新 ===')
