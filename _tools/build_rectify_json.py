# -*- coding: utf-8 -*-
"""Build data/rectify-json/<slug>.json from the proofread txt files in
data/rectify-txt/, and refresh data/rectify.json metadata (10 entries).

Usage:  python build_rectify_json.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TXT_DIR = ROOT / "data" / "rectify-txt"
OUT_DIR = ROOT / "data" / "rectify-json"
META_FILE = ROOT / "data" / "rectify.json"

CATEGORY_BY_SECTION = {
    "leaders": "领导人正名",
    "military": "军事行动正名",
    "economy": "经济模式正名",
    "myths": "思想辩护",
}

# metadata for the three articles that were added beyond the original seven
NEW_META = {
    "pol-pot": {
        "title": "从历史条件与主观主义实践看民主柬埔寨的形成与失败",
        "category": "领导人正名",
        "summary": "从殖民创伤、战争破坏与美国轰炸的历史条件出发，分析民主柬埔寨的形成逻辑与主观主义实践的失败根源，反对简化为“疯狂政权”的道德叙事。",
        "keywords": ["波尔布特", "红色高棉", "民主柬埔寨", "正名", "柬埔寨", "大屠杀", "历史分析"],
    },
    "power-illusion": {
        "title": "权的幻象与资本的真相",
        "category": "思想辩护",
        "summary": "驳斥“剥削来自权力而非资本”的流行谬论：权力是资本喂养的守夜人，资产阶级法权把不平等包装成自由选择，新型工人的斗争矛头应指向资本本身。",
        "keywords": ["资本", "权力", "剥削", "法权", "外卖骑手", "平台经济", "阶级斗争"],
    },
    "young-october": {
        "title": "从“被嘲笑的理想”到“可操作的力量”",
        "category": "思想辩护",
        "summary": "为网络左翼青年提供从话语传播、理论补课到落地行动的三阶段破局路径，回应“键盘左派”嘲讽并给出可立即上手的实践方案。",
        "keywords": ["左翼青年", "网络话语权", "实践行动", "理论普及", "平台合作制", "组织"],
    },
}


def parse_txt(path):
    text = path.read_text(encoding="utf-8")
    meta = {"title": "", "subtitle": "", "metaLine": ""}
    blocks = []
    in_meta = False
    in_content = False
    container = None          # ("box", cls, blocks) | ("table", rows) | ("timeline", items)
    for raw in text.replace("\ufeff", "").splitlines():
        ln = raw.rstrip()
        s = ln.strip()
        if s == "[meta]":
            in_meta, in_content = True, False
            continue
        if s == "[content]":
            in_meta, in_content = False, True
            continue
        if in_meta:
            if s.startswith("title:"):
                meta["title"] = s[len("title:"):].strip()
            elif s.startswith("subtitle:"):
                meta["subtitle"] = s[len("subtitle:"):].strip()
            elif s.startswith("metaLine:"):
                meta["metaLine"] = s[len("metaLine:"):].strip()
            continue
        if not in_content:
            continue
        if container:
            kind = container[0]
            if kind == "box":
                if s == "[end-box]":
                    blocks.append({"t": "box", "cls": container[1], "children": container[2]})
                    container = None
                else:
                    blk = parse_simple(s, container[2])
            elif kind == "table":
                if s == "[end-table]":
                    blocks.append({"t": "table", "rows": container[1]})
                    container = None
                elif s:
                    cells = [c.strip() for c in s.split("|")]
                    header = False
                    if cells and cells[0].startswith("[h] "):
                        header = True
                        cells[0] = cells[0][4:]
                    container[1].append({"cells": cells, "h": header})
            elif kind == "timeline":
                if s == "[end-timeline]":
                    blocks.append({"t": "timeline", "items": container[1]})
                    container = None
                elif s and " | " in s:
                    y, _, x = s.partition(" | ")
                    container[1].append({"y": y.strip(), "x": x.strip()})
            continue
        if s == "[hr]":
            blocks.append({"t": "hr"})
        elif s.startswith("[box:") and s.endswith("]"):
            container = ("box", s[5:-1], [])
        elif s == "[table]":
            container = ("table", [])
        elif s == "[timeline]":
            container = ("timeline", [])
        elif s:
            parse_simple(s, blocks)
    return meta, blocks


def parse_simple(s, blocks):
    """Parse one non-container content line into block(s)."""
    if s.startswith("### "):
        blocks.append({"t": "h4", "x": s[4:].strip()})
    elif s.startswith("## "):
        blocks.append({"t": "h3", "x": s[3:].strip()})
    elif s.startswith("# "):
        blocks.append({"t": "h2", "x": s[2:].strip()})
    elif s.startswith("> "):
        blocks.append({"t": "quote", "x": s[2:].strip()})
    elif s.startswith("- "):
        item = s[2:].strip()
        if blocks and blocks[-1].get("t") == "ul":
            blocks[-1]["items"].append({"x": item})
        else:
            blocks.append({"t": "ul", "items": [{"x": item}]})
    else:
        blocks.append({"t": "p", "x": s})
    return blocks


def chapterize(blocks):
    """Split top-level blocks into chapters at h2 boundaries."""
    chapters = []
    cur = {"title": "", "blocks": []}
    for b in blocks:
        if b["t"] == "h2":
            if cur["blocks"] or cur["title"]:
                chapters.append(cur)
            cur = {"title": b["x"], "blocks": []}
        else:
            cur["blocks"].append(b)
    if cur["blocks"] or cur["title"]:
        chapters.append(cur)
    return chapters


def strip_marks(x):
    return str(x).replace("**", "")


def flat_paragraphs(chapters):
    out = []
    for ch in chapters:
        for b in ch["blocks"]:
            t = b["t"]
            if t in ("p", "quote", "h3", "h4"):
                out.append(strip_marks(b["x"]))
            elif t == "ul":
                out.extend(strip_marks(i["x"]) for i in b["items"])
            elif t == "box":
                out.extend(flat_paragraphs([{"blocks": b["children"]}]))
            elif t == "timeline":
                out.extend(strip_marks(i["x"]) for i in b["items"])
            elif t == "table":
                for row in b["rows"]:
                    out.extend(strip_marks(c) for c in row["cells"])
    return [p for p in out if p]


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    meta_list = json.loads(META_FILE.read_text(encoding="utf-8"))
    by_file = {m["file"]: m for m in meta_list}

    slugs = sorted(p.stem for p in TXT_DIR.glob("*.txt"))
    for slug in slugs:
        page = ROOT / "html" / "rectify" / slug
        page_html = list(ROOT.glob(f"html/rectify/*/{slug}.html"))
        if not page_html:
            print(f"[{slug}] page not found, skipped")
            continue
        rel = page_html[0].relative_to(ROOT).as_posix().replace("html/", "", 1)
        section = page_html[0].parent.name
        category = CATEGORY_BY_SECTION.get(section, "思想辩护")
        meta, blocks = parse_txt(TXT_DIR / f"{slug}.txt")
        chapters = chapterize(blocks)
        doc = {
            "slug": slug,
            "type": "rectify",
            "category": category,
            "file": rel,
            "title": meta["title"],
            "subtitle": meta["subtitle"],
            "metaLine": meta["metaLine"],
            "original": {
                "titleLine": meta["title"],
                "chapters": chapters,
            },
        }
        out = OUT_DIR / f"{slug}.json"
        out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[{slug}] wrote {out.relative_to(ROOT)}  chapters={len(chapters)}")

        # refresh data/rectify.json metadata entry
        entry = by_file.get(rel)
        if entry is None:
            nm = NEW_META.get(slug, {})
            entry = {
                "title": meta["title"] or nm.get("title", slug),
                "file": rel,
                "type": "rectify",
                "category": nm.get("category", category),
                "summary": nm.get("summary", ""),
                "keywords": nm.get("keywords", []),
            }
            meta_list.append(entry)
            print(f"[{slug}] added metadata entry to rectify.json")
        else:
            entry["title"] = meta["title"] or entry["title"]

    META_FILE.write_text(json.dumps(meta_list, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"rectify.json now has {len(meta_list)} entries")


if __name__ == "__main__":
    main()
