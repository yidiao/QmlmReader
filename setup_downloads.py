#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建 downloads/ 目录，复制相关 PDF，
生成 downloads/README.md 下载资源清单
"""

import os
import shutil

DOWNLOADS = 'D:/Qmlmreader/downloads'
DATA = 'D:/Qmlmreader/data'
PDF_SRC = 'D:/图片/红色'

os.makedirs(DOWNLOADS, exist_ok=True)
os.makedirs(f'{DOWNLOADS}/articles', exist_ok=True)
os.makedirs(f'{DOWNLOADS}/rectify', exist_ok=True)
os.makedirs(f'{DOWNLOADS}/posters', exist_ok=True)

print('=== 复制 PDF 文件 ===')

# PDF 文件映射：目标slug -> 源文件路径
pdf_map = [
    # 马克思/恩格斯
    ('gongchan-dan-yuan', f'{PDF_SRC}/《共产党宣言》完整版.pdf', '共产党宣言（马克思·恩格斯）'),
    # 列宁
    ('zen-me-ban',       f'{PDF_SRC}/列宁选集第一卷.pdf', '列宁选集第一卷（含怎么办？）'),
    ('guo-jia-yu-ge-ming', f'{PDF_SRC}/列宁选集第二卷.pdf', '列宁选集第二卷（含国家与革命）'),
    ('wei-wu-zhu-yi',    f'{PDF_SRC}/列宁选集第一卷.pdf', None),  # 同上，不重复复制
    # 斯大林
    ('lun-lunen-zhu-yi-ji-chu',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★★][1924] 论列宁主义基础.pdf',
     '论列宁主义基础（斯大林）'),
    ('lun-zhongguo-ge-ming-de-qiantu',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★★][1926年11月30日] 论中国革命的前途.pdf',
     '论中国革命的前途（斯大林）'),
    ('lun-lunen',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★★][1924年1月28日] 论列宁.pdf',
     '论列宁（斯大林）'),
    ('lun-lunen-zhu-yi-jige-wenti',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★★][1926] 论列宁主义的几个问题.pdf',
     '论列宁主义的几个问题（斯大林）'),
    ('dao-lunen',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★☆][1924年1月26日] 悼列宁.pdf',
     '悼列宁（斯大林）'),
    ('shiyue-geming-celue',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★☆][1924] 十月革命和俄国共产党人的策略.pdf',
     '十月革命和俄国共产党人的策略（斯大林）'),
    ('shiyue-geming-guoji',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★☆][1927] 十月革命的国际性质.pdf',
     '十月革命的国际性质（斯大林）'),
    ('shiyue-geming-minzu',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★☆][1917] 十月革命和民族问题.pdf',
     '十月革命和民族问题（斯大林）'),
    ('makesi-zhuyi-minzu',
     f'{PDF_SRC}/毛选/斯大林选集-四星五星文章/[★★★★☆][1913] 马克思主义和民族问题.pdf',
     '马克思主义和民族问题（斯大林）'),
]

copied_pdfs = []
for slug, src, label in pdf_map:
    if label is None:
        continue  # 跳过重复
    if not os.path.exists(src):
        print(f'  ⚠️ PDF 不存在: {os.path.basename(src)}')
        continue
    # 用 slug 作为文件名
    fname = f'{slug}.pdf'
    dst = f'{DOWNLOADS}/articles/{fname}'
    if not os.path.exists(dst):
        shutil.copy2(src, dst)
        print(f'  ✅ {fname} ({os.path.getsize(dst)//1024}KB)')
    else:
        print(f'  ⏭️ 已存在: {fname}')
    copied_pdfs.append((slug, fname, label, 'pdf'))

# 统计 txt 备份
txt_slugs = [
    ('lun-chi-jiu-zhan', '论持久战_extracted.txt', '论持久战（毛泽东）'),
    ('shi-jian-lun', '实践论_extracted.txt', '实践论（毛泽东）'),
    ('mao-dun-lun', '矛盾论_extracted.txt', '矛盾论（毛泽东）'),
    ('zhan-lue-wen-ti', '中国革命战争的战略问题_extracted.txt', '中国革命战争的战略问题（毛泽东）'),
    ('you-ji-zhan', '抗日游击战争的战略问题_extracted.txt', '抗日游击战争的战略问题（毛泽东）'),
    ('zhan-zheng-zhan-lue', '战争和战略问题_extracted.txt', '战争和战略问题（毛泽东）'),
    ('xin-min-zhu', '新民主主义论_extracted.txt', '新民主主义论（毛泽东）'),
    ('wen-yi-zuo-tan', '在延安文艺座谈会上的讲话_extracted.txt', '在延安文艺座谈会上的讲话（毛泽东）'),
    ('xue-xi-shi-ju', '学习和时局_extracted.txt', '学习和时局（毛泽东）'),
    ('ren-min-nei-bu-mao-dun', '关于正确处理人民内部矛盾的问题_extracted.txt', '关于正确处理人民内部矛盾的问题（毛泽东）'),
    ('nong-min-yun-dong', '湖南农民运动考察报告_extracted.txt', '湖南农民运动考察报告（毛泽东）'),
    # 列宁
    ('zen-me-ban-text', 'zen-me-ban.txt', '怎么办？（列宁）'),
    ('wei-wu-zhu-yi-text', 'wei-wu-zhu-yi.txt', '唯物主义和经验批判主义（列宁）'),
    ('guo-jia-yu-ge-ming-text', 'guo-jia-yu-ge-ming.txt', '国家与革命（列宁）'),
    # 斯大林
    ('lun-lunen-zhu-yi-ji-chu-text', 'lun-lunen-zhu-yi-ji-chu.txt', '论列宁主义基础（斯大林）'),
    ('lun-zhongguo-text', 'lun-zhongguo-ge-ming-de-qiantu.txt', '论中国革命的前途（斯大林）'),
]

# 生成资源清单 JSON（供前端使用）
import json

articles_downloads = []

# 有 PDF 的文章
for slug, fname, label in [(s,f,l) for s,f,l,t in copied_pdfs]:
    articles_downloads.append({
        'slug': slug,
        'title': label,
        'pdf': f'downloads/articles/{fname}',
        'txt': None
    })

# 只有 txt 的文章（毛泽东）
mao_articles = [
    ('lun-chi-jiu-zhan', '论持久战_extracted.txt', '论持久战（毛泽东）'),
    ('shi-jian-lun', '实践论_extracted.txt', '实践论（毛泽东）'),
    ('mao-dun-lun', '矛盾论_extracted.txt', '矛盾论（毛泽东）'),
    ('zhan-lue-wen-ti', '中国革命战争的战略问题_extracted.txt', '中国革命战争的战略问题（毛泽东）'),
    ('you-ji-zhan', '抗日游击战争的战略问题_extracted.txt', '抗日游击战争的战略问题（毛泽东）'),
    ('zhan-zheng-zhan-lue', '战争和战略问题_extracted.txt', '战争和战略问题（毛泽东）'),
    ('xin-min-zhu', '新民主主义论_extracted.txt', '新民主主义论（毛泽东）'),
    ('wen-yi-zuo-tan', '在延安文艺座谈会上的讲话_extracted.txt', '在延安文艺座谈会上的讲话（毛泽东）'),
    ('xue-xi-shi-ju', '学习和时局_extracted.txt', '学习和时局（毛泽东）'),
    ('ren-min-nei-bu-mao-dun', '关于正确处理人民内部矛盾的问题_extracted.txt', '关于正确处理人民内部矛盾的问题（毛泽东）'),
    ('nong-min-yun-dong', '湖南农民运动考察报告_extracted.txt', '湖南农民运动考察报告（毛泽东）'),
]
for slug, fname, label in mao_articles:
    articles_downloads.append({
        'slug': slug,
        'title': label,
        'pdf': None,
        'txt': f'data/{fname}'
    })

# 正名文章
rectify_downloads = [
    ('rectify-stalin-era', 'rectify-stalin-era.txt', '历史的审判台：苏联七十年兴亡再思考'),
    ('rectify-gorky-lenin', 'rectify-gorky-leiden.txt', '高尔基与列宁决裂真相'),
    ('rectify-finland-war', 'rectify-finland-war.txt', '苏联攻打芬兰是侵略？过当防卫！'),
    ('rectify-soviet-afghanistan', 'rectify-soviet-afghanistan.txt', '苏联"入侵"阿富汗真实逻辑'),
    ('rectify-soviet-agriculture', 'rectify-soviet-agriculture.txt', '苏联农业社会主义探索'),
    ('rectify-wisdom-of-elites', 'rectify-wisdom-of-elites.txt', '驳精英统治的当代翻版'),
    ('rectify-human-nature', 'rectify-human-nature.txt', '驳人性论互联网第二春'),
]

manifest = {
    'articles': articles_downloads,
    'rectify': [{'slug':s,'title':l,'txt':f'data/{f}'} for s,f,l in rectify_downloads]
}

manifest_path = f'{DOWNLOADS}/manifest.json'
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print(f'\n✅ 下载清单已生成: {manifest_path}')
print(f'   文章: {len(articles_downloads)} 条')
print(f'   正名: {len(rectify_downloads)} 条')
