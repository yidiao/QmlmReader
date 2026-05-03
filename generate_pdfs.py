#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根据 data/ 目录下的 TXT 原文生成 PDF，
保存到 downloads/articles/ 和 downloads/rectify/
使用 reportlab + Windows 中文字体
"""

import os, re, json
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

# ============================================================
#  字体注册
# ============================================================
FONT_PATHS = [
    r"C:\Windows\Fonts\msyh.ttc",        # 微软雅黑
    r"C:\Windows\Fonts\simsun.ttc",       # 宋体
    r"C:\Windows\Fonts\STSONG.TTF",       # 华文宋体
    r"C:\Windows\Fonts\STXIHEI.TTF",      # 华文细黑
    r"C:\Windows\Fonts\simhei.ttf",       # 黑体
]

FONT_REGISTERED = False

def register_font():
    global FONT_REGISTERED
    if FONT_REGISTERED:
        return True
    for fp in FONT_PATHS:
        if os.path.exists(fp):
            try:
                pdfmetrics.registerFont(TTFont("ChineseFont", fp, subfontIndex=0))
                pdfmetrics.registerFont(TTFont("ChineseFont-Bold", fp, subfontIndex=0))
                FONT_REGISTERED = True
                print(f"  ✓ 注册字体: {fp}")
                return True
            except Exception as e:
                print(f"  ✗ 字体加载失败 {fp}: {e}")
                continue
    print("  ✗✗ 未找到中文字体，尝试使用系统字体...")
    return False

# ============================================================
#  文章 → TXT 文件映射
# ============================================================
# data/ 目录下的 TXT 文件名 → 对应的 slug
# 注意：有些文章有 _extracted.txt，有些没有

ARTICLES_MAP = {
    # 已有 PDF 的（斯大林等）— 也重新生成
    "gongchan-dan-yuan":          "gongchan-dan-yuan.txt",
    "lun-lunen-zhu-yi-ji-chu":   "lun-lunen-zhu-yi-ji-chu.txt",
    "lun-zhongguo-ge-ming-de-qiantu": "lun-zhongguo-ge-ming-de-qiantu.txt",
    "lun-lunen":                   "lun-lunen.txt",
    "lun-lunen-zhu-yi-jige-wenti": "lun-lunen-zhu-yi-jige-wenti.txt",
    "dao-lunen":                   "dao-lunen.txt",
    "shiyue-geming-celue":         "shiyue-geming-celue.txt",
    "shiyue-geming-guoji":         "shiyue-geming-guoji.txt",
    "shiyue-geming-minzu":          "shiyue-geming-minzu.txt",
    "makesi-zhuyi-minzu":          "makesi-zhuyi-minzu.txt",
    # 列宁文章
    "zen-me-ban":                  "zen-me-ban.txt",
    "guo-jia-yu-ge-ming":          "guo-jia-yu-ge-ming.txt",
    "wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi": "wei-wu-zhu-yi.txt",
    # 毛泽东文章（使用 _extracted.txt）
    "lun-chi-jiu-zhan":           "论持久战_extracted.txt",
    "shi-jian-lun":                "实践论_extracted.txt",
    "mao-dun-lun":                 "矛盾论_extracted.txt",
    "zhan-lue-wen-ti":            "中国革命战争的战略问题_extracted.txt",
    "you-ji-zhan":                 "抗日游击战争的战略问题_extracted.txt",
    "zhan-zheng-zhan-lue":         "战争和战略问题_extracted.txt",
    "xin-min-zhu":                 "新民主主义论_extracted.txt",
    "wen-yi-zuo-tan":              "在延安文艺座谈会上的讲话_extracted.txt",
    "xue-xi-shi-ju":              "学习和时局_extracted.txt",
    "ren-min-nei-bu-mao-dun":      "关于正确处理人民内部矛盾的问题_extracted.txt",
    "nong-min-yun-dong":            "湖南农民运动考察报告_extracted.txt",
}

RECTIFY_MAP = {
    "rectify-stalin-era":      "rectify-stalin-era.txt",
    "rectify-gorky-lenin":    "rectify-gorky-lenin.txt",
    "rectify-finland-war":     "rectify-finland-war.txt",
    "rectify-soviet-afghanistan": "rectify-soviet-afghanistan.txt",
    "rectify-soviet-agriculture": "rectify-soviet-agriculture.txt",
    "rectify-wisdom-of-elites":   "rectify-wisdom-of-elites.txt",
    "rectify-human-nature":       "rectify-human-nature.txt",
}

# 标题映射（用于 PDF 封面）
TITLE_MAP = {
    "gongchan-dan-yuan":          "共产党宣言（马克思·恩格斯）",
    "lun-lunen-zhu-yi-ji-chu":   "论列宁主义基础（斯大林）",
    "lun-zhongguo-ge-ming-de-qiantu": "论中国革命的前途（斯大林）",
    "lun-lunen":                   "论列宁（斯大林）",
    "lun-lunen-zhu-yi-jige-wenti": "论列宁主义的几个问题（斯大林）",
    "dao-lunen":                   "悼列宁（斯大林）",
    "shiyue-geming-celue":         "十月革命和俄国共产党人的策略（斯大林）",
    "shiyue-geming-guoji":         "十月革命的国际性质（斯大林）",
    "shiyue-geming-minzu":          "十月革命和民族问题（斯大林）",
    "makesi-zhuyi-minzu":          "马克思主义和民族问题（斯大林）",
    "zen-me-ban":                  "怎么办？（列宁）",
    "guo-jia-yu-ge-ming":          "国家与革命（列宁）",
    "wei-wu-zhu-yi-he-jing-yan-pi-pan-zhu-yi": "唯物主义和经验批判主义（列宁）",
    "lun-chi-jiu-zhan":           "论持久战（毛泽东）",
    "shi-jian-lun":                "实践论（毛泽东）",
    "mao-dun-lun":                 "矛盾论（毛泽东）",
    "zhan-lue-wen-ti":            "中国革命战争的战略问题（毛泽东）",
    "you-ji-zhan":                 "抗日游击战争的战略问题（毛泽东）",
    "zhan-zheng-zhan-lue":         "战争和战略问题（毛泽东）",
    "xin-min-zhu":                 "新民主主义论（毛泽东）",
    "wen-yi-zuo-tan":              "在延安文艺座谈会上的讲话（毛泽东）",
    "xue-xi-shi-ju":              "学习和时局（毛泽东）",
    "ren-min-nei-bu-mao-dun":      "关于正确处理人民内部矛盾的问题（毛泽东）",
    "nong-min-yun-dong":            "湖南农民运动考察报告（毛泽东）",
    "rectify-stalin-era":      "历史的审判台：苏联七十年兴亡再思考",
    "rectify-gorky-lenin":    "高尔基与列宁决裂真相",
    "rectify-finland-war":     "苏联攻打芬兰是侵略？过当防卫！",
    "rectify-soviet-afghanistan": "苏联「入侵」阿富汗真实逻辑",
    "rectify-soviet-agriculture": "苏联农业社会主义探索",
    "rectify-wisdom-of-elites":   "驳精英统治的当代翻版",
    "rectify-human-nature":       "驳人性论互联网第二春",
}

BASE_DIR   = r"D:\Qmlmreader"
DATA_DIR   = os.path.join(BASE_DIR, "data")
OUT_ART     = os.path.join(BASE_DIR, "downloads", "articles")
OUT_RECT    = os.path.join(BASE_DIR, "downloads", "rectify")

def clean_text(text):
    """清理文本：去掉过多空行、页眉页脚等"""
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        line = line.rstrip()
        # 跳过纯页码行
        if re.match(r'^\d+$', line):
            continue
        # 跳过极短的目录行
        if len(line) < 2:
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)

def build_styles():
    """构建 reportlab 样式"""
    font_name = "ChineseFont"
    bold_name = "ChineseFont-Bold"

    styles = {
        'title': ParagraphStyle(
            'title', fontName=bold_name, fontSize=22,
            leading=30, alignment=TA_CENTER,
            spaceAfter=30, spaceBefore=80,
        ),
        'chapter': ParagraphStyle(
            'chapter', fontName=bold_name, fontSize=16,
            leading=24, alignment=TA_CENTER,
            spaceAfter=16, spaceBefore=24,
        ),
        'section': ParagraphStyle(
            'section', fontName=bold_name, fontSize=13,
            leading=20, alignment=TA_LEFT,
            spaceAfter=8, spaceBefore=14,
        ),
        'body': ParagraphStyle(
            'body', fontName=font_name, fontSize=11,
            leading=20, alignment=TA_JUSTIFY,
            spaceAfter=6, firstLineIndent=22,
        ),
        'meta': ParagraphStyle(
            'meta', fontName=font_name, fontSize=10,
            leading=16, alignment=TA_CENTER,
            textColor='#555555',
        ),
    }
    return styles

def split_paragraphs(text):
    """将文本拆分为段落"""
    # 按两个及以上换行符分段落
    raw = re.split(r'\n{2,}', text)
    paras = []
    for p in raw:
        p = p.strip().replace('\n', '')
        if p:
            paras.append(p)
    return paras

def infer_style(text, styles):
    """根据内容推断段落样式"""
    if re.match(r'^第[一二三四五六七八九十\d]+[章节目节篇].*', text):
        return styles['chapter']
    if re.match(r'^[□○△◆●►•·]\s*', text) or (len(text) < 40 and text.endswith(('：', ':', '？', '?', '篇'))):
        return styles['section']
    # 全大写英文标题（如 REFERENCES）
    if text.isupper() and len(text) > 3:
        return styles['section']
    return styles['body']

def txt_to_pdf(txt_path, out_path, title):
    """将 TXT 文件转换为 PDF"""
    with open(txt_path, 'r', encoding='utf-8') as f:
        raw = f.read()

    cleaned = clean_text(raw)
    paragraphs = split_paragraphs(cleaned)

    doc = SimpleDocTemplate(out_path)
    styles = build_styles()

    # 标题页
    elems = [
        Spacer(1, 4*cm),
        Paragraph(title, styles['title']),
        Spacer(1, 2*cm),
        Paragraph("—— 青年马列毛主义驿站 ——", styles['meta']),
        PageBreak(),
    ]

    # 正文段落
    for para in paragraphs:
        style = infer_style(para, styles)
        # 转义 reportlab XML 特殊字符
        safe = para.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        elems.append(Paragraph(safe, style))
        if style == styles['chapter']:
            elems.append(Spacer(1, 0.2*cm))

    doc.build(elems)
    size_kb = os.path.getsize(out_path) // 1024
    print(f"    ✓ {os.path.basename(out_path)}  ({size_kb} KB)")

def main():
    register_font()
    if not FONT_REGISTERED:
        print("无法注册中文字体，退出。")
        return

    os.makedirs(OUT_ART, exist_ok=True)
    os.makedirs(OUT_RECT, exist_ok=True)

    # 删除 articles/ 下所有旧 PDF
    print("\n[1/3] 删除旧 PDF...")
    old_pdfs = [f for f in os.listdir(OUT_ART) if f.endswith('.pdf')]
    for f in old_pdfs:
        path = os.path.join(OUT_ART, f)
        os.remove(path)
        print(f"  ✗ 删除: {f}")
    print(f"  共删除 {len(old_pdfs)} 个旧 PDF")

    # 生成文章 PDF
    print("\n[2/3] 生成文章 PDF...")
    ok = err = 0
    for slug, txt_name in ARTICLES_MAP.items():
        txt_path = os.path.join(DATA_DIR, txt_name)
        if not os.path.exists(txt_path):
            print(f"  ✗ 缺失 TXT: {txt_name} (slug={slug})")
            err += 1
            continue
        out_path = os.path.join(OUT_ART, f"{slug}.pdf")
        title = TITLE_MAP.get(slug, slug)
        try:
            txt_to_pdf(txt_path, out_path, title)
            ok += 1
        except Exception as e:
            print(f"  ✗ 失败 {slug}: {e}")
            err += 1

    # 生成正名 PDF
    print("\n[3/3] 生成正名 PDF...")
    for slug, txt_name in RECTIFY_MAP.items():
        txt_path = os.path.join(DATA_DIR, txt_name)
        if not os.path.exists(txt_path):
            print(f"  ✗ 缺失 TXT: {txt_name}")
            err += 1
            continue
        out_path = os.path.join(OUT_RECT, f"{slug}.pdf")
        title = TITLE_MAP.get(slug, slug)
        try:
            txt_to_pdf(txt_path, out_path, title)
            ok += 1
        except Exception as e:
            print(f"  ✗ 失败 {slug}: {e}")
            err += 1

    print(f"\n完成：成功 {ok} 个，失败 {err} 个")
    print(f"输出目录：\n  {OUT_ART}\n  {OUT_RECT}")

if __name__ == '__main__':
    main()
