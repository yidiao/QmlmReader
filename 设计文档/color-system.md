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
| `css/master-colors.css` | `body[data-master]` 导师主题色 | 导师色不替代文章分类色 |
| `css/category-theme.css` | 六大文章分类色 | 通过 `data-category` 使用 |

`css/style.css` 已通过顶部 `@import` 接入上述颜色管理文件；现有旧变量保留为兼容别名。新增常规页面应优先引入 `style.css`，不必重复引入令牌文件。

### 1.2 推荐全站基础令牌（由 `css/color-tokens.css` 维护）

```css
:root {
  --color-brand-red: #c41e3a;
  --color-brand-red-dark: #8b0000;
  --color-brand-gold: #ffd700;
  --color-ink: #2b2b2b;
  --color-ink-strong: #1a1a1a;
  --color-paper: #f7f2e7;
  --color-paper-soft: #fbf7ee;
  --color-paper-deep: #e8e4dc;
  --color-surface: #fffaf0;
  --color-surface-strong: #fffdf7;
  --color-border-warm: #ded2bd;
}
```

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

### 4.1 斯大林新增内容的色彩建议

下一步将为 `html/masters` 增添斯大林小传、斯大林人物关系网等内容，建议提前设定一组 Stalin 令牌：

```css
:root {
  --master-stalin-primary: #7f1d1d;   /* 深绛红：政治与战争年代 */
  --master-stalin-secondary: #4b5563; /* 钢灰：工业化、组织、档案感 */
  --master-stalin-accent: #c9a84c;    /* 旧金：奖章、时间节点、重点徽章 */
  --master-stalin-paper: #f1eadc;     /* 旧档案纸 */
  --master-stalin-ink: #252525;
}
body.dark-mode {
  --master-stalin-primary: #b33a45;
  --master-stalin-secondary: #8b96a6;
  --master-stalin-accent: #d7b65a;
  --master-stalin-paper: #24211b;
  --master-stalin-ink: #ece4d4;
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

现状：`css/style.css` 的暗色基础为 `#1a1a1a` 背景、`#2a2a2a` 卡片、`#444` 边框；`articles-index.css` 已有深蓝灰页面底。建议标准化为以下层级：

| 令牌 | 色值 | 用途 |
|---|---:|---|
| `--dark-bg` | `#171717` | 全站深色背景最低层 |
| `--dark-bg-soft` | `#1f1f1f` | 页面区域、阅读背景 |
| `--dark-surface` | `#2a2a2a` | 卡片、弹窗、章节内容 |
| `--dark-surface-raised` | `#333333` | 悬浮卡、输入区、hover |
| `--dark-border` | `#444444` | 边框，不要低于 `#333` |
| `--dark-text` | `#e0e0e0` | 正文 |
| `--dark-muted` | `#aaaaaa` | 次要文字 |
| `--dark-warm-text` | `#ece4d4` | 工具页纸张风格正文 |
| `--dark-gold` | `#ffd54f` | 暗色强调金，替代纯黄大面积 |

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

1. 在 `css/style.css` 增补全站基础色令牌，逐步把 `--bg-color: #f5f5f5`、`--card-bg: #fff` 改为护眼纸色体系。
2. 将大面积 `#fff` 替换为 `--color-surface/#fffaf0/#fbf7ee`，输入框使用 `#fffdf7`。
3. 将 `articles-detail.css` 中分类硬编码联结卡颜色迁移到 `category-theme.css` 变量。
4. 为七个导航展览页的大标题建立 `.module-hero` 或页面级 `--module-accent` 规范。
5. 为 `html/masters` 建立导师色令牌，尤其先补 `--master-stalin-*`。
6. 给 experimental 工具族增加文档化风格名：`constructivist`、`rural-stage`、`mimeo-paper`、`darkroom-red`、`minimal-paper`。
7. 灰阶收敛：新增代码优先使用本文灰阶，不再随手添加 `#f7f7f7/#fafafa/#111/#000`。
