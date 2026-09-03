# 导师模块 README

> 对应源码：`html/masters/`、导师图片资源、`data/articles.json`、公共脚本。  
> 作用：管理导师总入口、分导师页面、导师文章入口和视觉规则。

---

## 1. 页面范围

```text
html/masters/masters.html
html/masters/marx/marx.html
html/masters/engels/engels.html
html/masters/lenin/lenin.html
html/masters/stalin/stalin.html
html/masters/mao/mao.html
```

---

## 2. 当前资源链路

主入口 `masters.html` 引入：

```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 3. 数据关系

| 功能 | 来源 |
|---|---|
| 导师卡片与分导师入口 | 当前主要在 HTML 中维护 |
| 文章列表/跳转 | 应优先对齐 `data/articles.json` |
| 导师文章详情 | `html/articles/{Mentor}/{slug}.html` |

---

## 4. 维护重点

1. 导师页是导航与入口页，不应重复维护完整文章索引。
2. 分导师页面如果展示文章，应尽量读取或对齐 `data/articles.json`。
3. 导师头像/图片资源路径修改后，要同步检查总页与分页。
4. 视觉走红黑金构成主义卡片风格，后续可抽成模块 CSS。
