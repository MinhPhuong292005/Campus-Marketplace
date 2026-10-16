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
  ShieldCheck,
  Activity,
  CheckCircle2,
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
      label: '2. Duyệt bài đăng',
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
      path: '/admin/metadata',
      label: '5. Danh mục & Trường',
      icon: Layers,
      badge: null,
      badgeColor: '',
    },
    {
      path: '/admin/settings',
      label: '6. Cấu hình & RBAC',
      icon: Settings,
      badge: null,
      badgeColor: '',
    },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                CAMPUS<span className="text-indigo-400">ADMIN</span>
              </span>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live System
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Trung tâm Điều hành & Kiểm duyệt Tập trung</p>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          {/* Notification Bell (Quả chuông thông báo cho Admin) */}
          <AdminNotificationBell />

          {/* External Marketplace Link */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-1.5 rounded-xl transition-all font-medium"
            title="Mở giao diện khách hàng sinh viên ở tab mới"
          >
            <span>Mở sàn Sinh viên</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Admin User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/20">
              AD
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-semibold text-white leading-tight">{adminUser?.email || 'admin@gmail.com'}</p>
              <p className="text-[10px] text-indigo-400 font-medium">{adminUser?.role || 'ROLE_SUPER_ADMIN'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 ml-1 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
        <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>ĐIỀU HÀNH & KIỂM DUYỆT</span>
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full text-xs font-black shadow-inner transition-transform ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom Sidebar Info Card */}
          <div className="pt-4 mt-6 border-t border-slate-800/80 space-y-2">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Trạng thái Cơ sở dữ liệu</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-400">PostgreSQL: 5432 (Connected)</p>
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <span className="text-indigo-400 font-medium">Phiên Admin Độc Lập</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Campus Marketplace • v1.0.0</p>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-950/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
