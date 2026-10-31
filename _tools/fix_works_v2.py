"""
Transform 代表著作 sections on Mao/Marx/Engels/Lenin pages.
"""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"

THEMES = {
    'mao':   '#c41e3a',
    'marx':  '#8b0000',
    'engels': '#4a5568',
    'lenin': '#d4a017',
}

def transform_card(card_html, color):
    """Transform a single work-card div from old style to new Stalin-style."""
    card_html = card_html.strip()

    # Parse components
    title_m = re.search(r'<h4>(.*?)</h4>', card_html, re.DOTALL)
    year_m = re.search(r'<p class="year">(.*?)</p>', card_html, re.DOTALL)
    desc_m = re.search(r'<p>(?!class)(.*?)</p>', card_html, re.DOTALL)
    link_m = re.search(r'<a href="([^"]+)"[^>]*>阅读全文', card_html)

    title = title_m.group(1).strip() if title_m else ''
    year = year_m.group(1).strip() if year_m else ''
    desc = desc_m.group(1).strip() if desc_m else ''
    link = link_m.group(1) if link_m else None

    is_done = link is not None

    # Star ratings
    star_rating = ' · ★★★★★' if '★★★★★' not in year else ''

    if is_done:
        html = f'''<div class="work-card" style="border-left:4px solid {color};">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                            <h4 style="margin:0;"><a href="{link}" style="color:{color};text-decoration:none;">{title}</a></h4>
                            <span style="background:#e6f4ea;color:#1b5e20;font-size:0.75rem;padding:2px 8px;border-radius:10px;flex-shrink:0;margin-left:8px;">🟢 已完成</span>
                        </div>
                        <p class="year">{year}{star_rating}</p>
                        <p>{desc}</p>
                        <a href="{link}" style="display:inline-block;margin-top:6px;color:{color};font-weight:600;font-size:0.88rem;text-decoration:none;">阅读全文 →</a>
                    </div>'''
    else:
        html = f'''<div class="work-card" style="border-left:4px solid #aaa;opacity:0.85;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                            <h4 style="margin:0;color:#555;">{title}</h4>
                            <span style="background:#fff3e0;color:#e65100;font-size:0.75rem;padding:2px 8px;border-radius:10px;flex-shrink:0;margin-left:8px;">🟠 施工中</span>
                        </div>
                        <p class="year">{year}{star_rating}</p>
                        <p>{desc}</p>
                    </div>'''
    return html

def fix_page(filepath, key):
    color = THEMES[key]

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all work-card blocks using a split approach
    # Split on '<div class="work-card"' to get card segments
    parts = content.split('<div class="work-card"')

    # If no work-cards found, skip
    if len(parts) <= 1:
        print(f"  No work-cards found in {filepath}")
        return False

    new_content = parts[0]  # everything before first work-card
    changed = False

    for part in parts[1:]:
        # Each part starts from a work-card opening (possibly with style attr)
        # Find the matching </div> that closes this work-card
        # Work-card has a known structure: it contains one or two <p> tags and optionally an <a> tag

        # Strategy: find </div> that follows the last child element
        # The card ends with either:
        #   </a>\n                    </div>  (completed with link)
        #   </p>\n                    </div>  (wip without link)

        # Simple approach: find the 2nd-to-last or last </div> in this segment
        # before the next work-card or end of container

        # Let's just look for the pattern: content followed by </div>\n (close of card)
        # The card always ends with </p>\n                    </div> or </a>\n                    </div>

        # Find the closing </div> with indentation that matches the work-card level
        idx_end = part.find('\n                    </div>')
        if idx_end == -1:
            idx_end = part.find('\n                </div>')
        if idx_end == -1:
            # Try to find any </div> that closes the card
            new_content += '<div class="work-card"' + part
            continue

        card_body = part[:idx_end]
        remaining = part[idx_end + len('\n                    </div>'):]

        full_card = '<div class="work-card"' + card_body + '\n                    </div>'

        try:
            new_card = transform_card(full_card, color)
            if new_card != full_card:
                changed = True
            new_content += new_card
        except Exception as e:
            print(f"  ERROR transforming card: {e}")
            new_content += full_card

        new_content += remaining

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  Transformed: {filepath}")
    else:
        print(f"  No changes: {filepath}")

    return changed

# Process all pages
pages = [
    ('html/masters/mao/mao.html', 'mao'),
    ('html/masters/marx/marx.html', 'marx'),
    ('html/masters/engels/engels.html', 'engels'),
    ('html/masters/lenin/lenin.html', 'lenin'),
]

for rel_path, key in pages:
    fp = os.path.join(ROOT, rel_path)
    print(f"Processing {rel_path}...")
    fix_page(fp, key)

print("\nDone!")
