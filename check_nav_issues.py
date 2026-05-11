import os, re

base_dir = r'D:\Qmlmreader'

files = []
for root, dirs, fnames in os.walk(base_dir):
    # 跳过 node_modules 和 .workbuddy
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.workbuddy', 'css', 'js', 'data', 'downloads', 'assets', 'images', '__pycache__')]
    for f in fnames:
        if f.endswith('.html'):
            files.append(os.path.join(root, f))

print(f'Total HTML files: {len(files)}')
print('=' * 60)

categories = {'A/B': [], 'C': [], 'D': []}

for f in sorted(files):
    try:
        content = open(f, 'r', encoding='utf-8').read()
    except Exception as e:
        print(f'ERROR reading {f}: {e}')
        continue
    
    has_site_header = 'site-header' in content
    has_hamburger = 'hamburger-btn' in content
    has_main_nav = 'main-nav' in content
    has_nav_close = 'nav-close-btn' in content or '关闭菜单' in content
    
    # 检查是否有内联样式替代导航栏
    has_inline_nav_style = 'style="display:flex' in content and '<nav' in content
    
    # 检查页面内CSS是否重定义了导航相关样式
    style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL)
    css_redefine = False
    for css in style_blocks:
        if '@media' in css and ('main-nav' in css or 'hamburger-btn' in css or 'site-header' in css):
            css_redefine = True
            break
    
    # 检查是否有正确的导航栏HTML结构（从style.css外部引入）
    # 正确的结构应该有：<header class="site-header"> ... <button class="hamburger-btn"> ... <nav class="main-nav">
    has_proper_nav_html = bool(re.search(r'<header[^>]*class="site-header"', content))
    has_hamburger_btn_html = bool(re.search(r'<button[^>]*class="hamburger-btn"', content))
    has_main_nav_html = bool(re.search(r'<nav[^>]*class="main-nav"', content))
    
    # 分类
    rel_path = os.path.relpath(f, base_dir).replace('\\', '/')
    
    if not has_proper_nav_html or not has_hamburger_btn_html:
        cat = 'D'
        categories['D'].append(rel_path)
    elif has_inline_nav_style:
        cat = 'D'
        categories['D'].append(rel_path)
    elif css_redefine:
        cat = 'C'
        categories['C'].append(rel_path)
    else:
        cat = 'A/B'
        categories['A/B'].append(rel_path)
    
    print(f'[{cat}] {rel_path}')
    print(f'     header={has_proper_nav_html} hamburger={has_hamburger_btn_html} nav={has_main_nav_html} close={has_nav_close}')
    print(f'     inline_style={has_inline_nav_style} css_redef={css_redefine}')
    print()

print('=' * 60)
print('SUMMARY:')
for cat, flist in categories.items():
    print(f'  Category {cat}: {len(flist)} files')
    for f in flist:
        print(f'    - {f}')
    print()
