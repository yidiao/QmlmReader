#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查宣传画文件名匹配情况
对比实际文件夹中的文件名和 propaganda.html 中的 FILES_V02 数据
"""

import os
import re

# 实际文件夹路径
V02_FOLDER = r"D:\Qmlmreader\assets\posters\V02-第二辑"

# 读取 propaganda.html 中的 FILES_V02 数据
def extract_files_v02():
    """从 propaganda.html 提取 FILES_V02 数组"""
    with open(r"D:\Qmlmreader\gallery\propaganda.html", 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找 FILES_V02 数组
    pattern = r'const FILES_V02 = \[(.*?)\];'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("未找到 FILES_V02 数组")
        return []
    
    # 解析数组内容
    array_content = match.group(1)
    # 提取所有引号内的文件名
    files = re.findall(r'"([^"]+\.jpg)"', array_content)
    return files

# 获取实际文件夹中的文件名
def get_actual_files():
    """获取 V02-第二辑 文件夹中的实际文件名"""
    if not os.path.exists(V02_FOLDER):
        print(f"文件夹不存在: {V02_FOLDER}")
        return []
    
    files = []
    for f in os.listdir(V02_FOLDER):
        if f.endswith('.jpg'):
            files.append(f)
    return sorted(files)

# 对比文件名
def compare_files():
    """对比代码中的文件名和实际文件名"""
    code_files = extract_files_v02()
    actual_files = get_actual_files()
    
    print("=" * 80)
    print("宣传画文件名对比检查")
    print("=" * 80)
    print(f"\n代码中 FILES_V02 数量: {len(code_files)}")
    print(f"实际文件夹文件数量: {len(actual_files)}")
    print()
    
    # 转换为集合进行比较
    code_set = set(code_files)
    actual_set = set(actual_files)
    
    # 只在代码中存在的文件
    only_in_code = code_set - actual_set
    # 只在实际文件夹中存在的文件
    only_in_actual = actual_set - code_set
    
    if only_in_code:
        print("-" * 80)
        print(f"[!] 只在代码中存在，实际文件夹中缺失的文件 ({len(only_in_code)} 个):")
        print("-" * 80)
        for f in sorted(only_in_code):
            print(f"  - {f}")
        print()
    
    if only_in_actual:
        print("-" * 80)
        print(f"[!] 只在实际文件夹中存在，代码中缺失的文件 ({len(only_in_actual)} 个):")
        print("-" * 80)
        for f in sorted(only_in_actual):
            print(f"  - {f}")
        print()
    
    if not only_in_code and not only_in_actual:
        print("[OK] 所有文件名完全匹配！")
    
    # 显示前10个对比示例
    print("-" * 80)
    print("前10个文件对比示例:")
    print("-" * 80)
    for i in range(min(10, len(code_files), len(actual_files))):
        code_file = code_files[i] if i < len(code_files) else "N/A"
        actual_file = actual_files[i] if i < len(actual_files) else "N/A"
        match = "[OK]" if code_file == actual_file else "[X]"
        print(f"{match} 代码: {code_file}")
        print(f"   实际: {actual_file}")
        print()
    
    return only_in_code, only_in_actual

if __name__ == "__main__":
    compare_files()
