# 个人偏好模块 README

> 对应源码：`html/preferences/preferences.html`、`css/preferences/preferences.css`、`js/preferences.js`。  
> 作用：承载本地收藏、阅读历史、视图设置预留与相关本地管理功能。

---

## 1. 页面范围

```text
html/preferences/preferences.html
```

> 边界说明：`js/preferences.js` 由 `js/main.js`（`main.js` L62-103）在**所有加载 main.js 的页面**自动注入，并非文章页专属；目前显式 `<script>` 引用它的页面只有 `html/articles/articles.html` 和 `html/masters/stalin/biography.html`。

页面加载的模块资源（`preferences.html`）：

- 私有样式：`css/preferences/preferences.css`（`preferences.html:10` 加载，约 16.2KB）
- 页面显式依赖：`js/state-center.js`、`js/page-state-adapter.js`（`preferences.html:109-110`）；其余为 `js/site-data.js`、`js/main.js`、`js/darkmode.js`、`js/cursor.js` 等公共层脚本

---

## 2. 当前职责

| 功能 | 说明 |
|---|---|
| 收藏 | 本地保存文章收藏列表 |
| 阅读历史 | 保存最近访问的文章页、Tab、分区、偏移与进度 |
| 阅读进度 | 文章详情页顶部显示进度条，基于真实 DOM 布局计算 |
| 视图设置 | 先保留接口，后续统一管理展示模式 |
| 数据管理 | 本地导出 / 导入 / 重置，不接后端 |
| 交互 | 左侧导航、搜索、刷新、单条删除、快速导出、文章卡片/详情页收藏按钮、继续入口 |

---

## 3. 数据边界

| 键 | 用途 |
|---|---|
| `qmlm:state:v1` | 新统一状态中心，当前包含 `preferences` 与 `theme` 等状态域 |
| `qmlm:preferences:v1` | 旧个人偏好状态键，当前保留兼容写入 |
| `preferences.favorites` | 收藏文章列表 |
| `preferences.history` | 历史列表，最多保留 50 条；包含 Tab、分区、偏移、整页进度、分区进度和时间 |
| `preferences.view.mode` | 展示模式预留 |
| `preferences.view.density` | 密度预留 |

历史记录只保存在浏览器 `localStorage` 中，不需要后端，也不写回项目里的 JSON 数据文件。新代码优先通过 `window.QMLMState.preferences` 读写，偏好页已订阅 `preferences` 域并随状态变更自动刷新；旧键保留用于迁移和兼容。

---

## 4. 当前已完成

1. 顶部品牌区可进入个人偏好页。
2. 个人偏好页已形成左侧导航 + 右侧卡片展示结构。
3. 收藏功能已接入文章列表卡片和文章详情页。
4. 文章列表收藏按钮使用紧凑图标形态；详情页保留文本按钮。
5. 历史列表能显示记录、进度、Tab、分区等信息。
6. 文章详情页已注入顶部阅读进度条，并暴露 `window.QMLMReadingProgress.current`；若 `window.QMLMState` 存在，也会同步发布到 `QMLMState.reader.progress`。
7. 继续入口已开始接入 `resume=1` 参数。
8. 详情页的手动“记录当前位置”按钮已移除，历史记录改为自动保存。

---

## 5. 当前状态 / 后续边界

1. 历史恢复交互已反转为当前闭环：
   - 进入文章页后先恢复到上次阅读位置；
   - 随后在阅读进度条下方弹出紧凑的 5 秒提示，询问是否返回顶部；
   - 提示浮层带倒计时条，并保持在自定义光标图层之下，避免遮挡交互；
   - 用户取消或超时后仅关闭提示并保留当前位置；
   - 用户确认后返回顶部。
2. `restoreReadingState()` 已补齐动态内容时机处理：
   - 详情内容渲染完成后才启动恢复检测；
   - 非初始 Tab 的恢复会等待辅助区域渲染完成事件或短超时兜底；
   - 恢复期间暂停自动历史覆盖，提示关闭后再恢复正常保存；
   - 恢复流程阶段状态已发布到 `QMLMState.reader.restore`，便于后续订阅和调试。
3. 当前已通过本地静态服务 + Headless Chrome 烟测：进入后能跳到历史位置，提示出现，取消后保留当前位置，确认后返回顶部。
4. 如果历史进度达到 100%，目标行为是视为已完成，不再恢复到末尾，进入页面时回到初始阅读入口。
5. 章节导航暂不改，但阅读进度对象已预留给后续章节导航使用。

---

## 6. 维护重点

1. 优先服务文章页的最小闭环，不要先扩散到全站所有模块。
2. 当前只做本地浏览器偏好，不引入后端同步。
3. 视图设置先留接口，等多个展示页统一改造时再接入具体切换逻辑。
4. 历史恢复必须避免页面刚加载时覆盖旧记录。
5. 恢复定位应等待动态内容渲染完成后再执行。
6. 用户可取消恢复，避免强制改变当前阅读起点。
7. 章节导航后续可监听 `qmlm:reading-progress` 事件或读取 `window.QMLMReadingProgress.current`；当前 Tab、章节导航显示状态和章节折叠状态已发布到 `QMLMState.reader`。
8. 页面视觉以现代卡片 + 轻玻璃质感为主，保持与站点整体红色主调一致；全局样式/颜色/z-index 约束见 `doc/design-tokens.md`。

---

## 7. 权责边界

**拥有（可自由修改）**：
- `js/preferences.js`（**跨模块资产**：由 `js/main.js` 全站自动注入、被 articles / masters 显式消费，改动需评估外溢影响）
- `css/preferences/preferences.css`（偏好页私有样式）
- `html/preferences/preferences.html`
- 本地存储键 `qmlm:preferences:v1` 及其兼容写入链（旧键保留用于迁移和兼容）

**只读消费（禁改）**：
- 公共层：`js/main.js`、`css/style.css`、`js/site-data.js`（生成物）、`js/darkmode.js`、`js/cursor.js` 等公共脚本（完整清单见 `doc/README.md` 模块权责矩阵脚注）
- `js/state-center.js`、`js/page-state-adapter.js`：页面显式依赖的公共状态层

**共享/跨界资产**：
- `js/preferences.js` 的消费方：`html/articles/articles.html`（文章收藏按钮协议）与 `html/masters/stalin/biography.html`；改动前需过 `doc/pages/articles/README.md` 与 `doc/pages/masters/README.md`

**改动前置条件**：
- 调整自动注入逻辑时改动点在 `js/main.js`（L62-103），属公共层改动，需先过公共层评审再动
- 存储结构变更必须保持 `qmlm:preferences:v1` 旧键兼容读取，避免已有用户本地数据丢失
