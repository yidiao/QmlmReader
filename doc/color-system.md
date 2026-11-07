# QmlmReader 色彩维护与推进规范

> 本文用于统一维护项目色彩。权威实现文件优先级：`css/color-tokens.css`（原子颜色）→ `css/theme-colors.css`（语义主题）→ `css/module-colors.css` / `css/master-colors.css`（页面与导师主题）→ `css/category-theme.css`（六大文章分类）→ 常规组件 CSS。若代码与本文冲突，以代码为当前事实，以本文为后续收敛目标，修改后同步更新本文。
>
> 本项目采用纯 CSS 颜色调度，不新增 JS 颜色管理器：页面通过 `body.dark-mode`、`body[data-module]`、`body[data-master]` 和既有 `data-category` 属性选择主题。特色 experimental CSS 本轮不接入新的全局替换，以保护其独立视觉。

---

## 1. 总体色彩路线

QmlmReader 的主视觉应保持“红黑金 + 米白纸张 + 低饱和分类色”的统一气质：

| 角色 | 推荐色 | 用途 | 注意 |
|---|---:|---|---|
| 革命红 / 主行动色 | `#c41e3a` | 顶部导航、主按钮、重点标题、强调边 | 避免整页大面积纯红，宜配米白或深色压住亮度 |
| 深红 / 权威底色 | `#8b0000` | 导航渐变、页脚、深色红块、按钮 hover | 与亮红形成层级，不替代正文文字 |
| 金色 / 荣誉强调 | `#ffd700` | 星形、徽章、重点状态、暗色模式高亮 | 只作点缀；大面积会刺眼 |
| 墨黑 | `#1a1a1a` | 构成主义阴影、重边框、深色面 | 不建议用于大段浅色模式正文，正文可用 `#2b2b2b/#333` |
| 护眼米白纸张 | `#f7f2e7` | 文章内容、卡片、输入框、正文背景 | 本文建议新增为白日模式基础纸色，替代过多 `#fff` |
| 温暖浅底 | `#f5f0e8` / `#e8e4dc` | 工具页背景、纸张层次 | 与 `#f7f2e7` 配合形成纸面层级 |

### 1.1 颜色管理文件与职责

| 文件 | 职责 | 使用规则 |
|---|---|---|
| `css/color-tokens.css` | 品牌色、护眼纸色、灰阶、状态色、阴影原子值 | 只维护基础色值 |
| `css/theme-colors.css` | `--app-*` 语义映射与明暗模式切换 | 常规组件优先使用 `--app-*` |
| `css/module-colors.css` | `body[data-module]` 页面模块强调色 | 新常规页面可设置 `data-module` |
| `css/master-colors.css` | `body[data-master]` 导师主题色；另含 `--master-theme-*` 主页主题色族（供 `css/masters/masters-common.css` 取色） | 导师色不替代文章分类色 |
| `css/category-theme.css` | 六大文章分类色 | 通过 `data-category` 使用 |

`css/style.css` 已通过顶部 `@import` 接入上述颜色管理文件；现有旧变量保留为兼容别名。新增常规页面应优先引入 `style.css`，不必重复引入令牌文件。

### 1.2 全站基础令牌（已由 `css/color-tokens.css` 实现）

> 2026-11-06 审计更正：早期文档提议的 `--color-ink/--color-paper/--color-surface` 等命名从未落地，实际实现为 `--paper-*` / `--gray-*` 命名。以下面的真实令牌为准；`--color-ink`、`--dark-*` 等旧名视为废弃提案，不要再引用。

```css
:root {
  /* 品牌色 */
  --color-brand-red: #c41e3a;
  --color-brand-red-dark: #8b0000;
  --color-brand-gold: #ffd700;

  /* 护眼纸色四层 + 边框（注意：#f7f2e7 是区块层，页面底是 #f3eadc） */
  --paper-page: #f3eadc;
  --paper-section: #f7f2e7;
  --paper-card: #fffaf0;
  --paper-card-strong: #fffdf7;
  --paper-muted: #e8e4dc;
  --paper-border: #ded2bd;

  /* 中性灰阶 --gray-950…050 与暗色灰阶 --gray-dark-*（见 §6、§8） */
}
```

排版令牌（`--font-sans/--font-serif/--font-kai`）与 z-index 阶梯（`--z-*`）也已进入该文件，规则见 `doc/design-tokens.md` §3/§5。

---

## 2. 护眼米色方案：替换白日模式刺眼亮白

第二项任务结论：推荐把白日模式的大面积 `#fff` 从“屏幕白”改为“纸张米白”。

### 2.1 主推荐

| 名称 | 色值 | 用途 |
|---|---:|---|
| 页面底纸 / Page Paper | `#f3eadc` | body、整页背景、最底层，略深，承托所有内容 |
| 区块纸色 / Section Paper | `#f7f2e7` | 大容器、搜索区、Tab 导航、章节内容区 |
| 卡片纸色 / Card Paper | `#fffaf0` | 普通卡片、正文卡片、工具面板 |
| 强卡片纸 / Strong Card Paper | `#fffdf7` | 弹窗、输入框、搜索结果、最上层浮层 |
| 压低纸色 / Muted Paper | `#e8e4dc` | 引用块、骨架屏、弱背景、二级底纹 |
| 暖边框 | `#ded2bd` | 卡片边框、分割线、输入框边 |
| 暖阴影 | `rgba(78, 45, 20, 0.10)` | 白日模式阴影，避免冷灰脏感 |

### 2.2 替换原则

1. `body` 页面底色优先用 `--paper-page: #f3eadc`，不要用纯 `#fff` 或冷灰 `#f5f5f5`。
2. 大区块/容器用 `--paper-section: #f7f2e7`，普通卡片用 `--paper-card: #fffaf0`，避免背景、容器和卡片混成一层。
3. 输入框、弹窗、搜索结果等最上层浮面用 `--paper-card-strong: #fffdf7`，边框用 `#ded2bd`。
4. 对展示图片/海报的容器可保留偏白底，但建议用 `#fffdf7` 而不是 `#ffffff`。
5. 暗色模式不受护眼米色替换影响，应继续用深灰/深蓝灰体系。

---

## 3. 六大文章分类主题色

当前已由 `css/category-theme.css` 统一维护，`js/category-theme.js` 提供分类 key 和 DOM 接口。文章索引、文章详情、`puzzle.html`、文章详情页中的 puzzle/联结卡都应只保存分类 key，不在页面内硬编码色值。

| 分类 | key | primary | secondary | dark | soft | ink | 语义 |
|---|---|---:|---:|---:|---:|---:|---|
| 哲学基础 | `philosophy` | `#8b1e2d` | `#b33a45` | `#5a101b` | `#f3dfe1` | `#651522` | 理论根基、辩证法、认识论；深红但不同于全站主红 |
| 政治经济学 | `economics` | `#a85f16` | `#c9822b` | `#703b0b` | `#f5e7d1` | `#70400d` | 铜赭、生产、历史感、物质分析 |
| 政治理论 | `politics` | `#68436f` | `#8b638f` | `#452c4b` | `#e9e0eb` | `#503457` | 桑紫，避免亮紫和靛蓝 |
| 党的建设 | `party` | `#66703a` | `#879153` | `#414822` | `#e8ebdc` | `#414a25` | 橄榄绿，组织、纪律、建设 |
| 军事战略 | `military` | `#2e7180` | `#4b95a1` | `#1e4d58` | `#dcecef` | `#205866` | 铁青湖蓝，冷静、克制、战略分析 |
| 思想文化 | `culture` | `#aa791c` | `#c49a3a` | `#72500d` | `#f4ead0` | `#6d4d0d` | 赭黄，文化与文艺，不与党建绿混淆 |

### 3.1 使用边界

- 标签：背景用 `soft`，文字用 `ink`，边框用 `primary` 的透明混合。
- 详情页大头图：使用 `linear-gradient(135deg, dark, primary 55%, secondary)`。
- puzzle 节点：核心/当前节点可用 `primary`，关联线/次级节点用 `secondary/soft`。
- 暗色模式标签：当前实现用 `primary` 与 `#171717` 混合，文字 `#fff8e8`。后续可补充每类暗色 `surface`，但不要临时在页面计算。

---

## 4. 导师模块与导师之间的色彩搭配

`html/masters` 当前文档要求“红黑金构成主义卡片风格”。导师色彩会与文章分类色交叉使用：导师色用于人物、关系网、导师页；分类色用于文章类型和拼图语义。两者同时出现时，导师色作为外框/人物节点，分类色作为文章标签/关系类别。

| 导师 | 建议主色 | 辅色 | 背景/纸色 | 性格化说明 |
|---|---:|---:|---:|---|
| 马克思 | `#8b1e2d` | `#1a1a1a` / `#c49a3a` | `#f7f2e7` | 深红、黑、暗金；理论根基和批判锋芒 |
| 恩格斯 | `#2e7180` | `#8b1e2d` | `#f5f0e8` | 铁青蓝配深红；条理、军事与自然科学气质 |
| 列宁 | `#b91c1c` | `#111827` / `#d9a000` | `#f7f2e7` | 高对比红黑金；组织、路线、行动速度 |
| 斯大林 | `#7f1d1d` | `#4b5563` / `#c9a84c` | `#f1eadc` | 深绛红、钢灰、旧金；建设、工业化、战争年代的厚重感 |
| 毛泽东 | `#c41e3a` | `#d9a000` / `#3d6b4f` | `#f7f2e7` | 红、金、山河绿；群众路线、诗词、实践感 |

### 4.1 斯大林令牌（已实现）

> 2026-11-06 审计更正：斯大林色已按统一的 `body[data-master]` 覆盖式结构落地在 `css/master-colors.css`（不是独立 `--master-stalin-*` 命名），暗色五值与下表一致。取色一律通过 `--master-*` 变量。

```css
/* 实际实现：css/master-colors.css 内 body[data-master="stalin"] 覆盖统一变量 */
body[data-master="stalin"] {
  --master-primary: #7f1d1d;   /* 深绛红：政治与战争年代 */
  --master-secondary: #4b5563; /* 钢灰：工业化、组织、档案感 */
  --master-accent: #c9a84c;    /* 旧金：奖章、时间节点、重点徽章 */
  --master-paper: #f1eadc;     /* 旧档案纸 */
  --master-ink: #252525;
}
body.dark-mode[data-master="stalin"] {
  --master-primary: #b33a45;
  --master-secondary: #8b96a6;
  --master-accent: #d7b65a;
  --master-paper: #24211b;
  --master-ink: #ece4d4;
}
```

建议组件：

1. **斯大林小传**：旧档案纸 `#f1eadc` 背景，左侧深绛红时间线，时间年份用旧金。
2. **人物关系网**：
   - 斯大林中心节点：深绛红实心 + 旧金外环。
   - 同盟/合作关系：钢灰线 `#4b5563`。
   - 理论/组织影响：深红线。
   - 国际/国家关系：铁青蓝 `#2e7180`，避免与人物红混乱。
   - 冲突/争论关系：暗橙赭 `#a85f16`，不要用刺眼亮橙。
3. **卡片层级**：人物卡片用旧纸底；重要人物边框旧金；普通人物边框暖灰；悬停时仅加红色左边条。
4. **与六大分类交叉**：文章列表仍显示六大分类色，不改为斯大林人物色；人物页的大标题、关系网和人物徽章使用 Stalin 色。

---

## 5. 顶部导航跳转展览页的大标题风格

用户列举的页面：

- `html/articles/articles.html`
- `html/downloads/downloads.html`
- `html/experimental/experimental.html`
- `html/gallery/gallery.html`
- `html/international/international.html`
- `html/masters/masters.html`
- `html/toolkit/toolkit.html`

这些页面的大标题建议统一使用“模块主题色 + 米白卡片/渐变背景 + 暗色模式柔化色”。不要每页随机使用过亮色。

> 现状（2026-11-07，B5 完成）：七个门户页已挂 `data-module` + `module-title`（articles/downloads/experimental/gallery/rectify/toolkit/preferences）。真实消费方：puzzle（puzzle.css）与 international（international-calendar.css）经 `--module-accent` 取色；preferences 全量生效、各页暗色模式生效；多数门户 hero 为深底浅字设计，亮色文字色被各自 hero 规则压制（有意保留，见 `doc/PLAN.md` B5 备注）。

| 页面 | 主题色 | 辅色/渐变 | 大标题建议 | 暗色模式标题 |
|---|---:|---:|---|---:|
| 文章 articles | `#b91c1c` | `#7f1d1d` | 红色文字或红色渐变头图，配米白卡片 | `#ff7b7b` |
| 下载 downloads | `#a85f16` | `#c9822b` | 铜赭，表达资源、归档、导出 | `#e7a85b` |
| experimental | `#68436f` | `#c41e3a` | 桑紫/红的实验感，避免荧光色 | `#d4a8da` |
| gallery | `#aa791c` | `#c49a3a` | 赭黄、海报纸、文艺资源 | `#e1bd66` |
| international | `#2e7180` | `#8b1e2d` | 铁青蓝 + 深红，国际、地图、时间线 | `#7bc2cf` |
| masters | `#8b0000` | `#ffd700` / `#1a1a1a` | 红黑金构成主义，人物入口 | `#ff9a9a` / 金色点缀 |
| toolkit | `#66703a` | `#879153` | 橄榄绿，工具、方法、整理 | `#b9c47d` |

推荐统一组件令牌：

```css
.module-hero {
  background: var(--color-surface, #fffaf0);
  border: 1px solid var(--color-border-warm, #ded2bd);
}
.module-hero h1 {
  color: var(--module-accent, #c41e3a);
}
body.dark-mode .module-hero {
  background: rgba(18, 18, 24, 0.78);
  border-color: rgba(255,255,255,0.12);
}
body.dark-mode .module-hero h1 {
  color: var(--module-accent-dark, #ff7b7b);
}
```

---

## 6. 暗黑模式颜色切换原则

现状：`css/style.css` 的暗色基础为 `#1a1a1a` 背景、`#2a2a2a` 卡片、`#444` 边框；`articles-index.css` 已有深蓝灰页面底。暗色灰阶已落地为 `css/color-tokens.css` 的 `--gray-dark-*` 七档（2026-11-06 审计更正：早期提议的 `--dark-*` 命名未采用；`--dark-gold #ffd54f` 无对应实现，暗色金继续用品牌金/柔化红方案）：

| 令牌 | 色值 | 用途 |
|---|---:|---|
| `--gray-dark-bg` | `#171717` | 全站深色背景最低层 |
| `--gray-dark-section` | `#1f1f1f` | 页面区域、阅读背景 |
| `--gray-dark-surface` | `#2a2a2a` | 卡片、弹窗、章节内容 |
| `--gray-dark-raised` | `#333333` | 悬浮卡、输入区、hover |
| `--gray-dark-border` | `#444444` | 边框，不要低于 `#333` |
| `--gray-dark-text` | `#e0e0e0` | 正文 |
| `--gray-dark-muted` | `#aaaaaa` | 次要文字 |
| `--gray-dark-text-strong` | `#f0f0f0` | 提亮文字（标题/强调，2026-11-06 自 theme-colors 下沉） |
| `--gray-dark-text-faint` | `#777777` | 最弱文字/禁用态（同上） |

暗色阴影令牌 `--shadow-color-dark`（rgba(0,0,0,0.30)）/ `--shadow-color-dark-strong`（0.40）同样在原子层维护。工具页纸张风格暗色正文 `#ece4d4` 由各工具自有令牌维护（见 §9），不进全站原子层。

原则：

1. 暗色中不要使用纯黑 `#000` 作为大面积背景，除非是遮罩。
2. 暗色卡片边框不低于 `#333`，避免“糊成一块”；也不高于 `#555`，避免过亮线框。
3. 暗色红建议用 `#ff7b7b/#e57373/#b33a45` 等柔化红，不用大面积 `#ff0000`。
4. 暗色正文不要用纯白，使用 `#e0e0e0` 或暖白 `#ece4d4`。

---

## 7. 标签、徽章、状态色设计

### 7.1 分类标签

已实现：`.category-theme-tag`、`.article-category-tag`。规范：

- 背景：分类 `soft`。
- 文字：分类 `ink`。
- 边框：分类 `primary` 的 45% 混合。
- 暗色：背景用分类主色与深底混合，文字 `#fff8e8`。

### 7.2 普通标签 / 元信息 pill

| 类型 | 背景 | 文字 | 用途 |
|---|---:|---:|---|
| 普通元信息 | `rgba(0,0,0,0.05)` | `#67727e` | 年份、字数、状态说明 |
| 暗色普通元信息 | `rgba(255,255,255,0.08)` | `#b7c1ce` | 暗色卡片元信息 |
| 重点徽章 | `#c41e3a` → `#8b0000` | `#fff` | 优先级、当前选中、主状态 |
| 完成 / ready | `#e8f5e9` | `#2e7d32` | 可用、完成 |
| 进行中 / wip | `#fff3e0` | `#b45309` | 待完成、开发中 |
| 警告 | `#ffebee` | `#d32f2f` | 错误、危险操作 |

### 7.3 标签形态

- 分类/状态标签：圆角 `999px`，字号 `0.72rem ~ 0.85rem`。
- 构成主义工具标签：可使用直角、粗边框、硬阴影，但颜色仍应来自对应工具令牌。
- 不建议混用过多彩色标签：一个卡片内最多 1 个主色标签 + 2 个灰/浅色标签。

---

## 8. 灰色预设：避免过浅和过深

本轮已统计主要 CSS：灰色/灰阶相关值超过 600 次，其中 `#1a1a1a`、`#888`、`#999`、`#555`、`#444`、`#333`、`#666` 使用最集中。问题不是灰色数量多本身，而是同一灰色同时承担正文、边框、背景和暗色表面，导致有的区域偏黑、有的边框偏白，层级不稳定。

`css/style.css` 现在提供 `--gray-*` 与 `--gray-dark-*` 语义令牌。后续新代码应优先使用令牌；旧模块按用途逐步迁移，不要用全局机械替换破坏工具的硬阴影和印刷风格。本轮仅推进常规页面：`css/style.css`、`css/articles-detail.css`、`css/articles-index.css`；暂不处理 `css/marxist-style.css`、`css/qingma-style.css`、`css/xiaocezi-style.css`、`css/redify-style.css`、`css/yangbanxi-style.css` 等特色页面，防止破坏当前风格。

项目中已有 `#333/#555/#666/#888/#999/#aaa/#ccc/#ddd/#eee/#f5f5f5/#fafafa` 等大量灰。后续建议只使用以下灰阶：

| 名称 | 色值 | 用途 | 备注 |
|---|---:|---|---|
| Ink Strong | `#1a1a1a` | 构成主义边框、重阴影 | 不用于大段正文背景 |
| Text | `#333333` | 白日正文 | 比纯黑舒服 |
| Text Soft | `#555555` | 次级正文 | 仍保持可读 |
| Muted | `#666666` | 元信息、说明 | 常用次要文字 |
| Subtle | `#888888` | 更弱元信息 | 不要用于小字号长文 |
| Disabled | `#999999` | 禁用文字 | 禁用态可用 |
| Border Strong | `#cccccc` | 可见边框 | 比 `#ddd` 更清楚 |
| Border | `#dddddd` | 普通边框 | 可保留 |
| Border Soft | `#e8e8e8` | 暖色背景上的轻边 | 不要再浅 |
| Surface Gray | `#f5f5f5` | 灰底块 | 不用 `#fafafa` 作为唯一层级 |

禁用/谨慎：

- `#fdfdfd/#ffffff`：大面积刺眼，改用米白。
- `#f0f0f0` 以下浅灰若放在米白上，层级可能不清；应配边框。
- `#111/#000` 大面积使用会压抑，只用于遮罩、文字极重层或硬阴影。

---

## 9. experimental 子工具色彩标准化

`html/experimental` 下工具允许独立视觉，但必须保持母站导航、暗色模式、相对路径和基础可读性。下面记录每个工具的配色，避免后续遗忘。

### 9.1 马列体生成器 / `marxist-style`

当前 CSS 已明确：红、黑、米白、金；构成主义、粗粝、不对称、印刷质感。

| 令牌 | 当前值 | 用途 |
|---|---:|---|
| `--ms-red` | `#c41e3a` | 立场红、按钮、线条 |
| `--ms-red-deep` | `#8b0000` | 深红块 |
| `--ms-black` | `#1a1a1a` | 硬边、阴影、黑面 |
| `--ms-paper` | `#e8e4dc` | 纸张底 |
| `--ms-gold` | `#ffd700` | 金色斜块、强调 |

推进建议：输入框白底改成 `#fffdf7` 或 `#f7f2e7`，保持工具纸感，不用纯白。

### 9.2 青马小游戏 / `qingma`

当前是构成主义游戏界面：米白底、红主色、金状态、硬阴影。

| 令牌 | 当前值 | 用途 |
|---|---:|---|
| `--qm-bg` | `#f5f0e8` | 页面背景 |
| `--qm-text` | `#2c2c2c` | 正文 |
| `--qm-surface` | `#ffffff` | 卡片/选项，目前可替换为 `#fffaf0` |
| 红 | `#c41e3a` | 敌人、按钮、进度 |
| 金 | `#c9a84c` | 状态、道具、警告 |

推进建议：保留游戏硬边和无圆角，但将 `--qm-surface` 调为 `#fffaf0`，`--qm-surface-border` 保持 `#d0c8b8`。

### 9.3 小册子工具 / `xiaocezi`

已有两套风格：

1. **手作油印**：暖米白纸 `#f7f2e7`、朱红 `#d4380d`、墨黑 `#2b2b2b`、群青 `#2f54a0`、裁切线 `#b8a48a`。
2. **精致书刊**：应继续走更克制的书籍排版，可使用米白纸、深红标题、暖灰边框，不要过多彩色。

推进建议：油印风的 `--paper: #f7f2e7` 可作为全站护眼纸色来源之一。

### 9.4 赛博样板戏 / `yangbanxi`

当前主题是“革命文化 × 乡土戏台”：大红横幅、红布帷幕、木纹舞台、五角星、大字报。

| 令牌 | 当前值 | 用途 |
|---|---:|---|
| `--yb-bg` | `#e8e0cf` | 乡土纸/舞台外底 |
| `--yb-stage` | `#f5e8d0` | 舞台纸底 |
| `--yb-banner` | `#c41e3a` | 横幅红 |
| `--yb-curtain` | `#a01828` | 帷幕红 |
| `--yb-gold` | `#ffd700` | 星、标题 |
| `--yb-wood` | `#8b5a2b` | 木框 |
| `--yb-green` | `#4a6741` | 乡土绿、焦点边框 |

推进建议：这是“乡土农村风/戏台风”的标准配色，可作为 rural/stage 工具族参考。红与木色已经很强，界面状态提示不要再引入高饱和蓝紫。

### 9.5 万物皆可红 / `redify`

当前主题是“暗房冲印红调风”：安全灯红、深灰工作台、照片纸米白、取景框。

| 令牌 | 当前值 | 用途 |
|---|---:|---|
| `--rd-bg` | `#e8e4dc` | 工作台/纸底 |
| `--rd-panel` | `#ffffff` | 面板，目前建议改为 `#fffaf0` |
| `--rd-red` | `#c0392b` | 安全灯红、取景框 |
| `--rd-ink` | `#2a2a2c` | 正文 |
| `--rd-metal` | `#8a8a8e` | 金属灰/阴影 |
| `--rd-muted` | `#6a6a6e` | 次要文字 |

推进建议：这是“暗房/影像工具族”的标准，可保留金属灰，但浅色面板改为米白。

---

## 10. puzzle.html 与文章详情页的颜色交叉

### 10.1 全局 puzzle

- 泳道和图例：六大分类色。
- 节点：分类 `primary`；选中节点加 `secondary` 外环或亮边。
- 弹窗徽标：分类标签组件，不另设硬编码色。
- 关系线：默认暖灰 `#b8a48a`；强关联用分类 `secondary`；跨分类用两端渐变或中性钢灰 `#6b7280`。
- 注意修复文档中提到的疑似色值缺 `#`：如 `background: c0c1c3;`。

### 10.2 文章详情页 puzzle/联结卡

当前 `articles-detail.css` 中还有旧硬编码：

```css
.conn-card[data-category="philosophy"] { border-left-color: #8b0000; }
.conn-card[data-category="economics"] { border-left-color: #e65100; }
...
```

推进方向：改为使用 `category-theme.css` 的变量，避免和六大分类令牌偏离。建议结构：

```css
.conn-card[data-category] { border-left-color: var(--theme-primary, var(--cat-primary)); }
.conn-dir[data-direction="source"] { ... }
```

---

## 11. 后续标准化清单

> 待办统一在 ``doc/PLAN.md`维护（本文不再另立台账），此处只标状态与去向。

1. ~~在 `css/style.css` 增补全站基础色令牌~~ ✅ 已由 `css/color-tokens.css` + `theme-colors.css` 完成（2026-11-06 审计确认）。
2. 大面积 `#fff` 替换为纸色四档 → PLAN B4/C2。
3. `articles-detail.css` 分类硬编码联结卡颜色迁移到 `category-theme.css` 变量 → PLAN C5。
4. ~~为七个导航展览页建立 `--module-accent` 规范~~ ✅ 已落地 `css/module-colors.css`（10 组定义与 §5 表一致）；剩余：5 个未触发 `data-module` 的页面补属性或删定义 → PLAN B5。
5. ~~为 `html/masters` 建立导师色令牌~~ ✅ 已落地 `css/master-colors.css`（含斯大林，见 §4.1）。
6. 给 experimental 工具族增加文档化风格名：`constructivist`、`rural-stage`、`mimeo-paper`、`darkroom-red`、`minimal-paper` ⬜（§9 已记录配色档案，风格名待挂）。
7. 灰阶收敛：新增代码优先使用 `--gray-*`/`--gray-dark-*` 令牌，不再随手添加 `#f7f7f7/#fafafa/#111/#000` → 规则已进 `doc/design-tokens.md` §1.3，存量迁移走PLAN B4。

---

## 12. 常规层表外色值台账（2026-11-07）

> 范围：`css/style.css`、`css/articles-detail.css`、`css/articles-index.css` 中不在令牌体系内的颜色字面量（PLAN B9）。此前批次已把与既有令牌**等值**的字面量全部 var 化；本节给剩余表外值逐组明确处置，并完成其中安全的等值替换。
>
> 处置口径：
> - **升令牌**：红/金品牌族或中性灰族的语义变体，且三文件合计 ≥3 次、命名可与 `--color-*` 衔接 → 在 `css/color-tokens.css` 加原子定义，三文件全部替换为 `var()`（精确等值，零视觉变化）。本轮升格 3 个（见 §12.3）。
> - **确认设计值**：组件特有颜色（图表 indigo `#7986cb`、u-* 工具类、detail 分类回退色、index 夜色/蓝灰盘、quiz 红绿对、暗色暖棕盘等）→ 保留字面量，登记在案。
> - **待对齐**：与既有令牌语义重复但值不同 → 本轮不动（对齐属视觉变化），下批评估。
> - **rgba 透明变体**：一律保留 + 登记（透明度令牌化收益低）；`#fff` 保留（纸色替换是有意视觉变化，走PLAN B4/C2）；`var()` 回退位中的字面量保留。
>
> 「文件/位置」为盘点时行号：style=`css/style.css`，detail=`css/articles-detail.css`，index=`css/articles-index.css`。

### 12.1 hex 字面量（89 组 / 160 处）

| 色值 | 次数 | 文件/位置 | 处置 | 备注 |
|---|---|---|---|---|
| `#121a2b` | 1 | index 20 | DESIGN | index articles-page 暗色渐变起（夜空底） |
| `#15803d` | 1 | index 549 | ALIGN | index modal-status.ready 文字绿；与 --color-success(#2e7d32) 语义重复 |
| `#16202c` | 1 | index 221 | DESIGN | index collection-title 深藏青 |
| `#17212c` | 1 | index 531 | DESIGN | index modal-title 深藏青 |
| `#181827` | 1 | index 20 | DESIGN | index articles-page 暗色渐变起（夜空底） |
| `#18222d` | 1 | index 302 | DESIGN | index card-title span 深藏青 |
| `#1a1a2a` | 1 | detail 954 | DESIGN | detail 暗色 dcn-item.active 底（藏蓝） |
| `#1a237e` | 4 | detail 1062, detail 1072, detail 1091, detail 1094 | DESIGN | detail u-* 工具类 indigo（u-color-1a237e/u-border-left-indigo/u-bg-gradient-blue） |
| `#1a2a1a` | 2 | detail 806, detail 913 | DESIGN | detail 暗色 correct/ready 底（绿调） |
| `#1a4731` | 1 | detail 484 | DESIGN | detail correct 文字深绿 |
| `#1a4d7a` | 1 | detail 1069 | DESIGN | detail u-border-left-navy |
| `#1b5e20` | 1 | detail 1067 | DESIGN | detail u-border-left-deepgreen |
| `#232838` | 2 | index 202, index 459 | DESIGN | index 暗色 article-card/modal-dialog 面 |
| `#283593` | 1 | detail 1091 | DESIGN | detail u-bg-gradient-blue 渐变亮端 |
| `#2a2015` | 1 | detail 807 | DESIGN | detail 暗色 wip 状态底（暖棕） |
| `#2a2025` | 1 | detail 953 | DESIGN | detail 暗色 dcn-item:hover 底（紫调） |
| `#2b3a4a` | 2 | index 109, index 139 | DESIGN | index 亮色 section-head h2/filter-input 文字（蓝灰盘） |
| `#2c3442` | 1 | index 162 | DESIGN | index 暗色 filter-btn 底 |
| `#2d1a1a` | 2 | detail 901, detail 912 | DESIGN | detail 暗色 warning/wrong 底（红调） |
| `#2d2015` | 4 | detail 895, detail 900, detail 919, detail 933 | DESIGN | detail 暗色 intro/highlight/puzzle 底（暖棕盘） |
| `#2d3748` | 1 | detail 525 | DESIGN | detail theory-node.branch 色 |
| `#2f6f44` | 1 | detail 621 | DESIGN | detail conn-dir output 深绿 |
| `#3182ce` | 1 | detail 1071 | DESIGN | detail u-border-left-blue-3182ce |
| `#38a169` | 4 | detail 526, detail 1066, detail 1076, detail 1096 | DESIGN | detail theory-node.current + u-* 绿系（u-color-green 等） |
| `#3a2020` | 1 | detail 803 | DESIGN | detail 暗色 modal-article:hover 底 |
| `#3d2a1a` | 4 | detail 895, detail 900, detail 919, detail 933 | DESIGN | detail 暗色 intro/highlight/puzzle 文字（暖棕盘） |
| `#3d6b4f` | 1 | detail 1068 | DESIGN | detail u-border-left-slate |
| `#493b1b` | 1 | index 393 | DESIGN | index 暗色 favorite 激活文字（暗金） |
| `#4a0000` | 2 | detail 186, detail 193 | DESIGN | detail favorite 激活/重要度徽章深红底（配金） |
| `#4a3030` | 1 | detail 933 | DESIGN | detail 暗色 puzzle-modern h3（暖红） |
| `#553c9a` | 1 | detail 1075 | DESIGN | detail u-color-purple |
| `#5a101b` | 1 | detail 8 | DESIGN | detail --cat-gradient 暗端回退 |
| `#5c3d99` | 2 | detail 622, detail 1064 | DESIGN | detail conn-dir mutual + u-border-left-purple 紫 |
| `#66bb6a` | 2 | detail 806, detail 913 | ALIGN | detail 暗色 correct/ready 绿；与 --color-success 语义重复，对齐需另立暗色变体 |
| `#67727e` | 1 | index 235 | DESIGN | index card-author 蓝灰 |
| `#68d391` | 1 | detail 481 | DESIGN | detail correct 左边框绿（quiz 配色） |
| `#742a2a` | 1 | detail 477 | DESIGN | detail wrong 文字深红 |
| `#7986cb` | 18 | detail 884, detail 892, detail 892, detail 911, detail 914, detail 916, … | DESIGN | detail 页 indigo 强调主色（暗色标题/交互件/图表系） |
| `#7f1d1d` | 1 | index 468 | DESIGN | index modal-header 渐变暗端（与 --articles-accent 搭配） |
| `#8a8f98` | 1 | index 289 | DESIGN | index card-date 蓝灰 |
| `#8b1e2d` | 2 | detail 6, detail 8 | DESIGN | detail --cat-primary/--cat-gradient 回退 |
| `#9a7a22` | 1 | index 373 | DESIGN | index favorite 图标暗金 |
| `#a8b0bc` | 1 | index 123 | DESIGN | index 暗色 section-count 蓝灰 |
| `#b07c00` | 1 | index 381 | DESIGN | index favorite hover 金 |
| `#b26a00` | 1 | detail 620 | DESIGN | detail conn-dir source 橙 |
| `#b33a45` | 2 | detail 7, detail 8 | DESIGN | detail --cat-secondary/--cat-gradient 回退 |
| `#b7c1ce` | 1 | index 243 | DESIGN | index 暗色 card-author 蓝灰 |
| `#b91c1c` | 3 | index 2, index 280, index 468 | TOKEN | 升格 --color-brand-red-strong |
| `#c1c7d0` | 1 | index 61 | DESIGN | index 暗色 page-hero p 蓝灰 |
| `#c2185b` | 1 | detail 1078 | DESIGN | detail u-color-pink |
| `#c9a64e` | 1 | index 383 | DESIGN | index favorite 激活金 |
| `#d7b65a` | 1 | index 387 | DESIGN | index 暗色 favorite 金 |
| `#d7dfeb` | 1 | index 113 | DESIGN | index 暗色 section-head h2 蓝灰 |
| `#dbe3ef` | 1 | index 163 | DESIGN | index 暗色 filter-btn 文字 |
| `#e2e8f0` | 1 | detail 527 | DESIGN | detail theory-node.related 灰蓝 |
| `#e57373` | 3 | style 722, style 722, style 723 | TOKEN | 升格 --color-brand-red-soft-dark |
| `#e65100` | 4 | detail 798, detail 1063, detail 1074, detail 1097 | DESIGN | detail ma-status.wip + u-* 橙系（u-color-orange 等） |
| `#e6edf6` | 1 | index 146 | DESIGN | index 暗色 filter-input 底 |
| `#e8eef8` | 1 | index 535 | DESIGN | index 暗色 modal-title 蓝灰 |
| `#ede4d6` | 1 | index 16 | DESIGN | index articles-page 亮色渐变端（暖沙） |
| `#ede7f6` | 2 | detail 622, detail 1058 | DESIGN | detail conn-dir mutual 底 + u-bg-soft-purple |
| `#eef3fb` | 1 | index 227 | DESIGN | index 暗色 card-title span 蓝灰 |
| `#ef4444` | 1 | index 280 | DESIGN | index badge 渐变亮端（与 --articles-accent 搭配） |
| `#ef5350` | 1 | detail 912 | DESIGN | detail 暗色 wrong 左边框红 |
| `#f0d0c0` | 1 | detail 640 | DESIGN | detail puzzle-modern 暖粉底 |
| `#f0fff4` | 1 | detail 480 | DESIGN | detail correct 底淡绿 |
| `#f4f4f4` | 1 | detail 617 | DESIGN | detail conn-dir 底灰 |
| `#f6f0e8` | 1 | index 16 | DESIGN | index articles-page 亮色渐变起（暖沙） |
| `#f9e3a8` | 1 | detail 121 | DESIGN | detail 暗色 history-resume-prompt 文字（奶油金） |
| `#fc8181` | 1 | detail 473 | ALIGN | detail wrong 左边框柔化红；建议下批对齐 --color-brand-red-soft |
| `#fce4ec` | 1 | detail 1057 | DESIGN | detail u-bg-soft-pink |
| `#fdf0f0` | 2 | detail 783, detail 872 | DESIGN | detail modal-article/dcn-item hover 淡红底 |
| `#fef5f5` | 1 | detail 877 | DESIGN | detail dcn-item.active 淡红底 |
| `#ff6b6b` | 3 | style 529, style 2089, style 2516 | TOKEN | 升格 --color-brand-red-soft |
| `#ff7b7b` | 1 | index 51 | ALIGN | index 暗色 hero h1 柔化红；建议下批对齐 --color-brand-red-soft |
| `#ffadad` | 1 | index 83 | ALIGN | index 暗色 hero p 柔化红；建议下批对齐 --color-brand-red-soft |
| `#ffb0b0` | 1 | style 444 | ALIGN | style 暗色 hero-opening-text 柔化红；建议下批对齐 --color-brand-red-soft |
| `#ffb300` | 2 | detail 99, detail 185 | ALIGN | detail 回执条/favorite 渐变琥珀端；下批与 #ffd54f 一并评估 gold 系令牌 |
| `#ffb74d` | 1 | detail 807 | DESIGN | detail 暗色 wip 状态文字琥珀 |
| `#ffc107` | 1 | detail 438 | DESIGN | detail highlight-box 边框琥珀（明度与 --color-warning 不同） |
| `#ffd54f` | 4 | detail 33, detail 118, detail 125, detail 185 | ALIGN | detail 进度条/回执计数/重要度徽章琥珀金；下批评估 gold-soft 令牌或对齐 --color-brand-gold |
| `#ffd700` | 1 | style 2658 | FALLBACK | style nav-ball:focus-visible 的 var(--color-brand-gold,#ffd700) 回退位 |
| `#ffe29a` | 1 | index 392 | DESIGN | index 暗色 favorite 激活淡金底 |
| `#ffe8d6` | 5 | detail 321, detail 437, detail 511, detail 636, detail 1053 | DESIGN | detail intro/highlight/puzzle 暖底 + u-bg-soft-warm |
| `#fff5f5` | 1 | detail 472 | DESIGN | detail wrong 底淡红 |
| `#fff7dc` | 1 | index 382 | DESIGN | index favorite 激活淡金底 |
| `#fff8f0` | 5 | detail 321, detail 437, detail 511, detail 636, detail 1053 | DESIGN | detail intro/highlight/puzzle 暖白底 + u-bg-soft-warm |
| `#fff8f1` | 1 | style 114 | DESIGN | style logo 主标题暖白 |
| `#fff` | 11 | style 198, style 247, style 911, style 2576, style 2608, detail 177, … | FFF | 亮色文字/图标/按钮字；纸色替换为有意视觉变化（PLAN B4/C2） |

### 12.2 rgba 透明变体（17 基色组 / 77 档 / 115 处，全部保留）

| 基色 | 处数 | 分布 | 档数 | α 档位 |
|---|---|---|---|---|
| `rgba(255,255,255, α)` | 40 | articles-detail×16/articles-index×5/style×19 | 21 | 0.08,0.1,0.12,0.14,0.15,0.16,0.18,0.2,0.24,0.28,0.3,0.35,0.4,0.5,0.65,0.7,0.85,0.86,0.88,0.92,0.96 |
| `rgba(0,0,0, α)` | 28 | articles-index×8/style×10/articles-detail×10 | 15 | 0.05,0.06,0.08,0.1,0.12,0.15,0.16,0.18,0.2,0.25,0.28,0.35,0.45,0.5,0.6 |
| `rgba(255,215,0, α)` | 10 | style×4/articles-detail×6 | 9 | 0.08,0.10,0.15,0.24,0.5,0.55,0.9,0.95,0.98 |
| `rgba(196,30,58, α)` | 8 | style×8 | 6 | 0.08,0.1,0.12,0.18,0.2,0.25 |
| `rgba(139,0,0, α)` | 7 | articles-detail×4/style×3 | 6 | 0.12,0.18,0.25,0.35,0.4,0.97 |
| `rgba(26,26,26, α)` | 4 | style×4 | 3 | 0.08,0.10,0.18 |
| `rgba(255,107,107, α)` | 3 | style×3 | 3 | 0.16,0.3,0.55 |
| `rgba(18,18,24, α)` | 2 | articles-index×2 | 2 | 0.78,0.92 |
| `rgba(185,28,28, α)` | 2 | articles-index×2 | 1 | 0.1 |
| `rgba(255,180,0, α)` | 2 | style×2 | 2 | 0.03,0.04 |
| `rgba(31,31,31, α)` | 2 | articles-detail×2 | 2 | 0.9,0.96 |
| `rgba(78,45,20, α)` | 2 | articles-index×2 | 2 | 0.06,0.08 |
| `rgba(245,158,11, α)` | 1 | articles-index×1 | 1 | 0.16 |
| `rgba(249,227,168, α)` | 1 | articles-detail×1 | 1 | 0.8 |
| `rgba(255,123,123, α)` | 1 | articles-index×1 | 1 | 0.14 |
| `rgba(34,197,94, α)` | 1 | articles-index×1 | 1 | 0.14 |
| `rgba(74,0,0, α)` | 1 | articles-detail×1 | 1 | 0.74 |

### 12.3 统计

- 盘点合计：**275 处**字面量，精确色值 **166 组**（hex 89 组 + rgba 77 档）。
- **升令牌 3 个**（9 处替换，全部精确等值、零视觉变化）：
  - `--color-brand-red-soft` = `#ff6b6b`（style 3 处：暗色 shutter-dot 激活 / filter-indicator / section-divider 渐变端）
  - `--color-brand-red-soft-dark` = `#e57373`（style 3 处：暗色 back-link 文字/边框/hover）
  - `--color-brand-red-strong` = `#b91c1c`（index 3 处：`--articles-accent` 定义 + badge/modal-header 渐变锚色）
- **确认设计值 76 组**（126 处）：以 detail 的 indigo/琥珀/u-* 工具类、index 夜色蓝灰盘、双方暗色暖棕盘为主。
- **待对齐 8 组**（13 处）：柔化红 4（`#ff7b7b/#ffadad/#ffb0b0/#fc8181` → 建议对齐 `--color-brand-red-soft`）、绿 2（`#15803d/#66bb6a` → 建议对齐 `--color-success`）、金/琥珀 2（`#ffd54f/#ffb300` → 下批评估 gold-soft 或对齐 `--color-brand-gold`）。
- 保留：rgba 透明变体 17 基色组 115 处；`#fff` 11 处（B4/C2 纸色批次处理）；`var()` 回退位 `#ffd700` 1 处。
