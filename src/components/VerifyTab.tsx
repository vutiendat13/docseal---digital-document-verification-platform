import React, { useState } from "react";
import { Search, CheckCircle, AlertTriangle, XCircle, FileCheck, Shield, QrCode, ArrowRight, Upload, Info } from "lucide-react";
import { docSealStore, computeSHA256 } from "../store";
import { DocumentItem, VerificationResultType } from "../types";

interface VerifyTabProps {
  initialDocId?: string;
}

export const VerifyTab: React.FC<VerifyTabProps> = ({ initialDocId }) => {
  const [docIdInput, setDocIdInput] = useState(initialDocId || "");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [computedFileHash, setComputedFileHash] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    result: VerificationResultType;
    message: string;
    document?: DocumentItem | null;
    providedHash?: string;
    recordedHash?: string;
    hashesMatch?: boolean;
    timestamp: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const hash = await computeSHA256(file);
      setComputedFileHash(hash);
    }
  };

  const executeVerification = async (targetId?: string) => {
    const idToSearch = (targetId || docIdInput).trim();
    if (!idToSearch && !uploadedFile) {
      alert("Vui lòng nhập Mã hồ sơ hoặc tải lên tệp tin để đối chiếu.");
      return;
    }

    setIsVerifying(true);

    // Compute hash if file is present
    let clientHash = computedFileHash;
    if (uploadedFile && !clientHash) {
      clientHash = await computeSHA256(uploadedFile);
      setComputedFileHash(clientHash);
    }

    const docs = docSealStore.getDocuments();
    const doc = docs.find(
      d => d.id.toLowerCase() === idToSearch.toLowerCase() ||
           d.tracking_code.toLowerCase() === idToSearch.toLowerCase()
    );

    const now = new Date().toISOString();

    if (!doc) {
      const res = {
        result: "NOT_FOUND" as VerificationResultType,
        message: idToSearch
          ? `Không tìm thấy hồ sơ có mã '${idToSearch}' trong hệ thống dữ liệu.`
          : "Không tìm thấy hồ sơ khớp với tệp tải lên.",
        document: null,
        providedHash: clientHash || undefined,
        timestamp: now
      };
      setVerificationResult(res);
      docSealStore.addVerificationRecord({
        document_id: idToSearch || undefined,
        result: "NOT_FOUND",
        provided_hash: clientHash,
        client_ip: "127.0.0.1",
        notes: res.message
      });
      setIsVerifying(false);
      return;
    }

    // Found document, now compare hashes
    const recordedHash = doc.sha256_hash.toLowerCase();
    const providedHashLower = clientHash.toLowerCase();
    const hashesMatch = clientHash ? (providedHashLower === recordedHash) : true;

    let resultType: VerificationResultType = "MATCH";
    let message = "";

    if (clientHash && !hashesMatch) {
      resultType = "MISMATCH";
      message = "CẢNH BÁO: Dấu vân tay SHA-256 của tệp đối chiếu KHÔNG KHỚP với bản gốc trong hồ sơ!";
    } else if (!clientHash) {
      if (doc.status === "VERIFIED") {
        resultType = "MATCH";
        message = "Tìm thấy hồ sơ đã được phê duyệt. (Chưa cung cấp tệp tin tải lên để đối chiếu toàn vẹn trực tiếp).";
      } else if (doc.status === "PENDING") {
        resultType = "PENDING_APPROVAL";
        message = "Hồ sơ tồn tại nhưng CHƯA ĐƯỢC người có thẩm quyền phê duyệt tính toàn vẹn.";
      } else {
        resultType = "MISMATCH";
        message = "Hồ sơ đã bị TỪ CHỐI bởi thẩm định viên.";
      }
    } else if (hashesMatch) {
      if (doc.status === "VERIFIED") {
        resultType = "MATCH";
        message = "XÁC MINH THÀNH CÔNG: Dấu vân tay SHA-256 hoàn toàn trùng khớp với bản đã ghi nhận và đã được phê duyệt tính toàn vẹn.";
      } else if (doc.status === "PENDING") {
        resultType = "PENDING_APPROVAL";
        message = "Nội dung tệp khớp với bản ghi ban đầu, tuy nhiên hồ sơ CHƯA ĐƯỢC thẩm định viên phê duyệt.";
      } else {
        resultType = "MISMATCH";
        message = "Tệp tin khớp với bản lưu, nhưng hồ sơ đã bị TỪ CHỐI bởi người thẩm định.";
      }
    }

    const outcome = {
      result: resultType,
      message,
      document: doc,
      providedHash: clientHash || undefined,
      recordedHash: doc.sha256_hash,
      hashesMatch,
      timestamp: now
    };

    setVerificationResult(outcome);

    docSealStore.addVerificationRecord({
      document_id: doc.id,
      result: resultType,
      provided_hash: clientHash || undefined,
      recorded_hash: doc.sha256_hash,
      ipfs_cid: doc.ipfs_cid,
      verifier_status: doc.status,
      client_ip: "127.0.0.1",
      notes: message
    });

    setIsVerifying(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-3">
          <Shield className="w-4 h-4 text-sky-600" />
          Quy trình kiểm tra 7 bước minh bạch
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Tra Cứu & Xác Minh Toàn Vẹn Tài Liệu Số
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl mx-auto text-sm">
          Nhập mã hồ sơ hoặc kéo thả tệp tin để hệ thống băm lại SHA-256 trong trình duyệt bằng Web Crypto API và đối chiếu với dữ liệu lưu trữ phi tập trung IPFS.
        </p>
      </div>

      {/* Quick Test Chips */}
      <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Hồ sơ mẫu có sẵn để thử nghiệm:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setDocIdInput("DOC-9842-8721");
              executeVerification("DOC-9842-8721");
            }}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-emerald-500 font-mono text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            DOC-9842-8721 (Hợp đồng đã duyệt)
          </button>
          <button
            onClick={() => {
              setDocIdInput("DOC-7123-5541");
              executeVerification("DOC-7123-5541");
            }}
            className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-amber-500 font-mono text-amber-600 dark:text-amber-400 transition-colors"
          >
            DOC-7123-5541 (Bằng ĐH đang chờ duyệt)
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="space-y-6">
          {/* Doc ID input */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Mã Hồ Sơ (Document ID) hoặc Mã Tra Cứu:
            </label>
            <div className="relative">
              <input
                type="text"
                value={docIdInput}
                onChange={(e) => setDocIdInput(e.target.value)}
                placeholder="Nhập mã ví dụ: DOC-9842-8721 hoặc DS-2026-9842..."
                className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* File Upload to compare */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Tệp Tin Cần Đối Chiếu Trực Tiếp (Tùy chọn):
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-sky-500 dark:hover:border-sky-400 transition-colors bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer relative">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {uploadedFile ? (
                <div>
                  <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  {computedFileHash && (
                    <p className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 break-all inline-block">
                      Client SHA-256: {computedFileHash}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Kéo thả tệp tin hoặc nhấn để chọn tệp đối chiếu
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Hệ thống sẽ tính toán lại SHA-256 ngay trong trình duyệt của bạn
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => executeVerification()}
            disabled={isVerifying}
            className="w-full py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileCheck className="w-5 h-5" />
            {isVerifying ? "Đang băm và đối chiếu..." : "Tiến Hành Đối Chiếu & Xác Minh"}
          </button>
        </div>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in duration-300">
          {/* Header Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-mono text-slate-500">Kết quả kiểm tra thời gian thực:</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {verificationResult.message}
              </h2>
            </div>
            <div>
              {verificationResult.result === "MATCH" && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Khớp với bản đã ghi nhận
                </span>
              )}
              {verificationResult.result === "MISMATCH" && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  Nội dung không khớp
                </span>
              )}
              {verificationResult.result === "PENDING_APPROVAL" && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Chưa được người có thẩm quyền phê duyệt
                </span>
              )}
              {verificationResult.result === "NOT_FOUND" && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  <XCircle className="w-5 h-5 text-slate-500" />
                  Không tìm thấy hồ sơ
                </span>
              )}
            </div>
          </div>

          {/* Details table if document exists */}
          {verificationResult.document && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-slate-500 text-xs">Tiêu đề tài liệu:</p>
                <p className="font-semibold text-slate-900 dark:text-white">{verificationResult.document.title}</p>
              </div>

              <div>
                <p className="text-slate-500 text-xs">Mã hồ sơ & Mã tra cứu:</p>
                <p className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                  {verificationResult.document.id} ({verificationResult.document.tracking_code})
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-slate-500 text-xs">Dấu vân tay SHA-256 gốc đã ghi nhận:</p>
                <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 mt-1">
                  {verificationResult.document.sha256_hash}
                </p>
              </div>

              {verificationResult.providedHash && (
                <div className="md:col-span-2">
                  <p className="text-slate-500 text-xs">Dấu vân tay SHA-256 tệp bạn tải lên đối chiếu:</p>
                  <p className={`font-mono text-xs break-all p-2 rounded border mt-1 ${
                    verificationResult.hashesMatch
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                      : "bg-red-50 dark:bg-red-950/40 border-red-300 text-red-800 dark:text-red-300"
                  }`}>
                    {verificationResult.providedHash}
                    {verificationResult.hashesMatch ? " (✓ Hoàn toàn trùng khớp)" : " (✗ Không trùng khớp!)"}
                  </p>
                </div>
              )}

              <div>
                <p className="text-slate-500 text-xs">Lưu trữ phân tán IPFS CID:</p>
                {verificationResult.document.ipfs_cid ? (
                  <p className="font-mono text-xs text-sky-600 dark:text-sky-400 break-all">
                    {verificationResult.document.ipfs_cid}
                  </p>
                ) : (
                  <span className="text-xs text-amber-600">Lưu trữ cục bộ an toàn (Kubo Offline)</span>
                )}
              </div>

              <div>
                <p className="text-slate-500 text-xs">Trạng thái thẩm định nghiệp vụ:</p>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                  verificationResult.document.status === "VERIFIED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                    : verificationResult.document.status === "REJECTED"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                }`}>
                  {verificationResult.document.status}
                </span>
                {verificationResult.document.verifier_name && (
                  <p className="text-xs text-slate-500 mt-1">Bởi: {verificationResult.document.verifier_name}</p>
                )}
              </div>

              {verificationResult.document.verifier_notes && (
                <div className="md:col-span-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ghi chú của người thẩm định:</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{verificationResult.document.verifier_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Legal Honesty Disclaimer Box */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200 mb-1">
                NGUYÊN TẮC TRUNG THỰC VỀ PHÁP LÝ & CÔNG CHỨNG:
              </p>
              <p>
                Kết quả trên xác nhận <strong>tính toàn vẹn kỹ thuật (SHA-256)</strong> và lịch sử tiếp nhận hồ sơ trên nền tảng DocSeal cùng mạng IPFS. Kết quả này <strong>không tự động thay thế</strong> cho văn bản công chứng có giá trị pháp lý theo Luật Công chứng hiện hành nếu chưa trải qua quy trình chữ ký số với chứng thư số chuyên dùng của tổ chức hành nghề công chứng được cấp phép.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
