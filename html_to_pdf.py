#!/usr/bin/env python3
"""
使用 Playwright + Chromium 将 HTML 批量转换为 PDF
保留原有 CSS 样式，可读性好
"""

import os
import sys
import asyncio
from pathlib import Path

# 路径配置
BASE_DIR = Path("D:/Qmlmreader")
ARTICLES_HTML_DIR = BASE_DIR / "articles"
RECTIFY_HTML_BASE = BASE_DIR / "rectify"
ARTICLES_PDF_DIR = BASE_DIR / "downloads/articles"
RECTIFY_PDF_DIR = BASE_DIR / "downloads/rectify"

# 需要排除的 HTML 文件
EXCLUDE_ARTICLES = {"_template.html", "guo-jia-yu-ge-ming-backup.html", "wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi-v2.html", "zen-me-ban-v2.html"}

# 收集所有需要转换的 HTML 文件
def collect_html_files():
    tasks = []  # (html_path, pdf_path)

    # articles 目录
    ARTICLES_PDF_DIR.mkdir(parents=True, exist_ok=True)
    for html_file in sorted(ARTICLES_HTML_DIR.glob("*.html")):
        if html_file.name in EXCLUDE_ARTICLES:
            continue
        pdf_name = html_file.stem + ".pdf"
        pdf_path = ARTICLES_PDF_DIR / pdf_name
        tasks.append((html_file, pdf_path))

    # rectify 目录（含子目录）
    RECTIFY_PDF_DIR.mkdir(parents=True, exist_ok=True)
    for subdir in ["leaders", "economy", "military", "myths"]:
        sub_path = RECTIFY_HTML_BASE / subdir
        if not sub_path.exists():
            continue
        for html_file in sorted(sub_path.glob("*.html")):
            pdf_name = "rectify-" + html_file.stem + ".pdf"
            pdf_path = RECTIFY_PDF_DIR / pdf_name
            tasks.append((html_file, pdf_path))

    return tasks


async def html_to_pdf(playwright, html_path: Path, pdf_path: Path):
    """用 Chromium 将单个 HTML 转为 PDF"""
    chromium = playwright.chromium
    browser = await chromium.launch()
    try:
        page = await browser.new_page()
        # 用 file:// 协议加载本地 HTML
        file_url = html_path.resolve().as_uri()
        await page.goto(file_url, wait_until="networkidle", timeout=30000)
        # 等待字体和布局稳定
        await page.wait_for_timeout(1000)

        # 打印为 PDF
        await page.pdf(
            path=str(pdf_path),
            format="A4",
            print_background=True,
            margin={"top": "20mm", "bottom": "20mm", "left": "15mm", "right": "15mm"},
        )
        size_kb = pdf_path.stat().st_size // 1024
        print(f"  ✓ {pdf_path.name}  ({size_kb} KB)")
    except Exception as e:
        print(f"  ✗ 失败: {html_path.name} — {e}")
    finally:
        await browser.close()


async def main():
    tasks = collect_html_files()
    print(f"共发现 {len(tasks)} 个 HTML 文件需要转换\n")

    if not tasks:
        print("没有发现需要转换的文件，退出。")
        return

    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        for i, (html_path, pdf_path) in enumerate(tasks, 1):
            print(f"[{i}/{len(tasks)}] 转换: {html_path.name}")
            await html_to_pdf(p, html_path, pdf_path)

    print(f"\n✅ 全部完成！PDF 保存在:")
    print(f"  文章: {ARTICLES_PDF_DIR}")
    print(f"  正名: {RECTIFY_PDF_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
