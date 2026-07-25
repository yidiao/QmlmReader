"""Fix broken darkmode.js and cursor.js script tags in all HTML files."""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Remove ALL existing darkmode.js and cursor.js script tags (clean or broken)
    content = re.sub(r'<script\s+src="[^"]*?js/darkmode\.js">\s*</script>\s*', '', content)
    content = re.sub(r'<script\s+src="[^"]*?js/cursor\.js">\s*</script>\s*', '', content)
    # Also handle the broken doubled-tag pattern
    content = content.replace('</script>\n    </script>', '</script>')

    # Determine depth
    rel = os.path.relpath(filepath, ROOT)
    depth = rel.count(os.sep)
    prefix = '' if depth == 0 else ('../' if depth == 1 else '../../')

    # Remove inline toggleDarkMode function definition if it exists (keep only shared)
    # Pattern: function toggleDarkMode... entire function
    content = re.sub(
        r'// 黑夜模式切换\s*\n\s*function toggleDarkMode\(\)[\s\S]*?updateDarkModeIcon\(\);\s*\n\s*\}\s*\n',
        '', content
    )
    # Also remove standalone function definition
    content = re.sub(
        r'function toggleDarkMode\(\)\s*\{[^}]*toggle[^}]*updateDarkModeIcon\(\);\s*\}\s*\n',
        '', content
    )

    # Remove inline dark mode init blocks (restore on load)
    content = re.sub(
        r"if\s*\(localStorage\.getItem\('darkMode'\)\s*===\s*'true'\)\s*\{\s*document\.body\.classList\.add\('dark-mode'\);\s*\}\s*updateDarkModeIcon\(\);\s*",
        '', content
    )

    # Insert darkmode.js and cursor.js before </body>
    script_tags = f'<script src="{prefix}js/darkmode.js"></script>\n<script src="{prefix}js/cursor.js"></script>\n'
    content = content.replace('</body>', script_tags + '</body>')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

if __name__ == '__main__':
    count = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        if '.git' in dirpath:
            continue
        for f in filenames:
            if f.endswith('.html'):
                fp = os.path.join(dirpath, f)
                try:
                    if fix_file(fp):
                        count += 1
                except Exception as e:
                    print(f"ERROR: {os.path.relpath(fp, ROOT)}: {e}")
    print(f"Fixed {count} files")
