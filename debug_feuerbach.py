#!/usr/bin/env python3
"""调试：关于费尔巴哈的提纲 章节解析为何返回0个"""
import re

path = 'D:/图片/红色/新增文章/关于费尔巴哈的提纲.txt'
with open(path, 'r', encoding='utf-8') as f:
    raw = f.read()

print('=== 原始内容前500字符 ===')
print(repr(raw[:500]))
print()

# 清洗（只做基本清洗）
text = raw
text = re.sub(r'={5,}', '', text)
lines = text.split('\n')
cleaned = []
for line in lines:
    s = line.strip()
    if not s:
        cleaned.append(line)
        continue
    if re.match(r'^\d+$', s):
        continue
    cleaned.append(line)
text = '\n'.join(cleaned)

print('=== 清洗后前500字符 ===')
print(repr(text[:500]))
print()

# 逐行检测
print('=== 逐行检测 \d+\. ===')
matches = []
for i, line in enumerate(text.split('\n')):
    stripped = line.strip()
    m = re.match(r'^(\d+)\.(.*)$', stripped)
    if m:
        matches.append((i, m.group(1), m.group(2).strip()))
        print(f'  Line {i}: 编号={m.group(1)}, 标题={m.group(2)[:40]}')
    elif stripped.startswith('1.') or stripped.startswith('2.'):
        print(f'  Line {i}: 以数字开头但未匹配: [{stripped[:60]}]')

print(f'\n共找到 {len(matches)} 个编号行')
if len(matches) >= 2:
    print('✅ 解析成功！')
    chapters = []
    lines2 = text.split('\n')
    for j, (idx, num, title) in enumerate(matches):
        body_start = idx + 1
        body_end = matches[j+1][0] if j + 1 < len(matches) else len(lines2)
        body = '\n'.join(lines2[body_start:body_end]).strip()
        chapters.append((f'{num}. {title}', body))
    print(f'生成了 {len(chapters)} 个章节')
    for num, title_body in chapters[:3]:
        print(f'  {num} 正文长度={len(title_body)}')
else:
    print('❌ 解析失败！尝试直接搜索 \d+\.')
    # 直接用re.findall
    finds = re.findall(r'^(\d+)\.(.*)$', text, re.MULTILINE)
    print(f'findall找到 {len(finds)} 个')
    for f in finds[:5]:
        print(f'  {f}')
