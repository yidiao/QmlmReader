# -*- coding: utf-8 -*-
"""Decouple the 10 rectify article pages from their inline bodies.

For each html/rectify/<cat>/<slug>.html:
  - replace the inline content of <article class="article-content"> with a
    loading placeholder, keeping .article-footer / .back-link (page chrome)
  - add data-article-json pointing at data/rectify-json/<slug>.json on <body>
  - inject <script src="../../../js/rectify-json.js"></script> before cursor.js

Run:  python decouple_rectify_pages.py          (idempotent; skips done pages)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted((ROOT / "html" / "rectify").glob("*/*.html"))
PLACEHOLDER = '<p class="rectify-loading">正文加载中……</p>'
SCRIPT_TAG = '<script src="../../../js/rectify-json.js"></script>'


def decouple(page: Path) -> str:
    slug = page.stem
    html = page.read_text(encoding="utf-8")
    orig = html

    json_rel = "../../../data/rectify-json/" + slug + ".json"

    # 1. <body data-article-json="...">
    if "data-article-json" not in html:
        html, n = re.subn(r"<body>", '<body data-article-json="' + json_rel + '">', html, count=1)
        if n != 1:
            return f"[{slug}] <body> not found"

    # 2. strip inline article content, keep footer + back-link
    m = re.search(r'(<article class="article-content">)(.*?)(</article>)', html, re.S)
    if not m:
        return f"[{slug}] article-content not found"
    inner = m.group(2)
    if "rectify-loading" not in inner:
        keep = re.search(r'(<div class="article-footer">.*?</div>\s*<a href="\.\./\.\./rectify/rectify\.html" class="back-link">.*?</a>)', inner, re.S)
        kept = "\n            " + keep.group(1) + "\n        " if keep else "\n        "
        new_inner = "\n        " + PLACEHOLDER + kept
        html = html[:m.start(2)] + new_inner + html[m.end(2):]

    # 3. inject renderer script before cursor.js
    if "rectify-json.js" not in html:
        html, n = re.subn(r'(<script src="\.\./\.\./\.\./js/cursor\.js"></script>)',
                          SCRIPT_TAG + '\n    \\1', html, count=1)
        if n != 1:
            return f"[{slug}] cursor.js script tag not found"

    if html != orig:
        page.write_text(html, encoding="utf-8")
        return f"[{slug}] decoupled -> {json_rel}"
    return f"[{slug}] already decoupled"


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    for page in PAGES:
        print(decouple(page))


if __name__ == "__main__":
    main()
