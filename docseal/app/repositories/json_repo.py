import json
import os
import shutil
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from app.config import settings

class JSONRepository:
    """
    Zero-SQL Thread-safe JSON Persistence Engine.
    Uses atomic writes (temp file + rename/replace) and threading.Lock
    to ensure durability, zero data loss, and ACID-like isolation on file storage.
    """
    _locks: dict[str, threading.Lock] = {}
    _global_lock = threading.Lock()

    def __init__(self, filename: str, default_data: Optional[list] = None):
        self.filepath: Path = settings.DATA_DIR / filename
        self.filename = filename
        self.default_data = default_data if default_data is not None else []
        
        # Ensure per-file lock
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
        """Writes data to a temporary file in storage/temp then atomically replaces target."""
        temp_file = settings.TEMP_DIR / f"{self.filename}.{os.getpid()}.{threading.get_ident()}.tmp"
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(temp_file, self.filepath)
        finally:
            if temp_file.exists():
                try:
                    temp_file.unlink()
                except OSError:
                    pass

    def read_all(self) -> list[dict]:
        with self.file_lock:
            try:
                if not self.filepath.exists():
                    return self.default_data
                with open(self.filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                # Attempt to read backup if corrupt
                backup_files = sorted(settings.BACKUP_DIR.glob(f"{self.filename}.*.bak"), reverse=True)
                if backup_files:
                    try:
                        with open(backup_files[0], "r", encoding="utf-8") as bf:
                            recovered = json.load(bf)
                            self._write_atomic(recovered)
                            return recovered
                    except Exception:
                        pass
                return []

    def write_all(self, data: list[dict]):
        with self.file_lock:
            self._write_atomic(data)

    def find_by(self, key: str, value: Any) -> Optional[dict]:
        all_items = self.read_all()
        for item in all_items:
            if item.get(key) == value:
                return item
        return None

    def find_all_by(self, key: str, value: Any) -> list[dict]:
        all_items = self.read_all()
        return [item for item in all_items if item.get(key) == value]

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
            return target

    def delete(self, key: str, value: Any) -> bool:
        with self.file_lock:
            all_items = self.read_all()
            new_items = [item for item in all_items if item.get(key) != value]
            if len(new_items) != len(all_items):
                self._write_atomic(new_items)
                return True
            return False

    def create_backup(self) -> Path:
        """Creates an immediate snapshot backup file in storage/backups/"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_path = settings.BACKUP_DIR / f"{self.filename}.{timestamp}.bak"
        with self.file_lock:
            if self.filepath.exists():
                shutil.copy2(self.filepath, backup_path)
        return backup_path

# Repositories instances for the entities
users_repo = JSONRepository("users.json")
documents_repo = JSONRepository("documents.json")
audit_repo = JSONRepository("audit_logs.json")
verifications_repo = JSONRepository("verification_records.json")
notifications_repo = JSONRepository("notifications.json")
