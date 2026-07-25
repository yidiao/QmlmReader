"""
Move articles into author sub-folders and update all references.
"""
import os, re, shutil

ROOT = r"D:\Claude Pj\Qmlmreader"
HTML_ROOT = os.path.join(ROOT, 'html')
ARTICLES_DIR = os.path.join(HTML_ROOT, 'articles')

# Article slug → author folder mapping
ARTICLE_MAP = {
    # Mao (12)
    'lun-chi-jiu-zhan': 'Mao',
    'shi-jian-lun': 'Mao',
    'mao-dun-lun': 'Mao',
    'zhan-lue-wen-ti': 'Mao',
    'you-ji-zhan': 'Mao',
    'zhan-zheng-zhan-lue': 'Mao',
    'xin-min-zhu': 'Mao',
    'wen-yi-zuo-tan': 'Mao',
    'xue-xi-shi-ju': 'Mao',
    'ren-min-nei-bu-mao-dun': 'Mao',
    'nong-min-yun-dong': 'Mao',
    'lun-shi-da-guan-xi': 'Mao',
    # Marx (7)
    'gongchan-dan-yuan': 'Marx',
    'de-yi-zhi-yi-xing-tai': 'Marx',
    'guan-yu-fei-er-ba-ha-de-ti-gang': 'Marx',
    '1844-nian-jing-ji-xue-zhe-xue-shou-gao': 'Marx',
    'ge-da-gang-ling': 'Marx',
    'hei-ge-er-fa-zhe-xue-pi-pan-dao-yan': 'Marx',
    # Engels (2)
    'fan-du-lin-lun': 'Engels',
    'jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan': 'Engels',
    # Lenin (6)
    'zen-me-ban': 'Lenin',
    'wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi': 'Lenin',
    'guo-jia-yu-ge-ming': 'Lenin',
    'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan': 'Lenin',
    'lun-wo-guo-ge-ming': 'Lenin',
    'ma-ke-si-zhu-yi-de-san-ge-lai-yuan': 'Lenin',
    # Stalin (2)
    'lun-lunen-zhu-yi-ji-chu': 'Stalin',
    'lun-zhongguo-ge-ming-de-qiantu': 'Stalin',
}

def slugify(filename):
    return os.path.splitext(filename)[0]

# Step 1: Move files
print("=== Moving articles ===")
moved = {}
for fname in os.listdir(ARTICLES_DIR):
    if not fname.endswith('.html'):
        continue
    slug = slugify(fname)
    if slug.startswith('_') or slug == 'articles':
        continue  # skip template and listing page
    if slug in ARTICLE_MAP:
        author = ARTICLE_MAP[slug]
        src = os.path.join(ARTICLES_DIR, fname)
        dst_dir = os.path.join(ARTICLES_DIR, author)
        os.makedirs(dst_dir, exist_ok=True)
        dst = os.path.join(dst_dir, fname)
        if os.path.exists(src):
            shutil.move(src, dst)
            moved[slug] = author
            print(f"  {fname} → {author}/")
    else:
        print(f"  SKIP (no mapping): {fname}")

print(f"\nMoved {len(moved)} articles")

# Step 2: Fix paths in moved articles (depth 2→3, need one more ../)
print("\n=== Fixing paths in moved articles ===")
ASSET_PATTERN = re.compile(
    r'''(href|src|action)\s*=\s*"((?:\.\./)*)(css|js|data|images|assets|downloads)/''',
    re.IGNORECASE
)

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Article is now at html/articles/Author/file.html → depth 3 relative to html
    # Need ../../../ to reach root
    def repl(m):
        return f'{m.group(1)}="../../../{m.group(3)}/'
    content = ASSET_PATTERN.sub(repl, content)

    # Single quotes
    content = re.sub(
        r'''(href|src|action)\s*=\s*'(?:\.\./)*(css|js|data|images|assets|downloads)/''',
        lambda m: f"{m.group(1)}='../../../{m.group(2)}/",
        content
    )
    # fetch
    content = re.sub(
        r"""fetch\s*\(\s*'(?:\.\./)*(data|downloads)/""",
        r"fetch('../../../\1/",
        content
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

for slug, author in moved.items():
    fpath = os.path.join(ARTICLES_DIR, author, slug + '.html')
    if os.path.exists(fpath):
        fix_file(fpath)

# Step 3: Update search.js article paths
print("\n=== Updating search.js ===")
search_path = os.path.join(ROOT, 'js', 'search.js')
with open(search_path, 'r', encoding='utf-8') as f:
    content = f.read()

for slug, author in moved.items():
    old = f"file: 'articles/{slug}.html'"
    new = f"file: 'articles/{author}/{slug}.html'"
    content = content.replace(old, new)

with open(search_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("  search.js updated")

# Step 4: Update main.js COLLECTIONS
print("\n=== Updating main.js ===")
main_path = os.path.join(ROOT, 'js', 'main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    content = f.read()

# In main.js, article links are built as '../articles/' + slug + '.html'
# Need to update to '../articles/Author/' + slug + '.html'
# The COLLECTIONS data uses 'slug' field that maps to filename
# The link construction is: a.slug ? '../articles/' + a.slug + '.html' : '#'
# We need to change this to include the author folder

# Since main.js constructs paths dynamically, we need to update the slug values
# or the path construction logic. Let's update slugs to include author prefix.
for slug, author in moved.items():
    old_slug = f'"slug":"{slug}"'
    new_slug = f'"slug":"{author}/{slug}"'
    content = content.replace(old_slug, new_slug)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("  main.js updated")

# Step 5: Update articles.html listing page
print("\n=== Updating articles.html ===")
articles_list = os.path.join(ARTICLES_DIR, 'articles.html')
if os.path.exists(articles_list):
    with open(articles_list, 'r', encoding='utf-8') as f:
        content = f.read()

    # Article links in articles.html like href="lun-chi-jiu-zhan.html"
    # Should become href="Mao/lun-chi-jiu-zhan.html"
    for slug, author in moved.items():
        old = f'href="{slug}.html"'
        new = f'href="{author}/{slug}.html"'
        content = content.replace(old, new)
        old2 = f"href='{slug}.html'"
        new2 = f"href='{author}/{slug}.html'"
        content = content.replace(old2, new2)

    with open(articles_list, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  articles.html updated")

# Step 6: Update _template.html nav/back links (now at depth 3)
print("\n=== Updating _template.html ===")
template_path = os.path.join(ARTICLES_DIR, '_template.html')
if os.path.exists(template_path):
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Template is at html/articles/_template.html (depth 2)
    # Its nav links reference pages relative to html/
    # Update back-link
    content = content.replace('href="../articles.html"', 'href="articles.html"')

    with open(template_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  _template.html updated")

# Step 7: Update puzzle.html node links
print("\n=== Updating puzzle.html ===")
puzzle_path = os.path.join(HTML_ROOT, 'puzzle', 'puzzle.html')
if os.path.exists(puzzle_path):
    with open(puzzle_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for slug, author in moved.items():
        old = f'"articles/{slug}.html"'
        new = f'"articles/{author}/{slug}.html"'
        content = content.replace(old, new)
        old2 = f"'articles/{slug}.html'"
        new2 = f"'articles/{author}/{slug}.html'"
        content = content.replace(old2, new2)

    with open(puzzle_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("  puzzle.html updated")

# Step 8: Update other HTML files that link to articles
print("\n=== Updating cross-references in all HTML files ===")
for dirpath, dirnames, filenames in os.walk(HTML_ROOT):
    for fname in filenames:
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(dirpath, fname)
        # Skip already-handled files
        if fpath == articles_list or fpath == template_path or fpath == puzzle_path:
            continue

        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content

        # Replace article links: from "articles/slug.html" to "articles/Author/slug.html"
        # But only in href/src attributes
        for slug, author in moved.items():
            old = f'"articles/{slug}.html"'
            new = f'"articles/{author}/{slug}.html"'
            content = content.replace(old, new)
            old2 = f"'articles/{slug}.html'"
            new2 = f"'articles/{author}/{slug}.html'"
            content = content.replace(old2, new2)

        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)

print("\nDone!")
