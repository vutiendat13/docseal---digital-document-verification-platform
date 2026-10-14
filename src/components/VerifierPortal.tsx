import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck, UserCheck, Search, Info } from "lucide-react";
import { docSealStore } from "../store";
import { DocumentItem, User } from "../types";

interface VerifierPortalProps {
  currentUser: User;
  onVerifyDoc: (docId: string) => void;
}

export const VerifierPortal: React.FC<VerifierPortalProps> = ({ currentUser, onVerifyDoc }) => {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [selectedDocForAction, setSelectedDocForAction] = useState<{
    doc: DocumentItem;
    action: "approve" | "reject";
  } | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const allDocs = docSealStore.getDocuments();
  const displayedDocs = activeTab === "pending"
    ? allDocs.filter(d => d.status === "PENDING")
    : allDocs;

  const handleConfirmAction = () => {
    if (!selectedDocForAction) return;
    const { doc, action } = selectedDocForAction;

    // Check self-approval guard
    if (doc.owner_id === currentUser.id) {
      alert("Quy tắc bảo mật độc lập: Người nộp hồ sơ không được phép tự phê duyệt hoặc từ chối hồ sơ của chính mình.");
      return;
    }

    if (action === "approve") {
      docSealStore.approveDocument(
        doc.id,
        currentUser,
        actionNotes.trim() || "Đã đối chiếu tính toàn vẹn chữ ký và SHA-256 bản gốc. Dữ liệu khớp 100%."
      );
    } else {
      if (!actionNotes.trim()) {
        alert("Vui lòng nhập lý do từ chối hồ sơ.");
        return;
      }
      docSealStore.rejectDocument(doc.id, currentUser, actionNotes.trim());
    }

    setSelectedDocForAction(null);
    setActionNotes("");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-3">
          <UserCheck className="w-4 h-4 text-amber-600" />
          Khu vực nghiệp vụ Thẩm định viên & Công chứng viên
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cổng Xử Lý & Thẩm Định Tính Toàn Vẹn Hồ Sơ
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
          Kiểm tra tài liệu được gửi lên, đối chiếu dấu vân tay cryptographic SHA-256 và xác nhận tính hợp lệ theo quy trình nghiệp vụ độc lập.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Hồ sơ chờ thẩm định ({allDocs.filter(d => d.status === "PENDING").length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "all"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Tất cả hồ sơ hệ thống ({allDocs.length})
        </button>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {displayedDocs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Không có hồ sơ nào đang chờ thẩm định!</p>
            <p className="text-xs text-slate-500 mt-1">Tất cả các tài liệu đã được rà soát hoặc chưa có yêu cầu mới.</p>
          </div>
        ) : (
          displayedDocs.map(doc => {
            const isSelfUploaded = doc.owner_id === currentUser.id;
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                      {doc.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400">({doc.tracking_code})</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      doc.status === "VERIFIED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : doc.status === "REJECTED"
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {doc.status}
                    </span>
                    {isSelfUploaded && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                        (Bạn là người nộp)
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {doc.title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                    <p>
                      <strong>Người nộp:</strong> {doc.owner_name} ({doc.owner_email})
                    </p>
                    <p>
                      <strong>Thời gian tiếp nhận:</strong> {doc.created_at.substring(0, 10)}
                    </p>
                    <p className="sm:col-span-2">
                      <strong>Tệp gốc:</strong> {doc.original_filename} ({(doc.file_size / 1024).toFixed(1)} KB)
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                    SHA-256: {doc.sha256_hash}
                  </div>

                  {doc.verifier_notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      Ghi chú: {doc.verifier_notes} (bởi {doc.verifier_name})
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center justify-end gap-2 flex-shrink-0">
                  <button
                    onClick={() => onVerifyDoc(doc.id)}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Kiểm tra đối chiếu
                  </button>

                  {doc.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => {
                          if (isSelfUploaded) {
                            alert("Bạn không thể tự duyệt hồ sơ do chính mình tải lên.");
                            return;
                          }
                          setSelectedDocForAction({ doc, action: "approve" });
                          setActionNotes("Đã đối chiếu tính toàn vẹn chữ ký và SHA-256 bản gốc. Dữ liệu khớp 100%.");
                        }}
                        disabled={isSelfUploaded}
                        className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Phê duyệt
                      </button>

                      <button
                        onClick={() => {
                          if (isSelfUploaded) {
                            alert("Bạn không thể tự từ chối hồ sơ do chính mình tải lên.");
                            return;
                          }
                          setSelectedDocForAction({ doc, action: "reject" });
                          setActionNotes("");
                        }}
                        disabled={isSelfUploaded}
                        className="w-full px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Modal (Approve or Reject) */}
      {selectedDocForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {selectedDocForAction.action === "approve"
                ? "Xác Nhận Phê Duyệt Hồ Sơ"
                : "Xác Nhận Từ Chối Hồ Sơ"}
            </h3>
            <p className="text-xs text-slate-500">
              Hồ sơ: <strong className="text-slate-800 dark:text-slate-200">{selectedDocForAction.doc.title}</strong> ({selectedDocForAction.doc.id})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {selectedDocForAction.action === "approve"
                  ? "Ghi chú phê duyệt thẩm định:"
                  : "Lý do từ chối (Bắt buộc):"}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  selectedDocForAction.action === "approve"
                    ? "Nhập ghi chú kiểm tra chữ ký số, tính toàn vẹn..."
                    : "Nhập lý do tài liệu không đạt yêu cầu..."
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDocForAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
                  selectedDocForAction.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                Xác nhận {selectedDocForAction.action === "approve" ? "Phê duyệt" : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
