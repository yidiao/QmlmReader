#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
给所有引用 js/main.js 的 HTML 页面自动插入 js/site-data.js 引用。

用法：
    python _tools/add_site_data_script.py --apply

默认 dry-run，只打印将修改的文件。
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_DIR = ROOT / "html"
SITE_DATA = ROOT / "js" / "site-data.js"


def main():
    apply = "--apply" in sys.argv
    files = sorted(HTML_DIR.rglob("*.html"))
    changed = []

    for f in files:
        text = f.read_text(encoding="utf-8")
        if "js/site-data.js" in text:
            continue
        if "js/main.js" not in text:
            continue

        rel_path = Path(os.path.relpath(SITE_DATA, start=f.parent)).as_posix()
        m = re.search(r'<script[^>]+src="([^"]*js/main\.js)"[^>]*></script>', text)
        if not m:
            continue

        main_tag = m.group(0)
        site_tag = '<script src="' + rel_path + '"></script>\n    '
        new_text = text.replace(main_tag, site_tag + main_tag, 1)
        changed.append((f, site_tag + main_tag))
        if apply:
            f.write_text(new_text, encoding="utf-8")

    print("=== 添加 site-data.js 引用 ===")
    print("模式:", "实际修改" if apply else "dry-run")
    for f, new in changed:
        print(("修改" if apply else "待修改") + ":", f)
    if not apply:
        print("确认后运行：python _tools/add_site_data_script.py --apply")


if __name__ == "__main__":
    main()
