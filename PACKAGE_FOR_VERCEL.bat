@echo off
chcp 65001 >nul
cls
echo ==========================================
echo    QmlmReader Vercel 检查脚本
echo ==========================================
echo.
echo 本项目的推荐流程是：GitHub 仓库 -> Vercel 自动部署。
echo 不再推荐打包 zip 再手动上传。
echo.
cd /d "D:\AI Pj\Qmlmreader"

echo [1/3] 当前仓库状态
git status --short

echo.
echo [2/3] 关键部署文件
echo - vercel.json
echo - api\translate.js
echo - js\marxist\marxist-style.js

echo.
echo [3/3] 下一步
echo 1. 先提交并 push 到 GitHub
echo 2. 在 Vercel 导入这个 GitHub 仓库
echo 3. Framework Preset 选 Other
echo 4. Root Directory 选仓库根目录 Qmlmreader
echo 5. Environment Variables 里设置 DEEPSEEK_API_KEY
echo 6. 部署后用 /api/translate 验证函数是否在线
echo.
pause
