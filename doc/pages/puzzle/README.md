# 拼图模块 README

> 对应源码：`html/puzzle/`（hub + 子页）、`css/puzzle/`、`js/puzzle/`。  
> 作用：理论拼图模块门户，管理与文章页内 `puzzle` Tab 的边界。

---

## 1. 页面范围

```text
html/puzzle/puzzle.html            # 模块首页（hub 跳转页），2026-11 起
html/puzzle/theory-map.html        # 马哲理论拼图 · 理论图谱（六泳道画布，自 puzzle.html 迁入）
html/puzzle/capital-socialism/     # 资本主义与社会主义展览（独立沉浸页，soviet-jokes 模式）
├── index.html                     #    由 lineage-redesign.html 改名接入
├── lineage-redesign.css / .js     #    展览样式与逻辑（含尾部「母站接入层」）
└── lineage-data.js                #    6.1MB 数据（window.LINEAGE_DATA 全局注入，file:// 兼容）
```

---

## 2. 当前资源链路

hub（`puzzle.html`，标准壳）：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/puzzle/puzzle.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

theory-map（标准壳 + 模块 JS）：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/category-theme.css">
<link rel="stylesheet" href="../../css/puzzle/theory-map.css">
<script src="../../js/category-theme.js"></script>
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/puzzle/theory-map-data.js"></script>  <!-- 页面私有节点数据 -->
<script src="../../js/puzzle/theory-map.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 2.5 资本主义与社会主义展览（capital-socialism/）

- 出处：独立项目 `D:\AI Pj\myProject\资本主义与社会主义展览\prototype\`（2026-11 接入），纯静态、无 CDN、无 fetch，数据经 `<script>` 全局注入（`window.LINEAGE_DATA`），file:// 可开。
- 接入方式：soviet-jokes 模式——独立沉浸页，不挂全站导航壳；返回入口为工具栏左侧「← 返回驿站」（指向 `../puzzle.html`，.html 后缀不触发部署脚本的 `../` 改写）。
- 数据体量：`lineage-data.js` 约 6.1MB（55 主干节点 + 1043 档案节点 + 关系 + 61 演绎文本），同步加载，首屏有封面过渡。
- 未拷贝源仓库的 `archive/`（约 1GB 测试产物）、`scripts/`、`views/`、`data/`、`schemas/`、截图与 MD 文档；`assets/` 经 grep 确认无运行时引用，一并未拷。
- 页面私有状态：sessionStorage `exhibitIntroSeen`（与站点 `qmlm:state:v1` / `darkMode` 无冲突）；不接全站暗色开关，保留展览自身的纸张美学。

---

## 3. 与文章页拼图的边界

当前口径：

- `puzzle.html` 是模块门户（hub），`theory-map.html` 是全局拼图泳道画布。
- 文章详情页里的 `puzzle` Tab 先做单篇文章内部的关系网络，不急于和全局拼图深度耦合。
- 文章页联结卡可优先由 `data/study-json/{Mentor}/{slug}.json` 的 `further` 或关系字段驱动。

---

## 4. 当前维护重点

1. ~~`puzzle.html` 内联样式和脚本体量很大，后续应拆出模块 CSS/JS。~~ 已完成（2026-11）：页面拆为 hub + `theory-map.html`，样式在 `css/puzzle/`，脚本与数据在 `js/puzzle/`。
2. ~~页面私有 dark mode localStorage 逻辑~~ 已删除，统一走 `js/darkmode.js` + 状态中心；旧内联汉堡菜单 IIFE（与 `js/main.js` 双重绑定）已删除。
3. 全局图谱数据如果继续扩展，应独立设计数据结构，不要直接复用单篇文章 `puzzle-links`；当前节点数据在 `js/puzzle/theory-map-data.js`（页面私有，不进 `data/` 生成管线）。
4. 六大泳道色统一使用 `css/category-theme.css` 的 `--category-*` token（`theory-map.css` 以 CSS fill/stroke 覆盖 SVG presentation attribute，SVG 内等值十六进制仅作兜底）；数据里优先保存分类 key，不再新增分散的 `badgeColor` 硬编码。全局样式/颜色/z-index 约束见 `doc/design-tokens.md`（本模块零硬编码色，全站令牌化范本）。
5. 画布高度依赖 `--masthead-h`（`js/puzzle/theory-map.js` 实测 `.site-header` 写入，导航收起悬浮球时记 0），修改头部结构时需回归验证。

---

## 5. 权责边界

**拥有（可自由修改）**：
- `html/puzzle/`（hub、theory-map.html、capital-socialism/）
- `js/puzzle/`（theory-map.js、theory-map-data.js；capital-socialism/ 的 lineage-redesign.js、lineage-data.js）
- `css/puzzle/`（puzzle.css、theory-map.css、lineage-redesign.css）
- 注记：本模块零硬编码色，全站令牌化范本

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）
- `data/study-json/`（文章模块生成物，仅读取 `further`/关系字段驱动联结卡）
- `css/category-theme.css`、`css/color-tokens.css` 等 token 层（只消费，不新增硬编码色）

**共享/跨界资产**：
- 与文章页 `puzzle` Tab 的边界约定（见第 3 节）：单篇文章内部关系网络归文章页，全局泳道画布归本模块；调整边界前需过 `doc/README.md` 权责矩阵

**改动前置条件**：
- 页面私有数据（`js/puzzle/theory-map-data.js`、`capital-socialism/lineage-data.js` 6.1MB 等）不进生成管线：更新数据后无需跑 `python _tools/build_data.py --write`，但必须在本文登记变更
