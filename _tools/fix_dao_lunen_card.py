#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 html/articles/articles.html 中《悼列宁》卡片：
- 移除“施工中”标记
- 标题和“阅读全文”改为可点击链接
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / "html" / "articles" / "articles.html"


def main():
    lines = FILE.read_text(encoding="utf-8").splitlines(keepends=True)
    out = []
    i = 0
    changed = False

    while i < len(lines):
        line = lines[i]

        # 找到《悼列宁》标题行
        if 'article-title">悼列宁' in line or 'article-title"><a href="Stalin/dao-lunen.html">悼列宁</a>' in line:
            # 向上回退到 article 开标签
            start = len(out) - 1
            while start >= 0 and 'article-card' not in out[start]:
                start -= 1
            if start >= 0:
                # 替换开标签：去掉 wip
                out[start] = out[start].replace('priority-4 wip"', 'priority-4"', 1)
                changed = True

                # 删除该卡片内的 card-wip-badge 行（可能在标题上方）
                for j in range(len(out) - 1, start - 1, -1):
                    if 'card-wip-badge' in out[j]:
                        out.pop(j)
                        changed = True
                        break

            # 替换标题行：确保是链接形式
            if 'article-title"><a href="Stalin/dao-lunen.html">悼列宁</a>' not in line:
                indent = line[:len(line) - len(line.lstrip())]
                line = indent + '<h4 class="article-title">\n'
                line += indent + '    <a href="Stalin/dao-lunen.html">悼列宁</a>\n'
                line += indent + '</h4>\n'
                changed = True

            out.append(line)
            i += 1

            # 继续处理后面的作者、描述、footer
            while i < len(lines) and 'article-card' not in lines[i]:
                cur = lines[i]
                # 移除该卡片内残留的 card-wip-badge（防御）
                if 'card-wip-badge' in cur:
                    changed = True
                    i += 1
                    continue
                # 把“施工中”read-more 替换为链接
                if 'read-more' in cur and '🚧' in cur:
                    indent = cur[:len(cur) - len(cur.lstrip())]
                    cur = indent + '<a href="Stalin/dao-lunen.html" class="read-more">阅读全文 →</a>\n'
                    changed = True
                out.append(cur)
                i += 1
            continue

        out.append(line)
        i += 1

    if changed:
        FILE.write_text("".join(out), encoding="utf-8")
        print("已修复:", FILE)
    else:
        print("未找到需要修改的内容，可能已经修复。")


if __name__ == "__main__":
    main()
