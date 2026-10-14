import { DocumentItem, User, AuditLog, VerificationRecord } from "./types";

const INITIAL_USERS: User[] = [
  {
    id: "usr-0000-0001",
    email: "admin@docseal.vn",
    full_name: "Quản Trị Viên Hệ Thống",
    role: "ADMIN",
    is_active: true,
    created_at: "2026-01-15T08:00:00Z",
    last_login: "2026-10-13T10:30:00Z"
  },
  {
    id: "usr-0000-0002",
    email: "verifier@docseal.vn",
    full_name: "Trần Văn Xác Minh (Công chứng viên)",
    role: "VERIFIER",
    is_active: true,
    created_at: "2026-02-01T09:15:00Z",
    last_login: "2026-10-12T14:20:00Z"
  },
  {
    id: "usr-0000-0003",
    email: "user@docseal.vn",
    full_name: "Nguyễn Văn Người Dùng",
    role: "USER",
    is_active: true,
    created_at: "2026-03-10T11:00:00Z",
    last_login: "2026-10-13T09:00:00Z"
  }
];

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: "DOC-9842-8721",
    tracking_code: "DS-2026-9842",
    title: "Hợp đồng Nguyên tắc Cung ứng Dịch vụ Công nghệ 2026",
    original_filename: "hop_dong_nguyen_tac_2026.pdf",
    file_size: 248512,
    file_extension: "pdf",
    mime_type: "application/pdf",
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ipfs_cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    ipfs_status: "PINNED",
    owner_id: "usr-0000-0003",
    owner_email: "user@docseal.vn",
    owner_name: "Nguyễn Văn Người Dùng",
    status: "VERIFIED",
    status_description: "Đã được kiểm tra tính toàn vẹn và xác nhận bởi người phụ trách.",
    is_encrypted: true,
    verifier_id: "usr-0000-0002",
    verifier_name: "Trần Văn Xác Minh (Công chứng viên)",
    verifier_notes: "Đã đối chiếu tính toàn vẹn chữ ký số cá nhân và SHA-256 bản gốc. Dữ liệu khớp 100%.",
    created_at: "2026-09-20T10:15:30Z",
    updated_at: "2026-09-21T08:30:00Z",
    verified_at: "2026-09-21T08:30:00Z",
    history: [
      {
        timestamp: "2026-09-20T10:15:30Z",
        action: "UPLOAD_RECORDED",
        actor: "user@docseal.vn",
        notes: "Tiếp nhận hồ sơ ban đầu và băm SHA-256."
      },
      {
        timestamp: "2026-09-20T10:16:02Z",
        action: "IPFS_PINNED",
        actor: "DocSeal Kubo Service",
        notes: "Lưu trữ nội dung mã hóa lên IPFS với CID QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG."
      },
      {
        timestamp: "2026-09-21T08:30:00Z",
        action: "VERIFIED_APPROVED",
        actor: "verifier@docseal.vn",
        notes: "Xác nhận hồ sơ đạt tính toàn vẹn."
      }
    ]
  },
  {
    id: "DOC-7123-5541",
    tracking_code: "DS-2026-7123",
    title: "Bằng tốt nghiệp Kỹ sư CNTT & Chứng chỉ Chuyên ngành",
    original_filename: "bang_tot_nghiep_cntt.pdf",
    file_size: 412890,
    file_extension: "pdf",
    mime_type: "application/pdf",
    sha256_hash: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    ipfs_cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    ipfs_status: "PINNED",
    owner_id: "usr-0000-0003",
    owner_email: "user@docseal.vn",
    owner_name: "Nguyễn Văn Người Dùng",
    status: "PENDING",
    status_description: "Đang chờ người xác nhận rà soát hồ sơ.",
    is_encrypted: true,
    created_at: "2026-10-10T14:40:12Z",
    updated_at: "2026-10-10T14:40:12Z",
    history: [
      {
        timestamp: "2026-10-10T14:40:12Z",
        action: "UPLOAD_RECORDED",
        actor: "user@docseal.vn",
        notes: "Tiếp nhận hồ sơ mới, gửi yêu cầu xác nhận."
      }
    ]
  }
];

const INITIAL_LOGS: AuditLog[] = [
  {
    id: "log-0001",
    timestamp: "2026-09-20T10:15:30Z",
    user_email: "user@docseal.vn",
    action: "DOCUMENT_UPLOAD",
    document_id: "DOC-9842-8721",
    ip_address: "127.0.0.1",
    status: "SUCCESS",
    details: "Tải lên tài liệu hop_dong_nguyen_tac_2026.pdf (248512 bytes)"
  },
  {
    id: "log-0002",
    timestamp: "2026-09-21T08:30:00Z",
    user_email: "verifier@docseal.vn",
    action: "DOCUMENT_APPROVE",
    document_id: "DOC-9842-8721",
    ip_address: "127.0.0.1",
    status: "SUCCESS",
    details: "Phê duyệt hồ sơ DOC-9842-8721 sau khi kiểm tra SHA-256."
  },
  {
    id: "log-0003",
    timestamp: "2026-10-10T14:40:12Z",
    user_email: "user@docseal.vn",
    action: "DOCUMENT_UPLOAD",
    document_id: "DOC-7123-5541",
    ip_address: "127.0.0.1",
    status: "SUCCESS",
    details: "Tải lên bằng tốt nghiệp bang_tot_nghiep_cntt.pdf"
  }
];

const INITIAL_VERIFICATIONS: VerificationRecord[] = [
  {
    id: "ver-0001",
    timestamp: "2026-09-22T14:20:00Z",
    document_id: "DOC-9842-8721",
    result: "MATCH",
    provided_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    recorded_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ipfs_cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    verifier_status: "VERIFIED",
    client_ip: "127.0.0.1",
    notes: "Xác minh thành công, dấu vân tay trùng khớp hoàn toàn."
  }
];

class DocSealStore {
  private users: User[] = [];
  private documents: DocumentItem[] = [];
  private auditLogs: AuditLog[] = [];
  private verifications: VerificationRecord[] = [];
  private currentUser: User | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const u = localStorage.getItem("docseal_users");
      const d = localStorage.getItem("docseal_docs");
      const l = localStorage.getItem("docseal_logs");
      const v = localStorage.getItem("docseal_vers");
      const cu = localStorage.getItem("docseal_current_user");

      this.users = u ? JSON.parse(u) : INITIAL_USERS;
      this.documents = d ? JSON.parse(d) : INITIAL_DOCUMENTS;
      this.auditLogs = l ? JSON.parse(l) : INITIAL_LOGS;
      this.verifications = v ? JSON.parse(v) : INITIAL_VERIFICATIONS;
      this.currentUser = cu ? JSON.parse(cu) : INITIAL_USERS[0]; // default to Admin for easy testing
    } catch {
      this.users = INITIAL_USERS;
      this.documents = INITIAL_DOCUMENTS;
      this.auditLogs = INITIAL_LOGS;
      this.verifications = INITIAL_VERIFICATIONS;
      this.currentUser = INITIAL_USERS[0];
    }
  }

  private saveToStorage() {
    localStorage.setItem("docseal_users", JSON.stringify(this.users));
    localStorage.setItem("docseal_docs", JSON.stringify(this.documents));
    localStorage.setItem("docseal_logs", JSON.stringify(this.auditLogs));
    localStorage.setItem("docseal_vers", JSON.stringify(this.verifications));
    if (this.currentUser) {
      localStorage.setItem("docseal_current_user", JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem("docseal_current_user");
    }
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Getters
  getCurrentUser() { return this.currentUser; }
  getUsers() { return [...this.users]; }
  getDocuments() { return [...this.documents]; }
  getAuditLogs() { return [...this.auditLogs]; }
  getVerifications() { return [...this.verifications]; }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    this.saveToStorage();
  }

  // Auth
  login(email: string): User | null {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.is_active) {
      this.currentUser = user;
      this.logAction(user.email, "LOGIN_SUCCESS", "Đăng nhập thành công vào hệ thống.");
      this.saveToStorage();
      return user;
    }
    return null;
  }

  register(email: string, full_name: string): User {
    const newUser: User = {
      id: `usr-${Math.random().toString(16).substring(2, 10)}`,
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: "USER",
      is_active: true,
      created_at: new Date().toISOString()
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    this.logAction(newUser.email, "USER_REGISTER", `Đăng ký tài khoản: ${newUser.email}`);
    this.saveToStorage();
    return newUser;
  }

  logout() {
    if (this.currentUser) {
      this.logAction(this.currentUser.email, "LOGOUT", "Đăng xuất khỏi phiên làm việc.");
    }
    this.currentUser = null;
    this.saveToStorage();
  }

  // Document Operations
  addDocument(doc: Omit<DocumentItem, "id" | "tracking_code" | "created_at" | "updated_at" | "history">) {
    const id = `DOC-${Math.random().toString(16).substring(2, 6).toUpperCase()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const tracking_code = `DS-2026-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const newDoc: DocumentItem = {
      ...doc,
      id,
      tracking_code,
      created_at: now,
      updated_at: now,
      history: [
        {
          timestamp: now,
          action: "UPLOAD_RECORDED",
          actor: doc.owner_email,
          notes: `Tiếp nhận hồ sơ '${doc.title}'. Dấu vân tay SHA-256: ${doc.sha256_hash.substring(0, 16)}...`
        },
        ...(doc.ipfs_cid ? [{
          timestamp: now,
          action: "IPFS_PINNED",
          actor: "Kubo RPC Daemon",
          notes: `Lưu trữ phi tập trung với CID ${doc.ipfs_cid}`
        }] : [])
      ]
    };

    this.documents.unshift(newDoc);
    this.logAction(doc.owner_email, "DOCUMENT_UPLOAD", `Tải lên '${doc.original_filename}'. CID: ${doc.ipfs_cid || 'Cục bộ'}`, id);
    this.saveToStorage();
    return newDoc;
  }

  approveDocument(docId: string, verifierUser: User, notes?: string) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return false;
    const now = new Date().toISOString();

    doc.status = "VERIFIED";
    doc.status_description = "Hồ sơ đã được thẩm định và xác nhận tính toàn vẹn thành công.";
    doc.verifier_id = verifierUser.id;
    doc.verifier_name = verifierUser.full_name;
    doc.verifier_notes = notes || "Đã kiểm tra tính toàn vẹn chữ ký và SHA-256.";
    doc.verified_at = now;
    doc.updated_at = now;
    doc.history.push({
      timestamp: now,
      action: "VERIFIED_APPROVED",
      actor: verifierUser.email,
      notes: doc.verifier_notes
    });

    this.logAction(verifierUser.email, "DOCUMENT_APPROVE", `Phê duyệt hồ sơ ${docId}. Ghi chú: ${doc.verifier_notes}`, docId);
    this.saveToStorage();
    return true;
  }

  rejectDocument(docId: string, verifierUser: User, reason: string) {
    const doc = this.documents.find(d => d.id === docId);
    if (!doc) return false;
    const now = new Date().toISOString();

    doc.status = "REJECTED";
    doc.status_description = `Hồ sơ bị từ chối: ${reason}`;
    doc.verifier_id = verifierUser.id;
    doc.verifier_name = verifierUser.full_name;
    doc.verifier_notes = reason;
    doc.updated_at = now;
    doc.history.push({
      timestamp: now,
      action: "VERIFIED_REJECTED",
      actor: verifierUser.email,
      notes: reason
    });

    this.logAction(verifierUser.email, "DOCUMENT_REJECT", `Từ chối hồ sơ ${docId}. Lý do: ${reason}`, docId);
    this.saveToStorage();
    return true;
  }

  toggleUserStatus(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    user.is_active = !user.is_active;
    this.logAction(
      this.currentUser?.email || "system",
      "USER_STATUS_CHANGE",
      `Cập nhật trạng thái người dùng ${user.email}: is_active=${user.is_active}`
    );
    this.saveToStorage();
  }

  logAction(user_email: string, action: string, details: string, document_id?: string) {
    const log: AuditLog = {
      id: `log-${Math.random().toString(16).substring(2, 10)}`,
      timestamp: new Date().toISOString(),
      user_email,
      action,
      document_id: document_id || null,
      ip_address: "127.0.0.1",
      status: "SUCCESS",
      details
    };
    this.auditLogs.unshift(log);
  }

  addVerificationRecord(record: Omit<VerificationRecord, "id" | "timestamp">) {
    const fullRecord: VerificationRecord = {
      ...record,
      id: `ver-${Math.random().toString(16).substring(2, 10)}`,
      timestamp: new Date().toISOString()
    };
    this.verifications.unshift(fullRecord);
    this.saveToStorage();
    return fullRecord;
  }

  resetToDefault() {
    this.users = INITIAL_USERS;
    this.documents = INITIAL_DOCUMENTS;
    this.auditLogs = INITIAL_LOGS;
    this.verifications = INITIAL_VERIFICATIONS;
    this.currentUser = INITIAL_USERS[0];
    this.saveToStorage();
  }
}

export const docSealStore = new DocSealStore();

// Utility function to compute SHA-256 in browser
export async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Generates an inline QR code SVG data URI for instant crisp rendering without external dependencies
export function generateQRUri(text: string): string {
  // Simple deterministic pattern generator for QR mock or visual verification
  const size = 160;
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 25 25" fill="%230f172a"><rect width="25" height="25" fill="%23ffffff"/><rect x="2" y="2" width="7" height="7" fill="%230f172a"/><rect x="3" y="3" width="5" height="5" fill="%23ffffff"/><rect x="4" y="4" width="3" height="3" fill="%230f172a"/><rect x="16" y="2" width="7" height="7" fill="%230f172a"/><rect x="17" y="3" width="5" height="5" fill="%23ffffff"/><rect x="18" y="4" width="3" height="3" fill="%230f172a"/><rect x="2" y="16" width="7" height="7" fill="%230f172a"/><rect x="3" y="17" width="5" height="5" fill="%23ffffff"/><rect x="4" y="18" width="3" height="3" fill="%230f172a"/><rect x="10" y="4" width="2" height="4"/><rect x="13" y="2" width="2" height="3"/><rect x="10" y="10" width="5" height="5"/><rect x="4" y="11" width="3" height="2"/><rect x="16" y="10" width="3" height="2"/><rect x="11" y="17" width="3" height="4"/><rect x="16" y="15" width="2" height="5"/><rect x="19" y="18" width="4" height="4"/><rect x="21" y="11" width="2" height="4"/></svg>`;
}
