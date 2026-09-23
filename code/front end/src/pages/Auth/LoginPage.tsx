import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await authService.login(data);
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        navigate('/');
      }
    } catch (err: unknown) {
      setErrorMsg('Đăng nhập không thành công. Vui lòng kiểm tra lại email trường và mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Đăng nhập tài khoản</h2>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
          {errorMsg}
        </div>
      )}

      <BaseInput
        label="Email sinh viên (.edu.vn)"
        placeholder="vd: nguyenvana@hust.edu.vn"
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
        <a href="#forgot" className="text-blue-600 hover:underline">Quên mật khẩu?</a>
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
