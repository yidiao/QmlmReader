"""
Redesign the 代表著作 section on Mao/Marx/Engels/Lenin pages
to match Stalin's card style with status badges and star ratings.
"""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"

# Theme colors per master
THEMES = {
    'mao':   {'color': '#c41e3a', 'name': '毛泽东'},
    'marx':  {'color': '#8b0000', 'name': '马克思'},
    'engels':{'color': '#4a5568', 'name': '恩格斯'},
    'lenin': {'color': '#d4a017', 'name': '列宁'},
}

def transform_work_card(card_html, master_key):
    """Transform a work-card div to include status badges and star ratings."""
    color = THEMES[master_key]['color']

    # Extract title, year, description
    title_match = re.search(r'<h4>(.*?)</h4>', card_html, re.DOTALL)
    year_match = re.search(r'<p class="year">(.*?)</p>', card_html, re.DOTALL)
    desc_match = re.search(r'<p>(?!class)(.*?)</p>', card_html, re.DOTALL)
    link_match = re.search(r'<a href="([^"]+)"[^>]*>阅读全文', card_html)

    title = title_match.group(1).strip() if title_match else ''
    year = year_match.group(1).strip() if year_match else ''
    desc = desc_match.group(1).strip() if desc_match else ''
    link = link_match.group(1) if link_match else None

    is_completed = link is not None

    # Build new card
    border_style = f'border-left:4px solid {color};'
    opacity_style = '' if is_completed else 'opacity:0.85;'

    title_html = ''
    if is_completed:
        title_html = f'<h4 style="margin:0;"><a href="{link}" style="color:{color};text-decoration:none;">{title}</a></h4>'
    else:
        title_html = f'<h4 style="margin:0;color:#555;">{title}</h4>'

    badge = ''
    if is_completed:
        badge = '<span style="background:#e6f4ea;color:#1b5e20;font-size:0.75rem;padding:2px 8px;border-radius:10px;flex-shrink:0;margin-left:8px;">🟢 已完成</span>'
    else:
        badge = '<span style="background:#fff3e0;color:#e65100;font-size:0.75rem;padding:2px 8px;border-radius:10px;flex-shrink:0;margin-left:8px;">🟠 施工中</span>'

    read_more = ''
    if is_completed:
        read_more = f'\n                        <a href="{link}" style="display:inline-block;margin-top:6px;color:{color};font-weight:600;font-size:0.88rem;text-decoration:none;">阅读全文 →</a>'

    new_card = f'''                    <div class="work-card" style="{border_style}{opacity_style}">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                            {title_html}
                            {badge}
                        </div>
                        <p class="year">{year}</p>
                        <p>{desc}</p>{read_more}
                    </div>'''
    return new_card

def fix_page(filepath, master_key):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the 代表著作 section: from <!-- 代表著作 --> to next <!-- or </div> before next tab
    # Strategy: find the works-grid div and process all work-card children

    # Find all work-card blocks
    pattern = re.compile(r'<div class="work-card"[^>]*>.*?</div>\s*</div>\s*</div>', re.DOTALL)
    # Actually simpler: find individual work-card divs

    # Better approach: find the entire works section
    works_start = content.find('<!-- 代表著作 -->')
    if works_start == -1:
        print(f"  WARNING: no 代表著作 section in {filepath}")
        return

    # Find the closing of the works tab-content
    works_section_start = content.find('<div class="works-grid">', works_start)
    if works_section_start == -1:
        print(f"  WARNING: no works-grid in {filepath}")
        return

    # Find end of works-grid (next </div> after works-grid, then tab-content close)
    # Count div nesting
    grid_start = works_section_start
    pos = grid_start
    depth = 0
    end_pos = pos
    while pos < len(content):
        next_open = content.find('<div', pos + 1)
        next_close = content.find('</div>', pos + 1)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            # Check if it's actually a div tag (not just any tag starting with div)
            if content[next_open:next_open+4] == '<div':
                depth += 1
            pos = next_open
        else:
            if content[next_close-1:next_close] != '>':  # skip non-div closes
                pos = next_close
                continue
            depth -= 1
            pos = next_close + 6
            if depth <= 0:
                end_pos = pos
                break

    works_html = content[works_section_start:end_pos]

    # Extract individual work cards
    cards = []
    card_pattern = re.compile(r'<div class="work-card".*?</div>\s*</div>', re.DOTALL)
    # Simpler: split on </div> that closes a work-card

    # Actually, let's just regex-replace each work-card
    def replace_card(m):
        card = m.group(0)
        return transform_work_card(card, master_key)

    new_works_html = re.sub(
        r'<div class="work-card">.*?</div>\s*</div>',
        replace_card,
        works_html,
        flags=re.DOTALL
    )

    # Also add the legend line
    if '🟠 = 施工中' not in new_works_html:
        # Add legend after <h2>代表著作</h2>
        # Find the h2 in the surrounding content
        pass

    # Actually, let's handle the legend separately
    # Replace the content
    content = content[:works_section_start] + new_works_html + content[end_pos:]

    # Add legend if not present
    if '🟠 = 施工中' not in content[works_start:works_start+500]:
        h2_pos = content.find('<h2>代表著作</h2>', works_start)
        if h2_pos > 0:
            legend = '\n                <p style="color:#888;font-size:0.9rem;margin-bottom:1.5rem;">🟠 = 施工中，暂未开放精读；🟢 = 已完成精读版。</p>'
            content = content[:h2_pos + len('<h2>代表著作</h2>')] + legend + content[h2_pos + len('<h2>代表著作</h2>'):]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    return True

# Process all 4 pages
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

print("Done!")
