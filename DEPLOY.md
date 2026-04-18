# QmlmReader 部署指南

## 方式一：GitHub + Vercel 自动部署（推荐）

### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库名称：`qmlmreader`
3. 选择 **Public** 或 **Private**
4. 点击 **Create repository**

### 步骤 2：推送代码到 GitHub

在项目目录执行以下命令：

```bash
cd D:\Qmlmreader

# 添加远程仓库（将 YOUR_USERNAME 替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/qmlmreader.git

# 推送代码
git push -u origin master
```

### 步骤 3：在 Vercel 部署

1. 访问 https://vercel.com/new
2. 点击 **Import Git Repository**
3. 授权 GitHub 并选择 `qmlmreader` 仓库
4. 点击 **Deploy**
5. 等待部署完成（约 2-3 分钟）

### 步骤 4：绑定自定义域名

1. 在 Vercel 项目面板点击 **Settings** → **Domains**
2. 输入你的域名，点击 **Add**
3. 按提示在域名服务商处添加 DNS 记录：
   - 类型：`CNAME`
   - 名称：`www` 或 `@`
   - 值：`cname.vercel-dns.com`

---

## 方式二：直接上传部署（最快）

### 步骤 1：压缩项目

将 `D:\Qmlmreader` 文件夹压缩为 ZIP 文件

### 步骤 2：上传到 Vercel

1. 访问 https://vercel.com/new
2. 点击 **Upload**（拖拽或选择 ZIP 文件）
3. 项目类型选择 **Other**
4. 点击 **Deploy**

---

## 部署后检查清单

- [ ] 首页正常显示
- [ ] 导航链接可点击
- [ ] 中国宣传画图片加载正常
- [ ] 苏联海报图片加载正常
- [ ] 导师雷达图正常显示
- [ ] 文章页面正常访问
- [ ] 自定义域名可访问

## 后续更新

如果后续有修改，只需执行：

```bash
cd D:\Qmlmreader
git add -A
git commit -m "更新描述"
git push
```

Vercel 会自动重新部署。

## 注意事项

1. **图片资源**：项目包含约 861 张图片，首次部署可能需要 2-3 分钟
2. **文件大小**：确保总文件大小不超过 Vercel 免费版的限制（单次部署 100MB）
3. **国内访问**：Vercel 在国内访问速度较好，如有需要可后续配置 CDN
