# 关于模块 README

> 对应源码：`html/about/`、`data/updates.json`、公共脚本。  
> 作用：管理关于页、更新日志归档和站点说明。

---

## 1. 页面范围

```text
html/about/about.html
html/about/changelog-archive.html
html/about/changelog-detail.html
```

---

## 2. 数据关系

| 功能 | 来源 |
|---|---|
| 关于页静态说明 | 当前主要在 HTML 中维护 |
| 更新日志列表/详情 | `data/updates.json`：`changelog-archive.html:162` 与 `changelog-detail.html:135` 直接 `fetch('../../data/updates.json')` 渲染 |
| 站点聚合数据 | `js/site-data.js`，三个页面均加载（`about.html:198`、`changelog-archive.html:205`、`changelog-detail.html:282`） |
| 公共导航/暗色/光标 | `js/main.js`、`js/darkmode.js`、`js/cursor.js` |

全局样式/颜色/z-index 约束见 `doc/design-tokens.md`。

---

## 3. 维护重点

1. 更新日志应优先以结构化数据维护（`data/updates.json`），避免归档页、详情页和首页重复写不同版本。
2. 关于页属于站点说明，不应塞具体页面技术细节。
3. 若修改站点口号、介绍、版本记录，应同步检查首页和页脚。

---

## 4. 权责边界

**拥有（可自由修改）**：
- `html/about/` 三个页面：`about.html`、`changelog-archive.html`、`changelog-detail.html`

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js`、`js/cursor.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）
- 本模块**无私有 css/js**：页面样式全部依赖公共层，改样式需评估对公共层与全站的影响，不得在页面里写全站性覆盖规则

**共享/跨界资产**：
- `data/updates.json`：更新日志权威数据源，与首页（更新日志区块）共享，改动前需过 `doc/pages/home/README.md`

**改动前置条件**：
- `data/updates.json` 为运行时直接 fetch，不经过 `_tools/build_data.py`；改动后需同时核对首页更新日志区块与 changelog 两页的展示。
