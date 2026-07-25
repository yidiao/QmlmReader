"""
Migrate Engels articles to _template-v2 format.
Preserves existing tab content, adds proper chart configs.
"""
import os, re

ROOT = r"D:\Claude Pj\Qmlmreader"
TEMPLATE_PATH = os.path.join(ROOT, 'html', 'articles', '_template-v2.html')

CAT_COLORS = {
    'philosophy': ('#8b0000', '#c41e3a', 'linear-gradient(135deg, #4a0000 0%, #8b0000 50%, #c41e3a 100%)'),
    'politics':   ('#5c3d99', '#7c4dff', 'linear-gradient(135deg, #2d1050 0%, #5c3d99 50%, #7c4dff 100%)'),
}

def extract_tab_content(html, tab_id):
    pattern = re.compile(
        r'<div class="tab-content[^"]*"[^>]*id="' + tab_id + r'"[^>]*>(.*?)</div>\s*(?=<div class="tab-content|<!-- Tab|</main>)',
        re.DOTALL
    )
    m = pattern.search(html)
    if m:
        content = m.group(1)
        content = re.sub(r'<h2[^>]*>.*?</h2>\s*', '', content, count=1, flags=re.DOTALL)
        return content.strip()
    return ''

def apply_template(template, meta, category, existing_tabs, download_slug, extra_charts_json=''):
    """Apply template, filling in meta, category colors, and tab content."""
    prim, sec, grad = CAT_COLORS.get(category, CAT_COLORS['philosophy'])

    # Title
    template = template.replace('【文章标题】 - 青年马列毛主义驿站', meta['title'] + ' - 青年马列毛主义驿站')
    template = template.replace('<title>【文章标题】', '<title>' + meta['title'])

    # Colors
    template = template.replace('--cat-primary:   #8b0000;', f'--cat-primary:   {prim};')
    template = template.replace('--cat-secondary: #c41e3a;', f'--cat-secondary: {sec};')
    template = template.replace("--cat-gradient:  linear-gradient(135deg, #4a0000 0%, #8b0000 50%, #c41e3a 100%);",
                               f"--cat-gradient:  {grad};")
    template = template.replace('data-category="philosophy"', f'data-category="{category}"')

    # Header
    template = template.replace('【⭐⭐⭐⭐⭐ 核心必读 / ✨✨✨✨ 重点推荐】', meta['badge'])
    template = template.replace('<h1>【文章标题】</h1>', f'<h1>{meta["title"]}</h1>')
    sub = meta.get('subtitle', '')
    template = template.replace('【副标题，可选】</div>', sub + '</div>')
    if not sub:
        template = template.replace('<div class="article-subtitle"></div>', '')
    template = template.replace('【作者】', meta['author'])
    template = template.replace('【写作日期】', meta['date'])
    template = template.replace('【分类标签】', meta['cat_label'])
    template = template.replace('【约XXX字】', meta['wordcount'])
    template = template.replace('【📄 短篇 / 📄 中篇 / 📚 长篇】', meta['length_tag'])

    # Original text intro
    template = template.replace('【简要介绍文章背景、章节结构、建议重点阅读的章节】', meta['reading_intro'])

    # Download
    dl_old = "var DOWNLOAD_LINKS = [\n            { href: '../../../data/【文章slug】.txt', label: '📝 下载 TXT' }\n        ];"
    dl_new = f"var DOWNLOAD_LINKS = [\n            {{ href: '../../../data/{download_slug}.txt', label: '📝 下载 TXT' }}\n        ];"
    template = template.replace(dl_old, dl_new)

    # Inject tab contents
    tab_ids = ['original', 'reading', 'difficulty', 'dialogue', 'action', 'visual', 'puzzle']
    for tid in tab_ids:
        start_marker = f'<div class="tab-content active" id="{tid}">' if tid == 'original' else f'<div class="tab-content" id="{tid}">'
        # Find the tab div in template
        idx = template.find(start_marker)
        if idx == -1:
            continue
        # Find end of this tab section (next tab or main closing)
        if tid == 'puzzle':
            end_marker = '</main>'
        elif tid == 'original':
            end_marker = '<!-- ═══════════════════════════════════════ -->\n        <!-- Tab 2'
        else:
            next_num = tab_ids.index(tid) + 2
            end_marker = f'<!-- ═══════════════════════════════════════ -->\n        <!-- Tab {next_num}'

        end_idx = template.find(end_marker, idx)
        if end_idx == -1:
            continue

        old_content = existing_tabs.get(tid, '')
        if old_content and tid == 'original':
            # Keep original text from existing file
            template = template[:idx] + f'<div class="tab-content active" id="original">\n            {old_content}\n        </div>\n\n        ' + template[end_idx:]
        elif old_content:
            template = template[:idx] + f'<div class="tab-content" id="{tid}">\n            {old_content}\n        </div>\n\n        ' + template[end_idx:]

    # Inject extra chart configs
    if extra_charts_json:
        old_comment = '// 可继续添加自定义图表，格式同上：{ id: \'canvasId\', config: { ... } }'
        template = template.replace(old_comment, old_comment + '\n            ' + extra_charts_json)

    return template

# ===== 反杜林论 =====
print("Processing 反杜林论...")
with open(os.path.join(ROOT, 'html/articles/Engels/fan-du-lin-lun.html'), 'r', encoding='utf-8') as f:
    fan_html = f.read()

with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
    tpl = f.read()

# Extract original text (keep existing chapters)
orig_match = re.search(r'<div class="tab-content active" id="original">(.*?)</div>\s*<div class="tab-content" id="reading"', fan_html, re.DOTALL)
orig_text = orig_match.group(1).strip() if orig_match else ''

# Extract other tabs
existing = {tid: extract_tab_content(fan_html, tid) for tid in ['reading', 'difficulty', 'dialogue', 'action', 'visual', 'puzzle']}
existing['original'] = orig_text

# Extra charts for 反杜林论 (mainChart, threeLawsChart, socialismChart)
extra = '''{
                id: 'mainChart',
                config: {
                    type: 'bar',
                    data: {
                        labels: ['哲学编', '政治经济学编', '社会主义编'],
                        datasets: [{
                            label: '内容比重',
                            data: [4, 5, 3],
                            backgroundColor: ['rgba(139,0,0,0.7)', 'rgba(139,0,0,0.5)', 'rgba(139,0,0,0.3)'],
                            borderColor: '#8b0000',
                            borderWidth: 1.5
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { min: 0, max: 6 } }
                    }
                }
            },
            {
                id: 'threeLawsChart',
                config: {
                    type: 'radar',
                    data: {
                        labels: ['理论创新性', '批判力度', '体系完整性', '通俗性', '历史意义'],
                        datasets: [
                            { label: '辩证法规律', data: [9, 10, 8, 6, 9], borderColor: '#c53030', backgroundColor: 'rgba(197,48,48,0.1)', pointBackgroundColor: '#c53030' },
                            { label: '唯物史观', data: [8, 7, 9, 5, 9], borderColor: '#d69e2e', backgroundColor: 'rgba(214,158,46,0.1)', pointBackgroundColor: '#d69e2e' },
                            { label: '科学社会主义', data: [7, 8, 8, 6, 10], borderColor: '#2b6cb0', backgroundColor: 'rgba(43,108,176,0.1)', pointBackgroundColor: '#2b6cb0' }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: { r: { min: 0, max: 10 } },
                        plugins: { legend: { position: 'bottom' } }
                    }
                }
            },
            {
                id: 'socialismChart',
                config: {
                    type: 'bar',
                    data: {
                        labels: ['空想社会主义', '科学社会主义'],
                        datasets: [
                            { label: '理论严密性', data: [3, 9], backgroundColor: 'rgba(139,0,0,0.4)', borderColor: '#8b0000', borderWidth: 1.5 },
                            { label: '实践指导力', data: [2, 8], backgroundColor: 'rgba(196,30,58,0.6)', borderColor: '#c41e3a', borderWidth: 1.5 },
                            { label: '历史解释力', data: [4, 10], backgroundColor: 'rgba(180,40,40,0.8)', borderColor: '#8b0000', borderWidth: 1.5 }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { position: 'bottom' } },
                        scales: { y: { min: 0, max: 10 } }
                    }
                }
            },'''

meta = {
    'title': '反杜林论',
    'subtitle': '欧根·杜林先生在科学中实行的变革批判',
    'author': '恩格斯',
    'date': '1878年',
    'cat_label': '哲学基础 · 马克思主义百科全书',
    'wordcount': '约20,000字（节选）',
    'length_tag': '📄 中篇',
    'badge': '⭐⭐⭐⭐⭐ 核心必读',
    'reading_intro': '本文是恩格斯最重要的著作之一，被誉为"马克思主义的百科全书"，从哲学、政治经济学和科学社会主义三个维度系统阐述马克思主义。全文三编。点击章节标题可展开/折叠。',
}
result = apply_template(tpl, meta, 'philosophy', existing, 'fan-du-lin-lun', extra)
with open(os.path.join(ROOT, 'html/articles/Engels/fan-du-lin-lun.html'), 'w', encoding='utf-8') as f:
    f.write(result)
print("  反杜林论 done")

# ===== 家庭、私有制和国家的起源 =====
print("Processing 家庭、私有制和国家的起源...")
with open(os.path.join(ROOT, 'html/articles/Engels/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.html'), 'r', encoding='utf-8') as f:
    jia_html = f.read()

with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
    tpl = f.read()

orig_match2 = re.search(r'<div class="tab-content active" id="original">(.*?)</div>\s*<div class="tab-content" id="reading"', jia_html, re.DOTALL)
orig_text2 = orig_match2.group(1).strip() if orig_match2 else '<div class="original-text"><div class="text-intro"><p><strong>阅读提示：</strong>本文约19.7万字，是恩格斯晚年最重要的著作之一，系统阐述了人类早期社会的发展规律。点击章节标题可展开/折叠。</p></div></div>'

existing2 = {tid: extract_tab_content(jia_html, tid) for tid in ['reading', 'difficulty', 'dialogue', 'action', 'visual', 'puzzle']}
existing2['original'] = orig_text2

extra2 = '''{
                id: 'societyStagesChart',
                config: {
                    type: 'bar',
                    data: {
                        labels: ['蒙昧时代', '野蛮时代', '文明时代'],
                        datasets: [{
                            label: '生产力水平',
                            data: [2, 5, 10],
                            backgroundColor: ['rgba(92,61,153,0.4)', 'rgba(92,61,153,0.65)', 'rgba(92,61,153,0.85)'],
                            borderColor: '#5c3d99',
                            borderWidth: 1.5
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { min: 0, max: 10, title: { display: true, text: '发展程度' } } }
                    }
                }
            },
            {
                id: 'stateEvolutionChart',
                config: {
                    type: 'radar',
                    data: {
                        labels: ['氏族制度', '军事民主制', '雅典国家', '罗马国家', '德意志国家'],
                        datasets: [
                            { label: '国家性强度', data: [2, 4, 8, 9, 7], borderColor: '#5c3d99', backgroundColor: 'rgba(92,61,153,0.1)', pointBackgroundColor: '#5c3d99' },
                            { label: '民主残余', data: [10, 7, 3, 1, 4], borderColor: '#d69e2e', backgroundColor: 'rgba(214,158,46,0.1)', pointBackgroundColor: '#d69e2e' }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: { r: { min: 0, max: 10 } },
                        plugins: { legend: { position: 'bottom' } }
                    }
                }
            },'''

meta2 = {
    'title': '家庭、私有制和国家的起源',
    'subtitle': '就路易斯·亨·摩尔根的研究成果而作',
    'author': '恩格斯',
    'date': '1884年',
    'cat_label': '政治理论 · 国家起源',
    'wordcount': '约197,000字',
    'length_tag': '📚 长篇',
    'badge': '⭐⭐⭐⭐ 重点推荐',
    'reading_intro': '本文约19.7万字，是恩格斯晚年最重要的著作之一，系统阐述了人类早期社会从氏族到国家的发展规律，论证了国家的阶级本质和历史暂时性。全文九章。点击章节标题可展开/折叠。',
}
result2 = apply_template(tpl, meta2, 'politics', existing2, 'jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan', extra2)
with open(os.path.join(ROOT, 'html/articles/Engels/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.html'), 'w', encoding='utf-8') as f:
    f.write(result2)
print("  家庭、私有制和国家的起源 done")
print("Done!")
