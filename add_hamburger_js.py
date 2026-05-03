#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对没有引用 main.js 但有汉堡按钮的 HTML 文件，
在 </body> 前注入汉堡菜单的内联脚本
"""

import os

SCRIPT = '''
<script>
// 汉堡菜单
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var hamburger = document.querySelector('.hamburger-btn');
        var nav = document.querySelector('.main-nav');
        if (!hamburger || !nav) return;
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = nav.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
        nav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                nav.classList.remove('open');
                hamburger.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
        document.addEventListener('click', function(e) {
            if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== hamburger) {
                nav.classList.remove('open');
                hamburger.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && nav.classList.contains('open')) {
                nav.classList.remove('open');
                hamburger.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    });
})();
</script>
'''

targets = [
    'D:/Qmlmreader/articles/gongchan-dan-yuan.html',
    'D:/Qmlmreader/articles/guo-jia-yu-ge-ming-backup.html',
    'D:/Qmlmreader/articles/lun-chi-jiu-zhan.html',
    'D:/Qmlmreader/articles/mao-dun-lun.html',
    'D:/Qmlmreader/articles/nong-min-yun-dong.html',
    'D:/Qmlmreader/articles/ren-min-nei-bu-mao-dun.html',
    'D:/Qmlmreader/articles/shi-jian-lun.html',
    'D:/Qmlmreader/articles/wen-yi-zuo-tan.html',
    'D:/Qmlmreader/articles/xin-min-zhu.html',
    'D:/Qmlmreader/articles/xue-xi-shi-ju.html',
    'D:/Qmlmreader/articles/you-ji-zhan.html',
    'D:/Qmlmreader/articles/zhan-lue-wen-ti.html',
    'D:/Qmlmreader/articles/zhan-zheng-zhan-lue.html',
    'D:/Qmlmreader/puzzle.html',
]

for fpath in targets:
    if not os.path.exists(fpath):
        print(f'  ⚠️  文件不存在: {fpath}')
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    # 检查是否已注入
    if 'hamburger-btn' not in content:
        print(f'  ⚠️  没有汉堡按钮，跳过: {fpath}')
        continue
    if '汉堡菜单' in content or 'hamburger-btn' in content and 'e.stopPropagation' in content:
        print(f'  ⏭️  已有汉堡JS，跳过: {os.path.basename(fpath)}')
        continue
    new_content = content.replace('</body>', SCRIPT + '</body>', 1)
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'  ✅ 注入JS: {os.path.basename(fpath)}')

print('完成！')
