@echo off
echo === Starting Micro-Climate Zoning AI ===
echo.

REM Start API in a new window
start "API Server" cmd /k "call venv\Scripts\activate.bat && python run.py"

REM Wait a moment then start frontend
timeout /t 3 /nobreak >nul

start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo API:      http://localhost:8000
echo Docs:     http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
echo Close the two terminal windows to stop.
pause
