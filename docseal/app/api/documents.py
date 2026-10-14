from io import BytesIO
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from app.config import settings
from app.models.entities import User, UserRole, DocumentStatus
from app.models.schemas import DocumentCreateResponse, DocumentDetailResponse
from app.repositories.json_repo import documents_repo
from app.security.auth import get_current_user
from app.services.document_service import document_service
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service
from app.utils.file_utils import validate_file_upload
from app.utils.qr_generator import generate_qr_base64

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("", response_model=list[dict])
def list_documents(
    current_user: User = Depends(get_current_user),
    search: str = "",
    status_filter: str = ""
):
    all_docs = documents_repo.read_all()
    # If standard user, only return owned documents
    if current_user.role == UserRole.USER:
        filtered = [d for d in all_docs if d.get("owner_id") == current_user.id]
    else:
        filtered = all_docs

    if search:
        s = search.lower().strip()
        filtered = [
            d for d in filtered
            if s in d.get("id", "").lower()
            or s in d.get("tracking_code", "").lower()
            or s in d.get("title", "").lower()
            or s in d.get("original_filename", "").lower()
        ]

    if status_filter:
        filtered = [d for d in filtered if d.get("status") == status_filter]

    # Return descending by created_at
    return sorted(filtered, key=lambda x: x.get("created_at", ""), reverse=True)

@router.post("/upload", response_model=DocumentCreateResponse)
async def upload_document(
    request: Request,
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    validate_file_upload(file)

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Dung lượng tệp vượt quá giới hạn tối đa ({settings.MAX_UPLOAD_SIZE_MB}MB)."
        )

    doc = document_service.create_document(
        file_content=content,
        original_filename=file.filename,
        title=title,
        owner_id=current_user.id,
        owner_email=current_user.email,
        owner_name=current_user.full_name,
        client_ip=client_ip
    )

    qr_url = f"http://127.0.0.1:8000/verify/{doc.id}"
    qr_data = generate_qr_base64(qr_url)

    return DocumentCreateResponse(
        id=doc.id,
        tracking_code=doc.tracking_code,
        title=doc.title,
        original_filename=doc.original_filename,
        sha256_hash=doc.sha256_hash,
        ipfs_cid=doc.ipfs_cid,
        ipfs_status=doc.ipfs_status.value,
        status=doc.status,
        created_at=doc.created_at,
        qr_code_url=qr_data
    )

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_detail(document_id: str, current_user: User = Depends(get_current_user)):
    doc = documents_repo.find_by("id", document_id)
    if not doc:
        doc = documents_repo.find_by("tracking_code", document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ.")

    # Access control: users can only see their own docs, verifier/admin can see all
    if current_user.role == UserRole.USER and doc.get("owner_id") != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xem hồ sơ này.")

    qr_url = f"http://127.0.0.1:8000/verify/{doc['id']}"
    qr_data = generate_qr_base64(qr_url)

    return DocumentDetailResponse(
        id=doc["id"],
        tracking_code=doc["tracking_code"],
        title=doc["title"],
        original_filename=doc["original_filename"],
        file_size=doc["file_size"],
        file_extension=doc["file_extension"],
        mime_type=doc.get("mime_type", "application/octet-stream"),
        sha256_hash=doc["sha256_hash"],
        ipfs_cid=doc.get("ipfs_cid"),
        ipfs_status=doc.get("ipfs_status", "LOCAL_ONLY"),
        owner_id=doc["owner_id"],
        owner_name=doc.get("owner_name", "N/A"),
        owner_email=doc.get("owner_email", "N/A"),
        status=doc["status"],
        status_description=doc.get("status_description", ""),
        is_encrypted=doc.get("is_encrypted", True),
        verifier_name=doc.get("verifier_name"),
        verifier_notes=doc.get("verifier_notes"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        verified_at=doc.get("verified_at"),
        qr_code_url=qr_data,
        history=doc.get("history", [])
    )

@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    doc = documents_repo.find_by("id", document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ.")

    if current_user.role == UserRole.USER and doc.get("owner_id") != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền tải tệp này.")

    storage_path = doc.get("storage_path")
    if not storage_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tệp lưu trữ trên hệ thống.")

    decrypted_bytes = storage_service.read_and_decrypt_file(storage_path)
    if not decrypted_bytes:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể giải mã hoặc đọc tệp tin.")

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit_service.log_action(
        user_email=current_user.email,
        action="DOCUMENT_DOWNLOAD",
        document_id=doc["id"],
        ip_address=client_ip,
        details=f"Tải xuống tệp {doc.get('original_filename')}"
    )

    filename = doc.get("original_filename", "document.pdf")
    return StreamingResponse(
        BytesIO(decrypted_bytes),
        media_type=doc.get("mime_type", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{document_id}/qr")
def get_qr_image(document_id: str):
    doc = documents_repo.find_by("id", document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hồ sơ không tồn tại.")
    qr_url = f"http://127.0.0.1:8000/verify/{doc['id']}"
    qr_data = generate_qr_base64(qr_url)
    return {"document_id": doc["id"], "qr_code": qr_data, "verification_url": qr_url}
