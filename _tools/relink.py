#!/usr/bin/env python3
"""Batch update all paths after file reorganization."""
import os, re, shutil

ROOT = r"D:\Claude Pj\Qmlmreader"

# Files that moved from root to a subfolder
MOVED_FILES = {
    "masters.html": "masters/masters.html",
    "toolkit.html": "toolkit/toolkit.html",
    "science.html": "toolkit/science.html",
    "gallery.html": "gallery/gallery.html",
    "puzzle.html": "puzzle/puzzle.html",
    "international.html": "international/international.html",
    "international-calendar.html": "international/international-calendar.html",
    "international-current.html": "international/international-current.html",
    "international-memorial.html": "international/international-memorial.html",
    "international-column.html": "international/international-column.html",
    "rectify.html": "rectify/rectify.html",
    "about.html": "about/about.html",
    "changelog-detail.html": "about/changelog-detail.html",
    "changelog-archive.html": "about/changelog-archive.html",
}

# Files that stay at root
ROOT_FILES = ["index.html", "articles.html", "experimental.html", "message-board.html"]

# All HTML files to process
def all_html_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        if '.git' in dirpath:
            continue
        for f in filenames:
            if f.endswith('.html'):
                yield os.path.join(dirpath, f)

# CSS/JS files to process
def all_css_js_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        if '.git' in dirpath:
            continue
        for f in filenames:
            if f.endswith('.css') or f.endswith('.js'):
                yield os.path.join(dirpath, f)

def get_depth(filepath):
    """Get depth relative to ROOT (0 = root, 1 = subfolder, 2 = sub-subfolder)"""
    rel = os.path.relpath(filepath, ROOT)
    return rel.count(os.sep)

def is_moved_file(filepath):
    """Check if this file was moved from root"""
    rel = os.path.relpath(filepath, ROOT)
    return rel in MOVED_FILES.values()

def process_html(filepath):
    """Process a single HTML file, updating paths"""
    rel = os.path.relpath(filepath, ROOT)
    depth = get_depth(filepath)
    moved = is_moved_file(filepath)
    is_root_static = rel in ROOT_FILES

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # ---- Update asset references for moved files (depth 0->1) ----
    if moved and not is_root_static:
        # css/style.css → ../css/style.css
        content = re.sub(r'(?<!")(?<!\.\./)(?<!/)(?<!-)(href|src)="(css|js|data|images|assets|downloads)/',
                        r'\1="../\2/', content)
        # Also handle src='...' single quotes
        content = content.replace("src='css/", "src='../css/")
        content = content.replace("src='js/", "src='../js/")
        content = content.replace("src='data/", "src='../data/")

    # ---- Update nav links ----
    # Rules per depth:
    nav_prefix = "" if depth == 0 else ("../" if depth == 1 else "../../")

    moves_that_need_prefix = {
        "masters.html": "masters/masters.html",
        "toolkit.html": "toolkit/toolkit.html",
        "gallery.html": "gallery/gallery.html",
        "puzzle.html": "puzzle/puzzle.html",
        "international.html": "international/international.html",
        "rectify.html": "rectify/rectify.html",
        "about.html": "about/about.html",
        "science.html": "toolkit/science.html",
        "international-calendar.html": "international/international-calendar.html",
        "international-current.html": "international/international-current.html",
        "international-memorial.html": "international/international-memorial.html",
        "international-column.html": "international/international-column.html",
        "changelog-detail.html": "about/changelog-detail.html",
        "changelog-archive.html": "about/changelog-archive.html",
    }

    for old_name, new_name in moves_that_need_prefix.items():
        new_target = nav_prefix + new_name
        # Handle href="old" → href="new_target"
        # Need to be careful to only replace in href/src attributes, not in text
        content = content.replace(f'href="{old_name}"', f'href="{new_target}"')
        content = content.replace(f"href='{old_name}'", f"href='{new_target}'")
        content = content.replace(f'src="{old_name}"', f'src="{new_target}"')
        content = content.replace(f"src='{old_name}'", f"src='{new_target}'")
        # Handle onclick="location.href='old_name'"
        content = content.replace(f"location.href='{old_name}'", f"location.href='{new_target}'")
        content = content.replace(f'location.href="{old_name}"', f'location.href="{new_target}"')
        # Handle window.location.href
        content = content.replace(f"window.location.href='{old_name}'", f"window.location.href='{new_target}'")

    # Special: for files in masters/ subfolder, internal sibling links simplify
    if '/masters/' in rel and depth >= 1:
        # masters/masters.html links to marx.html (same dir)
        for master in ['marx', 'engels', 'lenin', 'stalin', 'mao']:
            old_pat = f'{nav_prefix}masters/{master}.html'
            new_pat = f'{master}.html'
            content = content.replace(f'href="{old_pat}"', f'href="{new_pat}"')
            content = content.replace(f'href="{master}.html"', f'href="{master}.html"')  # already correct

    # Special: for files in gallery/ subfolder, internal sibling links simplify
    if '/gallery/' in rel and depth >= 1:
        for sub in ['music', 'videos', 'poetry', 'quotes', 'propaganda', 'soviet', 'photos']:
            old_pat = f'{nav_prefix}gallery/{sub}.html'
            new_pat = f'{sub}.html'
            content = content.replace(f'href="{old_pat}"', f'href="{new_pat}"')

    # Special: for files in international/ subfolder, internal links simplify
    if '/international/' in rel and depth >= 1 and 'international-column' not in rel:
        for sub in ['international-calendar', 'international-current', 'international-memorial', 'international-column']:
            old_pat = f'{nav_prefix}international/{sub}.html'
            new_pat = f'{sub}.html'
            content = content.replace(f'href="{old_pat}"', f'href="{new_pat}"')

    # Special: for files in about/ subfolder, internal links simplify
    if '/about/' in rel and depth >= 1:
        for sub in ['changelog-detail', 'changelog-archive']:
            old_pat = f'{nav_prefix}about/{sub}.html'
            new_pat = f'{sub}.html'
            content = content.replace(f'href="{old_pat}"', f'href="{new_pat}"')

    # Special: for files in toolkit/ subfolder
    if '/toolkit/' in rel and depth >= 1:
        old_pat = f'{nav_prefix}toolkit/science.html'
        new_pat = 'science.html'
        content = content.replace(f'href="{old_pat}"', f'href="{new_pat}"')

    # Special: for rectify/ sub-folder files (rectify/rectify.html links to rectify/leaders/...)
    if '/rectify/' in rel and depth >= 1:
        old_pat = f'{nav_prefix}rectify/'
        new_pat = '' if '/rectify/' == f'/{os.path.relpath(os.path.dirname(filepath), ROOT).replace(chr(92), "/")}/' else ''
        # Don't change for depth-2 files since they already reference with ../../rectify/

    # ---- Update data-fetch paths in inline JS ----
    if moved and not is_root_static:
        content = content.replace("fetch('data/", "fetch('../data/")
        content = content.replace('fetch("data/', 'fetch("../data/')

    # ---- Replace inline toggleDarkMode with shared script ----
    # Remove inline dark mode functions
    content = re.sub(
        r'// 黑夜模式[\s\S]*?function toggleDarkMode[\s\S]*?updateDarkModeIcon\(\);\s*\n\s*\}',
        '', content, count=1
    )

    # Add shared script if not already present
    if 'js/darkmode.js' not in content:
        # Find the last </script> or </body> tag and add before it
        script_tag = f'\n<script src="{nav_prefix}js/darkmode.js"></script>\n'
        if depth >= 1 and not is_root_static:
            script_tag = script_tag.replace('../', nav_prefix)
        # Insert before </body>
        content = content.replace('</body>', script_tag + '\n</body>')

    # ---- Also handle inline dark mode toggle button onclick ----
    # toggleDarkMode() remains the same function name, just now in external file

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  UPDATED: {rel}")
        return True
    return False

def process_search_js(filepath):
    """Update paths in search.js"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update international calendar path
    content = content.replace(
        "file: 'international-calendar.html'",
        "file: 'international/international-calendar.html'"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  UPDATED: {os.path.relpath(filepath, ROOT)}")

if __name__ == '__main__':
    print("Processing HTML files...")
    html_count = 0
    updated_count = 0

    for filepath in all_html_files():
        html_count += 1
        try:
            if process_html(filepath):
                updated_count += 1
        except Exception as e:
            print(f"  ERROR in {os.path.relpath(filepath, ROOT)}: {e}")

    print(f"\n{updated_count}/{html_count} HTML files updated")

    # Update search.js
    search_path = os.path.join(ROOT, 'js', 'search.js')
    process_search_js(search_path)

    print("\nDone!")
