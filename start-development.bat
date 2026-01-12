@echo off
echo ========================================
echo  Task Tracker - Development Servers
echo ========================================
echo.

echo Checking SQL Server status...
sc query "MSSQL$MSSQLSERVER01" | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo SQL Server is not running. Starting SQL Server...
    net start "MSSQL$MSSQLSERVER01"
    timeout /t 5 >nul
)

echo.
echo Starting Backend Server (Port 3001)...
start "Task Tracker - Backend" cmd /k "cd /d %~dp0server && npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 5 >nul

echo.
echo Starting Frontend Server (Port 5173)...
start "Task Tracker - Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo  Servers Started!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop servers
echo.
pause
