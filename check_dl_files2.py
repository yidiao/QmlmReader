import os, re

def get_links(html_path):
    with open(html_path, encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Decode unicode escapes in innerHTML
    content_decoded = content.encode().decode('unicode_escape', errors='ignore') if False else content
    
    # Find innerHTML patterns like href=\"../data/xxx.txt\"
    # The actual string in file has literal backslash-quote
    hrefs = re.findall(r'href=\\?"([^"\\]+\.(?:txt|pdf))\\?"', content)
    return hrefs

for base, walk in [('D:/Qmlmreader/articles', False), ('D:/Qmlmreader/rectify', True)]:
    print(f'\n=== {base} ===')
    if not walk:
        files = [os.path.join(base, f) for f in sorted(os.listdir(base)) 
                 if f.endswith('.html') and 'backup' not in f and 'v2' not in f and not f.startswith('_')]
    else:
        files = []
        for r, d, fs in os.walk(base):
            for f in sorted(fs):
                if f.endswith('.html'):
                    files.append(os.path.join(r, f))
    
    for p in sorted(files):
        links = get_links(p)
        html_dir = os.path.dirname(p)
        short = p.replace('D:/Qmlmreader/', '')
        if not links:
            print(f'  ⚠️  {short} -> NO LINKS FOUND')
            continue
        for href in links:
            abs_path = os.path.normpath(os.path.join(html_dir, href))
            exists = os.path.isfile(abs_path)
            status = '✅' if exists else '❌ MISSING'
            print(f'  {status}  {short}  ->  {href}')
            if not exists:
                print(f'         Expected: {abs_path}')
