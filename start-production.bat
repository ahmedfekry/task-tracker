@echo off
echo ========================================
echo  Task Tracker - Production Server
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
echo Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Building Backend...
cd server
call npm run build
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo Starting Production Server...
echo.
echo Application will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.
set NODE_ENV=production
node dist/index.js

pause
