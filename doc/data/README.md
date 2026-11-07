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
| 精读层 | `data/study-json/{Mentor}/{slug}.json`（flat，全库无例外——A5 已于 2026-11-07 迁平） | 读法、难点、对话、行动、延伸/联结等轻结构内容 | 不存权威正文 |
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

路径（flat，无星级层；2026-11-06 审计更正旧文档的 `{Mentor}/{Star}/{slug}` 写法；2026-11-07 A5 将唯一例外 soviet-socialist-economy 迁平，现全库无例外）：

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
- `further` / 文章联结网络（HTML 中对应 `#puzzle .puzzle-links`，历史命名兼容）

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
  articleIndex: [],   // 2026-11-07（A6）起为整条复制，含 date/type/ready/collections 全字段；priority 保持字符串
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

## 7. `data/` 全量归属表（2026-11-06 审计补登）

§1 四层之外，`data/` 下其余文件/目录的归属与角色：

| 文件/目录 | 角色 | 归属模块 | 备注 |
|---|---|---|---|
| `data/history-events.js` | 运行时历史事件数据（`window` 注入） | **共享**：首页 + 国际日历 + 全站搜索 | 改动需过两个模块 README |
| `data/updates.json` | 更新日志 | 首页 + about 共享 | about/changelog 页 fetch |
| `data/mao-quotes.json` | 毛语录数据 | gallery（quotes 页、mao-column.js） | |
| `data/mao-poetry-data.json` | 毛诗词数据 | gallery（mao-column.js） | |
| `data/masters/` | 导师页数据（profile/biography 等） | masters | `stalin/relations.json` 已于 2026-11-07 删除（D2，数据内联进 stellar-data.js） |
| `data/rectify-txt/` | 正名正文 TXT 源（10 篇） | rectify | `_tools/build_rectify_json.py` 的输入 |
| `data/rectify-json/` | 正名正文 JSON | rectify | **生成产物，禁手改** |
| `data/rectify.json` | 正名索引 | rectify | 构建中间物，运行时无人直读（经 site-data.js 的 rectifyIndex 生效） |
| `data/rectify-*.txt`（顶级 7 个） | 旧版专题文本 | 无 | 已于 2026-11-07 删除（D3，删前复核代码目录零引用） |
| `data/articles_structure.json` | 结构参考 | 构建侧 | |
| `data/soviet_filelist.json` | soviet-jokes 资源清单 | gallery/soviet-jokes | |
| `downloads/manifest.json` | 旧版下载 manifest | downloads | **保留**（E2 决策）：被导入/重建管线 6 个脚本读写，退役会断休眠工具链；运行时权威是 unified |
| `downloads/manifest.unified.json` | 统一下载 manifest（约 439KB） | downloads | `build_data.py` 输入 → `SITE_DATA.downloadData` |
| `downloads/{articles,posters,rectify}/` | 资源目录 | downloads | articles/rectify 下 PDF 已清空；posters/ 为海报资源 |

**执行权责**：运行 `python _tools/build_data.py --write` 的前提是改过索引/清单源文件；跑完必须确认 `git diff js/site-data.js` 与改动相符。生成产物（`js/site-data.js`、`data/rectify-json/`）任何模块不得手改。

## 8. 当前事实快照

> 数字以 `python -I _tools/check_docs.py` 的 2026-11-07 实测为准（A3 建成，重跑回填）。

- 非 imported 正式文章详情页：30 篇；`articles.json` 条目 1287（imported 1257 + 非 imported 30），页面↔索引一一对应（A4 补齐 `lun-wo-guo-ge-ming`）。
- 双声明 `data-article-json` + `data-study-json` 的非 imported 文章页：9 篇；rectify 10 子页另走 `data-article-json` 复用正文层协议。
- `data/articles-json/` 当前 34 个 JSON 文件（正文 30 + `_meta/` 4）。
- `data/study-json/` 当前 30 个 JSON 文件，全 flat（A5 完成，无层级例外）。
- `articles.html` 索引兜底已收敛（C3）：页面加载 `js/site-data.js`，唯一数据源 `SITE_DATA.articles` 过滤 imported；公共脚本兜底已收敛（C4）。
