/**
 * DocSeal — Digital Document Verification Platform
 * Full-Stack Client running in AI Studio with Three.js, IPFS & Zero-SQL Persistence
 * Includes Light & Dark Mode Support
 */

import React, { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { ThreeHeroScene } from "./components/ThreeHeroScene";
import { VerifyTab } from "./components/VerifyTab";
import { UploadTab } from "./components/UploadTab";
import { UserDashboard } from "./components/UserDashboard";
import { VerifierPortal } from "./components/VerifierPortal";
import { AdminPortal } from "./components/AdminPortal";
import { AuthModal } from "./components/AuthModal";
import { docSealStore } from "./store";
import { User } from "./types";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe,
  QrCode,
  FileText,
  Search,
  Upload,
  ArrowRight,
  Info,
  Layers,
  Database,
  ChevronRight
} from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [currentUser, setCurrentUser] = useState<User | null>(docSealStore.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [prefilledVerifyDocId, setPrefilledVerifyDocId] = useState<string>("");

  // Light / Dark Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("docseal_theme");
    return saved ? saved === "dark" : false; // Default to clean modern light theme, toggleable to dark
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("docseal_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("docseal_theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = docSealStore.subscribe(() => {
      setCurrentUser(docSealStore.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    docSealStore.logout();
    setCurrentTab("home");
  };

  const handleQuickSwitchUser = (role: "ADMIN" | "VERIFIER" | "USER") => {
    const users = docSealStore.getUsers();
    const target = users.find(u => u.role === role);
    if (target) {
      docSealStore.setCurrentUser(target);
    }
  };

  const handleNavigateToVerify = (docId: string) => {
    setPrefilledVerifyDocId(docId);
    setCurrentTab("verify");
  };

  const docs = docSealStore.getDocuments();
  const users = docSealStore.getUsers();
  const verifiedCount = docs.filter(d => d.status === "VERIFIED").length;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode
          ? "dark bg-slate-950 text-slate-100 selection:bg-sky-600 selection:text-white"
          : "bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white"
      }`}
    >
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onQuickSwitchUser={handleQuickSwitchUser}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Areas */}
      <div className="flex-1">
        {/* TAB 1: HOME */}
        {currentTab === "home" && (
          <main>
            {/* Hero Section */}
            <section
              className={`relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-20 border-b transition-colors duration-200 ${
                isDarkMode
                  ? "border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
                  : "border-slate-200 bg-gradient-to-b from-sky-50/80 via-white to-slate-50"
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Column: Copy & Actions */}
                  <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-inner ${
                        isDarkMode
                          ? "bg-sky-950/80 text-sky-400 border border-sky-800/80"
                          : "bg-sky-100 text-sky-800 border border-sky-200"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      Xác minh tài liệu số minh bạch & đáng tin cậy
                    </div>

                    <h1
                      className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      Bảo vệ tính toàn vẹn hồ sơ với{" "}
                      <span className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        IPFS & SHA-256
                      </span>
                    </h1>

                    <p
                      className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal ${
                        isDarkMode ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Nền tảng DocSeal cung cấp quy trình tiếp nhận tệp tin, băm dấu vân tay mật mã, lưu trữ phân tán trên mạng IPFS Kubo và đối chiếu toàn vẹn 7 bước, ngăn chặn giả mạo và chỉnh sửa trái phép.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                      <button
                        onClick={() => setCurrentTab("verify")}
                        className="px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-sm shadow-xl shadow-sky-600/25 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        Tra cứu & Xác minh ngay
                      </button>

                      <button
                        onClick={() => setCurrentTab("upload")}
                        className={`px-6 py-3.5 rounded-xl border font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                          isDarkMode
                            ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-white"
                            : "bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm"
                        }`}
                      >
                        <Upload className="w-4 h-4 text-sky-500" />
                        Tiếp nhận hồ sơ mới
                      </button>
                    </div>

                    {/* Quick Demo Accounts Bar */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        Đăng nhập nhanh để trải nghiệm các phân quyền (RBAC):
                      </p>
                      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                        <button
                          onClick={() => handleQuickSwitchUser("ADMIN")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900 transition-colors"
                        >
                          Quản trị viên (ADMIN)
                        </button>
                        <button
                          onClick={() => handleQuickSwitchUser("VERIFIER")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900 transition-colors"
                        >
                          Thẩm định viên (VERIFIER)
                        </button>
                        <button
                          onClick={() => handleQuickSwitchUser("USER")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900 transition-colors"
                        >
                          Người dùng (USER)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Three.js 3D Scene */}
                  <div className="lg:col-span-5 w-full">
                    <ThreeHeroScene isDarkMode={isDarkMode} />
                  </div>
                </div>
              </div>
            </section>

            {/* Legal Honesty Disclaimer Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3 shadow-xl backdrop-blur-sm">
                <Info className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <strong className="text-amber-950 dark:text-amber-100 font-bold block mb-0.5">
                    NGUYÊN TẮC TRUNG THỰC VỀ CÔNG CHỨNG VÀ PHÁP LÝ:
                  </strong>
                  DocSeal là giải pháp kỹ thuật hỗ trợ quản lý hồ sơ, ghi nhận mốc thời gian và xác minh tính toàn vẹn dữ liệu (SHA-256) trên IPFS. Nền tảng <strong>không tự động tuyên bố</strong> tài liệu có giá trị công chứng pháp lý nếu chưa trải qua quy trình chữ ký số với chứng thư số chuyên dùng của tổ chức hành nghề công chứng được cấp phép theo quy định pháp luật.
                </div>
              </div>
            </div>

            {/* Live Stats from Zero-SQL Engine */}
            <section className="py-12 border-b border-slate-200 dark:border-slate-900">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">Tổng hồ sơ tiếp nhận</p>
                    <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{docs.length}</p>
                    <span className="text-[11px] text-slate-500">Ghi nhận trong documents.json</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">Hồ sơ đã phê duyệt</p>
                    <p className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">{verifiedCount}</p>
                    <span className="text-[11px] text-slate-500">Được thẩm định viên xác nhận</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">Mạng IPFS Kubo</p>
                    <p className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400">100%</p>
                    <span className="text-[11px] text-slate-500">HTTP RPC API /api/v0</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">Cơ chế lưu trữ</p>
                    <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">Zero-SQL</p>
                    <span className="text-[11px] text-slate-500">Atomic Write &amp; Thread-Lock</span>
                  </div>
                </div>
              </div>
            </section>

            {/* System Pillars & Features */}
            <section className="py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Công Nghệ Bảo Mật & Xác Minh Đột Phá
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
                    Được thiết kế dựa trên tiêu chuẩn mã hóa quốc tế và công nghệ lưu trữ phi tập trung thế hệ mới.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dấu Vân Tay SHA-256</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                      Tính toán giá trị băm 256-bit không thể đảo ngược ngay khi tiếp nhận. Bất kỳ sự thay đổi dù chỉ 1 ký tự trong tệp sẽ làm thay đổi toàn bộ mã băm.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lưu Trữ IPFS Kubo</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                      Tài liệu được mã hóa đối xứng AES-256 trước khi đưa lên mạng IPFS qua CID (Content Identifier), đảm bảo tính sẵn sàng cao và không bị thao túng.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                      <Database className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lưu Trữ Bền Vững Zero-SQL</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                      Sử dụng hệ thống tệp JSON thuần túy kết hợp cơ chế ghi nguyên tử (Atomic Write qua file tạm) và khóa luồng, loại bỏ hoàn toàn sự phụ thuộc vào SQL.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Workflow Steps */}
            <section className="py-16 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-900">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Quy Trình 4 Bước Tiếp Nhận & Xác Minh
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">BƯỚC 01</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Tiếp nhận & Băm SHA-256</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Người dùng kéo thả tài liệu, hệ thống tính toán giá trị băm cryptographic SHA-256 tức thì.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">BƯỚC 02</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Mã hóa & Lưu Trữ IPFS</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Tệp tin được mã hóa bảo mật AES-256 rồi ghim lên mạng IPFS Kubo để nhận mã CID.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">BƯỚC 03</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Thẩm Định Viên Rà Soát</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Công chứng viên / Thẩm định viên độc lập kiểm tra hồ sơ và ghi nhận phê duyệt nghiệp vụ.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">BƯỚC 04</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">Tra Cứu & Đối Chiếu</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Người nhận quét mã QR hoặc tải tệp lên để đối chiếu toàn vẹn 100% trong tích tắc.</p>
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {/* TAB 2: VERIFY */}
        {currentTab === "verify" && (
          <VerifyTab initialDocId={prefilledVerifyDocId} />
        )}

        {/* TAB 3: UPLOAD */}
        {currentTab === "upload" && (
          <UploadTab
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
            onVerifyDoc={handleNavigateToVerify}
          />
        )}

        {/* TAB 4: USER DASHBOARD */}
        {currentTab === "dashboard" && currentUser && (
          <UserDashboard
            currentUser={currentUser}
            onVerifyDoc={handleNavigateToVerify}
          />
        )}

        {/* TAB 5: VERIFIER PORTAL */}
        {currentTab === "verifier" && currentUser && (
          <VerifierPortal
            currentUser={currentUser}
            onVerifyDoc={handleNavigateToVerify}
          />
        )}

        {/* TAB 6: ADMIN PORTAL */}
        {currentTab === "admin" && currentUser && (
          <AdminPortal currentUser={currentUser} />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-8 text-xs text-slate-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <span className="font-bold text-slate-800 dark:text-slate-300">DocSeal</span> — Nền tảng Xác minh Tài liệu số bằng IPFS &amp; SHA-256 (Zero-SQL Architecture).
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Bản quyền 2026 DocSeal Platform</span>
            <span>Phiên bản 1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
