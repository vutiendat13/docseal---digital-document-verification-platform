import React, { useState } from "react";
import { FileText, Search, Download, CheckCircle, Clock, XCircle, QrCode, Eye, Shield } from "lucide-react";
import { docSealStore, generateQRUri } from "../store";
import { DocumentItem, User } from "../types";

interface UserDashboardProps {
  currentUser: User;
  onVerifyDoc: (docId: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onVerifyDoc }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedDocForQR, setSelectedDocForQR] = useState<DocumentItem | null>(null);
  const [selectedDocForHistory, setSelectedDocForHistory] = useState<DocumentItem | null>(null);

  const allDocs = docSealStore.getDocuments();
  // Filter for regular users
  const userDocs = currentUser.role === "USER"
    ? allDocs.filter(d => d.owner_id === currentUser.id || d.owner_email.toLowerCase() === currentUser.email.toLowerCase())
    : allDocs;

  const filteredDocs = userDocs.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = (doc: DocumentItem) => {
    // Generate text/binary mock download
    const blob = new Blob(
      [`DocSeal Encrypted/Decrypted Document Payload\nDocument ID: ${doc.id}\nTitle: ${doc.title}\nSHA-256: ${doc.sha256_hash}\nIPFS CID: ${doc.ipfs_cid || "LOCAL_STORAGE"}\nStatus: ${doc.status}`],
      { type: doc.mime_type }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.original_filename;
    a.click();
    URL.revokeObjectURL(url);
    docSealStore.logAction(currentUser.email, "DOCUMENT_DOWNLOAD", `Tải về tệp: ${doc.original_filename}`, doc.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hồ Sơ Của Tôi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Quản lý các tài liệu đã tiếp nhận, theo dõi tiến độ thẩm định và xem mã tra cứu.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã hoặc tên..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-56"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="VERIFIED">Đã xác minh (VERIFIED)</option>
            <option value="PENDING">Đang chờ (PENDING)</option>
            <option value="REJECTED">Từ chối (REJECTED)</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Mã Hồ Sơ & Mã Tra Cứu</th>
                <th className="px-6 py-4">Tên Hồ Sơ / Tệp Gốc</th>
                <th className="px-6 py-4">Dấu Vân Tay SHA-256</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4">Lưu Trữ IPFS</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy tài liệu nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400 block">{doc.id}</span>
                      <span className="text-xs font-mono text-slate-400">{doc.tracking_code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{doc.title}</p>
                      <span className="text-xs text-slate-500">{doc.original_filename} ({(doc.file_size / 1024).toFixed(1)} KB)</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                        {doc.sha256_hash.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.status === "VERIFIED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Đã xác minh
                        </span>
                      )}
                      {doc.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Đang chờ duyệt
                        </span>
                      )}
                      {doc.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Bị từ chối
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.ipfs_cid ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-sky-600 dark:text-sky-400">
                          CID: {doc.ipfs_cid.substring(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Cục bộ (Local)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onVerifyDoc(doc.id)}
                          title="Xác minh trực tiếp"
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors"
                        >
                          Xác minh
                        </button>
                        <button
                          onClick={() => setSelectedDocForQR(doc)}
                          title="Xem mã QR"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedDocForHistory(doc)}
                          title="Xem lịch sử xử lý"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Tải tệp tin"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedDocForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Mã QR Tra Cứu</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedDocForQR.title}</p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl inline-block border border-slate-200 dark:border-slate-700 mb-4">
              <img
                src={generateQRUri(`http://127.0.0.1:8000/verify/${selectedDocForQR.id}`)}
                alt="QR Code"
                className="w-48 h-48 mx-auto rounded"
              />
            </div>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-4">
              ID: {selectedDocForQR.id}
            </p>
            <button
              onClick={() => setSelectedDocForQR(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedDocForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Lịch Sử Xử Lý Hồ Sơ
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedDocForHistory.id} — {selectedDocForHistory.title}
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {selectedDocForHistory.history.map((ev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{ev.action}</span>
                    <span className="font-mono text-[11px]">{ev.timestamp.replace("T", " ").substring(0, 19)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{ev.notes}</p>
                  <p className="text-slate-400 mt-1 text-[11px]">Bởi: {ev.actor}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedDocForHistory(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
