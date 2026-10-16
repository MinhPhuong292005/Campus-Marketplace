import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { authService, SAMPLE_STUDENT_ACCOUNTS } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const emailClean = data.email.trim().toLowerCase();
      const domain = emailClean.substring(emailClean.lastIndexOf('@') + 1);
      const hasSt = domain.startsWith('st.') || domain.includes('.st.') || domain.startsWith('stu.') || domain.startsWith('sv.');
      const hasEdu = domain.endsWith('.edu.vn') || domain.endsWith('.udn.vn');

      if (!hasSt || !hasEdu) {
        setErrorMsg('Tài khoản bắt buộc phải có tiền tố st. và đuôi .edu.vn (Ví dụ: @st.phenikaa-uni.edu.vn).');
        setIsLoading(false);
        return;
      }

      const res = await authService.login({
        email: emailClean,
        password: data.password,
      });

      if (res && res.success && res.data) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đăng nhập tài khoản</h2>
        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
          Email @st...edu.vn
        </span>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2 shadow-sm animate-in fade-in">
          <span className="font-bold flex-shrink-0">⚠️ Lỗi:</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <BaseInput
        label="Email sinh viên (@st...edu.vn)"
        placeholder="vd: 23010190@st.phenikaa-uni.edu.vn"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <BaseInput
        type="password"
        label="Mật khẩu"
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-500">
          <input type="checkbox" className="rounded border-slate-300 text-blue-600" />
          <span>Ghi nhớ đăng nhập</span>
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

      {/* 5 Sample Test Accounts Helper */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800">
        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
          <span>⚡ 5 Tài khoản mẫu Phenikaa (Mật khẩu: 123456):</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Bấm để điền nhanh</span>
        </p>
        <div className="space-y-1.5">
          {Object.values(SAMPLE_STUDENT_ACCOUNTS).map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                setValue('email', acc.email, { shouldValidate: true });
                setValue('password', '123456', { shouldValidate: true });
              }}
              className="w-full p-2 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-left transition flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {acc.email}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {acc.fullName} • {acc.major} • {acc.academicYear}
                </p>
              </div>
              <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-bold shrink-0">
                123456
              </span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};
