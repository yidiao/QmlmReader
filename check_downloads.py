import os, re

def check_dir(base_dir, depth=1):
    results = []
    if depth == 1:
        for fn in sorted(os.listdir(base_dir)):
            if not fn.endswith('.html') or 'backup' in fn or 'v2' in fn or fn.startswith('_'):
                continue
            path = os.path.join(base_dir, fn)
            results.append((path, fn))
    else:
        for root, dirs, files in os.walk(base_dir):
            for fn in sorted(files):
                if not fn.endswith('.html'):
                    continue
                path = os.path.join(root, fn)
                rel = path.replace(base_dir, '').lstrip('/\\')
                results.append((path, rel))
    return results

for base, depth in [('D:/Qmlmreader/articles', 1), ('D:/Qmlmreader/rectify', 2)]:
    print(f"\n=== {base} ===")
    for path, name in check_dir(base, depth):
        with open(path, encoding='utf-8') as f:
            html = f.read()
        has_fab = 'downloadFab' in html
        has_links_div = 'downloadLinks' in html
        # find all txt/pdf hrefs
        hrefs = re.findall(r'href=[\'"]([\w./\-]+\.(?:txt|pdf))[\'"]', html)
        # find innerHTML assignments
        inner = re.findall(r'innerHTML\s*=\s*"(.{10,100})"', html)
        
        if has_fab and hrefs:
            status = '✅'
        elif has_fab and inner:
            status = '✅'
        elif has_fab:
            status = '⚠️ (no links)'
        else:
            status = '❌ (no fab)'
        
        print(f"  {status} {name}")
        if hrefs:
            for h in hrefs[:3]:
                print(f"        href: {h}")
