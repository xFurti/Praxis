@echo off
title Praxis

echo Starting Praxis server...
start "Praxis Server" cmd /k "cd /d "%~dp0server" && npm run dev"

echo Starting Praxis app...
start "Praxis App" cmd /k "cd /d "%~dp0app" && npm run dev"

echo.
echo Both processes started.
echo Server: http://localhost:3001
echo App:    http://localhost:5173
echo.
echo Close the individual windows to stop each process.
