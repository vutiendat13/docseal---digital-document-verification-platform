@echo off
chcp 65001 >nul
echo =====================================================================
echo    DOCSEAL - DIGITAL DOCUMENT VERIFICATION PLATFORM
echo =====================================================================
echo.

cd /d "%~dp0"

:: 1. Kiểm tra Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python tren he thong!
    echo Vui long cai dat Python 3.10 hoac 3.11 tro len tu https://www.python.org/
    echo Nho tich chon "Add Python to PATH" khi cai dat.
    pause
    exit /b 1
)

:: 2. Kiểm tra/Tạo môi trường ảo venv
if not exist "venv\Scripts\activate.bat" (
    echo [*] Dang khoi tao moi truong ao Python venv...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [LOI] Khong the tao venv!
        pause
        exit /b 1
    )
)

echo [*] Dang kich hoat moi truong ao venv...
call venv\Scripts\activate.bat

:: 3. Kiểm tra file .env
if not exist ".env" (
    echo [*] Khong tim thay file .env, dang sao chep tu .env.example...
    copy .env.example .env >nul
)

:: 4. Cài đặt thư viện
echo [*] Dang kiem tra va cai dat dependencies tu requirements.txt...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [CANH BAO] Co loi khi cai dependencies. Thu chay lai pip install...
    pip install -r requirements.txt
)

:: 5. Khởi động backend FastAPI
echo.
echo =====================================================================
echo  DOCSEAL DANG KHOI CHAY TAI:
echo  - Giao dien Web:   http://127.0.0.1:8000
echo  - API Swagger Doc: http://127.0.0.1:8000/docs
echo  - IPFS Kubo RPC:   http://127.0.0.1:5001/api/v0
echo =====================================================================
echo.
echo Nhan Ctrl + C de dung may chu.
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
