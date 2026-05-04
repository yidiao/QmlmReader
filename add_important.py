import re

with open('D:/Qmlmreader/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 窄屏媒体查询（max-width: 768px）中的 grid-template-columns 加 !important
# 先找到窄屏媒体查询的范围
narrow_start = content.find('@media (max-width: 768px) {')
if narrow_start == -1:
    print('未找到窄屏媒体查询')
else:
    # 找到对应的结束 }
    # 简单处理：在 @media (max-width: 768px) { 和下一个 } 之间添加 !important
    # 更稳妥的做法：逐行处理
    lines = content.split('\n')
    in_narrow_media = False
    for i, line in enumerate(lines):
        if '@media (max-width: 768px)' in line:
            in_narrow_media = True
            continue
        if in_narrow_media:
            if 'grid-template-columns:' in line and '!important' not in line:
                # 在分号前加 !important
                line = line.replace(';', ' !important;')
                lines[i] = line
            if '}' in line and not in_narrow_media:
                # 结束媒体查询
                in_narrow_media = False
    content = '\n'.join(lines)

# 2. 宽屏媒体查询（min-width: 769px）中的 grid-template-columns 加 !important
lines = content.split('\n')
in_wide_media = False
for i, line in enumerate(lines):
    if '@media (min-width: 769px)' in line:
        in_wide_media = True
        continue
    if in_wide_media:
        if 'grid-template-columns:' in line and '!important' not in line:
            line = line.replace(';', ' !important;')
            lines[i] = line
        # 宽屏媒体查询的结束 }
        if '}' in line and i > 0 and '@media' not in lines[i-1]:
            # 检查是否是媒体查询的结束
            # 简单检查：如果这一行只有 } 或者包含 } 且之后没有 {，可能是结束
            if line.strip() == '}' or (line.strip().endswith('}') and i+1 < len(lines) and '@media' not in lines[i+1][:50]):
                in_wide_media = False

content = '\n'.join(lines)

with open('D:/Qmlmreader/css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('已添加 !important 到媒体查询中的 grid-template-columns')
