# 文艺模块 README

> 对应源码：`html/gallery/`、`data/gallery.json`、相关图片/音视频资源、公共脚本。  
> 作用：管理文艺展厅、子页面、搜索索引与视觉规则。

---

## 1. 页面范围

```text
html/gallery/gallery.html
html/gallery/funfacts.html
html/gallery/mao-poetry-quotes.html
html/gallery/music.html
html/gallery/photos.html
html/gallery/poetry.html
html/gallery/propaganda.html
html/gallery/quotes.html
html/gallery/soviet.html
html/gallery/videos.html
```

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

---

## 3. 数据源

| 数据 | 用途 |
|---|---|
| `data/gallery.json` | 文艺资源索引、搜索基础数据 |
| `js/site-data.js` | 聚合后的 `galleryIndex` |
| 图片/音视频资源目录 | 具体资源文件或外链 |

---

## 4. 视觉与维护重点

1. `gallery.html` 当前有内联样式，走暗色沉浸 + 金色点缀的展厅风格。
2. 右侧悬停导航样式与 `toolkit.html` 有相似结构，后续可抽成公共组件。
3. 文艺资源新增时优先补 `data/gallery.json`，再检查搜索和页面展示。
4. 不要把大量资源清单硬塞进页面；页面只负责展示和跳转。
