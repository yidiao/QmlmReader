# articles-json 正文维护规范

> 作用：专门约束 `data/articles-json/` 这一层的正文组织、目录结构、字段规范与校验思路。  
> 使用方式：凡涉及正文提取、分段、章节组织、正文 JSON 清理、正文源接入页面的任务，必须先读本文。

---

## 一、职责边界

`articles-json` 是 **正文数据层**，不是全站索引层。

它负责：

- 文章正文文本
- 标题与基础元信息
- 段落数组
- 章节组织
- 页面原文 tab 的数据来源
- TXT / DOCX 导出的正文来源

它不负责：

- 全站文章筛选索引（那是 `data/articles.json` 的职责）
- 合集定义（那是 `data/collections.json` 的职责）
- 下载中心入口索引（那是 `downloads/manifest.unified.json` / `data/articles.json` 的职责）

---

## 二、正式目录结构

```text
data/articles-json/
  Engels/
    ★★★★★/
  Lenin/
    ★★★★★/
    ★★☆☆☆/
  Mao/
    ★★★★★/
    ★★★★☆/
    ★★★☆☆/
  Marx/
    ★★★★★/
    ★★★★☆/
    ★★★☆☆/
  Stalin/
    ★★★★★/
    ★★★☆☆/
    ★★☆☆☆/
  _meta/
```

### 硬规则

1. 文章正文 JSON 只能放在：

```text
data/articles-json/{Mentor}/{Star}/{slug}.json
```

2. 顶层 `★★★★★/slug.json` 一类路径禁止再出现。
3. `_meta/` 只放辅助清单与校验文件，不放正文。
4. `mentor` 必须和 HTML 页面目录一致。

---

## 三、推荐字段结构

推荐统一成下面的结构：

```json
{
  "title": "实践论",
  "mentor": "Mao",
  "star": "★★★★★",
  "slug": "shi-jian-lun",
  "source": "D:\\...\\实践论.txt",
  "meta": {
    "author": "毛泽东",
    "subtitle": "关于认识和实践的关系——知和行的关系",
    "date": "1937年7月",
    "category": "哲学基础 · 辩证法",
    "wordCount": "约9,400字",
    "lengthTag": "中篇"
  },
  "original": {
    "titleLine": "实践论 ——论认识和实践的关系——知和行的关系",
    "paragraphs": [
      "第一段……",
      "第二段……"
    ],
    "chapters": [
      {
        "title": "一 认识和实践",
        "paragraphs": ["……"]
      }
    ]
  }
}
```

---

## 四、旧结构兼容说明

当前仓库里仍存在旧格式：

### 1. 单字符串正文

```json
{
  "content": "全文长字符串"
}
```

### 2. PowerShell 风格对象包裹正文

```json
{
  "content": {
    "value": "全文长字符串"
  }
}
```

### 3. 错用 `paragraphs` 保存长字符串

```json
{
  "paragraphs": "全文长字符串"
}
```

这些结构都不理想，只能视为过渡态。后续应逐步迁到：

- `meta`
- `original.paragraphs`
- `original.chapters`

---

## 五、分段原则

### 1. 原则

- 优先从原始 TXT 重提取
- 不追求一次性 OCR 清洗到完美，但必须先分段可维护
- 不要把整篇文章压成一个字段或一大段文本
- 段落数组应尽量保留自然阅读边界

### 2. 最低要求

每篇文章至少要有：

```json
"original": {
  "paragraphs": ["..."],
  "chapters": [ ... ]
}
```

### 3. 章节要求

- `chapters` 是阅读组织层
- 可依据原文结构，也可依据维护所需重组
- 但每章必须能解释其划分逻辑

---

## 六、页面接入规则

精读页如果改为 JSON 驱动正文，应在 `<body>` 上声明：

```html
<body data-category="philosophy" data-article-json="../../../data/articles-json/Mao/★★★★★/shi-jian-lun.json">
```

并引入：

```html
<script src="../../../js/article-common.js"></script>
<script src="../../../js/article-json.js"></script>
```

说明：

- `article-common.js` 负责 tab / 章节折叠 / 下载按钮等通用交互
- `article-json.js` 负责把 `articles-json` 的正文渲染进原文 tab

---

## 七、下载接入规则

JSON 驱动正文页的下载应由：

- `js/download-export.js`

自动识别页面上的 `data-article-json`，并从正文 JSON 导出：

- `.txt`
- `.docx`

不再要求预生成：

- PDF
- TXT 成品
- DOCX 成品

---

## 八、`_meta` 文件说明

### `manifest.json`

记录页面与正文源的人工映射，是正文维护时的重要索引。

### `manifest.generated.json`

在 `manifest.json` 基础上补出当前 JSON 路径的派生文件。

### `validation.json`

记录页面接口状态：

- 有无 tab
- 有无 original 区块
- 是否接入 `article-common.js`
- 是否接入 JSON 正文

### `validation-final.json`

记录巡检摘要：

- 文件名
- 标题
- 字符数
- tab 状态

---

## 九、维护时的常见错误

1. 把正文 JSON 写到顶层星级目录
2. 让 `mentor` 和 HTML 所在目录不一致
3. 一边改 HTML 原文，一边不改 `articles-json`
4. 用 `content` 巨字符串继续堆正文，不做分段
5. 把 `_meta` 文件误当正文数据

---

## 十、建议的推进顺序

1. 先清理路径与导师归类
2. 再把旧字符串 JSON 逐篇迁到结构化 `original.paragraphs`
3. 再让对应文章页接入 `data-article-json`
4. 最后再做更高层的正文复用与自动化同步
