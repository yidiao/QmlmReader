# 文艺模块 README

> 对应源码：`html/gallery/`、`data/gallery.json`、相关图片/音视频资源、公共脚本。  
> 作用：管理文艺展厅、子页面、搜索索引与视觉规则。

---

## 1. 页面范围

```text
html/gallery/gallery.html
html/gallery/anecdotes.html
html/gallery/mao-poetry-quotes.html
html/gallery/music.html
html/gallery/photos.html
html/gallery/poetry.html
html/gallery/propaganda.html
html/gallery/quotes.html
html/gallery/soviet.html
html/gallery/soviet-jokes/index.html
html/gallery/videos.html
```

> `soviet-jokes/` 为独立视觉页（同 `mao-poetry-quotes.html` 先例）：不加载全站壳，自带顶栏、深浅色与页内数据，2026-11 由外部「苏联笑话工程」整体迁入，替代原 `funfacts.html` 的笑话部分；原趣闻/逸闻部分拆至 `anecdotes.html`。

---

## 2. 当前资源链路

主入口 `gallery.html` 引入：

```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

子页面私有资源：

| 子页面 | 私有资源 |
|---|---|
| `anecdotes.html` | `css/gallery/anecdotes.css` |
| `soviet.html` | `css/gallery/soviet.css` |
| `mao-poetry-quotes.html` | `css/gallery/mao-column.css` + `js/mao-column.js` |
| `quotes.html` | `js/mao-quotes-gallery.js` |

> 注：`html/gallery/assets/` 当前为空目录（2026-11 核实）。

---

## 3. 数据源

| 数据 | 用途 |
|---|---|
| `data/gallery.json` | 文艺资源索引、搜索基础数据 |
| `data/mao-quotes.json` | 语录页数据（`js/mao-quotes-gallery.js:3` 加载，`quotes.html` 使用） |
| `data/mao-poetry-data.json` | 诗词专栏数据（`js/mao-column.js:384-385` 加载，`mao-poetry-quotes.html` 使用） |
| `js/site-data.js` | 聚合后的 `galleryIndex` |
| `html/gallery/soviet-jokes/data/*.json` | 笑话档案馆页面自带数据（672 则/精注/修订），页面私有，不进生成管线 |
| 图片/音视频资源目录 | 具体资源文件或外链 |

---

## 4. 视觉与维护重点

1. `gallery.html` 的内联样式已于 2026-11-07 外置为 `css/gallery/gallery.css`（PLAN C1）；页面走暗色沉浸 + 金色点缀的展厅风格。
2. 右侧悬停导航样式与 `toolkit.html` 有相似结构，后续可抽成公共组件。
3. 文艺资源新增时优先补 `data/gallery.json`，再检查搜索和页面展示。
4. 不要把大量资源清单硬塞进页面；页面只负责展示和跳转。
5. 全局样式/颜色/z-index 约束见 `doc/design-tokens.md`。

---

## 5. 权责边界

**拥有（可自由修改）**：
- `html/gallery/`（各展厅子页面与 `soviet-jokes/` 自包含页）
- `css/gallery/`（含 `anecdotes.css`、`soviet.css`、`mao-column.css` 等子页私有样式）
- `js/mao-quotes-gallery.js`、`js/mao-column.js`
- `data/gallery.json`、`data/mao-quotes.json`、`data/mao-poetry-data.json`

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js`、`js/cursor.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）

**共享/跨界资产**：
- `data/gallery.json`：进 `_tools/build_data.py` 聚合管线（产出 `js/site-data.js` 的 `galleryIndex`），同时是全站搜索基础数据；改动前需过 `doc/data/README.md`
- `html/gallery/soviet-jokes/`：自包含页，页面私有数据不进生成管线（现有表述保留）

**改动前置条件**：
- 改 `data/gallery.json` 后必须跑 `python _tools/build_data.py --write` 重建 `js/site-data.js`
- `data/mao-quotes.json`、`data/mao-poetry-data.json` 为子页运行时直接 fetch，不走构建管线；改动后核对 `quotes.html` 与 `mao-poetry-quotes.html` 展示
