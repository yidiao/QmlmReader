# 拼图模块 README

> 对应源码：`html/puzzle/puzzle.html`、公共脚本、未来可能的数据层。  
> 作用：管理全局理论拼图原型，与文章页内 `puzzle` Tab 的边界。

---

## 1. 页面范围

```text
html/puzzle/puzzle.html
```

---

## 2. 当前资源链路

```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 3. 与文章页拼图的边界

当前口径：

- `html/puzzle/puzzle.html` 是全局拼图原型。
- 文章详情页里的 `puzzle` Tab 先做单篇文章内部的关系网络，不急于和全局拼图深度耦合。
- 文章页联结卡可优先由 `data/study-json/{Mentor}/{slug}.json` 的 `further` 或关系字段驱动。

---

## 4. 当前维护重点

1. `puzzle.html` 内联样式和脚本体量很大，后续应拆出模块 CSS/JS。
2. 当前页面有私有 dark mode localStorage 逻辑，后续应和 `js/darkmode.js` 统一。
3. 全局图谱数据如果继续扩展，应独立设计数据结构，不要直接复用单篇文章 `puzzle-links`。
4. 注意源码中存在疑似 CSS 色值缺 `#` 的写法，如 `background: c0c1c3;`，后续做视觉修复时应核查。
