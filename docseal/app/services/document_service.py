import uuid
from datetime import datetime
from typing import Optional, Tuple
from app.models.entities import (
    Document, DocumentStatus, IPFSStatus, HistoryEvent,
    VerificationResultType, VerificationRecord
)
from app.repositories.json_repo import documents_repo, verifications_repo
from app.services.ipfs_service import ipfs_service
from app.services.crypto_service import crypto_service
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service
from app.utils.file_utils import compute_sha256, sanitize_filename
from app.utils.qr_generator import generate_qr_base64

LEGAL_DISCLAIMER = (
    "LƯU Ý TRUNG THỰC VỀ PHÁP LÝ & CÔNG CHỨNG: Kết quả này xác nhận tính toàn vẹn kỹ thuật (SHA-256) "
    "và lịch sử ghi nhận hồ sơ trên nền tảng DocSeal cùng mạng IPFS. Kết quả này không tự động thay thế cho văn bản "
    "công chứng có giá trị pháp lý theo Luật Công chứng hiện hành nếu chưa qua quy trình ký số với chứng thư số chuyên dùng "
    "của tổ chức hành nghề công chứng được cấp phép."
)

class DocumentService:
    @staticmethod
    def create_document(
        file_content: bytes,
        original_filename: str,
        title: str,
        owner_id: str,
        owner_email: str,
        owner_name: str,
        client_ip: str = "127.0.0.1"
    ) -> Document:
        clean_filename = sanitize_filename(original_filename)
        ext = clean_filename.split(".")[-1].lower() if "." in clean_filename else "bin"
        file_size = len(file_content)
        sha256_hash = compute_sha256(file_content)

        doc_id = f"DOC-{uuid.uuid4().hex[:4].upper()}-{uuid.uuid4().hex[4:8].upper()}"
        tracking_code = f"DS-2026-{uuid.uuid4().hex[:4].upper()}"
        now_iso = datetime.utcnow().isoformat() + "Z"

        # 1. Save encrypted file to disk
        storage_rel_path, _ = storage_service.save_encrypted_file(file_content, ext)

        # 2. Upload encrypted payload to IPFS Kubo
        encrypted_bytes = crypto_service.encrypt_data(file_content)
        cid, ipfs_status, ipfs_msg = ipfs_service.add_file(encrypted_bytes, f"{doc_id}.enc")

        history = [
            HistoryEvent(
                timestamp=now_iso,
                action="UPLOAD_RECORDED",
                actor=owner_email,
                notes=f"Tiếp nhận hồ sơ '{title}' ({file_size} bytes). SHA-256: {sha256_hash[:16]}..."
            )
        ]

        if cid:
            history.append(
                HistoryEvent(
                    timestamp=now_iso,
                    action="IPFS_PINNED",
                    actor="IPFS Kubo Daemon",
                    notes=f"Đã lưu trữ nội dung mã hóa lên IPFS với CID: {cid}"
                )
            )

        doc = Document(
            id=doc_id,
            tracking_code=tracking_code,
            title=title or clean_filename,
            original_filename=clean_filename,
            file_size=file_size,
            file_extension=ext,
            mime_type="application/pdf" if ext == "pdf" else "application/octet-stream",
            sha256_hash=sha256_hash,
            ipfs_cid=cid,
            ipfs_status=ipfs_status,
            owner_id=owner_id,
            owner_email=owner_email,
            owner_name=owner_name,
            status=DocumentStatus.PENDING,
            status_description="Hồ sơ mới tạo, đang chờ kiểm tra và xác nhận bởi người có thẩm quyền.",
            is_encrypted=True,
            storage_path=storage_rel_path,
            created_at=now_iso,
            updated_at=now_iso,
            history=history
        )

        documents_repo.insert(doc.model_dump())

        # Audit log
        audit_service.log_action(
            user_email=owner_email,
            action="DOCUMENT_UPLOAD",
            document_id=doc_id,
            ip_address=client_ip,
            details=f"Tải lên '{clean_filename}'. CID: {cid or 'NONE (Local Only)'}."
        )

        return doc

    @staticmethod
    def verify_document_integrity(
        document_id: Optional[str] = None,
        provided_file_bytes: Optional[bytes] = None,
        provided_hash: Optional[str] = None,
        client_ip: str = "127.0.0.1"
    ) -> dict:
        """
        Full 7-step verification workflow:
        1. Check if document exists
        2. Read recorded metadata from JSON
        3. Recompute SHA-256 from uploaded file or use provided hash
        4. Compare computed hash with recorded hash
        5. Verify IPFS CID integrity if available
        6. Determine approval state
        7. Return structured verification response with legal honesty disclaimer
        """
        record_id = f"ver-{uuid.uuid4().hex[:8]}"
        now_iso = datetime.utcnow().isoformat() + "Z"

        if not document_id:
            res = {
                "record_id": record_id,
                "result": VerificationResultType.NOT_FOUND.value,
                "message": "Không tìm thấy hồ sơ: Mã hồ sơ không được cung cấp.",
                "document_found": False,
                "document_id": None,
                "title": None,
                "provided_hash": provided_hash,
                "recorded_hash": None,
                "hashes_match": False,
                "ipfs_cid": None,
                "ipfs_verified": False,
                "approval_status": None,
                "recorded_at": None,
                "verified_by": None,
                "legal_disclaimer": LEGAL_DISCLAIMER
            }
            return res

        # 1 & 2. Find document
        doc_data = documents_repo.find_by("id", document_id.strip())
        if not doc_data:
            # Try finding by tracking code
            doc_data = documents_repo.find_by("tracking_code", document_id.strip())

        if not doc_data:
            res = {
                "record_id": record_id,
                "result": VerificationResultType.NOT_FOUND.value,
                "message": f"Không tìm thấy hồ sơ có mã định danh '{document_id}' trong hệ thống.",
                "document_found": False,
                "document_id": document_id,
                "title": None,
                "provided_hash": provided_hash,
                "recorded_hash": None,
                "hashes_match": False,
                "ipfs_cid": None,
                "ipfs_verified": False,
                "approval_status": None,
                "recorded_at": None,
                "verified_by": None,
                "legal_disclaimer": LEGAL_DISCLAIMER
            }
            return res

        recorded_hash = doc_data.get("sha256_hash")
        computed_hash = compute_sha256(provided_file_bytes) if provided_file_bytes else (provided_hash or "").lower().strip()
        ipfs_cid = doc_data.get("ipfs_cid")
        doc_status = doc_data.get("status")

        hashes_match = False
        ipfs_verified = False

        if computed_hash:
            hashes_match = (computed_hash == recorded_hash.lower())

        # Check IPFS status if CID exists
        if ipfs_cid:
            # Test Kubo retrieval
            cid_bytes, _ = ipfs_service.get_file(ipfs_cid)
            if cid_bytes:
                # Decrypt and verify hash from IPFS
                try:
                    decrypted_ipfs = crypto_service.decrypt_data(cid_bytes)
                    ipfs_hash = compute_sha256(decrypted_ipfs)
                    if ipfs_hash.lower() == recorded_hash.lower():
                        ipfs_verified = True
                except Exception:
                    pass

        # Determine overall result status
        if computed_hash and not hashes_match:
            result_type = VerificationResultType.MISMATCH
            message = "CẢNH BÁO: Nội dung tệp tin đối chiếu KHÔNG KHỚP với bản gốc đã ghi nhận trong hồ sơ!"
        elif not computed_hash:
            result_type = VerificationResultType.MATCH if doc_status == DocumentStatus.VERIFIED.value else VerificationResultType.PENDING_APPROVAL
            message = "Đã tìm thấy thông tin hồ sơ. Chưa cung cấp tệp tin tải lên để đối chiếu toàn vẹn trực tiếp."
        elif hashes_match:
            if doc_status == DocumentStatus.VERIFIED.value:
                result_type = VerificationResultType.MATCH
                message = "XÁC MINH THÀNH CÔNG: Dấu vân tay SHA-256 hoàn toàn trùng khớp với bản đã ghi nhận và đã được phê duyệt."
            elif doc_status == DocumentStatus.PENDING.value:
                result_type = VerificationResultType.PENDING_APPROVAL
                message = "Nội dung tệp khớp với bản lưu trữ ban đầu, tuy nhiên hồ sơ CHƯA ĐƯỢC người có thẩm quyền phê duyệt."
            else:
                result_type = VerificationResultType.MISMATCH
                message = "Tệp tin khớp với bản lưu, nhưng hồ sơ đã bị TỪ CHỐI bởi người thẩm định."
        else:
            result_type = VerificationResultType.INSUFFICIENT_DATA
            message = "Chưa đủ dữ liệu để đưa ra kết luận xác minh."

        # Save verification record
        v_record = VerificationRecord(
            id=record_id,
            timestamp=now_iso,
            document_id=doc_data["id"],
            result=result_type,
            provided_hash=computed_hash or None,
            recorded_hash=recorded_hash,
            ipfs_cid=ipfs_cid,
            verifier_status=doc_status,
            client_ip=client_ip,
            notes=message
        )
        verifications_repo.insert(v_record.model_dump())

        return {
            "record_id": record_id,
            "result": result_type.value,
            "message": message,
            "document_found": True,
            "document_id": doc_data["id"],
            "title": doc_data.get("title"),
            "provided_hash": computed_hash or None,
            "recorded_hash": recorded_hash,
            "hashes_match": hashes_match,
            "ipfs_cid": ipfs_cid,
            "ipfs_verified": ipfs_verified,
            "approval_status": doc_status,
            "recorded_at": doc_data.get("created_at"),
            "verified_by": doc_data.get("verifier_name"),
            "legal_disclaimer": LEGAL_DISCLAIMER
        }

document_service = DocumentService()
