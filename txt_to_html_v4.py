#!/usr/bin/env python3
"""
TXT → HTML 原文tab 转换工具 v4
修复：
- 数字编号章节模式（1.关于 无空格也能匹配）
- 1844手稿特殊章节解析
- 德意志意识形态章节解析
"""

import re
import os

TXT_DIR = 'D:/图片/红色/新增文章'
HTML_DIR = 'D:/Qmlmreader/articles'

# ============================================================
#  OCR 清理（同v3）
# ============================================================

def clean_text(text):
    text = re.sub(r'={5,}', '', text)
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        s = line.strip()
        if not s:
            cleaned.append(line)
            continue
        if re.match(r'^\d+$', s):
            continue
        if re.match(r'^[A-Z]?\d{1,4}[A-Z]?$', s):
            continue
        if '本书' in s and len(s) < 30:
            continue
        cleaned.append(line)
    text = '\n'.join(cleaned)
    fixes = [
        ('费尔巴晗', '费尔巴哈'),
        ('费尔巳哈', '费尔巴哈'),
        ('窖体', '客体'), ('窑体', '客体'), ('害体', '客体'),
        ('亘观', '直观'),
        ('研李', '研究'),
        ('晗', '哈'),
        ('5∞', ''), ('J80', ''), ('181', ''), ('5∞ ', ''),
    ]
    for old, new in fixes:
        text = text.replace(old, new)
    # 合并错误拆行
    lines = text.split('\n')
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if line and i + 1 < len(lines):
            next_line = lines[i+1].strip()
            if next_line and not re.search(r'[。！？；：」』”）】…—]\s*$', line):
                if not re.match(r'[0-9①②③④⑤⑥⑦⑧⑨⑩#■●]', next_line):
                    merged.append(line + next_line)
                    i += 2
                    continue
        merged.append(line)
        i += 1
    text = '\n'.join(merged)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text


# ============================================================
#  章节解析器
# ============================================================

def parse_numbered_sections(content):
    """
    解析 1. xxx / 2. xxx 格式
    （《关于费尔巴哈的提纲》：1.关于费尔巴哈①）
    不要求.后面有空格
    """
    text = '\n' + content
    # 匹配：换行后 数字. 后面任意字符直到换行
    pattern = r'\n(\d+)\.[^\n]*'
    matches = list(re.finditer(pattern, text))
    if len(matches) < 2:
        return []
    chapters = []
    for i, m in enumerate(matches):
        # 标题 = 匹配行的剩余部分（去掉数字.）
        title_line = m.group(0).strip()
        title = re.sub(r'^\d+\.\s*', '', title_line).strip()
        # 正文 = 本章开始到下章开始
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        if not title:
            title = f'第{m.group(1)}条'
        chapters.append((f'{m.group(1)}. {title}', body))
    return chapters


def parse_hash_sections(content):
    """解析 ## 标题 格式"""
    text = '\n' + content
    pattern = r'\n##\s*(.+?)(?=\n|$)'
    matches = list(re.finditer(pattern, text, re.MULTILINE))
    if not matches:
        return []
    chapters = []
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        title_clean = re.sub(r'^[一二三四五六七八九十]+[\s、．\.]+', '', title).strip()
        title_clean = re.sub(r'^\d+[\s、．\.]+', '', title_clean).strip()
        if not title_clean:
            title_clean = title
        chapters.append((title_clean, body))
    return chapters


def parse_chinese_numbered(content):
    """解析 一、xxx / 二、xxx 格式"""
    text = '\n' + content
    pattern = r'\n([一二三四五六七八九十])、\s*'
    matches = list(re.finditer(pattern, text))
    if len(matches) < 2:
        return []
    chapters = []
    for i, m in enumerate(matches):
        num = m.group(1)
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(text)
        raw = text[start:end].strip()
        lines = raw.split('\n', 1)
        title = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ''
        title = re.sub(r'^[一二三四五六七八九十]、\s*', '', title).strip()
        if not title:
            title = raw[:30]
        chapters.append((f'{num}、{title}', body))
    return chapters


def parse_1844_sections(content):
    """
    解析1844年经济学哲学手稿的特殊格式
    章节：序言、第一手稿、第二手稿、第三手稿等
    """
    text = '\n' + content
    # 查找可能的章节标记
    patterns = [
        r'\n(序言|序)\s*\n',
        r'\n(第一[手稿编])(.*?)\n',
        r'\n(第二[手稿编])(.*?)\n',
        r'\n(第三[手稿编])(.*?)\n',
        r'\n(附录|补充)(.*?)\n',
    ]
    # 简单策略：按空行较多的地方分割，或用关键字
    # 实际手稿格式较复杂，先尝试按 【XXX】 或 罗马数字 或 第一、第二
    # 如果没有，按 序言 + 三个手稿 分割
    markers = ['序言', '第一手稿', '第二手稿', '第三手稿']
    positions = []
    for marker in markers:
        idx = text.find(marker)
        if idx >= 0:
            positions.append((idx, marker))
    positions.sort()
    if len(positions) >= 2:
        chapters = []
        for i, (pos, marker) in enumerate(positions):
            start = pos
            end = positions[i+1][0] if i + 1 < len(positions) else len(text)
            # 提取标题行
            section_text = text[start:end]
            lines = section_text.split('\n', 1)
            title = lines[0].strip()
            body = lines[1].strip() if len(lines) > 1 else section_text.strip()
            chapters.append((title, body))
        return chapters
    return []


def parse_zhiyishi_sections(content):
    """
    解析德意志意识形态 第一章 费尔巴哈
    可能包含：[I] [II] 或 一、 二、 等标记
    """
    text = '\n' + content
    # 查找 [I] [II] [III] 或 I. II. 格式
    pattern1 = r'\n\[([IVXLCDM]+)\]\s*'
    matches = list(re.finditer(pattern1, text))
    if len(matches) >= 2:
        chapters = []
        for i, m in enumerate(matches):
            title = f'第{m.group(1)}节'
            start = m.end()
            end = matches[i+1].start() if i + 1 < len(matches) else len(text)
            body = text[start:end].strip()
            chapters.append((title, body))
        return chapters
    # 查找 一、 二、
    return parse_chinese_numbered(content)


def parse_auto(content, filename=''):
    """自动识别章节格式"""
    # 特殊处理
    if '1844' in filename:
        chapters = parse_1844_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用1844手稿格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    if '意识形态' in filename:
        chapters = parse_zhiyishi_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用意识形态格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 通用检测（顺序很重要）
    # 1. ## 格式
    if re.search(r'\n##\s', '\n' + content):
        chapters = parse_hash_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 ## 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 2. 数字. 格式（不要求空格）
    if re.search(r'\n\d+\.', '\n' + content):
        chapters = parse_numbered_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 数字. 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 3. 一、二、 格式
    if re.search(r'\n[一二三四五六七八九十]、', '\n' + content):
        chapters = parse_chinese_numbered(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 一、二、 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 都不匹配
    print(f"    ⚠️  未识别到章节格式，将整体作为单章处理")
    lines = content.strip().split('\n', 1)
    title = lines[0].strip() if lines else '正文'
    body = lines[1].strip() if len(lines) > 1 else content.strip()
    return [(title, body)]


# ============================================================
#  HTML 生成（同v3，略作改进）
# ============================================================

def chapters_to_html(chapters, txt_name):
    html = f'                <div class="text-intro">\n'
    html += f'                    <p><strong>阅读提示：</strong>'
    html += f'本文共 {len(chapters)} 章，'
    if len(chapters) <= 5:
        html += '建议逐章阅读，理解各章核心论点。'
    elif len(chapters) <= 10:
        html += '建议分多次阅读，重点理解核心章节。'
    else:
        html += '内容较多，建议分多次阅读，把握核心线索。'
    html += '</p>\n                </div>\n\n'
    for i, (title, body) in enumerate(chapters):
        paras = [p.strip() for p in body.split('\n\n') if p.strip()]
        if not paras:
            paras = [p.strip() for p in body.split('\n') if p.strip()]
        body_html = '\n                        '.join(f'<p>{p}</p>' for p in paras)
        icon = '▼' if i == 0 else '▶'
        show_class = ' show' if i == 0 else ''
        html += f'                <div class="chapter">\n'
        html += f'                    <h3 class="chapter-title" onclick="toggleChapter(this)">\n'
        html += f'                        <span class="toggle-icon">{icon}</span>\n'
        html += f'                        {title}\n'
        html += f'                    </h3>\n'
        html += f'                    <div class="chapter-content{show_class}">\n'
        html += f'                        {body_html}\n'
        html += f'                    </div>\n'
        html += f'                </div>\n\n'
    return html


# ============================================================
#  插入到已有HTML（同v3）
# ============================================================

def find_original_tab_range(content):
    m_start = re.search(r'<div\s+class="tab-content[^"]*"\s+id="original">', content, re.IGNORECASE)
    if not m_start:
        m_start = re.search(r'<div\s+id="original"\s+class="tab-content[^"]*">', content, re.IGNORECASE)
    if not m_start:
        return None
    start_pos = m_start.end()
    rest = content[start_pos:]
    depth = 0
    for m in re.finditer(r'<div[\s>]|</div>', rest):
        tag = m.group()
        if '<div' in tag:
            depth += 1
        elif '</div>' in tag:
            if depth == 0:
                end_pos = start_pos + m.start()
                return (m_start.start(), end_pos + 6)
            depth -= 1
    return None


def insert_original_into_html(html_path, original_html):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    result = find_original_tab_range(content)
    if not result:
        print(f"    ❌ 未找到 id='original' tab: {os.path.basename(html_path)}")
        return False
    start_pos, end_pos = result
    before = content[:start_pos]
    after = content[end_pos:]
    new_content = before + '\n' + original_html.rstrip() + '\n            ' + after
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"    ✅ 已填充原文tab: {os.path.basename(html_path)}")
    return True


# ============================================================
#  创建新HTML（同v3）
# ============================================================

def extract_meta(content, txt_name):
    meta = {'title': txt_name, 'author': '未知', 'date': '', 'cat': '哲学基础'}
    first_part = content[:2000]
    # 作者
    if '卡·马克思' in first_part or ('马克思' in first_part and '恩格斯' not in first_part[:100]):
        meta['author'] = '马克思'
    if '恩格斯' in first_part:
        meta['author'] = meta['author'] + '恩格斯' if meta['author'] != '未知' else '恩格斯'
    if '列宁' in first_part:
        meta['author'] = '列宁'
    # 日期
    dm = re.search(r'（(\d{4}年[^）]*)）', first_part)
    if dm:
        meta['date'] = dm.group(1)
    # 分类
    if '帝国主义' in txt_name or '资本主义' in txt_name:
        meta['cat'] = '政治经济学'
    elif '费尔巴哈' in txt_name or '意识形态' in txt_name or '1844' in txt_name or '黑格尔' in txt_name:
        meta['cat'] = '哲学基础'
    elif '革命' in txt_name or '马克思主义的三个来源' in txt_name:
        meta['cat'] = '政治理论'
    elif '反杜林' in txt_name:
        meta['cat'] = '哲学基础'
    return meta


def create_new_html(txt_path, slug, txt_name):
    template_path = os.path.join(HTML_DIR, '_template.html')
    if not os.path.exists(template_path):
        print(f"    ❌ 模板不存在: {template_path}")
        return False
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    with open(txt_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    cleaned = clean_text(raw)
    chapters = parse_auto(cleaned, txt_name)
    if not chapters:
        print(f"    ❌ 未解析到章节")
        return False
    original_html = chapters_to_html(chapters, txt_name)
    meta = extract_meta(cleaned, txt_name)
    html = template
    html = html.replace('文章标题', meta['title'])
    html = html.replace('副标题/说明', '')
    html = html.replace('作者', meta['author'])
    html = html.replace('写作日期', meta['date'])
    html = html.replace('内容类型', meta['cat'])
    html = re.sub(r'data-category="[^"]*"', f'data-category="{meta["cat"]}"', html)
    # 替换原文tab
    result = find_original_tab_range(html)
    if not result:
        print(f"    ⚠️  模板中未找到 id='original' tab")
        return False
    start_pos, end_pos = result
    before = html[:start_pos]
    after = html[end_pos:]
    html = before + '\n' + original_html.rstrip() + '\n            ' + after
    output_path = os.path.join(HTML_DIR, slug + '.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"    ✅ 已创建: {slug}.html")
    return True


# ============================================================
#  主流程
# ============================================================

def process_fill(txt_name, slug):
    txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
    html_path = os.path.join(HTML_DIR, slug + '.html')
    print(f"\n处理: {txt_name}")
    if not os.path.exists(txt_path):
        print(f"    ❌ TXT不存在")
        return False
    if not os.path.exists(html_path):
        print(f"    ❌ HTML不存在")
        return False
    with open(txt_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    cleaned = clean_text(raw)
    chapters = parse_auto(cleaned, txt_name)
    if not chapters:
        print(f"    ❌ 未解析到章节")
        return False
    original_html = chapters_to_html(chapters, txt_name)
    return insert_original_into_html(html_path, original_html)


def process_create(txt_name, slug):
    txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
    print(f"\n创建: {txt_name} → {slug}.html")
    if not os.path.exists(txt_path):
        print(f"    ❌ TXT不存在")
        return False
    return create_new_html(txt_path, slug, txt_name)


def main():
    print("=" * 60)
    print("TXT → HTML 原文tab 转换工具 v4")
    print("=" * 60)
    fill_tasks = [
        ('1844年经济学哲学手稿', '1844-nian-jing-ji-xue-zhe-xue-shou-gao'),
        ('关于费尔巴哈的提纲', 'guan-yu-fei-er-ba-ha-de-ti-gang'),
        ('帝国主义是资本主义的最高阶段', 'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan'),
        ('德意志意识形态_第一章_费尔巴哈', 'de-yi-zhi-yi-xing-tai'),
    ]
    print("\n【第一阶段】填充已有HTML的原文tab...\n")
    for txt_name, slug in fill_tasks:
        process_fill(txt_name, slug)
    create_tasks = [
        ('反杜林论_社会主义编', 'fan-du-lin-lun-she-hui-zhu-yi-bian'),
        ('论我国革命', 'lun-wo-guo-ge-ming'),
        ('马克思主义的三个来源和三个组成部分', 'ma-ke-si-zhu-yi-de-san-ge-lai-yuan'),
        ('黑格尔法哲学批判导言', 'hei-ge-er-fa-zhe-xue-pi-pan-dao-yan'),
    ]
    print("\n" + "=" * 60)
    print("【第二阶段】新建HTML文件...\n")
    for txt_name, slug in create_tasks:
        process_create(txt_name, slug)
    print("\n" + "=" * 60)
    print("完成！")
    print("=" * 60)


if __name__ == '__main__':
    main()
