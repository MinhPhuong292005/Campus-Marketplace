import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  X,
  Sparkles,
  Gift,
  DollarSign,
  AlertCircle,
  CheckCircle,
  LogIn,
  Image as ImageIcon,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { listingSchema, ListingFormData } from '../../schemas/listing.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { listingService } from '../../services/listingService';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';
import { Category } from '../../types';
import { SuspendedAccountModal } from '../../components/features/SuspendedAccountModal';

// Preset photos for quick 1-click testing
const PHOTO_PRESETS = [
  {
    label: '📚 Sách & Giáo trình',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80',
  },
  {
    label: '💻 Máy tính / Laptop',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=900&q=80',
  },
  {
    label: '🏠 Đồ dùng phòng trọ',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80',
  },
  {
    label: '🎒 Balo & Phụ kiện',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80',
  },
];

export const CreateListingPage: React.FC = () => {
  const { user, isAuthenticated, login } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.status === 'SUSPENDED' || user?.status === 'BANNED' || user?.status === 'BLOCKED') {
      setIsSuspendedModalOpen(true);
    }
  }, [user]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      transactionType: 'SELL',
      conditionStatus: 'GOOD_90',
      price: 50000,
      imageUrls: [],
    },
  });

  const transactionType = watch('transactionType');

  // Load categories from backend
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await listingService.getCategories();
        if (res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
          setValue('categoryId', res.data[0].id);
        }
      } catch (e) {
        const defaultCats = [
          { id: 1, name: 'Giáo trình & Sách vở', slug: 'giao-trinh-sach-vo' },
          { id: 2, name: 'Thiết bị công nghệ', slug: 'thiet-bi-cong-nghe' },
          { id: 3, name: 'Đồ dùng phòng trọ', slug: 'do-dung-phong-tro' },
          { id: 4, name: 'Dụng cụ học tập & Thể thao', slug: 'dung-cu-the-thao' },
          { id: 5, name: 'Thời trang & Phụ kiện', slug: 'thoi-trang-phu-kien' },
        ];
        setCategories(defaultCats);
        setValue('categoryId', 1);
      }
    };
    fetchCats();
  }, [setValue]);

  // Adjust price when switching transaction type
  useEffect(() => {
    if (transactionType === 'GIVEAWAY') {
      setValue('price', 0);
    } else if (transactionType === 'SELL') {
      const curPrice = watch('price');
      if (!curPrice || curPrice <= 0) {
        setValue('price', 50000);
      }
    }
  }, [transactionType, setValue, watch]);

  // Sync imageUrls to react-hook-form
  useEffect(() => {
    setValue('imageUrls', imageUrls, { shouldValidate: true });
  }, [imageUrls, setValue]);

  // Quick login handler for testing
  const handleQuickLogin = async (email: string) => {
    try {
      setQuickLoginLoading(email);
      setErrorMsg(null);
      const res = await authService.login({ email, password: 'Aa123' });
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        setSuccessMsg(`Đã kích hoạt phiên làm việc cho ${res.data.user.fullName} (${email})! Bây giờ bạn có thể bấm "Đăng bài ngay".`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg('Không thể đăng nhập tài khoản mẫu.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Đăng nhập không thành công.');
    } finally {
      setQuickLoginLoading(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 6) {
      setErrorMsg('Bạn chỉ có thể tải lên tối đa 6 hình ảnh (AC1)');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setErrorMsg(`Tệp "${file.name}" vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.`);
          continue;
        }

        try {
          const res = await listingService.uploadMedia(file);
          if (res.success && res.data?.url) {
            setImageUrls((prev) => [...prev, res.data.url]);
          } else {
            const blobUrl = URL.createObjectURL(file);
            setImageUrls((prev) => [...prev, blobUrl]);
          }
        } catch (uploadErr) {
          const blobUrl = URL.createObjectURL(file);
          setImageUrls((prev) => [...prev, blobUrl]);
        }
      }
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddPreset = (url: string) => {
    if (imageUrls.length >= 6) {
      setErrorMsg('Tối đa 6 hình ảnh cho mỗi sản phẩm.');
      return;
    }
    setImageUrls((prev) => [...prev, url]);
    setErrorMsg(null);
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setErrorMsg('Bạn cần đăng nhập tài khoản sinh viên trước khi đăng bài.');
        return;
      }

      if (user?.status === 'SUSPENDED' || user?.status === 'BANNED' || user?.status === 'BLOCKED') {
        setIsSuspendedModalOpen(true);
        setErrorMsg(`⚠️ Tài khoản của bạn đang bị Ban quản trị tạm khóa 1 tuần do vi phạm quy định sàn${user.blockReason ? ` (${user.blockReason})` : ''}. Chức năng đăng bài mới đang bị tạm ngưng.`);
        return;
      }

      if (data.imageUrls.length === 0) {
        setErrorMsg('Vui lòng chọn hoặc tải lên ít nhất 1 hình ảnh sản phẩm.');
        return;
      }

      const res = await listingService.createListing(data);
      if (res.success && res.data) {
        if (res.data.status === 'REJECTED') {
          setErrorMsg(`❌ Bài đăng TỰ ĐỘNG BỊ TỪ CHỐI DUYỆT: ${res.data.riskReason || 'Nội dung chứa từ khóa cấm trong danh mục của Quản trị viên.'}`);
        } else {
          setSuccessMsg('✅ Đăng bài thành công! Bài đăng đang ở trạng thái CHỜ QUẢN TRỊ VIÊN DUYỆT (PENDING_APPROVAL) trước khi xuất hiện trên sàn.');
          setTimeout(() => {
            navigate('/my-listings');
          }, 2000);
        }
      } else {
        setErrorMsg(res.message || 'Không thể tạo bài đăng lúc này. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      console.error('Create listing error:', err);
      const status = err.response?.status;
      if (status === 403) {
        setErrorMsg(err.response?.data?.message || 'Tài khoản của bạn đang bị chặn hoặc khóa quyền đăng bài.');
      } else if (status === 401 || err.message?.includes('401')) {
        setErrorMsg('Phiên đăng nhập cũ đã hết hạn. Vui lòng bấm vào nút đăng nhập bên dưới để kích hoạt phiên mới.');
      } else {
        const serverMsg = err.response?.data?.message || err.message;
        setErrorMsg(serverMsg || 'Không thể tạo bài đăng lúc này. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Đăng bài Thanh lý & Tặng đồ Sinh viên
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Hỗ trợ sinh viên Phenikaa trao đổi sách vở, thiết bị học tập và đồ dùng phòng trọ an toàn, tin cậy.
        </p>
      </div>

      {/* Suspended Alert */}
      {(user?.status === 'SUSPENDED' || user?.status === 'BANNED' || user?.status === 'BLOCKED') && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <p className="font-bold text-sm">Tài khoản của bạn đang bị tạm khóa quyền đăng bài:</p>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                Do vi phạm nội quy sàn Campus Marketplace{user.blockReason ? ` - Lý do: ${user.blockReason}` : ''}. Quý sinh viên tạm thời không thể tạo bài đăng mới cho đến khi hết thời hạn khóa.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSuspendedModalOpen(true)}
            className="shrink-0 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>⏰ Xem thời gian & Liên hệ Admin</span>
          </button>
        </div>
      )}

      {/* Moderation Policy Notice */}
      <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <p className="font-bold">Quy chế kiểm duyệt bài đăng bắt buộc:</p>
          <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-700 dark:text-amber-300">
            <li>Mọi bài đăng <strong>phải được Quản trị viên duyệt</strong> mới được phép xuất hiện công khai trên Marketplace.</li>
            <li>Hệ thống <strong>tự động từ chối duyệt</strong> nếu tiêu đề hoặc mô tả chứa từ khóa cấm (vape, thuốc lá điện tử, thi hộ, chạy điểm, vay nặng lãi, cọc trước,...).</li>
          </ul>
        </div>
      </div>

      {/* Account Info & Switcher Bar */}
      <div className="mb-6 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isAuthenticated && user
                ? `Đang đăng bài với: ${user.fullName} (${user.email || 'Sinh viên'})`
                : 'Bạn chưa đăng nhập tài khoản sinh viên'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Chọn nick sinh viên để đăng bài:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleQuickLogin('23010190@st.phenikaa-uni.edu.vn')}
            disabled={!!quickLoginLoading}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{quickLoginLoading === '23010190@st.phenikaa-uni.edu.vn' ? 'Đang kích hoạt...' : 'Nick 1: Sinh Viên Phenikaa (23010190)'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('23010191@st.phenikaa-uni.edu.vn')}
            disabled={!!quickLoginLoading}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{quickLoginLoading === '23010191@st.phenikaa-uni.edu.vn' ? 'Đang kích hoạt...' : 'Nick 2: Hoài Thương (23010191)'}</span>
          </button>
          <Link
            to="/auth/login"
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đổi nick khác</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Transaction Type Selector (Bán / Tặng / Thuê / Đổi) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Hình thức giao dịch
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { type: 'SELL', label: 'Bán thanh lý', desc: 'Thu hồi vốn sinh viên', icon: DollarSign, color: 'blue' },
              { type: 'GIVEAWAY', label: 'Tặng 0đ (Free)', desc: 'Tích +10 Karma Score', icon: Gift, color: 'emerald' },
              { type: 'RENT', label: 'Cho thuê ngắn hạn', desc: 'Máy tính, máy ảnh', icon: Sparkles, color: 'indigo' },
              { type: 'SWAP', label: 'Đổi đồ (Swap)', desc: 'Giao lưu ngang giá', icon: Sparkles, color: 'purple' },
            ].map((item) => {
              const isSelected = transactionType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setValue('transactionType', item.type as any)}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{item.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Media Upload (1-6 images, <= 5MB) + Quick Presets */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Hình ảnh sản phẩm ({imageUrls.length}/6 ảnh) *
            </label>
            <span className="text-[11px] text-slate-400">Tối đa 6 ảnh, mỗi ảnh ≤ 5MB</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-sm bg-slate-100 dark:bg-slate-800">
                <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-90"
                  title="Xóa ảnh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] bg-blue-600 text-white font-medium">
                    Ảnh bìa
                  </span>
                )}
              </div>
            ))}

            {imageUrls.length < 6 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-950 transition-colors p-2 text-center group">
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {isUploading ? 'Đang tải...' : 'Tải ảnh từ máy'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,video/mp4"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* Quick Photo Presets for convenient testing */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-2">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              Chọn nhanh ảnh mẫu (nếu chưa có ảnh trên máy):
            </span>
            <div className="flex flex-wrap gap-2">
              {PHOTO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPreset(preset.url)}
                  disabled={imageUrls.length >= 6}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {errors.imageUrls && (
            <p className="text-xs text-rose-500">{errors.imageUrls.message}</p>
          )}
        </div>

        {/* Product Details Form */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <BaseInput
            label="Tiêu đề bài đăng *"
            placeholder="vd: Giáo trình Giải tích 1 + Bộ đề thi cuối kỳ có đáp án"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Danh mục hàng hóa *
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                {...register('categoryId', { valueAsNumber: true })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tình trạng sử dụng *
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                {...register('conditionStatus')}
              >
                <option value="NEW_100">Mới 100% (Chưa qua sử dụng)</option>
                <option value="LIKE_NEW_99">Như mới (99%)</option>
                <option value="GOOD_90">Còn tốt (90%)</option>
                <option value="FAIR_70">Khá (70% - Có vết xước nhẹ)</option>
              </select>
            </div>
          </div>

          {/* Price / Giveaway condition */}
          {transactionType === 'SELL' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput
                type="number"
                label="Giá thanh lý (VNĐ) *"
                placeholder="vd: 35000"
                helperText="Bắt buộc lớn hơn 0đ"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
              <div className="flex items-center h-full pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  <span>Cho phép người mua thương lượng / trả giá</span>
                </label>
              </div>
            </div>
          ) : transactionType === 'GIVEAWAY' ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Món đồ tặng miễn phí (Giá 0đ)</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Khi tặng đồ thành công cho sinh viên khác, bạn sẽ được thưởng ngay +10 điểm Campus Karma!
                  </p>
                </div>
              </div>
              <span className="font-mono font-extrabold text-base text-emerald-600">0 VNĐ</span>
            </div>
          ) : transactionType === 'RENT' ? (
            <div className="space-y-3">
              <BaseInput
                type="number"
                label="Giá thuê theo ngày (VNĐ) *"
                placeholder="vd: 20000"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
              <BaseInput
                label="Quy định đặt cọc & Điều khoản thuê"
                placeholder="vd: Cọc 200.000đ hoặc Thẻ sinh viên giữ lại khi nhận máy"
                {...register('rentalTerms')}
              />
            </div>
          ) : transactionType === 'SWAP' ? (
            <div className="space-y-3">
              <BaseInput
                type="number"
                label="Giá trị ước tính món đồ (VNĐ) *"
                placeholder="vd: 50000"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
              <BaseInput
                label="Món đồ bạn muốn đổi lấy (Swap Target)"
                placeholder="vd: Đổi lấy máy tính Casio FX 580 hoặc bộ giáo trình Kỹ thuật lập trình"
                {...register('swapTarget')}
              />
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả chi tiết món đồ *
            </label>
            <textarea
              rows={4}
              placeholder="Mô tả kỹ tình trạng sách/đồ dùng, phụ kiện đi kèm, địa điểm thuận tiện gặp mặt trên campus..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <BaseButton type="button" variant="outline" onClick={() => navigate(-1)}>
            Hủy
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={user?.status === 'SUSPENDED'}
            title={user?.status === 'SUSPENDED' ? 'Tài khoản đang bị tạm khóa' : 'Đăng bài'}
          >
            {user?.status === 'SUSPENDED' ? 'Tài khoản đang bị tạm khóa' : 'Đăng bài ngay (ACTIVE)'}
          </BaseButton>
        </div>
      </form>

      {/* Suspended Account Live Countdown & Contact Admin Modal */}
      <SuspendedAccountModal
        isOpen={isSuspendedModalOpen}
        onClose={() => setIsSuspendedModalOpen(false)}
        user={user}
      />
    </div>
  );
};
