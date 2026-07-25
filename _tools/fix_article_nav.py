"""
Fix nav links in author-sorted articles (depth 3: html/articles/Author/file.html).
Nav links need ../../ prefix to reach other html/ pages.
"""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"
ARTICLES_DIR = os.path.join(ROOT, 'html', 'articles')

AUTHORS = ['Mao', 'Marx', 'Engels', 'Lenin', 'Stalin']

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Fix nav links: ../pagename → ../../pagename
    # But NOT CSS/JS/data paths (those are already ../../../)
    page_links = [
        ('../index.html', '../../index.html'),
        ('../articles.html', '../../articles/articles.html'),
        ('../masters/masters.html', '../../masters/masters.html'),
        ('../masters/marx.html', '../../masters/marx/marx.html'),
        ('../masters/engels.html', '../../masters/engels/engels.html'),
        ('../masters/lenin.html', '../../masters/lenin/lenin.html'),
        ('../masters/stalin.html', '../../masters/stalin/stalin.html'),
        ('../masters/mao.html', '../../masters/mao/mao.html'),
        ('../toolkit/toolkit.html', '../../toolkit/toolkit.html'),
        ('../gallery/gallery.html', '../../gallery/gallery.html'),
        ('../puzzle/puzzle.html', '../../puzzle/puzzle.html'),
        ('../international/international.html', '../../international/international.html'),
        ('../rectify/rectify.html', '../../rectify/rectify.html'),
        ('../about/about.html', '../../about/about.html'),
    ]

    for old, new in page_links:
        content = content.replace(f'href="{old}"', f'href="{new}"')
        content = content.replace(f"href='{old}'", f"href='{new}'")
        # Also fix onclick location.href
        content = content.replace(f"location.href='{old}'", f"location.href='{new}'")
        content = content.replace(f'location.href="{old}"', f'location.href="{new}"')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for author in AUTHORS:
    author_dir = os.path.join(ARTICLES_DIR, author)
    if not os.path.isdir(author_dir):
        continue
    for fname in os.listdir(author_dir):
        if fname.endswith('.html'):
            if fix_file(os.path.join(author_dir, fname)):
                count += 1

# Also fix nav links in remaining depth-3 files:
# masters sub-pages (html/masters/marx/marx.html etc.)
# gallery/propaganda/ files
# international/international-column/ files
print(f"Fixed {count} article nav links")

# Check masters/*/ files
for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, 'html', 'masters')):
    for fname in filenames:
        if fname.endswith('.html'):
            fp = os.path.join(dirpath, fname)
            rel = os.path.relpath(fp, os.path.join(ROOT, 'html'))
            depth = rel.count(os.sep) + 1  # depth via html/
            if depth >= 3:
                if fix_file(fp):
                    count += 1

# Check gallery/propaganda files
for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, 'html', 'gallery', 'propaganda')):
    for fname in filenames:
        if fname.endswith('.html'):
            fp = os.path.join(dirpath, fname)
            if fix_file(fp):
                count += 1

# Check international/international-column files
icc_dir = os.path.join(ROOT, 'html', 'international', 'international-column')
if os.path.isdir(icc_dir):
    for fname in os.listdir(icc_dir):
        if fname.endswith('.html'):
            if fix_file(os.path.join(icc_dir, fname)):
                count += 1

print(f"Total fixed: {count}")
