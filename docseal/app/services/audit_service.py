import uuid
from datetime import datetime
from typing import Optional
from app.repositories.json_repo import audit_repo
from app.models.entities import AuditLog

class AuditService:
    @staticmethod
    def log_action(
        user_email: str,
        action: str,
        details: str,
        document_id: Optional[str] = None,
        ip_address: str = "127.0.0.1",
        status: str = "SUCCESS"
    ) -> AuditLog:
        """Appends a tamper-evident audit record to audit_logs.json."""
        log_entry = AuditLog(
            id=f"log-{uuid.uuid4().hex[:8]}",
            timestamp=datetime.utcnow().isoformat() + "Z",
            user_email=user_email,
            action=action,
            document_id=document_id,
            ip_address=ip_address,
            status=status,
            details=details
        )
        audit_repo.insert(log_entry.model_dump())
        return log_entry

    @staticmethod
    def get_recent_logs(limit: int = 100) -> list[dict]:
        logs = audit_repo.read_all()
        # Sort descending by timestamp
        return sorted(logs, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]

audit_service = AuditService()
