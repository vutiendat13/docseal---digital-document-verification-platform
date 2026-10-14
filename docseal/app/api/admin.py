import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.config import settings
from app.models.entities import User, UserRole, DocumentStatus, HistoryEvent
from app.models.schemas import AdminStatsResponse, UserStatusUpdateRequest, DocumentApprovalRequest, DocumentRejectRequest
from app.repositories.json_repo import users_repo, documents_repo, audit_repo, verifications_repo
from app.security.permissions import require_admin, require_verifier_or_admin
from app.services.audit_service import audit_service
from app.services.storage_service import storage_service
from app.services.ipfs_service import ipfs_service

router = APIRouter(prefix="/api/admin", tags=["Administration & Verification"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_system_stats(current_user: User = Depends(require_admin)):
    users = users_repo.read_all()
    docs = documents_repo.read_all()
    vers = verifications_repo.read_all()

    total_size = sum(
        f.stat().st_size
        for f in settings.DOCS_DIR.glob("**/*")
        if f.is_file() and not f.name.startswith(".")
    )

    ipfs_health = ipfs_service.check_health()

    return AdminStatsResponse(
        total_users=len(users),
        total_documents=len(docs),
        verified_documents=len([d for d in docs if d.get("status") == DocumentStatus.VERIFIED.value]),
        pending_documents=len([d for d in docs if d.get("status") == DocumentStatus.PENDING.value]),
        rejected_documents=len([d for d in docs if d.get("status") == DocumentStatus.REJECTED.value]),
        ipfs_pinned_count=len([d for d in docs if d.get("ipfs_cid")]),
        total_verifications=len(vers),
        storage_size_bytes=total_size,
        ipfs_status="ONLINE" if ipfs_health.get("online") else "OFFLINE"
    )

@router.get("/users")
def get_all_users(current_user: User = Depends(require_admin)):
    all_users = users_repo.read_all()
    # Strip password hashes
    safe = []
    for u in all_users:
        item = dict(u)
        item.pop("password_hash", None)
        safe.append(item)
    return safe

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    req: UserStatusUpdateRequest,
    request: Request,
    current_user: User = Depends(require_admin)
):
    target_user = users_repo.find_by("id", user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")

    if target_user["id"] == current_user.id and not req.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tự khóa tài khoản quản trị của chính mình.")

    updates = {"is_active": req.is_active}
    if req.role:
        updates["role"] = req.role.value

    updated = users_repo.update("id", user_id, updates)
    client_ip = request.client.host if request.client else "127.0.0.1"

    audit_service.log_action(
        user_email=current_user.email,
        action="USER_STATUS_CHANGE",
        ip_address=client_ip,
        details=f"Cập nhật trạng thái người dùng {target_user['email']}: active={req.is_active}, role={updates.get('role', target_user.get('role'))}"
    )

    safe = dict(updated)
    safe.pop("password_hash", None)
    return safe

@router.get("/audit-logs")
def get_audit_logs(current_user: User = Depends(require_admin), limit: int = 100):
    return audit_service.get_recent_logs(limit=limit)

@router.post("/documents/{document_id}/approve")
def approve_document(
    document_id: str,
    req: DocumentApprovalRequest,
    request: Request,
    current_user: User = Depends(require_verifier_or_admin)
):
    doc = documents_repo.find_by("id", document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ.")

    # Guard: Uploader cannot verify their own document
    if doc.get("owner_id") == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quy tắc độc lập: Người nộp hồ sơ không được phép tự phê duyệt hồ sơ của chính mình."
        )

    now_iso = datetime.utcnow().isoformat() + "Z"
    history = doc.get("history", [])
    history.append({
        "timestamp": now_iso,
        "action": "VERIFIED_APPROVED",
        "actor": current_user.email,
        "notes": req.notes or "Đã phê duyệt tính toàn vẹn hồ sơ."
    })

    updated = documents_repo.update(
        "id",
        document_id,
        {
            "status": DocumentStatus.VERIFIED.value,
            "status_description": "Hồ sơ đã được thẩm định và xác nhận tính toàn vẹn thành công.",
            "verifier_id": current_user.id,
            "verifier_name": current_user.full_name,
            "verifier_notes": req.notes,
            "verified_at": now_iso,
            "updated_at": now_iso,
            "history": history
        }
    )

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit_service.log_action(
        user_email=current_user.email,
        action="DOCUMENT_APPROVE",
        document_id=document_id,
        ip_address=client_ip,
        details=f"Phê duyệt hồ sơ {document_id}. Ghi chú: {req.notes}"
    )

    return {"message": "Hồ sơ đã được phê duyệt thành công.", "document": updated}

@router.post("/documents/{document_id}/reject")
def reject_document(
    document_id: str,
    req: DocumentRejectRequest,
    request: Request,
    current_user: User = Depends(require_verifier_or_admin)
):
    doc = documents_repo.find_by("id", document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ.")

    if doc.get("owner_id") == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Người nộp hồ sơ không được phép can thiệp quy trình thẩm định của chính mình."
        )

    now_iso = datetime.utcnow().isoformat() + "Z"
    history = doc.get("history", [])
    history.append({
        "timestamp": now_iso,
        "action": "VERIFIED_REJECTED",
        "actor": current_user.email,
        "notes": f"Từ chối: {req.reason}"
    })

    updated = documents_repo.update(
        "id",
        document_id,
        {
            "status": DocumentStatus.REJECTED.value,
            "status_description": f"Hồ sơ bị từ chối: {req.reason}",
            "verifier_id": current_user.id,
            "verifier_name": current_user.full_name,
            "verifier_notes": req.reason,
            "updated_at": now_iso,
            "history": history
        }
    )

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit_service.log_action(
        user_email=current_user.email,
        action="DOCUMENT_REJECT",
        document_id=document_id,
        ip_address=client_ip,
        details=f"Từ chối hồ sơ {document_id}. Lý do: {req.reason}"
    )

    return {"message": "Hồ sơ đã được cập nhật trạng thái từ chối.", "document": updated}

@router.post("/backup")
def trigger_backup(request: Request, current_user: User = Depends(require_admin)):
    backup_file = storage_service.create_full_backup()
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit_service.log_action(
        user_email=current_user.email,
        action="BACKUP_CREATED",
        ip_address=client_ip,
        details=f"Tạo bản sao lưu dữ liệu toàn diện: {backup_file}"
    )
    return {"message": "Sao lưu dữ liệu JSON thành công.", "backup_file": backup_file}

@router.get("/ipfs-status")
def check_ipfs(current_user: User = Depends(require_admin)):
    return ipfs_service.check_health()
