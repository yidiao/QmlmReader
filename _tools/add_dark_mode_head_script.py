# -*- coding: utf-8 -*-
"""为全站 HTML 页面注入黑夜模式首帧预渲染内联脚本（防白闪 / 反 FOUC）。

背景：此前 dark-mode 类由 </body> 前的外部 darkmode.js 挂到 <body>，首帧
渲染晚于脚本执行，暗色用户跳转页面会先闪一帧白日样式。本工具把读取
localStorage 并给 <html> 挂类的逻辑提前为 <head> 内同步内联脚本（先于任何
样式表与首帧渲染执行）。

- 插入位置：viewport meta 行之后，无则 charset 行之后，再无则 <head> 行之后。
  必须位于所有 <link rel=stylesheet> 之前（内联脚本会等待先前样式表的 CSSOM）。
- 标记注释 qmlm:dark-mode-prerender 用于幂等跳过。
- 范围：html/ 全部 .html，但跳过 gallery/soviet-jokes/（自有 data-theme 体系，
  由 add_soviet_theme_head_script.py 处理）与 puzzle/capital-socialism/（无暗色
  系统）；根 index.html 为纯跳转桩，一并跳过。
- 保留 UTF-8 BOM 与原有 CRLF/LF 行尾风格。
用法：python -I _tools/add_dark_mode_head_script.py
"""
import os
import re

ROOT = r"D:\AI Pj\myProject\Qmlmreader"
SKIP = {
    "index.html",  # 根跳转桩，无样式
    os.path.join("html", "gallery", "soviet-jokes", "index.html"),
    os.path.join("html", "puzzle", "capital-socialism", "index.html"),
}
MARK = "qmlm:dark-mode-prerender"

SNIPPET = (
    "{i}<script>\n"
    "{i}    /* {mark}：首帧前同步挂 dark-mode 类，防暗色用户跳转时白闪 */\n"
    "{i}    (function () {{\n"
    "{i}        try {{\n"
    "{i}            if (localStorage.getItem('darkMode') === 'true') document.documentElement.classList.add('dark-mode');\n"
    "{i}        }} catch (e) {{ /* localStorage 不可用时维持白日模式 */ }}\n"
    "{i}    }})();\n"
    "{i}</script>\n"
)

RES = [
    re.compile(r"([ \t]*)(<meta\s+name=\"viewport\"[^\n]*?\n)"),
    re.compile(r"([ \t]*)(<meta\s+http-equiv=\"Content-Type\"[^\n]*?\n)", re.I),
    re.compile(r"([ \t]*)(<meta\s+charset=[^\n]*?\n)"),
    re.compile(r"([ \t]*)(<head[^>]*>[^\n]*?\n)"),
]

targets = []
for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, "html")):
    dirnames[:] = [d for d in dirnames if d not in {"data", ".git", "node_modules"}]
    for fn in filenames:
        if fn.lower().endswith(".html"):
            targets.append(os.path.join(dirpath, fn))

changed, already, skipped = [], [], []
for p in targets:
    rel = os.path.relpath(p, ROOT).replace("/", os.sep)
    if rel in SKIP:
        skipped.append(rel)
        continue
    with open(p, "rb") as f:
        raw = f.read()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig" if has_bom else "utf-8")
    if MARK in text:
        already.append(rel)
        continue
    for rx in RES:
        m = rx.search(text)
        if m:
            break
    if not m:
        skipped.append(rel + " (no anchor)")
        continue
    indent, eol = m.group(1), "\r\n" if m.group(2).endswith("\r\n") else "\n"
    snippet = SNIPPET.format(i=indent, mark=MARK).replace("\n", eol)
    new_text = text[: m.end()] + snippet + text[m.end():]
    data = new_text.encode("utf-8")
    if has_bom:
        data = b"\xef\xbb\xbf" + data
    with open(p, "wb") as f:
        f.write(data)
    changed.append(rel)

print(f"total={len(targets)} changed={len(changed)} already={len(already)} skipped={len(skipped)}")
for r in skipped:
    print("  skipped:", r)
