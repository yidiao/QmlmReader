#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 assets/posters/ 和 assets/soviet-posters/ 打包为 zip 供下载
"""

import os
import zipfile

POSTERS_DIR = 'D:/Qmlmreader/assets/posters'
SOVIET_DIR = 'D:/Qmlmreader/assets/soviet-posters'
OUTPUT_DIR = 'D:/Qmlmreader/downloads/posters'

os.makedirs(OUTPUT_DIR, exist_ok=True)

def zip_folder(folder_path, zip_path, display_name):
    """将文件夹打包为 zip"""
    if not os.path.exists(folder_path):
        print(f'  ⚠️ 目录不存在: {folder_path}')
        return 0
    count = 0
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(folder_path):
            for fname in files:
                fpath = os.path.join(root, fname)
                arcname = os.path.relpath(fpath, os.path.dirname(folder_path))
                zf.write(fpath, arcname)
                count += 1
    size_mb = os.path.getsize(zip_path) / 1024 / 1024
    print(f'  ✅ {os.path.basename(zip_path)}: {count} 张图片, {size_mb:.1f}MB')
    return count

print('=== 打包宣传画 ===')

# 中国宣传画：分辑打包
if os.path.exists(POSTERS_DIR):
    for subdir in sorted(os.listdir(POSTERS_DIR)):
        subpath = os.path.join(POSTERS_DIR, subdir)
        if os.path.isdir(subpath):
            # V01-第一辑 -> chinese-posters-V01.zip
            code = subdir.split('-')[0]  # V01, V02, V03
            name_cn = subdir.split('-', 1)[1] if '-' in subdir else subdir
            zip_name = f'chinese-posters-{code}.zip'
            zip_path = os.path.join(OUTPUT_DIR, zip_name)
            count = zip_folder(subpath, zip_path, f'中国宣传画{name_cn}')

# 苏联宣传画：按子目录分类打包
if os.path.exists(SOVIET_DIR):
    subdirs = [d for d in os.listdir(SOVIET_DIR) if os.path.isdir(os.path.join(SOVIET_DIR, d))]
    if subdirs:
        for subdir in sorted(subdirs):
            subpath = os.path.join(SOVIET_DIR, subdir)
            safe_name = subdir.replace(' ', '-').replace('/', '-')
            zip_name = f'soviet-posters-{safe_name}.zip'
            zip_path = os.path.join(OUTPUT_DIR, zip_name)
            count = zip_folder(subpath, zip_path, f'苏联宣传画·{subdir}')
    else:
        # 没有子目录，整体打包
        zip_path = os.path.join(OUTPUT_DIR, 'soviet-posters-all.zip')
        count = zip_folder(SOVIET_DIR, zip_path, '苏联宣传画')

# 生成 posters manifest
import json
posters_manifest = []
for fname in sorted(os.listdir(OUTPUT_DIR)):
    if fname.endswith('.zip'):
        fsize = os.path.getsize(os.path.join(OUTPUT_DIR, fname))
        if 'chinese' in fname:
            if 'V01' in fname:
                label = '中国宣传画·第一辑'
            elif 'V02' in fname:
                label = '中国宣传画·第二辑'
            elif 'V03' in fname:
                label = '中国宣传画·第三辑（里斯本博物馆藏）'
            else:
                label = fname
        elif 'soviet' in fname:
            theme = fname.replace('soviet-posters-', '').replace('.zip', '').replace('-', ' ')
            label = f'苏联宣传画·{theme}'
        else:
            label = fname
        posters_manifest.append({
            'filename': fname,
            'label': label,
            'size_mb': round(fsize / 1024 / 1024, 1),
            'path': f'downloads/posters/{fname}'
        })

manifest_path = f'{OUTPUT_DIR}/posters_manifest.json'
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(posters_manifest, f, ensure_ascii=False, indent=2)
print(f'\n✅ 宣传画清单: {len(posters_manifest)} 个包')
for p in posters_manifest:
    print(f'   {p["label"]}: {p["size_mb"]}MB')
