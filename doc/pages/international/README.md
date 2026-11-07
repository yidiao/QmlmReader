# 国际模块 README

> 对应源码：`html/international/`、`data/history-events.js`、公共脚本。  
> 作用：管理国际主题入口、栏目页、日历页、纪念页和相关数据。

---

## 1. 页面范围

```text
html/international/international.html
html/international/international-calendar.html
html/international/international-column.html
html/international/international-current.html
html/international/international-memorial.html
html/international/international-column/foundations.html
html/international/international-column/encirclement.html
html/international/international-column/tieliu-yu-xianfeng.html
```

---

## 2. 当前资源链路

主入口 `international.html` 引入：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/international/international.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

模块资源（2026-11 审计核实）：

- `css/international/` 共 4 个文件：`international.css`（主入口）、`international-column.css`（栏目页）、`international-calendar.css`（日历页，带 `?v=20261101` 缓存参数）、`tieliu-yu-xianfeng.css`（铁流与先锋专栏页）。
- `js/international/international-calendar.js`：日历页脚本，由 `international-calendar.html` 加载（同样带 `?v=20261101` 缓存参数）。
- 全局样式/颜色/z-index 约束见 `doc/design-tokens.md`。

---

## 3. 数据与功能

| 功能 | 来源 |
|---|---|
| 历史日历/事件 | `data/history-events.js`（日历页显式加载，权威数据源；与首页、全站搜索共用，见「权责边界」） |
| 栏目与纪念页内容 | 当前多在 HTML 中维护；现有三个国际专栏入口另由 `js/search.js` 的轻量索引提供全站检索 |
| 公共导航与样式 | `js/main.js`、`css/style.css` |

---

## 4. 维护重点

1. ~~主入口当前有大量内联样式，后续可下沉模块 CSS。~~ 已完成（2026-11）：`international.html` 已 0 个 style 块，样式下沉至 `css/international/international.css`；`current`/`memorial` 两个子页仍有内联样式，后续可按需下沉。
2. 栏目页层级不同，脚本和样式相对路径要分别核对。
3. 日历数据口径已明确（2026-11）：日历页直接加载 `data/history-events.js`，该文件即权威数据源；它与首页、全站搜索共用，改动前需过 `doc/pages/home/README.md` 和 `doc/README.md` 权责矩阵。
4. 栏目内容暂未形成独立 JSON 层，新增前先决定是否继续 HTML 管理。

---

## 5. 权责边界

**拥有（可自由修改）**：
- `html/international/`（主入口、栏目页、日历页、current/memorial 子页）
- `js/international/`（international-calendar.js）
- `css/international/`（international.css、international-column.css、international-calendar.css、tieliu-yu-xianfeng.css）

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）
- `js/search.js` 的轻量索引（专栏入口检索）

**共享/跨界资产**：
- `data/history-events.js`：与首页（“历史上的今天”）、全站搜索共用，改动前必须过 `doc/pages/home/README.md` 和 `doc/README.md` 权责矩阵

**改动前置条件**：
- 修改 `data/history-events.js` 的数据结构（而非仅追加条目）时，先同步核对首页与全站搜索的读取字段
- 日历页脚本/样式更新后，同步递增 `?v=` 缓存参数（当前 `20261101`）
