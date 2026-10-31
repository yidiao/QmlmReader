# 文章模块 README

> 对应源码：`html/articles/articles.html`、`css/articles-index.css`、`js/articles-index.js`、`data/articles.json`、`data/articles-json/`、`data/study-json/`、`js/article-common.js`、`js/article-json.js`、`js/article-study.js`、`js/preferences.js`、`css/articles-detail.css`。  
> 作用：管理文章索引页、正式文章详情页、正文层、精读层和渲染接入边界。

---

## 1. 页面范围

```text
html/articles/articles.html                          # 文章索引页（展示页）
html/articles/_template.html                         # 旧模板
html/articles/_template-v2.html                      # 推荐模板
html/articles/{Mentor}/{Star}/{slug}.html            # 正式文章详情页
html/articles/imported/...                           # 历史抽取页池，不再承担正式展示职责
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

按导师 / 星级统计（以 `data/articles-json/` 当前文件为准）：

| 导师 | 星级分布 |
|---|---|
| `Engels/` | `★★★★★:2` |
| `Lenin/` | `★★☆☆☆:2`，`★★★★★:4` |
| `Mao/` | `★★★☆☆:1`，`★★★★☆:2`，`★★★★★:9` |
| `Marx/` | `★★★☆☆:1`，`★★★★☆:1`，`★★★★★:4` |
| `Stalin/` | `★★☆☆☆:1`，`★★★☆☆:1`，`★★★★★:1` |

---

## 2. 页面职责

文章模块分四层：

| 层 | 文件 | 职责 |
|---|---|---|
| 索引/展示 | `html/articles/articles.html` + `css/articles-index.css` + `js/articles-index.js` + `data/articles.json` | 文章卡片、筛选、合集入口、布局切换的统一壳 |
| 正文 | `data/articles-json/{Mentor}/{Star}/{slug}.json` | 原文正文、段落、章节、下载正文源 |
| 精读 | `html/articles/{Mentor}/{Star}/{slug}.html` + `data/study-json/{Mentor}/{Star}/{slug}.json` | Tab、读法、难点、对话、行动、视觉、拼图、延伸 |
| 偏好/阅读状态 | `js/preferences.js`、`js/main.js`、`js/article-common.js`、`js/state-center.js` | 文章收藏、阅读历史、继续阅读位置记录、恢复流程状态、当前 Tab、章节导航显示状态、章节折叠状态、合集弹窗状态 |

核心原则：

- 索引页只负责读索引、渲染卡片和入口，不承载正文与历史抽取页逻辑。
- 正文不应长期硬编码在 HTML 中。
- 精读内容可以先保留在 HTML；若数据化，应进入 `data/study-json/`，不要塞进正文 JSON。
- 进入 `html/articles/{Mentor}/{Star}/` 后，页面内相对路径要比旧平铺目录多退一层。
- `articles.html` 与详情页分工明确，便于未来做单列 / 双列 / 其他视图模式切换。

---

## 3. 索引页标准接口

推荐 body：

```html
<body data-page-type="articles"
      data-source="../../data/articles.json"
      data-view-mode="grid">
```

推荐资源顺序：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/articles-index.css">

<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
<script src="../../js/articles-index.js"></script>
```

说明：

- `css/articles-index.css` 只承载文章索引页样式，尽量不和详情页共用私有选择器。
- `css/category-theme.css` 统一维护六大类主题色；索引卡片分类标签使用 `article-category-tag[data-category]`。
- `js/category-theme.js` 统一提供分类 key / label 归一化接口；页面不得在单个 HTML 中重新定义分类主色。
- `js/articles-index.js` 只负责索引页的数据读取、筛选、卡片渲染、合集弹窗和布局切换。
- 文章卡片收藏按钮沿用 `preferences.js` 的 `data-qmlm-favorite-btn` 与 `data-qmlm-favorite-mode="icon"` 协议，按钮位于“阅读全文”左侧。
- 页面壳本身尽量薄，只保留挂载点和少量 data-attribute。

---

## 4. 详情页标准接口

推荐 body：

```html
<body data-category="philosophy"
      data-article-json="../../../../data/articles-json/Mao/★★★★★/shi-jian-lun.json"
      data-study-json="../../../../data/study-json/Mao/★★★★★/shi-jian-lun.json">
```

推荐资源顺序：

```html
<link rel="stylesheet" href="../../../../css/style.css">
<link rel="stylesheet" href="../../../../css/articles-detail.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script src="../../../../js/article-common.js"></script>
<script src="../../../../js/article-json.js"></script>
<script src="../../../../js/article-study.js"></script>
<script src="../../../../js/site-data.js"></script>
<script src="../../../../js/main.js"></script>
<script src="../../../../js/darkmode.js"></script>
<script src="../../../../js/cursor.js"></script>
```

若页面没有图表，不要无意义引入 Chart.js。

---

## 5. Tab 约定

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
| `further` | 延伸阅读 | 旧字段名；与 HTML 的 `#puzzle .puzzle-links` 同一块联结网络 |

补充说明：

- `further` 是精读 JSON 的字段名，不是另一个页面模块。
- HTML 中的 `puzzle-links` 是渲染容器名，和 `further` 不冲突。
- 如果暂时只保留 HTML 内容，也可以继续沿用这两个名字的历史约定。

---

## 6. 当前 JSON 接入状态

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

说明：

- 这些页面已经完成正文层 + 精读层的双 JSON 接入。
- 但它们当前仍多处在旧的平铺 HTML 路径；后续推广新约定时，应逐步迁入 `html/articles/{Mentor}/{Star}/`。
- 旧文档中“只完成 5 篇试点”的说法已过时，以本 README 为准。

---

## 7. `articles.html` 的维护口径

当前事实：

- 索引页应以 `data/articles.json` / `window.SITE_DATA.articles` 为权威来源。
- `articles.html` 不再承担原始资料池展示职责。
- 大块私有卡片数据、嵌套 fallback 和页面专有样式应逐步迁出到 `css/articles-index.css` 与 `js/articles-index.js`。
- 页面内应只保留壳、挂载点和少量配置，不再塞全文和大段兜底数据。

后续建议：

1. 优先以 `data/articles.json` / `window.SITE_DATA.articles` 为权威索引。
2. 以 `data/collections.json` / `window.SITE_DATA.collections` 为权威合集。
3. 索引页采用统一的卡片渲染器后，再逐步把其它展示页也迁入同样的模式。

---

## 8. 最近任务状态

“正文层、精读层、渲染层解耦”在本阶段视为**规范完成**：

- 正文层：`articles-json`。
- 精读层：`study-json`。
- 渲染层：`article-json.js` / `article-study.js` / `article-common.js`。

下一阶段重点是：

- 索引页壳化
- 通用卡片渲染器
- 视图模式切换
- 逐步清理旧 fallback 与历史抽取入口

---

## 9. 常见错误

1. 页面里继续硬编码全文，同时又声明 `data-article-json`。
2. 改正文只改 HTML，不改正文 JSON。
3. 把精读解释混入正文 JSON。
4. `mentor`、目录、JSON 路径不一致。
5. 复制某一篇页面作为模板时，把私有样式、私有图表和错误路径一起复制。
6. 把 `further` 当作和 `puzzle-links` 两套不同系统。
7. 忘记星级目录后导致相对路径退层不足。
8. 让索引页继续承担原始资料池和展示页双重职责。
