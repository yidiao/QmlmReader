#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 rectify 子目录文件中的相对路径引用
从 rectify/ 移动到 rectify/subdir/ 后，../../ 变为 ../
"""

import os
import re

# 需要修复路径的文件及其目录层级变化
files = {
    'D:/Qmlmreader/rectify/leaders/stalin-era.html': 'leaders',
    'D:/Qmlmreader/rectify/leaders/gorky-lenin.html': 'leaders',
    'D:/Qmlmreader/rectify/military/finland-war.html': 'military',
    'D:/Qmlmreader/rectify/military/soviet-afghanistan.html': 'military',
    'D:/Qmlmreader/rectify/economy/soviet-agriculture.html': 'economy',
}

for fpath, subdir in files.items():
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # ../css/style.css -> ../../css/style.css
    content = content.replace('../css/', '../../css/')
    # ../js/ -> ../../js/
    content = content.replace('../js/', '../../js/')
    # href="../index.html" -> href="../../index.html"
    content = content.replace('href="../index.html"', 'href="../../index.html"')
    content = content.replace('href="../articles.html"', 'href="../../articles.html"')
    content = content.replace('href="../rectify.html"', 'href="../../rectify.html"')
    content = content.replace('href="../masters.html"', 'href="../../masters.html"')
    content = content.replace('href="../gallery.html"', 'href="../../gallery.html"')
    content = content.replace('href="../toolkit.html"', 'href="../../toolkit.html"')
    content = content.replace('href="../puzzle.html"', 'href="../../puzzle.html"')
    content = content.replace('href="../international.html"', 'href="../../international.html"')
    content = content.replace('href="../about.html"', 'href="../../about.html"')
    # rectify/ 子目录内部链接（如 rectify/myths/ 的链接）保持不变
    # back-link 通常是 rectify.html 或 ../rectify.html
    content = content.replace("href='../rectify.html'", "href='../../rectify.html'")
    content = content.replace('href="rectify.html"', 'href="../../rectify.html"')

    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  ✅ 路径已修复: {os.path.basename(fpath)} ({subdir}/)')
    else:
        print(f'  ⚠️  无需修改: {os.path.basename(fpath)}')

print('完成！')
