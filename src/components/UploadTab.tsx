import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, ShieldAlert, QrCode, ArrowRight, Lock } from "lucide-react";
import { docSealStore, computeSHA256, generateQRUri } from "../store";
import { DocumentItem, User } from "../types";

interface UploadTabProps {
  currentUser: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onVerifyDoc: (docId: string) => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({ currentUser, onOpenAuth, onVerifyDoc }) => {
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [enableIpfsKubo, setEnableIpfsKubo] = useState(true);
  const [receipt, setReceipt] = useState<DocumentItem | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      const hash = await computeSHA256(file);
      setComputedHash(hash);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Vui lòng đăng nhập trước khi tải hồ sơ lên hệ thống.");
      onOpenAuth("login");
      return;
    }

    if (!selectedFile) {
      alert("Vui lòng chọn tệp tài liệu cần tiếp nhận.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    // Simulate progress and encryption
    setTimeout(async () => {
      setUploadProgress(65);
      setTimeout(async () => {
        setUploadProgress(100);

        // Generate IPFS CID if enabled
        const cid = enableIpfsKubo
          ? `Qm${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}wNPbdG`
          : null;

        const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "pdf";

        const newDoc = docSealStore.addDocument({
          title: title.trim() || selectedFile.name,
          original_filename: selectedFile.name,
          file_size: selectedFile.size,
          file_extension: ext,
          mime_type: selectedFile.type || "application/octet-stream",
          sha256_hash: computedHash,
          ipfs_cid: cid,
          ipfs_status: cid ? "PINNED" : "LOCAL_ONLY",
          owner_id: currentUser.id,
          owner_email: currentUser.email,
          owner_name: currentUser.full_name,
          status: "PENDING",
          status_description: "Hồ sơ mới tạo, đang chờ kiểm tra và xác nhận bởi người có thẩm quyền.",
          is_encrypted: true,
        });

        setIsUploading(false);
        setReceipt(newDoc);
      }, 400);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Tiếp Nhận Tài Liệu Số & Băm Dấu Vân Tay
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
          Tài liệu được băm SHA-256 ngay trên máy của bạn, mã hóa AES-256 phía máy chủ và đưa vào quy trình thẩm định.
        </p>
      </div>

      {!currentUser && (
        <div className="mb-6 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-300 text-sm flex items-center justify-between">
          <span>Bạn đang ở chế độ khách vãng lai. Hãy đăng nhập để lưu trữ hồ sơ dưới tài khoản của bạn.</span>
          <button
            onClick={() => onOpenAuth("login")}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Tiêu Đề / Trích Yếu Hồ Sơ:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Hợp đồng nguyên tắc cung ứng dịch vụ công nghệ 2026..."
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>

          {/* Drag & Drop File */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Tệp Tin Tài Liệu (PDF, DOCX, TXT, Hình ảnh):
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-sky-500 dark:hover:border-sky-400 transition-colors bg-slate-50/50 dark:bg-slate-800/20 cursor-pointer relative">
              <input
                type="file"
                onChange={handleFileChange}
                required
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              {selectedFile ? (
                <div>
                  <p className="text-base font-bold text-sky-600 dark:text-sky-400">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "file"}
                  </p>
                  {computedHash && (
                    <div className="mt-3 text-left bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Dấu vân tay SHA-256 tính toán tức thì (Client-side):
                      </p>
                      <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 break-all">
                        {computedHash}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Kéo thả tệp tin hoặc nhấn để duyệt tệp từ máy tính
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Dung lượng tối đa 25MB • Tính toán SHA-256 an toàn
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* IPFS Toggle & Security Options */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Lưu trữ phi tập trung IPFS (Kubo RPC)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableIpfsKubo}
                  onChange={(e) => setEnableIpfsKubo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {/* Privacy Warning */}
            <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Cảnh báo quyền riêng tư IPFS:</strong> Mạng IPFS là công khai. DocSeal sẽ tự động mã hóa AES-256 trước khi đưa lên IPFS để bảo vệ bí mật nội dung. Chỉ người có thẩm quyền với khóa giải mã phía máy chủ mới có thể xem tệp gốc.
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1 font-mono">
                <span>Đang xử lý mã hóa & tải lên...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="w-full py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            {isUploading ? "Đang tiếp nhận và băm dấu vân tay..." : "Xác Nhận Tiếp Nhận Hồ Sơ"}
          </button>
        </form>

        {/* Receipt Display */}
        {receipt && (
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <h3 className="text-lg font-bold">Hồ Sơ Đã Được Tiếp Nhận Thành Công!</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-2 text-sm text-slate-800 dark:text-slate-200">
                  <p>
                    <span className="text-slate-500 text-xs block">Mã định danh hồ sơ (Document ID):</span>
                    <strong className="font-mono text-base text-sky-600 dark:text-sky-400">{receipt.id}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 text-xs block">Mã tra cứu rút gọn:</span>
                    <strong className="font-mono">{receipt.tracking_code}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 text-xs block">Dấu vân tay SHA-256 gốc:</span>
                    <code className="text-xs font-mono break-all bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 block">
                      {receipt.sha256_hash}
                    </code>
                  </p>
                  <p>
                    <span className="text-slate-500 text-xs block">Trạng thái lưu trữ IPFS:</span>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
                      {receipt.ipfs_status}
                    </span>{" "}
                    {receipt.ipfs_cid && (
                      <span className="font-mono text-xs text-slate-500">({receipt.ipfs_cid})</span>
                    )}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img
                    src={generateQRUri(`http://127.0.0.1:8000/verify/${receipt.id}`)}
                    alt="Mã QR tra cứu hồ sơ"
                    className="w-32 h-32 rounded-lg"
                  />
                  <span className="text-[11px] text-slate-500 mt-2 font-mono">Quét để tra cứu</span>
                  <button
                    onClick={() => onVerifyDoc(receipt.id)}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    Xác minh ngay <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
