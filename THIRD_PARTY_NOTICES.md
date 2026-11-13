# 第三方资产与许可声明（THIRD_PARTY_NOTICES）

本仓库的「马列体生成器」在方法层与部分数据层借鉴了下列开源项目。涉及"实质部分"复用的组件，按上游许可保留版权与许可声明。

---

## 1. karl-marx-skill

- 上游仓库：https://github.com/youaifuou/karl-marx-skill
- 许可：MIT License，Copyright (c) 2026 youaifuou（全文见文末）
- 本项目使用的快照：2026-11-08 获取的本地快照（`karl-marx-skill-main/`，该快照不含 `.git` 元数据，无法给出提交哈希）

### 复用范围（事实来源）

| 本项目位置 | 复用内容 | 上游来源 |
|---|---|---|
| `js/marxist/prompt-guards.js` | 「结构准星与道德豁免」最高原则；反模式封杀表（按纯文本产品改写）；武器降维法则；通信态/著述态双模态；论战四步法；工具失效区写法 | `karl-marx/SKILL.md`、`references/expression-dna.md` |
| `js/marxist/mentors/marx.js` | 马克思内在张力 4 条的**方法框架**（2026-11-13 起按本地原典语料复核，其中 1 条替换为语料可指认的「价值与生产价格」）；身份卡/时间线/认识论/论敌谱系/17 部书单数据块的**结构**；工具失效区写法 | `SKILL.md`、`references/identity-card.md`、`references/debate-opponents.md`、`references/corpus-sources.md` |
| `js/marxist/mentors/engels.js` | 工具失效区写法 | `SKILL.md`、`references/expression-dna.md` |
| `js/marxist/mentors/stalin.js`、`lenin.js`、`mao.js` | 工具失效区写法（内容为本项目按各自文风另行撰写） | `SKILL.md` |
| `js/marxist/mentors/*.js` 的 `TENSIONS` / `DOSSIER`（恩、列、斯、毛） | **本项目自撰**：依据本地原典语料（马恩选集、列宁选集、斯大林选集、毛泽东选集）逐条考证，非上游复用；依据见 `doc/pages/experimental/research/马列体/导师考证记录.md` | — |
| `js/marxist/prompt-guards.js`（语气光谱） | 七种语气的定义思路（样本未复用，按本项目场景重写） | `references/writing-samples.md` |
| `_tools/build_marxist_prompts.cjs`、`api/marxist-prompts.generated.js` | 上述内容的服务端序列化（衍生作品） | — |

### 未复用内容（有意排除）

- 上游的人格化修辞与文学化措辞（如"手术刀""磨穿地板"等比喻、第一人称"我以……的视角与你对话"的写法）——本项目只取结构、规则与数据，不搬其文风。
- 上游 README 中的示例对话与示例题材，未进入本项目 Prompt 或测试样例。
- 上游的完整文章语料文本，未复制；本项目片段库仍使用既有 `js/marxist/mentors/*.js` 中的中文译文片段（属既有资产，另行处理版权风险）。

### 合规说明

- 本项目为静态站点 + 一个 Vercel 函数，通过网页分发"实质部分"（Prompt 文本与数据表）。因此按 MIT 要求：
  - 本文档保留完整 MIT 许可全文与版权声明；
  - `js/marxist/prompt-guards.js` 文件头标注来源与许可；
  - `html/experimental/marxist-style.html` 页脚标注来源；
  - `js/marxist/mentors/*.js` 中复用段落附近标注来源。

---

## 2. MIT License 全文（karl-marx-skill）

```text
MIT License

Copyright (c) 2026 youaifuou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
---

## 3. 议题素材来源（C4 议题训练库）

| 素材 | 条数 | 来源 | 使用方式 |
|---|---|---|---|
| 《共产主义一百问》 | 100 | 作者提供的本地文本 `D:/AI Pj/金星与赤旗-资料集/文字/共产主义一百问.txt` | 仅提取「第N问：题干【分类｜标签】」作为议题题面，未复制其正文写作规范与示例段落 |
| 「青马的奇妙冒险」题库 | 79 | 作者自有兄弟项目，随 `js/qingma/data.js` 同源迁入本仓库 | 仅提取题干（`content`）与阵营/弱点元数据，`options` 选项仍只服务于游戏本体 |

- 两份素材均只进入 `js/marxist/topics.js` 的题面层，不预置答案、不预置生成结果；`_tools/check_topics.cjs` 对此有断言。
- 若「青马的奇妙冒险」后续单独开源，需在其仓库补齐许可声明；本仓库不主张对上述题面的再许可。
