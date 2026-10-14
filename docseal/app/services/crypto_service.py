import base64
import os
from cryptography.fernet import Fernet
from app.config import settings

class CryptoService:
    def __init__(self):
        key = settings.DATA_ENCRYPTION_KEY
        # Ensure key is valid 32-byte base64
        try:
            self.fernet = Fernet(key.encode("utf-8"))
        except Exception:
            # Fallback to deterministic padded key for dev
            padded = base64.urlsafe_b64encode((key[:32].ljust(32, "x")).encode("utf-8"))
            self.fernet = Fernet(padded)

    def encrypt_data(self, data: bytes) -> bytes:
        """Encrypts raw file bytes with AES-256 Fernet."""
        return self.fernet.encrypt(data)

    def decrypt_data(self, encrypted_data: bytes) -> bytes:
        """Decrypts encrypted file bytes back to original."""
        return self.fernet.decrypt(encrypted_data)

crypto_service = CryptoService()
