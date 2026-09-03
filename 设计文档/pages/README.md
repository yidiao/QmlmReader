# 页面模块文档索引

> 规则：`html/<module>/...` 对应 `设计文档/pages/<module>/README.md`。每个模块尽量只维护一个 README，复杂研究稿放模块下的 `research/`。

| html 模块 | 文档 | 说明 |
|---|---|---|
| `html/index.html` | `home/README.md` | 首页与根入口 |
| `html/about/` | `about/README.md` | 关于页、更新日志 |
| `html/articles/` | `articles/README.md` | 文章列表、详情页、正文/精读接入 |
| `html/downloads/` | `downloads/README.md` | 下载中心和导出入口 |
| `html/experimental/` | `experimental/README.md` | 实验工具和研究资料 |
| `html/gallery/` | `gallery/README.md` | 文艺资源 |
| `html/rectify/` | `rectify/README.md` | 正名专题 |
| `html/masters/` | `masters/README.md` | 导师入口与分导师页 |
| `html/international/` | `international/README.md` | 国际主题页 |
| `html/puzzle/` | `puzzle/README.md` | 全局拼图原型 |
| `html/toolkit/` | `toolkit/README.md` | 工具集入口 |

维护要求：

1. 页面源码变动后，同步更新对应模块 README。
2. 模块 README 只写：页面范围、数据源、脚本、样式、边界、当前状态。
3. 不把长篇 Prompt、研究过程、历史争论写进页面 README；放入 `research/` 并在 README 摘要引用。
