#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
替换 propaganda.html 中的 FILES_V02 数组
"""

import re

HTML_FILE = r"D:\Qmlmreader\gallery\propaganda.html"
NEW_ARRAY_FILE = r"D:\Qmlmreader\v02_files_array.txt"

def replace_files_v02():
    # 读取新的数组内容
    with open(NEW_ARRAY_FILE, 'r', encoding='utf-8') as f:
        new_array = f.read()
    
    # 读取原文件
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换 FILES_V02 数组
    pattern = r'const FILES_V02 = \[.*?\];'
    
    # 使用 DOTALL 模式匹配多行内容
    new_content = re.sub(pattern, new_array.strip(), content, flags=re.DOTALL)
    
    # 保存修改后的文件
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("FILES_V02 数组已更新！")
    print(f"新数组包含 {new_array.count('.jpg')} 个文件")

if __name__ == "__main__":
    replace_files_v02()
