import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple
from app.config import settings
from app.services.crypto_service import crypto_service

class StorageService:
    @staticmethod
    def save_encrypted_file(content: bytes, extension: str) -> Tuple[str, Path]:
        """Encrypts content and saves to storage/documents/ with UUID."""
        file_id = f"doc_{uuid.uuid4().hex}"
        target_path = settings.DOCS_DIR / f"{file_id}.enc"
        encrypted_bytes = crypto_service.encrypt_data(content)
        with open(target_path, "wb") as f:
            f.write(encrypted_bytes)
        return str(target_path.relative_to(settings.BASE_DIR)), target_path

    @staticmethod
    def read_and_decrypt_file(storage_rel_path: str) -> Optional[bytes]:
        """Reads encrypted document from disk and decrypts it."""
        abs_path = settings.BASE_DIR / storage_rel_path
        # Path traversal guard
        try:
            abs_path.resolve().relative_to(settings.STORAGE_DIR.resolve())
        except ValueError:
            return None
            
        if not abs_path.exists():
            return None
        try:
            with open(abs_path, "rb") as f:
                encrypted_bytes = f.read()
            return crypto_service.decrypt_data(encrypted_bytes)
        except Exception:
            return None

    @staticmethod
    def create_full_backup() -> str:
        """Creates a timestamped zip archive of data and storage inside storage/backups/"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"docseal_backup_{timestamp}"
        backup_dest = settings.BACKUP_DIR / backup_filename
        
        # Temp archive folder
        temp_backup_dir = settings.TEMP_DIR / f"backup_{timestamp}"
        temp_backup_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Copy data dir
            shutil.copytree(settings.DATA_DIR, temp_backup_dir / "data", dirs_exist_ok=True)
            # Create zip archive
            archive_path = shutil.make_archive(str(backup_dest), "zip", temp_backup_dir)
            return Path(archive_path).name
        finally:
            if temp_backup_dir.exists():
                shutil.rmtree(temp_backup_dir, ignore_errors=True)

storage_service = StorageService()
