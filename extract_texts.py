#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 Word 文件提取纯文本备份到 data/ 目录
同时从 rectify HTML 文件中提取正名文章的纯文本备份
"""

import os
import re

# ==============================
# 1. 从 Word 提取列宁/斯大林文章
# ==============================

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False
    print("⚠️ python-docx 未安装，将跳过 Word 提取")

def extract_word_to_txt(docx_path, txt_path, title=''):
    """从 Word 文件提取纯文本"""
    doc = Document(docx_path)
    lines = []
    if title:
        lines.append(title)
        lines.append('=' * len(title.encode('gbk', errors='replace')))
        lines.append('')
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            lines.append(text)
        else:
            lines.append('')
    content = '\n'.join(lines)
    # 清理多余空行（超过2行连续空行 → 2行）
    content = re.sub(r'\n{3,}', '\n\n', content)
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return len(content)

data_dir = 'D:/Qmlmreader/data'

if HAS_DOCX:
    word_sources = [
        {
            'src': 'D:/图片/红色/毛选/列宁选集文章Word/怎么办？.docx',
            'dst': f'{data_dir}/zen-me-ban.txt',
            'title': '怎么办？（列宁，1901-1902年）'
        },
        {
            'src': 'D:/图片/红色/毛选/列宁选集文章Word/唯物主义和经验批判主义.docx',
            'dst': f'{data_dir}/wei-wu-zhu-yi.txt',
            'title': '唯物主义和经验批判主义（列宁，1908年）'
        },
        {
            'src': 'D:/图片/红色/毛选/列宁选集文章Word/国家与革命.docx',
            'dst': f'{data_dir}/guo-jia-yu-ge-ming.txt',
            'title': '国家与革命（列宁，1917年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★★][政治理论] 论列宁主义基础.docx',
            'dst': f'{data_dir}/lun-lunen-zhu-yi-ji-chu.txt',
            'title': '论列宁主义基础（斯大林，1924年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★★][中国革命] 论中国革命的前途.docx',
            'dst': f'{data_dir}/lun-zhongguo-ge-ming-de-qiantu.txt',
            'title': '论中国革命的前途（斯大林，1926年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★★][列宁研究] 论列宁.docx',
            'dst': f'{data_dir}/lun-lunen.txt',
            'title': '论列宁（斯大林，1924年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★★][政治理论] 论列宁主义的几个问题.docx',
            'dst': f'{data_dir}/lun-lunen-zhu-yi-jige-wenti.txt',
            'title': '论列宁主义的几个问题（斯大林，1926年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★☆][列宁研究] 悼列宁.docx',
            'dst': f'{data_dir}/dao-lunen.txt',
            'title': '悼列宁（斯大林，1924年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★☆][政治理论] 十月革命和俄国共产党人的策略.docx',
            'dst': f'{data_dir}/shiyue-geming-celue.txt',
            'title': '十月革命和俄国共产党人的策略（斯大林，1924年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★☆][政治理论] 十月革命的国际性质.docx',
            'dst': f'{data_dir}/shiyue-geming-guoji.txt',
            'title': '十月革命的国际性质（斯大林，1927年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★☆][民族问题] 十月革命和民族问题.docx',
            'dst': f'{data_dir}/shiyue-geming-minzu.txt',
            'title': '十月革命和民族问题（斯大林，1917年）'
        },
        {
            'src': 'D:/图片/红色/毛选/斯大林选集-四星五星文章-Word/[★★★★☆][民族问题] 马克思主义和民族问题.docx',
            'dst': f'{data_dir}/makesi-zhuyi-minzu.txt',
            'title': '马克思主义和民族问题（斯大林，1913年）'
        },
    ]

    print('=== 从 Word 提取文本 ===')
    for item in word_sources:
        src = item['src']
        dst = item['dst']
        if not os.path.exists(src):
            print(f'  ⚠️ 文件不存在: {os.path.basename(src)}')
            continue
        if os.path.exists(dst):
            print(f'  ⏭️ 已存在，跳过: {os.path.basename(dst)}')
            continue
        try:
            size = extract_word_to_txt(src, dst, item['title'])
            print(f'  ✅ {os.path.basename(dst)} ({size:,} 字符)')
        except Exception as e:
            print(f'  ❌ 失败: {os.path.basename(src)}: {e}')

# ==============================
# 2. 从 rectify HTML 提取正名文章文本
# ==============================

def extract_html_text(html_path, output_path, title=''):
    """从 HTML 提取主要文本内容（去除标签）"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取 <article> 或 <main> 或 body 的主体内容
    # 先去掉 script/style
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL)
    # 去掉 header/nav/footer
    content = re.sub(r'<header[^>]*>.*?</header>', '', content, flags=re.DOTALL)
    content = re.sub(r'<nav[^>]*>.*?</nav>', '', content, flags=re.DOTALL)
    content = re.sub(r'<footer[^>]*>.*?</footer>', '', content, flags=re.DOTALL)

    # 段落标签替换为换行
    content = re.sub(r'<p[^>]*>', '', content)
    content = re.sub(r'</p>', '\n\n', content)
    content = re.sub(r'<br\s*/?>', '\n', content)
    content = re.sub(r'<h[1-6][^>]*>', '\n\n', content)
    content = re.sub(r'</h[1-6]>', '\n', content)
    content = re.sub(r'<li[^>]*>', '\n• ', content)
    content = re.sub(r'</li>', '', content)
    # 去掉其他所有 HTML 标签
    content = re.sub(r'<[^>]+>', '', content)
    # HTML 实体
    content = content.replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('&quot;', '"').replace('&#39;', "'")
    # 清理多余空白
    content = re.sub(r'\n{3,}', '\n\n', content)
    content = re.sub(r'[ \t]{2,}', ' ', content)
    content = content.strip()

    # 添加标题头
    if title:
        header = f'{title}\n{"=" * min(50, len(title)*2)}\n\n'
        content = header + content

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return len(content)

print('\n=== 从 rectify HTML 提取正名文章文本 ===')
rectify_sources = [
    {
        'src': 'D:/Qmlmreader/rectify/leaders/stalin-era.html',
        'dst': f'{data_dir}/rectify-stalin-era.txt',
        'title': '历史的审判台：苏联七十年兴亡再思考'
    },
    {
        'src': 'D:/Qmlmreader/rectify/leaders/gorky-lenin.html',
        'dst': f'{data_dir}/rectify-gorky-lenin.txt',
        'title': '高尔基与列宁决裂，因为列宁滥杀知识分子？'
    },
    {
        'src': 'D:/Qmlmreader/rectify/military/finland-war.html',
        'dst': f'{data_dir}/rectify-finland-war.txt',
        'title': '苏联攻打芬兰是侵略？过当防卫！'
    },
    {
        'src': 'D:/Qmlmreader/rectify/military/soviet-afghanistan.html',
        'dst': f'{data_dir}/rectify-soviet-afghanistan.txt',
        'title': '苏联"入侵"阿富汗？还原1979年出兵决策的真实逻辑'
    },
    {
        'src': 'D:/Qmlmreader/rectify/economy/soviet-agriculture.html',
        'dst': f'{data_dir}/rectify-soviet-agriculture.txt',
        'title': '苏联农业社会主义的探索：饥荒、集体化与面包队伍的真相'
    },
    {
        'src': 'D:/Qmlmreader/rectify/myths/wisdom-of-elites.html',
        'dst': f'{data_dir}/rectify-wisdom-of-elites.txt',
        'title': '驳"你不能相信人民的智慧"——精英统治的当代翻版'
    },
    {
        'src': 'D:/Qmlmreader/rectify/myths/human-nature.html',
        'dst': f'{data_dir}/rectify-human-nature.txt',
        'title': '驳"人性论"的互联网第二春'
    },
]

for item in rectify_sources:
    if not os.path.exists(item['src']):
        print(f'  ⚠️ 文件不存在: {item["src"]}')
        continue
    try:
        size = extract_html_text(item['src'], item['dst'], item['title'])
        print(f'  ✅ {os.path.basename(item["dst"])} ({size:,} 字符)')
    except Exception as e:
        print(f'  ❌ 失败: {os.path.basename(item["src"])}: {e}')

print('\n全部完成！')
