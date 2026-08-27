#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全站清理 HTML 文件中的 emoji。

用法：
    python _tools/strip_emoji.py --apply

默认 dry-run，只打印会修改的文件。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_DIR = ROOT / "html"

# 常见 emoji / 符号区间
EMOJI_RE = re.compile(
    "["
    "\U0001F000-\U0001FAFF"
    "\u2600-\u27BF"
    "\uFE0F"
    "\u2B00-\u2BFF"
    "\u2E80-\u2EFF"
    "\u3000-\u303F"
    "\u2190-\u21FF"
    "\u25A0-\u25FF"
    "]+"
)


def main():
    apply = "--apply" in sys.argv
    changed = []

    for f in sorted(HTML_DIR.rglob("*.html")):
        text = f.read_text(encoding="utf-8")
        new_text = EMOJI_RE.sub("", text)
        if new_text != text:
            changed.append(f)
            if apply:
                f.write_text(new_text, encoding="utf-8")

    print("=== 全站清理 HTML emoji ===")
    print("模式:", "实际修改" if apply else "dry-run")
    for f in changed:
        print(("修改" if apply else "待修改") + ":", f)
    if not apply:
        print("确认后运行：python _tools/strip_emoji.py --apply")


if __name__ == "__main__":
    main()
