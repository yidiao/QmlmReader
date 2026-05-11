#!/usr/bin/env python3
"""
TXT → HTML 原文tab 转换工具 v5
修复章节解析（数字编号格式）+ 正确的HTML插入
"""

import re
import os

TXT_DIR = 'D:/图片/红色/新增文章'
HTML_DIR = 'D:/Qmlmreader/articles'

# ============================================================
#  OCR清理
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
        ('晗', '哈'),
        ('5∞', ''), ('J80', ''), ('181', ''),
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
#  章节解析器（修复版）
# ============================================================

def parse_numbered_sections(content):
    """
    解析 1.标题 / 2.标题 格式（费尔巴哈的提纲等）
    正确捕获每个编号后的标题和正文
    """
    text = '\n' + content
    # 找到所有 \n数字. 的位置
    pattern = r'\n(\d+)\.'
    matches = list(re.finditer(pattern, text))
    if len(matches) < 2:
        return []
    
    chapters = []
    for i, m in enumerate(matches):
        num = m.group(1)
        # 标题 = 数字. 之后到行尾
        after_dot = m.end()
        line_end = text.find('\n', after_dot)
        if line_end == -1:
            line_end = len(text)
        title = text[after_dot:line_end].strip()
        if not title:
            title = f'第{num}条'
        
        # 正文 = 标题行尾到下一章开始
        body_start = line_end
        body_end = matches[i+1].start() if i + 1 < len(matches) else len(text)
        body = text[body_start:body_end].strip()
        
        chapters.append((f'{num}. {title}', body))
    
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
    pattern = r'\n([一二三四五六七八九十]+)、\s*'
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
        title = re.sub(r'^[一二三四五六七八九十]+、\s*', '', title).strip()
        if not title:
            title = raw[:30]
        chapters.append((f'{num}、{title}', body))
    return chapters


def parse_1844_sections(content):
    """解析1844手稿：按【XXX】或 序言/第一手稿/第二手稿 等标记"""
    text = '\n' + content
    # 查找 【 】 标记
    bracket_ms = list(re.finditer(r'\n【([^】]+)】', text))
    if len(bracket_ms) >= 2:
        chapters = []
        for i, m in enumerate(bracket_ms):
            title = m.group(1).strip()
            start = m.end()
            end = bracket_ms[i+1].start() if i + 1 < len(bracket_ms) else len(text)
            body = text[start:end].strip()
            chapters.append((title, body))
        return chapters
    
    # 查找 序言 / 第一 / 第二 / 第三
    markers = ['序言', '序\n', '第一', '第二', '第三', '附录']
    positions = []
    for mk in markers:
        idx = text.find(mk)
        if idx >= 0:
            positions.append((idx, mk))
    positions.sort()
    if len(positions) >= 2:
        chapters = []
        for i, (pos, mk) in enumerate(positions):
            title = mk.replace('\n', '')
            start = pos + len(mk)
            end = positions[i+1][0] if i + 1 < len(positions) else len(text)
            body = text[start:end].strip()
            chapters.append((title, body))
        return chapters
    return []


def parse_zhiyishi(content):
    """解析德意志意识形态"""
    text = '\n' + content
    # 查找 [I] [II] [III] [IV]
    roman_ms = list(re.finditer(r'\n\[(I{1,4})\]\s*', text))
    if len(roman_ms) >= 2:
        chapters = []
        for i, m in enumerate(roman_ms):
            title = f'第{m.group(1)}节'
            start = m.end()
            end = roman_ms[i+1].start() if i + 1 < len(roman_ms) else len(text)
            body = text[start:end].strip()
            chapters.append((title, body))
        return chapters
    # 尝试 一、 二、
    return parse_chinese_numbered(content)


def parse_auto(content, filename=''):
    if '1844' in filename:
        chapters = parse_1844_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 [1844手稿格式] 找到 {len(chapters)} 个章节")
            return chapters
    
    if '意识形态' in filename:
        chapters = parse_zhiyishi(content)
        if len(chapters) >= 2:
            print(f"    📝 [意识形态格式] 找到 {len(chapters)} 个章节")
            return chapters
    
    # 通用检测（顺序：## > 数字. > 一、）
    if re.search(r'\n##\s', text if 'text' in dir() else '\n' + content):
        chapters = parse_hash_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 [## 格式] 找到 {len(chapters)} 个章节")
            return chapters
    
    if re.search(r'\n\d+\.', '\n' + content):
        chapters = parse_numbered_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 [数字. 格式] 找到 {len(chapters)} 个章节")
            return chapters
    
    if re.search(r'\n[一二三四五六七八九十]+、\s', '\n' + content):
        chapters = parse_chinese_numbered(content)
        if len(chapters) >= 2:
            print(f"    📝 [一、格式] 找到 {len(chapters)} 个章节")
            return chapters
    
    print(f"    ⚠️  未识别章节格式，整体作为单章")
    lines = content.strip().split('\n', 1)
    title = lines[0].strip() if lines else '正文'
    body = lines[1].strip() if len(lines) > 1 else content.strip()
    return [(title, body)]


# ============================================================
#  HTML 生成
# ============================================================

def chapters_to_html(chapters, txt_name):
    html = f'                <div class="text-intro">\n'
    html += f'                    <p><strong>阅读提示：</strong>'
    html += f'本文共 {len(chapters)} 章，'
    if len(chapters) <= 3:
        html += '建议逐章阅读。'
    elif len(chapters) <= 8:
        html += '建议分多次阅读，理解各章核心。'
    else:
        html += '内容较多，建议把握核心章节。'
    html += '</p>\n                </div>\n\n'
    
    for i, (title, body) in enumerate(chapters):
        paras = [p.strip() for p in body.split('\n\n') if p.strip()]
        if not paras:
            paras = [p.strip() for p in body.split('\n') if p.strip()]
        body_html = '\n                        '.join(f'<p>{p}</p>' for p in paras)
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
#  找到 original tab 并替换内容（简化版）
# ============================================================

def find_and_replace_original_tab(content, original_html):
    """
    找到 <div ... id="original"> ... </div> 范围，
    替换为新的 original_html。
    返回新 content，或 None（未找到）。
    """
    # 找 opening tag（更宽松的正则）
    m_open = re.search(r'<div[^>]*id="original"[^>]*>', content, re.IGNORECASE)
    if not m_open:
        # 尝试反之
        m_open = re.search(r'<div[^>]*id="original"[^>]*>', content, re.IGNORECASE)
    if not m_open:
        return None
    
    open_end = m_open.end()   # > 之后的位置
    
    # 找对应的 </div>
    # 从 open_end 开始，追踪嵌套深度
    rest = content[open_end:]
    depth = 0
    pos = 0
    for m in re.finditer(r'<div[\s>]|</div>', rest):
        tag = m.group()
        if '<div' in tag:
            depth += 1
        elif '</div>' in tag:
            if depth == 0:
                # 这是 original tab 的结束
                close_pos = open_end + m.start()
                # 构建新 content
                new_content = content[:open_end] + '\n' + original_html.rstrip() + '\n            ' + content[close_pos:]
                return new_content
            depth -= 1
    
    return None  # 未找到结束标签


def fill_html_file(html_path, original_html):
    """填充HTML文件的原文tab"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    result = find_and_replace_original_tab(content, original_html)
    if result is None:
        print(f"    ❌ 未找到 id='original' tab: {os.path.basename(html_path)}")
        return False
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(result)
    print(f"    ✅ 已填充: {os.path.basename(html_path)}")
    return True


# ============================================================
#  创建新HTML
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
        print(f"    ❌ 模板不存在")
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
    result = find_and_replace_original_tab(html, original_html)
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
    chapters = parse_auto(cleaned, txt_name)
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
    print("TXT → HTML 原文tab 转换工具 v5")
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
