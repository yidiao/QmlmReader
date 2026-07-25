"""
Fix article cross-references to use correct relative paths based on calling page depth.
Article paths like 'articles/Author/slug.html' need ../ prefix from depth 2+ pages.
"""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"
HTML_ROOT = os.path.join(ROOT, 'html')

AUTHORS = ['Mao', 'Marx', 'Engels', 'Lenin', 'Stalin']

def fix_file(filepath):
    rel = os.path.relpath(filepath, HTML_ROOT)
    depth = rel.count(os.sep) + 1  # depth relative to html/

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # For depth 1: no prefix needed (articles/Mao/... is correct sibling path)
    if depth == 1:
        return False

    # For depth 2+: add ../ prefix to article paths
    prefix = '../' * (depth - 1)

    # Replace bare articles/Author/slug.html → prefix + articles/Author/slug.html
    # But only when it's in a href/src attribute (not in text like "实践论")
    for author in AUTHORS:
        old = f'"articles/{author}/'
        new = f'"{prefix}articles/{author}/'
        content = content.replace(old, new)

        old2 = f"'articles/{author}/"
        new2 = f"'{prefix}articles/{author}/"
        content = content.replace(old2, new2)

    # Don't double-fix if already has prefix
    for author in AUTHORS:
        double = f'{prefix}{prefix}articles/{author}/'
        single = f'{prefix}articles/{author}/'
        content = content.replace(double, single)

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
