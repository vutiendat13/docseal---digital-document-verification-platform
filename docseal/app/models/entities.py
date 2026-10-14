from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    VERIFIER = "VERIFIER"
    USER = "USER"

class DocumentStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class IPFSStatus(str, Enum):
    PINNED = "PINNED"
    PENDING = "PENDING"
    FAILED = "FAILED"
    LOCAL_ONLY = "LOCAL_ONLY"

class VerificationResultType(str, Enum):
    MATCH = "MATCH"
    MISMATCH = "MISMATCH"
    NOT_FOUND = "NOT_FOUND"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    IPFS_UNAVAILABLE = "IPFS_UNAVAILABLE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"

class HistoryEvent(BaseModel):
    timestamp: str
    action: str
    actor: str
    notes: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole = UserRole.USER
    password_hash: str
    is_active: bool = True
    created_at: str
    last_login: Optional[str] = None

class Document(BaseModel):
    id: str
    tracking_code: str
    title: str
    original_filename: str
    file_size: int
    file_extension: str
    mime_type: str
    sha256_hash: str
    ipfs_cid: Optional[str] = None
    ipfs_status: IPFSStatus = IPFSStatus.LOCAL_ONLY
    owner_id: str
    owner_email: str
    owner_name: str
    status: DocumentStatus = DocumentStatus.PENDING
    status_description: str = "Hồ sơ đang chờ người có thẩm quyền tiếp nhận và xác minh."
    is_encrypted: bool = True
    storage_path: Optional[str] = None
    verifier_id: Optional[str] = None
    verifier_name: Optional[str] = None
    verifier_notes: Optional[str] = None
    created_at: str
    updated_at: str
    verified_at: Optional[str] = None
    history: list[HistoryEvent] = Field(default_factory=list)

class AuditLog(BaseModel):
    id: str
    timestamp: str
    user_email: str
    action: str
    document_id: Optional[str] = None
    ip_address: str = "127.0.0.1"
    status: str = "SUCCESS"
    details: str

class VerificationRecord(BaseModel):
    id: str
    timestamp: str
    document_id: Optional[str] = None
    result: VerificationResultType
    provided_hash: Optional[str] = None
    recorded_hash: Optional[str] = None
    ipfs_cid: Optional[str] = None
    verifier_status: Optional[str] = None
    client_ip: str = "127.0.0.1"
    notes: Optional[str] = None
