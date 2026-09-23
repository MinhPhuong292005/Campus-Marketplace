import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F17] p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
            Campus Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Xác thực danh tính sinh viên - Giao dịch an tâm
          </p>
        </div>

        {/* Content Box */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
