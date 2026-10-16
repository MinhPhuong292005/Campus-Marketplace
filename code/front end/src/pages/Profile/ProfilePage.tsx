import React, { useState, useEffect } from 'react';
import {
  User,
  School,
  MapPin,
  Building,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Hash,
  Scan,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { BaseButton } from '../../components/base/BaseButton';
import { EditProfileModal } from '../../components/features/EditProfileModal';
import { StudentCardVerifyModal } from '../../components/features/StudentCardVerifyModal';
import { profileService } from '../../services/profileService';
import { User as UserType } from '../../types';

export const ProfilePage: React.FC = () => {
  const { user: storeUser, login, token } = useAuthStore();
  const [user, setUser] = useState<UserType | null>(storeUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'PERSONAL' | 'PUBLIC_PREVIEW'>('PERSONAL');
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const res = await profileService.getMyProfile();
        if (res.success && res.data) {
          setUser(res.data);
          if (token) {
            login(res.data, token);
          }
        }
      } catch (e) {
        // use local storeUser if offline or mock
        if (storeUser) setUser(storeUser);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [login, storeUser, token]);

  const handleProfileUpdated = (updatedUser: UserType) => {
    setUser(updatedUser);
    if (token) {
      login(updatedUser, token);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold">Chưa tìm thấy thông tin hồ sơ</h3>
        <p className="text-xs text-slate-500 mt-1">Vui lòng đăng nhập để xem thông tin sinh viên.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner & Profile Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 p-1 border-2 border-white/40 shadow-inner overflow-hidden">
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || 'student'}`
                  }
                  alt={user.fullName}
                  className="w-full h-full object-cover rounded-xl bg-white/30"
                />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-emerald-500 text-white shadow" title="Sinh viên đã xác thực email trường">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight">{user.fullName}</h1>
                <KarmaBadge score={user.karmaScore || 20} showText={true} />
              </div>

              <p className="text-xs text-white/80 mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <School className="w-3.5 h-3.5" />
                <span>{user.universityName || 'Trường Đại học Phenikaa'}</span>
                <span>•</span>
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.campusName || 'Cơ sở Yên Nghĩa'}</span>
              </p>

              {user.bio && (
                <p className="text-xs text-white/90 mt-2 max-w-lg italic font-normal bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  "{user.bio}"
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              className="bg-emerald-500/20 border-emerald-300/40 text-white hover:bg-emerald-500/30 gap-1.5"
              onClick={() => setIsOcrModalOpen(true)}
            >
              <Scan className="w-4 h-4" />
              <span>Quét thẻ SV (AI OCR)</span>
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh sửa hồ sơ</span>
            </BaseButton>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Personal vs Public Preview (ND 13/2023/ND-CP) */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('PERSONAL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'PERSONAL'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Hồ sơ cá nhân (Riêng tư)
          </button>
          <button
            onClick={() => setViewMode('PUBLIC_PREVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'PUBLIC_PREVIEW'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem trước chế độ Công khai (Nghị định 13)</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-[11px] text-slate-400 pr-3">
          Tuân thủ Nghị định 13/2023/NĐ-CP bảo vệ dữ liệu cá nhân
        </span>
      </div>

      {/* Mode 1: Personal Private Profile */}
      {viewMode === 'PERSONAL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Thông tin định danh sinh viên</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email trường
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{user.email}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Số điện thoại
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{user.phone || 'Chưa cập nhật'}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Mã số sinh viên (MSSV)
                </span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{user.studentCode || 'Chưa cập nhật'}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Xác minh thẻ SV
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {user.studentCardVerified ? 'Đã xác thực' : 'Đã định danh qua Email trường'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <School className="w-4 h-4 text-blue-600" />
              <span>Học tập & Khu vực cư trú</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" /> Trường học
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{user.universityName || 'Trường Đại học Phenikaa'}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Cơ sở (Campus)
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{user.campusName || 'Cơ sở chính'}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Ký túc xá / Trọ
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{user.dormitory || 'Chưa thiết lập'}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Khoa / Viện
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{user.major || 'Chưa cập nhật'}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Niên khóa
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{user.academicYear || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Public Preview (Compliant with Decree 13/2023/ND-CP) */}
      {viewMode === 'PUBLIC_PREVIEW' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-blue-400/40 space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold">Chế độ hiển thị an toàn cho Sinh viên khác:</p>
              <p className="mt-0.5">
                Hệ thống tuân thủ Nghị định 13/2023/NĐ-CP: <strong>Toàn bộ Email, Số điện thoại và MSSV đều được ẩn triệt để</strong>.
                Người khác chỉ nhìn thấy Tên hiển thị, Trường/Campus, Khoa và Huy hiệu Tín nhiệm Karma của bạn.
              </p>
            </div>
          </div>

          <div className="max-w-md mx-auto p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
            <img
              src={
                user.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || 'student'}`
              }
              alt={user.fullName}
              className="w-20 h-20 rounded-2xl mx-auto object-cover border-2 border-blue-500/20 shadow"
            />

            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{user.fullName}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.universityName || 'Trường Đại học Phenikaa'} • {user.campusName || 'Cơ sở Yên Nghĩa'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <KarmaBadge score={user.karmaScore || 20} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] text-slate-400">Khoa / Viện</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{user.major || 'Đại học'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] text-slate-400">Khu vực trọ</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{user.dormitory || 'Khuôn viên trường'}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Email & SĐT được bảo vệ bởi lá chắn Anti-Fraud</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={user}
        onUpdated={handleProfileUpdated}
      />

      {/* Student Card OCR Modal */}
      <StudentCardVerifyModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        onVerifiedSuccess={(res) => {
          if (user) {
            handleProfileUpdated({
              ...user,
              studentCardVerified: true,
              karmaScore: user.karmaScore + res.karmaAwarded,
            });
          }
        }}
      />
    </div>
  );
};
