# QmlmReader 设计令牌

## 六大文章分类主题色

分类主题由 `css/category-theme.css` 统一维护，`js/category-theme.js` 提供分类 key、中文名称和 DOM 接口。分类 key 是唯一接口：`philosophy`、`economics`、`politics`、`party`、`military`、`culture`。

| 分类 | key | 主色方向 | 使用说明 |
|---|---|---|---|
| 哲学基础 | `philosophy` | 深红 | 理论根基、辩证法、认识论 |
| 政治经济学 | `economics` | 铜赭 | 历史感、物质生产、经济分析 |
| 政治理论 | `politics` | 桑紫 | 与深红区分，避免亮紫和靛蓝 |
| 党的建设 | `party` | 橄榄绿 | 组织、先锋队、纪律和建设 |
| 军事战略 | `military` | 铁青湖蓝 | 冷静、克制、战略分析 |
| 思想文化 | `culture` | 赭黄 | 与党的建设的绿色明确区分 |

每类提供 `primary`、`secondary`、`dark`、`soft`、`ink` 五个层级。`primary` 用于节点和主要徽标，`soft` 用于浅色标签背景，`ink` 用于标签文字，`dark` 和 `secondary` 用于渐变与深色场景。

## 基准色与偏移规则

不在页面内临时计算颜色。每类以庄重的低饱和主色为基准，通过预定义的深色、辅助色和浅色变体表达偏移。这样可以保证索引卡片、详情页和拼图节点的颜色稳定、可审查、可复用。

页面只声明 `data-category`，不得在单个文章 HTML 或拼图数据中重新定义分类主色。详情页兼容变量 `--cat-primary`、`--cat-secondary`、`--cat-gradient` 由公共主题文件映射。

## 接入边界

- 文章索引：`article-category-tag[data-category]`。
- 文章详情：`body[data-category]`，加载 `category-theme.css` 和 `category-theme.js`。
- 全局拼图：节点、泳道、图例、弹窗徽标使用分类 key，由 `QMLMCategoryTheme` 或 CSS 变量取色。
- 收藏按钮沿用 `preferences.js` 的 `data-qmlm-favorite-btn` / `data-qmlm-favorite-mode="icon"` 协议。
