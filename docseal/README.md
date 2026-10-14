# DocSeal — Digital Document Verification Platform

Nền tảng tiếp nhận, quản lý hồ sơ, kiểm tra tính toàn vẹn và xác minh tài liệu số phi tập trung sử dụng **FastAPI**, **IPFS Kubo**, **SHA-256**, **Three.js** và **Cơ chế lưu trữ bền vững Zero-SQL (Pure JSON & Filesystem)**.

---

## 1. Giới thiệu tổng quan

**DocSeal** được thiết kế nhằm giải quyết bài toán chống giả mạo và xác minh nguồn gốc tài liệu trong kỷ nguyên số. Mỗi tài liệu khi được tiếp nhận vào hệ thống sẽ trải qua quy trình:
1. **Băm dấu vân tay cryptographic SHA-256**: Xác định mã định danh duy nhất của nội dung tệp tin.
2. **Mã hóa nhạy cảm phía máy chủ**: Tài liệu được mã hóa bằng thuật toán đối xứng AES-256 (Fernet) trước khi lưu trên ổ đĩa hoặc truyền lên mạng phân tán.
3. **Lưu trữ phi tập trung IPFS (Kubo RPC API)**: Nội dung mã hóa được ghim (pinned) lên IPFS thông qua Content Identifier (CID). Khi IPFS offline, hệ thống kích hoạt cơ chế lưu trữ an toàn cục bộ (Local Only) với thông báo rõ ràng, không báo thành công giả.
4. **Phân quyền và thẩm định độc lập (RBAC)**: Phân định rõ ràng giữa Người nộp hồ sơ (`USER`), Thẩm định viên (`VERIFIER`) và Quản trị viên (`ADMIN`). Người nộp hồ sơ không được quyền tự phê duyệt hồ sơ của mình.
5. **Tra cứu & Đối chiếu toàn vẹn**: Cho phép bất kỳ ai có mã hồ sơ hoặc tệp tin gốc tải lên đối chiếu lại giá trị SHA-256 với hồ sơ gốc đã lưu trữ.

---

## 2. Nguyên tắc trung thực về công chứng số

> **LƯU Ý TRUNG THỰC VỀ PHÁP LÝ:**
> DocSeal là một giải pháp công nghệ tập trung vào **xác minh tính toàn vẹn kỹ thuật (Technical Integrity)** và **lịch sử tiếp nhận hồ sơ**. Việc một tệp tin trùng khớp dấu vân tay SHA-256 hoặc có CID trên IPFS chỉ chứng minh rằng: *"Nội dung tệp hiện tại hoàn toàn khớp với phiên bản đã được ghi nhận tại thời điểm tiếp nhận trong hệ thống"*.
> 
> Hệ thống **không tự động thay thế** cho văn bản công chứng có giá trị pháp lý theo Luật Công chứng Việt Nam nếu chưa trải qua quy trình chữ ký số với chứng thư số chuyên dùng của tổ chức hành nghề công chứng được cấp phép.

---

## 3. Kiến trúc lưu trữ bền vững Zero-SQL (Pure JSON)

Theo yêu cầu nghiêm ngặt không sử dụng bất kỳ hệ quản trị cơ sở dữ liệu SQL nào (không SQLite, không PostgreSQL, không MySQL):
- Toàn bộ dữ liệu nghiệp vụ được lưu trữ thành các file JSON có cấu trúc trong thư mục `data/`:
  - `data/users.json`: Danh sách tài khoản, mật khẩu đã được băm (bcrypt) và vai trò.
  - `data/documents.json`: Thông tin chi tiết hồ sơ, mã theo dõi, SHA-256, IPFS CID, lịch sử xử lý.
  - `data/audit_logs.json`: Nhật ký thao tác hệ thống (đăng nhập, tải lên, duyệt, sao lưu).
  - `data/verification_records.json`: Lịch sử các lần đối chiếu toàn vẹn.
  - `data/notifications.json`: Thông báo gửi đến người dùng.
- Thư mục lưu trữ tệp tin trong `storage/`:
  - `storage/documents/`: Chứa các tệp tài liệu đã được mã hóa AES-256 (`.enc`).
  - `storage/temp/`: Chứa các tệp tạm thời trong quá trình xử lý, tự động dọn dẹp.
  - `storage/backups/`: Chứa các bản snapshot sao lưu toàn diện.

### Cơ chế chống ghi đè và hư hại dữ liệu:
1. **Ghi tệp nguyên tử (Atomic Write)**: Khi có thao tác ghi, dữ liệu được ghi vào một tệp tạm (`.tmp`) trong thư mục `storage/temp`, thực hiện `flush()` và `os.fsync()` đảm bảo dữ liệu ghi xuống đĩa vật lý, sau đó mới dùng `os.replace()` để thay thế tệp JSON mục tiêu.
2. **Khóa luồng (Thread-safe Locks)**: Mỗi tệp JSON được quản lý bởi một `threading.Lock` độc lập trong `JSONRepository`, tránh xung đột khi nhiều request đến đồng thời.
3. **Tự động sao lưu và khôi phục**: Hệ thống hỗ trợ tạo snapshot backup dạng zip tại `storage/backups/`. Nếu file JSON chính bị lỗi định dạng, hệ thống tự động tìm và khôi phục từ snapshot gần nhất.
4. **Giới hạn của kiến trúc JSON**: Định dạng JSON phù hợp cho ứng dụng chạy cục bộ, quy mô nhỏ hoặc vừa, dễ kiểm tra code và sao chép. Khi mở rộng hàng triệu bản ghi hoặc hàng nghìn truy vấn đồng thời, JSON sẽ gặp giới hạn về I/O đĩa và dung lượng RAM tải toàn bộ danh sách.

---

## 4. Hướng dẫn cài đặt và chạy trên Windows trong VS Code

### Yêu cầu hệ thống:
- Hệ điều hành: Windows 10/11 64-bit.
- Python 3.10 hoặc Python 3.11+ (Tải từ [python.org](https://www.python.org/downloads/)). **Lưu ý**: Tích chọn *"Add Python to PATH"* khi cài đặt.
- Visual Studio Code.
- *(Tùy chọn)* IPFS Kubo daemon để kiểm tra tính năng lưu trữ phân tán thực tế.

---

### Bước 1: Mở dự án trong VS Code
1. Mở VS Code, chọn **File > Open Folder...** và chọn thư mục `docseal`.
2. Mở terminal trong VS Code bằng phím tắt `Ctrl + ` ` ` (hoặc menu **Terminal > New Terminal**).

---

### Bước 2: Chạy tự động bằng file `run.bat` (Khuyên dùng)
Chỉ cần nhấp đúp vào file `run.bat` hoặc gõ trong Command Prompt / PowerShell:
```cmd
.\run.bat
```
File script sẽ tự động:
1. Kiểm tra Python trên máy.
2. Tạo môi trường ảo `venv` nếu chưa có.
3. Kích hoạt môi trường ảo.
4. Cài đặt các thư viện từ `requirements.txt`.
5. Tạo file cấu hình `.env` từ `.env.example`.
6. Khởi chạy máy chủ FastAPI tại `http://127.0.0.1:8000`.

---

### Bước 3: Chạy thủ công từng bước (Nếu không dùng run.bat)
Nếu bạn muốn tự chạy từng lệnh trong terminal VS Code:

1. Tạo môi trường ảo Python:
   ```cmd
   python -m venv venv
   ```
2. Kích hoạt môi trường ảo trên Windows:
   - Trong Command Prompt (cmd):
     ```cmd
     venv\Scripts\activate.bat
     ```
   - Trong PowerShell:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
3. Cài đặt các gói phụ thuộc:
   ```cmd
   pip install -r requirements.txt
   ```
4. Khởi chạy máy chủ phát triển FastAPI:
   ```cmd
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

Mở trình duyệt truy cập:
- **Giao diện Web DocSeal**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Tài liệu API tương tác (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 5. Hướng dẫn cài đặt và tích hợp IPFS Kubo

Dự án có thể chạy hoàn toàn độc lập ở chế độ **Local Storage** nếu bạn chưa cài IPFS. Tuy nhiên để trải nghiệm đầy đủ tính năng Web3 phân tán:

1. Tải **Kubo** cho Windows từ trang chính thức: [github.com/ipfs/kubo/releases](https://github.com/ipfs/kubo/releases) (chọn bản `kubo_v..._windows-amd64.zip`).
2. Giải nén và chuyển file `ipfs.exe` vào một thư mục trong PATH (ví dụ `C:\ipfs`).
3. Khởi tạo IPFS repository lần đầu:
   ```cmd
   ipfs init
   ```
4. Khởi động IPFS daemon:
   ```cmd
   ipfs daemon
   ```
   Lúc này daemon sẽ mở RPC API tại địa chỉ: `http://127.0.0.1:5001/api/v0`.
5. DocSeal sẽ tự động phát hiện và kết nối Kubo để lưu trữ tệp mã hóa và cấp mã CID. Cổng RPC 5001 chỉ được gọi nội bộ từ backend Python thông qua thư viện `requests`, không bao giờ để lộ ra trình duyệt người dùng.

---

## 6. Danh sách tài khoản thử nghiệm

Dự án đã nạp sẵn 3 tài khoản mẫu phục vụ kiểm thử phân quyền:

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (ADMIN)** | `admin@docseal.vn` | `AdminPassword@2026` | Xem toàn bộ hồ sơ, thống kê hệ thống, quản lý người dùng, xem nhật ký Audit Log, sao lưu dữ liệu JSON |
| **Thẩm định viên (VERIFIER)** | `verifier@docseal.vn` | `VerifierPassword@2026` | Xem hồ sơ chờ duyệt, đối chiếu tính toàn vẹn, phê duyệt hoặc từ chối hồ sơ kèm lý do |
| **Người dùng (USER)** | `user@docseal.vn` | `UserPassword@2026` | Tải hồ sơ mới, xem hồ sơ của mình, tải tệp tin, xem mã QR tra cứu |

---

## 7. Chạy bộ kiểm thử tự động (Test Suite)

Dự án đi kèm bộ test tự động sử dụng `pytest` và `TestClient`:
```cmd
pytest tests/test_main.py -v
```
Bộ test bao gồm:
- Kiểm tra tính sẵn sàng của endpoint `/api/health`.
- Kiểm tra thuật toán SHA-256 (tính nhất quán và phát hiện tệp bị sửa đổi).
- Kiểm tra mã hóa và giải mã đối xứng Fernet AES-256.
- Kiểm tra luồng xác minh: Khớp (MATCH), Không khớp (MISMATCH), và Không tìm thấy (NOT_FOUND).
- Kiểm tra tính toàn vẹn của dữ liệu lưu trữ JSON sau khởi động lại.

---

## 8. Cấu trúc thư mục dự án

```text
docseal/
├── app/
│   ├── main.py                     # Entry point FastAPI, cấu hình CORS, static & router
│   ├── config.py                   # Quản lý cấu hình Pydantic Settings từ .env
│   ├── api/
│   │   ├── auth.py                 # API đăng ký, đăng nhập, JWT
│   │   ├── documents.py            # API tiếp nhận tài liệu, danh sách, tải về, QR
│   │   ├── verification.py         # API tra cứu và xác minh tính toàn vẹn công khai
│   │   ├── admin.py                # API thống kê, quản lý người dùng, audit log, phê duyệt
│   │   └── health.py               # API kiểm tra trạng thái hệ thống và Kubo
│   ├── services/
│   │   ├── ipfs_service.py         # Kết nối HTTP RPC API của Kubo IPFS (/api/v0)
│   │   ├── crypto_service.py       # Mã hóa & giải mã đối xứng AES-256 Fernet
│   │   ├── storage_service.py      # Lưu trữ tệp mã hóa và nén backup
│   │   ├── audit_service.py        # Ghi nhận nhật ký thao tác
│   │   └── document_service.py     # Quy trình băm SHA-256 và đối chiếu toàn vẹn 7 bước
│   ├── repositories/
│   │   └── json_repo.py            # Engine lưu trữ JSON Zero-SQL với Atomic Writes & Thread Locks
│   ├── models/
│   │   ├── entities.py             # Domain models (User, Document, AuditLog)
│   │   └── schemas.py              # Pydantic Request & Response schemas
│   ├── security/
│   │   ├── auth.py                 # Băm mật khẩu bcrypt và giải mã JWT
│   │   ├── permissions.py          # Kiểm tra quyền hạn RBAC
│   │   └── rate_limiter.py         # Hạn chế tần suất thử đăng nhập
│   └── utils/
│       ├── file_utils.py           # Vệ sinh tên file, kiểm tra đuôi file, tính SHA-256
│       └── qr_generator.py         # Tạo mã QR tra cứu Base64
├── data/                           # Cơ sở dữ liệu JSON Zero-SQL
│   ├── users.json
│   ├── documents.json
│   ├── audit_logs.json
│   ├── verification_records.json
│   └── notifications.json
├── storage/                        # Lưu trữ tệp cục bộ
│   ├── documents/                  # Tệp mã hóa .enc
│   ├── temp/                       # Tệp tạm xử lý nguyên tử
│   └── backups/                    # Các bản sao lưu ZIP
├── templates/
│   └── index.html                  # Giao diện web hoàn chỉnh
├── static/
│   ├── css/style.css               # Định dạng giao diện chuyên nghiệp
│   ├── js/three_scene.js           # Hoạt cảnh 3D Three.js: Mô hình hồ sơ số & nút mạng IPFS
│   └── js/app.js                   # Xử lý logic frontend, Web Crypto SHA-256, chuyển tab
├── tests/
│   └── test_main.py                # Bộ test tự động
├── .env.example                    # Biến môi trường mẫu
├── .gitignore                      # Cấu hình bỏ qua tệp tạm và thông tin nhạy cảm
├── requirements.txt                # Khai báo các thư viện Python
├── run.bat                         # Script khởi chạy 1-click cho Windows
└── README.md                       # Tài liệu hướng dẫn chi tiết
```

---

## 9. Giấy phép và Tác quyền
Dự án được xây dựng phục vụ nghiên cứu, học tập và triển khai thực tế giải pháp xác minh tài liệu số phi tập trung. Mọi thắc mắc xin liên hệ quản trị viên nền tảng.
