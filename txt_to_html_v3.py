#!/usr/bin/env python3
"""
TXT → HTML 原文tab 转换工具 v3
- 修复章节解析（支持 1. 2. ... 11. 格式）
- 修复HTML插入逻辑（完整替换 original tab）
"""

import re
import os

TXT_DIR = 'D:/图片/红色/新增文章'
HTML_DIR = 'D:/Qmlmreader/articles'

# ============================================================
#  OCR 清理
# ============================================================

def clean_text(text):
    """清理OCR错误并规范化文本"""
    # 删除 === 分隔行
    text = re.sub(r'={5,}', '', text)
    
    # 删除页眉页脚（纯数字、J80、181等）
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        s = line.strip()
        if not s:
            cleaned.append(line)
            continue
        # 跳过纯页码
        if re.match(r'^\d+$', s):
            continue
        # 跳过单字母+数字页码
        if re.match(r'^[A-Z]?\d{1,4}[A-Z]?$', s):
            continue
        # 跳过 【XXX】 格式残留
        if re.match(r'^【\d+】$', s):
            continue
        # 跳过 5∞ 或类似符号行
        if re.match(r'^[0-9∞×]+$', s):
            continue
        cleaned.append(line)
    
    text = '\n'.join(cleaned)
    
    # 修复常见错字
    fixes = [
        ('费尔巴晗', '费尔巴哈'),
        ('费尔巳哈', '费尔巴哈'),
        ('窖体', '客体'),
        ('窑体', '客体'),
        ('害体', '客体'),
        ('亘观', '直观'),
        ('研李', '研究'),
        ('害', '客'),  # 单字错误（需谨慎，这里只修复特定语境）
        ('晗', '哈'),
        # 修复多余的符号
        ('5∞', ''),
        ('J80', ''),
        ('181', ''),
        ('5∞ ', ''),
    ]
    for old, new in fixes:
        text = text.replace(old, new)
    
    # 合并被错误拆分的段落
    # 规则：当前行不以中文标点结尾，下一行不以标点/编号/字母开头 → 合并
    lines = text.split('\n')
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if line and i + 1 < len(lines):
            next_line = lines[i+1].strip()
            if next_line:
                # 当前行不以标点结尾
                if not re.search(r'[。！？；：」』”）】…—]\s*$', line):
                    # 下一行不以标点/编号开头
                    if not re.match(r'[0-9①②③④⑤⑥⑦⑧⑨⑩#■●]', next_line):
                        # 合并（不加空格，直接拼接）
                        merged.append(line + next_line)
                        i += 2
                        continue
        merged.append(line)
        i += 1
    
    text = '\n'.join(merged)
    
    # 规范化空白行（最多一个空行）
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text


# ============================================================
#  章节解析器
# ============================================================

def parse_numbered_sections(content):
    """
    解析 1. xxx / 2. xxx / ... / 11. xxx 格式
    （如《关于费尔巴哈的提纲》共11条）
    返回: [(title, body), ...]
    """
    # 在内容前加换行，确保行首匹配
    text = '\n' + content
    
    # 找到所有 数字. 的位置
    pattern = r'\n(\d+)\.\s*'
    matches = list(re.finditer(pattern, text))
    
    if len(matches) < 2:
        return []
    
    chapters = []
    for i, m in enumerate(matches):
        num = m.group(1)
        title_start = m.end()
        
        # 找到本章结束位置
        if i + 1 < len(matches):
            body_end = matches[i+1].start()
        else:
            body_end = len(text)
        
        # 提取本章内容
        raw = text[title_start:body_end]
        
        # 第一行是标题（可能包含编号后的文字）
        raw_lines = raw.strip().split('\n', 1)
        title = raw_lines[0].strip()
        body = raw_lines[1].strip() if len(raw_lines) > 1 else ''
        
        # 清除标题中的编号前缀（应该已经被 split 去掉了，但以防万一）
        title = re.sub(r'^\d+\.\s*', '', title).strip()
        
        if title:
            chapters.append((f'{num}. {title}', body))
        else:
            chapters.append((f'第{num}条', body))
    
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
        
        # 清除标题中的序号前缀
        title_clean = re.sub(r'^[一二三四五六七八九十]+[\s、．\.]+', '', title).strip()
        title_clean = re.sub(r'^\d+[\s、．\.]+', '', title_clean).strip()
        
        if title_clean:
            chapters.append((title_clean, body))
        elif title:
            chapters.append((title, body))
    
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
        
        raw_lines = raw.split('\n', 1)
        title = raw_lines[0].strip()
        body = raw_lines[1].strip() if len(raw_lines) > 1 else ''
        
        title = re.sub(r'^[一二三四五六七八九十]+、\s*', '', title).strip()
        
        if title:
            chapters.append((f'{num}、{title}', body))
        else:
            chapters.append((f'第{num}节', body))
    
    return chapters


def parse_auto(content, filename=''):
    """自动识别章节格式"""
    # 策略1：## 格式
    if re.search(r'\n##\s', '\n' + content):
        chapters = parse_hash_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 ## 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 策略2：数字. 格式（如费尔巴哈的提纲）
    if re.search(r'\n\d+\.\s', '\n' + content):
        chapters = parse_numbered_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 数字. 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 策略3：一、二、 格式
    if re.search(r'\n[一二三四五六七八九十]+、\s', '\n' + content):
        chapters = parse_chinese_numbered(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 一、二、 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 都不匹配：整体作为一章
    print(f"    ⚠️  未识别到章节格式，将整体作为单章处理")
    lines = content.strip().split('\n', 1)
    title = lines[0].strip() if lines else '正文'
    body = lines[1].strip() if len(lines) > 1 else content.strip()
    return [(title, body)]


# ============================================================
#  HTML 生成
# ============================================================

def chapters_to_html(chapters, txt_name):
    """将章节列表转换为HTML（原文tab内容）"""
    html = f'                <div class="text-intro">\n'
    html += f'                    <p><strong>阅读提示：</strong>'
    html += f'本文共 {len(chapters)} 章，'
    if len(chapters) <= 5:
        html += '建议逐章阅读，理解各章核心论点。'
    else:
        html += '内容较多，建议分多次阅读，重点理解核心章节。'
    html += '</p>\n                </div>\n\n'
    
    for i, (title, body) in enumerate(chapters):
        # 将正文转换为 <p> 段落
        # 先按空行分割段落
        paras = [p.strip() for p in body.split('\n\n') if p.strip()]
        if not paras:
            # 没有空行分隔，按单行分段（避免单行过长）
            paras = []
            current = []
            for line in body.split('\n'):
                line = line.strip()
                if not line:
                    if current:
                        paras.append(''.join(current))
                        current = []
                else:
                    current.append(line)
            if current:
                paras.append(''.join(current))
        
        body_html = '\n                        '.join(f'<p>{p}</p>' for p in paras)
        
        # 章节HTML
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
#  插入到已有HTML
# ============================================================

def find_original_tab_range(content):
    """
    找到 id="original" 的 tab-content div 的起止位置
    返回 (start, end) 或 None
    """
    # 找到 <div ... id="original"> 的开始标签
    m_start = re.search(r'<div\s+class="tab-content[^"]*"\s+id="original">', content, re.IGNORECASE)
    if not m_start:
        # 尝试另一种格式
        m_start = re.search(r'<div\s+id="original"\s+class="tab-content[^"]*">', content, re.IGNORECASE)
    if not m_start:
        return None
    
    start_pos = m_start.end()  # 开始标签后的位置
    
    # 从 start_pos 开始，找到匹配的 </div>
    # 需要计算嵌套深度
    rest = content[start_pos:]
    depth = 0
    in_original = True
    pos = 0
    
    for m in re.finditer(r'<div[\s>]|</div>', rest):
        tag = m.group()
        if '<div' in tag:
            depth += 1
        elif '</div>' in tag:
            if depth == 0:
                # 这是 original tab 的结束标签
                end_pos = start_pos + m.start()
                return (m_start.start(), end_pos + 6)  # +6 是 </div> 的长度
            depth -= 1
    
    return None


def insert_original_into_html(html_path, original_html):
    """将 original_html 替换到 HTML 文件的 id="original" tab 中"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    result = find_original_tab_range(content)
    if not result:
        print(f"    ❌ 未找到 id='original' tab 的范围: {os.path.basename(html_path)}")
        return False
    
    start_pos, end_pos = result
    
    # 构建新内容
    before = content[:start_pos]
    after = content[end_pos:]
    
    # original_html 前后需要换行保持格式
    new_content = before + original_html.rstrip() + after
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"    ✅ 已填充原文tab: {os.path.basename(html_path)}")
    return True


# ============================================================
#  创建新HTML
# ============================================================

def create_new_html(txt_path, slug, txt_name):
    """从TXT创建新的HTML文件（基于_template.html）"""
    template_path = os.path.join(HTML_DIR, '_template.html')
    
    if not os.path.exists(template_path):
        print(f"    ❌ 模板不存在: {template_path}")
        return False
    
    # 读取模板
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    
    # 读取并解析TXT
    with open(txt_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    
    cleaned = clean_text(raw)
    chapters = parse_auto(cleaned, txt_name)
    
    if not chapters:
        print(f"    ❌ 未解析到章节")
        return False
    
    original_html = chapters_to_html(chapters, txt_name)
    
    # 提取元数据
    meta_title = txt_name
    meta_author = ''
    meta_date = ''
    meta_cat = '哲学基础'
    
    # 从清理后的内容开头提取
    first_lines = cleaned.split('\n')[:15]
    full_header = '\n'.join(first_lines)
    
    # 提取作者
    if '卡·马克思' in full_header or '马克思' in full_header:
        if '恩格斯' in full_header:
            meta_author = '马克思 恩格斯'
        else:
            meta_author = '马克思'
    if '列宁' in full_header:
        meta_author = '列宁'
    
    # 提取日期
    dm = re.search(r'（(\d{4}年[^）]*)）', full_header)
    if dm:
        meta_date = dm.group(1)
    
    # 判断分类
    if '帝国主义' in txt_name or '资本主义' in txt_name:
        meta_cat = '政治经济学'
    elif '费尔巴哈' in txt_name or '意识形态' in txt_name or '1844' in txt_name or '黑格尔' in txt_name:
        meta_cat = '哲学基础'
    elif '革命' in txt_name or '马克思主义的三个来源' in txt_name:
        meta_cat = '政治理论'
    elif '反杜林' in txt_name:
        meta_cat = '哲学基础'  # 反杜林论是哲学著作
    
    # 替换模板占位符
    html = template
    html = html.replace('文章标题', meta_title)
    html = html.replace('副标题/说明', '')
    html = html.replace('作者', meta_author or '未知')
    html = html.replace('写作日期', meta_date or '')
    html = html.replace('内容类型', meta_cat)
    html = html.replace('data-category="政治理论"', f'data-category="{meta_cat}"')
    
    # 替换原文tab内容
    # 找到模板中的原文tab占位内容并替换
    result = find_original_tab_range(html)
    if result:
        start_pos, end_pos = result
        before = html[:start_pos]
        after = html[end_pos:]
        html = before + original_html.rstrip() + after
    else:
        print(f"    ⚠️  模板中未找到 id='original' tab，跳过: {slug}")
        return False
    
    # 写入文件
    output_path = os.path.join(HTML_DIR, slug + '.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"    ✅ 已创建: {slug}.html")
    return True


# ============================================================
#  主流程
# ============================================================

def process_fill(txt_name, slug):
    """处理需要填充原文tab的已有HTML"""
    txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
    html_path = os.path.join(HTML_DIR, slug + '.html')
    
    print(f"\n处理: {txt_name}")
    
    if not os.path.exists(txt_path):
        print(f"    ❌ TXT不存在: {txt_path}")
        return False
    if not os.path.exists(html_path):
        print(f"    ❌ HTML不存在: {html_path}")
        return False
    
    # 读取并清理TXT
    with open(txt_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    
    cleaned = clean_text(raw)
    
    # 解析章节
    chapters = parse_auto(cleaned, txt_name)
    
    if not chapters:
        print(f"    ❌ 未解析到章节")
        return False
    
    # 生成HTML
    original_html = chapters_to_html(chapters, txt_name)
    
    # 插入到HTML
    return insert_original_into_html(html_path, original_html)


def process_create(txt_name, slug):
    """创建新的HTML文件"""
    txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
    
    print(f"\n创建: {txt_name} → {slug}.html")
    
    if not os.path.exists(txt_path):
        print(f"    ❌ TXT不存在: {txt_path}")
        return False
    
    return create_new_html(txt_path, slug, txt_name)


def main():
    print("=" * 60)
    print("TXT → HTML 原文tab 转换工具 v3")
    print("=" * 60)
    
    # 需要填充的（有TXT有HTML）
    fill_tasks = [
        ('1844年经济学哲学手稿', '1844-nian-jing-ji-xue-zhe-xue-shou-gao'),
        ('关于费尔巴哈的提纲', 'guan-yu-fei-er-ba-ha-de-ti-gang'),
        ('帝国主义是资本主义的最高阶段', 'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan'),
        ('德意志意识形态_第一章_费尔巴哈', 'de-yi-zhi-yi-xing-tai'),
    ]
    
    print("\n【第一阶段】填充已有HTML的原文tab...\n")
    for txt_name, slug in fill_tasks:
        process_fill(txt_name, slug)
    
    # 需要创建的（有TXT无HTML）
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
