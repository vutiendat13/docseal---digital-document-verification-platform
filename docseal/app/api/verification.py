from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from app.models.schemas import VerificationResponse
from app.services.document_service import document_service
from app.repositories.json_repo import verifications_repo, documents_repo

router = APIRouter(prefix="/api/verify", tags=["Verification"])

@router.post("", response_model=VerificationResponse)
async def verify_document(
    request: Request,
    document_id: Optional[str] = Form(None),
    provided_hash: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    file_bytes = None
    if file:
        file_bytes = await file.read()

    result = document_service.verify_document_integrity(
        document_id=document_id,
        provided_file_bytes=file_bytes,
        provided_hash=provided_hash,
        client_ip=client_ip
    )

    return VerificationResponse(**result)

@router.get("/{record_id}")
def get_verification_record(record_id: str):
    rec = verifications_repo.find_by("id", record_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bản ghi xác minh.")
    return rec

@router.get("/lookup/{document_id}")
def public_document_lookup(document_id: str):
    doc = documents_repo.find_by("id", document_id)
    if not doc:
        doc = documents_repo.find_by("tracking_code", document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy hồ sơ.")

    # Return safe public metadata only (exclude owner details)
    return {
        "id": doc["id"],
        "tracking_code": doc["tracking_code"],
        "title": doc["title"],
        "original_filename": doc["original_filename"],
        "file_size": doc["file_size"],
        "file_extension": doc["file_extension"],
        "sha256_hash": doc["sha256_hash"],
        "ipfs_cid": doc.get("ipfs_cid"),
        "ipfs_status": doc.get("ipfs_status"),
        "status": doc["status"],
        "status_description": doc.get("status_description"),
        "created_at": doc["created_at"],
        "verified_at": doc.get("verified_at"),
        "verifier_name": doc.get("verifier_name"),
        "verifier_notes": doc.get("verifier_notes")
    }
