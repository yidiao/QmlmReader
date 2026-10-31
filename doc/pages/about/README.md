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
| 更新日志列表/详情 | 优先检查 `data/updates.json` 与相关页面脚本 |
| 公共导航/暗色/光标 | `js/main.js`、`js/darkmode.js`、`js/cursor.js` |

---

## 3. 维护重点

1. 更新日志应优先以结构化数据维护，避免归档页、详情页和首页重复写不同版本。
2. 关于页属于站点说明，不应塞具体页面技术细节。
3. 若修改站点口号、介绍、版本记录，应同步检查首页和页脚。
