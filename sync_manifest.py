#!/usr/bin/env python3
"""
1. 将 data/*_extracted.txt 复制为 data/slug.txt
2. 更新 manifest.json 中的 txt/pdf 字段
"""

import json
import os
import shutil

MANIFEST = "D:/Qmlmreader/downloads/manifest.json"
DATA_DIR = "D:/Qmlmreader/data"
DOWNLOADS_ARTICLES = "D:/Qmlmreader/downloads/articles"

with open(MANIFEST, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 建立 title -> slug 映射
title_to_slug = {}
for a in data.get('articles', []):
    title = a['title']
    main = title.split('（')[0].split('(')[0].strip()
    title_to_slug[main] = a['slug']
    title_to_slug[title] = a['slug']

print("=== 处理 _extracted.txt -> slug.txt ===")
for fname in os.listdir(DATA_DIR):
    if not fname.endswith('_extracted.txt'):
        continue
    basename = fname.replace('_extracted.txt', '')
    slug = title_to_slug.get(basename)
    if not slug:
        print("  MISSING slug: " + basename)
        continue
    src = os.path.join(DATA_DIR, fname)
    dst = os.path.join(DATA_DIR, slug + ".txt")
    if not os.path.exists(dst):
        shutil.copy2(src, dst)
        print("  COPY: " + fname + " -> " + slug + ".txt")
    else:
        print("  EXISTS: " + slug + ".txt")

    # 更新 manifest txt 字段
    for a in data['articles']:
        if a['slug'] == slug:
            if not a.get('txt'):
                a['txt'] = 'data/' + slug + '.txt'
                print("  MANIFEST UPDATED: " + slug + " txt=" + a['txt'])
            break

print("\n=== 检查 PDF 字段 ===")
pdf_files = [f for f in os.listdir(DOWNLOADS_ARTICLES) if f.endswith('.pdf')]
print("downloads/articles/ 有 " + str(len(pdf_files)) + " 个 PDF")
for a in data['articles']:
    slug = a['slug']
    pdf_path = os.path.join(DOWNLOADS_ARTICLES, slug + '.pdf')
    if os.path.exists(pdf_path):
        if not a.get('pdf'):
            a['pdf'] = 'downloads/articles/' + slug + '.pdf'
            print("  FOUND PDF: " + slug + ".pdf")

# 写回 manifest
with open(MANIFEST, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("\nmanifest.json 已更新，重新注入下载 JS...")
