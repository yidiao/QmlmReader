# experimental 模块 README

> 对应源码：`html/experimental/`、`js/marxist/`、`js/qingma/`、`js/xiaocezi/`、`js/yangbanxi/`、相关 CSS。  
> 作用：管理实验工具入口和子工具技术细节。入口层使用中性工程表述，长研究稿和 Prompt 资料放入 `research/`，避免污染总览。

---

## 1. 页面范围

```text
html/experimental/experimental.html   # experimental 模块总入口
html/experimental/marxist-style.html  # 文体工具页
html/experimental/message-board.html  # 留言板/消息页
html/experimental/qingma.html         # 文字选项小游戏
html/experimental/redify.html         # 图像风格化概念/入口
html/experimental/xiaocezi.html       # Word -> 小册子/PDF 工具
html/experimental/yangbanxi.html      # 剧本/分镜/Prompt 生成工具
```

总入口资源：

```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 2. 子工具索引

| 子工具 | 页面 | 脚本 | 样式 | 状态 |
|---|---|---|---|---|
| 文体工具 | `html/experimental/marxist-style.html` / `html/toolkit/marxist-style.html` | `js/marxist/marxist-style.js`、`js/marxist/marxist-style-ai.js`、`js/marxist/mentors/*.js` | `css/marxist-style.css` | 已有复杂实现 |
| 文字选项小游戏 | `html/experimental/qingma.html` | `js/qingma/data.js`、`engine.js`、`ui.js`、`main.js` | `css/qingma-style.css` | 已实装完整闭环 |
| 小册子工具 | `html/experimental/xiaocezi.html` | `js/xiaocezi/xiaocezi.js`、`style-engine.js` | `css/xiaocezi-style*.css` | 已落地原型 |
| 剧本/分镜工具 | `html/experimental/yangbanxi.html` | `js/yangbanxi/yangbanxi.js`、`yangbanxi-prompt.js` | `css/yangbanxi-style.css` | 已落地原型，仍有升级点 |
| 图像风格化工具 | `html/experimental/redify.html` | 暂未发现独立核心 JS | `css/redify-style.css` | 概念/早期入口 |
| 留言板 | `html/experimental/message-board.html` | 需后续核对 | 共享/内联 | 待整理 |

---

## 3. 视觉与数据管理原则

1. 子工具可拥有独立视觉，但必须保留母站基础骨架：导航、暗色模式、相对路径正确。
2. 复杂工具的研究稿、Prompt、长篇推演不要写进总览，统一放 `research/` 或子工具自己的 README 段落里。
3. 若工具直连外部 AI API，文档只记录工程接口和密钥存放策略，不在总览复述完整系统提示词。
4. 本模块的命名在文档入口中尽量用 `experimental 模块`，具体中文页面名只在路径表中保留。

---

## 4. 当前子工具事实

### 文体工具

- 前端控制器体量较大：`js/marxist/marxist-style.js`。
- AI 调用与导师注册：`js/marxist/marxist-style-ai.js`、`js/marxist/mentors/*.js`。
- 规则/数据：`js/marxist/marxist-style-rules.json`、`js/marxist/marxist-style-rules-data.js`、`article-db.js`。
- 历史文档显示：规则引擎路线已退场，AI 直连/调度成为主路径。

### 文字选项小游戏

- `js/qingma/data.js` 保存题库、敌人、事件、配置等大数据。
- `engine.js` 负责状态、战斗、事件、商店、结算等逻辑。
- `ui.js` 负责渲染和交互。
- `main.js` 作为入口胶水。
- 已有本地持久化和调试台。

### 小册子工具

- 流程：上传 `.docx` -> mammoth 解析 -> 结构识别 -> A5 分页 -> 打印导出 PDF。
- 样式以 `body[data-style]` 切换，当前有“手作油印”和“精致书刊”两套风格。
- 不做文本编辑器，写作留在 Word，工具只负责排版美化。

### 剧本/分镜工具

- 已有三阶段流程：定框架、逐段协作、导出分镜/Prompt 包。
- 当前升级方向：分镜 AI 化、音乐/视频 Prompt、骨架库、历史记录、独立通读视图等。
- 完整研究稿放在 `research/`，入口只保留工程结论。

### 图像风格化工具

- 当前按概念/早期入口管理。
- 若后续实现，应重点记录：上传、参数、预览、生成 API、导出、隐私/缓存策略。

---

## 5. research 管理

`research/` 用于保存长篇背景研究、旧方案、Prompt 资料和美术推演。规则：

- README 只写结论和入口，不复制长 Prompt。
- 过期研究可以直接覆盖为摘要或删除。
- 若研究稿对实现仍有价值，在本 README 的子工具段落中提炼为“当前结论”。
