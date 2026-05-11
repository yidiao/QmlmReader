#!/usr/bin/env python3
"""
批量修复 Qmlmreader 所有页面的手机端汉堡组件
方案：
1. 确保 css/style.css 有 .nav-close-btn 样式（已手动修复）
2. 确保 js/main.js 有 .nav-close-btn 事件处理（已手动修复）
3. 为每个HTML文件添加/修复导航栏HTML（包含 .nav-close-btn）
"""

import os, re

BASE = r'D:\Qmlmreader'

# 正确的导航栏HTML模板（根目录版本）
# 用法：NAV_TEMPLATE.format(base=base)
NAV_TEMPLATE = '''    <header class="site-header">
        <div class="container">
            <div class="logo">
                <span class="logo-icon">☭</span>
                <div class="logo-text">
                    <h1>青年马列毛主义驿站</h1>
                    <span class="logo-sub">Qmlm Reader</span>
                </div>
            </div>
            <button class="hamburger-btn" id="hamburgerBtn" aria-label="打开菜单">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <nav class="main-nav">
                <button class="nav-close-btn" aria-label="关闭菜单">✕</button>
                <a href="{base}index.html">首页</a>
                <a href="{base}articles.html">文章</a>
                <a href="{base}masters.html">导师</a>
                <a href="{base}toolkit.html">工具集</a>
                <a href="{base}gallery.html">文艺</a>
                <a href="{base}puzzle.html" style="color:#ffd700;font-weight:bold;">🧩 理论拼图</a>
                <a href="{base}international.html">🌍 国际共运</a>
                <a href="{base}rectify.html">正名</a>
                <a href="{base}about.html">关于</a>
                <button class="dark-mode-toggle" onclick="toggleDarkMode()" title="切换黑夜模式">🌙</button>
            </nav>
        </div>
    </header>'''

def get_base(filepath):
    """根据文件位置返回相对路径前缀"""
    rel = os.path.relpath(filepath, BASE)
    depth = len(rel.split(os.sep)) - 1  # 去掉文件名
    if depth == 0:
        return ''
    elif depth == 1:
        return '../'
    else:
        return '../' * depth

def get_nav_html(filepath):
    base = get_base(filepath)
    return NAV_TEMPLATE.format(base=base)

def fix_file(filepath):
    """修复单个文件，返回True表示有修改"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f'  [ERROR] 读取失败: {e}')
        return False
    
    original = content
    modified = False
    
    # 1. 修复字面 \n 问题（如果还存在）
    if '\\n' in content:
        # 把 <nav ...>\n<button 中的字面 \n 替换为真正换行
        content = content.replace('\\n                <button class="nav-close-btn"', 
                                '\n                <button class="nav-close-btn"')
        # 更全面的替换
        content = re.sub(r'\\n\s*<button class="nav-close-btn"', 
                        '\n                <button class="nav-close-btn"', 
                        content)
        if content != original:
            modified = True
            print(f'  [修复] 清除字面 \\n')
            original = content  # 更新original
    
    # 2. 检查是否有正确的导航栏结构
    has_header = bool(re.search(r'<header[^>]*class="site-header"', content))
    has_hamburger = 'hamburger-btn' in content
    has_nav = 'main-nav' in content
    has_close_btn = 'nav-close-btn' in content
    
    new_nav = get_nav_html(filepath)
    
    if not has_header or not has_hamburger or not has_nav:
        # D类：导航栏结构完全错误，整体替换
        print(f'  [D类] 替换整个导航栏...')
        
        # 尝试删除现有的错误导航栏（<header>...</header>）
        # 先尝试找 </header> 的位置
        header_match = re.search(r'<header[^>]*>.*?</header>', content, re.DOTALL)
        if header_match:
            # 替换为新的
            content = content[:header_match.start()] + new_nav + content[header_match.end():]
        else:
            # 没有 <header>，在 <body> 后插入
            content = content.replace('<body>', '<body>\n' + new_nav)
        
        modified = True
        
    elif not has_close_btn:
        # A/B类：有导航栏但缺关闭按钮
        print(f'  [A/B类] 添加关闭按钮...')
        
        # 在 <nav class="main-nav"> 后添加 <button class="nav-close-btn">
        old = '<nav class="main-nav">'
        new = '<nav class="main-nav">\n                <button class="nav-close-btn" aria-label="关闭菜单">✕</button>'
        
        if old in content:
            content = content.replace(old, new, 1)
            modified = True
        else:
            print(f'  [WARNING] 找不到 {old}')
    
    # 3. 清理页面内重定义的导航CSS（C类）
    def clean_nav_css_in_style(m):
        style_content = m.group(1)
        
        # 删除 @media 块中与导航相关的规则
        # 匹配 .main-nav, .hamburger-btn, .site-header 的规则
        cleaned = style_content
        
        # 删除 .main-nav 相关（包括带伪类/子元素的）
        cleaned = re.sub(r'\.main-nav[^{]*\{[^}]*(?:\{[^}]*\}[^}]*)*\}', '', cleaned, flags=re.DOTALL)
        
        # 删除 .hamburger-btn 相关
        cleaned = re.sub(r'\.hamburger-btn[^{]*\{[^}]*\}', '', cleaned)
        cleaned = re.sub(r'\.hamburger-btn[^{]*\{[^}]*(?:\{[^}]*\}[^}]*)*\}', '', cleaned, flags=re.DOTALL)
        
        # 删除 .site-header 相关（在 @media 内）
        cleaned = re.sub(r'\.site-header[^{]*\{[^}]*\}', '', cleaned)
        
        # 删除空的 @media 块
        cleaned = re.sub(r'@media[^{]*\{\s*\}', '', cleaned)
        
        return '<style>' + cleaned + '</style>'
    
    if re.search(r'@media.*?(\.main-nav|\.hamburger-btn|\.site-header)', content, re.DOTALL):
        print(f'  [C类] 清理重定义CSS...')
        new_content = re.sub(r'<style[^>]*>(.*?)</style>', clean_nav_css_in_style, content, flags=re.DOTALL)
        if new_content != content:
            content = new_content
            modified = True
    
    # 4. 确保 </body> 前有 main.js 引用
    if 'main.js' not in content:
        base = get_base(filepath)
        js_tag = f'\n    <script src="{base}js/main.js"></script>\n'
        content = content.replace('</body>', js_tag + '</body>')
        modified = True
        print(f'  [INFO] 添加 main.js 引用')
    
    # 写回文件
    if modified:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'  [OK] 已修复')
            return True
        except Exception as e:
            print(f'  [ERROR] 写入失败: {e}')
            return False
    else:
        print(f'  [SKIP] 无需修改')
        return True

def main():
    files = []
    for root, dirs, fnames in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.workbuddy', 'css', 'js', 'data', 'downloads', 'assets', 'images', '__pycache__')]
        for f in fnames:
            if f.endswith('.html'):
                files.append(os.path.join(root, f))
    
    print(f'共 {len(files)} 个HTML文件\n')
    
    success = 0
    for f in sorted(files):
        rel = os.path.relpath(f, BASE).replace('\\', '/')
        print(f'处理: {rel}')
        try:
            if fix_file(f):
                success += 1
        except Exception as e:
            print(f'  [EXCEPTION] {e}')
            import traceback
            traceback.print_exc()
        print()
    
    print(f'完成: {success}/{len(files)} 个文件处理成功')

if __name__ == '__main__':
    main()
