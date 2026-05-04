import re

with open('D:/Qmlmreader/css/style.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 在窄屏媒体查询结束的 } 之后添加宽屏媒体查询
insert_marker = '}\n\n/* 优先级颜色 */'
wide_screen_css = '''}\n\n/* ==================== 宽屏：3列 ==================== */\n@media (min-width: 769px) {\n    .featured-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .masters-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .tools-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .tool-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .article-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .music-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .video-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .poster-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n\n    .quotes-grid {\n        grid-template-columns: repeat(3, 1fr);\n    }\n}\n\n/* 优先级颜色 */'''

content = content.replace(insert_marker, wide_screen_css)

with open('D:/Qmlmreader/css/style.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('宽屏媒体查询已添加')
