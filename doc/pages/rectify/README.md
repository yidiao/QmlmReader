# 正名模块 README

> 对应源码：`html/rectify/`、`data/rectify.json`、`data/rectify-*.txt`、公共脚本。  
> 作用：管理正名专题入口、分主题页面、专题文本数据与视觉边界。

---

## 1. 页面范围

```text
html/rectify/rectify.html
html/rectify/economy/soviet-agriculture.html
html/rectify/leaders/gorky-lenin.html
html/rectify/leaders/pol-pot.html
html/rectify/leaders/stalin-era.html
html/rectify/military/finland-war.html
html/rectify/military/soviet-afghanistan.html
html/rectify/myths/human-nature.html
html/rectify/myths/power-illusion.html
html/rectify/myths/wisdom-of-elites.html
html/rectify/myths/young-october.html
```

---

## 2. 当前资源链路

主入口 `rectify.html` 引入：

```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 3. 数据源

| 文件 | 用途 |
|---|---|
| `data/rectify.json` | 正名专题索引、搜索入口 |
| `data/rectify-*.txt` | 专题文本素材/正文来源 |
| `js/site-data.js` | 聚合后的 `rectifyIndex` |

---

## 4. 维护重点

1. `rectify.html` 当前存在重复/内联样式块，后续应下沉为模块 CSS。
2. 新增专题时，同步维护页面、`data/rectify.json` 和下载/搜索入口。
3. 分主题页面路径较深，公共脚本相对路径要核对。
4. 不要让页面内容、txt 数据和索引长期互相冲突；需要明确每篇专题的权威正文来源。
