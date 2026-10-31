"""
Migrate an article HTML to _template-v2 format, inserting full text from TXT.
Preserves existing tab content (reading/difficulty/dialogue/action/visual/puzzle).
"""
import sys, os, re

ROOT = r"D:\Claude Pj\Qmlmreader"
TEMPLATE_PATH = os.path.join(ROOT, 'html', 'articles', '_template-v2.html')

# Six category colors
CAT_COLORS = {
    'philosophy': ('#8b0000', '#c41e3a', 'linear-gradient(135deg, #4a0000 0%, #8b0000 50%, #c41e3a 100%)'),
    'economics':  ('#e65100', '#ff8f00', 'linear-gradient(135deg, #7a2e00 0%, #e65100 50%, #ff8f00 100%)'),
    'politics':   ('#805ad5', '#9f7aea', 'linear-gradient(135deg, #3d1a6e 0%, #805ad5 50%, #9f7aea 100%)'),
    'party':      ('#38a169', '#68d391', 'linear-gradient(135deg, #1a4d2e 0%, #38a169 50%, #68d391 100%)'),
    'military':   ('#3182ce', '#63b3ed', 'linear-gradient(135deg, #1a3a5c 0%, #3182ce 50%, #63b3ed 100%)'),
    'culture':    ('#e6b800', '#ffd700', 'linear-gradient(135deg, #7a6200 0%, #e6b800 50%, #ffd700 100%)'),
}

def extract_tab_content(html, tab_id):
    """Extract inner HTML of a tab-content div."""
    # Find the tab div
    pattern = re.compile(
        r'<div class="tab-content[^"]*"[^>]*id="' + tab_id + r'"[^>]*>(.*?)</div>\s*(?=<div class="tab-content|<!\-\-|\s*</main>)',
        re.DOTALL
    )
    m = pattern.search(html)
    if m:
        # Remove the heading if present (we'll add it in template)
        content = m.group(1)
        # Remove h2 heading
        content = re.sub(r'<h2[^>]*>.*?</h2>\s*', '', content, count=1, flags=re.DOTALL)
        return content.strip()
    return ''

def txt_to_chapters(txt_content, title):
    """Split TXT into chapters based on Chinese numeral headers."""
    # Pattern: optional whitespace + Chinese numeral + full-width space or regular space
    chapters = []
    lines = txt_content.split('\n')

    # Skip preamble (everything before first chapter header)
    preamble_lines = []
    current_title = '前言'
    current_lines = []
    in_chapter = False

    num_pattern = re.compile(r'^[\s]*([一二三四五六七八九十]+)[\s　]+(.+)$')

    for line in lines:
        m = num_pattern.match(line)
        if m:
            if current_lines:
                chapters.append({
                    'title': current_title,
                    'content': '\n'.join(current_lines).strip()
                })
            current_title = m.group(1) + '、' + m.group(2).strip()
            current_lines = []
            in_chapter = True
        elif in_chapter:
            current_lines.append(line)
        else:
            preamble_lines.append(line)

    # Don't forget the last chapter
    if current_lines:
        chapters.append({
            'title': current_title,
            'content': '\n'.join(current_lines).strip()
        })

    # If no chapters found, treat entire text as one chapter
    if not chapters:
        chapters = [{'title': title, 'content': txt_content.strip()}]

    return chapters

def build_chapter_html(chapter):
    """Build HTML for a single chapter."""
    paragraphs = [p.strip() for p in chapter['content'].split('\n') if p.strip()]
    para_html = '\n'.join([f'                        <p>{p}</p>' for p in paragraphs])

    return f'''                <div class="chapter">
                    <h3 class="chapter-title" onclick="toggleChapter(this)">
                        <span class="toggle-icon">▼</span>
                        {chapter['title']}
                    </h3>
                    <div class="chapter-content">
{para_html}
                    </div>
                </div>'''

def build_article(html_path, txt_path, category, meta, download_slug):
    """Build a new article HTML from template + old content + full text."""
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    # Read old HTML for tab content
    with open(html_path, 'r', encoding='utf-8') as f:
        old_html = f.read()

    # Read full text
    with open(txt_path, 'r', encoding='utf-8') as f:
        full_text = f.read()

    # Extract tab content from old HTML
    reading_html = extract_tab_content(old_html, 'reading') or '<div class="reading-guide">\n                <h2 class="tab-heading">💡 如何阅读本文</h2>\n                <div class="guide-block"><h3>待补充</h3><p>阅读指南正在编写中。</p></div>\n            </div>'
    difficulty_html = extract_tab_content(old_html, 'difficulty') or '<div class="difficulty-section">\n                <h2 class="tab-heading">🔍 容易读错的地方</h2>\n                <div class="diff-item"><div class="wrong">待补充</div><div class="correct">待补充</div></div>\n            </div>'
    dialogue_html = extract_tab_content(old_html, 'dialogue') or '<div class="dialogue-section">\n                <h2 class="tab-heading">💬 这篇文章在回应谁？</h2>\n                <div class="dialogue-block"><h3>待补充</h3><p>对话内容正在编写中。</p></div>\n            </div>'
    action_html = extract_tab_content(old_html, 'action') or '<div class="action-section">\n                <h2 class="tab-heading">⚡ 读完之后可以做什么</h2>\n                <div class="action-item"><h3>待补充</h3><p>行动实验正在编写中。</p></div>\n            </div>'
    visual_html = extract_tab_content(old_html, 'visual') or ''
    puzzle_html = extract_tab_content(old_html, 'puzzle') or ''

    # Parse full text into chapters
    chapters = txt_to_chapters(full_text, meta['title'])
    chapters_html = '\n'.join([build_chapter_html(ch) for ch in chapters])

    # Get colors
    prim, sec, grad = CAT_COLORS.get(category, CAT_COLORS['philosophy'])

    # Replace placeholders in template
    # 1. Title
    template = template.replace('【文章标题】 - 青年马列毛主义驿站', meta['title'] + ' - 青年马列毛主义驿站')
    template = template.replace('<title>【文章标题】', '<title>' + meta['title'])

    # 2. Category colors
    template = template.replace('--cat-primary:   #8b0000;', f'--cat-primary:   {prim};')
    template = template.replace('--cat-secondary: #c41e3a;', f'--cat-secondary: {sec};')
    template = template.replace("--cat-gradient:  linear-gradient(135deg, #4a0000 0%, #8b0000 50%, #c41e3a 100%);",
                               f"--cat-gradient:  {grad};")

    # 3. Body category
    template = template.replace('data-category="philosophy"', f'data-category="{category}"')

    # 4. Header content
    template = template.replace('【⭐⭐⭐⭐⭐ 核心必读 / ✨✨✨✨ 重点推荐】', meta['badge'])
    template = template.replace('<h1>【文章标题】</h1>', f'<h1>{meta["title"]}</h1>')
    template = template.replace('【副标题，可选】</div>', meta.get('subtitle', '') + '</div>')
    if not meta.get('subtitle'):
        template = template.replace('<div class="article-subtitle"></div>', '')
    template = template.replace('【作者】', meta['author'])
    template = template.replace('【写作日期】', meta['date'])
    template = template.replace('【分类标签】', meta['cat_label'])
    template = template.replace('【约XXX字】', meta['wordcount'])
    template = template.replace('【📄 短篇 / 📄 中篇 / 📚 长篇】', meta['length_tag'])

    # 5. Replace original text tab with chapters
    # Find the original tab-content and replace it
    orig_start = template.find('<!-- ═══════════════════════════════════════ -->')
    orig_start2 = template.find('<!-- ═══════════════════════════════════════ -->', orig_start + 1)
    # Tab 1 is between the first two separator comments
    tab1_start = template.find('<div class="tab-content active" id="original">')
    tab1_end = template.find('<!-- ═══════════════════════════════════════ -->\n        <!-- Tab 2', tab1_start)

    reading_intro = meta.get('reading_intro', '【简要介绍文章背景、章节结构、建议重点阅读的章节】')
    new_original = f'''<div class="tab-content active" id="original">
            <div class="original-text">
                <div class="text-intro">
                    <p><strong>阅读提示：</strong>{reading_intro}</p>
                </div>

                <div style="text-align:right;">
                    <button class="chapter-toggle-all" onclick="toggleAllChapters()" id="chapterToggleBtn">收起全部</button>
                </div>

{chapters_html}

            </div>
        </div>'''

    template = template[:tab1_start] + new_original + template[tab1_end:]

    # 6. Replace other tab contents
    # Reading tab
    rd_start = template.find('<div class="tab-content" id="reading">')
    rd_end = template.find('<!-- ═══════════════════════════════════════ -->\n        <!-- Tab 3', rd_start)
    template = template[:rd_start] + f'<div class="tab-content" id="reading">\n            {reading_html}\n        </div>\n\n        ' + template[rd_end:]

    # Difficulty tab
    df_start = template.find('<div class="tab-content" id="difficulty">')
    df_end = template.find('<!-- ═══════════════════════════════════════ -->\n        <!-- Tab 4', df_start)
    template = template[:df_start] + f'<div class="tab-content" id="difficulty">\n            {difficulty_html}\n        </div>\n\n        ' + template[df_end:]

    # Dialogue tab
    dg_start = template.find('<div class="tab-content" id="dialogue">')
    dg_end = template.find('<!-- ═══════════════════════════════════════ -->\n        <!-- Tab 5', dg_start)
    template = template[:dg_start] + f'<div class="tab-content" id="dialogue">\n            {dialogue_html}\n        </div>\n\n        ' + template[dg_end:]

    # Action tab
    ac_start = template.find('<div class="tab-content" id="action">')
    ac_end = template.find('<!-- ═══════════════════════════════════════ -->\n        <!-- Tab 6', ac_start)
    template = template[:ac_start] + f'<div class="tab-content" id="action">\n            {action_html}\n        </div>\n\n        ' + template[ac_end:]

    # Visual tab - keep template structure if old content is shallow
    if visual_html and len(visual_html) > 200:
        vs_start = template.find('<div class="tab-content" id="visual">')
        vs_end = template.find('<!-- ═══════════════════════════════════════ -->\n        <!-- Tab 7', vs_start)
        template = template[:vs_start] + f'<div class="tab-content" id="visual">\n            {visual_html}\n        </div>\n\n        ' + template[vs_end:]

    # Puzzle tab
    if puzzle_html and len(puzzle_html) > 200:
        pz_start = template.find('<div class="tab-content" id="puzzle">')
        pz_end = template.find('</main>', pz_start)
        template = template[:pz_start] + f'<div class="tab-content" id="puzzle">\n            {puzzle_html}\n        </div>\n\n    ' + template[pz_end:]

    # 7. Download links
    template = template.replace(
        "var DOWNLOAD_LINKS = [\n            { href: '../../../data/【文章slug】.txt', label: '📝 下载 TXT' }\n        ];",
        f"var DOWNLOAD_LINKS = [\n            {{ href: '../../../data/{download_slug}.txt', label: '📝 下载 TXT' }}\n        ];"
    )

    return template

if __name__ == '__main__':
    # Article 1: 论列宁主义基础
    meta1 = {
        'title': '论列宁主义基础',
        'subtitle': '在斯维尔德洛夫大学的讲演',
        'author': '斯大林',
        'date': '1924年4月',
        'cat_label': '党的建设 · 列宁主义',
        'wordcount': '约55,000字',
        'length_tag': '📚 长篇',
        'badge': '⭐⭐⭐⭐⭐ 核心必读',
        'reading_intro': '本文约5.5万字，是斯大林最重要的理论著作，系统阐述了列宁主义的定义、方法、理论、无产阶级专政、农民问题、民族问题、战略策略、党的工作作风等核心内容。全文共九章，逐层深入。点击章节标题可展开/折叠。',
    }
    result1 = build_article(
        os.path.join(ROOT, 'html/articles/Stalin/lun-lunen-zhu-yi-ji-chu.html'),
        r'D:\Claude Pj\《论列宁主义基础》.txt',
        'party',
        meta1,
        'lun-lunen-zhu-yi-ji-chu'
    )
    with open(os.path.join(ROOT, 'html/articles/Stalin/lun-lunen-zhu-yi-ji-chu.html'), 'w', encoding='utf-8') as f:
        f.write(result1)
    print("Article 1 (论列宁主义基础) migrated.")

    # Article 2: 论中国革命的前途
    meta2 = {
        'title': '论中国革命的前途',
        'subtitle': '在共产国际执行委员会中国委员会会议上的演说',
        'author': '斯大林',
        'date': '1926年11月30日',
        'cat_label': '政治理论 · 中国革命',
        'wordcount': '约6,500字',
        'length_tag': '📄 短篇',
        'badge': '⭐⭐⭐⭐⭐ 核心必读',
        'reading_intro': '本文是斯大林在共产国际会议上关于中国革命问题的演说，从中国革命性质、帝国主义干涉、革命军队、未来政权、农民问题、无产阶级领导权、青年问题等方面系统分析中国革命的方向。全文共八节。点击章节标题可展开/折叠。',
    }
    result2 = build_article(
        os.path.join(ROOT, 'html/articles/Stalin/lun-zhongguo-ge-ming-de-qiantu.html'),
        r'D:\Claude Pj\论中国革命的问题.txt',
        'politics',
        meta2,
        'lun-zhongguo-ge-ming-de-qiantu'
    )
    with open(os.path.join(ROOT, 'html/articles/Stalin/lun-zhongguo-ge-ming-de-qiantu.html'), 'w', encoding='utf-8') as f:
        f.write(result2)
    print("Article 2 (论中国革命的前途) migrated.")
    print("Done!")
