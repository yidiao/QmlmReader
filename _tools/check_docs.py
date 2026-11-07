#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""QmlmReader 文档事实快照生成器（更新计划 A3，2026-11-07 建立）。

运行：python -I _tools/check_docs.py
输出 doc/ 各 README 引用的计数类断言的当前值，修订文档时以本输出回填，杜绝手工漂移。
只读，不修改任何文件。
"""

import io
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

print("QmlmReader 文档事实快照 · 生成日期", date.today().isoformat())
print("=" * 56)

# ---- 文章体系 ----
article_pages = [
    p for p in (ROOT / "html" / "articles").rglob("*.html")
    if "imported" not in p.parts and not p.name.startswith("_template")
    and p.name != "articles.html"  # 索引页本身不是详情页
]
imported_pages = list((ROOT / "html" / "articles" / "imported").rglob("*.html")) if (ROOT / "html" / "articles" / "imported").exists() else []
print("非 imported 正式文章详情页:", len(article_pages))
print("imported 正文页:", len(imported_pages))

articles = json.loads((ROOT / "data" / "articles.json").read_text(encoding="utf-8"))
imported_entries = [a for a in articles if "imported" in (a.get("file") or "")]
print("articles.json 条目:", len(articles))
print("articles.json imported 条目:", len(imported_entries))
print("articles.json 非 imported 条目:", len(articles) - len(imported_entries))

aj = list((ROOT / "data" / "articles-json").rglob("*.json"))
aj_meta = [p for p in aj if "_meta" in p.parts]
print("data/articles-json JSON:", len(aj), "（正文", len(aj) - len(aj_meta), "+ _meta", len(aj_meta), "）")

sj = list((ROOT / "data" / "study-json").rglob("*.json"))
sj_starred = [p for p in sj if any("★" in part for part in p.parts)]
print("data/study-json JSON:", len(sj), "（星级层路径", len(sj_starred), "个）")

double_declared = []
for p in article_pages:
    text = p.read_text(encoding="utf-8", errors="ignore")
    if "data-article-json" in text and "data-study-json" in text:
        double_declared.append(p)
print("双声明 data-article-json+data-study-json 的文章页:", len(double_declared))

rectify_json_pages = [p for p in (ROOT / "html" / "rectify").rglob("*.html") if "data-article-json" in p.read_text(encoding="utf-8", errors="ignore")]
print("rectify 走 data-article-json 的子页:", len(rectify_json_pages))

# ---- 内联样式现状（排除 imported 与 soviet-jokes）----
style_files = 0
style_blocks = 0
style_attrs = 0
for p in (ROOT / "html").rglob("*.html"):
    parts = p.parts
    if "imported" in parts or "soviet-jokes" in parts:
        continue
    text = p.read_text(encoding="utf-8", errors="ignore")
    blocks = len(re.findall(r"<style\b", text))
    attrs = len(re.findall(r'style="', text))
    if blocks or attrs:
        style_files += 1
        style_blocks += blocks
        style_attrs += attrs
print("平台页内联 <style> 块:", style_blocks, "（分布", style_files, "文件）")
print("平台页静态 style=\" 属性:", style_attrs)

# ---- 令牌化现状（常规层三文件）----
for name in ("css/style.css", "css/articles-detail.css", "css/articles-index.css"):
    text = (ROOT / name).read_text(encoding="utf-8", errors="ignore")
    hexes = len(re.findall(r"#[0-9a-fA-F]{3,8}\b", text))
    rgbas = len(re.findall(r"rgba?\(", text))
    print(name, "裸 hex:", hexes, "rgba:", rgbas)

# ---- 孤儿/遗留物哨兵（存在即 >0，应为 0）----
sentinels = [
    "data/masters/stalin/relations.json",
    "css/mentor",
    "js/main.js.bak",
    "css/style.css.bak",
    "js/mentor/stalin/relations.js.bak",
    "css/masters/stalin/relations.css.bak",
    "downloads/manifest.json",
    "_tools/sync_manifest.py",
]
alive = [s for s in sentinels if (ROOT / s).exists()]
alive += [p.name for p in ROOT.glob("data/rectify-*.txt")]
print("遗留物哨兵命中:", len(alive), alive if alive else "（全部已处置）")
