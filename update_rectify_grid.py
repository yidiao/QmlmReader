import re

with open('D:/Qmlmreader/rectify.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修改 .section-nav 的 grid-template-columns (第39行附近)
# 从 auto-fit 改为明确的3列，并添加媒体查询
old_section_nav = '        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));'
new_section_nav = '''        grid-template-columns: repeat(3, 1fr);
        /* 窄屏2列 */''' + '\n' + '''        @media (max-width: 768px) {
            grid-template-columns: repeat(2, 1fr);
        }'''

# 这个不好直接替换，因为CSS不支持在属性声明里嵌套@media
# 正确做法：把 .section-nav 的 grid-template-columns 改成默认3列，然后在 </style> 前加媒体查询

# 重置：直接修改策略
# 策略：在 </style> 前添加媒体查询块

# 先改 .section-nav 为默认3列
content = content.replace(
    '        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));',
    '        grid-template-columns: repeat(3, 1fr);'
)

# 改 .article-grid 为默认3列
content = content.replace(
    '            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));',
    '            grid-template-columns: repeat(3, 1fr);'
)

# 在 </style> 前插入窄屏媒体查询
narrow_screen_css = '''
        
        /* 窄屏：2列 */
        @media (max-width: 768px) {
            .section-nav {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .article-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    '''

content = content.replace('    </style>', narrow_screen_css + '    </style>')

with open('D:/Qmlmreader/rectify.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('rectify.html 已更新：宽屏3列，窄屏2列')
