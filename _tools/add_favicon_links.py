# -*- coding: utf-8 -*-
"""为全站 HTML 页面插入统一图标 <link rel="icon">。

- 图标文件在站点根目录（favicon.svg / favicon.ico），按页面深度写相对路径。
- 插入位置：紧跟 </title> 行之后；无 </title> 时紧跟 <head> 行之后。
- 已含 rel="icon" 的文件跳过（如 soviet-jokes，另行处理）。
- 保留 UTF-8 BOM 与原有 CRLF/LF 行尾风格。
- 范围：根目录 index.html + html/ 全部 .html；跳过任何 data/ 子目录（数据目录不动）。
"""
import os
import re

ROOT = r"D:\AI Pj\myProject\Qmlmreader"
SKIP_DIRS = {"data", ".git", "node_modules"}

RE_TITLE = re.compile(r"([ \t]*)(</title>[^\n]*?\n)")
RE_HEAD = re.compile(r"([ \t]*)(<head[^>]*>[^\n]*?\n)")


def link_tag(prefix, indent, eol):
    return (
        f'{indent}<link rel="icon" href="{prefix}favicon.svg" type="image/svg+xml">{eol}'
        f'{indent}<link rel="shortcut icon" href="{prefix}favicon.ico">{eol}'
    )


targets = [os.path.join(ROOT, "index.html")]
html_dir = os.path.join(ROOT, "html")
for dirpath, dirnames, filenames in os.walk(html_dir):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fn in filenames:
        if fn.lower().endswith(".html"):
            targets.append(os.path.join(dirpath, fn))

changed, already, skipped = [], [], []
for p in targets:
    rel = os.path.relpath(p, ROOT)
    with open(p, "rb") as f:
        raw = f.read()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig" if has_bom else "utf-8")
    if 'rel="icon"' in text or "rel='icon'" in text:
        already.append(rel)
        continue
    # 相对前缀：根目录文件为 ''，其余按目录深度加 ../
    dir_rel = os.path.dirname(rel)
    depth = 0 if dir_rel == "" else dir_rel.count(os.sep) + 1
    prefix = "../" * depth
    m = RE_TITLE.search(text)
    if m:
        indent, eol = m.group(1), "\r\n" if m.group(2).endswith("\r\n") else "\n"
        new_text = text[: m.start()] + m.group(0) + link_tag(prefix, indent, eol) + text[m.end():]
    else:
        m = RE_HEAD.search(text)
        if not m:
            skipped.append(rel)
            continue
        indent, eol = m.group(1), "\r\n" if m.group(2).endswith("\r\n") else "\n"
        new_text = text[: m.end()] + link_tag(prefix, indent, eol) + text[m.end():]
    data = new_text.encode("utf-8")
    if has_bom:
        data = b"\xef\xbb\xbf" + data
    with open(p, "wb") as f:
        f.write(data)
    changed.append(rel)

print(f"total={len(targets)} changed={len(changed)} already={len(already)} skipped={len(skipped)}")
if already:
    print("already had icon:")
    for r in already:
        print("  ", r)
if skipped:
    print("NO head/title, skipped:")
    for r in skipped:
        print("  ", r)
