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
5. 主入口必须仅保留 `#nav-placeholder` 接入公共导航；页面内可继续使用私有 `.container` 管理内容区，但不得影响公共 `.site-header-inner`。

---

## 5. 导师专题页新增规范：以斯大林小传为样板

斯大林专题本轮新增了“小传页 + 独立关系展板页”的分层样板，后续其他导师可参照，但不得把正文、关系网、样式和交互再次塞回单个 HTML。

### 5.1 文件分层

以斯大林为例：

```text
data/masters/stalin/profile.json      # 导师元数据、页面路径、主题入口
data/masters/stalin/biography.json    # 小传正文、章节、时间线、候选标注与阅读增强
data/masters/stalin/relations.json    # 人物关系网数据

html/masters/stalin/biography.html    # 小传阅读页
html/masters/stalin/relations.html    # 独立人物关系展板页

css/mentor/stalin/biography.css       # 小传阅读页专属样式
css/mentor/stalin/relations.css       # 关系展板页专属样式

js/mentor/stalin/biography.js         # 小传页数据加载、导航、正文渲染
js/mentor/stalin/relations.js         # 关系展板渲染与交互
```

### 5.2 小传页职责

小传页只负责“让人读进去”：

1. 顶部使用轻量标题，不堆砌大面积主题色块。
2. 专题分卷入口放在标题区域右侧或下方，紧凑指向关系展板、旧版概览或其他分卷。
3. 正文使用纸面卡片、章前摘要、重点句和补充说明增强阅读节奏。
4. 段落保留作者原文；如需结构化，只调整数据层段落边界，不在 HTML 中长期维护正文。
5. 段首采用中文长文两格缩进；候选标注不直接显示文字标签，使用边线、底纹等视觉层提示。

### 5.3 导航规范

小传导航采用“章节线索板”，而不是后台式菜单：

1. 默认以章节为主，显示章节编号、标题、章前重点句和关联年份。
2. 时间线是章节导航的从属视图，可切换显示，但不与正文导航平级。
3. 侧边导航应有独立容器，桌面端 sticky，内部可滚动，避免长文导航截断。
4. 使用 `IntersectionObserver` 或同类机制高亮当前章节，但不要另设与章节列表重复的“当前阅读”卡片。

### 5.4 正文增强数据

`biography.json` 可包含：

```json
{
  "sections": [
    {
      "id": "line-struggle",
      "number": "五",
      "title": "路线之争：悬崖上的独木桥",
      "summary": "章前摘要",
      "focus": "章前重点句",
      "paragraphs": []
    }
  ],
  "enhancements": {
    "highlights": [],
    "notes": []
  }
}
```

推荐增强类型：

| 类型 | 用途 |
|---|---|
| `background` | 时代背景、历史条件、人物处境 |
| `concept` | 概念解释，如 NEP、一国建成社会主义、不断革命论 |
| `controversy` | 高争议段落的阅读提示，如大饥荒、大清洗、秘密报告 |
| `interpretation` | 作者论证框架或类比的说明 |

重点段落使用 `highlightIds` 挂到段落数据上；页面可显示“重点”徽标或其他视觉强调。注意：增强内容是阅读辅助，不替代正文，也不应改写作者原文。

### 5.5 行内重点 `inlineMarks`

当需要强调“一句话”而不是整段时，不要在 HTML 中手写 `<strong>`，也不要在渲染后全页搜索替换。应在段落数据中声明行内标注：

```json
{
  "id": "p-028",
  "text": "……当时间不足以支撑理想大厦，务实便是唯一的道德。",
  "inlineMarks": [
    {
      "text": "当时间不足以支撑理想大厦，务实便是唯一的道德。",
      "type": "thesis",
      "style": "strong-red",
      "note": "全文核心判断之一"
    }
  ]
}
```

字段约定：

| 字段 | 用途 |
|---|---|
| `text` | 要强调的原文片段，必须能在 `paragraph.text` 中精确匹配 |
| `type` | 语义类型，如 `thesis`、`question`、`concept`、`metaphor`、`ending` |
| `style` | 显示样式，如 `strong-red`、`strong`、`strong-italic`、`gold`、`ending-seal` |
| `note` | 维护说明，可作为 `title` 提示，不替代正文 |

渲染器应在加载 JSON 后一次性生成带 `<span class="inline-mark ...">` 的 HTML。不要在滚动时重复渲染，不要对已经插入的 DOM 做大范围字符串替换。这样既保留正文数据权威，也避免回到“全文塞进 HTML”的维护方式。

### 5.6 阅读进度与历史记录

导师小传页可以复用 `js/preferences.js` 中的公共阅读进度和历史记录逻辑。最低接入约定：

1. 页面主体拥有 `.article-detail`。
2. 页面头部拥有 `.article-header`，用于触发偏好/历史逻辑。
3. `body` 提供稳定 `data-preference-key`，如 `mentor:stalin:biography`。
4. 正文区域可提供 `.tab-content.active`，章节使用 `.chapter`，章节标题使用 `.chapter-title`。
5. 如果正文由 JSON 异步渲染，渲染完成后设置 `window.__QMLMArticleRendered = true` 并派发 `qmlm:article-rendered`，以便历史恢复逻辑等待正文就绪。

不要复制 `preferences.js` 的进度条逻辑到导师私有脚本；小传页只做结构适配和必要主题样式覆盖。

### 5.7 关系网边界

人物关系网不是小传的附属列表。它可以参考小传，但应作为独立页面与独立数据源维护：

1. 小传页只保留入口，不内嵌完整关系网。
2. 关系页使用独立 `relations.json`，预留肖像、别名、活动时间、组织、事件、关系强度、关系方向、证据和弹窗字段。
3. 斯大林关系网当前是局部图谱，同时作为未来国际共运人物关系网的探路者。
4. 关系网视觉与交互单独迭代，不应影响小传页阅读体验。
