#!/usr/bin/env python3
"""
TXT → HTML 原文tab 转换工具 v8
- 用逐行检测替代正则整体匹配（解决费尔巴哈的提纲只找到1个编号的bug）
- 正确处理反杜林论、黑格尔法哲学批判导言的章节解析
"""

import re
import os

TXT_DIR = 'D:/图片/红色/新增文章'
HTML_DIR = 'D:/Qmlmreader/articles'

# ============================================================
#  逐行章节解析器（最可靠）
# ============================================================

def parse_numbered_by_lines(content):
    """
    逐行检测：行首为 数字. 的作为章节开始
    （用于费尔巴哈的提纲：1. 2. ... 11.）
    """
    lines = content.split('\n')
    starts = []  # [(line_index, number, title)]
    for i, line in enumerate(lines):
        stripped = line.strip()
        # 匹配行首：数字.标题
        m = re.match(r'^(\d+)\.(.*)$', stripped)
        if m:
            num = m.group(1)
            title = m.group(2).strip()
            starts.append((i, num, title))
    if len(starts) < 2:
        return []
    chapters = []
    for j, (idx, num, title) in enumerate(starts):
        body_start = idx + 1
        body_end = starts[j+1][0] if j + 1 < len(starts) else len(lines)
        body = '\n'.join(lines[body_start:body_end]).strip()
        if not title:
            title = f'第{num}条'
        chapters.append((f'{num}. {title}', body))
    return chapters


def parse_hash_by_lines(content):
    """逐行检测 ## 标题"""
    lines = content.split('\n')
    starts = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('##'):
            title = stripped[2:].strip()
            if title:
                starts.append((i, title))
    if len(starts) < 2:
        return []
    chapters = []
    for j, (idx, title) in enumerate(starts):
        body_start = idx + 1
        body_end = starts[j+1][0] if j + 1 < len(starts) else len(lines)
        body = '\n'.join(lines[body_start:body_end]).strip()
        title_clean = re.sub(r'^[一二三四五六七八九十]+[\s、．\.]+', '', title).strip()
        if not title_clean:
            title_clean = title
        chapters.append((title_clean, body))
    return chapters


def parse_chinese_numbered_by_lines(content):
    """逐行检测 一、二、"""
    lines = content.split('\n')
    starts = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        m = re.match(r'^([一二三四五六七八九十])、(.*)$', stripped)
        if m:
            starts.append((i, m.group(1), m.group(2).strip()))
    if len(starts) < 2:
        return []
    chapters = []
    for j, (idx, num, title) in enumerate(starts):
        body_start = idx + 1
        body_end = starts[j+1][0] if j + 1 < len(starts) else len(lines)
        body = '\n'.join(lines[body_start:body_end]).strip()
        title_clean = re.sub(r'^[一二三四五六七八九十]+、\s*', '', title).strip()
        if not title_clean:
            title_clean = title if title else f'第{num}节'
        chapters.append((f'{num}、{title_clean}', body))
    return chapters


def parse_1844_by_lines(content):
    """1844手稿：按 序言/第一手稿/第二手稿/第三手稿 分割（逐行检测）"""
    lines = content.split('\n')
    markers = ['序言', '序', '第一', '第二', '第三', '附录']
    positions = []  # [(line_index, marker_name)]
    for i, line in enumerate(lines):
        stripped = line.strip()
        for mk in markers:
            if mk in stripped[:10]:  # 在行首附近
                positions.append((i, mk))
                break
    positions.sort()
    if len(positions) < 2:
        return []
    chapters = []
    for j, (idx, mk) in enumerate(positions):
        title = mk
        body_start = idx + 1
        body_end = positions[j+1][0] if j + 1 < len(positions) else len(lines)
        body = '\n'.join(lines[body_start:body_end]).strip()
        chapters.append((title, body))
    return chapters


def parse_意识形态_by_lines(content):
    """德意志意识形态：逐行检测 [I] [II] 等"""
    lines = content.split('\n')
    starts = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        m = re.match(r'^\[(I{1,4})\]\s*(.*)$', stripped)
        if m:
            starts.append((i, m.group(1), m.group(2).strip()))
    if len(starts) >= 2:
        chapters = []
        for j, (idx, roman, title) in enumerate(starts):
            body_start = idx + 1
            body_end = starts[j+1][0] if j + 1 < len(starts) else len(lines)
            body = '\n'.join(lines[body_start:body_end]).strip()
            title_final = f'第{roman}节 {title}'.strip()
            chapters.append((title_final, body))
        return chapters
    # 尝试 一、
    return parse_chinese_numbered_by_lines(content)


# ============================================================
#  主解析调度
# ============================================================

def parse_for_file(content, txt_name):
    """
    根据文件名选择对应解析器（全部使用逐行检测）
    """
    if '关于费尔巴哈' in txt_name:
        ch = parse_numbered_by_lines(content)
        if len(ch) >= 2:
            print(f"    ✅ [数字编号] 找到 {len(ch)} 章")
            return ch
        else:
            print(f"    ⚠️  [{txt_name}] 数字编号解析失败，使用整体单章（找到{len(ch)}个）")
            return parse_plain(content, txt_name)

    if '1844' in txt_name:
        ch = parse_1844_by_lines(content)
        if len(ch) >= 2:
            print(f"    ✅ [1844手稿] 找到 {len(ch)} 章")
            return ch

    if '意识形态' in txt_name:
        ch = parse_意识形态_by_lines(content)
        if len(ch) >= 2:
            print(f"    ✅ [意识形态] 找到 {len(ch)} 章")
            return ch

    if '帝国主义' in txt_name or '马克思主义的三个来源' in txt_name or '论我国革命' in txt_name:
        ch = parse_hash_by_lines(content)
        if len(ch) >= 2:
            print(f"    ✅ [## 格式] 找到 {len(ch)} 章")
            return ch

    if '反杜林' in txt_name:
        # 反杜林论按 ## 或 一、 解析
        ch = parse_hash_by_lines(content)
        if len(ch) >= 2:
            print(f"    ✅ [反杜林论 ##] 找到 {len(ch)} 章")
            return ch
        ch2 = parse_chinese_numbered_by_lines(content)
        if len(ch2) >= 2:
            print(f"    ✅ [反杜林论 中文数字] 找到 {len(ch2)} 章")
            return ch2

    if '黑格尔' in txt_name:
        # 黑格尔法哲学批判导言：按 ## 或整体
        ch = parse_hash_by_lines(content)
        if len(ch) >= 2:
            print(f"    ✅ [黑格尔 ##] 找到 {len(ch)} 章")
            return ch

    # 以上都不匹配 → 整体作为单章
    return parse_plain(content, txt_name)


def parse_plain(content, txt_name):
    print(f"    ⚠️  {txt_name}：未识别章节格式，整体作为单章处理")
    lines = content.strip().split('\n', 1)
    title = lines[0].strip() if lines else txt_name
    body = lines[1].strip() if len(lines) > 1 else content.strip()
    return [(title, body)]


# ============================================================
#  OCR 清理（同v7）
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
        cleaned.append(line)
    text = '\n'.join(cleaned)
    fixes = [
        ('费尔巴晗', '费尔巴哈'),
        ('费尔巳哈', '费尔巴哈'),
        ('窖体', '客体'), ('窑体', '客体'), ('害体', '客体'),
        ('晗', '哈'),
        ('5∞', ''), ('J80', ''),
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
            nl = lines[i+1].strip()
            if nl and not re.search(r'[。！？；：」』”)】…—]\s*$', line):
                if not re.match(r'[0-9①②③④⑤⑥⑦⑧⑨⑩#■●]', nl):
                    merged.append(line + nl)
                    i += 2
                    continue
        merged.append(line)
        i += 1
    text = '\n'.join(merged)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text


# ============================================================
#  HTML 生成（同前）
# ============================================================

def chapters_to_html(chapters, txt_name):
    html = '                <div class="text-intro">\n'
    html += '                    <p><strong>阅读提示：</strong>'
    html += f'本文共 {len(chapters)} 章，'
    if len(chapters) <= 3:
        html += '建议逐章阅读。</p>\n                </div>\n\n'
    elif len(chapters) <= 8:
        html += '建议分多次阅读，理解各章核心。</p>\n                </div>\n\n'
    else:
        html += '内容较多，建议分多次阅读，把握核心线索。</p>\n                </div>\n\n'
    for i, (title, body) in enumerate(chapters):
        paras = [p.strip() for p in body.split('\n\n') if p.strip()]
        if not paras:
            paras = [p.strip() for p in body.split('\n') if p.strip()]
        # 清理段落中的残余OCR标记
        cleaned_paras = []
        for p in paras:
            p = re.sub(r'【\d+】', '', p)
            p = re.sub(r'^\s*[Jj]\d+\s*', '', p)
            cleaned_paras.append(p)
        body_html = '\n                        '.join(f'<p>{p}</p>' for p in cleaned_paras if p)
        icon = '▼' if i == 0 else '▶'
        show = ' show' if i == 0 else ''
        html += f'                <div class="chapter">\n'
        html += f'                    <h3 class="chapter-title" onclick="toggleChapter(this)">\n'
        html += f'                        <span class="toggle-icon">{icon}</span>\n'
        html += f'                        {title}\n'
        html += f'                    </h3>\n'
        html += f'                    <div class="chapter-content{show}">\n'
        html += f'                        {body_html}\n'
        html += f'                    </div>\n'
        html += f'                </div>\n\n'
    return html


# ============================================================
#  找到 original tab 并替换
# ============================================================

def find_and_replace_original(content, original_html):
    m_open = re.search(r'<div[^>]*id="original"[^>]*>', content, re.IGNORECASE)
    if not m_open:
        return None
    open_end = m_open.end()
    rest = content[open_end:]
    depth = 0
    for m in re.finditer(r'<div[\s>]|</div>', rest):
        tag = m.group()
        if '<div' in tag:
            depth += 1
        elif '</div>' in tag:
            if depth == 0:
                close_pos = open_end + m.start()
                return content[:open_end] + '\n' + original_html.rstrip() + '\n            ' + content[close_pos:]
            depth -= 1
    return None


def fill_html_file(html_path, original_html):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    result = find_and_replace_original(content, original_html)
    if result is None:
        print(f"    ❌ 未找到 id='original' tab: {os.path.basename(html_path)}")
        return False
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(result)
    print(f"    ✅ 已填充: {os.path.basename(html_path)}")
    return True


# ============================================================
#  创建新HTML文件
# ============================================================

def extract_meta(cleaned, txt_name):
    meta = {'title': txt_name, 'author': '未知', 'date': '', 'cat': '哲学基础'}
    head = cleaned[:2000]
    if '马克思' in head and '恩格斯' not in head[:100]:
        meta['author'] = '马克思'
    if '恩格斯' in head:
        meta['author'] = meta['author'] + '恩格斯' if meta['author'] != '未知' else '恩格斯'
    if '列宁' in head:
        meta['author'] = '列宁'
    dm = re.search(r'（(\d{4}年[^）]*)）', head)
    if dm:
        meta['date'] = dm.group(1)
    if '帝国主义' in txt_name or '资本主义' in txt_name:
        meta['cat'] = '政治经济学'
    elif '革命' in txt_name or '马克思主义的三个来源' in txt_name:
        meta['cat'] = '政治理论'
    elif '费尔巴哈' in txt_name or '1844' in txt_name or '黑格尔' in txt_name or '意识形态' in txt_name:
        meta['cat'] = '哲学基础'
    elif '反杜林' in txt_name:
        meta['cat'] = '哲学基础'
    return meta


def create_new_html(txt_path, slug, txt_name):
    template_path = os.path.join(HTML_DIR, '_template.html')
    if not os.path.exists(template_path):
        print(f"    ❌ 模板不存在")
        return False
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    with open(txt_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    cleaned = clean_text(raw)
    chapters = parse_for_file(cleaned, txt_name)
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
    result = find_and_replace_original(html, original_html)
    if result is None:
        print(f"    ⚠️  模板无 original tab，跳过")
        return False
    html = result
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
        return
    if not os.path.exists(html_path):
        print(f"    ❌ HTML不存在")
        return
    with open(txt_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    cleaned = clean_text(raw)
    chapters = parse_for_file(cleaned, txt_name)
    if not chapters:
        print(f"    ❌ 未解析到章节")
        return
    original_html = chapters_to_html(chapters, txt_name)
    fill_html_file(html_path, original_html)


def process_create(txt_name, slug):
    txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
    print(f"\n创建: {txt_name} → {slug}.html")
    if not os.path.exists(txt_path):
        print(f"    ❌ TXT不存在")
        return
    create_new_html(txt_path, slug, txt_name)


def main():
    print("=" * 60)
    print("TXT → HTML 原文tab 转换工具 v8（逐行检测）")
    print("=" * 60)
    fill_tasks = [
        ('1844年经济学哲学手稿', '1844-nian-jing-ji-xue-zhe-xue-shou-gao'),
        ('关于费尔巴哈的提纲', 'guan-yu-fei-er-ba-ha-de-ti-gang'),
        ('帝国主义是资本主义的最高阶段', 'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan'),
        ('德意志意识形态_第一章_费尔巴哈', 'de-yi-zhi-yi-xing-tai-fei-er-ba-ha'),
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
