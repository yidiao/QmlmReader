import os, re

def check_links(html_path):
    with open(html_path, encoding='utf-8') as f:
        html = f.read()
    hrefs = re.findall(r'href=[\x27\x22]([^\x27\x22]+\.(?:txt|pdf))[\x27\x22]', html)
    results = []
    html_dir = os.path.dirname(html_path)
    for href in set(hrefs):
        if href.startswith('http'):
            continue
        abs_path = os.path.normpath(os.path.join(html_dir, href))
        exists = os.path.isfile(abs_path)
        results.append((href, abs_path, exists))
    return results

for base, walk in [('D:/Qmlmreader/articles', False), ('D:/Qmlmreader/rectify', True)]:
    print(f'\n=== {base} ===')
    if not walk:
        files = [os.path.join(base, f) for f in os.listdir(base) 
                 if f.endswith('.html') and 'backup' not in f and 'v2' not in f and not f.startswith('_')]
    else:
        files = []
        for r, d, fs in os.walk(base):
            for f in fs:
                if f.endswith('.html'):
                    files.append(os.path.join(r, f))
    
    for p in sorted(files):
        links = check_links(p)
        if not links:
            short = p.replace('D:/Qmlmreader/', '')
            print(f'  ⚠️  {short}  -> NO LINKS FOUND')
            continue
        for href, abs_path, exists in links:
            status = '✅' if exists else '❌ MISSING'
            short = p.replace('D:/Qmlmreader/', '')
            print(f'  {status}  {short}  ->  {href}')
            if not exists:
                print(f'         Expected at: {abs_path}')
