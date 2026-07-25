"""Clean fix: add darkmode.js and cursor.js scripts before </body>."""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    rel = os.path.relpath(filepath, ROOT)
    depth = rel.count(os.sep)
    prefix = '' if depth == 0 else ('../' if depth == 1 else '../../')

    # Remove any lingering broken darkmode/cursor script tags
    for line in content.split('\n'):
        if 'darkmode.js' in line or 'cursor.js' in line:
            content = content.replace(line + '\n', '')
            content = content.replace(line, '')

    # Remove inline toggleDarkMode function + its init block
    content = re.sub(
        r'function toggleDarkMode\(\)\s*\{[^}]*body\.classList[^}]*localStorage[^}]*updateDarkModeIcon[^}]*\}',
        '', content, flags=re.DOTALL
    )
    content = re.sub(
        r'function updateDarkModeIcon\(\)\s*\{[^}]*\}',
        '', content, flags=re.DOTALL
    )
    # Remove the init block that restores dark mode
    content = re.sub(
        r"if\s*\(localStorage\.getItem\('darkMode'\)\s*===\s*'true'\)\s*\{[^}]*\}\s*updateDarkModeIcon\(\);",
        '', content
    )

    # Insert scripts before </body>
    scripts = f'<script src="{prefix}js/darkmode.js"></script>\n<script src="{prefix}js/cursor.js"></script>\n</body>'
    content = content.replace('</body>', scripts)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    if '.git' in dirpath:
        continue
    for f in filenames:
        if f.endswith('.html'):
            try:
                if fix_file(os.path.join(dirpath, f)):
                    count += 1
            except Exception as e:
                print(f"ERROR: {f}: {e}")
print(f"Fixed {count} files")
