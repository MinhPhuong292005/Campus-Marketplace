import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ShieldAlert,
  Layers,
  Settings,
  LogOut,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { adminService } from '../services/adminService';
import { AdminNotificationBell } from '../components/admin/AdminNotificationBell';

export const AdminLayout: React.FC = () => {
  const { adminUser, logoutAdmin } = useAdminAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<{ pendingListingsCount: number; openReportsCount: number } | null>(null);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  useEffect(() => {
    adminService
      .getStats()
      .then((res) => {
        if (res.success && res.data) {
          setStats({
            pendingListingsCount: res.data.pendingListingsCount,
            openReportsCount: res.data.openReportsCount,
          });
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const navItems = [
    {
      path: '/admin',
      label: '1. Bảng điều khiển',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      path: '/admin/listings',
      label: '2. Quản lý bài đăng',
      icon: ShoppingBag,
      badge: stats && stats.pendingListingsCount > 0 ? stats.pendingListingsCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      path: '/admin/users',
      label: '3. Quản lý sinh viên',
      icon: Users,
      badge: null,
      badgeColor: '',
    },
    {
      path: '/admin/reports',
      label: '4. Báo cáo & Tranh chấp',
      icon: ShieldAlert,
      badge: stats && stats.openReportsCount > 0 ? stats.openReportsCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      path: '/admin/locations',
      label: '5. Điểm hẹn & Cơ sở trường',
      icon: MapPin,
      badge: null,
      badgeColor: '',
    },
    {
      path: '/admin/metadata',
      label: '6. Quản lý Danh mục',
      icon: Layers,
      badge: null,
      badgeColor: '',
    },
    {
      path: '/admin/settings',
      label: '7. Cấu hình & Nhật ký',
      icon: Settings,
      badge: null,
      badgeColor: '',
    },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Header - Clean Minimalist Neo-Brutalism */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-400/30 flex items-center justify-center font-bold text-white shadow-sm">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base tracking-tight">
                CAMPUS<span className="text-indigo-400">ADMIN</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">Trung tâm Điều hành & Kiểm duyệt Tập trung</p>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* External Marketplace Link */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-xl transition-all font-semibold"
            title="Mở giao diện chợ sinh viên ở tab mới"
          >
            <span className="hidden sm:inline">Mở sàn Sinh viên</span>
            <span className="sm:hidden">Sàn chợ</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Notification Bell */}
          <AdminNotificationBell />

          {/* Admin User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 border border-indigo-400/30 text-white flex items-center justify-center font-black text-xs">
              AD
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-bold text-white leading-tight font-mono">{adminUser?.email || 'minhphuong2925@gmail.com'}</p>
              <p className="text-[10px] text-indigo-400 font-mono font-semibold">{adminUser?.role || 'ROLE_SUPER_ADMIN'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/30"
              title="Đăng xuất khỏi Cổng Quản trị"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Outlet */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Single Left Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900/70 border-r border-slate-800 p-4 flex flex-col justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              <span>ĐIỀU HÀNH & KIỂM DUYỆT</span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/admin'
                  ? currentPath === '/admin' || currentPath === '/admin/' || currentPath === '/admin/dashboard'
                  : currentPath.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-black ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-950/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
