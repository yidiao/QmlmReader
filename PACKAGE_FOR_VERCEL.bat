@echo off
chcp 65001
cls
echo ==========================================
echo    QmlmReader Vercel 打包脚本
echo ==========================================
echo.
echo 正在打包（排除 .git 文件夹）...
echo.

cd /d D:\Qmlmreader

:: 创建临时目录
set "TEMP_DIR=%TEMP%\QmlmReader_Package"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: 复制文件（排除 .git）
echo [1/3] 复制网站文件...
xcopy /e /i /q /exclude:.gitignore "*" "%TEMP_DIR%\" 2>nul

:: 删除不需要的文件
echo [2/3] 清理临时文件...
if exist "%TEMP_DIR%\.git" rmdir /s /q "%TEMP_DIR%\.git"
if exist "%TEMP_DIR%\PUSH_COMMANDS.bat" del "%TEMP_DIR%\PUSH_COMMANDS.bat"
if exist "%TEMP_DIR%\PACKAGE_FOR_VERCEL.bat" del "%TEMP_DIR%\PACKAGE_FOR_VERCEL.bat"
if exist "%TEMP_DIR%\DEPLOY.md" del "%TEMP_DIR%\DEPLOY.md"

:: 创建压缩包
echo [3/3] 创建压缩包...
set "OUTPUT=%USERPROFILE%\Desktop\QmlmReader_for_Vercel.zip"
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%OUTPUT%' -Force"

:: 清理临时目录
rmdir /s /q "%TEMP_DIR%"

echo.
echo ==========================================
echo    打包完成！
echo ==========================================
echo.
echo 文件位置: %OUTPUT%
echo.
echo 下一步:
echo 1. 访问 https://vercel.com/new
echo 2. 拖拽上传 QmlmReader_for_Vercel.zip
echo 3. 点击 Deploy 完成部署
echo.
pause
