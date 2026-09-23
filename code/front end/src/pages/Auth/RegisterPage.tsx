import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, School, Sparkles } from 'lucide-react';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { authService } from '../../services/authService';

export const RegisterPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      universityId: 1,
      campusId: 1,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await authService.register(data);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/auth/login');
    } catch (err: unknown) {
      setErrorMsg('Đăng ký thất bại. Email có thể đã được sử dụng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tạo tài khoản Sinh viên</h2>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
          <Sparkles className="w-3.5 h-3.5" /> Nhận ngay +20 điểm Campus Karma khi kích hoạt
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
          {errorMsg}
        </div>
      )}

      <BaseInput
        label="Họ và tên hiển thị"
        placeholder="vd: Nguyễn Văn A"
        leftIcon={<User className="w-4 h-4" />}
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <BaseInput
        label="Email trường (.edu.vn)"
        placeholder="vd: a.nguyen@vnu.edu.vn"
        leftIcon={<Mail className="w-4 h-4" />}
        error={errors.email?.message}
        helperText="Dùng email trường để tự động xác thực danh tính sinh viên"
        {...register('email')}
      />

      <div className="grid grid-cols-2 gap-3 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Trường Đại học
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            {...register('universityId', { valueAsNumber: true })}
          >
            <option value={1}>Đại học Bách Khoa</option>
            <option value={2}>Đại học Quốc Gia</option>
            <option value={3}>Đại học Kinh Tế Quốc Dân</option>
            <option value={4}>Đại học FPT</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Cơ sở (Campus)
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            {...register('campusId', { valueAsNumber: true })}
          >
            <option value={1}>Cơ sở chính</option>
            <option value={2}>Ký túc xá khu A</option>
            <option value={3}>Ký túc xá khu B</option>
          </select>
        </div>
      </div>

      <BaseInput
        type="password"
        label="Mật khẩu"
        placeholder="Tối thiểu 6 ký tự"
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <BaseInput
        type="password"
        label="Nhập lại mật khẩu"
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <BaseButton type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
        Tạo tài khoản & Nhận Karma
      </BaseButton>

      <div className="text-center text-xs text-slate-500 pt-2">
        Đã có tài khoản?{' '}
        <Link to="/auth/login" className="text-blue-600 font-semibold hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
};
