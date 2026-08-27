#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
去掉所有 HTML 页面中 tab 按钮（class 含 tab-btn）里的 emoji。

用法：
    python _tools/strip_tab_emoji.py --apply

默认 dry-run，只打印会修改的文件。
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_DIR = ROOT / "html"

# 常见 emoji / 符号区间，覆盖 Tab 中使用的 📖💡🔍💬⚡📊🧩 等
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
        lines = text.splitlines(keepends=True)
        new_lines = []
        modified = False

        for line in lines:
            if 'class="tab-btn' in line or "class='tab-btn" in line:
                new_line = EMOJI_RE.sub("", line)
                # 去掉 emoji 后可能留下多余空格
                new_line = new_line.replace(">  ", "> ").replace("> ", "> ")
                if new_line != line:
                    modified = True
                    line = new_line
            new_lines.append(line)

        if modified:
            changed.append(f)
            if apply:
                f.write_text("".join(new_lines), encoding="utf-8")

    print("=== 清理 Tab 按钮 emoji ===")
    print("模式:", "实际修改" if apply else "dry-run")
    for f in changed:
        print(("修改" if apply else "待修改") + ":", f)
    if not apply:
        print("确认后运行：python _tools/strip_tab_emoji.py --apply")


if __name__ == "__main__":
    main()
