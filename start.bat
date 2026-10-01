@echo off
title English Vocabulary App
chcp 65001 >nul
echo ========================================================
echo   Dang khoi dong English Vocabulary App...
echo ========================================================

cd /d "%~dp0"

REM Kiem tra neu chua co node_modules
if not exist "node_modules\" (
    echo [INFO] Chua tim thay thu vien node_modules, dang cai dat...
    call npm install
)

echo [INFO] Khoi dong server va tu dong mo trinh duyet...
echo ========================================================
echo   Nhan Ctrl + C de dung ung dung.
echo ========================================================

call npm run dev -- --open

pause
