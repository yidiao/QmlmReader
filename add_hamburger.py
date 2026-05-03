#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量在所有 HTML 文件中添加汉堡菜单按钮
在 <nav class="main-nav"> 前插入汉堡按钮 HTML
"""

import os
import re
import glob

HAMBURGER_HTML = '''<button class="hamburger-btn" id="hamburgerBtn" aria-label="打开菜单">
                <span></span>
                <span></span>
                <span></span>
            </button>
            '''

# 查找所有 HTML 文件
root = 'D:/Qmlmreader'
html_files = []
for dirpath, dirnames, filenames in os.walk(root):
    # 跳过 .git 目录
    dirnames[:] = [d for d in dirnames if d != '.git']
    for fname in filenames:
        if fname.endswith('.html'):
            html_files.append(os.path.join(dirpath, fname))

print(f'共找到 {len(html_files)} 个 HTML 文件')

modified = 0
skipped = 0

for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 已经有汉堡按钮的跳过
    if 'hamburger-btn' in content:
        skipped += 1
        continue

    # 在 <nav class="main-nav"> 前插入汉堡按钮
    new_content = content.replace(
        '<nav class="main-nav">',
        HAMBURGER_HTML + '<nav class="main-nav">',
        1  # 只替换第一个
    )

    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'  ✅ 修改: {os.path.relpath(fpath, root)}')
        modified += 1
    else:
        print(f'  ⚠️  未找到 main-nav: {os.path.relpath(fpath, root)}')

print(f'\n完成！修改 {modified} 个文件，跳过 {skipped} 个（已有汉堡按钮）')
