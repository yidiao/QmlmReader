#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QmlmReader 数据源统一构建脚本

读取：
- data/articles.json
- data/collections.json
- data/gallery.json
- data/rectify.json
- downloads/manifest.unified.json

输出：
- js/site-data.js

用法：
    python _tools/build_data.py --check   # 只校验
    python _tools/build_data.py --write   # 校验并生成
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

INPUTS = {
    "articles": ROOT / "data" / "articles.json",
    "collections": ROOT / "data" / "collections.json",
    "gallery": ROOT / "data" / "gallery.json",
    "rectify": ROOT / "data" / "rectify.json",
    "downloads": ROOT / "downloads" / "manifest.unified.json",
}

OUTPUT = ROOT / "js" / "site-data.js"

VALID_AUTHORS = {"marx", "engels", "lenin", "stalin", "mao"}
VALID_TYPES = {"philosophy", "economics", "politics", "party", "military", "culture"}
VALID_PRIORITIES = {1, 2, 3, 4, 5}


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def check_articles(articles, collections):
    errors = []
    slugs = set()
    collection_ids = {c["id"] for c in collections}

    for article in articles:
        slug = article.get("slug")
        if not slug:
            errors.append("文章缺少 slug")
            continue
        if slug in slugs:
            errors.append(f"重复 slug: {slug}")
        slugs.add(slug)

        if article.get("ready"):
            file = article.get("file")
            if file:
                html = ROOT / "html" / file
                if not html.exists():
                    errors.append(f"文章 HTML 不存在: {file}")

        if article.get("authorKey") not in VALID_AUTHORS:
            errors.append(f"非法 authorKey: {article.get('authorKey')} ({slug})")

        if article.get("type") not in VALID_TYPES:
            errors.append(f"非法 type: {article.get('type')} ({slug})")

        if article.get("priority") not in VALID_PRIORITIES:
            errors.append(f"非法 priority: {article.get('priority')} ({slug})")

        for cid in article.get("collections", []):
            if cid not in collection_ids:
                errors.append(f"合集不存在: {cid} ({slug})")

    for coll in collections:
        for item in coll.get("articles", []):
            s = item.get("slug")
            if s is None:
                continue
            # collections 里的 slug 是带作者目录的路径，例如 Mao/shi-jian-lun
            short_slug = s.split("/")[-1]
            if short_slug not in slugs:
                errors.append(f"合集 {coll['id']} 引用了未知 slug: {s}")

    return errors


def build_article_index(articles):
    return [
        {
            "title": a["title"],
            "file": a["file"],
            "author": a["author"],
            "authorKey": a["authorKey"],
            "year": a["year"],
            "priority": str(a["priority"]),
            "category": a["category"],
            "keywords": a["keywords"],
        }
        for a in articles
        if a.get("ready")
    ]


def build_site_data(articles, collections, gallery, rectify, downloads):
    return {
        "generatedAt": "by build_data.py",
        "collections": collections,
        "articles": articles,
        "articleIndex": build_article_index(articles),
        "galleryIndex": gallery,
        "rectifyIndex": rectify,
        "downloadData": downloads,
    }


def write_site_data(data):
    js = "// 本文件由 _tools/build_data.py 自动生成，请勿手工编辑。\n"
    js += "window.SITE_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT.write_text(js, encoding="utf-8")


def main():
    args = sys.argv[1:]
    mode = "check"
    if "--write" in args:
        mode = "write"

    print("=== QmlmReader 数据源构建 ===")
    print("模式:", mode)
    print()

    try:
        articles = load_json(INPUTS["articles"])
        collections = load_json(INPUTS["collections"])
        gallery = load_json(INPUTS["gallery"])
        rectify = load_json(INPUTS["rectify"])
        downloads = load_json(INPUTS["downloads"])
    except Exception as e:
        print("读取数据失败:", e)
        sys.exit(1)

    errors = check_articles(articles, collections)
    if errors:
        print("校验失败：")
        for e in errors:
            print(" -", e)
        sys.exit(1)

    print("校验通过。")
    if mode == "write":
        data = build_site_data(articles, collections, gallery, rectify, downloads)
        write_site_data(data)
        print("已生成:", OUTPUT)
    else:
        print("未生成文件，使用 --write 可生成 js/site-data.js。")


if __name__ == "__main__":
    main()
