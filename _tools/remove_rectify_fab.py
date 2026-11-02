# -*- coding: utf-8 -*-
"""Remove the dead "下载 PDF" floating button from the 10 rectify pages.

The button/menu/inline-script chunk links to downloads/rectify/<slug>.pdf,
a directory that does not exist (0 PDFs). Each page carries:
    [optional empty <script></script>]
    <button class="download-fab" id="downloadFab" ...></button>
    <div class="download-menu" id="downloadMenu"> ... </div>
    <script> (function(){ ... downloadFab ... })(); </script>
The .download-fab CSS in css/articles-detail.css is shared with classic article
pages and is NOT touched.

Run:  python remove_rectify_fab.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = sorted((ROOT / "html" / "rectify").glob("*/*.html"))


def remove_chunk(html, report, slug):
    anchor = html.find('id="downloadFab"')
    if anchor < 0:
        report.append(f"[{slug}] already clean")
        return html
    start = html.rfind("<button", 0, anchor)
    if start < 0:
        raise ValueError(f"[{slug}] <button before downloadFab not found")
    # include a directly-preceding empty <script></script> remnant
    m_empty = re.search(r"<script>\s*</script>\s*$", html[:start])
    if m_empty:
        start = m_empty.start()
    # chunk ends at the inline script's closing tag after the menu
    end_marker = html.find("})();", anchor)
    if end_marker < 0:
        raise ValueError(f"[{slug}] FAB IIFE tail not found")
    end = html.find("</script>", end_marker)
    if end < 0:
        raise ValueError(f"[{slug}] FAB script closing </script> not found")
    end += len("</script>")
    # swallow following blank line(s) so no triple newlines remain
    tail = html[end:]
    stripped = tail.lstrip("\r\n")
    removed_blank = len(tail) - len(stripped)
    return html[:start].rstrip("\r\n ") + "\n\n" + stripped if removed_blank else html[:start] + stripped


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    for page in PAGES:
        slug = page.stem
        html = page.read_text(encoding="utf-8")
        if 'id="downloadFab"' not in html:
            print(f"[{slug}] already clean")
            continue
        try:
            new = remove_chunk(html, [], slug)
        except ValueError as e:
            print(str(e))
            continue
        residue = sum(new.count(x) for x in ("downloadFab", "downloadMenu", 'class="dl-link"', "download-fab"))
        if residue:
            print(f"[{slug}] ABORTED: {residue} FAB residues left, file NOT written")
            continue
        page.write_text(new, encoding="utf-8")
        saved = len(html) - len(new)
        print(f"[{slug}] removed FAB chunk ({saved} bytes), residue check clean")


if __name__ == "__main__":
    main()
