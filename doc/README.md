# QmlmReader 全局索引

> **这是什么**：一个以马克思主义经典阅读为主题的静态站点——文章精读、导师专栏、国际共运、文艺画廊与若干实验工具，纯 HTML/CSS/JS，无前端框架，无 package.json；服务端仅 `api/translate.js` 一个 Vercel 函数。
> **本文件是产品层①全局索引**，供项目所有者和接手的 AI 使用：看完本页即可知道所有文档在哪、每个模块谁说了算、动手前要守什么规矩。
> 编辑计划在 [PLAN.md](PLAN.md)（产品层②，项目所有者专用）；筹备中的模块在 [preparing/](preparing/)（产品层③）。

---

## 一、文档三层地图

| 层 | 文件/目录 | 给谁看 | 何时读 |
|---|---|---|---|
| 产品层① 全局索引 | **本文件** | 所有者 + 接手 AI | 接手/迷路时 |
| 产品层② 编辑计划 | [PLAN.md](PLAN.md) | 主要为所有者；AI 只维护状态格 | 分派任务时 |
| 产品层③ 筹备与规划 | [preparing/](preparing/) | 所有者 + AI | 涉及未竣工模块（3D 展厅、人物星图、experimental 五工具进度） |
| 学习层 规范 | [design-tokens.md](design-tokens.md)、[color-system.md](color-system.md) | 所有者 + AI | 写任何 CSS/页面前 |
| 学习层 经验笔记 | [learnings.md](learnings.md) | 人机双读 | 踩坑后登记；做同类事之前先查 |
| 工程层 横切 | [architecture/](architecture/README.md)（公共壳/状态中心）、[data/](data/README.md)（数据层） | AI 为主 | 改公共文件或数据时必读 |
| 工程层 模块 | [pages/](pages/README.md) → 12 个模块 README | AI 为主 | 改任何模块前必读其权责边界 |
| 档案区（三层之外） | `pages/experimental/research/`（研究档案）、`pages/masters/stalin-stellar-*.md`、根目录 `data-management-inventory.md` | 按需 | 默认不读 |

**知识流向规则**：工程层制作中积累的教训、UI 技巧、最优路径 → 登记 [learnings.md](learnings.md)；跨模块任务与裁定 → 登记 [PLAN.md](PLAN.md)；模块私有小项 → 留模块 README。

---

## 二、给接手 AI 的前五分钟

1. **技术栈一句话**：静态页 + 原生 JS；页面 `html/**/*.html`，样式 `css/`（令牌四文件 + 模块目录），数据 `data/`；`_tools/build_data.py` 生成 `js/site-data.js`；无 Node 工程，勿按 Vite/React 习惯操作。
2. **阅读顺序**：本文件 → 按任务层级进对应层文档 → 读真实源码。**文档与代码冲突时：代码为事实，文档为意图**，修改后同步文档并在 PLAN 登记。
3. **动手前三个必答**：这个文件属于谁的领地（见权责矩阵）？是否踩全局约束（design-tokens 的禁令清单）？是否需要跑 `python -I _tools/build_data.py --write`？

---

## 三、模块权责矩阵

> 「划清权责」的唯一权威表。所有模块共同禁改（公共层，改动走 architecture/README.md 并在 PLAN 登记）：`css/style.css`、4 个颜色令牌文件、`css/category-theme.css`、`js/main.js`、`js/site-data.js`（生成物）、`js/state-center.js`、`js/page-state-adapter.js`、`js/search.js`、`js/darkmode.js`、`js/cursor.js`、`js/preferences.js`、`api/` + `vercel.json`。

| 模块 | 页面领地 | 模块私有资产 | 共享/跨界资产 | 文档入口 |
|---|---|---|---|---|
| 首页 home | `html/index.html`、根 `index.html` | `css/home/index.css`、`js/shutter.js`、`js/daily-quote.js` | `data/history-events.js`（与国际+搜索共享）、`data/updates.json`（与 about 共享） | [pages/home](pages/home/README.md) |
| 关于 about | `html/about/`（3 页） | 无私有 css/js | `data/updates.json`（更新日志权威源） | [pages/about](pages/about/README.md) |
| 偏好 preferences | `html/preferences/` | `js/preferences.js`（全站注入，articles/masters 消费）、`css/preferences/` | 存储键 `qmlm:preferences:v1` | [pages/preferences](pages/preferences/README.md) |
| 文章 articles | `html/articles/`（索引页 + 30 详情页 + imported 1258 页 + 模板） | `js/articles-index.js`、`article-json.js`、`article-study.js`、`article-common.js`、`css/articles-index.css`、`articles-detail.css`、`css/articles/` | 数据层四件套归 data README | [pages/articles](pages/articles/README.md) |
| 下载 downloads | `html/downloads/` | `js/download-export.js` | `downloads/manifest.unified.json`（运行时权威）、`manifest.json`（E2 保留供管线） | [pages/downloads](pages/downloads/README.md) |
| 文艺 gallery | `html/gallery/`（soviet-jokes 自包含） | `js/mao-quotes-gallery.js`、`js/mao-column.js`、`css/gallery/` | `data/gallery.json`、`mao-quotes.json`、`mao-poetry-data.json` | [pages/gallery](pages/gallery/README.md) |
| 正名 rectify | `html/rectify/` | `js/rectify-json.js`、`css/rectify/` | `data/rectify-txt/`（源）→ `rectify-json/`（生成物禁改） | [pages/rectify](pages/rectify/README.md) |
| 导师 masters | `html/masters/` | `js/mentor/`、`css/masters/`（含 mentor-inline.css） | `data/masters/`、`js/preferences.js` 复用、chart.js CDN | [pages/masters](pages/masters/README.md) |
| 国际 international | `html/international/` | `js/international/`、`css/international/` | `data/history-events.js`（与首页共享，改前双方过表） | [pages/international](pages/international/README.md) |
| 拼图 puzzle | `html/puzzle/` | `js/puzzle/`、`css/puzzle/`（零硬编码色范本） | `data/study-json/` 只读；页面私有数据不进生成管线 | [pages/puzzle](pages/puzzle/README.md) |
| 工具集 toolkit | `html/toolkit/` | `css/toolkit/` | 无私有 js | [pages/toolkit](pages/toolkit/README.md) |
| 实验区 experimental | `html/experimental/` | `js/{marxist,qingma,xiaocezi,yangbanxi}/`、`css/{marxist,qingma,xiaocezi,yangbanxi,redify,experimental}/` | 视觉豁免（design-tokens §12）；进行中进度见 [preparing/experimental-tools.md](preparing/experimental-tools.md) | [pages/experimental](pages/experimental/README.md) |

---

## 四、关键工程入口

| 层 | 权威/入口 |
|---|---|
| 根跳转 | `index.html` → `html/index.html` |
| 全站公共样式 | `css/style.css`（@import 四令牌文件） |
| 全局约束 | [design-tokens.md](design-tokens.md)（禁令清单见其 §11） |
| 公共导航/章节导航 | `js/main.js` |
| 分类主题令牌 | `css/category-theme.css` + `js/category-theme.js`（页面单独引入） |
| 状态中心 | `js/state-center.js` + `js/page-state-adapter.js` |
| 聚合数据 | `js/site-data.js`（`_tools/build_data.py` 生成，禁手改） |
| 搜索 | `js/search.js`（main.js 自动加载） |
| 文章正文层 / 精读层 | `data/articles-json/{Mentor}/{Star}/{slug}.json` / `data/study-json/{Mentor}/{slug}.json` |
| 事实快照 | `python -I _tools/check_docs.py`（A3，数字断言以此回填） |

---

## 五、硬规则

1. 不把正文同时维护在 HTML、JSON、TXT、PDF 多处；正文只进 `data/articles-json/`。
2. 生成物（`js/site-data.js`、`data/rectify-json/`）禁手改；改源后跑 `python -I _tools/build_data.py --write`。
3. 新 CSS 禁裸 hex、禁新散值 z-index/断点/字体栈、禁新增页面内联样式——细则见 [design-tokens.md](design-tokens.md)。
4. 页面只放 `#nav-placeholder`，导航/暗色按钮由 main.js 注入。
5. experimental 五工具视觉豁免，但母站骨架（导航/暗色/相对路径）必须遵守。
6. 改任何文件前先查权责矩阵；跨界改动先在 [PLAN.md](PLAN.md) 登记。

---

## 六、编辑计划在哪

所有进行中/待办/已裁定事项见 [PLAN.md](PLAN.md)。本索引不重复其内容。
