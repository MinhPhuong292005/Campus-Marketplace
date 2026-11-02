import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { authService } from '../../services/authService';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { loginAdmin } = useAdminAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success && res.data) {
        const loggedUser = res.data.user;
        const role = loggedUser.role as string;
        const isAdmin =
          role === 'ROLE_SUPER_ADMIN' ||
          role === 'ROLE_ADMIN' ||
          role === 'ROLE_MODERATOR';

        if (!isAdmin) {
          setErrorMsg('Tài khoản này là sinh viên, không có quyền truy cập Cổng Quản trị!');
          return;
        }

        loginAdmin(loggedUser as any, res.data.token);
        navigate('/admin', { replace: true });
      } else {
        setErrorMsg(res.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Đăng nhập quản trị viên thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Box */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 border border-blue-400/30 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/25">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              CỔNG QUẢN TRỊ VIÊN HỆ THỐNG
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Phân hệ độc lập kiểm duyệt nội dung, tranh chấp & vận hành Campus Marketplace
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Quản trị viên
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email quản trị viên..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mật khẩu xác thực
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <BaseButton
            type="submit"
            variant="primary"
            className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <span>Đang kiểm tra bảo mật...</span>
            ) : (
              <>
                <span>Đăng nhập Cổng Quản Trị</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </BaseButton>
        </form>

        {/* Footer info & link back */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col items-center gap-3 text-xs">
          <a
            href="/"
            className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 text-[11px]"
          >
            <span>← Quay về Sàn Sinh viên (Khách hàng)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
