@echo off
chcp 65001
cls
echo ==========================================
echo    QmlmReader GitHub 推送脚本
echo ==========================================
echo.
echo 请确保：
echo 1. 已开启梯子/代理
echo 2. 在 D:\Qmlmreader 目录下运行此脚本
echo.
echo 按任意键开始推送...
pause >nul

cd /d D:\Qmlmreader

echo.
echo [1/2] 检查远程仓库...
git remote -v

echo.
echo [2/2] 推送到 GitHub...
git push -u origin master

echo.
if %errorlevel% == 0 (
    echo ==========================================
    echo    推送成功！
    echo ==========================================
    echo.
    echo 访问 https://github.com/yidiao/QmlmReader 查看仓库
) else (
    echo ==========================================
    echo    推送失败，请检查网络连接
    echo ==========================================
)

echo.
pause
