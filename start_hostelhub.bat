@echo off
title HostelHub Startup Manager
echo ===================================================
echo   HostelHub - Automatic Service Startup Manager
echo ===================================================
echo.

:: Navigate to project directory
cd /d "C:\Users\kaipu\.gemini\antigravity\scratch\HostelHub"

:: Start Backend if not already running
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 8080 is already in use. Assuming Backend is running.
) else (
    echo [INFO] Starting Backend Spring Boot Server (Port 8080)...
    start "HostelHub Backend" /min powershell -ExecutionPolicy Bypass -File .\mvn.ps1 -f backend/pom.xml spring-boot:run
)

:: Start Frontend if not already running
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use. Assuming Frontend is running.
) else (
    echo [INFO] Starting Frontend Node.js Server (Port 3000)...
    start "HostelHub Frontend" /min cmd /c node server.js
)

echo.
echo [INFO] Waiting for servers to initialize...
timeout /t 5 > nul

echo [INFO] Launching HostelHub Web Portal...
start http://localhost:3000

echo.
echo ===================================================
echo   HostelHub is running! You can access it locally
echo   or from your phone on the same Wi-Fi.
echo ===================================================
timeout /t 3 > nul
exit
