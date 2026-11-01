# 拼图模块 README

> 对应源码：`html/puzzle/`（hub + 子页）、`css/puzzle/`、`js/puzzle/`。  
> 作用：理论拼图模块门户，管理与文章页内 `puzzle` Tab 的边界。

---

## 1. 页面范围

```text
html/puzzle/puzzle.html            # 模块首页（hub 跳转页），2026-11 起
html/puzzle/theory-map.html        # 马哲理论拼图 · 理论图谱（六泳道画布，自 puzzle.html 迁入）
```

---

## 2. 当前资源链路

hub（`puzzle.html`，标准壳）：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/puzzle/puzzle.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

theory-map（标准壳 + 模块 JS）：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/category-theme.css">
<link rel="stylesheet" href="../../css/puzzle/theory-map.css">
<script src="../../js/category-theme.js"></script>
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/puzzle/theory-map-data.js"></script>  <!-- 页面私有节点数据 -->
<script src="../../js/puzzle/theory-map.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 3. 与文章页拼图的边界

当前口径：

- `puzzle.html` 是模块门户（hub），`theory-map.html` 是全局拼图泳道画布。
- 文章详情页里的 `puzzle` Tab 先做单篇文章内部的关系网络，不急于和全局拼图深度耦合。
- 文章页联结卡可优先由 `data/study-json/{Mentor}/{slug}.json` 的 `further` 或关系字段驱动。

---

## 4. 当前维护重点

1. ~~`puzzle.html` 内联样式和脚本体量很大，后续应拆出模块 CSS/JS。~~ 已完成（2026-11）：页面拆为 hub + `theory-map.html`，样式在 `css/puzzle/`，脚本与数据在 `js/puzzle/`。
2. ~~页面私有 dark mode localStorage 逻辑~~ 已删除，统一走 `js/darkmode.js` + 状态中心；旧内联汉堡菜单 IIFE（与 `js/main.js` 双重绑定）已删除。
3. 全局图谱数据如果继续扩展，应独立设计数据结构，不要直接复用单篇文章 `puzzle-links`；当前节点数据在 `js/puzzle/theory-map-data.js`（页面私有，不进 `data/` 生成管线）。
4. 六大泳道色统一使用 `css/category-theme.css` 的 `--category-*` token（`theory-map.css` 以 CSS fill/stroke 覆盖 SVG presentation attribute，SVG 内等值十六进制仅作兜底）；数据里优先保存分类 key，不再新增分散的 `badgeColor` 硬编码。
5. 画布高度依赖 `--masthead-h`（`js/puzzle/theory-map.js` 实测 `.site-header` 写入，导航收起悬浮球时记 0），修改头部结构时需回归验证。
