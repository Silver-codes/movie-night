@echo off
rem Double-click to start Movie Night: builds the frontend, serves the app on port 8000
rem and opens it in the browser. Close this window (or press Ctrl+C) to stop it.
title Movie Night
cd /d "%~dp0"

where npm >nul 2>nul || (echo npm was not found. Install Node.js first. & pause & exit /b 1)
where uv >nul 2>nul || (echo uv was not found. Install uv first. & pause & exit /b 1)

rem First run on this machine: install everything.
if not exist "node_modules" (call npm run setup || goto failed)
if not exist "frontend\node_modules" (call npm run setup || goto failed)

echo Building the app...
call npm run build || goto failed

rem Open the browser as soon as the server answers (runs in the background).
start "" /b powershell -NoProfile -WindowStyle Hidden -Command ^
  "for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -UseBasicParsing http://localhost:8000/api/health > $null; Start-Process 'http://localhost:8000'; break } catch { Start-Sleep -Milliseconds 500 } }"

echo.
echo Movie Night is starting on http://localhost:8000
echo On your phone, use this PC's address on port 8000:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do echo    http://%%b:8000
echo Close this window to stop the app.
echo.
call npm run serve
goto :eof

:failed
echo.
echo Something went wrong (see above).
pause
exit /b 1
