# -*- coding: utf-8 -*-
"""Extract rectify article bodies from html/rectify/<cat>/<slug>.html into
structured proofreading txt files (data/rectify-txt/<slug>.txt).

Usage:
  python extract_rectify_body.py                 # extract all 10 pages (raw punctuation as-is)
  python extract_rectify_body.py --align         # additionally transplant punctuation from
                                                 # the 7 existing data/rectify-*.txt dumps

Txt block format (round-tripped by build_rectify_json.py):
    [meta] title:/subtitle:/metaLine: lines, then [content]
    # h2 / ## h3 / ### h4
    plain line            -> paragraph (**bold** markers restored from <strong>)
    - text                -> list item
    > text                -> blockquote
    [box:cls] ... [end-box]
    [table] ([h] a | b)   -> data table rows
    [timeline] year | text
    [hr]
"""
import re
import sys
import difflib
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RECTIFY_DIR = ROOT / "html" / "rectify"
OUT_DIR = ROOT / "data" / "rectify-txt"
DUMP_DIR = ROOT / "data"

BOX_CLASSES = {"highlight-box", "toc-box", "data-box", "abstract-box", "quote-box"}
SKIP_CLASSES = {"article-footer"}
# articles with no reference dump that were proofread entirely by hand; re-running
# the extractor would clobber them, so they are skipped
MANUAL_PROOFREAD = {"pol-pot", "power-illusion", "young-october"}

NORM_RE = re.compile(r"[^\w]+", re.UNICODE)
OPENING_PUNCT = set("\u201c\u2018\u300a\u3008\u3010\u3016\u300c\u300e（《【〔『「")
# characters that may open a quoted span; trailing punctuation NOT in this set at a
# unit boundary belongs to the previous unit. Straight quotes are resolved to curly
# by the global pairing state machine before this set is consulted.


def norm_of(text):
    return NORM_RE.sub("", text)


def build_norm_map(raw):
    """Return (norm_string, raw_index_list). norm_string[k] == raw[raw_index_list[k]]."""
    norm_chars = []
    idxs = []
    for i, ch in enumerate(raw):
        if NORM_RE.sub("", ch):
            norm_chars.append(ch)
            idxs.append(i)
    return "".join(norm_chars), idxs


def collapse_ws(s):
    return re.sub(r"\s+", " ", s)


# ---------------------------------------------------------------- HTML parser

class Element:
    __slots__ = ("tag", "cls", "content", "children")

    def __init__(self, tag, cls):
        self.tag = tag
        self.cls = cls or ""
        self.content = []      # ("text", str, bold) | ("el", Element) in document order
        self.children = []


class ArticleParser(HTMLParser):
    """Walk <article class="article-content"> and build an element tree.
    Skips .article-footer / a.back-link subtrees (page chrome kept in HTML shell)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Element("#root", "")
        self.stack = [self.root]
        self.article_depth = None   # stack depth at which article-content sits
        self.skip_depth = None      # stack depth of a skipped subtree

    @property
    def in_article(self):
        return self.article_depth is not None and len(self.stack) > self.article_depth

    def cur(self):
        return self.stack[-1]

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        cls = (attrs.get("class") or "").strip()
        depth = len(self.stack)
        if self.article_depth is None:
            if tag == "article" and "article-content" in cls.split():
                node = Element(tag, cls)
                self.cur().content.append(("el", node))
                self.cur().children.append(node)
                self.stack.append(node)
                self.article_depth = depth
            return
        if self.skip_depth is not None:
            node = Element(tag, cls)
            self.cur().content.append(("el", node))
            self.stack.append(node)
            return
        if tag in ("br",):
            self.cur().content.append(("text", " ", False))
            return
        if tag == "hr":
            self.cur().content.append(("el", Element("hr", "")))
            return
        node = Element(tag, cls)
        self.cur().content.append(("el", node))
        self.cur().children.append(node)
        self.stack.append(node)
        if cls in SKIP_CLASSES or (tag == "a" and "back-link" in cls.split()) \
                or tag in ("script", "style"):
            self.skip_depth = depth

    def handle_startendtag(self, tag, attrs):
        if tag == "hr" and self.in_article and self.skip_depth is None:
            self.cur().content.append(("el", Element("hr", "")))

    def handle_endtag(self, tag):
        if self.article_depth is None:
            return
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                if self.skip_depth is not None and i <= self.skip_depth:
                    self.skip_depth = None
                del self.stack[i:]
                if tag == "article" and i == self.article_depth:
                    self.article_depth = None
                return

    def handle_data(self, data):
        if self.article_depth is None or self.skip_depth is not None or not data.strip():
            return
        bold = any(e.tag in ("strong", "b") for e in self.stack)
        self.cur().content.append(("text", collapse_ws(data), bold))


# ------------------------------------------------------- inline collection

def collect_runs(el, inherited_bold=False):
    """Flatten an element's content tree into [(text, bold)] in document order."""
    runs = []
    bold = inherited_bold or el.tag in ("strong", "b")
    for item in el.content:
        if item[0] == "text":
            runs.append((item[1], item[2] or bold))
        elif item[1].tag not in ("hr",):
            runs.extend(collect_runs(item[1], bold))
    return runs


def strip_inline(el):
    """Element inline content -> (text, bold_norm_spans)."""
    parts = []
    spans = []
    pos = 0
    for text, bold in collect_runs(el):
        n = len(norm_of(text))
        if bold and n:
            spans.append([pos, pos + n])
        parts.append(text)
        pos += n
    merged = []
    for s, e in spans:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return "".join(parts), [tuple(s) for s in merged]


# ------------------------------------------------------- tree -> block model

def convert_block(el):
    """Element -> block dict (recursive). Returns None / list for containers."""
    tag, cls = el.tag, el.cls
    if tag in ("h2", "h3", "h4"):
        raw, _ = strip_inline(el)
        raw = collapse_ws(raw).strip()
        return {"t": tag, "x": raw} if raw else None
    if tag == "p":
        raw, bold = strip_inline(el)
        raw = raw.strip()
        return {"t": "p", "x": raw, "bold": bold} if raw else None
    if tag == "blockquote":
        raw, bold = strip_inline(el)
        raw = collapse_ws(raw).strip()
        return {"t": "quote", "x": raw, "bold": bold} if raw else None
    if tag in ("ul", "ol"):
        items = []
        for li in el.children:
            if li.tag != "li":
                continue
            raw, bold = strip_inline(li)
            raw = collapse_ws(raw).strip()
            if raw:
                items.append({"x": raw, "bold": bold})
        return {"t": "ul", "items": items} if items else None
    if tag == "table":
        rows = []
        for tr in el.children:
            if tr.tag != "tr":
                continue
            header = False
            cells = []
            for cell in tr.children:
                if cell.tag not in ("th", "td"):
                    continue
                header = header or cell.tag == "th"
                cells.append(collapse_ws(strip_inline(cell)[0]).strip())
            if any(cells):
                rows.append({"cells": cells, "h": header})
        return {"t": "table", "rows": rows} if rows else None
    if tag == "div" and cls == "timeline":
        items = []
        for item in el.children:
            if "timeline-item" not in item.cls.split():
                continue
            year = ""
            text = ""
            for sub in item.children:
                if "timeline-year" in sub.cls.split():
                    year = collapse_ws(strip_inline(sub)[0]).strip()
                elif sub.tag == "p":
                    text = collapse_ws(strip_inline(sub)[0]).strip()
            if year or text:
                items.append({"y": year, "x": text})
        return {"t": "timeline", "items": items} if items else None
    if tag == "div" and cls in BOX_CLASSES:
        children = []
        for child in el.children:
            b = convert_block(child)
            if not b:
                continue
            children.extend(b if isinstance(b, list) else [b])
        if children:
            return {"t": "box", "cls": cls, "children": children}
        return None
    if tag == "hr":
        return {"t": "hr"}
    # transparent container (un-classed div etc.): lift children
    out = []
    for child in el.children:
        b = convert_block(child)
        if not b:
            continue
        out.extend(b if isinstance(b, list) else [b])
    return out if out else None


def tree_to_blocks(root):
    blocks = []
    for child in root.children:
        b = convert_block(child)
        if not b:
            continue
        blocks.extend(b if isinstance(b, list) else [b])
    return blocks


# ------------------------------------------------------- text units + transplant

def iter_units(blocks):
    """Yield (container, key) pairs carrying primary text, in document order."""
    for b in blocks:
        if b["t"] in ("p", "quote", "h2", "h3", "h4"):
            yield b, "x"
        elif b["t"] == "ul":
            for item in b["items"]:
                yield item, "x"
        elif b["t"] == "table":
            for row in b["rows"]:
                for i in range(len(row["cells"])):
                    yield row, ("cells", i)
        elif b["t"] == "timeline":
            for item in b["items"]:
                yield item, "x"
        elif b["t"] == "box":
            for sub in iter_units(b["children"]):
                yield sub


def get_unit_text(unit, key):
    if isinstance(key, tuple):
        return unit[key[0]][key[1]]
    return unit[key]


def set_unit_text(unit, key, value):
    if isinstance(key, tuple):
        unit[key[0]][key[1]] = value
    else:
        unit[key] = value


CLOSING_ONLY = set("。，、；：！？…—,.:;!?\"'\u201d\u300b\u3009\u3011\u3017\u300d\u300f)]}>》〉】〕』」%")
# punctuation that may terminate a sentence/paragraph — only leads starting with
# one of these are salvaged from rejected dump gaps (a leading ，or 、 belongs to
# the dump-only junk sentence, not to the article's previous unit)
TERMINAL_LEAD = set("。！？…”\u201d\u2019」』）】%>；.!?;")
GAP_JUNK_RE = re.compile(r"[\*\u2022\u25cf\u25aa\u2023\u258e\u258c\u25a0\u25bc]+")


def transplant(blocks, dump_raw, label, report):
    """Rewrite unit texts using punctuation from dump_raw. Returns match ratio.

    Straight quotes in dump/article text are resolved to curly “”‘’ by a global
    alternation state (quotes are counted in document order across the whole
    article), so unit-boundary splits can tell an opening quote (stays with the
    next unit) from a closing one (joins the previous unit)."""
    units = list(iter_units(blocks))
    if not units:
        report.append(f"[{label}] no text units")
        return 1.0
    qstate = {"d": True, "s": True}   # True = next straight " / ' opens a span

    def dir_convert(gap):
        out = []
        for ch in gap:
            if ch == '"':
                out.append("\u201c" if qstate["d"] else "\u201d")
                qstate["d"] = not qstate["d"]
            elif ch == "'":
                out.append("\u2018" if qstate["s"] else "\u2019")
                qstate["s"] = not qstate["s"]
            else:
                out.append(ch)
        return "".join(out)

    meta = []
    for unit, key in units:
        raw = get_unit_text(unit, key)
        n, idxs = build_norm_map(raw)
        meta.append({"unit": unit, "key": key, "raw": raw, "norm": n, "idxs": idxs})
    a_norm = "".join(m["norm"] for m in meta)
    d_norm, d_idxs = build_norm_map(dump_raw)
    if not a_norm or not d_norm:
        report.append(f"[{label}] empty norm text, skipped")
        return 0.0

    sm = difflib.SequenceMatcher(None, a_norm, d_norm, autojunk=False)
    matched = [False] * len(a_norm)
    b_of = [-1] * len(a_norm)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                matched[i1 + k] = True
                b_of[i1 + k] = j1 + k
        elif tag == "replace":
            sub = difflib.SequenceMatcher(None, a_norm[i1:i2], d_norm[j1:j2], autojunk=False)
            for t2, p1, p2, q1, q2 in sub.get_opcodes():
                if t2 == "equal":
                    for k in range(p2 - p1):
                        matched[i1 + p1 + k] = True
                        b_of[i1 + p1 + k] = j1 + q1 + k

    unit_offsets = []
    off = 0
    for m in meta:
        unit_offsets.append(off)
        off += len(m["norm"])
    unit_matched = [sum(matched[unit_offsets[i]: unit_offsets[i] + len(meta[i]["norm"])])
                    for i in range(len(meta))]

    def tail_target(ui):
        """Nearest unit at or before ui that contains matched chars."""
        t = ui
        while t >= 0 and unit_matched[t] == 0:
            t -= 1
        return t

    # per-unit (gap, char) pairs; dump punctuation for matched chars, else article's own
    pieces = []          # per unit: list of [gap, char]
    tails = [""] * len(meta)
    d_prev = -1
    rejected = 0
    for ui, m in enumerate(meta):
        raw, n, idxs = m["raw"], m["norm"], m["idxs"]
        isolated = isinstance(m["key"], tuple) or m["unit"].get("_isolated")
        if isolated:
            saved_state = dict(qstate)
            qstate["d"] = qstate["s"] = True
        plist = []
        for k in range(len(n)):
            gi = sum(len(x["norm"]) for x in meta[:ui]) + k
            if gi == 0:
                gap = ""     # drop any leading junk before the article's first char
                if matched[0]:
                    d_prev = d_idxs[b_of[0]]
            elif matched[gi]:
                jb = d_idxs[b_of[gi]]
                gap = dump_raw[d_prev + 1:jb] if d_prev >= 0 else dump_raw[:jb]
                d_prev = jb
                if norm_of(gap):
                    # dump gap contains real text (dump-only junk / dropped lines):
                    # salvage its leading punctuation run — at a unit boundary it
                    # closes the previous unit, inside a unit it stays with this char
                    rejected += 1
                    lead = ""
                    for ch in gap:
                        if ch in OPENING_PUNCT or norm_of(ch):
                            break
                        lead += ch
                    lead = re.sub(r"\s+", "", GAP_JUNK_RE.sub("", dir_convert(lead)))
                    if k == 0:
                        if lead and lead[0] in TERMINAL_LEAD and tail_target(ui - 1) >= 0:
                            tails[tail_target(ui - 1)] += lead
                        # the previous unit's own trailing punctuation (e.g. a ？ the
                        # article has but the dump lacks) is only reachable here
                        if ui > 0 and meta[ui - 1]["idxs"]:
                            pm = meta[ui - 1]
                            trail = re.sub(r"\s+", "", GAP_JUNK_RE.sub(
                                "", dir_convert(pm["raw"][pm["idxs"][-1] + 1:])))
                            if trail and tail_target(ui - 1) >= 0:
                                tails[tail_target(ui - 1)] += trail
                        prev_raw = idxs[k - 1] if k else -1
                        gap = raw[prev_raw + 1: idxs[k]]
                    else:
                        gap = lead + raw[idxs[k - 1] + 1: idxs[k]]
            else:
                prev_raw = idxs[k - 1] if k else -1
                gap = raw[prev_raw + 1: idxs[k]]
            gap = re.sub(r"\s+", "", GAP_JUNK_RE.sub("", dir_convert(gap)))
            plist.append([gap, n[k]])
        if isolated:
            qstate.update(saved_state)   # cells/timeline never poison global pairing
        pieces.append(plist)

    # unit-boundary fix: a gap before the first char of unit N splits at the first
    # opening punctuation — everything before it closes the nearest matched unit
    for ui in range(1, len(pieces)):
        first = pieces[ui]
        if not first:
            continue
        gap = first[0][0]
        cut = len(gap)
        for i, ch in enumerate(gap):
            if ch in OPENING_PUNCT:
                cut = i
                break
        if cut > 0:
            tgt = tail_target(ui - 1)
            if tgt >= 0:
                tails[tgt] += gap[:cut]
                first[0][0] = gap[cut:]

    matched_count = sum(1 for m in matched if m)
    ratio = matched_count / len(a_norm)

    # assemble per-unit text + restore **bold** spans
    unmatched_units = []
    for ui, m in enumerate(meta):
        plist = pieces[ui]
        buf = []
        positions = []
        local = 0
        for gap, ch in plist:
            positions.append(local + len(gap))
            buf.append(gap)
            buf.append(ch)
            local += len(gap) + 1
        text = "".join(buf) + tails[ui]
        bold = m["unit"].get("bold") or []
        if bold and positions:
            marks = {}
            for s, e in bold:
                # s inclusive, e exclusive: close right after the last bold char
                if s < len(positions):
                    marks.setdefault(positions[s], []).append("**")
                if 0 < e <= len(positions):
                    marks.setdefault(positions[e - 1] + 1, []).append("**")
            out = []
            for i, ch in enumerate(text):
                if i in marks:
                    out.append("".join(marks[i]))
                out.append(ch)
            if len(text) in marks:
                out.append("".join(marks[len(text)]))
            text = "".join(out)
        text = text.strip()
        set_unit_text(m["unit"], m["key"], text)
        m["unit"].pop("bold", None)
        if m["norm"]:
            base = sum(len(x["norm"]) for x in meta[:ui])
            miss = sum(1 for k in range(len(m["norm"])) if not matched[base + k])
            if miss / len(m["norm"]) > 0.05:
                unmatched_units.append((miss, text[:60]))

    report.append(f"[{label}] matched {matched_count}/{len(a_norm)} chars ({ratio:.1%}), "
                  f"gap-rejects {rejected}, units >5% unmatched: {len(unmatched_units)}")
    for miss, snip in unmatched_units[:12]:
        report.append(f"    {miss} unmatched: {snip}")
    return ratio


# ------------------------------------------------------- serialization

def render_block(b, lines):
    t = b["t"]
    if t in ("h2", "h3", "h4"):
        level = {"h2": "#", "h3": "##", "h4": "###"}[t]
        lines.append(f"{level} {b['x']}")
    elif t == "p":
        lines.append(b["x"])
    elif t == "quote":
        lines.append(f"> {b['x']}")
    elif t == "ul":
        for item in b["items"]:
            lines.append(f"- {item['x']}")
    elif t == "box":
        lines.append(f"[box:{b['cls']}]")
        for c in b["children"]:
            render_block(c, lines)
        lines.append("[end-box]")
    elif t == "table":
        lines.append("[table]")
        for row in b["rows"]:
            prefix = "[h] " if row["h"] else ""
            lines.append(prefix + " | ".join(row["cells"]))
        lines.append("[end-table]")
    elif t == "timeline":
        lines.append("[timeline]")
        for item in b["items"]:
            lines.append(f"{item['y']} | {item['x']}")
        lines.append("[end-timeline]")
    elif t == "hr":
        lines.append("[hr]")
    lines.append("")


def fix_quotes_simple(s):
    """Alternation-based curly-quote conversion for short balanced lines (meta)."""
    def conv(text, straight, lq, rq):
        out = []
        opening = True
        for ch in text:
            if ch == straight:
                out.append(lq if opening else rq)
                opening = not opening
            else:
                out.append(ch)
        return "".join(out)
    return conv(conv(s, '"', "\u201c", "\u201d"), "'", "\u2018", "\u2019")


def serialize(meta, blocks):
    lines = ["[meta]"]
    lines.append(f"title: {fix_quotes_simple(meta['title'])}")
    lines.append(f"subtitle: {fix_quotes_simple(meta['subtitle'])}")
    lines.append(f"metaLine: {fix_quotes_simple(meta['metaLine'])}")
    lines.append("")
    lines.append("[content]")
    lines.append("")
    for b in blocks:
        render_block(b, lines)
    return "\n".join(lines).rstrip() + "\n"


# ------------------------------------------------------- dump cleaning

def clean_dump(raw, title):
    lines = raw.replace("\ufeff", "").splitlines()
    kept = []
    for ln in lines:
        s = ln.strip()
        if not s or set(s) <= set("=—-·|• "):
            continue
        if "青年马列毛主义驿站" in s:
            continue
        if len(norm_of(s)) < 5:
            continue
        if s == title:
            continue
        kept.append(s)
    return "\n".join(kept)


# ------------------------------------------------------- main

def parse_page(page):
    html = page.read_text(encoding="utf-8")
    parser = ArticleParser()
    parser.feed(html)
    blocks = tree_to_blocks(parser.root)
    meta = {"title": "", "subtitle": "", "metaLine": ""}
    m = re.search(r'<div class="article-header">(.*?)</article>', html, re.S)
    scope = m.group(1) if m else html
    t = re.search(r"<h1>(.*?)</h1>", scope, re.S)
    s = re.search(r'<div class="subtitle">(.*?)</div>', scope, re.S)
    ml = re.search(r'<div class="article-meta">(.*?)</div>', scope, re.S)
    strip = lambda s: collapse_ws(re.sub(r"<[^>]+>", "", s or "")).strip()
    meta["title"] = strip(t.group(1) if t else "")
    meta["subtitle"] = strip(s.group(1) if s else "")
    meta["metaLine"] = strip(ml.group(1) if ml else "")
    return meta, blocks


def apply_fixes(slug, txt, report):
    """Apply manual proofreading fixes from rectify_proofread_fixes.FIXES."""
    import rectify_proofread_fixes
    for old, new in rectify_proofread_fixes.FIXES.get(slug, []):
        n = txt.count(old)
        if n != 1:
            report.append(f"[{slug}] FIX MISS (count={n}): {old[:40]}")
            continue
        txt = txt.replace(old, new)
    return txt


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    align = "--align" in sys.argv
    do_fixes = "--apply-fixes" in sys.argv
    if do_fixes:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report = []
    for page in sorted(RECTIFY_DIR.glob("*/*.html")):
        slug = page.stem
        if slug in MANUAL_PROOFREAD and not "--force" in sys.argv:
            report.append(f"[{slug}] manually proofread, skipped (use --force to overwrite)")
            continue
        meta, blocks = parse_page(page)
        if not blocks:
            report.append(f"[{slug}] NO CONTENT FOUND")
            continue
        if align:
            dump = DUMP_DIR / f"rectify-{slug}.txt"
            if dump.exists():
                dump_raw = clean_dump(dump.read_text(encoding="utf-8"), meta["title"])
                transplant(blocks, dump_raw, slug, report)
            else:
                report.append(f"[{slug}] no dump, left as extracted")
        txt = serialize(meta, blocks)
        if do_fixes:
            txt = apply_fixes(slug, txt, report)
        out = OUT_DIR / f"{slug}.txt"
        out.write_text(txt, encoding="utf-8")
        report.append(f"[{slug}] wrote {out.relative_to(ROOT)}  ({len(blocks)} top blocks)")
    print("\n".join(report))


if __name__ == "__main__":
    main()
