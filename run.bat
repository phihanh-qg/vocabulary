@echo off
title English Vocabulary App
chcp 65001 >nul

echo ========================================================
echo   Dang khoi dong English Vocabulary App...
echo ========================================================

cd /d "%~dp0"

REM Kiem tra Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LOI] Khong tim thay Node.js tren he thong!
    echo Vui long cai dat Node.js tai https://nodejs.org/ truoc khi chay.
    pause
    exit /b 1
)

REM Kiem tra thu vien node_modules
if not exist "node_modules\" (
    echo [INFO] Chua tim thay thu vien node_modules, dang tu dong cai dat...
    call npm.cmd install
    if %ERRORLEVEL% neq 0 (
        echo [LOI] Cai dat dependencies that bai!
        pause
        exit /b 1
    )
)

echo [INFO] Dang khoi dong may chu va mo trinh duyet...
echo ========================================================
echo   Ung dung se tu dong mo trong trinh duyet web.
echo   Nhan Ctrl + C de dung ung dung.
echo ========================================================

call npm.cmd run dev -- --open

if %ERRORLEVEL% neq 0 (
    pause
)
