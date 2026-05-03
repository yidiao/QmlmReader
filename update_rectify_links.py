#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 rectify.html 中的文章链接路径到新的子目录结构
"""

fpath = 'D:/Qmlmreader/rectify.html'

with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

replacements = {
    # 领导人正名板块
    'href="rectify/stalin-era.html"': 'href="rectify/leaders/stalin-era.html"',
    'href="rectify/gorky-lenin.html"': 'href="rectify/leaders/gorky-lenin.html"',
    # 军事行动板块
    'href="rectify/finland-war.html"': 'href="rectify/military/finland-war.html"',
    'href="rectify/soviet-afghanistan.html"': 'href="rectify/military/soviet-afghanistan.html"',
    # 经济模式板块
    'href="rectify/soviet-agriculture.html"': 'href="rectify/economy/soviet-agriculture.html"',
    # myths 已有子目录，不变
}

for old, new in replacements.items():
    if old in content:
        content = content.replace(old, new)
        print(f'  ✅ {old} → {new}')
    else:
        print(f'  ⚠️  未找到: {old}')

if content != original:
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'\nrectify.html 更新完成！')
else:
    print('无修改')
