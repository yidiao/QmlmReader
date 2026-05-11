#!/usr/bin/env python3
"""直接修复：在 text-intro 前插入缺失的 <div class="tab-content active" id="original">"""
import os

HTML_DIR = 'D:/Qmlmreader/articles'

files_to_fix = [
    'guan-yu-fei-er-ba-ha-de-ti-gang.html',
    '1844-nian-jing-ji-xue-zhe-xue-shou-gao.html',
    'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan.html',
    'de-yi-zhi-yi-xing-tai.html',
]

for fname in files_to_fix:
    path = os.path.join(HTML_DIR, fname)
    print(f'处理: {fname}')
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已有 id="original" 的div
    if 'id="original"' in content:
        print('  ✅ 已有 id="original"，跳过')
        continue
    
    # 缺失！在第一个 <div class="text-intro"> 前插入 opening tag
    # 注意：text-intro 前面应该有 </div>（关闭tab-nav）然后就是缺失的opening tag位置
    marker = '<div class="text-intro">'
    if marker not in content:
        print('  ❌ 未找到 text-intro 标记')
        continue
    
    # 在 marker 前插入 opening tag
    new_content = content.replace(marker, '<div class="tab-content active" id="original">\n                ' + marker, 1)
    
    # 还需要找到原文内容的结束位置，加上 </div>
    # 原文内容结束后是下一个 tab-content（如 reading）
    # 简单策略：找到 <div class="tab-content" id="reading"> 前面插入 </div>
    end_marker = '<div class="tab-content" id="reading">'
    if end_marker in new_content:
        new_content = new_content.replace(end_marker, '</div>\n\n            ' + end_marker, 1)
        print('  ✅ 已修复（找到reading tab作为结束位置）')
    else:
        # 尝试其他tab名
        for tab_id in ['reading', 'difficulty', 'dialogue', 'action', 'visual', 'puzzle', 'further']:
            em = f'<div class="tab-content" id="{tab_id}">'
            if em in new_content:
                new_content = new_content.replace(em, '</div>\n\n            ' + em, 1)
                print(f'  ✅ 已修复（找到{tab_id} tab作为结束位置）')
                break
        else:
            print('  ⚠️  未找到下一个tab，可能需要手动修复结束标签')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

print('\n完成！')
