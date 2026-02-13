@echo off
chcp 65001 > nul
title 💝 Valentine's Day Server
echo.
echo ╔════════════════════════════════════════╗
echo ║   💕 Веб-сервер для сайта запущен 💕  ║
echo ╚════════════════════════════════════════╝
echo.
echo 🌐 Откройте браузер и перейдите по адресу:
echo.
echo    👉 http://localhost:8000
echo.
echo ⏹️  Для остановки нажмите Ctrl+C
echo.

node server.js

if errorlevel 1 (
    echo.
    echo ❌ Node.js не найден или произошла ошибка!
    echo.
    pause
)
