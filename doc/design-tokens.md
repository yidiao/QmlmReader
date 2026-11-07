# QmlmReader 全局约束（设计令牌与工程规范）

> 本文是全站横切规则的**唯一权威**：颜色令牌、暗色模式、排版、z-index、断点、data-* 协议、状态契约、加载顺序、禁令清单。总览 `doc/README.md` 引用本文；模块 README、页面代码不得与本文件冲突。发现冲突时：以代码为事实、以本文为意图，修代码或修本文后同步登记到`doc/PLAN.md`。
> 色值细节、工具族配色档案与推进过程见 `doc/color-system.md`（与本文互补，不重复定规则）。

---

## 1. 颜色令牌体系

### 1.1 分层架构

```text
css/color-tokens.css     原子层：品牌色、纸色、灰阶、暗色灰阶、状态色、排版与 z-index 令牌
        ↓  style.css 顶部 @import（顺序：color-tokens → theme-colors → module-colors → master-colors）
css/theme-colors.css     语义层：--app-* 明暗双套映射（body.dark-mode 整组重映射）
        ↓
css/master-colors.css    作用域层：body[data-master] 导师主题
css/module-colors.css    作用域层：body[data-module] 模块强调色
css/category-theme.css   作用域层：[data-category] 六大文章分类（★ 例外：不经 style.css，由文章/拼图页面单独 <link> 引入）
        ↓
组件 CSS                 只允许 var() 取色
```

### 1.2 六大文章分类（key 是唯一接口）

分类 key：`philosophy`、`economics`、`politics`、`party`、`military`、`culture`。每类五层级：`primary`（节点/主徽标）、`secondary`（渐变/次级）、`dark`（深色场景）、`soft`（浅标签背景）、`ink`（标签文字）。完整色值表见 `doc/color-system.md` §3。

| 分类 | key | 主色方向 |
|---|---|---|
| 哲学基础 | `philosophy` | 深红 |
| 政治经济学 | `economics` | 铜赭 |
| 政治理论 | `politics` | 桑紫（避免亮紫/靛蓝） |
| 党的建设 | `party` | 橄榄绿 |
| 军事战略 | `military` | 铁青湖蓝 |
| 思想文化 | `culture` | 赭黄 |

**规则**：页面只声明 `data-category`，不得在文章 HTML、拼图数据或模块 CSS 中重新定义分类主色；详情页兼容变量 `--cat-primary`、`--cat-secondary`、`--cat-gradient` 由 `category-theme.css` 映射。不在页面内临时计算颜色（禁止运行时拼色值），偏移一律用预定义变体。

### 1.3 硬性取色规则

1. **新 CSS 禁止裸 hex / rgba 字面量**，一律 `var()` 取令牌（令牌不够用时先去 `color-tokens.css` 增补原子值，再消费）。
2. 组件暗色适配只改 `--app-*`/主题变量或写 `body.dark-mode` 变量覆盖，不得另起一套暗色实现。
3. 品牌三色只认令牌：`--color-brand-red`（#c41e3a）、`--color-brand-red-dark`（#8b0000）、`--color-brand-gold`（#ffd700）。
4. 纸面层级四档：`--paper-page`（页面底 #f3eadc）→ `--paper-section`（区块 #f7f2e7）→ `--paper-card`（卡片 #fffaf0）→ `--paper-card-strong`（浮层 #fffdf7）；边框 `--paper-border`（#ded2bd）。不要用纯 `#fff` 当大面积背景。
5. 灰阶用 `--gray-950…050` 与暗色 `--gray-dark-*`，禁止随手引入新灰值。

### 1.4 现状与迁移

2026-11-06 审计口径约 2879 处裸色值；2026-11-07 已完成：常规层三文件**等值迁移**（仅 37 处与令牌等值，已清零）、theme-colors 全 var() 化、conn-card 六分类归一 `--cat-primary`。剩余约 240 处为**表外值**（非令牌色，多为设计变体与 alpha 变体），归类走PLAN B9；experimental 五工具按 §12 豁免。`css/puzzle/puzzle.css` 是零硬编码范本。`style.css:31-43` 的 `--primary-color` 等 10 个旧别名仅作兼容，新代码禁用（淘汰计划见PLAN B3）。

---

## 2. 暗色模式

- **机制**：`body.dark-mode` class（不是 data 属性）。状态优先走 `QMLMState.theme.darkMode`（`js/darkmode.js` 订阅同步），无状态中心时兜底 `localStorage['darkMode']`；`state-center.js` 持久化到 `qmlm:state:v1` 并双写旧键兼容。
- **切换入口**：`toggleDarkMode()` → `QMLMState.dispatch('theme/toggle')`。页面不得自建暗色开关或直改 class 而不走状态中心。
- **取色**：暗色基础值只认 `--gray-dark-*` 九档（bg #171717 → text-faint #777777）+ `--app-*` 暗色重映射 + `--shadow-color-dark(-strong)` 阴影；正文不用纯白（#e0e0e0 或暖白），红色用柔化红，禁大面积纯红/纯黑。

---

## 3. 排版与字体

**令牌**（已定义在 `css/color-tokens.css`，新代码必须使用；存量声明按PLAN B7 收敛）：

| 令牌 | 值 | 用途 |
|---|---|---|
| `--font-sans` | 系统无衬线栈（body 现行栈，不含 CJK 名） | UI 骨架、系统感界面 |
| `--font-sans-cjk` | `"Noto Sans SC","Microsoft YaHei",sans-serif` | 中文正文/UI 的显式 CJK 无衬线 |
| `--font-serif` | `'Noto Serif SC','STSong','SimSun',serif` | Logo、标题、印刷感场景 |
| `--font-kai` | `KaiTi, STKaiti, serif` | 书法/引文点缀 |

**规则**：新声明只允许引用这四个令牌；等宽场景沿用现栈字面量（`monospace` 系），不另设令牌。不再新增第 5 种字体栈或新的衬线 fallback 顺序（存量只减不增；个别有意区别的西文衬线栈如 Georgia 系允许保留，需在模块 README 注明）。

---

## 4. 间距与容器

当前不设间距令牌（存量零令牌，强行设立无消费基础），仅固定两个基准：

- `.container` max-width **1200px**；`.site-header-inner` min(100% − 32px, **1440px**)。页面私有布局容器不得重定义污染公共 `.site-header-inner`。
- 新增间距优先复用现有 rem 档位（0.25/0.5/1/1.5/2rem 为主流值），避免发明新档。

---

## 5. z-index 阶梯

现状 143 处、约 30 种取值且存在倒挂（进度条 12000 > 光标 10000 > 开屏 9999）。**新代码必须从下表取值**，存量按PLAN B6 收敛：

| 阶梯 | 取值 | 用途 | 现状锚点 |
|---|---|---|---|
| 内容层 | 0–10 | 页面内定位、卡片微层 | 大量 0/1/2 |
| 置顶元素 | 100 | 页内 sticky | |
| 导航下拉 | 900–999 | 导航菜单、下拉 | 999 |
| 遮罩 | 1000–1099 | overlay、backdrop | 1000/1001/1002 |
| 弹窗 | 1100–1299 | modal、浮层对话框 | 1200 |
| 页面特效 | 9500–9999 | 导航悬浮球、开屏、阅读提示 | 9500/9998/9999 |
| 全站特例 | 10000–11999 | 自定义光标 10000、阅读进度条 12000 | 冻结现值，不再新增占用 |

规则：同阶梯内新增元素取相邻整十值并留注释；禁止跳到未定义的散值（300/200/20/8/1999/12000 等）；特例档只进不改。

---

## 6. 断点

- **主断点：768px**（`max-width: 768px`，现状 22 处主流用法）。
- 辅断点最多两档：**480px**（小屏）、**1080px**（宽屏收拢）。
- print 与 `prefers-reduced-motion` 按需保留。
- 禁止新增 560/600/620/640/720/760/900/960/980 等散值断点（现状 13 种取值，见PLAN B8）。

---

## 7. data-* 协议总表

页面与脚本之间的属性协议，新增协议先登记本表：

| 属性 | 挂载点 | 消费方 | 说明 |
|---|---|---|---|
| `data-category` | 索引标签、`body`（详情页）、拼图节点 | `category-theme.css` + `js/category-theme.js` | 分类 key 唯一接口；别名归一在 js 内 |
| `data-article-json` | `body` | `js/article-json.js`、`js/download-export.js` | 正文层 JSON 路径 |
| `data-study-json` | `body` | `js/article-study.js` | 精读层 JSON 路径 |
| `data-preference-key` | 页面 | `js/preferences.js` | 偏好命名空间，如 `mentor:stalin:biography` |
| `data-qmlm-favorite-btn` (+`-mode="icon\|text"`) | 按钮 | `js/preferences.js` | 收藏按钮协议 |
| `data-master` | `body`（7 页） | `master-colors.css`、`masters-common.css` | 导师主题 |
| `data-module` | `body`（现 5 页） | `module-colors.css` | 模块强调色 |
| `data-prefs-section` | 偏好页区块 | `js/preferences.js` | 偏好分区 |
| `data-graph-scope/-id/-starmap-prototype` | 关系展板 | stellar 脚本 | masters 关系图 |
| `data-qmlm-*` 其他 | 预留 | — | 新增需登记本表 |

---

## 8. QMLMState 状态契约

权威实现：`js/state-center.js`（`qmlm:state:v1`）。细则与迁移史见 `doc/architecture/README.md` §5。

- **五域**：`preferences`（持久）、`theme`（持久）、`reader`（运行态）、`search`（运行态）、`ui`（白名单持久）。
- **持久化白名单**：`UI_PERSIST_KEYS = ['navCollapsed', 'navBallPos']`——修改白名单属于公共架构改动，走 `doc/architecture/README.md` 登记流程，模块不得私自往快照里塞键。
- **dispatch action 全集**：`preferences/set|patch|section`、`theme/set|toggle`、`reader/set|patch`、`search/set|patch`、`ui/set|patch`、`domain/set|patch`、`state/set`。
- **兼容键**：`qmlm:preferences:v1`、`darkMode`；页面私有状态用 `QMLMPageState.patch(domain, …)`，domain 命名 `pageXxx`。
- **原则**：正文、索引、生成产物不进状态中心；派生状态不落库。

---

## 9. 脚本与样式加载顺序

**CSS**：`css/style.css` → `css/<module>/*.css`；文章详情页额外加载 `css/articles-detail.css` + `css/category-theme.css`（后者不经 style.css，页面自行引入）。

**JS（页面顺序）**：`js/site-data.js` → `js/main.js` → 页面脚本 → `js/darkmode.js` → `js/cursor.js`；文章页再按需 `download-export.js` → `category-theme.js` → `article-common.js`。

**main.js 动态注入**（页面**不要**重复显式加载）：`state-center.js`、`page-state-adapter.js`、`preferences.js`、`search.js`。

规则：用 `main.js` 必先载 `site-data.js`；新脚本加入公共加载链需改 architecture 文档；模块脚本加载顺序写在模块 README。

---

## 10. 命名与目录约定

- 页面模块四件套：`html/<module>/` + `css/<module>/` + `js/<module>/`（按需）+ `doc/pages/<module>/README.md`。
- css 模块目录现状 16 个，js 模块目录现状 7 个（international/marxist/mentor/puzzle/qingma/xiaocezi/yangbanxi）——「对齐」只约束**新增**模块四件套；存量差异登记在 architecture §3.1。
- 全局平铺仅限：`style.css`、4 个令牌文件、`articles-detail.css`、`articles-index.css`、`category-theme.css`。
- 状态 domain 命名 `pageXxx`；data-* 协议见 §7；工具族内部令牌前缀 `--ms-/--qm-/--yb-/--rd-` 等见 color-system.md §9。

---

## 11. 禁令清单（速查）

1. **禁手改生成物**：`js/site-data.js`、`data/rectify-json/`（改源后跑 `python _tools/build_data.py --write`）。
2. **禁新增页面内联 `<style>` 和 `style=""` 属性**；存量只减不增（PLAN C1/C2）。
3. **禁新 CSS 写裸 hex/rgba**（§1.3）；**禁新散值 z-index / 断点 / 字体栈**（§3/§5/§6）。
4. **禁在页面硬编码导航**：`site-header`、菜单项、暗色按钮——只放 `#nav-placeholder`。
5. **禁把正文同时维护在 HTML、JSON、TXT、PDF 多处**；正文只进 `data/articles-json/`。
6. **禁绕过状态中心直写 localStorage**（新代码）；页面私有状态走 `QMLMPageState`。
7. **禁模块私自改公共层文件**（权责矩阵脚注清单）；需要改先过 architecture README 并在总览登记。
8. **禁把长 Prompt / 研究稿正文写进 README**——放 `doc/pages/experimental/research/`，README 只索引。

---

## 12. 豁免条款

1. **experimental 五工具**（marxist/qingma/xiaocezi/yangbanxi/redify）：允许独立视觉与自有令牌体系（--ms-/--qm- 等），豁免 §1.3 取色规则；但母站骨架（导航、暗色接入、相对路径、不得覆盖公共 `.site-header-inner`）仍必须遵守。
2. **imported 正文页**（html/articles/imported/，1258 篇）：生成产物的 4 行内联样式块豁免禁令 2。
3. **`.bak` 文件**：历史备份，不参与构建与引用；处置走PLAN D4。
4. **全站特例 z-index**（光标 10000、进度条 12000）：冻结现值，见 §5。
