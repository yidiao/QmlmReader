# QmlmReader GitHub + Vercel 部署规范

## 1. 目标架构

本项目采用两端分离的方式：

- 静态前端：QmlmReader 站点页面
- Vercel 后端：`api/translate.js`

当前马列体生成器页面位于：

- `html/experimental/marxist-style.html`
- `html/toolkit/marxist-style.html`

前端逻辑位于：

- `js/marxist/marxist-style.js`
- `js/marxist/marxist-style-ai.js`

Vercel 后端入口位于：

- `api/translate.js`

## 2. 单一推荐流程

只保留这一条流程：

`本地仓库 -> GitHub -> Vercel 自动部署`

不再推荐：

- 手动打 zip 上传 Vercel
- 从临时目录单独复制一份后端再部署
- 同时维护多个 Vercel 项目而不记录域名用途

## 3. 目录与职责对齐

仓库根目录：`D:\AI Pj\Qmlmreader`

关键文件职责：

- `vercel.json`：Vercel 部署配置
- `api/translate.js`：Vercel Serverless Function
- `js/marxist/marxist-style.js`：前端调用后端接口
- `PACKAGE_FOR_VERCEL.bat`：本地检查提示脚本，不再用于 zip 打包上传

## 4. Vercel 配置规范

### 4.1 仓库导入

在 Vercel 中：

1. New Project
2. 选择 GitHub 上的 `Qmlmreader` 仓库
3. Framework Preset 选 `Other`
4. Root Directory 选仓库根目录
5. Build Command 留空
6. Output Directory 留空
7. 安装命令留空

### 4.2 环境变量

必须配置：

- `DEEPSEEK_API_KEY`

否则 `api/translate.js` 会返回 503。

### 4.3 vercel.json 规则

当前仓库使用的原则：

- 不在 `functions.api/translate.js` 下显式声明 `runtime`
- 只保留 `memory` 和 `maxDuration`
- CORS 头仅为 API 路由设置

这样可以避免旧版 runtime 语法与新版配置混用导致的部署错误。

## 5. 前后端域名对齐规范

前端通过 `window.QMLM_API_BASE` 读取后端基地址；若未配置，则回退到默认值。

当前默认回退值位于：

- `js/marxist/marxist-style.js`

规范要求：

1. Vercel 项目域名确定后，记录唯一正式 API 域名。
2. 若需要切换域名，优先在页面中注入 `window.QMLM_API_BASE`。
3. 未注入时，代码中的默认值必须与当前正式 API 域名一致。
4. 不要在多个脚本里重复写不同的 API 域名。

## 6. GitHub 推送规范

每次发布按这个顺序执行：

1. 本地修改代码
2. 本地自查关键文件
3. `git status`
4. `git add` 需要发布的文件
5. `git commit -m "..."`
6. `git push`
7. 等待 Vercel 自动部署
8. 在 Vercel 面板确认部署成功
9. 用线上地址验证 `/api/translate`

示例：

```bash
git add vercel.json api/translate.js js/marxist/marxist-style.js DEPLOY.md PACKAGE_FOR_VERCEL.bat
git commit -m "Normalize Vercel deployment config"
git push
```

## 7. 发布后验证规范

至少做这三项：

1. 打开 `https://你的-vercel-域名/api/translate`
   - 看到 `405` 或 `仅支持 POST 请求`，说明函数已上线
2. 从前端页面实际触发一次转换
3. 确认浏览器请求发送到了预期的 API 域名，而不是旧域名

## 8. 常见错误与处理

### 8.1 Function Runtimes must have a valid version

原因：

- `vercel.json` 中混用了不兼容的 runtime 写法

处理：

- 删除 `functions.api/translate.js.runtime`
- 重新部署

### 8.2 API 服务未配置

原因：

- Vercel 没有设置 `DEEPSEEK_API_KEY`

处理：

- 在 Vercel Project Settings -> Environment Variables 中补上
- 重新部署

### 8.3 前端还在请求旧域名

原因：

- `js/marxist/marxist-style.js` 中默认域名未更新
- 或页面注入的 `window.QMLM_API_BASE` 仍是旧值

处理：

- 统一修改为唯一正式域名
- 清理重复配置来源

## 9. 当前建议

如果你的目标是最稳地跑起来：

1. 先把当前仓库推到 GitHub
2. 用本仓库直接接入 Vercel
3. 先保证 `api/translate.js` 成功上线
4. 再核对前端默认 API 域名是否等于该 Vercel 项目域名

不要再走 zip 上传流程。
