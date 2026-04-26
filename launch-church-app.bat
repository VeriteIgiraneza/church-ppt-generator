@echo off
REM Church PowerPoint Generator launcher for Windows
REM Double-click this file to start the app.

REM Change to the directory this script is in (handles spaces in path)
cd /d "%~dp0"

REM Start both servers via the root npm script
call npm run dev

REM If npm exits, pause so the user can read any error messages
echo.
echo Press any key to close this window...
pause >nul