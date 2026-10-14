/**
 * DocSeal - Client Application Logic
 * Pure JavaScript, REST API communication, Web Crypto SHA-256 calculation
 */

const API_BASE = "";

// State
let currentUser = null;
let token = localStorage.getItem("docseal_token") || null;

// Helpers
async function apiRequest(endpoint, options = {}) {
  const headers = options.headers || {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  options.headers = headers;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    if (response.status === 401) {
      logout();
      throw new Error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Có lỗi xảy ra trong quá trình xử lý.");
    }
    return data;
  } catch (err) {
    showToast(err.message, "danger");
    throw err;
  }
}

// Compute client-side SHA-256 for instant verification & file drag-and-drop
async function computeFileSHA256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Notification Toast
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:inherit;font-weight:bold;">&times;</button>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
  
  const target = document.getElementById(tabId);
  const link = document.querySelector(`[data-tab="${tabId}"]`);
  if (target) target.style.display = "block";
  if (link) link.classList.add("active");

  // Load contextual data
  if (tabId === "tab-dashboard") loadUserDocuments();
  if (tabId === "tab-verifier") loadVerifierDocuments();
  if (tabId === "tab-admin") loadAdminData();
}

// Auth Handlers
async function checkAuth() {
  if (!token) {
    updateAuthUI(null);
    return;
  }
  try {
    const user = await apiRequest("/api/auth/me");
    currentUser = user;
    updateAuthUI(user);
  } catch (e) {
    logout();
  }
}

function updateAuthUI(user) {
  const authNav = document.getElementById("auth-nav-actions");
  const verifierTab = document.querySelector('[data-tab="tab-verifier"]');
  const adminTab = document.querySelector('[data-tab="tab-admin"]');
  const dashboardTab = document.querySelector('[data-tab="tab-dashboard"]');

  if (user) {
    authNav.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <span style="font-size:0.875rem;font-weight:500;">
          ${user.full_name} <span class="badge badge-info">${user.role}</span>
        </span>
        <button class="btn btn-outline btn-sm" onclick="logout()">Đăng xuất</button>
      </div>
    `;
    if (dashboardTab) dashboardTab.style.display = "inline-block";
    if (verifierTab) verifierTab.style.display = (user.role === "VERIFIER" || user.role === "ADMIN") ? "inline-block" : "none";
    if (adminTab) adminTab.style.display = (user.role === "ADMIN") ? "inline-block" : "none";
  } else {
    authNav.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">Đăng nhập</button>
      <button class="btn btn-primary btn-sm" onclick="openAuthModal('register')">Đăng ký</button>
    `;
    if (dashboardTab) dashboardTab.style.display = "none";
    if (verifierTab) verifierTab.style.display = "none";
    if (adminTab) adminTab.style.display = "none";
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("docseal_token");
  updateAuthUI(null);
  switchTab("tab-home");
  showToast("Đã đăng xuất thành công.", "info");
}

function openAuthModal(mode = "login") {
  const modal = document.getElementById("auth-modal");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const modalTitle = document.getElementById("auth-modal-title");

  if (mode === "login") {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    modalTitle.innerText = "Đăng Nhập Tài Khoản";
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    modalTitle.innerText = "Đăng Ký Tài Khoản Mới";
  }
  modal.style.display = "flex";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.style.display = "none";
}

// Pre-fill quick test accounts
function quickLogin(email, password) {
  document.getElementById("login-email").value = email;
  document.getElementById("login-password").value = password;
  handleLoginSubmit(new Event("submit"));
}

async function handleLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await apiRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    token = res.access_token;
    localStorage.setItem("docseal_token", token);
    currentUser = res.user;
    updateAuthUI(currentUser);
    closeAuthModal();
    showToast(`Chào mừng ${currentUser.full_name}!`, "success");
    switchTab("tab-dashboard");
  } catch (err) {
    // Error is handled in apiRequest
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const full_name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  try {
    const res = await apiRequest("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password })
    });
    token = res.access_token;
    localStorage.setItem("docseal_token", token);
    currentUser = res.user;
    updateAuthUI(currentUser);
    closeAuthModal();
    showToast("Đăng ký thành công!", "success");
    switchTab("tab-dashboard");
  } catch (err) {}
}

// Document Upload Flow
async function handleFileUploadSubmit(e) {
  e.preventDefault();
  if (!token) {
    showToast("Vui lòng đăng nhập trước khi tải tài liệu.", "warning");
    openAuthModal("login");
    return;
  }

  const title = document.getElementById("upload-title").value;
  const fileInput = document.getElementById("upload-file-input");
  if (!fileInput.files || fileInput.files.length === 0) {
    showToast("Vui lòng chọn tệp tài liệu cần tiếp nhận.", "warning");
    return;
  }

  const file = fileInput.files[0];
  const progressContainer = document.getElementById("upload-progress");
  const progressBar = document.getElementById("upload-progress-bar");
  progressContainer.style.display = "block";
  progressBar.style.width = "40%";

  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  try {
    progressBar.style.width = "75%";
    const res = await apiRequest("/api/documents/upload", {
      method: "POST",
      body: formData
    });
    progressBar.style.width = "100%";
    setTimeout(() => { progressContainer.style.display = "none"; }, 500);

    showToast(`Đã tiếp nhận hồ sơ ${res.id}!`, "success");
    // Show receipt modal
    showUploadReceipt(res);
  } catch (err) {
    progressContainer.style.display = "none";
  }
}

function showUploadReceipt(doc) {
  const receipt = document.getElementById("upload-receipt");
  receipt.innerHTML = `
    <div class="card" style="border-left:4px solid var(--success);margin-top:1.5rem;">
      <h3 style="color:var(--success);margin-bottom:0.75rem;">Hồ Sơ Đã Tiếp Nhận Thành Công!</h3>
      <p><strong>Mã hồ sơ:</strong> <span style="font-family:monospace;font-size:1.1rem;color:var(--primary);">${doc.id}</span></p>
      <p><strong>Mã tra cứu:</strong> ${doc.tracking_code}</p>
      <p><strong>Dấu vân tay SHA-256:</strong> <code style="word-break:break-all;">${doc.sha256_hash}</code></p>
      <p><strong>Trạng thái IPFS:</strong> <span class="badge badge-info">${doc.ipfs_status}</span> ${doc.ipfs_cid ? `(CID: ${doc.ipfs_cid})` : '(Lưu cục bộ)'}</p>
      <div style="margin-top:1rem;display:flex;align-items:center;gap:1.5rem;">
        <img src="${doc.qr_code_url}" alt="Mã QR tra cứu" style="width:120px;height:120px;border:1px solid #e2e8f0;border-radius:8px;padding:4px;" />
        <div>
          <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:0.5rem;">Quét mã QR để mở trang tra cứu và xác minh toàn vẹn tức thì.</p>
          <button class="btn btn-primary btn-sm" onclick="startVerificationWithId('${doc.id}')">Kiểm tra xác minh ngay</button>
        </div>
      </div>
    </div>
  `;
}

// Verification Flow
async function handleVerifySubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const docId = document.getElementById("verify-doc-id").value.trim();
  const fileInput = document.getElementById("verify-file-input");
  const resultCard = document.getElementById("verify-result-card");
  resultCard.style.display = "none";

  const formData = new FormData();
  if (docId) formData.append("document_id", docId);
  if (fileInput.files && fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  }

  if (!docId && (!fileInput.files || fileInput.files.length === 0)) {
    showToast("Vui lòng nhập Mã hồ sơ hoặc tải lên tệp tin cần đối chiếu.", "warning");
    return;
  }

  try {
    const res = await apiRequest("/api/verify", {
      method: "POST",
      body: formData
    });
    renderVerificationResult(res);
  } catch (err) {}
}

function startVerificationWithId(docId) {
  switchTab("tab-verify");
  document.getElementById("verify-doc-id").value = docId;
  handleVerifySubmit();
}

function renderVerificationResult(res) {
  const resultCard = document.getElementById("verify-result-card");
  resultCard.style.display = "block";

  let statusBadge = "";
  let bannerColor = "var(--border)";

  if (res.result === "MATCH") {
    statusBadge = `<span class="badge badge-success" style="font-size:0.9rem;">Khớp với bản đã ghi nhận</span>`;
    bannerColor = "var(--success)";
  } else if (res.result === "MISMATCH") {
    statusBadge = `<span class="badge badge-danger" style="font-size:0.9rem;">Nội dung không khớp</span>`;
    bannerColor = "var(--danger)";
  } else if (res.result === "PENDING_APPROVAL") {
    statusBadge = `<span class="badge badge-warning" style="font-size:0.9rem;">Chưa được người có thẩm quyền phê duyệt</span>`;
    bannerColor = "var(--warning)";
  } else if (res.result === "NOT_FOUND") {
    statusBadge = `<span class="badge badge-danger" style="font-size:0.9rem;">Không tìm thấy hồ sơ</span>`;
    bannerColor = "var(--danger)";
  } else {
    statusBadge = `<span class="badge badge-info" style="font-size:0.9rem;">${res.result}</span>`;
  }

  resultCard.innerHTML = `
    <div style="border-left: 6px solid ${bannerColor}; padding: 1.5rem; background: var(--surface); border-radius: 8px; box-shadow: var(--shadow-sm);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
        <div>
          <h3 style="font-size:1.25rem;font-weight:700;">Kết Quả Xác Minh Tính Toàn Vẹn</h3>
          <p style="font-size:0.875rem;color:var(--text-muted);">Mã phiên kiểm tra: ${res.record_id}</p>
        </div>
        <div>${statusBadge}</div>
      </div>
      <p style="font-size:1rem;margin-bottom:1.25rem;font-weight:500;">${res.message}</p>
      
      ${res.document_found ? `
        <div style="background:var(--surface-alt);padding:1rem;border-radius:6px;font-size:0.875rem;margin-bottom:1rem;">
          <p><strong>Tiêu đề hồ sơ:</strong> ${res.title}</p>
          <p><strong>Mã hồ sơ:</strong> ${res.document_id}</p>
          <p><strong>Thời gian ghi nhận ban đầu:</strong> ${res.recorded_at}</p>
          <p><strong>Dấu vân tay SHA-256 gốc:</strong> <code style="word-break:break-all;">${res.recorded_hash}</code></p>
          ${res.provided_hash ? `<p><strong>Dấu vân tay tệp tải lên:</strong> <code style="word-break:break-all;">${res.provided_hash}</code></p>` : ''}
          <p><strong>Lưu trữ IPFS CID:</strong> ${res.ipfs_cid ? `<a href="https://ipfs.io/ipfs/${res.ipfs_cid}" target="_blank" rel="noopener">${res.ipfs_cid}</a>` : 'Không có'}</p>
          <p><strong>Trạng thái phê duyệt nghiệp vụ:</strong> ${res.approval_status}</p>
          ${res.verified_by ? `<p><strong>Người thẩm định:</strong> ${res.verified_by}</p>` : ''}
        </div>
      ` : ''}

      <div class="legal-banner" style="margin:0;">
        <div>
          <strong>CẢNH BÁO MINH BẠCH & PHÁP LÝ:</strong>
          <p>${res.legal_disclaimer}</p>
        </div>
      </div>
    </div>
  `;
}

// User Dashboard
async function loadUserDocuments() {
  const container = document.getElementById("user-docs-table-body");
  if (!container) return;
  container.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Đang tải dữ liệu hồ sơ...</td></tr>`;

  try {
    const docs = await apiRequest("/api/documents");
    if (docs.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Bạn chưa có hồ sơ nào. Hãy bấm "Tải Hồ Sơ Mới" để tiếp nhận tài liệu đầu tiên!</td></tr>`;
      return;
    }
    container.innerHTML = docs.map(d => `
      <tr>
        <td><strong>${d.id}</strong><br><small style="color:var(--text-muted);">${d.tracking_code}</small></td>
        <td>${d.title}<br><small style="color:var(--text-muted);">${d.original_filename}</small></td>
        <td><code>${d.sha256_hash.substring(0, 12)}...</code></td>
        <td><span class="badge ${d.status === 'VERIFIED' ? 'badge-success' : (d.status === 'REJECTED' ? 'badge-danger' : 'badge-warning')}">${d.status}</span></td>
        <td>${d.ipfs_cid ? `<span class="badge badge-info">IPFS Pinned</span>` : `<span class="badge badge-warning">Cục bộ</span>`}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="startVerificationWithId('${d.id}')">Xác minh</button>
          <a class="btn btn-primary btn-sm" href="/api/documents/${d.id}/download" download>Tải về</a>
        </td>
      </tr>
    `).join("");
  } catch (e) {}
}

// Verifier Portal
async function loadVerifierDocuments() {
  const container = document.getElementById("verifier-table-body");
  if (!container) return;
  container.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Đang tải danh sách hồ sơ cần thẩm định...</td></tr>`;

  try {
    const docs = await apiRequest("/api/documents");
    container.innerHTML = docs.map(d => `
      <tr>
        <td><strong>${d.id}</strong></td>
        <td>${d.title}<br><small>Người gửi: ${d.owner_name} (${d.owner_email})</small></td>
        <td><code>${d.sha256_hash.substring(0, 16)}...</code></td>
        <td><span class="badge ${d.status === 'VERIFIED' ? 'badge-success' : (d.status === 'REJECTED' ? 'badge-danger' : 'badge-warning')}">${d.status}</span></td>
        <td>${d.created_at.substring(0, 10)}</td>
        <td>
          ${d.status === 'PENDING' ? `
            <button class="btn btn-primary btn-sm" onclick="openApproveModal('${d.id}', '${d.title}')">Phê duyệt</button>
            <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="openRejectModal('${d.id}')">Từ chối</button>
          ` : `<small style="color:var(--text-muted);">Đã hoàn tất</small>`}
        </td>
      </tr>
    `).join("");
  } catch (e) {}
}

async function openApproveModal(docId, title) {
  const note = prompt(`Nhập ghi chú thẩm định cho hồ sơ "${title}" (${docId}):`, "Đã kiểm tra tính toàn vẹn chữ ký và hash SHA-256.");
  if (note === null) return;

  try {
    await apiRequest(`/api/admin/documents/${docId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: note })
    });
    showToast("Hồ sơ đã được phê duyệt thành công!", "success");
    loadVerifierDocuments();
  } catch (e) {}
}

async function openRejectModal(docId) {
  const reason = prompt(`Nhập lý do từ chối hồ sơ ${docId}:`, "Nội dung tài liệu thiếu thông tin đính kèm.");
  if (!reason) return;

  try {
    await apiRequest(`/api/admin/documents/${docId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });
    showToast("Hồ sơ đã được cập nhật trạng thái từ chối.", "info");
    loadVerifierDocuments();
  } catch (e) {}
}

// Admin Panel
async function loadAdminData() {
  loadAdminStats();
  loadAdminUsers();
  loadAdminAuditLogs();
}

async function loadAdminStats() {
  try {
    const stats = await apiRequest("/api/admin/stats");
    document.getElementById("stat-users").innerText = stats.total_users;
    document.getElementById("stat-docs").innerText = stats.total_documents;
    document.getElementById("stat-verified").innerText = stats.verified_documents;
    document.getElementById("stat-ipfs").innerText = stats.ipfs_status;
  } catch (e) {}
}

async function loadAdminUsers() {
  const container = document.getElementById("admin-users-table-body");
  if (!container) return;
  try {
    const users = await apiRequest("/api/admin/users");
    container.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.full_name}</strong><br><small>${u.email}</small></td>
        <td><span class="badge badge-info">${u.role}</span></td>
        <td>${u.is_active ? '<span class="badge badge-success">Hoạt động</span>' : '<span class="badge badge-danger">Đã khóa</span>'}</td>
        <td>${u.created_at.substring(0, 10)}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="toggleUserActive('${u.id}', ${!u.is_active})">
            ${u.is_active ? 'Khóa' : 'Kích hoạt'}
          </button>
        </td>
      </tr>
    `).join("");
  } catch (e) {}
}

async function toggleUserActive(userId, newStatus) {
  try {
    await apiRequest(`/api/admin/users/${userId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newStatus })
    });
    showToast("Đã cập nhật trạng thái người dùng.", "success");
    loadAdminUsers();
  } catch (e) {}
}

async function loadAdminAuditLogs() {
  const container = document.getElementById("admin-logs-table-body");
  if (!container) return;
  try {
    const logs = await apiRequest("/api/admin/audit-logs");
    container.innerHTML = logs.map(l => `
      <tr>
        <td><small>${l.timestamp.replace('T', ' ').substring(0, 19)}</small></td>
        <td><strong>${l.action}</strong></td>
        <td>${l.user_email}</td>
        <td>${l.details}</td>
        <td><span class="badge ${l.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}">${l.status}</span></td>
      </tr>
    `).join("");
  } catch (e) {}
}

async function triggerDatabaseBackup() {
  try {
    const res = await apiRequest("/api/admin/backup", { method: "POST" });
    showToast(`Đã sao lưu JSON thành công: ${res.backup_file}`, "success");
  } catch (e) {}
}

// Dark / Light Theme
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("docseal_theme", isDark ? "dark" : "light");
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) btn.innerHTML = isDark ? "☀️ Sáng" : "🌙 Tối";
}

// Initial bootstrap
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("docseal_theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.innerHTML = "☀️ Sáng";
  }
  checkAuth();
  
  // Drag & drop handlers for upload box
  const dropzone = document.getElementById("upload-dropzone");
  const fileInput = document.getElementById("upload-file-input");
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelectPreview(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFileSelectPreview(e.target.files[0]);
      }
    });
  }

  // Check URL params for verify deep link
  const pathParts = window.location.pathname.split("/");
  if (pathParts.length >= 3 && pathParts[1] === "verify") {
    const docId = pathParts[2];
    startVerificationWithId(docId);
  }
});

async function handleFileSelectPreview(file) {
  const preview = document.getElementById("upload-file-preview");
  if (!preview) return;
  const hash = await computeFileSHA256(file);
  preview.innerHTML = `
    <div style="background:var(--surface-alt);padding:0.75rem 1rem;border-radius:6px;margin-top:0.75rem;text-align:left;font-size:0.875rem;">
      <p><strong>Tệp:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
      <p><strong>SHA-256 tính toán tức thì (Client):</strong> <code style="word-break:break-all;">${hash}</code></p>
    </div>
  `;
}
