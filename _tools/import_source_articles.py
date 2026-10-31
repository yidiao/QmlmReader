#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将著作提取中的原文纳入 QmlmReader，并生成清单。

原则：保留 data/articles.json 中既有文章及页面不动；新资料生成统一的简洁文章页，
并把正文写入 generated 页面，下载中心随后从文章页即时导出 TXT/DOCX。
"""
from __future__ import annotations

import hashlib
import json
import re
import shutil
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from html import escape

from docx import Document
from pypinyin import lazy_pinyin

ROOT = Path(__file__).resolve().parent.parent
SOURCE_ROOT = Path(r"D:\AI Pj\金星与赤旗\著作提取")
DATA = ROOT / "data"
DOWNLOADS = ROOT / "downloads"
ARTICLE_ROOT = ROOT / "html" / "articles"
REPORT = ROOT / "data-management-inventory.md"

AUTHOR_INFO = {
    "毛泽东": ("毛泽东", "mao", "Mao"),
    "斯大林": ("斯大林", "stalin", "Stalin"),
    "马克思恩格斯": ("马克思 · 恩格斯", "marx", "Marx"),
}

EXTRA_DATA = {
    "lun-lunen": {"title": "论列宁", "author": "斯大林", "authorKey": "stalin", "year": "1924", "category": "党的建设", "type": "party", "priority": 4},
    "lun-lunen-zhu-yi-jige-wenti": {"title": "论列宁主义的几个问题", "author": "斯大林", "authorKey": "stalin", "year": "1926", "category": "政治理论", "type": "politics", "priority": 5},
    "makesi-zhuyi-minzu": {"title": "马克思主义和民族问题", "author": "斯大林", "authorKey": "stalin", "year": "1913", "category": "政治理论", "type": "politics", "priority": 5},
    "shiyue-geming-celue": {"title": "十月革命和俄国共产党人的策略", "author": "斯大林", "authorKey": "stalin", "year": "1924", "category": "政治理论", "type": "politics", "priority": 5},
    "shiyue-geming-guoji": {"title": "十月革命的国际性质", "author": "斯大林", "authorKey": "stalin", "year": "1927", "category": "政治理论", "type": "politics", "priority": 5},
    "shiyue-geming-minzu": {"title": "十月革命和民族问题", "author": "斯大林", "authorKey": "stalin", "year": "1918", "category": "政治理论", "type": "politics", "priority": 5},
    "wei-wu-zhu-yi": {"title": "唯物主义和经验批判主义", "author": "列宁", "authorKey": "lenin", "year": "1909", "category": "哲学基础", "type": "philosophy", "priority": 5},
}


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = re.sub(r"\s+", "", text)
    return text.strip()


def parse_title(name: str) -> str:
    stem = Path(name).stem
    stem = re.sub(r"^[★☆]+-\d+-", "", stem)
    stem = re.sub(r"^\d{3,4}[_-]", "", stem)
    # 少数文件名包含作者姓名/脚注标记，去掉不会改变标题的前缀。
    stem = re.sub(r"^(?:卡·马克思|弗·恩格斯|卡·马克思和弗·恩格斯|马克思恩格斯)\s*", "", stem)
    stem = stem.replace("", "").strip()
    return stem or Path(name).stem


def source_author(path: Path):
    rel = path.relative_to(SOURCE_ROOT)
    first = rel.parts[0] if rel.parts else "毛泽东"
    return AUTHOR_INFO.get(first, (first, "mao", "Mao"))


def priority_from_name(name: str) -> int:
    m = re.match(r"^(★+)[☆]*-", Path(name).name)
    return max(1, min(5, len(m.group(1)) if m else 3))


def title_key(title: str) -> str:
    text = normalize_text(title)
    text = re.sub(r"^(?:卡·马克思|弗·恩格斯|卡·马克思和弗·恩格斯|马克思恩格斯)", "", text)
    text = re.sub(r"（节选|选编|摘录|上册|下册）$", "", text)
    return re.sub(r"[《》〈〉‘’“”\"、：:，,。！？!?（）()\-— ]", "", text)


def matches_existing_title(title: str, existing_keys: set[str]) -> bool:
    key = title_key(title)
    if len(key) < 4:
        return False
    return any(key == old or (len(old) >= 5 and (key in old or old in key)) for old in existing_keys)


def make_slug(title: str) -> str:
    chars = lazy_pinyin(title, errors="ignore")
    raw = "-".join(chars)
    raw = re.sub(r"[^a-zA-Z0-9]+", "-", raw).strip("-").lower()
    return raw or "article"


def safe_slug(title: str, source: str, index: int) -> str:
    """限制文件名长度，保留可读前缀并用来源哈希确保稳定唯一。"""
    base = make_slug(title)
    digest = hashlib.sha1(source.encode("utf-8")).hexdigest()[:8]
    return f"{base[:72].rstrip('-')}-src-{index:03d}-{digest}"


def read_docx(path: Path) -> list[str]:
    doc = Document(str(path))
    return [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]


def read_txt(path: Path) -> list[str]:
    return [x.strip() for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]


def render_page(entry: dict, paragraphs: list[str]) -> str:
    author_dir = entry["file"].split("/")[1]
    depth = entry["file"].count("/")
    prefix = "../" * (depth + 1)
    paras = "\n".join(f"                            <p>{escape(p)}</p>" for p in paragraphs)
    title = escape(entry["title"])
    author = escape(entry["author"])
    category = escape(entry["category"])
    date = escape(entry.get("date") or entry.get("year") or "")
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - 青年马列毛主义驿站</title>
    <link rel="stylesheet" href="{prefix}css/style.css">
    <link rel="stylesheet" href="{prefix}css/articles-detail.css">
    <style>:root {{ --cat-primary:#8b0000; --cat-secondary:#c41e3a; --cat-gradient:linear-gradient(135deg,#4a0000 0%,#8b0000 50%,#c41e3a 100%); }}</style>
</head>
<body data-category="politics">
    <div id="nav-placeholder"></div>
    <div class="back-nav"><div class="container" style="max-width:900px;margin:0 auto;padding:0 20px;"><a href="../../articles.html" class="back-link">返回文章列表</a></div></div>
    <main class="article-detail">
        <header class="article-header">
            <div class="importance-badge">原文资料</div>
            <h1>{title}</h1>
            <div class="article-subtitle">{author} · 原始资料整理</div>
            <div class="article-meta"><span class="author">{author}</span><span class="date">{date}</span><span class="category">{category}</span><span class="word-count">约{len(normalize_text(''.join(paragraphs))):,}字</span></div>
        </header>
        <div class="tab-nav"><button class="tab-btn active" onclick="switchTab('original', this)">原文</button></div>
        <div class="tab-content active" id="original"><div class="original-text">
            <div class="text-intro"><p><strong>阅读提示：</strong>本文来自原始资料提取，正文按原文段落整理。</p></div>
            <div class="chapter"><h3 class="chapter-title"><span class="toggle-icon">▾</span>正文</h3><div class="chapter-content">{paras}</div></div>
        </div></div>
    </main>
    <script src="{prefix}js/download-export.js"></script>
    <script src="{prefix}js/article-common.js"></script>
    <script>var DOWNLOAD_LINKS = window.buildStandardDownloadLinks ? window.buildStandardDownloadLinks() : [];</script>
    <script src="{prefix}js/site-data.js"></script><script src="{prefix}js/main.js"></script><script src="{prefix}js/darkmode.js"></script><script src="{prefix}js/cursor.js"></script>
</body></html>'''


def entry_for(slug: str, title: str, author: str, author_key: str, author_dir: str, category="经典文献", typ="politics", priority=3, year=""):
    file = f"articles/imported/{author_dir}/{slug}.html"
    return {
        "slug": slug, "title": title, "author": author, "authorKey": author_key,
        "date": year, "year": year, "priority": priority, "category": category,
        "type": typ, "keywords": [title, "原文"], "file": file, "ready": True,
        "collections": [], "source": "金星与赤旗/著作提取"
    }


def build_download_manifests(articles: list[dict], rectify: list[dict]):
    cat_map = {"mao": "mao", "lenin": "lenin", "stalin": "stalin", "marx": "marx", "engels": "marx"}
    article_items = []
    for a in articles:
        if not a.get("ready"):
            continue
        year_raw = str(a.get("year") or "")
        year_match = re.search(r"(\d{4})", year_raw)
        article_items.append({
            "title": a["title"],
            "author": a["author"],
            "cat": cat_map.get(a.get("authorKey"), "marx"),
            "slug": a["slug"],
            "year": int(year_match.group(1)) if year_match else year_raw,
            "file": a["file"],
        })
    posters = json.loads((DOWNLOADS / "manifest.unified.json").read_text(encoding="utf-8")).get("posters", [])
    rectify_items = []
    for item in rectify:
        file = item.get("file", "")
        stem = Path(file).stem
        section = (Path(file).parts[1] if len(Path(file).parts) > 1 else "rectify")
        rectify_items.append({
            "title": item["title"],
            "cat": "rectify",
            "slug": f"rectify-{stem}",
            "section": section,
            "file": file,
        })
    manifest = {"articles": article_items, "rectify": rectify_items, "posters": posters}
    for name in ["manifest.json", "manifest.unified.json"]:
        (DOWNLOADS / name).write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")



def main():
    articles = json.loads((DATA / "articles.json").read_text(encoding="utf-8"))
    rectify = json.loads((DATA / "rectify.json").read_text(encoding="utf-8"))
    existing_slugs = {a["slug"] for a in articles}
    existing_titles = {normalize_text(a["title"]): a for a in articles}
    existing_title_keys = {title_key(a["title"]) for a in articles}
    existing_source_files = {a.get("sourceFile") for a in articles if a.get("sourceFile")}

    # data 中七个此前只有 TXT/PDF、没有 articles.json 条目的经典文本先纳入。
    new_entries = []
    text_sources: dict[str, list[str]] = {}
    existing_content = {}
    for p in DATA.glob("*.txt"):
        if p.stem.endswith("_extracted") or p.stem.startswith("rectify-"):
            continue
        existing_content[p.stem] = normalize_text(p.read_text(encoding="utf-8"))
    for slug, meta in EXTRA_DATA.items():
        if slug in existing_slugs or slug not in existing_content or title_key(meta["title"]) in existing_title_keys:
            continue
        entry = entry_for(slug, meta["title"], meta["author"], meta["authorKey"], meta["author"].replace("列宁", "Lenin").replace("斯大林", "Stalin"), meta["category"], meta["type"], meta["priority"], meta["year"])
        # 特殊：唯物主义文件的作者目录应为 Lenin。
        entry["file"] = f"articles/imported/{'Lenin' if meta['authorKey']=='lenin' else 'Stalin'}/{slug}.html"
        new_entries.append(entry)
        text_sources[slug] = read_txt(DATA / f"{slug}.txt")
        existing_slugs.add(slug)
        existing_titles[normalize_text(entry["title"])] = entry

    source_files = sorted(SOURCE_ROOT.rglob("*.docx"))
    source_files = [p for p in source_files if "\\_txt\\" not in str(p)]
    seen_content = set(existing_content.values())
    seen_content.update(normalize_text("\n".join(v)) for v in text_sources.values())
    title_counts = Counter()
    generated = 0
    skipped_existing = 0
    duplicate_titles = defaultdict(list)
    errors = []

    for path in source_files:
        try:
            paragraphs = read_docx(path)
        except Exception as exc:
            errors.append(f"- `{path.relative_to(SOURCE_ROOT)}`：{exc}")
            continue
        if not paragraphs:
            errors.append(f"- `{path.relative_to(SOURCE_ROOT)}`：正文为空")
            continue
        content_key = normalize_text("\n".join(paragraphs))
        if content_key in seen_content:
            skipped_existing += 1
            continue
        rel_source = str(path.relative_to(SOURCE_ROOT)).replace('\\', '/')
        if rel_source in existing_source_files:
            skipped_existing += 1
            continue
        title = parse_title(path.name)
        author, author_key, author_dir = source_author(path)
        if matches_existing_title(title, existing_title_keys):
            skipped_existing += 1
            continue
        base = make_slug(title)
        title_counts[base] += 1
        slug = safe_slug(title, rel_source, title_counts[base])
        while slug in existing_slugs:
            title_counts[base] += 1
            slug = safe_slug(title, rel_source, title_counts[base])
        entry = entry_for(slug, title, author, author_key, author_dir, "经典文献", "politics", priority_from_name(path.name), "")
        entry["sourceFile"] = rel_source
        new_entries.append(entry)
        text_sources[slug] = paragraphs
        existing_slugs.add(slug)
        existing_title_keys.add(title_key(title))
        seen_content.add(content_key)
        duplicate_titles[normalize_text(title)].append(entry)
        generated += 1

    # 写入新文章页；绝不覆盖现有增强文章页。
    for entry in new_entries:
        out = ROOT / "html" / entry["file"]
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render_page(entry, text_sources[entry["slug"]]), encoding="utf-8")

    articles.extend(new_entries)
    (DATA / "articles.json").write_text(json.dumps(articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    build_download_manifests(articles, rectify)

    # 清单：明确列出所有 PDF、data TXT 与自动处理结果；保留 rectify TXT。
    pdf_article = sorted(p.name for p in (ROOT / "downloads" / "articles").glob("*.pdf"))
    pdf_rectify = sorted(p.name for p in (ROOT / "downloads" / "rectify").glob("*.pdf"))
    txt_items = []
    for p in sorted(DATA.glob("*.txt")):
        if p.stem.startswith("rectify-"):
            kind = "保留：正名专题正文（非经典著作数据）"
        elif p.stem.endswith("_extracted"):
            kind = "已迁移后删除：提取重复副本"
        elif p.stem in EXTRA_DATA:
            kind = "已迁移后删除：此前仅 TXT/PDF，已纳入 articles.json"
        else:
            kind = "已迁移后删除：与网站文章正文重复"
        txt_items.append(f"- `{p.name}` — {p.stat().st_size:,} bytes — {kind}")
    dup = {k: v for k, v in duplicate_titles.items() if len(v) > 1}
    report = [
        "# Qmlmreader 数据与下载中心整理清单", "",
        "## 处理原则", "- 既有 `data/articles.json` 元数据和既有增强文章页优先保留，不以原始资料覆盖。",
        "- 原始资料只用于补齐网站缺失文章；内容写入生成的文章阅读页。",
        "- 下载中心不再保存文章 PDF/TXT，点击下载时由文章页正文即时生成 TXT 或 DOCX。",
        "- `data/rectify-*.txt` 属于正名专题正文，和经典著作数据分开，保留。", "",
        "## 数量总览",
        f"- 原始资料 DOCX：{len(source_files):,} 个（排除 `_txt` 提取目录）",
        f"- 既有 articles.json：{len(articles)-len(new_entries):,} 条；整理后：{len(articles):,} 条",
        f"- 新增经典条目：{len(new_entries):,} 条（其中 data TXT/PDF 纳入 {len([x for x in new_entries if x['slug'] in EXTRA_DATA]):,} 条，原始 DOCX 纳入 {generated:,} 条）",
        f"- 原始 DOCX 与既有/新增文本重复而跳过：{skipped_existing:,} 个",
        f"- 生成新文章阅读页：{len(new_entries):,} 个",
        f"- 原始资料读取异常/空文档：{len(errors):,} 个", "",
        "## `downloads/articles` PDF 清单（待删除，不再由页面引用）",
    ] + [f"- `{x}`" for x in pdf_article] + ["", "## `downloads/rectify` PDF 清单（待删除，不再由页面引用）"] + [f"- `{x}`" for x in pdf_rectify] + ["", "## `data` TXT 清单"] + txt_items + ["", "## 原始资料同标题多版本提示"]
    if dup:
        report.append("以下标题在原始资料中有多个不同正文版本，已使用不同 `-src-###` slug 保留，不合并：")
        for title, vals in sorted(dup.items()):
            report.append(f"- **{title}**：" + ", ".join(f"`{v['slug']}`" for v in vals))
    else:
        report.append("没有检测到新增条目中的同标题多版本。")
    if errors:
        report += ["", "## 需要人工复核的源文件"] + errors
    REPORT.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(json.dumps({"existing": len(articles)-len(new_entries), "added": len(new_entries), "generatedFromDocx": generated, "skippedDuplicate": skipped_existing, "errors": len(errors), "report": str(REPORT)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
