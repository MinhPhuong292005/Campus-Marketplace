import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, Trash2, UserCheck, ArrowRight } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { User } from '../../types';

interface RememberedAccount {
  user: User;
  token: string;
  savedAt: string;
}

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy thông tin tài khoản đã ghi nhớ (để đăng nhập nhanh)
  const getStoredAccount = (): RememberedAccount | null => {
    try {
      const raw = localStorage.getItem('campus_remembered_account');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.user?.email) {
        const email = parsed.user.email.toLowerCase();
        if (
          email.endsWith('@st.phenikaa-uni.edu.vn') ||
          email.endsWith('@phenikaa-uni.edu.vn') ||
          email.endsWith('@st.phenikaa.edu.vn') ||
          email.endsWith('@phenikaa.edu.vn') ||
          email === 'minhphuong2925@gmail.com' ||
          email === 'admin@gmail.com'
        ) {
          return parsed;
        }
      }
      localStorage.removeItem('campus_remembered_account');
      return null;
    } catch {
      return null;
    }
  };

  const [savedAccount, setSavedAccount] = useState<RememberedAccount | null>(getStoredAccount());
  const [useQuickLogin, setUseQuickLogin] = useState<boolean>(!!savedAccount);

  const rawSavedEmail = savedAccount?.user?.email || localStorage.getItem('campus_remembered_email') || '';
  const isPhenikaaEmail =
    rawSavedEmail.endsWith('@st.phenikaa-uni.edu.vn') ||
    rawSavedEmail.endsWith('@phenikaa-uni.edu.vn') ||
    rawSavedEmail.endsWith('@st.phenikaa.edu.vn') ||
    rawSavedEmail.endsWith('@phenikaa.edu.vn') ||
    rawSavedEmail === 'minhphuong2925@gmail.com' ||
    rawSavedEmail === 'admin@gmail.com';

  const savedEmail = isPhenikaaEmail ? rawSavedEmail : '';

  // Purge any legacy non-Phenikaa email stored from earlier runs
  if (rawSavedEmail && !isPhenikaaEmail) {
    try {
      localStorage.removeItem('campus_remembered_email');
    } catch {
      // ignore
    }
  }

  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedEmail,
      password: '',
    },
  });

  // Đăng nhập nhanh 1-chạm bằng tài khoản đã ghi nhớ
  const handleQuickLogin = async () => {
    if (!savedAccount) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      // Đăng nhập ngay lập tức vào phiên làm việc
      login(savedAccount.user as any, savedAccount.token);
      navigate('/');
    } catch {
      setErrorMsg('Phiên đăng nhập đã hết hạn. Vui lòng nhập lại mật khẩu.');
      setUseQuickLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Xóa tài khoản đã ghi nhớ
  const handleRemoveRememberedAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem('campus_remembered_account');
    localStorage.removeItem('campus_remembered_email');
    setSavedAccount(null);
    setUseQuickLogin(false);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const emailClean = data.email.trim().toLowerCase();
      const isAdmin = emailClean === 'minhphuong2925@gmail.com' || emailClean === 'admin@gmail.com';
      const isPhenikaa =
        emailClean.endsWith('@st.phenikaa-uni.edu.vn') ||
        emailClean.endsWith('@phenikaa-uni.edu.vn') ||
        emailClean.endsWith('@st.phenikaa.edu.vn') ||
        emailClean.endsWith('@phenikaa.edu.vn');

      if (!isAdmin && !isPhenikaa) {
        setErrorMsg('Hệ thống chỉ chấp nhận tài khoản sinh viên Trường Đại học Phenikaa (@st.phenikaa-uni.edu.vn).');
        setIsLoading(false);
        return;
      }

      const res = await authService.login({
        email: emailClean,
        password: data.password,
      });

      if (res && res.success && res.data) {
        if (rememberMe) {
          localStorage.setItem('campus_remembered_email', emailClean);
          // Lưu thông tin tài khoản đầy đủ để có thể đăng nhập nhanh lần sau
          const accountRecord: RememberedAccount = {
            user: res.data.user,
            token: res.data.token,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem('campus_remembered_account', JSON.stringify(accountRecord));
        } else {
          localStorage.removeItem('campus_remembered_email');
          localStorage.removeItem('campus_remembered_account');
        }
        login(res.data.user, res.data.token);
        navigate('/');
      } else {
        setErrorMsg(res?.message || 'Tài khoản chưa được tạo hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        setErrorMsg('Tài khoản chưa được tạo trong hệ thống hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      } else if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Đăng nhập không thành công. Vui lòng kiểm tra lại email trường và mật khẩu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Giao diện ĐĂNG NHẬP NHANH (Khi đã ghi nhớ tài khoản trước đó)
  if (savedAccount && useQuickLogin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đăng nhập tài khoản</h2>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            Đăng nhập nhanh
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2 shadow-sm animate-in fade-in">
            <span className="font-bold flex-shrink-0">⚠️ Lỗi:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Khung thẻ tài khoản đã lưu */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border-2 border-blue-200 dark:border-blue-800 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm shrink-0 uppercase">
              {savedAccount.user.fullName ? savedAccount.user.fullName.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {savedAccount.user.fullName || 'Sinh viên Phenikaa'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {savedAccount.user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  {savedAccount.user.role === 'ROLE_SUPER_ADMIN' ? '🛡️ Ban Quản Trị' : '🎓 Sinh viên Phenikaa'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveRememberedAccount}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
            title="Xóa tài khoản này khỏi máy"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Nút bấm đăng nhập nhanh 1-chạm */}
        <BaseButton
          type="button"
          variant="primary"
          className="w-full py-3.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
          onClick={handleQuickLogin}
          isLoading={isLoading}
        >
          <UserCheck className="w-4 h-4" />
          <span>Tiếp tục với tư cách {savedAccount.user.fullName?.split(' ').pop() || 'bạn'}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </BaseButton>

        {/* Nút chuyển sang đăng nhập tài khoản khác */}
        <button
          type="button"
          onClick={() => setUseQuickLogin(false)}
          className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
        >
          Sử dụng tài khoản khác
        </button>

        <div className="text-center text-xs text-slate-500 pt-1">
          Chưa có tài khoản?{' '}
          <Link to="/auth/register" className="text-blue-600 font-semibold hover:underline">
            Đăng ký ngay (+20 Karma)
          </Link>
        </div>
      </div>
    );
  }

  // 2. Giao diện form đăng nhập thông thường
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="on">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đăng nhập tài khoản</h2>
        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
          Email @st.phenikaa-uni.edu.vn
        </span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2 shadow-sm animate-in fade-in">
          <span className="font-bold flex-shrink-0">⚠️ Lỗi:</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {savedAccount && !useQuickLogin && (
        <button
          type="button"
          onClick={() => setUseQuickLogin(true)}
          className="w-full p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Quay lại Đăng nhập nhanh ({savedAccount.user.email})</span>
        </button>
      )}

      <BaseInput
        label="Email sinh viên Phenikaa (@st.phenikaa-uni.edu.vn)"
        placeholder="vd: 23010190@st.phenikaa-uni.edu.vn"
        leftIcon={<Mail className="w-4 h-4" />}
        autoComplete="username"
        error={errors.email?.message}
        {...register('email')}
      />

      <BaseInput
        type="password"
        label="Mật khẩu"
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Ghi nhớ đăng nhập trên thiết bị này</span>
        </label>
      </div>

      <BaseButton type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
        Đăng nhập
      </BaseButton>

      <div className="text-center text-xs text-slate-500 pt-3">
        Chưa có tài khoản?{' '}
        <Link to="/auth/register" className="text-blue-600 font-semibold hover:underline">
          Đăng ký ngay (+20 Karma)
        </Link>
      </div>
    </form>
  );
};
