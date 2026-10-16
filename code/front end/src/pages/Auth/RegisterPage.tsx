import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, School, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { OtpModal } from '../../components/features/OtpModal';
import { useAuthStore } from '../../store/useAuthStore';
import { University, Campus } from '../../types';

export const RegisterPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegisterFormData | null>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      universityId: 5,
      campusId: 8,
    },
  });

  const selectedUniversityId = watch('universityId') || 5;

  // Load universities list (Chỉ nhận sinh viên trường Phenikaa)
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const phenikaaOnly = (res.data || []).filter(
          (u) => u.shortName === 'PHENIKAA' || u.name.toLowerCase().includes('phenikaa')
        );
        if (phenikaaOnly.length > 0) {
          setUniversities(phenikaaOnly);
          setValue('universityId', phenikaaOnly[0].id);
        } else {
          setUniversities([
            { id: 5, name: 'Trường Đại học Phenikaa', shortName: 'PHENIKAA', emailDomains: ['st.phenikaa-uni.edu.vn', 'st.phenikaa.edu.vn', 'phenikaa-uni.edu.vn'] },
          ]);
          setValue('universityId', 5);
        }
      } catch (e) {
        setUniversities([
          { id: 5, name: 'Trường Đại học Phenikaa', shortName: 'PHENIKAA', emailDomains: ['st.phenikaa-uni.edu.vn', 'st.phenikaa.edu.vn', 'phenikaa-uni.edu.vn'] },
        ]);
        setValue('universityId', 5);
      }
    };
    fetchUniversities();
  }, [setValue]);

  // Dropdown Campus automatically filtered by chosen University (US-02 AC1)
  useEffect(() => {
    const fetchCampuses = async () => {
      if (!selectedUniversityId) return;
      try {
        const res = await profileService.getCampuses(selectedUniversityId);
        if (res.success && res.data && res.data.length > 0) {
          setCampuses(res.data);
          setValue('campusId', res.data[0].id);
        } else {
          // Fallback nếu trường không có campus cụ thể
          const defaultCampus = [{ id: 99, universityId: selectedUniversityId, name: 'Cơ sở chính / Toàn quốc', location: 'Toàn quốc' }];
          setCampuses(defaultCampus);
          setValue('campusId', 99);
        }
      } catch (e) {
        const list: Campus[] = [
          { id: 8, universityId: selectedUniversityId, name: 'Cơ sở Yên Nghĩa (Trụ sở chính)', location: 'Đường Tố Hữu, Hà Đông, Hà Nội' },
          { id: 9, universityId: selectedUniversityId, name: 'Khu Ký túc xá Phenikaa (Tòa K1 - K2 - K3)', location: 'Khuôn viên ĐH Phenikaa' },
        ];
        setCampuses(list);
        if (list.length > 0) {
          setValue('campusId', list[0].id);
        }
      }
    };
    fetchCampuses();
  }, [selectedUniversityId, setValue]);

  // Step 1: Submit form -> Validate email domain & Send OTP (BUG-01 Cooldown & Idempotency)
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Call API send OTP
      const res = await authService.sendOtp(data.email);
      if (res && res.code === 40001) {
        setErrorMsg('Mã lỗi 40001: Email không hợp lệ hoặc không thuộc danh sách trường đại học đối tác (.edu.vn)');
        return;
      }

      setPendingFormData(data);
      setShowOtpModal(true);
    } catch (err: any) {
      if (err.response?.data?.code === 40001) {
        setErrorMsg('Mã lỗi 40001: Email không thuộc danh sách trường đại học được hệ thống hỗ trợ.');
      } else if (err.response?.data?.code === 41005) {
        setErrorMsg('Bạn gửi yêu cầu quá nhanh. Vui lòng đợi 60 giây trước khi thử lại.');
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
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold mt-1">
            <Sparkles className="w-4 h-4" /> Nhận ngay +20 điểm Campus Karma khi xác thực thành công
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-blue-600" />
              Trường Đại học
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              {...register('universityId', { valueAsNumber: true })}
            >
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name} ({uni.shortName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Cơ sở (Campus)
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              {...register('campusId', { valueAsNumber: true })}
            >
              {campuses.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
          <span className="font-extrabold uppercase tracking-wider text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-md shrink-0">LƯU Ý</span>
          <span>Hệ thống Campus Marketplace hiện <strong>chỉ áp dụng riêng cho sinh viên Trường Đại học Phenikaa</strong>. Vui lòng nhập email sinh viên có dạng <strong>@st.phenikaa-uni.edu.vn</strong>. Không tiếp nhận sinh viên trường khác.</span>
        </div>

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
