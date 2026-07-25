"""
Remove stray } from inline <script> blocks left by earlier cleanup.
Pattern: empty lines + stray } before </script>
"""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"
HTML_ROOT = os.path.join(ROOT, 'html')

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Find the last inline <script> block
    # Look for pattern: empty lines + } + empty lines + </script>
    # The stray } is always preceded by empty/whitespace lines, not part of any function/if/for

    # Strategy: find all </script> that close an inline block,
    # check if preceded by a stray }

    # Find all script closing tags
    pattern = re.compile(r'(<script[^>]*>)(.*?)(</script>)', re.DOTALL)
    changed = False

    def fix_block(m):
        nonlocal changed
        tag_open = m.group(1)
        body = m.group(2)
        tag_close = m.group(3)

        # Skip external scripts
        if 'src=' in tag_open:
            return m.group(0)

        # Check for stray } pattern: lines with only whitespace + }
        lines = body.split('\n')
        stray_indices = []
        for i, line in enumerate(lines):
            if re.match(r'^\s+}\s*$', line):
                # Check if this is the LAST } and preceded by empty lines
                prev_empty = i > 0 and lines[i-1].strip() == ''
                next_is_close = i == len(lines) - 1 or (i+1 < len(lines) and '</script>' in ''.join(lines[i+1:i+3]))
                if prev_empty:
                    stray_indices.append(i)

        if not stray_indices:
            return m.group(0)

        # Count braces to identify the extra one
        opens = body.count('{')
        closes = body.count('}')
        extra = closes - opens

        if extra <= 0:
            return m.group(0)

        # Remove extra } lines (take the last 'extra' number of stray lines)
        remove_count = min(extra, len(stray_indices))
        for idx in stray_indices[-remove_count:]:
            # Remove the line and surrounding empty lines
            # Remove empty lines before
            j = idx - 1
            while j >= 0 and lines[j].strip() == '':
                j -= 1
            # Keep one empty line for spacing
            lines = lines[:j+2] + [''] + lines[idx+1:]

        # Trim trailing empty lines before </script>
        while len(lines) > 1 and lines[-1].strip() == '' and lines[-2].strip() == '':
            lines.pop()

        changed = True
        return tag_open + '\n'.join(lines) + '\n' + tag_close

    content = pattern.sub(fix_block, content)

    if changed and content != original:
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
