# 首页模块 README

> 对应源码：`html/index.html`、根 `index.html`、`data/updates.json`、`data/history-events.js`、`js/daily-quote.js`、`js/search.js`、公共脚本。  
> 作用：管理站点首页、入口跳转、今日内容、搜索入口与首页私有视觉。

---

## 1. 页面范围

```text
index.html       # 根入口，meta refresh 到 html/index.html
html/index.html  # 真正首页
```

根入口只负责跳转，不应承载业务逻辑。

---

## 2. 当前资源链路

`html/index.html` 当前引入：

```html
<link rel="stylesheet" href="../css/style.css">
<script src="../js/site-data.js"></script>
<script src="../js/main.js"></script>
<script src="../js/shutter.js"></script>
<script src="../data/history-events.js"></script>
<script src="../js/search.js"></script>
<script src="../js/daily-quote.js"></script>
<script src="../js/darkmode.js"></script>
<script src="../js/cursor.js"></script>
```

---

## 3. 数据源

| 功能 | 数据/脚本 |
|---|---|
| 站点聚合数据 | `js/site-data.js` |
| 搜索 | `js/search.js` + `window.SITE_DATA` |
| 历史上的今天 | `data/history-events.js` |
| 今日语录 | `js/daily-quote.js`，可能读取语录数据 |
| 更新日志 | `data/updates.json` |

---

## 4. 维护重点

1. 首页仍有大量页面内 `<style>`；后续可逐步迁到 `css/style.css` 或单独首页 CSS。
2. 搜索相关改动先看 `js/search.js` 和 `data/*`，不要只改首页 DOM。
3. 更新日志改动优先维护 `data/updates.json`，不要把日志写死在页面里。
4. 保持根 `index.html` 简洁跳转，不要在根页复制首页内容。
