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
<script src="相对路径/js/darkmode.js"></script>
<script src="相对路径/js/cursor.js"></script>
```

若页面使用 `main.js` 或 `search.js`，必须先加载 `site-data.js`。

---

## 2. 公共文件职责

| 文件 | 职责 | 维护边界 |
|---|---|---|
| `index.html` | 根跳转到 `html/index.html` | 不承载业务页面 |
| `html/index.html` | 真正首页 | 首页模块细节见 `pages/home/README.md` |
| `css/style.css` | 全站基础视觉、导航、卡片、暗色模式通用规则 | 不宜继续无限塞页面私有样式 |
| `js/main.js` | 导航注入、面包屑、合集导航、章节导航、卡片动画 | 公共逻辑，不应塞具体页面的大段业务数据 |
| `js/site-data.js` | 站点聚合数据 | 生成产物，不要手改 |
| `_tools/build_data.py` | 聚合数据构建 | 改数据源后运行它更新 `site-data.js` |
| `js/search.js` | 搜索索引读取与结果渲染 | 基于索引层，不应塞正文全文 |
| `js/darkmode.js` | 暗色模式 | 与页面私有 localStorage 切换逻辑后续需统一 |
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
