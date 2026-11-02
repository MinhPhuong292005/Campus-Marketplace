import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, School, MapPin, GraduationCap, Calendar, FileText, Phone, Lock } from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseInput } from '../base/BaseInput';
import { BaseButton } from '../base/BaseButton';
import { AvatarUpload } from './AvatarUpload';
import { UserProfileFormData, profileService } from '../../services/profileService';
import { University, Campus, User as UserType } from '../../types';
import { PHENIKAA_MAJORS, PHENIKAA_ACADEMIC_YEARS } from '../../constants/phenikaaData';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onUpdated: (user: UserType) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdated,
}) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<UserProfileFormData>({
    defaultValues: {
      fullName: currentUser.fullName,
      phone: currentUser.phone || '',
      avatarUrl: currentUser.avatarUrl || '',
      universityId: currentUser.universityId || 1,
      campusId: currentUser.campusId || 1,
      dormitory: currentUser.dormitory || '',
      studentCode: currentUser.studentCode || '',
      major: currentUser.major || '',
      academicYear: currentUser.academicYear || '',
      bio: currentUser.bio || '',
    },
  });

  useEffect(() => {
    reset({
      fullName: currentUser.fullName,
      phone: currentUser.phone || '',
      avatarUrl: currentUser.avatarUrl || '',
      universityId: currentUser.universityId || 1,
      campusId: currentUser.campusId || 1,
      dormitory: currentUser.dormitory || '',
      studentCode: currentUser.studentCode || '',
      major: currentUser.major || '',
      academicYear: currentUser.academicYear || '',
      bio: currentUser.bio || '',
    });
  }, [currentUser, reset]);

  const selectedUniversityId = watch('universityId');

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const res = await profileService.getUniversities();
        if (res.success && res.data) {
          const phenikaaOnly = res.data.filter(
            (u) => u.shortName === 'PHENIKAA' || u.name.toLowerCase().includes('phenikaa')
          );
          setUniversities(
            phenikaaOnly.length > 0
              ? phenikaaOnly
              : [{ id: 5, name: 'Trường Đại học Phenikaa', shortName: 'PHENIKAA', emailDomains: ['st.phenikaa-uni.edu.vn', 'phenikaa-uni.edu.vn'] }]
          );
        }
      } catch (e) {
        // Fallback default
        setUniversities([
          { id: 5, name: 'Trường Đại học Phenikaa', shortName: 'PHENIKAA', emailDomains: ['st.phenikaa-uni.edu.vn', 'phenikaa-uni.edu.vn'] },
        ]);
      }
    };
    loadUniversities();
  }, []);

  // Dropdown Campus automatically filtered by chosen University (AC1)
  useEffect(() => {
    const loadCampuses = async () => {
      if (!selectedUniversityId) return;
      try {
        const res = await profileService.getCampuses(selectedUniversityId);
        if (res.success && res.data && res.data.length > 0) {
          setCampuses(res.data);
        } else {
          setCampuses([
            { id: 8, universityId: selectedUniversityId, name: 'Cơ sở Yên Nghĩa (Trụ sở chính)' },
            { id: 9, universityId: selectedUniversityId, name: 'Khu Ký túc xá Phenikaa (Tòa K1 - K2 - K3)' },
          ]);
        }
      } catch (e) {
        setCampuses([
          { id: 8, universityId: selectedUniversityId, name: 'Cơ sở Yên Nghĩa (Trụ sở chính)' },
          { id: 9, universityId: selectedUniversityId, name: 'Khu Ký túc xá Phenikaa (Tòa K1 - K2 - K3)' },
        ]);
      }
    };
    loadCampuses();
  }, [selectedUniversityId]);

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await profileService.updateProfile(data);
      if (res.success && res.data) {
        onUpdated(res.data);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể cập nhật hồ sơ lúc này');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa Campus Profile"
      description="Cập nhật thông tin sinh viên, nơi ở và giới thiệu bản thân."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Avatar Upload with Drag & Drop and strict image validation */}
        <AvatarUpload
          currentAvatarUrl={watch('avatarUrl')}
          onAvatarChange={(newUrl) => setValue('avatarUrl', newUrl, { shouldDirty: true })}
          fullName={currentUser.fullName}
          email={currentUser.email}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BaseInput
            label="Họ và tên"
            placeholder="vd: Nguyễn Văn An"
            leftIcon={<User className="w-4 h-4" />}
            {...register('fullName', { required: true })}
          />

          <BaseInput
            label="Số điện thoại"
            placeholder="vd: 0987654321"
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="Được bảo mật theo NĐ 13/2023"
            {...register('phone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-blue-600" />
              Trường Đại học
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              {...register('universityId', { valueAsNumber: true })}
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.shortName})
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              {...register('campusId', { valueAsNumber: true })}
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              Ngành học
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              {...register('major')}
            >
              <option value="">-- Chọn ngành học chính quy --</option>
              {PHENIKAA_MAJORS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Niên khóa
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              {...register('academicYear')}
            >
              <option value="">-- Chọn khóa học --</option>
              {PHENIKAA_ACADEMIC_YEARS.map((y) => (
                <option key={y.id} value={y.label}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Mã số sinh viên (MSSV)
          </label>
          <input
            type="text"
            readOnly
            disabled
            value={currentUser.studentCode || currentUser.email?.split('@')[0] || ''}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-sm font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            MSSV được gắn liền tự động với tài khoản email Phenikaa đã cấp và không thể tự ý thay đổi.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Bio giới thiệu bản thân
          </label>
          <textarea
            rows={3}
            placeholder="Giới thiệu đôi nét về sở thích, đồ dùng muốn tìm hoặc trao đổi..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            {...register('bio')}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <BaseButton type="button" variant="outline" onClick={onClose}>
            Hủy
          </BaseButton>
          <BaseButton type="submit" variant="primary" isLoading={isLoading}>
            Lưu thay đổi
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
};
