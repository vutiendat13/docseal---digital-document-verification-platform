import hashlib
import os
import re
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.config import settings

def sanitize_filename(filename: str) -> str:
    """Removes path separators and dangerous characters from user filenames."""
    filename = os.path.basename(filename)
    filename = re.sub(r"[^\w\s\.-]", "_", filename).strip()
    return filename or "unnamed_document"

def validate_file_upload(file: UploadFile) -> str:
    """Validates file extension and mime type."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tên file không hợp lệ.")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Định dạng file '.{ext}' không được hỗ trợ. Chỉ chấp nhận: {', '.join(settings.ALLOWED_EXTENSIONS)}."
        )
    return ext

def compute_sha256(content: bytes) -> str:
    """Computes SHA-256 hash string for raw bytes."""
    hasher = hashlib.sha256()
    hasher.update(content)
    return hasher.hexdigest()

def compute_stream_sha256(file_path: Path) -> str:
    """Computes SHA-256 reading in 64KB blocks for memory efficiency."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()
