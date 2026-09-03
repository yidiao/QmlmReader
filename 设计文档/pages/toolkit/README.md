# 工具集模块 README

> 对应源码：`html/toolkit/`、部分 experimental 子工具复用文件、公共脚本。  
> 作用：管理工具集入口和工具页，与 experimental 模块保持边界。

---

## 1. 页面范围

```text
html/toolkit/toolkit.html
html/toolkit/marxist-style.html
html/toolkit/science.html
```

注意：`html/toolkit/marxist-style.html` 与 `html/experimental/marxist-style.html` 可能存在功能/历史重叠，维护前必须核对当前实际入口。

---

## 2. 当前资源链路

主入口 `toolkit.html` 引入：

```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/site-data.js"></script>
<script src="../../js/main.js"></script>
<script src="../../js/darkmode.js"></script>
<script src="../../js/cursor.js"></script>
```

---

## 3. 维护重点

1. 工具集页当前有大量内联样式，且右侧悬停导航与文艺模块相似，后续可抽公共组件。
2. 与 `html/experimental/` 重名或相似工具要明确“正式入口”和“实验入口”。
3. 工具页若接外部 API，应记录密钥策略、调用边界、失败降级，不在总览复制完整 Prompt。
4. 新工具入口应同步加入全站导航、工具集页、必要时加入 experimental 模块文档。
