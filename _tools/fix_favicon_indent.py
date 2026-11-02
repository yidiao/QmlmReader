# -*- coding: utf-8 -*-
"""修正 add_favicon_links.py 插入行的缩进：按其后一行的行首空白对齐。"""
import os
import re

ROOT = r"D:\AI Pj\myProject\Qmlmreader"
SKIP_DIRS = {"data", ".git", "node_modules"}

# 顶格插入的两行 icon link
RE_BLOCK = re.compile(
    r'^<link rel="icon" href="([^"]+favicon\.svg)" type="image/svg\+xml">(\r?\n)'
    r'<link rel="shortcut icon" href="([^"]+favicon\.ico)">(\r?\n)',
    re.M,
)
RE_INDENT = re.compile(r"[ \t]*")

targets = [os.path.join(ROOT, "index.html")]
for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, "html")):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fn in filenames:
        if fn.lower().endswith(".html"):
            targets.append(os.path.join(dirpath, fn))

fixed = 0
for p in targets:
    with open(p, "rb") as f:
        raw = f.read()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig" if has_bom else "utf-8")
    m = RE_BLOCK.search(text)
    if not m:
        continue
    rest = text[m.end():]
    nxt = RE_INDENT.match(rest)
    indent = nxt.group(0) if nxt else ""
    eol = m.group(2)
    repl = (
        f'{indent}<link rel="icon" href="{m.group(1)}" type="image/svg+xml">{eol}'
        f'{indent}<link rel="shortcut icon" href="{m.group(3)}">{eol}'
    )
    new_text = text[: m.start()] + repl + rest
    data = new_text.encode("utf-8")
    if has_bom:
        data = b"\xef\xbb\xbf" + data
    with open(p, "wb") as f:
        f.write(data)
    fixed += 1

print(f"fixed indent in {fixed} files")
