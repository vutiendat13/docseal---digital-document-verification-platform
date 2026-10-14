import io
import requests
from typing import Optional, Tuple
from app.config import settings
from app.models.entities import IPFSStatus

class IPFSService:
    """
    Connects to local IPFS Kubo daemon via HTTP RPC API (/api/v0).
    Communicates securely without exposing port 5001 to the public web.
    """
    def __init__(self):
        self.rpc_url = settings.KUBO_RPC_URL.rstrip("/")
        self.timeout = settings.KUBO_TIMEOUT_SECONDS

    def check_health(self) -> dict:
        """Checks if Kubo RPC daemon is alive and responding."""
        try:
            resp = requests.post(f"{self.rpc_url}/version", timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "online": True,
                    "version": data.get("Version", "Unknown"),
                    "system": data.get("System", "Unknown"),
                    "rpc_url": self.rpc_url,
                    "message": "IPFS Kubo daemon đang hoạt động bình thường."
                }
            return {
                "online": False,
                "rpc_url": self.rpc_url,
                "message": f"Kubo trả về mã lỗi HTTP {resp.status_code}"
            }
        except requests.exceptions.RequestException as e:
            return {
                "online": False,
                "rpc_url": self.rpc_url,
                "message": f"Không thể kết nối đến Kubo RPC daemon ({str(e)}). Vui lòng khởi động ipfs daemon."
            }

    def add_file(self, content: bytes, filename: str = "document.enc") -> Tuple[Optional[str], IPFSStatus, str]:
        """
        Uploads encrypted or raw file bytes to Kubo RPC via /api/v0/add.
        Returns: (cid, status, message)
        """
        try:
            files = {
                "file": (filename, io.BytesIO(content), "application/octet-stream")
            }
            # Kubo /api/v0/add endpoint
            resp = requests.post(f"{self.rpc_url}/add?pin=true", files=files, timeout=self.timeout)
            if resp.status_code == 200:
                data = resp.json()
                cid = data.get("Hash")
                if cid:
                    return cid, IPFSStatus.PINNED, "Tải lên và ghim IPFS thành công."
                return None, IPFSStatus.FAILED, "Kubo không trả về CID hợp lệ."
            return None, IPFSStatus.FAILED, f"Lỗi HTTP {resp.status_code} từ Kubo RPC: {resp.text}"
        except requests.exceptions.RequestException as e:
            if settings.KUBO_FALLBACK_LOCAL_ONLY:
                return None, IPFSStatus.LOCAL_ONLY, f"Kubo ngoại tuyến. Lưu trữ chế độ cục bộ an toàn: {str(e)}"
            return None, IPFSStatus.FAILED, f"Lỗi kết nối Kubo RPC: {str(e)}"

    def get_file(self, cid: str) -> Tuple[Optional[bytes], str]:
        """
        Retrieves file bytes from Kubo via /api/v0/cat?arg=<cid>.
        """
        try:
            resp = requests.post(f"{self.rpc_url}/cat?arg={cid}", timeout=self.timeout)
            if resp.status_code == 200:
                return resp.content, "Lấy dữ liệu từ IPFS thành công."
            return None, f"Kubo trả về mã lỗi HTTP {resp.status_code}"
        except requests.exceptions.RequestException as e:
            return None, f"Không thể truy xuất CID {cid} từ IPFS: {str(e)}"

ipfs_service = IPFSService()
