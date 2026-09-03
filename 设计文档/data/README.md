# 数据层维护 README

> 对应源码：`data/`、`downloads/`、`js/site-data.js`、`js/article-json.js`、`js/article-study.js`、`js/download-export.js`。  
> 作用：统一说明索引层、正文层、精读层、下载导出的权威来源和边界。

---

## 1. 数据层总原则

当前数据分为四类：

| 层 | 权威位置 | 负责什么 | 不负责什么 |
|---|---|---|---|
| 索引层 | `data/articles.json`、`data/collections.json`、`data/gallery.json`、`data/rectify.json` | 列表、筛选、搜索基础信息、页面入口 | 不存文章全文 |
| 正文层 | `data/articles-json/{Mentor}/{Star}/{slug}.json` | 文章正文、段落、章节、下载导出正文源 | 不存精读解释、不做全站索引 |
| 精读层 | `data/study-json/{Mentor}/{slug}.json` | 读法、难点、对话、行动、延伸/联结等轻结构内容 | 不存权威正文 |
| 下载入口层 | `downloads/manifest.unified.json` + `window.SITE_DATA.downloadData` | 下载中心条目入口与资源类别 | 不存全文正文 |

---

## 2. `data/articles.json`：文章索引层

用途：

- 文章列表页卡片与筛选。
- 搜索基础字段。
- 下载中心文章入口。
- 合集映射和页面路由。

典型字段：

```json
{
  "slug": "shi-jian-lun",
  "title": "实践论",
  "author": "毛泽东",
  "authorKey": "mao",
  "year": "1937",
  "priority": 5,
  "category": "哲学基础",
  "type": "philosophy",
  "keywords": ["认识论", "辩证法"],
  "file": "articles/Mao/shi-jian-lun.html",
  "ready": true,
  "collections": ["mao-philosophy"]
}
```

规则：

- 不要把正文塞进 `articles.json`。
- 页面、搜索、下载入口缺条目时，优先检查它。
- 改完后通过 `_tools/build_data.py` 生成 `js/site-data.js`。

---

## 3. `data/articles-json/`：正文层

正式路径：

```text
data/articles-json/{Mentor}/{Star}/{slug}.json
```

只允许顶层目录：

```text
Engels/
Lenin/
Mao/
Marx/
Stalin/
_meta/
```

推荐结构：

```json
{
  "title": "文章标题",
  "mentor": "Mao",
  "star": "★★★★★",
  "slug": "shi-jian-lun",
  "meta": {
    "author": "作者",
    "date": "日期",
    "category": "分类"
  },
  "original": {
    "titleLine": "标题行",
    "paragraphs": ["段落一", "段落二"],
    "chapters": [
      { "title": "章节标题", "paragraphs": ["..."] }
    ]
  }
}
```

兼容但不推荐的旧结构：

- `content: "全文长字符串"`
- `content: { value: "全文长字符串" }`
- `paragraphs: "全文长字符串"`

维护规则：

1. 顶层星级目录旧结构禁止再生成。
2. `_meta/` 只放清单、校验、映射，不放正文。
3. `mentor` 必须和页面目录一致。
4. 正文改造先在 JSON 层完成，再让页面接入。

---

## 4. `data/study-json/`：精读层

路径：

```text
data/study-json/{Mentor}/{slug}.json
```

当前口径：

- 正文层与精读层已经完成“规范层面的解耦”。
- 不要求本轮继续拆正文或精读内容。
- 后续若继续推进，只优先拆轻结构 Tab。

适合数据化的内容：

- `reading`
- `difficulty`
- `dialogue`
- `action`
- `further` / 文章联结网络

暂不强推统一数据化：

- `visual`
- `puzzle` 中复杂布局部分

页面接入方式：

```html
<body
  data-article-json="../../../data/articles-json/Mao/★★★★★/shi-jian-lun.json"
  data-study-json="../../../data/study-json/Mao/shi-jian-lun.json">
```

---

## 5. `js/site-data.js`：聚合产物

由 `_tools/build_data.py` 生成，结构大致是：

```js
window.SITE_DATA = {
  collections: [],
  articles: [],
  articleIndex: [],
  galleryIndex: [],
  rectifyIndex: [],
  downloadData: {}
};
```

规则：

- 不要手工维护 `js/site-data.js`。
- 改索引数据后，运行：

```bash
python _tools/build_data.py --write
```

---

## 6. 下载导出数据流

下载中心主入口：

```text
html/downloads/downloads.html
```

导出脚本：

```text
js/download-export.js
```

优先级：

1. 读取文章页声明的 `data-article-json`。
2. 从正文 JSON 导出 TXT / DOCX。
3. 未 JSON 化时，临时退回 HTML 抽取。

不要做：

- 不要把全文写进下载 manifest。
- 不要长期维护每篇文章的 TXT / DOCX / PDF 静态副本作为主方案。

---

## 7. 当前事实快照

- 非 imported 正式文章详情页：29 篇。
- 当前检测到 8 篇文章页带 `data-article-json` 与 `data-study-json`。
- `data/articles-json/` 当前约 33 个 JSON 文件。
- `data/study-json/` 当前约 29 个 JSON 文件。
- 当前 `articles.html`、公共脚本和部分页面仍存在兜底数据，后续应继续收敛。
