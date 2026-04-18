#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根据实际文件夹中的文件名，生成正确的 FILES_V02 数组
"""

import os

V02_FOLDER = r"D:\Qmlmreader\assets\posters\V02-第二辑"
OUTPUT_FILE = r"D:\Qmlmreader\v02_files_array.txt"

def generate_files_v02():
    """生成 FILES_V02 数组内容"""
    # 获取所有jpg文件并排序
    files = [f for f in os.listdir(V02_FOLDER) if f.endswith('.jpg')]
    files.sort()
    
    print(f"找到 {len(files)} 个文件")
    
    # 生成数组格式
    lines = []
    lines.append('    const FILES_V02 = [')
    
    # 每行最多放5个文件，避免行过长
    for i in range(0, len(files), 5):
        batch = files[i:i+5]
        line = '        ' + ','.join(f'"{f}"' for f in batch)
        if i + 5 < len(files):
            line += ','
        lines.append(line)
    
    lines.append('    ];')
    
    # 保存到文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"已生成 FILES_V02 数组，保存到: {OUTPUT_FILE}")
    print(f"数组包含 {len(files)} 个文件")
    
    # 显示前10个和后10个文件名
    print("\n前10个文件:")
    for f in files[:10]:
        print(f"  {f}")
    
    print("\n后10个文件:")
    for f in files[-10:]:
        print(f"  {f}")
    
    return files

if __name__ == "__main__":
    generate_files_v02()
