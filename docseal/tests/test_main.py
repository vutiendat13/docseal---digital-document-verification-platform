import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.file_utils import compute_sha256
from app.services.crypto_service import crypto_service
from app.repositories.json_repo import users_repo, documents_repo

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["database_type"] == "JSON_PERSISTENCE (Zero-SQL)"

def test_sha256_computation():
    content = b"DocSeal Test Document Integrity 2026"
    h1 = compute_sha256(content)
    h2 = compute_sha256(content)
    assert h1 == h2
    assert len(h1) == 64
    # Different content produces different hash
    assert h1 != compute_sha256(content + b"_altered")

def test_crypto_fernet_roundtrip():
    plain_text = b"Confidential Notarized Contract Content"
    encrypted = crypto_service.encrypt_data(plain_text)
    assert encrypted != plain_text
    decrypted = crypto_service.decrypt_data(encrypted)
    assert decrypted == plain_text

def test_verification_not_found():
    response = client.post("/api/verify", data={"document_id": "DOC-NON-EXISTENT-9999"})
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "NOT_FOUND"
    assert data["document_found"] is False

def test_verification_match_flow():
    # Test against existing sample doc DOC-9842-8721
    sample_doc = documents_repo.find_by("id", "DOC-9842-8721")
    if sample_doc:
        expected_hash = sample_doc["sha256_hash"]
        response = client.post("/api/verify", data={
            "document_id": "DOC-9842-8721",
            "provided_hash": expected_hash
        })
        assert response.status_code == 200
        data = response.json()
        assert data["hashes_match"] is True
        assert data["result"] == "MATCH"

def test_verification_mismatch_flow():
    response = client.post("/api/verify", data={
        "document_id": "DOC-9842-8721",
        "provided_hash": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["hashes_match"] is False
    assert data["result"] == "MISMATCH"

def test_user_persistence():
    admin = users_repo.find_by("email", "admin@docseal.vn")
    assert admin is not None
    assert admin["role"] == "ADMIN"
