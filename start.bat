@echo off
cd /d "%~dp0"

start "BACKEND" cmd /k "cd docseal && if not exist venv (python -m venv venv) && call venv\Scripts\activate.bat && pip install -r requirements.txt && python app.py"

start "FRONTEND" cmd /k "npm run dev"

timeout /t 8 /nobreak >nul

start http://localhost:3000