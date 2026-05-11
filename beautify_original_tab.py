import re

def detect_heading(line):
    """判断一行是否是章节标题"""
    s = line.strip()
    if not s:
        return None
    # 序号标题: 一、二、三、或 1. 2.
    if re.match(r'^[一二三四五六七八九十\d]+[\.、．]', s):
        return s
    # 第X章/节/部分
    if re.match(r'^第[一二三四五六七八九十\d]+[章节目部分节]', s):
        return s
    # ［XXX］或 [XXX] 形式的标题
    if re.match(r'^[［\[〈(].*[］\)〉]$', s):
        return s
    # 已知标题关键词
    if s in ['序言', '导言', '前言', '后记', '附录', '说明', '引言', '注释', '正文', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']:
        return s
    # 短行（<25字）且不含句号——可能是标题
    if len(s) < 25 and '。' not in s:
        return s
    return None


def txt_to_chapters(txt_path):
    """将txt智能分割为章节列表"""
    with open(txt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    chapters = []  # [{ 'title': str, 'paras': [str] }]
    current_title = None
    current_paras = []
    para_buf = []

    def flush_para():
        nonlocal para_buf, current_paras
        if para_buf:
            current_paras.append(''.join(para_buf))
            para_buf = []

    def save_chapter():
        nonlocal chapters, current_title, current_paras
        flush_para()
        if current_title or current_paras:
            chapters.append({'title': current_title or '正文', 'paras': current_paras})

    in_body = False
    skip_lines = 0

    for i, raw_line in enumerate(lines):
        s = raw_line.strip()
        if not s:
            flush_para()
            continue

        # 跳过文件头（标题行、来源行等）——遇到第一个真正的内容标题才开始
        heading = detect_heading(s)
        if heading:
            save_chapter()
            current_title = heading
            current_paras = []
            continue

        # 普通正文行，积累到段落里
        para_buf.append(s)

    save_chapter()
    return chapters


def chapters_to_html(chapters):
    """将章节列表转换为带折叠功能的HTML"""
    if not chapters:
        return '<p>（暂无内容）</p>'

    parts = []
    for i, ch in enumerate(chapters):
        title = ch['title']
        paras = ch['paras']
        if not paras:
            continue
        content_html = '\n'.join(f'<p>{p}</p>' for p in paras)
        icon = '▼' if i == 0 else '▶'
        show_cls = ' show' if i == 0 else ''
        parts.append(f'''                <div class="chapter">
                    <h3 class="chapter-title" onclick="toggleChapter(this)">
                        <span class="toggle-icon">{icon}</span>
                        {title}
                    </h3>
                    <div class="chapter-content{show_cls}">
                        {content_html}
                    </div>
                </div>''')
    return '\n'.join(parts)


def replace_original_tab(html_path, txt_path):
    """替换HTML中original tab的内容"""
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    chapters = txt_to_chapters(txt_path)
    new_body = chapters_to_html(chapters)

    new_tab = (
        f'<div class="tab-content active" id="original">\n'
        f'                <div class="text-intro">\n'
        f'                    <p><strong>阅读提示：</strong>点击章节标题可展开/折叠内容，建议分段阅读。</p>\n'
        f'                </div>\n'
        f'{new_body}\n'
        f'            </div>'
    )

    # 用稳健的方式替换：找到 id="original" 的 div，替换到下一个同级 tab-content 之前
    # 找起始：<div ... id="original">
    m_start = re.search(r'<div[^>]*id="original"[^>]*>', html)
    if not m_start:
        print(f'  [失败] 找不到 id="original": {html_path}')
        return False
    start_pos = m_start.start()

    # 从 start_pos 开始找匹配的 </div>
    pos = start_pos
    depth = 0
    found_open = False
    end_pos = -1

    while pos < len(html):
        next_open = html.find('<div', pos)
        next_close = html.find('</div>', pos)
        # 找最近的标签
        candidates = []
        if next_open != -1:
            candidates.append(('open', next_open))
        if next_close != -1:
            candidates.append(('close', next_close))
        if not candidates:
            break
        candidates.sort(key=lambda x: x[1])
        tag_type, tag_pos = candidates[0]

        if tag_type == 'open':
            depth += 1
            found_open = True
            pos = tag_pos + 1
        else:
            depth -= 1
            pos = tag_pos + len('</div>')
            if found_open and depth == 0:
                end_pos = pos
                break

    if end_pos == -1:
        print(f'  [失败] 找不到匹配的 </div>: {html_path}')
        return False

    new_html = html[:start_pos] + new_tab + html[end_pos:]
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f'  [成功] {html_path} ({len(chapters)} 个章节)')
    return True


# 四篇文章
articles = [
    ('articles/1844-nian-jing-ji-xue-zhe-xue-shou-gao.html', 'data/1844-nian-jing-ji-xue-zhe-xue-shou-gao.txt'),
    ('articles/ge-da-gang-ling.html', 'data/ge-da-gang-ling.txt'),
    ('articles/hei-ge-er-fa-zhe-xue-pi-pan-dao-yan.html', 'data/hei-ge-er-fa-zhe-xue-pi-pan-dao-yan.txt'),
    ('articles/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.html', 'data/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.txt'),
]

print('开始重新生成"原文"Tab（带折叠章节）...\n')
for html_path, txt_path in articles:
    print(f'处理: {html_path}')
    try:
        replace_original_tab(html_path, txt_path)
    except Exception as e:
        print(f'  [异常] {e}')
print('\n完成！')
