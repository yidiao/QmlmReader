# 正名模块 README

> 对应源码：`html/rectify/`、`data/rectify-txt/`、`data/rectify-json/`、`js/rectify-json.js`、`css/rectify/`、公共脚本。  
> 作用：管理正名专题入口、分主题页面、专题文本数据与视觉边界。

---

## 1. 页面范围

```text
html/rectify/rectify.html
html/rectify/economy/soviet-agriculture.html
html/rectify/leaders/gorky-lenin.html
html/rectify/leaders/pol-pot.html
html/rectify/leaders/stalin-era.html
html/rectify/military/finland-war.html
html/rectify/military/soviet-afghanistan.html
html/rectify/myths/human-nature.html
html/rectify/myths/power-illusion.html
html/rectify/myths/wisdom-of-elites.html
html/rectify/myths/young-october.html
```

---

## 2. 当前资源链路

主入口 `rectify.html` 引入：

```html
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/rectify/rectify-index.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

十篇子页引入 `css/rectify/rectify-common.css`（下载浮动按钮 + 多数派文章版式），
页面差异与特有规则保留在各页 `<style>` 中（内联后加载、可覆盖公共规则），
并统一加载 `js/rectify-json.js` 负责正文数据渲染（见第 3 节）。
主题红统一走 `css/color-tokens.css` 的 `--color-brand-red` / `--color-brand-red-dark`。
全局样式/颜色/z-index 约束见 `doc/design-tokens.md`。

---

## 3. 数据链路（权威口径）

```text
data/rectify-txt/*.txt    # 10 篇构建源（_tools/build_rectify_json.py 的输入）
        ↓  python _tools/build_rectify_json.py
data/rectify-json/*.json  # 生成产物，禁手改
        ↓  子页 <body data-article-json="..."> 声明 + js/rectify-json.js fetch 渲染
html/rectify/ 十篇子页正文
```

| 文件/目录 | 角色 |
|---|---|
| `data/rectify-txt/`（10 篇 .txt） | 权威构建源，正文修改在这里 |
| `data/rectify-json/`（10 篇 .json） | 构建产物，**禁手改**；改数据后必须重跑构建 |
| `js/rectify-json.js` | 子页通用渲染脚本，10 个子页都加载，按 `data-article-json` 属性 fetch 渲染 |
| `data/rectify.json` | 构建中间物；运行时经 `js/site-data.js` 的 `rectifyIndex` 生效，无代码直读 |
| 顶级 `data/rectify-*.txt`（7 个文件） | 已于 2026-11-07 删除（PLAN D3 完成） |

正文协议 `data-article-json` 与文章模块一致（共享协议，见「权责边界」）。

---

## 4. 维护重点

1. ~~`rectify.html` 当前存在重复/内联样式块，后续应下沉为模块 CSS。~~ 已完成（2026-11）：`rectify.html` 已 0 个 style 块，样式下沉至 `css/rectify/rectify-index.css`；10 篇子页仍有内联 `<style>`（页面差异与特有规则），后续可按需下沉。
2. 新增专题时，同步维护页面、`data/rectify-txt/` 源文本和下载/搜索入口，并重跑构建生成 `data/rectify-json/`。
3. 分主题页面路径较深，公共脚本相对路径要核对。
4. 不要让页面内容、txt 源文本和 JSON 产物长期互相冲突；权威正文来源是 `data/rectify-txt/`，改源后重跑构建即可对齐。

---

## 5. 权责边界

**拥有（可自由修改）**：
- `html/rectify/`（主入口 + 10 篇子页）
- `js/rectify-json.js`
- `css/rectify/`（rectify-index.css、rectify-common.css）
- `data/rectify-txt/`（正文权威源）

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）
- `css/color-tokens.css`（主题红 token）

**共享/跨界资产**：
- 正文协议 `data-article-json`：与文章模块共用的声明 + fetch 渲染约定，改动前需过 `doc/README.md` 权责矩阵

**改动前置条件**：
- 修改 `data/rectify-txt/` 源文本后必须重跑 `python _tools/build_rectify_json.py` 重新生成 `data/rectify-json/`；禁止直接手改 JSON 产物
