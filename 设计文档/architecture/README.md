# 全站架构维护 README

> 对应源码：根入口、`html/index.html`、`css/style.css`、`js/main.js`、`js/site-data.js`、公共脚本。  
> 作用：让 AI 和维护者快速判断“站点壳、公共导航、公共样式、聚合数据”该从哪里改。

---

## 1. 架构结论

QmlmReader 当前是静态站点 + 原生 JavaScript 架构：

```text
index.html
  -> html/index.html
      -> css/style.css
      -> js/site-data.js
      -> js/main.js
      -> js/preferences.js
      -> js/search.js
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
| `js/main.js` | 导航注入、导航搜索交互、面包屑、合集导航、章节导航、卡片动画 | 公共导航唯一来源；页面只放 `#nav-placeholder`，不硬编码 `site-header`、菜单项或黑夜模式按钮 |
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

1. **页面私有样式仍多**：许多 `html/**/*.html` 仍含 `<style>`，后续应逐步迁入 `css/` 中的模块样式。
2. **公共脚本仍有兜底数据**：`main.js`、`search.js`、部分页面内仍有大段 fallback 数据。
3. **数据权威源需要持续强调**：列表/搜索/下载入口走索引层，正文走 `articles-json`，精读走 `study-json`。
4. **不要默认存在前端构建链**：当前项目根目录未发现 `package.json`，不要按 Vite/React 等工程习惯操作。

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

## 5. 响应式状态管理中心草案

> 目标：在不引入框架的前提下，把站点里分散的可变 UI 状态收拢到一个轻量、可订阅、可持久化的状态中心，逐步替代各文件里零散的 localStorage、全局变量和手工 DOM 同步。

### 5.1 设计目标

1. **统一状态来源**：收藏、历史、主题、阅读进度、搜索筛选、菜单/弹窗等可变状态尽量由同一处读写。
2. **保留原生 JS**：不引入 React/Vue 等框架，继续沿用当前静态站点结构。
3. **事件驱动但可订阅**：保留原有 custom event 思路，同时增加统一的订阅接口，方便模块局部刷新。
4. **状态和渲染分层**：状态中心只管数据变更与通知，不直接承载复杂 DOM 业务。
5. **可渐进迁移**：旧脚本可先继续运行，新中心通过适配层逐步接管。

### 5.2 现有基础

当前代码里已经出现了几块可复用的“状态雏形”，但它们还没有汇入同一中心：

- `js/preferences.js`：已经有 `readState()` / `writeState()`、收藏、历史、阅读恢复和 `qmlm:preferences-changed`。
- `js/article-json.js` / `js/article-study.js`：采用“加载 JSON → 渲染 → 派发事件”的链路。
- `js/qingma/engine.js`：游戏内部已有完整 `state` 容器，但只服务单页模块。
- `js/search.js`、`js/darkmode.js`：分别维护局部筛选状态和主题状态。

这些代码说明项目已经不是纯静态拼页，但离“统一响应式状态中心”还有一层抽象。

### 5.3 建议的状态域划分

建议把状态分成几类：

| 状态域 | 内容 | 是否持久化 |
|---|---|---|
| `preferences` | 收藏、历史、视图密度、偏好页导航 | 是，localStorage |
| `reader` | 当前 Tab、章节、滚动位置、恢复提示、进度条；当前已接 `activeTab`、`chapterNavVisible`、`collapsedChapters`、`progress`、`restore` | 部分持久化 |
| `theme` | 暗色模式 | 是，localStorage |
| `search` | 查询词、筛选条件、结果统计 | 否或短期缓存 |
| `ui` | 菜单、弹窗、折叠面板、导航显示状态；当前已接 `navOpen`、`collectionModal` | 通常否 |
| `game` | 青马小游戏运行态 | 模块内维护，暂不强求全站共享 |

原则：**正文、索引、生成产物不进入状态中心**；状态中心只管理“用户操作后会变化的运行态”。

### 5.4 草案 API

可先设计成一个很轻的全局对象或模块：

```js
window.QMLMState = {
  getState(),
  setState(patch, source),
  subscribe(selector, callback),
  unsubscribe(token),
  dispatch(action),
  hydrate(),
  persist()
};
```

建议行为：

- `getState()`：返回当前快照。
- `setState()`：合并局部更新并触发通知。
- `subscribe()`：允许按状态域或选择器订阅。
- `dispatch()`：接收动作名和参数，统一走 reducer/handler。
- `hydrate()`：从 localStorage 还原。
- `persist()`：只保存白名单状态域。

### 5.5 推荐实现原则

1. **单一写入口**：尽量不要在业务脚本里直接改 localStorage。
2. **先状态后 DOM**：UI 更新由订阅回调触发，而不是每个操作点手写同步。
3. **派生状态不落库**：例如章节标签、当前可见项统计，优先从基础状态计算。
4. **版本化存储**：`qmlm:state:v1` 这类键要有版本号，方便后续迁移。
5. **兼容旧事件**：保留 `qmlm:preferences-changed`、`qmlm:article-rendered` 等事件，作为过渡层。
6. **接口先行**：页内内联脚本和私有 JS 不强制一次性覆盖；先通过 `QMLMPageState` 接入状态中心，再逐页替换内部实现。

### 5.5.1 页内私有状态处理边界

对于仍有内联脚本或页面私有逻辑的页面，采用以下策略：

1. 页面局部状态先挂到独立 domain，例如 `pageGallery`、`pageDownloads`、`pageToolkit`。
2. 只要状态需要跨组件、跨函数或被外部观察，就通过 `QMLMPageState.patch(domain, patch)` 发布。
3. 旧 DOM 逻辑先保留，订阅回调只负责同步必要 class、输入值和开关态。
4. 后续逐页处理时，再把私有变量、直接 DOM 写入和内联脚本逐步收拢。
5. 除非页面已经明显冲突或重复写同一状态，不建议直接强制覆盖。

### 5.6 迁移顺序建议

**阶段 1：状态中心骨架**
- 增加统一 store 文件或公共状态模块。
- 先只放 `preferences` 和 `theme`。
- 保持旧接口可用，做到“双写/适配”。

**阶段 2：阅读器状态接管**
- 把阅读位置、恢复提示、章节/Tab 记忆接入统一状态。
- 让 `article-json.js` 和 `article-study.js` 只负责渲染与发事件。

**阶段 3：搜索与页面 UI 状态**
- 收拢搜索词、筛选器、菜单、弹窗、折叠状态。
- 统一处理页面局部交互的开关逻辑。

**阶段 4：清理散落逻辑**
- 删除重复的 localStorage 读写。
- 减少跨文件直接调用 DOM 刷新函数。
- 把“状态变更 → UI 更新”的链路收束到订阅层。

### 5.7 当前落地状态

第一阶段已经开始落地：

- 新增 `js/state-center.js`，暴露 `window.QMLMState`。
- `QMLMState` 当前管理 `preferences`、`theme`、`reader`、`search`、`ui` 五个内置域，并支持通用 domain API；其中 `preferences` 与 `theme` 已接入持久化。
- 新状态键为 `qmlm:state:v1`；同时继续写入旧键 `qmlm:preferences:v1` 与 `darkMode`，保证旧脚本和已保存数据可兼容。
- `reader`、`search`、`ui` 当前按运行态处理，不写入本地存储，避免滚动和临时页面状态高频落库；全站移动菜单已发布到 `QMLMState.ui.navOpen`，合集弹窗已发布到 `QMLMState.ui.collectionModal`。
- `js/main.js` 会优先加载 `state-center.js`，再加载 `page-state-adapter.js` 和 `preferences.js`。
- `html/preferences/preferences.html` 已显式加载 `state-center.js` 和 `page-state-adapter.js`。
- `js/preferences.js` 的 `readState()` / `writeState()` 已优先走 `QMLMState.preferences`，偏好页会订阅 `preferences` 域并自动刷新；阅读进度快照会发布到 `QMLMState.reader.progress`。
- `js/article-common.js` 与 `js/main.js` 已把阅读页 Tab 状态发布到 `QMLMState.reader.activeTab`，并保留原 sessionStorage 记忆。
- `js/main.js` 已把章节导航显示状态发布到 `QMLMState.reader.chapterNavVisible`，并保留原 sessionStorage 兼容。
- `js/article-common.js` 已把章节折叠状态发布到 `QMLMState.reader.collapsedChapters`，支持订阅后反向同步 DOM。
- `js/preferences.js` 已把阅读位置恢复流程的阶段状态发布到 `QMLMState.reader.restore`，包括跳过、等待、恢复中、提示、关闭和返回入口等状态。
- `js/darkmode.js` 已优先走 `QMLMState.theme`。
- `js/search.js` 会把查询词、筛选器和结果统计发布到 `QMLMState.search`，并能从该状态域恢复输入框与筛选按钮状态。
- 新增 `js/page-state-adapter.js`，为内联脚本和页面私有 JS 提供接口先行的接入方式。
- `html/downloads/downloads.html` 已作为实际接入样例，使用 `pageDownloads` domain 管理页面 filter 和选择弹窗状态。

### 5.8 当前收工状态

本阶段目标已经完成到“统一状态中心可用 + 核心公共状态接入 + 页内私有状态有适配接口”的程度：

1. `preferences`、`theme` 作为持久域接入 `QMLMState`。
2. `reader`、`search`、`ui` 作为运行态接入 `QMLMState`，不写入本地存储。
3. `page-state-adapter.js` 提供页面私有状态接入层。
4. `downloads.html` 已作为页内私有状态接入示例，使用 `pageDownloads` domain 管理 filter 和选择弹窗。
5. 后续页面如仍有内联脚本，不需要立即强制覆盖；先用 `QMLMPageState` 暴露状态，再逐页清理内部实现。

### 5.9 后续逐页迁移规则

1. 每个页面私有状态使用独立 domain，命名建议为 `pageDownloads`、`pageGallery`、`pageToolkit` 这种页面级前缀。
2. 页面原有 DOM 行为先保留，只把可变状态发布到中心。
3. 新增功能优先从 `QMLMPageState.get()` 读取初始状态，并用 `QMLMPageState.subscribe()` 订阅变化。
4. 确认页面稳定后，再删除重复的私有变量、重复事件分发和直接存储写入。
5. 只有在同一状态被多处重复写入或出现冲突时，才做强制覆盖式重构。

### 5.10 验收标准

1. 同一份状态不再被多个脚本各写一遍。
2. 收藏、历史、主题至少能通过统一中心读写。
3. 阅读页核心运行态能通过 `reader` 域观察。
4. 搜索、导航、弹窗等局部状态可独立订阅更新。
5. 页内私有脚本有统一适配接口和真实接入样例。
6. 不引入框架也能保持清晰的单向数据流。
