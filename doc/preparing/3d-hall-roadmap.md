# 桌面版 3D 展厅路线图

> 状态：讨论定稿，待执行  
> 对应源码（规划）：`html/hall/`、`doc/pages/home/README.md`  
> 本文是这条线的**唯一决策依据**；与本文冲突的旧讨论以本文为准。  
> 核心原则一句话：**视觉要重，交互要轻。**  
> 用布景的密度、尺度、光比表达宏大与激动人心；用极少的可点物件（≤8）表达克制与现代。

---

## 0. 已定决策

| # | 决策 | 说明 |
|---|---|---|
| D1 | **桌面端特供** | 不替换现有 `html/index.html`；移动端继续走经典首页。展厅页最小支持宽度 1024px。 |
| D2 | **运行时 = 烘焙大图 + 分层 + DOM 热区** | 不引入 three.js / WebGL。Blender 只作为出图工具，成片即成品。 |
| D3 | **场景静态** | 不做相机运动、不做人物、不做骨骼动画。允许 ≤8px 的鼠标视差。 |
| D4 | **交互物件 ≤8 个** | 其余一律是氛围件，且必须有明确的"不可点"视觉语言。 |
| D5 | **视觉定调：重、庄重、仪式感** | 保留参考图的密度与对称，通过机位、层高、光比获得"宏大"。不再执行"砍一半物件"的旧建议——改为"构图不砍、交互砍"。 |
| D6 | **可变文字不烘焙** | 台历日期、报纸头条、公告栏条目走 DOM 覆盖层。 |
| D7 | **无构建流程** | 纯静态文件，版本靠目录名 + `?v=` 参数。 |

---

## 1. 目标 / 非目标 / 成功标准

### 1.1 目标

1. 桌面端首页从"信息堆叠"变成"一个可以点的大厅"：第一屏完成 **8 个内容型主入口**，其余入口 1 击可达（展签条/索引）。
2. 画质向参考图靠（材质、光、密度），结构比参考图克制（热区、文字、动效）。
3. 首屏速度优于现状：底图 LCP < 1.5 s，首屏图片总量 ≤ 1.6 MB。

### 1.2 非目标

- 移动端适配、竖屏构图、触屏交互（不做，直接留在经典首页）。
- 实时 3D、相机漫游、物件浮出、人物动画。
- 站内搜索的完整重构（只在 P2 接一次懒加载）。
- 深色模式（P2 作为"夜景第二版"讨论，不是 P0 范围）。

### 1.3 成功标准（可验收）

- 1280×720 / 1440×900 / 1920×1080 / 2560×1440 四档下构图不崩、热区不偏。
- 8 个热区全部可达、链接 0 个 404、键盘 Tab 可遍历。
- 首次访问有一次性引导（约 5.6 s，`prefers-reduced-motion` 下 2 s），之后不再出现。
- 无 console 报错；`prefers-reduced-motion` 下无位移与过渡动画。

---

## 2. 视觉定调：怎么"重"，以及"重而不乱"

### 2.1 参考图取舍

**保留**：对称轴线、三开间壁柱、白色大理石基调、深红丝绒、黄铜/金色、中央徽章、左侧画像墙、右侧书架与公告栏、办公桌、格子地面与红毯、乐器角。这些是"境界"，不要简化。

**改造**：

- 中央徽章与横幅是全画面最重的两块，**徽章缩小 20–30%**，横幅去掉文字、改成一条暗红丝绒 + 小块黄铜铭牌，避免"大字压画面"。
- 参考图顶部是空的，可用**檐口 + 吊灯（或吸顶灯盘）**补足"高"，把层高从视觉上推到 7 m 以上。
- 左侧或右侧留一个**门洞/走廊暗部**，给画面纵深，也让"来去匆匆的通讯员"将来有位置（虽然现在不做人）。
- 小物件（手风琴、开盘机、小号、书堆）保留，但**合并成 1 个热区**，不逐个可点。

### 2.2 构图与机位

构图世界框建议 **14.0 m × 7.9 m（16:9）**，画面下沿落在距墙约 2.4 m 的地面。

```text
┌──────────────────────────────────────────────────────────────┐
│  旗   画像墙          檐口 / 吊灯          书架    公告栏   旗 │
│       地图·台历·报纸      徽章（缩小）                        │
│                                                              │
│  乐器角                 办公桌 + 台灯              档案箱      │
│ ═════════════════════ 红毯（引导线） ════════════════════════ │
└──────────────────────────────────────────────────────────────┘
```

- **相机**：透视，等效 50 mm（Blender 36 mm 传感器，50–55 mm），机高 **1.30 m**，yaw = 0，居中。
- **几何反推（定稿时以 Blender 复核）**：由 14 m 画幅 + 50 mm 镜头得 **机距 ≈ 19.4 m**；要让画面下沿落在距墙约 2.4 m 的地面上，镜头需**仰视 ≈ 7°**（画面中心对准墙面约 3.7 m 处）。仰视是"宏大"最便宜的来源，但超过 8° 会开始看到天花板而失去"正视图"的秩序感。
- 想要更"展柜/博物馆"的非现实感，改 85 mm 压缩纵深（机距拉远）；想要更"压迫/崇高"，降到 35 mm 并靠近。默认 50 mm。
- 安全区：四周内缩 **6%** 作为"一定不被裁"的区域，8 个热区全部落在安全区内。
- 垂直构图：地面在画面下沿只留 15–18%（约 2 m 进深），天花板留 8–10%，中间是内容。

### 2.3 色彩与材质

一屏颜色不超过 6 个**大面积**角色（下表最后两行只做点缀）：

| 角色 | 色值 | 用途 |
|---|---|---|
| 大理石亮部 | `#EFE9DF` | 墙面上部、受光面 |
| 大理石中间调 | `#DCD5C8` | 墙面主调、柱子 |
| 大理石暗部 | `#B9AF9E` | 暗角、柱背、踢脚 |
| 深红 | `#7A1618` / 亮 `#A62022` / 暗 `#4A0F11` | 旗帜、丝绒、地毯、铭牌底 |
| 黄铜 | `#B08D4F` / 高光 `#E3C98B` | 框、灯具、徽章、五金 |
| 纸张 | `#F5EEE0` / 旧纸 `#E8DCC4` | 报纸、日历、书页 |
| 深木 | `#4A2E1E` / `#2E1B12` | 书架、桌、地板 |
| 墨 | `#241C18` | 文字、暗部最深处（不要纯黑） |

品牌红 `#c41e3a` 只用于热区标签文字与 active 态；hover 描边用黄铜金 `#C9A227`，不参与大面积。

材质清单（六套，全部走 PBR + 程序化细节）：

| 材质 | 关键参数 | 要点 |
|---|---|---|
| 白色大理石 | roughness 0.12–0.25 + 变化贴图，clearcoat 0.15–0.25，bump 0.02–0.05 | 必须有环境反射，否则是"塑料白" |
| 黄铜 | metalness 1，roughness 0.18–0.35，污渍/指印贴图 | 没有 IBL 金属必发黑 |
| 深色木 | roughness 0.35–0.5，木纹凹凸 + 边缘磨损 | 桌面要有使用痕迹才"活" |
| 纸张/报纸 | roughness 0.85–0.95，sheen 0.3–0.5，纤维 bump 0.01–0.03 | 轻微卷边几何比贴图有效 10 倍 |
| 丝绒/毛毡 | sheen 1.0，roughness 0.9，各向异性微调 | 地毯边缘做磨毛 |
| 玻璃（灯罩/镜框） | IOR 1.5，roughness 0.05–0.1 | 灯罩用薄壁 + 内部光源 |

### 2.4 光的模板

- **主光**：4×2 m 柔光箱，右前上方 45°，5000 K，强度作为曝光基准。
- **补光**：左前侧大面积弱光，−2 EV，4200 K，只抬暗部。
- **环境**：弱暖 HDRI（室内），不要外景天空，否则墙面泛蓝。
- **吊灯/台灯**：暖 2700–3000 K，作为画面里的"眼"。
- **对比**：整体低调，四角压 −0.3 EV；黑位抬到 `#0D0A08`，不要压死。
- **后期**：bloom 阈值 1.0、强度 0.05–0.1；颗粒 0.015–0.03；**不锐化**。高级感来自低对比 + 材质细节。

### 2.5 "重而不乱"的三条红线

1. **可点物件 ≤ 8**；可点物件必须能被一眼区分（hover 有标签、描边、光标变化）。
2. **烘焙图内不出现任何浮层 UI**：没有标题条、按钮、说明文字、角标。画面上的 UI 只能是展厅自带的三个极小控件（站名、索引、经典版），且不压住任何展品。
3. **文字总量 ≤ 3 处**：黄铜铭牌（站名）、报纸头条（1 条）、台历日期（1 行）。其余全部交给画面。

---

## 3. 页面与分流

### 3.1 文件与目录（自包含，避免部署脚本改写相对路径）

```text
html/hall/
├── hall.html              # 展厅页（独立沉浸页，不引 style.css / main.js）
├── hall.css               # 页面私有样式（自建 --hall-* 场景色板，见 §6.1）
├── hall.js                # 渲染 + 交互（IIFE，无构建）
├── scene-data.js          # 场景描述（window.HALL_SCENE），见 §7
└── assets/
    ├── base-3200.avif / base-1920.avif / base-1920.webp / base-1920.jpg
    ├── layer-01-wall-1920.avif  / .webp     # 背景层（不透明）
    ├── layer-02-mid-1920.avif   / .webp     # 中景层（RGBA）
    ├── layer-03-front-1920.avif / .webp     # 前景层（RGBA）
    ├── layer-04-glow-1920.avif  / .webp     # 可选：光效层（RGBA）
    ├── hover-<id>.webp                      # P2：单物件高亮覆盖层（RGBA）
    └── grain.png                            # P2：尘埃/颗粒叠加（可选）
```

- 分层文件名统一为 `<name>-1920.avif`（**只有 1920 一档**），`scene-data.js` 与本节必须完全一致，改名前先 grep 三处。
- 不产出 `lqip.txt`：32px 模糊底图直接内联进 `scene-data.js` 的 `base.lqip`（省一次请求，`file://` 也能看）。
- **禁止对 `html/hall/` 运行 `_tools/fix_html_paths.py`**：该脚本按文件深度重写 `assets|css|js|data|images|downloads` 前缀（会把 `assets/...` 改成 `../../../assets/...`），且 `ROOT` 仍是旧机器路径。若将来要修脚本，必须先排除 `html/hall/`。
- 文档归口：按项目约定 `html/<module>/` 配 `doc/pages/<module>/README.md`；展厅是首页的桌面变体，不另建模块文档，全部并入 `doc/pages/home/`（本文件 + `README.md` 摘要）。本模块是"自包含沉浸页"的登记例外，先例见 `html/gallery/soviet-jokes/`、`html/gallery/mao-poetry-quotes.html`、`html/puzzle/capital-socialism/`。

### 3.2 桌面/移动分流（两阶段，先安全后自动）

**阶段 A（P1–P2，零风险）**：`html/index.html` 顶部加一条极简入口（一句"桌面展厅 · 点击进入"的链接，`href="hall/hall.html"`）。具体位置：`html/index.html` 的 `<div id="nav-placeholder">` 之后、`<main class="home-page">` 之前，一条通栏细条（高度约 44 px，米白底 + 深红字 + 右箭头）。不做任何自动跳转，移动端完全不受影响。

实现注意：

- 样式放 `css/home/index.css` 末尾新增一节（不新增内联 style）；类名 `home-hall-entry`。
- 现有开屏遮罩 `.hero-opening` 是 `position: fixed; z-index: 9999`、约 3.4 s 才撤（`css/style.css` 的 `.hero-opening` 段），入口条在开屏期间会被盖住——**可以接受**（开屏结束后自然露出），不要为了入口条去动开屏的层级。
- 移动端（`max-width: 768px`）不显示入口条。

**阶段 B（P3，可选）**：在 `html/index.html` 的 `<head>` 加一段分流脚本，条件全部满足才跳：

```js
// 仅在满足全部条件时跳转，且可被永久关闭
var classic = false;
try { classic = localStorage.getItem('qmlm:hall:classic') === '1'; } catch (e) {}
var ok = matchMedia('(min-width: 1180px)').matches
      && matchMedia('(hover: hover) and (pointer: fine)').matches
      && !matchMedia('(prefers-reduced-motion: reduce)').matches
      && !classic && !/[?&]classic=1/.test(location.search);
if (ok) location.replace('hall/hall.html');
```

展厅页始终提供"经典版"入口，写入 `localStorage['qmlm:hall:classic'] = '1'` 后永不自动跳转。

阈值说明：展厅页本身支持到 1024 px，但自动分流阈值定在 **1180 px**，留出边距，避免窄桌面窗口切到展厅后构图偏挤。

**SEO 注意**：阶段 B 会让桌面 UA 的爬虫落到展厅页，所以展厅页必须自带完整语义链接（见 §6.10），否则首页文字权重全丢。如果不想做这件事，就停在阶段 A，把"进入展厅"做成视觉入口。

### 3.3 页面壳（导航策略）

展厅页**不注入公共导航**（不引 `js/main.js`），取而代之：

- 左上角：站名（小号衬线，点击回展厅自身，不跳）。
- 右上角：极小的"经典版"文字链接（仅阶段 B 之后出现；点击写入 `qmlm:hall:classic=1` 并回 `../index.html`）。
- 右下角：一个极小的"索引"文字按钮（`opacity: .45`，hover 提亮）。
- 点击索引 或 键盘按 `/`：底部滑出**展签条**——一条米白纸带，列出全站模块的真实链接 + 展厅 8 个热区名称。它是导航、是无障碍入口、也是 SEO 落地链接。
- Esc 关闭展签条。展签条出现时焦点陷阱生效。

这套设计让"没有导航栏"成立，同时不牺牲可达性。

> 与"公共导航唯一来源"的约定不冲突：该约定约束的是**普通页面**不得硬编码 `site-header`/菜单项。展厅是"自包含沉浸页"特例，与 `html/gallery/soviet-jokes/`、`html/gallery/mao-poetry-quotes.html`、`html/puzzle/capital-socialism/` 同属一类；本文件即为此特例的登记。

### 3.4 展签条清单（12 个模块）

| # | 分区 | 文案 | href（相对 `html/hall/`） |
|---|---|---|---|
| 1 | 阅读 | 文章库 | `../articles/articles.html` |
| 2 | 阅读 | 革命导师 | `../masters/masters.html` |
| 3 | 阅读 | 工具集 | `../toolkit/toolkit.html` |
| 4 | 阅读 | 理论拼图 | `../puzzle/puzzle.html` |
| 5 | 国际 | 国际共运 | `../international/international.html` |
| 6 | 国际 | 历史上的今天 | `../international/international-calendar.html` |
| 7 | 国际 | 国际栏目 | `../international/international-column.html` |
| 8 | 文艺 | 文艺馆 | `../gallery/gallery.html` |
| 9 | 文艺 | 语录 | `../gallery/quotes.html` |
| 10 | 站点 | 武器库 / 留言板 | `../experimental/experimental.html` |
| 11 | 站点 | 正名 | `../rectify/rectify.html` |
| 12 | 站点 | 关于 / 更新日志 | `../about/about.html` |

另附三条：`下载`（`../downloads/downloads.html`）、`个人偏好`（`../preferences/preferences.html`）、`经典版首页`（`../index.html`）。

> 约定：展签条里的模块名以 `js/main.js` 的 `PATH_LABELS` 为基线，展厅不得另起一套叫法；链接一律写完整文件名，**不用目录式链接**（`rectify/` 这类目录没有 index.html，会 404）。

---

## 4. 物件清单与热区映射（核心表）

### 4.1 八个可点热区

| # | 场景物件 | 标签（hover 文案） | 去向（相对 `html/hall/`） | 动态 | 优先级 |
|---|---|---|---|---|---|
| H1 | 五幅导师画像墙 | 革命导师 · 五位导师的著作 | `../masters/masters.html` | — | P0 |
| H2 | 世界地图 | 国际共运 · 从 1848 到今天 | `../international/international.html` | — | P0 |
| H3 | 桌面台历 | 历史上的今天 · {今日} | `../international/international-calendar.html` | 今日日期 + 1 条事件 | P0 |
| H4 | 《真理报》 | 今日语录 · 报刊书架 | `../gallery/quotes.html` | 头条 1 条语录 | P0 |
| H5 | 书架 | 文章库 · 五星必读 | `../articles/articles.html` | — | P0 |
| H6 | 乐器角（留声机/手风琴/小号/开盘机） | 有趣的文艺 · 歌、影、画 | `../gallery/gallery.html` | — | P0 |
| H7 | 公告栏 | 更新日志 | `../about/changelog-archive.html` | 最近 1 条 | P1 |
| H8 | 档案箱（СЕКРЕТНЫЕ ДОКУМЕНТЫ） | 实验性玩法 · 武器库 | `../experimental/experimental.html` | — | P1 |

补充两个"非导航"交互（P2，可选）：

| # | 物件 | 行为 |
|---|---|---|
| X1 | 放大镜（桌面） | 打开展签条 / 站内索引面板 |
| X2 | 台灯 | 切换夜景光照版本（若做，见 §11） |

### 4.2 归口：被"移除"的入口去哪

工具集、理论拼图、留言板、下载、关于、正名、个人偏好、首页自身，不上 3D 热区，全部收进展签条：

| 原首页区块 | 新出口 |
|---|---|
| 工具集 | 展签条 → `../toolkit/toolkit.html` |
| 理论拼图 | 展签条 → `../puzzle/puzzle.html` |
| 留言板 | 展签条 → `../experimental/message-board.html` |
| 下载 | 展签条 → `../downloads/downloads.html` |
| 关于 | 展签条 → `../about/about.html` |
| 正名 | 展签条 → `../rectify/rectify.html` |
| 国际栏目 | 展签条 → `../international/international-column.html` |
| 个人偏好 | 展签条 → `../preferences/preferences.html` |

理由：这些是"入口型"，物件叙事强行加物件会破坏构图。8 个热区全是"内容型/品牌型"，语义最顺。

### 4.3 氛围件（不可点，但要精致）

红旗（2）、大理石墙面与壁柱、檐口、吊灯、格子地面、红毯、书脊排布、一摞摞纸、桌面上的笔与印章、玻璃灯罩。它们承担"重"和"贵"，不承担交互。

---

## 5. Blender 烘焙管线

### 5.1 场景规格

- 单位 1 unit = 1 m；构图世界框 14.0 × 7.9 m；层高 7.9 m；地面在画面下沿可见约 2.4 m（画面下沿与地面相交于距墙约 2.4 m 处）。
- 相机固定后**冻结**：首次定稿即填写下表，之后任何改动都视为改版（重出全部图）。

| 参数 | 值 |
|---|---|
| lens / sensor | 50 mm / 36 mm |
| 机距 | ≈ 19.4 m（由 14 m 画幅与 50 mm 反推） |
| 位置 (x, y, z) | 定稿后填写（机高 1.30 m） |
| 旋转 (x, y, z) | 定稿后填写（yaw = 0；仰视 ≈ 7°） |
| 世界框 | 14.0 × 7.9 m（16:9） |
| 画面下沿 | 落在距墙约 2.4 m 的地面 |
- 墙面物件全部为"画框内嵌画布"（平面 + 框体），不做抠像（资产全是 JPEG，无 alpha）。
- 墙面细节（画像、地图、报纸、日历、书脊）源贴图 **512–1024 足够**：成片里每件只占 1–4% 画面宽度，`images/masters/*.jpg`（1080²）完全够用，不需要海报原图。只有大理石/木纹/丝绒这类大面积材质才需要 2K + 程序化。

### 5.2 渲染参数

- 引擎：Cycles，CPU 或 GPU 均可。
- 采样：512–1024 spp + OpenImageDenoise；开启自适应采样。
- 色彩：AgX view transform（Blender 默认），**网页端不再套 ACES**，否则二次压缩高光会发灰。
- 分辨率：母版 **3840×2160**；发布两档：**3200**（2x 屏 / 视口 ≥1600 时用）、**1920**（其余）。不单独出 1280（桌面特供最小 1024 视口，1920 缩放即可）。
- 关闭运动模糊、关闭景深（或 f/8 轻微），保证全画面清晰。
- 每档先出 PNG 16-bit，再统一转 AVIF/WebP。

### 5.3 分层策略（关键，决定成败）

**三层 + 可选光效层**，用 Blender 的 View Layer 分离，**同一相机、同一光照、同一采样**，禁止后期抠像。

| 层 | 内容 | 透明 | 视差量（鼠标归一化后 ×系数） |
|---|---|---|---|
| L1 背景（不透明） | 墙、柱、檐口、天花、地面、地毯、大件固定家具 | 否 | 4 px |
| L2 中景 | 墙面画幅与框、书架、公告栏、办公桌与桌上物 | 是 | 6 px |
| L3 前景 | 旗、地毯近沿、乐器角近景、靠近镜头的物件 | 是 | 8 px |
| L4 光效（可选） | 灯晕、体积光、尘埃 | 是 | 8 px |

**阴影归属**：所有阴影必须在 L1 里（L1 渲染时把 L2/L3 的物体设为 shadow catcher 参与投影）；L2/L3 用透明胶片、不再重复投阴影。否则层一动，阴影就跟着错位。

**透明边缘**：每层 alpha 做 2–3 px 膨胀（matte 修复），防止视差时露出黑边/白边。

### 5.4 输出与命名

```text
_blender/base-3840.png          # 母版：只留本地工作目录，不进仓库
assets/base-3200.avif / 1920.avif / 1920.webp / 1920.jpg
assets/layer-01-wall-1920.avif  / .webp
assets/layer-02-mid-1920.avif   / .webp
assets/layer-03-front-1920.avif / .webp
assets/layer-04-glow-1920.avif  / .webp   # 可选
```

> 底图提供两档；**分层只保留 1920 一档**（视差层略软肉眼不可见），省体积也省内存。LQIP 内联进 `scene-data.js`，不单独产出文件。

- 版本化：资源路径带 `?v=YYYYMMDD`（与 `scene-data.version` 同串）。需要整版回滚时，把旧版文件改名为 `*.bak-YYYYMMDD` 保留一份，不要建平行目录（会与扁平路径约定打架）。
- 缓存：站内已用 `?v=` 惯例（如日历页）；改图 = 改版本串，一处漏改就会新旧混搭。

### 5.5 体积预算

| 项 | 目标 | 硬顶 |
|---|---|---|
| 底图 3200 AVIF | 450–650 KB | 800 KB |
| 三层合计（AVIF 1920） | 600–900 KB | 1.0 MB |
| 首屏图片总计（AVIF 或 WebP 择一，不同时加载） | ≤ 1.6 MB | 2.2 MB |
| `html/hall/` 全部资产 | ≤ 6 MB | 10 MB |
| 页面 CSS+JS（不含 scene-data） | ≤ 30 KB | 50 KB |

**不要上 Git LFS**：LFS 指针文件在 Actions 构建产物里不会被展开成真实文件，发布后所有二进制资源都会坏。单文件必须 < 100 MB，但本项目目标是全部 ≤ 6 MB。上传前先看 §10 的站点体积问题。

### 5.6 素材预处理与工程文件位置

- **仓库只收成片**：`.blend`、bpy 脚本、3840 母版 PNG、扫描件中间产物一律放**仓库根的 `_blender/`**（相对仓库根，不写绝对路径；该目录加进 `.gitignore`，不提交）。Actions 发布会把 `html/*` 拍平复制，`_blender/` 不在发布清单里，天然不会上线。仓库里的 `html/hall/assets/` 只放已压缩的发布版。
- **现成扫描件 → 贴图**（一次性，手工，不进 CI）：从 `assets/posters/` 挑件 → 裁白边 / 透视矫正（GIMP 透视裁剪或 ImageMagick `-distort Perspective`；V01 有纸边与轻微旋转，V02 多数已满版）→ 缩到 **1024 长边** → 存 PNG 到 `_blender/src/<id>_1024.png`（id 与 hotspot id 一致，便于对账）→ 在 Blender 里当画布贴图。**不要**让页面或 Blender 直接引用 `assets/posters` 原图（单张最大 9 MB）。
- **可复用的现成原型**：导师像用 `images/masters/*.jpg`（1080²，够用）；世界地图用 `assets/posters/V02-第二辑/165_1971_世界地图_佚名.jpg`（2762×2000）；`assets/soviet-posters/`（实测中位约 720×916）只适合做远处小海报。
- **必须新做**：挂历版式、《真理报》版面、徽章、家具与乐器、大理石/木纹/丝绒材质。
- **Blender 脚本交付物**（放 `_blender/export_hotspots.py`）：遍历 `HOT_` 前缀物件 → `world_to_camera_view` 投影包围盒 8 角点 → 输出 JSON 片段（**y 需翻转**：`y_css = 1 - y`）→ 手工合并进 `scene-data.js`。约定：`HOT_<hotspotId>` 命名一一对应；脚本只覆盖 `rect`，不动人工字段；人工微调写进 `rectTweak`（脚本忽略该字段）。

### 5.7 禁令

1. 可变文字（日期、语录、更新条目）**不许烘焙**，只出"空白版式 + 纸纹底"。
2. 不用 3D 文字物体承载说明性文字（字体一致性和修改成本都不可控）。
3. 不在 Blender 里做 emoji、图标、UI 元素。
4. 不用实时灯光/阴影/反射探针——这是烘焙，不是游戏场景。

---

## 6. 前端实现规范

### 6.1 依赖边界

展厅页**只加载**：

```html
<link rel="stylesheet" href="hall.css">
<script src="scene-data.js"></script>
<script src="hall.js"></script>
```

不加载：`css/style.css`、`js/main.js`、`js/site-data.js`、`js/shutter.js`、`js/cursor.js`、`js/darkmode.js`。

- 颜色：**不复制** `css/color-tokens.css` 的纸色（它不是场景色）。在 `hall.css` 顶部新建 `--hall-*` 场景色板（§2.3 的 8 组），只复用品牌 token 里的 `--color-brand-red: #c41e3a`（用于标签文字/active）；注释注明"场景色板与品牌色的关系"。
- 光标：不引 `cursor.js`（它会给 `body` 设 `cursor:none` 并注入红五星光标，在展厅里是干扰）；展厅用系统光标 + hover 时 `cursor: pointer`。
- 若将来要接搜索，再单独懒加载（见 §6.9），并接受"展厅没有 `QMLMState`"这一前提。

### 6.2 DOM 结构

**原则：8 个热区和展签条链接写在 HTML 里（真实 `<a href>`、带 `aria-label`），JS 只做两件事——从 `scene-data.js` 读取 `rect` 写进 `style`、以及交互状态。**禁止用 JS 生成热区/链接（SEO 与无 JS 可用性），也禁止把坐标写死进 HTML（改构图就得改 HTML）。

```html
<main class="hall" id="hall" aria-label="展厅">
  <div class="hall-stage" id="hallStage">        <!-- aspect-ratio 容器，热区坐标系原点 -->
    <picture>
      <source type="image/avif" srcset="assets/base-3200.avif 2x, assets/base-1920.avif 1x">
      <source type="image/webp" srcset="assets/base-1920.webp">
      <img class="hall-layer" id="base" src="assets/base-1920.jpg"
           alt="" fetchpriority="high" decoding="sync">
    </picture>
    <img class="hall-layer layer-2" src="assets/layer-02-mid-1920.avif" alt="" decoding="async">
    <img class="hall-layer layer-3" src="assets/layer-03-front-1920.avif" alt="" decoding="async">

    <!-- 热区：DOM 写死，坐标由 hall.js 从 scene-data.js 注入 -->
    <a class="hotspot" href="../masters/masters.html" data-hotspot="portraits"
       aria-label="革命导师：五位导师的著作">
      <span class="hotspot-label">革命导师</span>
    </a>
    <!-- ... 其余 7 个，DOM 顺序 = 视觉顺序（左→右、上→下） -->

    <!-- 动态文字层 -->
    <span class="dyn dyn-calendar" data-dyn="calendar-date"></span>
    <span class="dyn dyn-headline" data-dyn="quote-headline"></span>

    <div class="hall-vignette" aria-hidden="true"></div>
    <img class="hall-grain" src="assets/grain.png" alt="" aria-hidden="true">
  </div>

  <div class="hall-brand"><span>青年马列毛主义驿站</span></div>
  <button class="hall-index-btn" id="indexBtn" aria-expanded="false" aria-controls="indexDock">索引</button>

  <nav class="hall-dock" id="indexDock" aria-label="站点索引" hidden>
    <!-- §3.4 的 12 条真实链接，写在 HTML 里 -->
  </nav>
  <div class="hall-toast" id="hallToast" role="status">点击任意物件进入</div>
</main>
```

`<picture>` 是必须的：AVIF 在旧内核（360/QQ/微信浏览器、Safari < 16）不认，没有回退就是白屏。WebP 兜底，JPEG 最终兜底；三档择一加载，不叠加体积。

### 6.3 热区坐标规范

- 坐标系：`#hallStage` 用 `aspect-ratio: 16 / 9` 锁定；热区用 `left/top/width/height` 百分比，由 `hall.js` 从 `scene-data.js` 的 `rect` 写入 `style`。**不用 `<map>/<area>`**：理由不是"不随缩放"（现代浏览器会随 `<img>` 渲染尺寸缩放），而是 `<area>` 无法做 focus 环、描边、标签与 `aria` 状态，维护性差。
- 不规则形状用 `clip-path: polygon(...)`（画像、地图、乐器角适合；矩形热区在斜视角下会互相压住）。
- **自动生成坐标**：Blender 里所有可点物件以 `HOT_` 前缀命名并放进独立 collection；bpy 脚本遍历每个 `HOT_` 物体，把包围盒 8 个角点用 `world_to_camera_view` 投影到 [0,1]，取 min/max 得百分比矩形。**注意 y 轴翻转**：`world_to_camera_view` 以左下为原点，CSS 以左上为原点，写入前 `y_css = 1 - y`；并按 16:9 渲染边界做等比换算。改构图后重跑脚本 → 只改 `rect`，前端零改动。
- 想更准（不规则轮廓）：为每个 `HOT_` 渲染一张纯色 ID 图（同一相机），提取轮廓并简化为 12–20 点多边形，写进 `polygon`。P2 再做。
- 最小可点尺寸：WCAG 2.2 AA 要求 **24×24 CSS px**（2.5.8），本项目取 AAA 的 **44×44**（2.5.5）；小物件用透明 `::after` 扩边到 44。

### 6.4 交互状态

| 状态 | 表现 | 时长/曲线 |
|---|---|---|
| idle | 无 UI；1.5 s 后开始极轻的呼吸（可选） | — |
| hover | 金色 1px 描边（`box-shadow` 内描边）+ 标签浮出（米白纸签 + 深红小字）+ 该热区对应层微微提亮 2% | 180 ms，`cubic-bezier(.2,.7,.3,1)` |
| focus-visible | 同 hover，且描边更粗（2px） | 立即 |
| active | 描边加深 + 整体 1.02 推近 | 180 ms |
| navigating | 画面 1.04 推近 + 黑场 220 ms → 跳转 | 420 ms |

- 跳转用"推近 + 切黑"，不做花哨转场；`prefers-reduced-motion` 下直接跳。
- 返回时靠浏览器 bfcache 恢复，**不要在 `pageshow` 里重播入场动画**（用 `event.persisted` 判断）。
- 首次访问引导：进入 1.2 s 后，8 个热区描边**依次**亮起一遍（每个 120 ms），同时底部出现一行"点击任意物件进入"，4 s 后淡出，写 `localStorage['qmlm:hall:hinted'] = '1'`，之后不再出现。整段引导约 5.6 s，`prefers-reduced-motion` 下只显示静态提示 2 s。

### 6.5 加载时序（LCP 就是底图）

1. HTML 里 `preload` 底图（`<link rel="preload" as="image" imagesrcset=...>`），`<picture>` 内的 `<img>` 加 `fetchpriority="high"`。
2. 立即显示 `scene-data.js` 里内联的 32px 模糊底图（base64），撑住首屏，0 CLS。
3. 底图 `onload` → 600 ms 淡入，同时暗角从 0 收拢到目标值（"灯亮起来"的感觉）。
4. 层 2/3 `decode()` 完成后 200 ms 淡入叠加。
5. `scene-data.js` 已在 HTML 里同步加载（文件很小），热区在第 3 步后即可交互。
6. 全程没有 spinner；若 3 s 仍未拿到底图，显示一行小字"正在布置展厅…"。

**首屏请求时序（关键路径 / 可延后）**

| 时机 | 请求 | 说明 |
|---|---|---|
| 关键 | `hall.html`、`hall.css`、`scene-data.js`、`hall.js` | 无阻塞第三方 |
| 关键 | 底图（avif/webp/jpg 择一） | LCP 元素 |
| 关键 | `layer-02-mid`、`layer-03-front` | 可 `decoding="async"`，不阻塞首帧 |
| 延后 | `data/history-events.js`（120 KB）、`data/updates.json`（3.9 KB） | 首帧后再取，只填三处动态文字 |
| P2 | `js/site-data.js`（2 MB）、`js/search.js` | 首次打开搜索时才取 |

即首屏关键请求 8 个，总量 ≤ 9 张图 + 4 个文件；动态数据不计入 LCP 关键路径。

### 6.6 视差

- 鼠标位置归一化到 [-1, 1]，各层 `translate3d(-x*k, -y*k, 0)`，k = 4/6/8 px（L1/L2/L3）。
- 只改 `transform`，rAF 节流，`will-change: transform`。
- 触屏、`prefers-reduced-motion: reduce`、窗口宽 < 1180 时关闭。
- **热区层不参与位移**（位移 ≤8 px，误差可接受）；若要严丝合缝，热区跟随 L2 的系数 0.6。

### 6.7 悬停反馈的硬约束（必须提前接受）

分层图方案下，**单个物件无法移动、无法重新打光**——它只是整张图里的像素。所以 hover 只能靠：

1. 覆盖描边 + 标签（默认方案，够用）。
2. **P2 解锁**：为每个热区额外渲染一张"该物件单独 + 高亮"的 RGBA 覆盖层（同机位、同构图、仅该物件亮度 +6% 或描金边），hover 时交叉淡入。8 张 × 40–80 KB WebP ≈ 0.5 MB，可接受。
3. **P2 备选**：把 8 个热区物件单独切出带 alpha 的贴片，hover 时整体上浮 1–2 px + 投影。这会让"静态图"变成"8 个可动的纸片"，效果最好，但要处理边缘与阴影，成本最高。

建议：P0 只做 1；P2 再看要不要 2。

### 6.8 动态文字

三处，全部 DOM 覆盖，坐标写进 `scene-data.js` 的 `dynamic[].anchor`（百分比 + 旋转角）：

| 物件 | 数据源 | 渲染 |
|---|---|---|
| 台历 | `data/history-events.js`（按今日月/日过滤，取 1 条）→ 但该文件 120 KB，**只在展厅页按需加载** | `{月} 月 {日} 日` + 事件标题（14–18px） |
| 报纸头条 | `js/daily-quote.js` 的语录数据（需抽成纯数据，不加载 DOM 逻辑） | 1 条语录（12–16px，可斜排） |
| 公告栏 | `data/updates.json`（3.9 KB，fetch 即可） | 最近 1 条标题 |

字体：系统衬线 `"Noto Serif SC", "STSong", "SimSun", serif`，不引 webfont（中文子集化另立任务）。文字颜色压进纸色，加 1px 纸纹阴影，避免"贴纸感"。

降级：三处动态文字都设 `min-height` 与右对齐占位（`（今日暂无记录）`、`（加载中）`），数据失败时不塌陷、不反弹 CLS；所有动态数据请求都带 `?v=`。

### 6.9 搜索

P0：放大镜 = 打开展签条（索引面板）。

P2：`js/search.js` **不能直接复用**——它依赖 `[data-search-input]`、`#searchResults` 这些导航 DOM 和 `QMLMState`，而展厅不引 `main.js`/`state-center.js`。若要做真实搜索，需要：① 在自己页面里放同构 DOM，② 或写 30 行轻量索引搜索（从 `site-data.js` 取标题/摘要做子串匹配），③ `pointerdown` 时才 `fetch('../../js/site-data.js')`（2 MB，gzip ≈ 230 KB）+ 给 loading 态。**不要**放进首屏。

### 6.10 无障碍与 SEO

- `<h1 class="sr-only">青年马列毛主义驿站 · 桌面展厅</h1>` + 一段 60–120 字的展厅简介（`sr-only`）+ 一个"跳到展签条"的 skip link。
- 8 个热区必须是真实 `<a href>`，带 `aria-label`，**DOM 顺序 = 视觉顺序**（左→右、上→下），保证 Tab 顺序与画面一致；canvas 不存在，所以不存在"像素不可读"的问题。
- 展签条内是 12 个模块的真实链接——**它同时是 SEO 的落地链接**，必须出现在 DOM 里（不要 JS 生成）。
- 展签条关闭时 `hidden` + `inert`（或 `tabindex="-1"` 全部后代），避免 Tab 到不可见链接；打开时焦点陷阱（Tab 循环在展签条内），Esc 关闭并把焦点还给"索引"按钮。
- `/` 快捷键：只在 `document.activeElement === body` 且无修饰键时生效（避免和浏览器"快速查找"抢）。
- `prefers-reduced-motion` 关闭视差/引导/过渡；`prefers-contrast` 提高描边对比。
- `<noscript>`：一段说明 + 8 个链接的纯列表 + 经典首页入口。
- OG 图：直接用 `base-1920.jpg`；`<title>` 与 `description` 写中文长尾词。
- 加一条 `rel="canonical"` 指向 `html/index.html` 或展厅自身（二选一，取决于阶段 B 是否上线）。

### 6.11 性能预算

| 指标 | 目标 |
|---|---|
| LCP | < 1.5 s（底图） |
| CLS | 0（`aspect-ratio` 锁死） |
| 首屏请求数 | ≤ 9（html/css/js ×2 + 底图 + 三层） |
| 首屏传输 | ≤ 1.6 MB |
| 主线程 | 无长任务 > 50 ms |
| 内存 | 解码后的图 ≤ 60 MB（约 47 MB，见下） |

> 内存口径：底图按 3200 加载（2x 屏），三层**始终按 1920 加载**（视差层略软肉眼不可见），解码后约 23 + 3×8 ≈ 47 MB，稳定在 60 MB 内。

### 6.12 部署

仓库里有 `.github/workflows/deploy.yml`（Actions 构建）：把 `html/*` **拍平**复制到 `_site/` 根，再带上 `css`、`js`、`images`、`assets`、`data` 五个目录，然后对所有 `.html/.css/.js` 做一次路径削减——把 `(../)+ (css|js|images|assets|data)/` 去掉一层 `../`。该 workflow 近期三次在 `Deploy to GitHub Pages` 步骤失败，线上实际生效的可能仍是"分支内置构建"（保留 `html/` 层级）。**两种布局下展厅的相对路径都成立**：

| 写法 | 仓库布局（分支构建） | 拍平布局（Actions） |
|---|---|---|
| `assets/base-1920.avif` | `/html/hall/assets/...` | `/hall/assets/...` |
| `../masters/masters.html` | `/html/masters/...` | `/masters/...` |
| `../../js/site-data.js` | `/js/...` | `/js/...`（被削减一层后仍正确） |

约定：

- 页面内引用 root 级资源（js/css/data）写 `../../`，模块页写 `../`；`html/hall/assets/` 内写 `assets/...`（不含 `../`，不会触发削减）。
- `.avif` / `.webp` 的 MIME 由 Pages 正常给出；`.glb/.ktx2` 不在本方案内。
- 缓存：靠 `?v=` 破（Pages 不支持自定义 headers，也不要用 `immutable`）；改图/改数据时 `hall.css`、`hall.js`、`scene-data.js` 与 `scene-data.js` 内部所有 URL 同步升版本。
- 不使用 Git LFS；单文件 < 100 MB。
- 不需要 `.nojekyll`（Actions 构建）；`_blender/` 不进仓库；`_tools/` 是既存目录，别动。
- **上线验收必须在真实 URL 上做**：8 个热区 + 12 条展签全部点一遍、0 个 404；用 `curl -I` 确认 avif 的 `content-type`。本地 `python -m http.server` 只能验证仓库布局。

---

## 7. 数据规范：`scene-data.js`

用 JS 全局而不是 JSON：省一次请求，且 `file://` 打开也能看到画面（注意：数据层 `fetch` 在 `file://` 下会被拦，只有画面与静态热区可用，数据层需用 `http` 预览）。

```js
window.HALL_SCENE = {
  version: '20261101',                // 与 ?v= 同串，改图必改
  design: { w: 3840, h: 2160 },       // 母版像素，热区百分比以此为准
  base: {
    avif3200: 'assets/base-3200.avif?v=20261101',
    avif1920: 'assets/base-1920.avif?v=20261101',
    webp1920: 'assets/base-1920.webp?v=20261101',
    jpg1920:  'assets/base-1920.jpg?v=20261101',
    lqip: 'data:image/jpeg;base64,...'   // 32px 模糊图，内联
  },
  layers: [
    { id: 'wall',  src: 'assets/layer-01-wall-1920.avif?v=20261101',  factor: 4 },
    { id: 'mid',   src: 'assets/layer-02-mid-1920.avif?v=20261101',   factor: 6 },
    { id: 'front', src: 'assets/layer-03-front-1920.avif?v=20261101', factor: 8 }
  ],
  hotspots: [
    {
      id: 'portraits', label: '革命导师', hint: '五位导师的著作',
      href: '../masters/masters.html',
      shape: 'rect',                          // rect | polygon
      rect: [6.2, 14.0, 24.0, 26.0],          // [x, y, w, h] 百分比（脚本生成）
      rectTweak: null,                         // 人工微调 [dx, dy, dw, dh]，脚本不覆盖
      polygon: null,
      hover: 'hover-portraits.webp',           // P2 高亮覆盖层，可为 null
      layer: 'mid',                            // 决定 hover 时的高亮层
      aria: '革命导师：马克思、恩格斯、列宁、斯大林、毛泽东的著作入口',
      priority: 1
    }
    // ... H2–H8
  ],
  dynamic: [
    { id: 'calendar-date', anchor: [42.6, 58.4], font: 'serif', size: 15, rotate: 0, maxWidth: 9 },
    { id: 'quote-headline', anchor: [70.2, 40.1], font: 'serif', size: 13, rotate: 0, maxWidth: 12 }
  ],
  hint: { delay: 1200, stagger: 120, ttl: 4000, storageKey: 'qmlm:hall:hinted' }
};
```

字段约定：

- 所有坐标都是**相对 `design` 的百分比**（0–100），与容器实际像素无关。
- `rect` 由 `_blender/export_hotspots.py` 生成（y 已翻转），**不手改**；人工微调只写 `rectTweak`，脚本重跑不覆盖它。
- `HTML` 里 8 个 `<a data-hotspot="...">` 的 `data-hotspot` 必须与这里 `id` 一一对应；缺一个 → 控制台报错并跳过，不静默。
- `href` 用相对 `html/hall/` 的路径（模块页 `../<module>/...`，站内资源 `assets/...`）。
- `version` 与所有 `?v=` 同串；改图 = 升版本，`hall.html` 里三个 `<script/link>` 也要同步升。

---

## 8. 里程碑

### P-1 · 上线前置条件（必须先做，与美术无关）

- [ ] **站点体积治理**：`assets/` 实占 1.19 GB、861 个文件（单张最大 9.2 MB），而 GitHub Pages 已发布站点上限 1 GB。当前属宽限状态。**不先处理，展厅做得再好也上不了线**：把 `assets/posters` 从发布产物剔除、或迁到对象存储/外链。
- [ ] 确认线上发布模式（Actions 拍平 vs 分支构建），在真实 URL 上核对 §6.12 的三条路径。
- [ ] 决定阶段 A/B（见 §11 第 1 条）。

### P0 · 美术定稿（3–5 天）

- [ ] 场景搭建 + 相机冻结（填 §5.1 相机表）。
- [ ] 出 1 张 3840×2160 成片（含材质与光照定稿），确认"够重、够静、够贵"。
- [ ] 试切 L1/L2/L3 三层，验证无缝、阴影归属正确；L4 光效层可选，若做则同验。
- [ ] 8 个热区位置初标，确认互不重叠、都在安全区内。
- **验收**：打印/大屏看 3 分钟不腻；任意两处放大看材质没有"塑料感"；三层叠回去与原图肉眼无差。

### P1 · 页面骨架（3–5 天）

- [ ] `html/hall/` 目录与自包含资源；`hall.html` + `hall.css` + `hall.js` + `scene-data.js`。
- [ ] 底图（`<picture>` 三档回退）+ 三层 + 内联 LQIP + 淡入时序；视差；hover/焦点/过渡。
- [ ] 8 个热区全部指向真实页面（顺手修掉 `html/index.html` 现存的 8 处失效 href / 7 个目标：5 条导师链接、留言板、更新日志详情 ×2）。
- [ ] 展签条 + 索引按钮 + 首次引导。
- [ ] `html/index.html` 加"进入展厅"入口（阶段 A）。
- **验收**：四档分辨率构图不崩；Tab 可遍历；`prefers-reduced-motion` 下正常；Lighthouse 性能 ≥ 95，无障碍 ≥ 95。

### P2 · 内容与打磨（3–5 天）

- [ ] 三处动态文字接真实数据；报纸语录数据抽成纯数据模块；补加载失败的占位文案。
- [ ] 8 张 hover 高亮覆盖层（§6.7 方案 2）——**可选**。
- [ ] 搜索懒加载（可选，需按 §6.9 改适配层）。
- [ ] 夜景第二版（台灯开关）——**可选，单独评估**。
- [ ] 音频（点灯/翻页的环境音）——**可选，默认静音**。
- **验收**：动态文字不溢出、不糊、失败有占位；hover 无闪烁；返回不重播动画。

### P3 · 上线与分流（2–3 天）

- [ ] 阶段 B 自动分流（可选）+ "经典版"永久开关。
- [ ] OG 图、title/description、noscript、sitemap 更新。
- [ ] 体积复核（`html/hall/` ≤ 6 MB）、`?v=` 全量一致（建议写个 `_tools/check_hall_assets.py` 校验文件存在与版本串一致）。
- [ ] **真实 URL 实测**：8 热区 + 12 条展签 0 个 404；avif/webp/jpg 回退可用；移动端访问经典首页无变化。
- [ ] `doc/pages/home/README.md` 更新；提交（不推）。
- **回滚清单（按顺序）**：① 删 `html/index.html` 的分流脚本 3 行（阶段 B）；② 删入口条 + `css/home/index.css` 新增小节（阶段 A）；③ `html/hall/` 整个目录可保留（无外部依赖，不加载就不生效）；④ 恢复缓存版本串。展厅页不依赖任何公共脚本，回滚无残留。

---

## 9. 质量门（DoD）

**视觉**：四档分辨率无裁切关键物件；暗角不压死画面；材质无塑料感；文字无锯齿/贴纸感。

**交互**：8 个热区 hover/focus/active 一致；无死热区；标签文案不超过 12 字；点击 → 跳转 < 500 ms；返回不重播。

**技术**：LCP < 1.5 s；CLS = 0；首屏 ≤ 1.6 MB；无 console 错误；`prefers-reduced-motion` 生效；无 404；`?v=` 全量一致；AVIF/WebP/JPEG 三档回退可用。

**上线**：真实 URL 上 8 热区 + 12 展签全部可达；移动端经典首页行为不变。

**可达性**：Tab 顺序 = 视觉顺序；焦点可见；展签条 Esc 可关、关闭后不可 Tab 进入；`aria-expanded` 正确；noscript 有出口。

**可维护**：改图只改 `assets/` + `scene-data.js`；改文案只改 DOM/数据，不进 Blender；`version` 一致。

---

## 10. 风险登记

| 风险 | 影响 | 对策 |
|---|---|---|
| **站点体积已超 Pages 上限** | **阻断上线** | 列为 P-1 前置条件：剔除/外迁 `assets/posters`（1.19 GB），否则不进入 P3 |
| 分层接缝/光晕 | 视差时露边 | 分层渲染而非抠像；alpha 膨胀 2–3 px；层间共用同一光照 |
| 阴影错层 | 物件一动阴影就飘 | 阴影全烘进 L1（shadow catcher） |
| 画面"重"变成"乱" | 目标达成度下降 | 热区 ≤8；无浮层 UI；文字 ≤3 处；四角压暗 |
| 中文字在烘焙图上糊 | 质感崩 | 一律 DOM 覆盖；纸面只出底纹 |
| 热区找不到/点不中 | 可用性差 | 44 px 下限；hover 标签；首次引导逐一亮起 |
| 误跑 `_tools/fix_html_paths.py` | 展厅相对路径全被改写 → 全站 404 | §3.1 已写禁令；修脚本前先排除 `html/hall/` |
| 发布模式不确定（Actions 拍平 / 分支） | 本地通、线上 404 | §6.12 相对路径两种布局都成立；P3 真实 URL 实测 |
| 无构建流程 | 手工易错 | `scene-data.js` 单一数据源；`?v=` 同步；建议加 `_tools/check_hall_assets.py` |
| 维护成本失控 | 文案一改要重开 Blender | 可变内容全部 DOM/JSON；贴图只做版式 |

---

## 11. 待定事项（需要后续拍板）

1. **分流策略**：停在阶段 A（手动入口）还是做阶段 B（自动跳转）？建议 P1 先 A，P2 再评估。
2. **导航形态**：是否接受"无顶栏 + 展签条"？替代方案是保留极简顶栏（只留站名 + 索引）。
3. **夜景第二版**：第二套烘焙成本约 +20% 出图时间，值不值得在 P2 做。
4. **hover 高亮覆盖层**（8 张 WebP）：是否值得 0.5 MB。
5. **环境音**：展厅要不要有极轻的环境音（默认静音，首次交互后可选开启）。
6. **旧首页债务**：`js/site-data.js` 2 MB、首屏 5 张导师图 1.7 MB、随机文艺图 4–15 MB、开屏白等 3.4 s——是否顺手一起修（建议修，否则"轻盈"只在新页面成立）。

---

## 12. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-11-01 | 初版：确定"视觉重、交互轻"；烘焙大图 + 三层 + DOM 热区；桌面特供；静态场景；8 个热区映射；P0–P3 里程碑。 |
| 2026-11-01 | 审校修订：修正 `rectify/` 死链与分层命名；补齐 `<picture>` 回退、`world_to_camera_view` 的 y 翻转、WCAG 24/44 px；明确"热区 DOM 写死 + JS 只注入坐标"；相机几何改为 19.4 m / 仰视 7°；部署章节按实际 `deploy.yml` 重写；站点体积升为 P-1 前置条件；补展签条 12 条清单、回滚清单、失败占位与无障碍细节。 |
