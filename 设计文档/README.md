# QmlmReader 设计文档总览

> 入口规则：人工和 AI 都先读本文。本文只放导航、当前状态和任务分发；具体页面、数据、样式、脚本细节进入对应模块 README。  
> 误判规避：总览层尽量使用中性工程命名，例如“experimental 模块”“文体工具”“页面模块”，避免在入口层集中堆叠长 Prompt、研究稿标题或敏感词。原始研究资料保留在模块 research 目录内。

---

## 一、给我看：进度、要求和下一步

### 1. 当前文档整理原则

1. **总括文档分两块**：
   - 给我看：写进度、要求、当前决策、下一步。
   - 给 AI 看：写技术栈、阅读顺序、路径索引、权威来源。
2. **按页面/模块管理文档**：
   - `html/<module>/...` 对应 `设计文档/pages/<module>/README.md`。
   - 每个页面模块尽量一个 README，避免继续散成大量小文档。
3. **数据层和页面层分开**：
   - 页面模块 README 说明页面、脚本、样式、交互。
   - `设计文档/data/README.md` 统一说明 `data/`、`js/site-data.js`、正文层、精读层、下载导出等。
4. **旧任务记录不再作为当前待办**：重复、过期或与最新说明冲突的内容，以本文和模块 README 为准。

### 2. 最近任务进度确认

你已说明：最近记录中的“文章正文层、精读层、渲染层等解耦”任务，当前视为**已完成阶段性规范任务**。

实际口径更新为：

- 本轮已经完成的是：分层规范、目录规则、页面接入规则、下载边界、`study-json` 路线预留等架构约定。
- 正文与精读的继续拆分不是当前未完成任务；后续如要继续推进，应另开任务。
- 旧文档中把这件事写成“紧急待办/最近待办”的地方，不再作为当前状态依据。

### 3. 当前站点模块

| 模块 | 页面路径 | 文档入口 | 当前用途 |
|---|---|---|---|
| 首页 | `html/index.html` | `设计文档/pages/home/README.md` | 首页、站点入口、今日内容、搜索入口 |
| 关于 | `html/about/` | `设计文档/pages/about/README.md` | 关于页、更新日志 |
| 个人偏好 | `html/preferences/` | `设计文档/pages/preferences/README.md` | 本地收藏、阅读历史、视图设置入口 |
| 文章 | `html/articles/` | `设计文档/pages/articles/README.md` | 文章列表、导师文章页、精读页壳 |
| 下载 | `html/downloads/` | `设计文档/pages/downloads/README.md` | TXT / DOCX 导出入口、资源聚合 |
| experimental | `html/experimental/` | `设计文档/pages/experimental/README.md` | 实验工具入口及子工具 |
| 文艺 | `html/gallery/` | `设计文档/pages/gallery/README.md` | 文艺资源、图片/音乐/视频/语录等 |
| 正名 | `html/rectify/` | `设计文档/pages/rectify/README.md` | 主题辩误/专题文章入口 |
| 导师 | `html/masters/` | `设计文档/pages/masters/README.md` | 导师主页和分导师入口 |
| 国际 | `html/international/` | `设计文档/pages/international/README.md` | 国际主题栏目、日历、纪念页 |
| 拼图 | `html/puzzle/` | `设计文档/pages/puzzle/README.md` | 全局理论拼图原型 |
| 工具集 | `html/toolkit/` | `设计文档/pages/toolkit/README.md` | 工具集入口和工具页 |

### 4. 优先维护方向

当前不需要立刻重做已完成的解耦规范。更适合的后续顺序是：

1. 补齐各页面模块的真实数据源、JS、CSS、页面职责说明。
2. 继续减少页面内联样式和大段兜底数据。
3. 文章系统后续若继续做，再逐步推进正文结构化、精读轻结构数据化和渲染复用。
4. 阅读历史恢复采用本地记录 + 可取消自动跳转的交互，章节导航暂不调整，后续只在模块文档中补充接口预留说明。
5. experimental 模块的长篇研究稿继续放在 `设计文档/pages/experimental/research/`，总览只索引，不复制长文。

---

## 二、给 AI 看：快速定位工程细节

### 1. 技术栈判断

这是一个以静态页面为主体的原生前端项目：

- 页面：`html/**/*.html`
- 样式：`css/*.css` + 仍有不少页面内 `<style>`
- 脚本：`js/**/*.js`
- 数据：`data/**/*.json`、`data/**/*.js`、少量 `downloads/*.json`
- 构建聚合：`_tools/build_data.py` 生成 `js/site-data.js`
- 当前未发现根目录 `package.json`，不要默认按 Node/Vite 项目处理。

### 2. AI 接任务阅读顺序

1. 先读本文：`设计文档/README.md`。
2. 判断任务落在哪一层：
   - 页面/模块：读 `设计文档/pages/<module>/README.md`。
   - 数据/正文/精读/下载源：读 `设计文档/data/README.md`。
   - 全站壳、公共脚本、公共样式：读 `设计文档/architecture/README.md`。
3. 再读真实源码，不能只凭文档改代码。
4. 如果文档与代码冲突，以代码为事实，以文档为意图；修改后同步文档。

### 3. 关键工程入口

| 层 | 权威/入口 |
|---|---|
| 根跳转 | `index.html` -> `html/index.html` |
| 全站公共样式 | `css/style.css` |
| 公共导航/面包屑/章节导航 | `js/main.js` |
| 聚合数据 | `js/site-data.js`，由 `_tools/build_data.py` 生成 |
| 搜索 | `js/search.js` |
| 文章列表索引 | `data/articles.json` |
| 文章正文层 | `data/articles-json/{Mentor}/{Star}/{slug}.json` |
| 文章精读层 | `data/study-json/{Mentor}/{slug}.json` |
| 文章正文渲染 | `js/article-json.js` |
| 精读层渲染 | `js/article-study.js` |
| 文章页公共交互 | `js/article-common.js` |
| 下载导出 | `js/download-export.js` |
| 个人偏好 | `html/preferences/preferences.html` + `js/preferences.js` |

### 4. 当前代码事实快照

- `html/` 下主要模块：`about`、`articles`、`downloads`、`experimental`、`gallery`、`international`、`masters`、`preferences`、`puzzle`、`rectify`、`toolkit`。
- 非 imported 的正式文章详情页：29 篇。
- `data/articles-json/` 当前约 33 个 JSON 文件。
- `data/study-json/` 当前约 29 个 JSON 文件。
- 当前检测到 8 篇文章页带 `data-article-json`，并且同 8 篇带 `data-study-json`：
  - `html/articles/Engels/fan-du-lin-lun.html`
  - `html/articles/Engels/jia-ting-si-you-zhi-he-guo-jia-de-qi-yuan.html`
  - `html/articles/Lenin/guo-jia-yu-ge-ming.html`
  - `html/articles/Mao/shi-jian-lun.html`
  - `html/articles/Marx/gongchan-dan-yuan.html`
  - `html/articles/Stalin/dao-lunen.html`
  - `html/articles/Stalin/lun-lunen-zhu-yi-ji-chu.html`
  - `html/articles/Stalin/lun-zhongguo-ge-ming-de-qiantu.html`
- 许多 HTML 页面仍有内联 `<style>`；视觉规范后续应逐步下沉到 `css/`。
- `articles.html` 仍有较大的内嵌合集兜底数据；后续应继续收敛到 `window.SITE_DATA.collections` / `data/collections.json`。

### 5. 硬规则

1. 不要把正文长期同时维护在 HTML、JSON、TXT、PDF 多处。
2. 正文层只放 `data/articles-json/{Mentor}/{Star}/{slug}.json`。
3. 精读层如继续数据化，放 `data/study-json/{Mentor}/{slug}.json`，不要混进正文 JSON。
4. `js/site-data.js` 是生成产物，原则上不要手工改。
5. 修改页面前，先确认该模块 README 中的“数据源 / 脚本 / 样式 / 边界”。
6. experimental 模块的长 Prompt 和研究稿不要复制到总览；只保留路径和工程结论。
