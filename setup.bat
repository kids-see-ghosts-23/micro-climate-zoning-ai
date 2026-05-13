@echo off
echo === Micro-Climate Zoning AI Setup ===
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://python.org
    pause
    exit /b 1
)

echo [1/4] Creating virtual environment...
python -m venv venv

echo [2/4] Activating and installing Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements-dev.txt

echo [3/4] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo [4/4] Done!
echo.
echo To start the app, run:  start.bat
pause
