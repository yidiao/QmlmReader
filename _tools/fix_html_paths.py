"""
Fix ALL resource paths based on file depth.
Depth is relative to html/ folder.
Root resources (css,js,data,images,assets,downloads) need depth-level ../ prefix.
"""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"
HTML_ROOT = os.path.join(ROOT, 'html')

RESOURCE_DIRS = r'(css|js|data|images|assets|downloads)'

def fix_file(filepath):
    rel = os.path.relpath(filepath, HTML_ROOT)
    depth = rel.count(os.sep)  # 0 for html/index.html, 1 for html/articles/x.html, 2 for html/masters/marx/x.html
    if depth == 0 and not rel.startswith('index'):
        # File at html/ root (like index.html), depth 1 from html perspective
        # Actually rel="index.html" → count(os.sep)=0, but from index.html to reach root → ../ needed
        depth = 1 if rel == 'index.html' else 0
    elif depth == 0:
        depth = 1  # File directly in html/

    # Actually depth = number of os.sep in path from html/
    # html/index.html → rel='index.html' → depth=0 → need prefix='../'
    # html/articles/x.html → rel='articles/x.html' → depth=1 → need prefix='../../'
    # html/masters/marx/x.html → rel='masters/marx/x.html' → depth=2 → need prefix='../../../'
    depth = rel.count(os.sep) + 1
    prefix = '../' * depth

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Replace ALL resource references with correct prefix
    # Pattern: match href/src="[any ../ prefix]RESOURCE_DIR/
    pattern = re.compile(
        r'''(href|src|action)\s*=\s*"(?:\.\./)*''' + RESOURCE_DIRS + r'/',
        re.IGNORECASE
    )
    content = pattern.sub(rf'\1="{prefix}\2/', content)

    # Single quotes
    pattern_sq = re.compile(
        r'''(href|src|action)\s*=\s*'(?:\.\./)*''' + RESOURCE_DIRS + r'/',
        re.IGNORECASE
    )
    content = pattern_sq.sub(rf"\1='{prefix}\2/", content)

    # fetch('data/...') and fetch('../data/...') etc
    content = re.sub(
        r"""fetch\s*\(\s*'(?:\.\./)*""" + RESOURCE_DIRS + r'/',
        rf"fetch('{prefix}\1/",
        content
    )
    content = re.sub(
        r'''fetch\s*\(\s*"(?:\.\./)*''' + RESOURCE_DIRS + r'/',
        rf'fetch("{prefix}\1/',
        content
    )

    # location.href with resources
    content = re.sub(
        r"""(location\.href|window\.location\.href)\s*=\s*'(?:\.\./)*""" + RESOURCE_DIRS + r'/',
        rf"\1='{prefix}\2/",
        content
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for dirpath, dirnames, filenames in os.walk(HTML_ROOT):
    for f in filenames:
        if f.endswith('.html'):
            try:
                if fix_file(os.path.join(dirpath, f)):
                    count += 1
            except Exception as e:
                print(f"ERROR: {f}: {e}")
print(f"Fixed {count} files")
