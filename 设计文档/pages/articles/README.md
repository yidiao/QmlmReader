# 文章模块 README

> 对应源码：`html/articles/`、`data/articles.json`、`data/articles-json/`、`data/study-json/`、`js/article-common.js`、`js/article-json.js`、`js/article-study.js`、`js/preferences.js`、`css/articles-detail.css`。  
> 作用：管理文章列表页、正式文章详情页、正文层、精读层和渲染接入边界。

---

## 1. 页面范围

```text
html/articles/articles.html                 # 文章列表与合集页
html/articles/_template.html                # 旧模板
html/articles/_template-v2.html             # 推荐模板
html/articles/{Mentor}/{slug}.html          # 正式文章详情页
html/articles/imported/...                  # 批量导入页，暂不按精读页同标准管理
```

当前非 imported 正式文章详情页：29 篇。

按目录统计：

| 目录 | 数量 |
|---|---:|
| `Engels/` | 2 |
| `Lenin/` | 6 |
| `Mao/` | 12 |
| `Marx/` | 6 |
| `Stalin/` | 3 |

---

## 2. 页面职责

文章模块分三层：

| 层 | 文件 | 职责 |
|---|---|---|
| 列表/索引 | `html/articles/articles.html` + `data/articles.json` | 文章卡片、筛选、合集入口 |
| 正文 | `data/articles-json/{Mentor}/{Star}/{slug}.json` | 原文正文、段落、章节、下载正文源 |
| 精读 | `html/articles/{Mentor}/{slug}.html` + 可选 `data/study-json/{Mentor}/{slug}.json` | Tab、读法、难点、对话、行动、视觉、拼图、延伸 |
| 偏好 | `js/preferences.js` | 文章收藏、阅读历史、继续阅读位置记录 |

核心原则：

- HTML 详情页是“精读页壳 + 正文接入页”。
- 正文不应长期硬编码在 HTML 中。
- 精读内容可以先保留在 HTML；若数据化，应进入 `data/study-json/`，不要塞进正文 JSON。

---

## 3. 详情页标准接口

推荐 body：

```html
<body data-category="philosophy"
      data-article-json="../../../data/articles-json/Mao/★★★★★/shi-jian-lun.json"
      data-study-json="../../../data/study-json/Mao/shi-jian-lun.json">
```

推荐资源顺序：

```html
<link rel="stylesheet" href="../../../css/style.css">
<link rel="stylesheet" href="../../../css/articles-detail.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script src="../../../js/article-common.js"></script>
<script src="../../../js/article-json.js"></script>
<script src="../../../js/article-study.js"></script>
<script src="../../../js/site-data.js"></script>
<script src="../../../js/main.js"></script>
<script src="../../../js/darkmode.js"></script>
<script src="../../../js/cursor.js"></script>
```

若页面没有图表，不要无意义引入 Chart.js。

---

## 4. Tab 约定

标准 Tab：

| ID | 用途 | 数据化建议 |
|---|---|---|
| `original` | 原文 | 优先由 `article-json.js` 从正文 JSON 渲染 |
| `reading` | 读法提示 | 可进入 `study-json` |
| `difficulty` | 难点解析 | 可进入 `study-json` |
| `dialogue` | 对话空间 | 可进入 `study-json` |
| `action` | 行动实验 | 可进入 `study-json` |
| `visual` | 可视化 | 复杂布局暂留 HTML |
| `puzzle` | 理论拼图 | 复杂布局暂留 HTML，联结卡可由 `study-json.further` 接管 |
| `further` | 延伸阅读 | 可合并到联结网络 |

---

## 5. 当前 JSON 接入状态

当前检测到 8 篇详情页同时声明 `data-article-json` 和 `data-study-json`：

```text
html/articles/Engels/fan-du-lin-lun.html
html/articles/Engels/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.html
html/articles/Lenin/guo-jia-yu-ge-ming.html
html/articles/Mao/shi-jian-lun.html
html/articles/Marx/gongchan-dan-yuan.html
html/articles/Stalin/dao-lunen.html
html/articles/Stalin/lun-lunen-zhu-yi-ji-chu.html
html/articles/Stalin/lun-zhongguo-ge-ming-de-qiantu.html
```

旧文档中“只完成 5 篇试点”的说法已过时，以本 README 为准。

---

## 6. `articles.html` 维护口径

当前事实：

- 读取 `js/site-data.js` 和 `js/main.js`。
- 仍包含较大的 `collectionsData` 兜底数据。
- 也会尝试读取 `../../data/articles.json`。

后续建议：

1. 优先以 `data/articles.json` / `window.SITE_DATA.articles` 为权威索引。
2. 以 `data/collections.json` / `window.SITE_DATA.collections` 为权威合集。
3. 页面内大段兜底数据在确认稳定后逐步删除。

---

## 7. 最近任务状态

“正文层、精读层、渲染层解耦”在本阶段视为**规范完成**：

- 正文层：`articles-json`。
- 精读层：`study-json`。
- 渲染层：`article-json.js` / `article-study.js` / `article-common.js`。

后续不是“继续完成旧任务”，而是另开任务逐步推广与清理。

---

## 8. 常见错误

1. 页面里继续硬编码全文，同时又声明 `data-article-json`。
2. 改正文只改 HTML，不改正文 JSON。
3. 把精读解释混入正文 JSON。
4. `mentor`、目录、JSON 路径不一致。
5. 复制某一篇页面作为模板时，把私有样式、私有图表和错误路径一起复制。
