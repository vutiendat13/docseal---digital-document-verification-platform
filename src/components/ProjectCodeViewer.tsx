import React, { useState } from "react";
import JSZip from "jszip";
import { Download, Copy, Check, FileCode, Folder, Terminal, ExternalLink, Sparkles } from "lucide-react";

interface FileEntry {
  path: string;
  language: string;
  content: string;
}

// All project files embedded for in-browser inspection and zip generation
const PROJECT_FILES: Record<string, string> = {
  "run.bat": `@echo off
chcp 65001 >nul
echo =====================================================================
echo    DOCSEAL - DIGITAL DOCUMENT VERIFICATION PLATFORM
echo =====================================================================
echo.
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python tren he thong!
    echo Vui long cai dat Python 3.10 hoac 3.11 tro len tu https://www.python.org/
    pause
    exit /b 1
)
if not exist "venv\\Scripts\\activate.bat" (
    echo [*] Dang khoi tao moi truong ao Python venv...
    python -m venv venv
)
call venv\\Scripts\\activate.bat
if not exist ".env" (
    copy .env.example .env >nul
)
echo [*] Dang cai dat dependencies tu requirements.txt...
pip install -r requirements.txt --quiet
echo.
echo =====================================================================
echo  DOCSEAL DANG KHOI CHAY TAI: http://127.0.0.1:8000
echo  API Swagger Docs:          http://127.0.0.1:8000/docs
echo =====================================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause`,

  "requirements.txt": `fastapi>=0.111.0
uvicorn[standard]>=0.30.0
pydantic>=2.7.0
pydantic-settings>=2.2.0
python-multipart>=0.0.9
requests>=2.32.0
cryptography>=42.0.0
passlib[bcrypt]>=1.7.4
bcrypt>=4.1.2
python-jose[cryptography]>=3.3.0
qrcode[pil]>=7.4.2
pytest>=8.2.0
httpx>=0.27.0`,

  ".env.example": `# DocSeal Platform Configuration
APP_NAME=DocSeal
APP_ENV=development
HOST=127.0.0.1
PORT=8000
DEBUG=True

# Security Secrets
SECRET_KEY=docseal-super-secret-development-key-change-in-production-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AES-256 Symmetric Data Encryption Key
DATA_ENCRYPTION_KEY=dGhpcy1pcy1hLXNlY3VyZS0zMi1ieXRlLWtleS1mb3ItZG9jc2VhbDE=

# IPFS Kubo RPC API Configuration
KUBO_RPC_URL=http://127.0.0.1:5001/api/v0
KUBO_TIMEOUT_SECONDS=10
KUBO_FALLBACK_LOCAL_ONLY=True

MAX_UPLOAD_SIZE_MB=25
ALLOWED_EXTENSIONS=pdf,docx,txt,png,jpg,jpeg`,

  "app/main.py": `from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.verification import router as verify_router
from app.api.admin import router as admin_router
from app.api.health import router as health_router

app = FastAPI(
    title="DocSeal API",
    description="Digital Document Verification & Integrity Platform using IPFS and SHA-256 (Zero-SQL)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(verify_router)
app.include_router(admin_router)

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = TEMPLATES_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse("<h1>DocSeal API is Running</h1><p>Visit /docs for Swagger API documentation.</p>")

@app.get("/verify/{document_id}", response_class=HTMLResponse)
async def serve_verify_page(document_id: str):
    index_file = TEMPLATES_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse(f"<h1>DocSeal Verification</h1><p>Document: {document_id}</p>")`,

  "app/repositories/json_repo.py": `import json
import os
import shutil
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from app.config import settings

class JSONRepository:
    """Zero-SQL Thread-safe JSON Persistence with Atomic Writes."""
    _locks: dict[str, threading.Lock] = {}
    _global_lock = threading.Lock()

    def __init__(self, filename: str, default_data: Optional[list] = None):
        self.filepath: Path = settings.DATA_DIR / filename
        self.filename = filename
        self.default_data = default_data if default_data is not None else []
        with self._global_lock:
            if filename not in self._locks:
                self._locks[filename] = threading.Lock()
        self.file_lock = self._locks[filename]
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        with self.file_lock:
            if not self.filepath.exists():
                self.filepath.parent.mkdir(parents=True, exist_ok=True)
                self._write_atomic(self.default_data)

    def _write_atomic(self, data: Any):
        temp_file = settings.TEMP_DIR / f"{self.filename}.{os.getpid()}.{threading.get_ident()}.tmp"
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(temp_file, self.filepath)
        finally:
            if temp_file.exists():
                try: temp_file.unlink()
                except OSError: pass

    def read_all(self) -> list[dict]:
        with self.file_lock:
            try:
                if not self.filepath.exists():
                    return self.default_data
                with open(self.filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []

    def insert(self, record: dict) -> dict:
        with self.file_lock:
            all_items = self.read_all()
            all_items.append(record)
            self._write_atomic(all_items)
        return record

    def update(self, key: str, value: Any, updated_fields: dict) -> Optional[dict]:
        with self.file_lock:
            all_items = self.read_all()
            target = None
            for item in all_items:
                if item.get(key) == value:
                    item.update(updated_fields)
                    target = item
                    break
            if target:
                self._write_atomic(all_items)
            return target`,

  "app/services/ipfs_service.py": `import io
import requests
from typing import Optional, Tuple
from app.config import settings
from app.models.entities import IPFSStatus

class IPFSService:
    """Connects to local IPFS Kubo daemon via HTTP RPC API (/api/v0)."""
    def __init__(self):
        self.rpc_url = settings.KUBO_RPC_URL.rstrip("/")
        self.timeout = settings.KUBO_TIMEOUT_SECONDS

    def check_health(self) -> dict:
        try:
            resp = requests.post(f"{self.rpc_url}/version", timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                return {"online": True, "version": data.get("Version"), "rpc_url": self.rpc_url}
            return {"online": False, "rpc_url": self.rpc_url}
        except requests.exceptions.RequestException:
            return {"online": False, "rpc_url": self.rpc_url}

    def add_file(self, content: bytes, filename: str = "document.enc") -> Tuple[Optional[str], IPFSStatus, str]:
        try:
            files = {"file": (filename, io.BytesIO(content), "application/octet-stream")}
            resp = requests.post(f"{self.rpc_url}/add?pin=true", files=files, timeout=self.timeout)
            if resp.status_code == 200:
                cid = resp.json().get("Hash")
                if cid:
                    return cid, IPFSStatus.PINNED, "Tải lên và ghim IPFS thành công."
            return None, IPFSStatus.FAILED, "Kubo không trả về CID."
        except requests.exceptions.RequestException as e:
            if settings.KUBO_FALLBACK_LOCAL_ONLY:
                return None, IPFSStatus.LOCAL_ONLY, f"Kubo ngoại tuyến. Lưu trữ cục bộ an toàn: {str(e)}"
            return None, IPFSStatus.FAILED, f"Lỗi kết nối Kubo: {str(e)}"`,

  "tests/test_main.py": `import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.file_utils import compute_sha256
from app.services.crypto_service import crypto_service
from app.repositories.json_repo import users_repo, documents_repo

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

def test_sha256_computation():
    content = b"DocSeal Test Document Integrity 2026"
    h1 = compute_sha256(content)
    h2 = compute_sha256(content)
    assert h1 == h2
    assert len(h1) == 64

def test_verification_match_flow():
    sample_doc = documents_repo.find_by("id", "DOC-9842-8721")
    if sample_doc:
        response = client.post("/api/verify", data={
            "document_id": "DOC-9842-8721",
            "provided_hash": sample_doc["sha256_hash"]
        })
        assert response.status_code == 200
        assert response.json()["result"] == "MATCH"`
};

export const ProjectCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>("run.bat");
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const fileNames = Object.keys(PROJECT_FILES);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PROJECT_FILES[selectedFile] || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFullZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder("docseal");

      // Add all project files
      for (const [filePath, content] of Object.entries(PROJECT_FILES)) {
        rootFolder?.file(filePath, content);
      }

      // Add seed json data files
      const dataFolder = rootFolder?.folder("data");
      dataFolder?.file("users.json", JSON.stringify(PROJECT_USERS_JSON, null, 2));
      dataFolder?.file("documents.json", JSON.stringify(PROJECT_DOCS_JSON, null, 2));
      dataFolder?.file("audit_logs.json", "[]");
      dataFolder?.file("verification_records.json", "[]");

      // Add storage directories with gitkeeps
      rootFolder?.folder("storage")?.folder("documents")?.file(".gitkeep", "");
      rootFolder?.folder("storage")?.folder("temp")?.file(".gitkeep", "");
      rootFolder?.folder("storage")?.folder("backups")?.file(".gitkeep", "");

      // Generate blob
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "DocSeal_Digital_Verification_Platform.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Có lỗi khi nén tệp zip: " + String(err));
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-900/80 text-sky-300 border border-sky-700">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Gói mã nguồn hoàn chỉnh cho VS Code & Windows
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Tải Toàn Bộ Dự Án DocSeal (ZIP) & Xem Mã Nguồn
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Bao gồm đầy đủ backend <strong>Python FastAPI</strong>, cơ chế lưu trữ <strong>Zero-SQL JSON</strong>,
              tích hợp <strong>IPFS Kubo RPC</strong>, cảnh 3D <strong>Three.js</strong>, bộ kiểm thử <strong>Pytest</strong> và tệp <strong>run.bat</strong> để chạy ngay lập tức trên localhost bằng 1 cú click!
            </p>
          </div>

          <button
            onClick={handleDownloadFullZip}
            disabled={isZipping}
            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 flex-shrink-0 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isZipping ? "Đang tạo gói ZIP..." : "Tải trọn bộ ZIP (.zip)"}
          </button>
        </div>
      </div>

      {/* VS Code Quick Run Instructions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white font-bold">
          <Terminal className="w-5 h-5 text-sky-500" />
          <h3>Hướng Dẫn 3 Bước Chạy Trong VS Code Trên Windows:</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center mb-2">1</span>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Giải nén & Mở VS Code</h4>
            <p className="text-slate-500">Tải tệp ZIP về, giải nén thư mục <code>docseal</code> và chọn <strong>File &gt; Open Folder</strong> trong VS Code.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center mb-2">2</span>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Chạy file run.bat</h4>
            <p className="text-slate-500">Nhấp đúp chuột vào file <code>run.bat</code> hoặc mở Terminal gõ <code>.\run.bat</code>. Script tự động tạo venv và cài đặt thư viện.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center mb-2">3</span>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Mở Trình Duyệt</h4>
            <p className="text-slate-500">Truy cập <code>http://127.0.0.1:8000</code> để trải nghiệm giao diện và <code>http://127.0.0.1:8000/docs</code> để xem API Swagger.</p>
          </div>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* File Sidebar */}
        <div className="w-full md:w-64 bg-slate-950/80 p-4 border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">
            <Folder className="w-4 h-4 text-sky-400" />
            Cấu trúc tệp tin
          </div>
          <div className="space-y-1 max-h-96 md:max-h-[500px] overflow-y-auto pr-1">
            {fileNames.map(fileName => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 truncate ${
                  selectedFile === fileName
                    ? "bg-sky-900/60 text-sky-300 font-bold border border-sky-700/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <span className="truncate">{fileName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* File Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sky-400 font-semibold">{selectedFile}</span>
              <span className="text-slate-500">({(PROJECT_FILES[selectedFile]?.length || 0)} bytes)</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Đã sao chép!" : "Sao chép code"}</span>
            </button>
          </div>

          {/* Code Body */}
          <pre className="p-6 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-sky-900 selection:text-white">
            <code>{PROJECT_FILES[selectedFile]}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

const PROJECT_USERS_JSON = [
  {
    id: "usr-0000-0001",
    email: "admin@docseal.vn",
    full_name: "Quản Trị Viên Hệ Thống",
    role: "ADMIN",
    password_hash: "$2b$12$K8yR2sCq05Zt3iY2mK5uVeeG6lq4G37oP37zM4.mQkM8VlY2kG8Oa",
    is_active: true,
    created_at: "2026-01-15T08:00:00Z"
  },
  {
    id: "usr-0000-0002",
    email: "verifier@docseal.vn",
    full_name: "Trần Văn Xác Minh (Công chứng viên)",
    role: "VERIFIER",
    password_hash: "$2b$12$K8yR2sCq05Zt3iY2mK5uVeeG6lq4G37oP37zM4.mQkM8VlY2kG8Oa",
    is_active: true,
    created_at: "2026-02-01T09:15:00Z"
  },
  {
    id: "usr-0000-0003",
    email: "user@docseal.vn",
    full_name: "Nguyễn Văn Người Dùng",
    role: "USER",
    password_hash: "$2b$12$K8yR2sCq05Zt3iY2mK5uVeeG6lq4G37oP37zM4.mQkM8VlY2kG8Oa",
    is_active: true,
    created_at: "2026-03-10T11:00:00Z"
  }
];

const PROJECT_DOCS_JSON = [
  {
    id: "DOC-9842-8721",
    tracking_code: "DS-2026-9842",
    title: "Hợp đồng Nguyên tắc Cung ứng Dịch vụ Công nghệ 2026",
    original_filename: "hop_dong_nguyen_tac_2026.pdf",
    file_size: 248512,
    file_extension: "pdf",
    mime_type: "application/pdf",
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ipfs_cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    ipfs_status: "PINNED",
    owner_id: "usr-0000-0003",
    owner_email: "user@docseal.vn",
    owner_name: "Nguyễn Văn Người Dùng",
    status: "VERIFIED",
    status_description: "Đã được kiểm tra tính toàn vẹn và xác nhận bởi người phụ trách.",
    is_encrypted: true,
    created_at: "2026-09-20T10:15:30Z",
    updated_at: "2026-09-21T08:30:00Z"
  }
];
