#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 downloads/manifest.unified.json 同步为 downloads/manifest.json。

用途：
- 旧的 downloads/manifest.json 已不建议手工维护。
- 统一数据源以 manifest.unified.json 为准。
- 运行本脚本可把旧文件覆盖为与 unified 一致的内容。

用法：
    python _tools/sync_manifest.py
"""

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "downloads" / "manifest.unified.json"
DST = ROOT / "downloads" / "manifest.json"


def main():
    if not SRC.exists():
        print("缺少源文件:", SRC)
        return

    shutil.copyfile(SRC, DST)
    print("已同步:")
    print("  from:", SRC)
    print("  to:  ", DST)


if __name__ == "__main__":
    main()
