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
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 3. 数据与功能

| 功能 | 可能来源 |
|---|---|
| 历史日历/事件 | `data/history-events.js` |
| 栏目与纪念页内容 | 当前多在 HTML 中维护 |
| 公共导航与样式 | `js/main.js`、`css/style.css` |

---

## 4. 维护重点

1. 主入口当前有大量内联样式，后续可下沉模块 CSS。
2. 栏目页层级不同，脚本和样式相对路径要分别核对。
3. 若日历数据复用首页“历史上的今天”，应明确 `data/history-events.js` 为权威数据源。
4. 栏目内容暂未形成独立 JSON 层，新增前先决定是否继续 HTML 管理。
