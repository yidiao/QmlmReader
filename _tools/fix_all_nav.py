"""
Fix ALL page navigation links based on file depth.
Each HTML file's nav links should correctly point to other pages within html/.
"""
import os

ROOT = r"D:\Claude Pj\Qmlmreader"
HTML_ROOT = os.path.join(ROOT, 'html')

# Pages in html/ and their paths relative to html/
ALL_PAGES = {
    'index': 'index.html',
    'articles': 'articles/articles.html',
    'masters': 'masters/masters.html',
    'toolkit': 'toolkit/toolkit.html',
    'gallery': 'gallery/gallery.html',
    'puzzle': 'puzzle/puzzle.html',
    'international': 'international/international.html',
    'rectify': 'rectify/rectify.html',
    'about': 'about/about.html',
}

def fix_file(filepath):
    rel = os.path.relpath(filepath, HTML_ROOT)
    depth = rel.count(os.sep) + 1  # 1 for html/index.html, 2 for html/gallery/gallery.html, etc.

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    for page_key, page_path in ALL_PAGES.items():
        # Compute correct relative path from this file to the target page
        # Both are inside html/, so we need 'prefix + page_path'
        prefix = '../' * (depth - 1)

        # For files in the same directory: use sibling name
        # For files at different depths: use ../ prefix
        page_dir = os.path.dirname(page_path)
        file_dir = os.path.dirname(rel)

        if file_dir == page_dir:
            # Same directory - use just the filename
            target = os.path.basename(page_path)
        elif file_dir == '':
            # File is at html/ root (depth 1), target is in subdir
            target = page_path
        elif page_dir == '':
            # Target is at html/ root, file is in subdir
            target = prefix + page_path
        else:
            # Both in subdirs
            target = prefix + page_path

        # Now replace ALL existing href variants for this page with the correct path
        # Possible current wrong values:
        # - "page.ext" (bare)
        # - "../page.ext" (one level)
        # - "../../page.ext" (two levels)
        # - "articles/page.ext" (with dir prefix)
        # - "../articles/page.ext" (with dir prefix)

        base = os.path.basename(page_path)
        old_variants = [
            f'"{base}"',
            f'"../{base}"',
            f'"../../{base}"',
            f'"../../../{base}"',
        ]
        # Also try variants with the full path
        old_variants.append(f'"{page_path}"')
        old_variants.append(f'"../{page_path}"')
        old_variants.append(f'"../../{page_path}"')

        new_val = f'"{target}"'

        for old in old_variants:
            if old != new_val:
                content = content.replace(old, new_val)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for dirpath, dirnames, filenames in os.walk(HTML_ROOT):
    for fname in filenames:
        if fname.endswith('.html'):
            try:
                if fix_file(os.path.join(dirpath, fname)):
                    count += 1
            except Exception as e:
                print(f"ERROR: {fname}: {e}")
print(f"Fixed {count} files")
