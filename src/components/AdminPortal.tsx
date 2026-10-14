import React, { useState } from "react";
import { Users, FileText, CheckCircle, Database, Shield, Download, RotateCcw, AlertTriangle, Activity } from "lucide-react";
import { docSealStore } from "../store";
import { User } from "../types";

interface AdminPortalProps {
  currentUser: User;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "logs">("stats");

  const users = docSealStore.getUsers();
  const docs = docSealStore.getDocuments();
  const logs = docSealStore.getAuditLogs();
  const vers = docSealStore.getVerifications();

  const verifiedCount = docs.filter(d => d.status === "VERIFIED").length;
  const pendingCount = docs.filter(d => d.status === "PENDING").length;
  const rejectedCount = docs.filter(d => d.status === "REJECTED").length;
  const totalStorageBytes = docs.reduce((acc, d) => acc + d.file_size, 0);

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      users: docSealStore.getUsers(),
      documents: docSealStore.getDocuments(),
      audit_logs: docSealStore.getAuditLogs(),
      verification_records: docSealStore.getVerifications()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docseal_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    docSealStore.logAction(currentUser.email, "BACKUP_CREATED", "Tải xuống snapshot sao lưu toàn diện JSON.");
  };

  const handleResetData = () => {
    if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu về trạng thái mẫu ban đầu?")) {
      docSealStore.resetToDefault();
      alert("Đã khôi phục dữ liệu mặc định thành công.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 mb-3">
            <Shield className="w-4 h-4 text-purple-600" />
            Bảng Quản Trị Hệ Thống (Zero-SQL Engine)
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Quản Trị Nền Tảng & Nhật Ký Kiểm Toán
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Thống kê thời gian thực từ kho JSON, quản lý tài khoản người dùng và nhật ký Audit Log bảo mật.
          </p>
        </div>

        {/* Backup button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Sao lưu dữ liệu JSON
          </button>
          <button
            onClick={handleResetData}
            title="Đặt lại dữ liệu mẫu"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng người dùng</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</p>
          <span className="text-[11px] text-slate-400">1 Quản trị, 1 Thẩm định</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng số hồ sơ</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{docs.length}</p>
          <span className="text-[11px] text-slate-400">{(totalStorageBytes / 1024).toFixed(1)} KB lưu trữ</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Đã xác minh</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{verifiedCount}</p>
          <span className="text-[11px] text-slate-400">{pendingCount} hồ sơ chờ duyệt</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Mạng IPFS Kubo</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">ONLINE</p>
          <span className="text-[11px] text-slate-400">Ghim (Pinned): {docs.filter(d => d.ipfs_cid).length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "stats"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Tổng quan hồ sơ
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "users"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Quản lý người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "logs"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Nhật ký kiểm toán Audit Logs ({logs.length})
        </button>
      </div>

      {/* Tab: Stats & Overview */}
      {activeTab === "stats" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Kiến Trúc Dữ Liệu Zero-SQL & Tình Trạng Lưu Trữ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white text-sm">Cơ chế Ghi Nguyên Tử (Atomic Writes):</p>
              <p>Mỗi lần cập nhật JSON được ghi vào một file tạm thời trong <code>storage/temp</code>, thực hiện <code>fsync()</code> để đảm bảo dữ liệu ghi xuống đĩa trước khi dùng <code>os.replace()</code> thay thế file mục tiêu.</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Không bao giờ bị hỏng file khi mất điện đột ngột.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white text-sm">Khóa Luồng (Thread-safe Access):</p>
              <p>Sử dụng <code>threading.Lock</code> độc lập cho từng file JSON để ngăn chặn race condition khi nhiều yêu cầu ghi đè xảy ra đồng thời từ nhiều người dùng.</p>
              <p className="text-sky-600 dark:text-sky-400 font-semibold">✓ Đảm bảo tính toàn vẹn tuyệt đối (ACID-like).</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Họ Tên & Email</th>
                <th className="px-6 py-4">Vai Trò (Role)</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4">Ngày Tạo</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{u.full_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                      u.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : u.role === "VERIFIER"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_active ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Đang hoạt động</span>
                    ) : (
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">Đã bị khóa</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">{u.created_at.substring(0, 10)}</td>
                  <td className="px-6 py-4 text-right">
                    {u.id === currentUser.id ? (
                      <span className="text-xs text-slate-400 italic">Tài khoản của bạn</span>
                    ) : (
                      <button
                        onClick={() => docSealStore.toggleUserStatus(u.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          u.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400"
                        }`}
                      >
                        {u.is_active ? "Khóa tài khoản" : "Kích hoạt lại"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === "logs" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Thời Gian</th>
                <th className="px-6 py-4">Hành Động</th>
                <th className="px-6 py-4">Tài Khoản</th>
                <th className="px-6 py-4">Chi Tiết Thao Tác</th>
                <th className="px-6 py-4">Hồ Sơ Liên Quan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-xs">
                  <td className="px-6 py-3 font-mono text-slate-400 whitespace-nowrap">
                    {log.timestamp.replace("T", " ").substring(0, 19)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-500 whitespace-nowrap">{log.user_email}</td>
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{log.details}</td>
                  <td className="px-6 py-3 font-mono text-sky-600 dark:text-sky-400 whitespace-nowrap">
                    {log.document_id || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
