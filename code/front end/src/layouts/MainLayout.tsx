import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageSquare, PlusCircle, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { KarmaBadge } from '../components/features/KarmaBadge';
import { BaseButton } from '../components/base/BaseButton';

export const MainLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDark, setIsDark] = React.useState(false);

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
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đổi giao diện"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link to="/create-listing">
                  <BaseButton variant="primary" size="sm" className="gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    <span>Đăng bài</span>
                  </BaseButton>
                </Link>

                <Link to="/chat" className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative">
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <KarmaBadge score={user.karmaScore} showText={false} />
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

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Campus Marketplace. Nền tảng P2P sinh viên Việt Nam.</p>
          <p className="text-slate-400">Tuân thủ tiêu chuẩn an toàn dữ liệu cá nhân Nghị định 13/2023/NĐ-CP</p>
        </div>
      </footer>
    </div>
  );
};
