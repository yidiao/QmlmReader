# 工具集模块 README

> 对应源码：`html/toolkit/`（toolkit.html、science.html 两页）、`css/toolkit/`、公共脚本。  
> 作用：管理工具集入口和工具页，与 experimental 模块保持边界。

---

## 1. 页面范围

```text
html/toolkit/toolkit.html
html/toolkit/science.html
```

注意（2026-11 审计核实）：早期文档记录的 `html/toolkit/marxist-style.html` 并不存在（该文件不在磁盘上，git 全历史也从未存在），已从本清单删除。文体工具唯一入口是 `html/experimental/marxist-style.html`（experimental 模块）。toolkit 与 experimental 的实际边界是：toolkit 两页无私有 JS、不引用 experimental 私有资源，仅在内容导航中链接文章/文艺页（articles/gallery）。

---

## 2. 当前资源链路

主入口 `toolkit.html` 引入：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/toolkit/toolkit.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

`science.html` 同构，专属样式为 `css/toolkit/science.css`。两页均已 0 个内联 style 块（2026-11 审计），且均无私有 JS（只加载公共层脚本）。
全局样式/颜色/z-index 约束见 `doc/design-tokens.md`。

---

## 3. 维护重点

1. ~~工具集页当前有大量内联样式，且右侧悬停导航与文艺模块相似，后续可抽公共组件。~~ 内联样式已下沉（2026-11）：`toolkit.html` → `css/toolkit/toolkit.css`，`science.html` → `css/toolkit/science.css`，两页 0 个 style 块；右侧悬停导航与文艺模块的公共组件化仍可后续评估。
2. 与 `html/experimental/` 的边界已核实：文体工具唯一入口是 `html/experimental/marxist-style.html`，工具集页仅做内容导航链接；两页无私有 JS，不引用 experimental 私有资源。
3. 工具页若接外部 API，应记录密钥策略、调用边界、失败降级，不在总览复制完整 Prompt。
4. 新工具入口应同步加入全站导航、工具集页、必要时加入 experimental 模块文档。

---

## 4. 权责边界

**拥有（可自由修改）**：
- `html/toolkit/`（toolkit.html、science.html 两页）
- `css/toolkit/`（toolkit.css、science.css）

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）

**共享/跨界资产**：
- 内容导航中指向 articles/gallery 的链接（experimental 模块与文章模块页面）：只做链接跳转，不引用其私有资源

**改动前置条件**：
- 本模块无私有 JS、无生成管线依赖；调整版式时同步维护 `css/toolkit/` 对应文件即可
- 新增工具页时先确认它不属于 experimental 模块（见第 1 节边界说明）
