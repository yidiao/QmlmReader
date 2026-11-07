# 首页模块 README

> 对应源码：`html/index.html`、根 `index.html`、`data/updates.json`、`data/history-events.js`、`js/daily-quote.js`、公共脚本。  
> 作用：管理站点首页、入口跳转、今日内容与首页私有视觉；全站搜索由公共导航提供。

---

## 1. 页面范围

```text
index.html       # 根入口，meta refresh 到 html/index.html
html/index.html  # 真正首页
```

根入口只负责跳转，不应承载业务逻辑。

---

## 2. 当前资源链路

`html/index.html` 当前引入：

```html
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="../css/home/index.css">
<script src="../js/site-data.js"></script>
<script src="../js/main.js"></script>
<script src="../js/shutter.js"></script>
<script src="../data/history-events.js"></script>
<script src="../js/daily-quote.js"></script>
<script src="../js/darkmode.js"></script>
<script src="../js/cursor.js"></script>
```

其中 `css/home/index.css`（约 19.6KB）由 `html/index.html:37` 实际引入，承载首页私有视觉。

---

## 3. 数据源

| 功能 | 数据/脚本 |
|---|---|
| 站点聚合数据 | `js/site-data.js` |
| 全站搜索 | 公共导航输入框 + `js/search.js` + `window.SITE_DATA`；由 `main.js` 自动加载，运行态发布到 `QMLMState.search` |
| 历史上的今天 | `data/history-events.js` |
| 今日语录 | `js/daily-quote.js`；语录为脚本内置硬编码数组（约 30 条），脚本无 fetch，不读外部语录数据（`data/mao-quotes.json` 归 gallery 模块使用，与本页无关） |
| 更新日志 | `data/updates.json` |

---

## 4. 维护重点

1. 首页页面内 `<style>` 已全部迁出：`html/index.html` 现为 0 个 style 块，首页私有样式统一在 `css/home/index.css`；后续新增首页样式直接进该文件，不要再写回页面。
2. 搜索相关改动先看 `js/main.js`、`js/search.js` 和 `data/*`；首页不再维护独立搜索 DOM。
3. 更新日志改动优先维护 `data/updates.json`，不要把日志写死在页面里。
4. 保持根 `index.html` 简洁跳转，不要在根页复制首页内容。
5. 全局样式/颜色/z-index 约束见 `doc/design-tokens.md`。

---

## 5. 桌面版 3D 展厅（规划中）

路线、决策、物件映射与验收标准见 [`doc/preparing/3d-hall-roadmap.md`](../../preparing/3d-hall-roadmap.md)（产品层③ 筹备与规划）。

摘要：

- 桌面端特供，不替换 `html/index.html`；移动端继续走经典首页。
- 运行时 = Blender 烘焙大图 + 三层视差 + DOM 热区，**不引入 three.js**。
- 场景静态（无人、无相机运动），可点物件 ≤ 8。
- 页面自包含在 `html/hall/`（`hall.html` / `hall.css` / `hall.js` / `scene-data.js` / `assets/`），不加载公共导航与首页脚本。
- 视觉原则：**视觉重、交互轻**。

---

## 6. 权责边界

**拥有（可自由修改）**：
- `html/index.html`（真首页）
- 根 `index.html`（仅负责跳转）
- `css/home/index.css`（首页私有样式）
- `js/shutter.js`（开屏动效）、`js/daily-quote.js`（今日语录）
- 首页开屏状态键 `qmlm:home-opening:last-shown:v1`（本模块私有 localStorage 键）

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js`、`js/cursor.js`、`js/search.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）

**共享/跨界资产**：
- `data/history-events.js`：与国际模块、全站搜索共享，改动前需过 `doc/pages/international/README.md`
- `data/updates.json`：与 about 模块（更新日志页）共享，改动前需过 `doc/pages/about/README.md`

**改动前置条件**：
- `data/updates.json` 与 `data/history-events.js` 均为页面运行时直接加载（fetch / `<script>`），不经过 `_tools/build_data.py`；因属跨模块共享数据，改动后需同时核对首页与 about、international 相关页面的展示。
