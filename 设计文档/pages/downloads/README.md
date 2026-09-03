# 下载模块 README

> 对应源码：`html/downloads/downloads.html`、`js/download-export.js`、`downloads/manifest.unified.json`、`js/site-data.js`、文章正文 JSON。  
> 作用：管理下载中心页面、下载入口数据和 TXT / DOCX 导出规则。

---

## 1. 页面范围

```text
html/downloads/downloads.html
```

下载中心是文章和资源下载的主入口；文章详情页不再强制提供下载按钮。

---

## 2. 当前资源链路

```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/download-export.js"></script>
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

页面内当前读取：

```js
var downloadData = (window.SITE_DATA && window.SITE_DATA.downloadData) || { articles: [], rectify: [], posters: [] };
```

---

## 3. 数据源与导出优先级

| 类别 | 入口数据 | 正文/内容来源 |
|---|---|---|
| 文章 | `window.SITE_DATA.downloadData.articles` | 优先由文章页 `data-article-json` 指向正文 JSON |
| 正名专题 | `window.SITE_DATA.downloadData.rectify` | 当前按专题资源/页面结构维护 |
| 图片/大包资源 | `window.SITE_DATA.downloadData.posters` | 可保留外链或资源入口 |

导出优先级：

1. 读取文章页上的 `data-article-json`。
2. 从 `data/articles-json/...` 导出 TXT / DOCX。
3. 未 JSON 化页面临时退回 HTML 抽取。

---

## 4. 维护规则

1. 不要把全文正文写进下载 manifest。
2. 不要长期维护每篇文章的静态 TXT / DOCX / PDF 成品作为主方案。
3. 改下载入口字段后，检查 `_tools/build_data.py` 和 `js/site-data.js` 生成结果。
4. 下载按钮、弹窗、格式选择逻辑统一由 `js/download-export.js` 承担。
