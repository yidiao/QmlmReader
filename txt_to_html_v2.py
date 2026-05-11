#!/usr/bin/env python3
"""
TXT → HTML 原文tab 转换工具（稳健版）
逐个文件处理，支持多种章节格式
"""

import re
import os

TXT_DIR = 'D:/图片/红色/新增文章'
HTML_DIR = 'D:/Qmlmreader/articles'

# ============================================================
#  OCR 清理
# ============================================================

OCR_FIXES = [
    ('费尔巴晗', '费尔巴哈'),
    ('窖体', '客体'), ('窑体', '客体'), ('害体', '客体'),
    ('亘观', '直观'),
    ('研李', '研究'),
    ('害', '客'),       # 单字错误
    ('晗', '哈'),       # 单字错误
    # 删除孤立的OCR残留
    (r'^\s*[Jj]\d+\s*$', ''),
    (r'^\s*\d{1,4}\s*$', ''),
    (r'【\d+】', ''),
    # 合并被错误拆分的行（中文无标点结尾 + 下行无编号/无标点开头）
]

def clean_text(text):
    """清理OCR错误并规范化文本"""
    # 删除 === 分隔行
    text = re.sub(r'={5,}', '', text)
    
    # 删除页眉页脚（纯数字、纯字母+数字）
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
        # 跳过单字母+数字页码（J80, 181等）
        if re.match(r'^[A-Z]?\d{1,4}[A-Z]?$', s):
            continue
        # 跳过 「本书...」等页眉
        if '本书' in s and len(s) < 30:
            continue
        cleaned.append(line)
    
    text = '\n'.join(cleaned)
    
    # 修复常见错字
    for old, new in OCR_FIXES:
        if old.startswith('\\'):
            text = re.sub(old, new, text, flags=re.MULTILINE)
        else:
            text = text.replace(old, new)
    
    # 合并被错误拆分的段落
    # 规则：当前行不以中文标点结尾，下一行不以标点/数字/字母开头 → 合并
    lines = text.split('\n')
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if line and i + 1 < len(lines):
            next_line = lines[i+1].strip()
            # 当前行不以标点结尾
            if not re.search(r'[。！？；：」』”）】…—]\s*$', line):
                # 下一行不以标点/编号开头
                if next_line and not re.match(r'[0-9①②③④⑤⑥⑦⑧⑨⑩#●■]', next_line):
                    # 合并
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
#  章节解析器（多种格式）
# ============================================================

def parse_numbered_sections(content):
    """解析 1. xxx / 2. xxx 格式（费尔巴哈的提纲）"""
    # 按 数字. 分割
    pattern = r'\n(?=\d+\.\s)'
    parts = re.split(pattern, '\n' + content)
    chapters = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        lines = part.split('\n', 1)
        title = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ''
        # 清除标题中的编号前缀
        title = re.sub(r'^\d+\.\s*', '', title).strip()
        if title:
            chapters.append((title, body))
    return chapters


def parse_hash_sections(content):
    """解析 ## 一 / ## 二 格式（论我国革命、马克思主义的三个来源等）"""
    # 在内容前加换行确保匹配
    text = '\n' + content
    # 找到所有 ## 标题的位置
    matches = list(re.finditer(r'\n##\s*(.+?)(?=\n|$)', text, re.MULTILINE))
    if not matches:
        return []
    
    chapters = []
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        
        # 清除标题中的序号前缀
        title = re.sub(r'^[一二三四五六七八九十]+[\s、．\.]+', '', title).strip()
        title = re.sub(r'^\d+[\s、．\.]+', '', title).strip()
        
        if title:
            chapters.append((title, body))
    
    return chapters


def parse_chinese_numbered(content):
    """解析 一、xxx / 二、xxx 格式"""
    pattern = r'\n(?=[一二三四五六七八九十]、)'
    parts = re.split(pattern, '\n' + content)
    chapters = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        lines = part.split('\n', 1)
        title = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ''
        title = re.sub(r'^[一二三四五六七八九十]、\s*', '', title).strip()
        if title:
            chapters.append((title, body))
    return chapters


def parse_auto(content, filename=''):
    """
    自动识别章节格式并使用合适的解析器
    """
    # 先检测是否有 ## 格式
    if re.search(r'\n##\s', '\n' + content):
        chapters = parse_hash_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 ## 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 检测是否有 数字. 格式
    if re.search(r'\n\d+\.\s', '\n' + content):
        chapters = parse_numbered_sections(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 数字. 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 检测是否有 一、二、 格式
    if re.search(r'\n[一二三四五六七八九十]、', '\n' + content):
        chapters = parse_chinese_numbered(content)
        if len(chapters) >= 2:
            print(f"    📝 使用 一、二、 格式解析，找到 {len(chapters)} 个章节")
            return chapters
    
    # 都不匹配：整个内容作为一章
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
        # 按空行分割段落
        paras = [p.strip() for p in body.split('\n\n') if p.strip()]
        if not paras:
            # 没有空行分隔，按单行分段
            paras = [p.strip() for p in body.split('\n') if p.strip()]
        
        body_html = '\n                        '.join(f'<p>{p}</p>' for p in paras)
        
        # 章节HTML
        icon = '▼' if i == 0 else '▶'
        html += f'                <div class="chapter">\n'
        html += f'                    <h3 class="chapter-title" onclick="toggleChapter(this)">\n'
        html += f'                        <span class="toggle-icon">{icon}</span>\n'
        html += f'                        {title}\n'
        html += f'                    </h3>\n'
        html += f'                    <div class="chapter-content{" show" if i == 0 else ""}">\n'
        html += f'                        {body_html}\n'
        html += f'                    </div>\n'
        html += f'                </div>\n\n'
    
    return html


# ============================================================
#  插入到已有HTML
# ============================================================

def insert_original_into_html(html_path, original_html):
    """
    将 original_html 插入到 HTML 文件的 id="original" tab 中
    替换原来的占位内容
    """
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找到 <div class="tab-content active" id="original"> 的位置
    m_start = re.search(r'<div class="tab-content[^"]*" id="original">', content)
    if not m_start:
        print(f"    ❌ 未找到 id='original' 的tab")
        return False
    
    start_pos = m_start.end()
    
    # 找到对应的结束 </div>
    # 从 start_pos 开始，找匹配的 </div>
    rest = content[start_pos:]
    depth = 0
    in_original = False
    pos = 0
    
    for m_div in re.finditer(r'<div["\s>]|</div>', rest):
        tag = m_div.group()
        if '<div' in tag:
            depth += 1
        elif '</div>' in tag:
            if depth == 0:
                # 这是 original tab 的结束标签
                end_pos = start_pos + m_div.start()
                # 检查这个 </div> 之后是否跟着 </div>（即 tab-content 的关闭标签）
                after = rest[m_div.end():].strip()[:50]
                break
            depth -= 1
    else:
        print(f"    ❌ 未找到 id='original' tab的结束位置")
        return False
    
    # 构建新内容：保留 tab-content 标签，替换内部内容
    before = content[:start_pos]
    after = content[end_pos:]
    
    new_content = before + '\n' + original_html.rstrip() + '\n            ' + after
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"    ✅ 已填充原文tab: {os.path.basename(html_path)}")
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
    """从TXT创建新的HTML文件"""
    txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
    output_path = os.path.join(HTML_DIR, slug + '.html')
    template_path = os.path.join(HTML_DIR, '_template.html')
    
    print(f"\n创建: {txt_name} → {slug}.html")
    
    if not os.path.exists(txt_path):
        print(f"    ❌ TXT不存在: {txt_path}")
        return False
    
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
    
    # 提取元数据（简单版）
    meta_title = txt_name
    meta_author = ''
    meta_date = ''
    meta_cat = '哲学基础'  # 默认
    
    # 尝试从TXT开头提取
    first_lines = raw.split('\n')[:10]
    for line in first_lines:
        if '马克思' in line and not meta_author:
            if '卡·马克思' in line or '马克思' in line:
                meta_author = '马克思'
            if '恩格斯' in line:
                meta_author = meta_author + '恩格斯' if meta_author else '恩格斯'
        if '列宁' in line and not meta_author:
            meta_author = '列宁'
        # 提取日期
        dm = re.search(r'（(\d{4}年[^）]*)）', line)
        if dm and not meta_date:
            meta_date = dm.group(1)
    
    # 根据内容判断分类
    if '帝国主义' in txt_name or '资本主义' in txt_name:
        meta_cat = '政治经济学'
    elif '费尔巴哈' in txt_name or '意识形态' in txt_name or '1844' in txt_name or '黑格尔' in txt_name:
        meta_cat = '哲学基础'
    elif '革命' in txt_name or '马克思主义的三个来源' in txt_name:
        meta_cat = '政治理论'
    
    # 解析章节
    chapters = parse_auto(cleaned, txt_name)
    if not chapters:
        print(f"    ❌ 未解析到章节")
        return False
    
    original_html = chapters_to_html(chapters, txt_name)
    
    # 替换模板中的占位符
    html = template
    html = html.replace('文章标题', meta_title)
    html = html.replace('副标题/说明', '')
    html = html.replace('作者', meta_author or '未知')
    html = html.replace('写作日期', meta_date or '')
    html = html.replace('内容类型', meta_cat)
    
    # data-category 属性
    html = html.replace('data-category="政治理论"', f'data-category="{meta_cat}"')
    
    # 替换原文tab内容
    html = re.sub(
        r'(<div class="tab-content active" id="original">).*?(</div>\s*</div>)',
        r'\1\n' + original_html + r'\n            \2',
        html,
        flags=re.DOTALL
    )
    
    # 写入文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"    ✅ 已创建: {slug}.html")
    return True


def main():
    print("=" * 60)
    print("TXT → HTML 原文tab 转换工具")
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
