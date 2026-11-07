# 全站架构维护 README

> 对应源码：根入口、`html/index.html`、`css/style.css`、`js/main.js`、`js/site-data.js`、公共脚本、`api/` + `vercel.json`（Vercel serverless）。  
> 作用：让 AI 和维护者快速判断“站点壳、公共导航、公共样式、聚合数据”该从哪里改。  
> 权责：本 README 管辖「公共层领地」（总览权责矩阵脚注清单）；任何模块改动这些文件前必须先读本文，并在`doc/PLAN.md`登记。`api/translate.js` 是全站唯一服务端代码（Vercel serverless 函数，由 `vercel.json` 配置），前端模块不得依赖它做本地运行。

---

## 1. 架构结论

QmlmReader 当前是静态站点 + 原生 JavaScript 架构：

```text
index.html
  -> html/index.html
      -> css/style.css
      -> js/site-data.js
      -> js/main.js
      -> js/preferences.js   ┐ 由 main.js 运行时注入（main.js L63-94），
      -> js/search.js        ┘ 页面无这两个显式 <script> 标签
      -> js/darkmode.js
      -> js/cursor.js
```

公共页面大多遵循：

```html
<link rel="stylesheet" href="相对路径/css/style.css">
<div id="nav-placeholder"></div>
<script src="相对路径/js/site-data.js"></script>
<script src="相对路径/js/main.js"></script>
<!-- main.js 会按当前层级自动加载 js/search.js、js/preferences.js -->
<script src="相对路径/js/darkmode.js"></script>
<script src="相对路径/js/cursor.js"></script>
```

若页面使用 `main.js`，必须先加载 `site-data.js`。不要在普通页面重复显式加载 `search.js`，由 `main.js` 统一加载。

---

## 2. 公共文件职责

| 文件 | 职责 | 维护边界 |
|---|---|---|
| `index.html` | 根跳转到 `html/index.html` | 不承载业务页面 |
| `html/index.html` | 真正首页 | 首页模块细节见 `pages/home/README.md` |
| `css/style.css` | 全站基础视觉、导航、卡片、暗色模式通用规则 | 公共导航容器使用 `.site-header-inner`，不得被页面私有 `.container` 重定义污染 |
| `js/main.js` | 导航注入、导航搜索交互、面包屑、合集导航、章节导航、卡片动画、导航收起 ⇄ 悬浮球（拖拽记忆位置） | 公共导航唯一来源；页面只放 `#nav-placeholder`，不硬编码 `site-header`、菜单项或黑夜模式按钮 |
| `js/site-data.js` | 站点聚合数据 | 生成产物，不要手改 |
| `js/state-center.js` | 轻量响应式状态中心 | 统一运行态读写、订阅、持久化；已接 `preferences`、`theme`，并提供 `reader`、`search`、`ui` 和通用 domain 内存态 |
| `js/page-state-adapter.js` | 页面私有状态适配层 | 给内联脚本和页面私有 JS 提供 `QMLMPageState` 接口，先接入后迁移 |
| `_tools/build_data.py` | 聚合数据构建 | 改数据源后运行它更新 `site-data.js` |
| `js/search.js` | 全站搜索索引读取、输入绑定与结果渲染 | 由 `main.js` 自动加载；支持文章、文艺、正名、国际专栏和已加载历史事件，不应塞正文全文；查询和统计接入 `QMLMState.search` |
| `js/preferences.js` | 本地偏好、文章收藏、阅读历史、视图设置接口 | 通过 `QMLMState.preferences` 读写，保留旧键兼容 |
| `js/darkmode.js` | 暗色模式 | 通过 `QMLMState.theme` 读写，保留 `darkMode` 旧键兼容 |
| `js/cursor.js` | 自定义光标 | 公共视觉增强 |

---

## 3. 当前维护风险

1. **页面私有样式已大幅收敛**：导师五页抽入 `css/masters/masters-common.css`（`body[data-master]` 变量取色），rectify 十页抽入 `css/rectify/rectify-common.css`，早期 12 个 >10KB 大页的内联样式已原样下沉到 `css/<module>/`（该计数为历史快照；当前仍有内联样式的存量页面见`doc/PLAN.md` C1/C2）。剩余小页仍有个别内联 `<style>`，新页面一律不再新增内联样式。
2. **公共脚本仍有兜底数据**：`main.js`、`search.js`、部分页面内仍有大段 fallback 数据。
3. **数据权威源需要持续强调**：列表/搜索/下载入口走索引层，正文走 `articles-json`，精读走 `study-json`。
4. **不要默认存在前端构建链**：当前项目根目录未发现 `package.json`，不要按 Vite/React 等工程习惯操作。

### 3.1 CSS 目录约定

- **全局平铺**：`css/style.css`、4 个颜色令牌文件（color-tokens / theme-colors / module-colors / master-colors）、`articles-detail.css`、`articles-index.css`、`category-theme.css`。
- **模块子目录（16 个）**：`css/masters/`、`css/rectify/`、`css/toolkit/`、`css/home/`、`css/international/`、`css/preferences/`、`css/gallery/`、`css/puzzle/`、`css/experimental/`、`css/articles/`（仅 mao-dun-lun.css 单页样式）、`css/marxist/`、`css/qingma/`、`css/xiaocezi/`、`css/yangbanxi/`、`css/redify/`、`css/mentor/`。
- **与 js 目录的关系**（2026-11-06 审计更正）：存量上 css 与 js 模块目录**并不对齐**——js 模块目录仅 7 个（international/marxist/mentor/puzzle/qingma/xiaocezi/yangbanxi），多数模块样式直接放模块目录而无模块 js。「对齐」只约束**新增**模块四件套（见下条）。
- **新增模块四件套**：`html/<module>/` 页面 + `js/<module>/` 脚本 + `css/<module>/` 样式 + `data/` 只读引用，并在 `doc/pages/<module>/README.md` 登记。
- **遗留物**（处置走`doc/PLAN.md` D4）：`css/style.css.bak`、`js/main.js.bak`、`css/masters/stalin/relations.css.bak`、`css/mentor/`（全库零引用的孤儿目录）。

---

## 4. 修改公共架构时的顺序

1. 先确定改动属于：导航、搜索、样式、聚合数据、下载、文章渲染中的哪一类。
2. 读取本 README 和对应模块 README。
3. 读取真实源码。
4. 若改数据源，运行或提示运行：

```bash
python _tools/build_data.py --write
```

5. 最后同步更新对应文档。

---

## 5. 响应式状态中心（现状参考）

> 设计动机、草案演进与迁移史已收编至 [../learnings.md](../learnings.md) 条目 11；本节只保留维护所需的现状参考。

### 5.1 五个内置域

| 状态域 | 内容 | 持久化 |
|---|---|---|
| `preferences` | 收藏、历史、视图密度、偏好页导航 | 是（`qmlm:state:v1`，兼容旧键 `qmlm:preferences:v1`） |
| `theme` | 暗色模式 | 是（兼容旧键 `darkMode`） |
| `reader` | 当前 Tab、章节、滚动位置、恢复提示、进度条（`activeTab`、`chapterNavVisible`、`collapsedChapters`、`progress`、`restore`） | 运行态 |
| `search` | 查询词、筛选条件、结果统计 | 运行态 |
| `ui` | 菜单、弹窗、折叠、导航显示（`navOpen`、`collectionModal`、`navCollapsed`、`navBallPos`） | 白名单键持久化 |

原则：**正文、索引、生成产物不进状态中心**；只管"用户操作后会变化的运行态"。

### 5.2 接口

```js
window.QMLMState = {
  getState(), setState(patch, source),
  subscribe(selector, cb), unsubscribe(token),
  dispatch(action), hydrate(), persist()
};
```

`dispatch` action 全集：`preferences/set|patch|section`、`theme/set|toggle`、`reader/set|patch`、`search/set|patch`、`ui/set|patch`、`domain/set|patch`、`state/set`。
持久化：`qmlm:state:v1` 快照 = `{preferences, theme, ui}`，其中 `ui` 只落白名单 `UI_PERSIST_KEYS = ['navCollapsed', 'navBallPos']`；跨标签经 `storage` 事件同步。**修改白名单属公共架构改动，需在本文件登记。**

### 5.3 页面私有状态接入

1. 每个页面私有状态用独立 domain，命名 `pageDownloads`、`pageGallery` 这类页面级前缀。
2. 新增功能优先从 `QMLMPageState.get()` 读初值、`QMLMPageState.subscribe()` 订阅；旧 DOM 行为先保留。
3. 页面稳定后再删除重复私有变量、重复事件与直写 localStorage。
4. 只有同一状态被多处重复写入或冲突时，才做强制覆盖式重构。

### 5.4 已接入清单

- `js/main.js` 动态注入链：state-center → page-state-adapter → preferences（+search）。
- `preferences.html` 显式加载 state-center + page-state-adapter；`downloads.html` 以 `pageDownloads` domain 为页内私有状态接入样例。
- `article-common.js`/`main.js` 发布阅读页 Tab 与章节导航态；`preferences.js` 发布阅读恢复态；`darkmode.js` 走 `theme`；`search.js` 走 `search` 域并能从中恢复 UI。
