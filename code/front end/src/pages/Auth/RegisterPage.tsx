import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { authService } from '../../services/authService';
import { OtpModal } from '../../components/features/OtpModal';
import { useAuthStore } from '../../store/useAuthStore';

export const RegisterPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegisterFormData | null>(null);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      universityId: 5,
      campusId: 8,
    },
  });

  // Step 1: Submit form -> Validate email domain & Send OTP (BUG-01 Cooldown & Idempotency)
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Call API send OTP
      const res = await authService.sendOtp(data.email);
      if (res && res.code === 40001) {
        setErrorMsg('Mã lỗi 40001: Email không thuộc Trường Đại học Phenikaa (@st.phenikaa-uni.edu.vn)');
        return;
      }

      setPendingFormData(data);
      setShowOtpModal(true);
    } catch (err: any) {
      if (err.response?.data?.code === 40001) {
        setErrorMsg('Mã lỗi 40001: Email không thuộc Trường Đại học Phenikaa (@st.phenikaa-uni.edu.vn).');
      } else if (err.response?.data?.code === 41005) {
        setErrorMsg('Bạn gửi yêu cầu quá nhanh. Vui lòng đợi 10 giây trước khi thử lại.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Không thể gửi mã xác minh OTP. Vui lòng kiểm tra lại email trường.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP & finalize registration
  const handleVerifyOtp = async (otp: string) => {
    if (!pendingFormData) return;
    try {
      const res = await authService.register({
        ...pendingFormData,
        otp,
      });

      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        setShowOtpModal(false);
        navigate('/');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Mã OTP không hợp lệ');
    }
  };

  const handleResendOtp = async () => {
    if (!pendingFormData) return;
    await authService.sendOtp(pendingFormData.email);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tạo tài khoản Sinh viên
          </h2>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Nhận ngay +20 điểm Campus Karma khi xác thực thành công
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <BaseInput
          label="Họ và tên hiển thị"
          placeholder="vd: Nguyễn Văn An"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        {/* Bảng lưu ý chỉ hiển thị khi người dùng nhập sai định dạng email hoặc gặp lỗi */}
        {(errors.email || (errorMsg && errorMsg.includes('Phenikaa'))) && (
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2.5 animate-in fade-in">
            <span className="font-extrabold uppercase tracking-wider text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-md shrink-0">LƯU Ý</span>
            <span>Hệ thống Campus Marketplace hiện <strong>chỉ áp dụng riêng cho sinh viên Trường Đại học Phenikaa</strong>. Vui lòng nhập email sinh viên có dạng <strong>@st.phenikaa-uni.edu.vn</strong>. Không tiếp nhận sinh viên trường khác.</span>
          </div>
        )}

        <BaseInput
          label="Email sinh viên Phenikaa (@st.phenikaa-uni.edu.vn)"
          placeholder="vd: 23010190@st.phenikaa-uni.edu.vn"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          helperText="Bắt buộc sử dụng email sinh viên do Trường Đại học Phenikaa cấp"
          {...register('email')}
        />

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
          Tiếp tục & Nhận mã OTP Email
        </BaseButton>

        <div className="text-center text-xs text-slate-500 pt-2">
          Đã có tài khoản?{' '}
          <Link to="/auth/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </form>

      {/* OTP Verification Modal */}
      {pendingFormData && (
        <OtpModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          email={pendingFormData.email}
          onVerify={handleVerifyOtp}
          onResendOtp={handleResendOtp}
        />
      )}
    </>
  );
};
