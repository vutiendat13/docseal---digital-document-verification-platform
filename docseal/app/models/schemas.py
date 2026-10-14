from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.entities import UserRole, DocumentStatus, VerificationResultType

# Auth Schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: str
    last_login: Optional[str] = None

# Document Schemas
class DocumentCreateResponse(BaseModel):
    id: str
    tracking_code: str
    title: str
    original_filename: str
    sha256_hash: str
    ipfs_cid: Optional[str] = None
    ipfs_status: str
    status: DocumentStatus
    created_at: str
    qr_code_url: str

class DocumentDetailResponse(BaseModel):
    id: str
    tracking_code: str
    title: str
    original_filename: str
    file_size: int
    file_extension: str
    mime_type: str
    sha256_hash: str
    ipfs_cid: Optional[str] = None
    ipfs_status: str
    owner_id: str
    owner_name: str
    owner_email: str
    status: DocumentStatus
    status_description: str
    is_encrypted: bool
    verifier_name: Optional[str] = None
    verifier_notes: Optional[str] = None
    created_at: str
    updated_at: str
    verified_at: Optional[str] = None
    qr_code_url: str
    history: list[dict]

class DocumentApprovalRequest(BaseModel):
    notes: Optional[str] = "Đã kiểm tra tính toàn vẹn và thông tin hồ sơ."

class DocumentRejectRequest(BaseModel):
    reason: str

# Verification Schemas
class VerifyRequest(BaseModel):
    document_id: Optional[str] = None
    provided_hash: Optional[str] = None

class VerificationResponse(BaseModel):
    record_id: str
    result: VerificationResultType
    message: str
    document_found: bool
    document_id: Optional[str] = None
    title: Optional[str] = None
    provided_hash: Optional[str] = None
    recorded_hash: Optional[str] = None
    hashes_match: bool
    ipfs_cid: Optional[str] = None
    ipfs_verified: bool
    approval_status: Optional[str] = None
    recorded_at: Optional[str] = None
    verified_by: Optional[str] = None
    legal_disclaimer: str

# Admin Schemas
class AdminStatsResponse(BaseModel):
    total_users: int
    total_documents: int
    verified_documents: int
    pending_documents: int
    rejected_documents: int
    ipfs_pinned_count: int
    total_verifications: int
    storage_size_bytes: int
    ipfs_status: str

class UserStatusUpdateRequest(BaseModel):
    is_active: bool
    role: Optional[UserRole] = None
