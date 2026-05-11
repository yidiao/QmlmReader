#!/usr/bin/env python3
"""检查新增文章TXT与现有HTML的匹配状态，以及原文tab内容状态"""
import os
import re

txt_dir = 'D:/图片/红色/新增文章'
html_dir = 'D:/Qmlmreader/articles'

# TXT文件名 → HTML slug 的映射
name_map = {
    '1844年经济学哲学手稿': '1844-nian-jing-ji-xue-zhe-xue-shou-gao',
    '关于费尔巴哈的提纲': 'guan-yu-fei-er-ba-ha-de-ti-gang',
    '反杜林论_社会主义编': 'fan-du-lin-lun-she-hui-zhu-yi-bian',
    '帝国主义是资本主义的最高阶段': 'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan',
    '德意志意识形态_第一章_费尔巴哈': 'de-yi-zhi-yi-xing-tai',
    '论我国革命': 'lun-wo-guo-ge-ming',
    '马克思主义的三个来源和三个组成部分': 'ma-ke-si-zhu-yi-de-san-ge-lai-yuan',
    '黑格尔法哲学批判导言': 'hei-ge-er-fa-zhe-xue-pi-pan-dao-yan',
}

print("=" * 60)
print("TXT → HTML 匹配分析")
print("=" * 60)

needs_fill = []    # 有TXT有HTML，需填充原文
needs_create = []  # 有TXT无HTML，需新建
no_txt = []        # 有HTML无TXT，搁置

for txt_name, slug in name_map.items():
    txt_path = os.path.join(txt_dir, txt_name + '.txt')
    html_path = os.path.join(html_dir, slug + '.html')
    
    has_txt = os.path.exists(txt_path)
    has_html = os.path.exists(html_path)
    
    if has_txt and has_html:
        # 检查原文tab是否已有实质内容
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        m = re.search(r'id="original".*?</div>', content, re.DOTALL)
        if m:
            tab = m.group()
            # 判断是否只有占位符
            is_empty = ('正文内容' in tab or '章节标题' in tab or len(tab.strip()) < 500)
            if is_empty:
                needs_fill.append((txt_name, slug, txt_path, html_path))
                print(f"📝 需填充原文: {txt_name} → {slug}.html")
            else:
                print(f"✅ 原文已填充: {txt_name} → {slug}.html")
        else:
            needs_fill.append((txt_name, slug, txt_path, html_path))
            print(f"📝 缺原文tab: {txt_name} → {slug}.html")
            
    elif has_txt and not has_html:
        needs_create.append((txt_name, slug, txt_path))
        print(f"🆕 需新建HTML: {txt_name} → {slug}.html")
    elif not has_txt and has_html:
        no_txt.append((txt_name, slug))
        print(f"⏸️  无TXT搁置: {txt_name} → {slug}.html")

print()
print("=" * 60)
print(f"需填充原文: {len(needs_fill)} 篇")
print(f"需新建HTML: {len(needs_create)} 篇")
print(f"无TXT搁置: {len(no_txt)} 篇")
print("=" * 60)

# 输出供后续使用
print()
print("=== 供脚本使用的变量 ===")
print(f"NEEDS_FILL = {[(x[1], x[2]) for x in needs_fill]}")
print(f"NEEDS_CREATE = {[(x[0], x[1], x[2]) for x in needs_create]}")
