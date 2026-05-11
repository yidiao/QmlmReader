#!/usr/bin/env python3
"""
TXT转HTML原文tab内容生成器
解析D:/图片/红色/新增文章/中的TXT文件，
生成适合插入HTML "原文" tab的章节HTML，
并自动填充到对应的HTML文件中。
"""

import re
import os
import sys

TXT_DIR = 'D:/图片/红色/新增文章'
HTML_DIR = 'D:/Qmlmreader/articles'

# TXT文件名 → HTML slug 映射
TXT_TO_SLUG = {
    '1844年经济学哲学手稿': '1844-nian-jing-ji-xue-zhe-xue-shou-gao',
    '关于费尔巴哈的提纲': 'guan-yu-fei-er-ba-ha-de-ti-gang',
    '反杜林论_社会主义编': 'fan-du-lin-lun-she-hui-zhu-yi-bian',
    '帝国主义是资本主义的最高阶段': 'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan',
    '德意志意识形态_第一章_费尔巴哈': 'de-yi-zhi-yi-xing-tai',
    '论我国革命': 'lun-wo-guo-ge-ming',
    '马克思主义的三个来源和三个组成部分': 'ma-ke-si-zhu-yi-de-san-ge-lai-yuan',
    '黑格尔法哲学批判导言': 'hei-ge-er-fa-zhe-xue-pi-pan-dao-yan',
}

# OCR常见错误替换表
OCR_FIXES = [
    ('晗', '哈'),
    ('窖体', '客体'), ('窑体', '客体'),
    ('亘观', '直观'),
    ('害体', '客体'),
    ('研李', '研究'),
    ('李', '究'),  # 需要上下文判断，这里先放通用替换
    ('demean', ''),  # 占位，实际不用
    ('经院哲学 181', '经院哲学'),
    ('5∞', ''),
    ('5∞ ', ''),
    ('J80', ''),
    ('J11l', ''),
    ('182', ''),
    ('67', ''),
    ('64', ''),
    ('65', ''),
    ('gration', ''),
    ('融合', ''),  # 可能是OCR错误，需判断
    # 修复断行导致的多余空格
    (r'(?<=\S) (?=\S)', ''),  # 这个太激进，下面单独处理
]

def clean_ocr(text):
    """清理OCR错误和格式化问题"""
    # 删除页眉页脚残留（纯数字行、单字符行）
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        stripped = line.strip()
        # 跳过纯页码行
        if re.match(r'^\d+$', stripped):
            continue
        # 跳过过短的页眉（如 J80, 181 等）
        if re.match(r'^[A-Z]?\d{1,4}[A-Z]?$', stripped):
            continue
        cleaned.append(line)
    text = '\n'.join(cleaned)
    
    # 修复常见错字
    fixes = [
        ('费尔巴晗', '费尔巴哈'),
        ('窑体', '客体'),
        ('窖体', '客体'),
        ('亘观', '直观'),
        ('害体', '客体'),
        ('研李', '研究'),
        ('demean', ''),
        ('ilde', ''),
        ('融合', ''),
        # 删除孤立的页码/注释编号（行首）
        (r'^\s*\d{1,4}\s+', ''),
    ]
    for old, new in fixes:
        text = text.replace(old, new)
    
    # 合并被错误断行的段落（中文：非标点结尾的行 + 下一行）
    # 规则：如果一行不以标点结尾，且下一行不以标点/数字/字母开头，则合并
    lines = text.split('\n')
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        # 如果当前行不以标点结尾，尝试与下一行合并
        if line and i + 1 < len(lines):
            next_line = lines[i+1].strip()
            if (not re.search(r'[。！？；：…"—」』）】\s]$', line) and 
                next_line and not re.match(r'[0-9①②③④⑤⑥⑦⑧⑨⑩]', next_line)):
                # 合并
                merged.append(line + next_line)
                i += 2
                continue
        merged.append(line)
        i += 1
    text = '\n'.join(merged)
    
    return text

def extract_metadata(content):
    """从TXT开头提取标题、作者、日期"""
    meta = {'title': '', 'author': '', 'date': '', 'intro': ''}
    
    # 标题：第一个非空的 === 分隔行之后的第一行
    m = re.search(r'={5,}\n(.+?)\n={5,}', content)
    if m:
        meta['title'] = m.group(1).strip()
    
    # 作者和日期：标题行之后，分隔行之前
    m = re.search(r'={5,}\n.+?\n(.+?)\n={5,}', content, re.DOTALL)
    if m:
        author_line = m.group(1).strip()
        # 提取作者
        am = re.search(r'(卡·马克思|弗·恩格斯|列宁|马克思|恩格斯|卡·马|弗·恩)', author_line)
        if am:
            meta['author'] = am.group(1)
        # 提取日期
        dm = re.search(r'（(\d{4}年[^）]*)）|（(\d{4}年\d+月)）', author_line)
        if dm:
            meta['date'] = dm.group(1) or dm.group(2)
    
    return meta

def identify_chapters(content, filename):
    """
    识别TXT中的章节结构
    返回: [(chapter_title, chapter_content), ...]
    """
    # 策略1: 查找 ## 一、## 二 模式
    pattern1 = re.findall(r'##\s*([一二三四五六七八九十]+[、．\.]\s*.+?)(?=\n)|^##\s*([一二三四五六七八九十]+)\s*$', content, re.MULTILINE)
    
    # 策略2: 查找 一、二、三、 模式（行首）
    pattern2 = re.findall(r'^(一、|二、|三、|四、|五、|六、|七、|八、|九、|十、)(.+)$', content, re.MULTILINE)
    
    # 策略3: 查找 1. 2. 3. 模式（行首，用于《关于费尔巴哈的提纲》）
    pattern3 = re.findall(r'^(\d+)\.(.+)$', content, re.MULTILINE)
    
    # 策略4: 查找 （一）、（二）模式
    pattern4 = re.findall(r'^（([一二三四五六七八九十]+)）(.+)$', content, re.MULTILINE)
    
    # 根据文件名选择合适的策略
    if '帝国主义' in filename or '马克思主义的三个来源' in filename or '论我国革命' in filename:
        # 使用 ## 模式
        return parse_double_hash(content)
    elif '费尔巴哈的提纲' in filename:
        # 使用 1. 2. 3. 模式
        return parse_numbered(content)
    else:
        # 尝试自动识别
        return parse_auto(content, filename)

def parse_double_hash(content):
    """解析 ## 一、## 二 格式"""
    # 按 ## 分割
    parts = re.split(r'\n##\s*', content)
    chapters = []
    
    for i, part in enumerate(parts):
        if not part.strip():
            continue
        # 第一行是标题
        lines = part.strip().split('\n', 1)
        title = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ''
        
        # 清理标题中的序号前缀
        title = re.sub(r'^[一二三四五六七八九十]+[\s、．\.]+', '', title)
        title = re.sub(r'^\d+[\s、．\.]+', '', title)
        
        if title:
            chapters.append((title, body))
    
    return chapters

def parse_numbered(content):
    """解析 1. 2. 3. 格式（如《关于费尔巴哈的提纲》共11条）"""
    # 按 数字. 分割
    parts = re.split(r'\n(?=\d+[\.、])', content)
    chapters = []
    
    for part in parts:
        if not part.strip():
            continue
        lines = part.strip().split('\n', 1)
        # 第一行包含编号和标题
        first_line = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ''
        
        # 提取标题（去掉编号）
        title = re.sub(r'^\d+[\.、]\s*', '', first_line)
        if not title:
            title = first_line
        
        chapters.append((title, body))
    
    return chapters

def parse_auto(content, filename):
    """自动识别章节结构"""
    chapters = []
    
    # 尝试查找 ## 模式
    hash_matches = list(re.finditer(r'##\s*(.+?)(?=\n|$)', content, re.MULTILINE))
    if len(hash_matches) >= 2:
        return parse_double_hash(content)
    
    # 尝试查找 一、二、 模式
    num_matches = list(re.finditer(r'^(一、|二、|三、|四、|五、)', content, re.MULTILINE))
    if len(num_matches) >= 2:
        return parse_numbered_sections(content)
    
    # 都没有：整个文档作为一章
    # 取第一行作为标题
    lines = content.strip().split('\n')
    title = lines[0].strip() if lines else '正文'
    body = '\n'.join(lines[1:]).strip()
    chapters.append((title, body))
    
    return chapters

def parse_numbered_sections(content):
    """解析 一、二、 格式的章节"""
    # 按 一、二、等分割
    pattern = r'\n(?=[一二三四五六七八九十]、)'
    parts = re.split(pattern, content)
    chapters = []
    
    for part in parts:
        if not part.strip():
            continue
        lines = part.strip().split('\n', 1)
        first_line = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ''
        
        # 提取标题（去掉序号）
        title = re.sub(r'^[一二三四五六七八九十]、\s*', '', first_line)
        if not title:
            title = first_line
        
        chapters.append((title, body))
    
    return chapters

def chapters_to_html(chapters, txt_filename):
    """将章节列表转换为HTML"""
    html_parts = []
    
    # 添加阅读提示
    title = os.path.splitext(txt_filename)[0]
    intro = f'<div class="text-intro"><p><strong>阅读提示：</strong>本文共{len(chapters)}个章节。建议按顺序阅读，重点理解各章节核心论点。</p></div>\n'
    html_parts.append(intro)
    
    for i, (title, body) in enumerate(chapters):
        # 清理body中的多余空行
        body = re.sub(r'\n{3,}', '\n\n', body)
        # 将段落转换为 <p> 标签
        paragraphs = [p.strip() for p in body.split('\n\n') if p.strip()]
        body_html = '\n'.join(f'<p>{p}</p>' for p in paragraphs)
        
        # 章节HTML
        chapter_html = f'''                <div class="chapter">
                    <h3 class="chapter-title" onclick="toggleChapter(this)">
                        <span class="toggle-icon">▼</span>
                        {title}
                    </h3>
                    <div class="chapter-content">
                        {body_html}
                    </div>
                </div>
'''
        html_parts.append(chapter_html)
    
    return '\n'.join(html_parts)

def insert_into_html(html_path, original_content):
    """将原文内容插入到HTML文件的 id='original' tab中"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找 id="original" 的 tab-content div
    # 替换其中的内容（保留 tab-content 标签本身）
    pattern = r'(<div class="tab-content active" id="original">)(.*?)(</div>\s*</div>)'
    
    # 更精确的匹配：找到 id="original" 的div，然后找到对应的关闭标签
    # 使用非贪婪匹配
    m = re.search(r'<div class="tab-content[^"]*" id="original">', content)
    if not m:
        print(f"  ⚠️  未找到 id='original' tab in {html_path}")
        return False
    
    start = m.end()
    # 找到对应的 </div> 关闭标签（需要考虑嵌套）
    # 简单策略：找到 </div> 后检查是否匹配
    # 更安全：替换从 start 到下一个 tab 或文件末尾
    rest = content[start:]
    # 查找下一个 tab 或 </div> 序列
    end_m = re.search(r'\n        </div>\s*\n        <div class="tab-content', rest)
    if not end_m:
        end_m = re.search(r'\n        </div>\s*\n    </main>', rest)
    
    if not end_m:
        print(f"  ⚠️  未找到原文tab的结束位置 in {html_path}")
        return False
    
    end_pos = start + end_m.start()
    
    # 构建新内容
    new_content = content[:start] + '\n' + original_content + '\n            ' + content[end_pos:]
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  ✅ 已填充原文tab: {os.path.basename(html_path)}")
    return True

def create_new_html(txt_path, slug):
    """从TXT创建新的HTML文件"""
    # 读取模板
    template_path = os.path.join(HTML_DIR, '_template.html')
    if not os.path.exists(template_path):
        print(f"  ❌ 模板文件不存在: {template_path}")
        return False
    
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    
    # 读取并解析TXT
    with open(txt_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = clean_ocr(content)
    meta = extract_metadata(content)
    chapters = identify_chapters(content, os.path.basename(txt_path))
    original_html = chapters_to_html(chapters, os.path.basename(txt_path))
    
    # 替换模板中的占位符
    html = template
    title = meta['title'] or os.path.splitext(os.path.basename(txt_path))[0]
    html = html.replace('文章标题', title)
    html = html.replace('副标题/说明', '')
    html = html.replace('作者', meta['author'] or '未知')
    html = html.replace('写作日期', meta['date'] or '')
    html = html.replace('内容类型', '哲学基础')  # 默认，需根据内容调整
    
    # 替换原文tab内容
    html = re.sub(r'(<div class="tab-content active" id="original">).*?(</div>\s*</div>)', 
                  r'\1\n' + original_html + r'\n            \2',
                  html, flags=re.DOTALL)
    
    # 写入新文件
    output_path = os.path.join(HTML_DIR, slug + '.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"  ✅ 已创建新HTML: {slug}.html")
    return True

def main():
    print("=" * 60)
    print("TXT → HTML 原文tab 填充工具")
    print("=" * 60)
    print()
    
    # 处理需要填充的（有TXT有HTML）
    fill_list = [
        ('1844年经济学哲学手稿', '1844-nian-jing-ji-xue-zhe-xue-shou-gao'),
        ('关于费尔巴哈的提纲', 'guan-yu-fei-er-ba-ha-de-ti-gang'),
        ('帝国主义是资本主义的最高阶段', 'di-guo-zhu-yi-shi-zi-ben-zhu-yi-de-zui-gao-jie-duan'),
        ('德意志意识形态_第一章_费尔巴哈', 'de-yi-zhi-yi-xing-tai'),
    ]
    
    print("【第一阶段】填充已有HTML的原文tab...")
    for txt_name, slug in fill_list:
        txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
        html_path = os.path.join(HTML_DIR, slug + '.html')
        
        print(f"\n处理: {txt_name}")
        
        if not os.path.exists(txt_path):
            print(f"  ❌ TXT文件不存在: {txt_path}")
            continue
        if not os.path.exists(html_path):
            print(f"  ❌ HTML文件不存在: {html_path}")
            continue
        
        # 读取TXT
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = clean_ocr(content)
        chapters = identify_chapters(content, txt_name)
        
        if not chapters:
            print(f"  ⚠️  未识别出章节，跳过")
            continue
        
        original_html = chapters_to_html(chapters, txt_name + '.txt')
        insert_into_html(html_path, original_html)
    
    # 处理需要新建的（有TXT无HTML）
    create_list = [
        ('反杜林论_社会主义编', 'fan-du-lin-lun-she-hui-zhu-yi-bian'),
        ('论我国革命', 'lun-wo-guo-ge-ming'),
        ('马克思主义的三个来源和三个组成部分', 'ma-ke-si-zhu-yi-de-san-ge-lai-yuan'),
        ('黑格尔法哲学批判导言', 'hei-ge-er-fa-zhe-xue-pi-pan-dao-yan'),
    ]
    
    print("\n" + "=" * 60)
    print("【第二阶段】新建HTML文件...")
    for txt_name, slug in create_list:
        txt_path = os.path.join(TXT_DIR, txt_name + '.txt')
        
        print(f"\n处理: {txt_name}")
        
        if not os.path.exists(txt_path):
            print(f"  ❌ TXT文件不存在: {txt_path}")
            continue
        
        create_new_html(txt_path, slug)
    
    print("\n" + "=" * 60)
    print("完成！")
    print("=" * 60)

if __name__ == '__main__':
    main()
