@echo off
title Build ActiveRecall Android APK
chcp 65001 >nul

cd /d "%~dp0"

echo ========================================================
echo   Buoc 1: Build Web App & Dong bo sang Capacitor Android
echo ========================================================
call npm.cmd run build
if %ERRORLEVEL% neq 0 (
    echo [LOI] Build web that bai!
    pause
    exit /b 1
)

call npx.cmd cap sync android
if %ERRORLEVEL% neq 0 (
    echo [LOI] Capacitor sync that bai!
    pause
    exit /b 1
)

echo ========================================================
echo   Buoc 2: Bien dich file APK bang Gradle
echo ========================================================
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% neq 0 (
    echo.
    echo [LOI] Bien dich APK that bai!
    echo Hay dam bao ban da cai Android Studio / Android SDK va thiet lap bien moi truong ANDROID_HOME.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   THANH CONG! File APK da duoc tao tai:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================================
pause
