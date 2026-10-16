import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageSquare, PlusCircle, LogOut, Sun, Moon, Package, FileText, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { KarmaBadge } from '../components/features/KarmaBadge';
import { BaseButton } from '../components/base/BaseButton';
import { SuspendedAccountModal } from '../components/features/SuspendedAccountModal';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDark, setIsDark] = React.useState(false);
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                Campus<span className="text-blue-600">Market</span>
              </span>
              <p className="text-[10px] text-slate-400 -mt-1 font-medium">Chợ Sinh Viên Tin Cậy</p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đổi giao diện"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (user.status === 'SUSPENDED' || user.status === 'BANNED' || user.status === 'BLOCKED') {
                      setIsSuspendedModalOpen(true);
                    } else {
                      navigate('/create-listing');
                    }
                  }}
                  className="hidden sm:inline-block"
                >
                  <BaseButton variant="primary" size="sm" className="gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    <span>Đăng bài</span>
                  </BaseButton>
                </button>

                <Link to="/rentals" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Hợp đồng thuê đồ (US-10)">
                  <FileText className="w-5 h-5" />
                </Link>

                <Link to="/my-listings" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Kho đồ của tôi">
                  <Package className="w-5 h-5" />
                </Link>

                <Link to="/chat" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative" title="Tin nhắn Realtime">
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <Link to="/profile" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity" title="Hồ sơ cá nhân">
                    <KarmaBadge score={user.karmaScore} showText={false} />
                    <span className="text-xs font-semibold hidden md:inline-block max-w-[100px] truncate text-slate-700 dark:text-slate-200">
                      {user.fullName}
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/auth/login');
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <BaseButton variant="outline" size="sm">Đăng nhập</BaseButton>
                </Link>
                <Link to="/auth/register">
                  <BaseButton variant="primary" size="sm">Đăng ký</BaseButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Persistent Suspended Account Notification Banner */}
      {isAuthenticated && (user?.status === 'SUSPENDED' || user?.status === 'BANNED' || user?.status === 'BLOCKED') && (
        <div
          onClick={() => setIsSuspendedModalOpen(true)}
          className="bg-amber-500/15 dark:bg-amber-500/20 border-b border-amber-400/30 px-4 py-2.5 text-center text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:bg-amber-500/25 transition-colors"
          title="Bấm để xem thời gian khóa còn lại và liên hệ Ban Quản Trị"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Tài khoản đang bị tạm khóa:</strong> Tài khoản của bạn hiện bị tạm khóa các chức năng đăng bài, mua bán trao đổi và nhắn tin do vi phạm quy định sàn{user.blockReason ? ` (${user.blockReason})` : ''}.
            <span className="font-bold underline ml-1.5 text-amber-800 dark:text-amber-300">
              👉 Bấm xem thời gian khóa còn lại & Liên hệ Admin
            </span>
          </span>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Suspended Account Live Countdown & Contact Admin Modal */}
      <SuspendedAccountModal
        isOpen={isSuspendedModalOpen}
        onClose={() => setIsSuspendedModalOpen(false)}
        user={user}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Campus Marketplace. Nền tảng P2P sinh viên Việt Nam.</p>
          <div className="flex items-center gap-3">
            <p className="text-slate-400">Tuân thủ Nghị định 13/2023/NĐ-CP</p>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link to="/admin/login" className="text-slate-400 hover:text-indigo-500 font-medium transition-colors">
              Cổng Quản Trị Viên
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
