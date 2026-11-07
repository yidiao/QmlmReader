# -*- coding: utf-8 -*-
"""一次性迁移（2026-11-07）：黑夜模式选择器 body.dark-mode -> .dark-mode body

背景：首帧防白闪方案把 dark-mode 类提前挂到 <html>（head 内联脚本，见
add_dark_mode_head_script.py），CSS 需改认 <html> 上的类。
前提（已扫描核实）：全部 765 处 body.dark-mode 均位于选择器最左复合块，
无祖先组合器、无 :not() 包裹，故替换不改变语义与特异性（(0,1,1) -> (0,1,1)）。
幂等：已是 .dark-mode body 的不会被再次命中（body.dark-mode 字面量已消失）。
用法：python -I _tools/migrate_dark_mode_selectors.py
"""
import glob
import re

total = 0
files_changed = 0
for f in glob.glob('css/**/*.css', recursive=True):
    s = open(f, encoding='utf-8').read()
    n = len(re.findall(r'body\.dark-mode', s))
    if n:
        s2 = s.replace('body.dark-mode', '.dark-mode body')
        open(f, 'w', encoding='utf-8', newline='').write(s2)
        files_changed += 1
        total += n
        print('%s: %d' % (f, n))
print('files: %d, replacements: %d' % (files_changed, total))
