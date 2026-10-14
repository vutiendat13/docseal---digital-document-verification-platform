import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "DocSeal"
    APP_ENV: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # JWT Security
    SECRET_KEY: str = "docseal-super-secret-development-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Symmetric encryption key for sensitive document storage (AES-256 Fernet base64)
    DATA_ENCRYPTION_KEY: str = "dGhpcy1pcy1hLXNlY3VyZS0zMi1ieXRlLWtleS1mb3ItZG9jc2VhbDE="

    # IPFS Kubo RPC API configuration
    KUBO_RPC_URL: str = "http://127.0.0.1:5001/api/v0"
    KUBO_TIMEOUT_SECONDS: int = 10
    KUBO_FALLBACK_LOCAL_ONLY: bool = True

    # Uploads & Storage
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: list[str] = ["pdf", "docx", "txt", "png", "jpg", "jpeg"]

    # Directories
    DATA_DIR: Path = BASE_DIR / "data"
    STORAGE_DIR: Path = BASE_DIR / "storage"
    DOCS_DIR: Path = BASE_DIR / "storage" / "documents"
    TEMP_DIR: Path = BASE_DIR / "storage" / "temp"
    BACKUP_DIR: Path = BASE_DIR / "storage" / "backups"

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
for directory in [settings.DATA_DIR, settings.STORAGE_DIR, settings.DOCS_DIR, settings.TEMP_DIR, settings.BACKUP_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
