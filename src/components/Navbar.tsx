import React from "react";
import { ShieldCheck, LogOut, FileText, CheckCircle2, Upload, LayoutDashboard, Settings, Sun, Moon } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
  onQuickSwitchUser: (role: "ADMIN" | "VERIFIER" | "USER") => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onQuickSwitchUser,
  isDarkMode,
  onToggleDarkMode
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectTab("home")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700 dark:from-white dark:via-sky-100 dark:to-sky-300 bg-clip-text text-transparent">
                DocSeal
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-400 border border-sky-300 dark:border-sky-800">
                IPFS • Zero-SQL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Digital Document Verification</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectTab("home")}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === "home"
                ? "bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            Trang chủ
          </button>

          <button
            onClick={() => onSelectTab("verify")}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === "verify"
                ? "bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Tra cứu & Xác minh
          </button>

          <button
            onClick={() => onSelectTab("upload")}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              currentTab === "upload"
                ? "bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <Upload className="w-4 h-4 text-sky-500" />
            Tiếp nhận hồ sơ
          </button>

          {currentUser && (
            <button
              onClick={() => onSelectTab("dashboard")}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === "dashboard"
                  ? "bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-500" />
              Hồ sơ của tôi
            </button>
          )}

          {currentUser && (currentUser.role === "VERIFIER" || currentUser.role === "ADMIN") && (
            <button
              onClick={() => onSelectTab("verifier")}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === "verifier"
                  ? "bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <FileText className="w-4 h-4 text-amber-500" />
              Thẩm định viên
            </button>
          )}

          {currentUser && currentUser.role === "ADMIN" && (
            <button
              onClick={() => onSelectTab("admin")}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === "admin"
                  ? "bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Settings className="w-4 h-4 text-purple-500" />
              Quản trị viên
            </button>
          )}
        </nav>

        {/* Right side: Light/Dark toggle & User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold leading-tight text-slate-900 dark:text-white">{currentUser.full_name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                  currentUser.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/80 dark:text-purple-300 dark:border-purple-700"
                    : currentUser.role === "VERIFIER"
                    ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/80 dark:text-amber-300 dark:border-amber-700"
                    : "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/80 dark:text-blue-300 dark:border-blue-700"
                }`}
              >
                {currentUser.role}
              </span>

              {/* Quick switch role dropdown */}
              <select
                value={currentUser.role}
                onChange={(e) => onQuickSwitchUser(e.target.value as any)}
                title="Đổi nhanh vai trò thử nghiệm"
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded px-2 py-1 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="ADMIN">Đổi: ADMIN</option>
                <option value="VERIFIER">Đổi: VERIFIER</option>
                <option value="USER">Đổi: USER</option>
              </select>

              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth("login")}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav scrollbar */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
        <button
          onClick={() => onSelectTab("home")}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentTab === "home" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}
        >
          Trang chủ
        </button>
        <button
          onClick={() => onSelectTab("verify")}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentTab === "verify" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}
        >
          Xác minh
        </button>
        <button
          onClick={() => onSelectTab("upload")}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentTab === "upload" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}
        >
          Tiếp nhận
        </button>
        {currentUser && (
          <button
            onClick={() => onSelectTab("dashboard")}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentTab === "dashboard" ? "bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}
          >
            Hồ sơ
          </button>
        )}
        {currentUser && (currentUser.role === "VERIFIER" || currentUser.role === "ADMIN") && (
          <button
            onClick={() => onSelectTab("verifier")}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentTab === "verifier" ? "bg-slate-200 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}
          >
            Thẩm định
          </button>
        )}
        {currentUser && currentUser.role === "ADMIN" && (
          <button
            onClick={() => onSelectTab("admin")}
            className={`px-2.5 py-1 text-xs rounded whitespace-nowrap ${currentTab === "admin" ? "bg-slate-200 dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-semibold" : "text-slate-600 dark:text-slate-400"}`}
          >
            Quản trị
          </button>
        )}
      </div>
    </header>
  );
};
