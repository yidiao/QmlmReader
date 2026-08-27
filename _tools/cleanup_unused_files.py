#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QmlmReader 无用文件清理脚本

默认只做 dry-run 打印，确认无误后加 --apply 真正删除：
    python _tools/cleanup_unused_files.py --apply

清理清单：
1. js/main.js.bak                     # 备份文件，已无用
2. css/style.css.bak                  # 备份文件，已无用
3. 设计文档/武器库-我的更新大纲.md       # 内容已被各子设计文档拆分取代
4. html/experimental/marxist-style.html  # 与 html/toolkit/marxist-style.html 重复

说明：
- 删除 experimental/marxist-style.html 前会检查 toolkit/marxist-style.html 是否存在。
- 其他 _tools/*.py 是一次性迁移脚本，暂不清理，建议归档而非删除。
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FILES_TO_DELETE = [
    ROOT / "js" / "main.js.bak",
    ROOT / "css" / "style.css.bak",
    ROOT / "设计文档" / "武器库-我的更新大纲.md",
    ROOT / "html" / "experimental" / "marxist-style.html",
]


def main():
    apply = "--apply" in sys.argv

    print("=== QmlmReader 无用文件清理 ===")
    print("模式:", "实际删除" if apply else "dry-run（不加 --apply 不会删除）")
    print()

    deleted = 0
    skipped = 0

    for path in FILES_TO_DELETE:
        if not path.exists():
            print(f"[跳过] 不存在: {path}")
            skipped += 1
            continue

        # 安全校验：删除重复的 marxist-style 前必须存在 toolkit 正式版
        if path.name == "marxist-style.html" and path.parent.name == "experimental":
            toolkit_version = ROOT / "html" / "toolkit" / "marxist-style.html"
            if not toolkit_version.exists():
                print(f"[阻止] 找不到正式版 toolkit/marxist-style.html，不删除 {path}")
                skipped += 1
                continue

        print(f"[{'删除' if apply else '待删'}] {path}")
        if apply:
            path.unlink()
            deleted += 1

    print()
    print(f"完成：删除 {deleted} 个，跳过 {skipped} 个。")
    if not apply:
        print("如确认无误，请运行：python _tools/cleanup_unused_files.py --apply")


if __name__ == "__main__":
    main()
