import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  X,
  Gift,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Check,
  Film,
  ShoppingBag,
  Clock,
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { listingSchema, ListingFormData } from '../../schemas/listing.schema';
import { BaseInput } from '../../components/base/BaseInput';
import { BaseButton } from '../../components/base/BaseButton';
import { BaseModal } from '../../components/base/BaseModal';
import { listingService } from '../../services/listingService';
import { useAuthStore } from '../../store/useAuthStore';
import { Category, Listing } from '../../types';
import { SuspendedAccountModal } from '../../components/features/SuspendedAccountModal';
import { PolicyViolationModal, ViolationAlertData } from '../../components/features/PolicyViolationModal';
import { keywordViolationService } from '../../services/keywordViolationService';
import { adminNotificationService } from '../../services/adminNotificationService';
import { spamProtectionService, SpamStatus } from '../../services/spamProtectionService';
import { PHENIKAA_SAFE_MEETING_POINTS } from '../../constants/phenikaaData';

export const CreateListingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSuspendedModalOpen, setIsSuspendedModalOpen] = useState(false);
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ListingFormData | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdListingData, setCreatedListingData] = useState<Listing | null>(null);
  const [postSpamStatus, setPostSpamStatus] = useState<SpamStatus>(() =>
    spamProtectionService.checkPostSpamStatus(user?.id)
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastData, setSuccessToastData] = useState<{
    title: string;
    subtitle: string;
    isAutoApproved: boolean;
  } | null>(null);
  const [violationAlert, setViolationAlert] = useState<ViolationAlertData | null>(null);
  const [, setViolationRecord] = useState(() =>
    user ? keywordViolationService.getRecordByUserId(user.id) : null
  );
  const navigate = useNavigate();

  // Theo dõi cập nhật trạng thái spam đăng bài (khóa 1 tiếng nếu spam)
  useEffect(() => {
    const handleSpamUpdate = () => {
      setPostSpamStatus(spamProtectionService.checkPostSpamStatus(user?.id));
    };
    window.addEventListener('campus_post_spam_status_updated', handleSpamUpdate);
    const interval = setInterval(handleSpamUpdate, 15000); // Tự động đếm lùi thời gian khóa
    return () => {
      window.removeEventListener('campus_post_spam_status_updated', handleSpamUpdate);
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (user?.status === 'SUSPENDED' || user?.status === 'BANNED' || user?.status === 'BLOCKED') {
      setIsSuspendedModalOpen(true);
    }
  }, [user]);

  // Đồng bộ và khôi phục số lượt an toàn về ban đầu khi mở khóa
  useEffect(() => {
    if (user) {
      const rec = keywordViolationService.getRecordByUserId(user.id);
      // Khi tài khoản ở trạng thái ACTIVE (được mở khóa) nhưng record cũ đang có chế tài: hồi về 3/3 ban đầu
      if (user.status === 'ACTIVE' && rec && (rec.isSuspended || rec.strikeCount >= 3)) {
        keywordViolationService.restoreSafeChances(user.id, 'Tài khoản hoạt động - khôi phục 3/3 lượt an toàn');
        setViolationRecord(keywordViolationService.getRecordByUserId(user.id));
      } else {
        setViolationRecord(rec);
      }
    }
    const handleViolationUpdate = () => {
      if (user) setViolationRecord(keywordViolationService.getRecordByUserId(user.id));
    };
    window.addEventListener('campus_keyword_violations_updated', handleViolationUpdate);
    window.addEventListener('campus_user_status_changed', handleViolationUpdate);
    return () => {
      window.removeEventListener('campus_keyword_violations_updated', handleViolationUpdate);
      window.removeEventListener('campus_user_status_changed', handleViolationUpdate);
    };
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
      safeMeetingPoint: PHENIKAA_SAFE_MEETING_POINTS[0].name,
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

  // Adjust price when switching transaction type (Tặng đồ -> giá = 0; Bán & Trao đổi -> có định giá món đồ)
  useEffect(() => {
    if (transactionType === 'GIVEAWAY') {
      setValue('price', 0);
    } else if (transactionType === 'SELL' || transactionType === 'SWAP') {
      const curPrice = watch('price');
      if (!curPrice || curPrice <= 0) {
        setValue('price', 50000);
      }
    }
  }, [transactionType, setValue, watch]);

  // Sync imageUrls & videoUrl to react-hook-form
  useEffect(() => {
    const allMedia = [...imageUrls, ...(videoUrl ? [videoUrl] : [])];
    setValue('imageUrls', allMedia, { shouldValidate: true });
  }, [imageUrls, videoUrl, setValue]);

  const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
  const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.mkv'];

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray || fileArray.length === 0) return;

    try {
      setIsUploading(true);
      setErrorMsg(null);

      for (const file of fileArray) {
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        const isVideo =
          file.type.startsWith('video/') ||
          ALLOWED_VIDEO_EXTENSIONS.includes(ext);
        const isImage =
          file.type.startsWith('image/') ||
          ALLOWED_IMAGE_EXTENSIONS.includes(ext);

        // Chặn chặt chẽ các file không phải ảnh và video (.zip, .pptx, .pdf, .docx, .rar, v.v.)
        if (!isImage && !isVideo) {
          setErrorMsg(
            `❌ Tệp "${file.name}" không hợp lệ! Hệ thống chỉ chấp nhận hình ảnh (JPG, PNG, WEBP, GIF) hoặc video ngắn (MP4, WEBM, MOV). Tuyệt đối không tải lên tệp nén, bài thuyết trình hay tài liệu (.zip, .pptx, .pdf, .docx,...).`
          );
          continue;
        }

        if (isVideo) {
          if (videoUrl) {
            setErrorMsg('Mỗi bài đăng chỉ được thêm tối đa 1 video ngắn (không bắt buộc). Vui lòng xóa video hiện tại nếu muốn đổi video khác.');
            continue;
          }
          if (file.size > 25 * 1024 * 1024) {
            setErrorMsg(`Tệp video "${file.name}" vượt quá dung lượng 25MB. Vui lòng chọn video ngắn gọn hơn.`);
            continue;
          }

          try {
            const res = await listingService.uploadMedia(file);
            if (res.success && res.data?.url) {
              setVideoUrl(res.data.url);
            } else {
              setErrorMsg(res.message || `Lỗi tải tệp video "${file.name}".`);
            }
          } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            if (serverMsg) {
              setErrorMsg(serverMsg);
            } else {
              const blobUrl = URL.createObjectURL(file);
              setVideoUrl(blobUrl);
            }
          }
        } else if (isImage) {
          // Xử lý hình ảnh hợp lệ
          if (imageUrls.length >= 6) {
            setErrorMsg('Bạn chỉ có thể tải lên tối đa 6 hình ảnh sản phẩm.');
            continue;
          }
          if (file.size > 5 * 1024 * 1024) {
            setErrorMsg(`Hình ảnh "${file.name}" vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.`);
            continue;
          }

          try {
            const res = await listingService.uploadMedia(file);
            if (res.success && res.data?.url) {
              setImageUrls((prev) => [...prev, res.data.url]);
            } else {
              setErrorMsg(res.message || `Lỗi tải hình ảnh "${file.name}".`);
            }
          } catch (err: any) {
            const serverMsg = err.response?.data?.message;
            if (serverMsg) {
              setErrorMsg(serverMsg);
            } else {
              const blobUrl = URL.createObjectURL(file);
              setImageUrls((prev) => [...prev, blobUrl]);
            }
          }
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoUrl(null);
  };

  // Bước 1: Tiền kiểm tra trước khi mở khung xác nhận
  const onPreSubmit = async (data: ListingFormData) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setErrorMsg('Bạn cần đăng nhập tài khoản sinh viên trước khi đăng bài.');
      return;
    }

    // Kiểm tra trạng thái khóa do spam bài đăng (tạm khóa 1 tiếng)
    const curSpam = spamProtectionService.checkPostSpamStatus(user?.id);
    if (curSpam.isLocked) {
      setErrorMsg(
        `⛔ Tài khoản của bạn đang bị TẠM KHÓA ĐĂNG BÀI TRONG 1 TIẾNG do spam đăng bài liên tục. Vui lòng thử lại sau ~${curSpam.minutesLeft} phút nữa.`
      );
      return;
    }

    if (
      user?.status === 'SUSPENDED' ||
      user?.status === 'BANNED' ||
      user?.status === 'BLOCKED' ||
      (user && keywordViolationService.isUserSuspended(user.id))
    ) {
      setIsSuspendedModalOpen(true);
      const isKwSuspended = user && keywordViolationService.isUserSuspended(user.id);
      setErrorMsg(
        isKwSuspended
          ? '🚫 Tài khoản của bạn đang bị TẠM KHÓA do vi phạm quy chế hoặc bị phạt spam. Chức năng đăng bài bị tạm dừng.'
          : `⚠️ Tài khoản của bạn đang bị Ban quản trị tạm khóa do vi phạm quy định sàn${user.blockReason ? ` (${user.blockReason})` : ''}. Chức năng đăng bài mới đang bị tạm ngưng.`
      );
      return;
    }

    // Kiểm tra hành vi Spam bài đăng (khoảng cách giữa 2 bài đăng < 15 giây)
    if (user) {
      const now = Date.now();
      const lastPostKey = `campus_last_post_ts_${user.id}`;
      const lastPostTimeStr = sessionStorage.getItem(lastPostKey);
      const lastPostTime = lastPostTimeStr ? parseInt(lastPostTimeStr, 10) : 0;

      if (lastPostTime && now - lastPostTime < 15000) {
        const nextSpam = spamProtectionService.recordPostSpamAction(user.id);
        setPostSpamStatus(nextSpam);

        if (nextSpam.isLocked) {
          keywordViolationService.recordSpamBan(user.id, user.email, user.fullName);
          setViolationAlert({
            message:
              '⛔ TÀI KHOẢN ĐÃ BỊ TẠM KHÓA ĐĂNG BÀI 1 TIẾNG: Bạn tiếp tục spam bài đăng sau khi đã được cảnh báo. Hệ thống đã tự động khóa quyền đăng bài của bạn trong vòng 1 giờ (60 phút).',
            isSuspended: true,
            remainingChances: 0,
          });
          setIsSuspendedModalOpen(true);
          return;
        } else {
          setViolationAlert({
            message: `🚨 CẢNH BÁO SPAM BÀI ĐĂNG (Lần ${nextSpam.count}/3): Bạn vừa gửi bài đăng cách đây ít giây. Vui lòng không spam bài đăng liên tục! Nếu bạn tiếp tục spam, tài khoản sẽ bị TẠM KHÓA ĐĂNG BÀI TRONG 1 TIẾNG (60 phút).`,
            isSuspended: false,
            remainingChances: Math.max(0, 4 - nextSpam.count),
          });
          setIsViolationModalOpen(true);
          return;
        }
      }
    }

    if (data.imageUrls.length === 0) {
      setErrorMsg('Vui lòng chọn hoặc tải lên ít nhất 1 hình ảnh sản phẩm.');
      return;
    }

    // Kiểm duyệt từ khóa cấm & Chế tài 3 gậy (3 strikes)
    const forbiddenKw = keywordViolationService.checkTextHasForbiddenKeyword(`${data.title} ${data.description || ''}`);
    if (forbiddenKw && user) {
      const { record, isNewlySuspended } = keywordViolationService.recordViolation({
        userId: user.id,
        userEmail: user.email,
        userName: user.fullName,
        studentCode: user.studentCode,
        keyword: forbiddenKw,
        listingTitle: data.title,
      });

      const remaining = Math.max(0, 3 - record.strikeCount);
      setViolationAlert({
        keyword: forbiddenKw,
        message: isNewlySuspended
          ? `CHẾ TÀI 3 LẦN VI PHẠM (0/3 lượt còn lại): Bạn đã đăng bài chứa từ cấm "${forbiddenKw}" lần thứ 3! Hệ thống đã TỰ ĐỘNG TẠM KHÓA tài khoản của bạn trong 1 ngày (24 giờ).`
          : `CẢNH BÁO VI PHẠM QUY CHẾ (${record.strikeCount}/3 lần vi phạm - Bạn còn lại ${remaining}/3 lượt an toàn): Bài đăng chứa từ khóa cấm "${forbiddenKw}". Nếu vi phạm đủ 3 lần, tài khoản sẽ tự động bị tạm khóa 1 ngày!`,
        isSuspended: isNewlySuspended,
        remainingChances: remaining,
      });

      if (isNewlySuspended) {
        setIsSuspendedModalOpen(true);
      } else {
        setIsViolationModalOpen(true);
      }
      return;
    }

    // Nếu không có vi phạm, xóa cảnh báo vi phạm
    setViolationAlert(null);

    // Tất cả thông tin hợp lệ -> Mở khung xác nhận đăng bài
    setPendingFormData(data);
    setShowConfirmModal(true);
  };

  // Bước 2: Thực thi khi người dùng bấm "Xác nhận đăng bài" trong modal
  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Ghi lại mốc thời gian đăng bài hợp lệ & reset spam
      if (user) {
        sessionStorage.setItem(`campus_last_post_ts_${user.id}`, Date.now().toString());
        sessionStorage.removeItem(`campus_spam_warned_${user.id}`);
        spamProtectionService.resetPostSpam(user.id);
      }

      // Đối với GIVEAWAY: đảm bảo giá bằng 0đ
      if (pendingFormData.transactionType === 'GIVEAWAY') {
        pendingFormData.price = 0;
      }

      const res = await listingService.createListing(pendingFormData);
      if (res.success && res.data) {
        setShowConfirmModal(false);

        if (res.data.status === 'REJECTED') {
          setErrorMsg(
            `❌ Bài đăng bị từ chối duyệt: ${res.data.riskReason || 'Nội dung chứa từ khóa cấm trong danh mục của Quản trị viên.'}`
          );
        } else {
          setCreatedListingData(res.data);
          setIsSuccessModalOpen(true);

          setSuccessToastData({
            title: 'Gửi bài đăng thành công',
            subtitle:
              'Bài đăng của bạn đã được gửi thành công và đang chờ Quản trị viên kiểm duyệt trước khi hiển thị công khai trên Chợ Sinh viên Phenikaa.',
            isAutoApproved: false,
          });
          setShowSuccessToast(true);

          // Gửi thông báo đến Quản trị viên (tất cả các bài đăng đều cần BQT duyệt)
          adminNotificationService.addNotification({
            type: 'LISTING_PENDING',
            title: `Duyệt bài đăng mới: ${res.data.title}`,
            studentId: user?.id,
            studentName: user?.fullName || 'Sinh viên',
            studentEmail: user?.email || '',
            reportedListingId: res.data.id,
            reportedListingTitle: res.data.title,
            reportedListingPrice: res.data.price,
            violationReason: res.data.riskReason || 'Bài đăng mới cần Quản trị viên duyệt',
            message: `Bài viết "${res.data.title}" (${res.data.transactionType === 'SWAP' ? 'Đổi đồ' : res.data.transactionType === 'GIVEAWAY' ? 'Tặng 0đ' : `${res.data.price?.toLocaleString()} đ`}). Chờ Quản trị viên kiểm tra hình ảnh và nội dung.`,
            imageUrl: res.data.images?.[0]?.mediaUrl || pendingFormData.imageUrls[0] || '',
          });
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



      {/* Banner cảnh báo đỏ / tạm khóa 1 tiếng khi spam */}
      {postSpamStatus.isLocked && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-600 text-white shadow-xl flex items-center justify-between gap-3 text-xs border-2 border-rose-400 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0 text-white" />
            <div>
              <p className="font-black text-sm">⛔ TÀI KHOẢN ĐANG BỊ TẠM KHÓA ĐĂNG BÀI TRONG 1 TIẾNG</p>
              <p className="text-xs text-rose-100 mt-0.5 leading-relaxed">
                Hệ thống phát hiện bạn thao tác gửi bài đăng liên tiếp quá nhiều lần. Quyền đăng bài mới tạm khóa trong 1 giờ để bảo vệ sàn. Tự động mở lại sau khoảng ~{postSpamStatus.minutesLeft} phút.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-3 py-1 bg-white/20 rounded-full font-mono font-bold text-xs">
            ~{postSpamStatus.minutesLeft} phút
          </span>
        </div>
      )}

      {!postSpamStatus.isLocked && postSpamStatus.isWarning && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-500 text-white shadow-md flex items-center gap-2.5 text-xs animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-black">🚨 CẢNH BÁO SPAM ({postSpamStatus.count}/3 LẦN THAO TÁC LIÊN TIẾP)</p>
            <p className="text-[11px] opacity-95 mt-0.5">
              Bạn đang thao tác quá nhanh. Vui lòng không spam bài đăng liên tục! Nếu tiếp tục spam, tài khoản sẽ bị tạm khóa đăng bài trong vòng 1 tiếng!
            </p>
          </div>
        </div>
      )}

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

      <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-6">
        {/* Transaction Type Selector (Bán / Tặng / Thuê / Đổi) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Hình thức giao dịch
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { type: 'SELL', label: 'Bán thanh lý', desc: 'Thu hồi vốn sinh viên', icon: DollarSign, color: 'blue' },
              { type: 'GIVEAWAY', label: 'Tặng 0đ', desc: 'Tích +10 Karma Score', icon: Gift, color: 'emerald' },
              { type: 'RENT', label: 'Cho thuê ngắn hạn', desc: 'Máy tính, máy ảnh', icon: Clock, color: 'indigo' },
              { type: 'SWAP', label: 'Đổi đồ', desc: 'Giao lưu ngang giá', icon: ArrowLeftRight, color: 'purple' },
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

        {/* Media Upload (Images up to 6 + Optional 1 Short Video) with Drag & Drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 transition-all shadow-sm space-y-3 ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-4 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Hình ảnh & Video sản phẩm ({imageUrls.length}/6 ảnh{videoUrl ? ' + 1 video' : ''}) *
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tối đa 6 ảnh (≤ 5MB) & 1 video ngắn (≤ 25MB, không bắt buộc). <strong>Chỉ chấp nhận tệp hình ảnh (JPG, PNG, WEBP, GIF) và video (MP4, WEBM, MOV)</strong>. Tuyệt đối không cho phép tệp nén hoặc tài liệu (.zip, .pptx, .pdf,...).
              </p>
            </div>
            {isDragging && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 animate-pulse">
                📥 Thả tệp vào đây để tải lên ngay!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
            {/* Uploaded Images */}
            {imageUrls.map((url, idx) => (
              <div
                key={`img-${idx}`}
                className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-sm bg-slate-100 dark:bg-slate-800"
              >
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

            {/* Uploaded Short Video (Optional, max 1) */}
            {videoUrl && (
              <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-500/50 bg-black group shadow-sm">
                <video src={videoUrl} controls className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-1 right-1 p-1 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition-colors z-10"
                  title="Xóa video"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] bg-indigo-600 text-white font-medium flex items-center gap-1 z-10">
                  <Film className="w-2.5 h-2.5" />
                  Video ngắn
                </span>
              </div>
            )}

            {/* Upload / Drop zone button */}
            {(imageUrls.length < 6 || !videoUrl) && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-950 transition-all p-2 text-center group">
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 mb-1 transition-all" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                  {isUploading ? 'Đang tải...' : 'Kéo thả hoặc tải ảnh/video'}
                </span>
                <span className="text-[9px] text-slate-400 mt-1">
                  Chỉ nhận Ảnh (≤ 5MB) & Video (≤ 25MB)
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
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
            <div>
              <BaseInput
                type="number"
                label="Giá thanh lý (VNĐ) *"
                placeholder="vd: 35000"
                helperText="Bắt buộc lớn hơn 0đ"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
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
            <div className="space-y-4 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Quy định cho thuê ngắn hạn & Đặt cọc bảo đảm tài sản</span>
              </div>

              <BaseInput
                type="number"
                label="Giá thuê theo ngày (VNĐ/ngày) *"
                placeholder="vd: 50000"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />

              {/* Ô 1: Giá trị cọc */}
              <div>
                <BaseInput
                  type="number"
                  label="1. Giá trị tiền cọc bảo đảm (VNĐ) *"
                  placeholder="vd: 500000 (Nhập giá trị của máy/đồ để bảo hiểm tài sản)"
                  error={errors.depositAmount?.message}
                  {...register('depositAmount', { valueAsNumber: true })}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Người cho thuê nhập đúng giá trị thực của máy. Người thuê cần chuẩn bị số tiền cọc này và sẽ được hoàn lại 100% khi trả đồ nguyên vẹn.
                </p>
              </div>

              {/* Ô 2: Điều khoản thuê & Quy định phạt vi phạm */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Điều khoản thuê & Quy định phạt vi phạm *
                </label>
                <textarea
                  rows={3}
                  placeholder="vd: Nếu làm hỏng mất 100% cọc; Nếu trầy xước xước khấu trừ 20-30% tiền cọc; Nếu quá ngày chưa trả sẽ mất phụ phí 30.000đ/ngày. Hai bên gặp trực tiếp kiểm tra và chụp ảnh hiện trạng khi bàn giao..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white"
                  {...register('rentalTerms')}
                />
              </div>
            </div>
          ) : transactionType === 'SWAP' ? (
            <div className="space-y-4 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Hình thức trao đổi đồ</p>
              </div>

              {/* Ô 1: Nhập giá trị ước tính của món đồ */}
              <div>
                <BaseInput
                  type="number"
                  label="Giá trị ước tính của món đồ (VNĐ) *"
                  placeholder="vd: 50000 (Nhập giá trị tham khảo của món đồ bạn đem đổi)"
                  helperText="Bắt buộc nhập giá trị lớn hơn 0đ để các bạn sinh viên khác dễ dàng chọn món đồ ngang tầm để trao đổi"
                  error={errors.price?.message}
                  {...register('price', { valueAsNumber: true })}
                />
              </div>

              {/* Ô 2: Món đồ muốn đổi lấy */}
              <div>
                <BaseInput
                  label="Món đồ bạn muốn đổi lấy (Không bắt buộc)"
                  placeholder="vd: Đổi lấy máy tính Casio FX 580, bộ giáo trình Kỹ thuật lập trình, hoặc đồ dùng học tập tương đương..."
                  {...register('swapTarget')}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nhập tên món đồ hoặc loại đồ bạn mong muốn nhận lại (bạn có thể để trống nếu cởi mở với mọi đề xuất giao lưu từ các bạn sinh viên khác).
                </p>
              </div>
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

          {/* Lựa chọn nơi nhận đồ từ các điểm hẹn an toàn */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Nơi nhận đồ (Chọn từ các điểm hẹn an toàn tại Trường ĐH Phenikaa) *</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Điểm hẹn an toàn có Camera</span>
              </span>
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
              {...register('safeMeetingPoint')}
            >
              {PHENIKAA_SAFE_MEETING_POINTS.map((pt) => (
                <option key={pt.id} value={pt.name}>
                  {pt.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Người mua và người bán sẽ gặp mặt trực tiếp tại điểm hẹn an toàn này để giao dịch và trao nhận đồ.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <BaseButton type="button" variant="outline" onClick={() => navigate(-1)}>
            Hủy
          </BaseButton>
          <BaseButton
            type={user?.status === 'SUSPENDED' || postSpamStatus.isLocked ? 'button' : 'submit'}
            variant={user?.status === 'SUSPENDED' || postSpamStatus.isLocked ? 'danger' : 'primary'}
            isLoading={isSubmitting}
            disabled={postSpamStatus.isLocked}
            onClick={() => {
              if (user && (user.status === 'SUSPENDED' || user.status === 'BANNED' || user.status === 'BLOCKED' || keywordViolationService.isUserSuspended(user.id))) {
                setIsSuspendedModalOpen(true);
              }
            }}
            title={
              postSpamStatus.isLocked
                ? `Tài khoản đang bị tạm khóa đăng bài (~${postSpamStatus.minutesLeft} phút)`
                : user?.status === 'SUSPENDED'
                ? 'Tài khoản đang bị tạm khóa (Bấm để xem lý do & khiếu nại)'
                : 'Đăng bài'
            }
          >
            {postSpamStatus.isLocked
              ? `⛔ Tạm khóa đăng bài (~${postSpamStatus.minutesLeft} phút)`
              : user?.status === 'SUSPENDED'
              ? '⏰ Tài khoản đang bị tạm khóa (Bấm xem)'
              : 'Đăng bài ngay'}
          </BaseButton>
        </div>
      </form>

      {/* Suspended Account Live Countdown & Contact Admin Modal */}
      <SuspendedAccountModal
        isOpen={isSuspendedModalOpen}
        onClose={() => setIsSuspendedModalOpen(false)}
        user={user}
      />

      {/* Khung Thông Báo Phạt Quy Chế Dạng Modal Popup */}
      <PolicyViolationModal
        isOpen={isViolationModalOpen}
        onClose={() => setIsViolationModalOpen(false)}
        violationData={violationAlert}
        userName={user?.fullName || 'Sinh viên'}
        karmaScore={user?.karmaScore ?? 0}
        onOpenSuspendedModal={() => {
          setIsViolationModalOpen(false);
          setIsSuspendedModalOpen(true);
        }}
      />

      {/* KHUNG XÁC NHẬN ĐĂNG BÀI */}
      <BaseModal
        isOpen={showConfirmModal}
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="Xác nhận đăng bài"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Bạn có xác nhận đăng bài không?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vui lòng kiểm tra lại thông tin sản phẩm trước khi đưa lên Chợ Sinh Viên Phenikaa.
              </p>
            </div>
          </div>

          {/* Tóm tắt thông tin bài đăng */}
          {pendingFormData && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-start gap-3">
                {pendingFormData.imageUrls[0] ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                    <img
                      src={pendingFormData.imageUrls[0]}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : videoUrl ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-indigo-500">
                    <Film className="w-7 h-7" />
                  </div>
                ) : null}

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">
                    {categories.find((c) => c.id === Number(pendingFormData.categoryId))?.name || 'Danh mục sản phẩm'}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 line-clamp-1">
                    {pendingFormData.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {pendingFormData.transactionType === 'GIVEAWAY'
                        ? 'Tặng miễn phí (0 đ)'
                        : pendingFormData.transactionType === 'SWAP'
                        ? `Trao đổi: ~${Number(pendingFormData.price).toLocaleString('vi-VN')} đ ${pendingFormData.swapTarget ? `(Đổi: ${pendingFormData.swapTarget})` : ''}`
                        : `${Number(pendingFormData.price).toLocaleString('vi-VN')} đ`}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {pendingFormData.imageUrls.length} ảnh {videoUrl ? '+ 1 video' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {pendingFormData.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800/60">
                  "{pendingFormData.description}"
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <BaseButton
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setShowConfirmModal(false)}
            >
              Hủy / Xem lại
            </BaseButton>
            <BaseButton
              type="button"
              variant="primary"
              isLoading={isSubmitting}
              onClick={handleConfirmSubmit}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Xác nhận đăng bài
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* MODAL THÔNG BÁO BÀI ĐĂNG GỬI DUYỆT THÀNH CÔNG (HIỂN THỊ TRỰC TIẾP TRÊN TRANG, THAY CHO LOCALHOST SAY) */}
      <BaseModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          navigate('/my-listings');
        }}
        title="Gửi bài đăng thành công"
        maxWidth="md"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5" />
              <span>Trạng thái: Đang chờ Quản trị viên duyệt</span>
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
              Bài viết của bạn đã được gửi thành công!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Mọi bài đăng trên Chợ Sinh viên Phenikaa đều được Ban Quản trị kiểm duyệt trước để đảm bảo an toàn, bảo vệ sinh viên và chống hàng cấm/lừa đảo.
            </p>
          </div>

          {/* Tóm tắt bài đăng vừa gửi */}
          {createdListingData && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left flex items-center gap-3">
              {createdListingData.images?.[0]?.mediaUrl ? (
                <img
                  src={createdListingData.images[0].mediaUrl}
                  alt={createdListingData.title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">
                  {createdListingData.categoryName || 'Danh mục sản phẩm'}
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate mt-1">
                  {createdListingData.title}
                </h4>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {createdListingData.transactionType === 'GIVEAWAY'
                    ? 'Tặng 0đ (Free)'
                    : createdListingData.transactionType === 'SWAP'
                    ? `Trao đổi: ~${Number(createdListingData.price).toLocaleString('vi-VN')} đ ${createdListingData.swapTarget ? `(Đổi: ${createdListingData.swapTarget})` : ''}`
                    : `${Number(createdListingData.price).toLocaleString('vi-VN')} đ`}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Điểm hẹn an toàn: {createdListingData.safeMeetingPoint || 'Khuôn viên Phenikaa'}
                </p>
              </div>
            </div>
          )}



          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <BaseButton
              type="button"
              variant="outline"
              onClick={() => {
                setIsSuccessModalOpen(false);
                navigate('/');
              }}
              className="w-full text-xs"
            >
              Về trang chủ
            </BaseButton>
            <BaseButton
              type="button"
              variant="primary"
              onClick={() => {
                setIsSuccessModalOpen(false);
                navigate('/my-listings');
              }}
              className="w-full text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Xem Kho đồ của tôi
            </BaseButton>
          </div>
        </div>
      </BaseModal>

      {/* KHUNG THÔNG BÁO Ở GÓC MÀN HÌNH: ĐÃ ĐĂNG BÀI THÀNH CÔNG MÀU XANH LÁ + LOGO TRÒN HÌNH TÍCH XANH LÁ Ở ĐẦU */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm sm:max-w-md w-[calc(100vw-3rem)] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-950/40 border-2 border-emerald-400 flex items-start gap-3.5">
            {/* Logo tròn hình tích xanh lá ở đầu */}
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/30 ring-4 ring-emerald-400/40">
              <Check className="w-6 h-6 stroke-[3.5] text-emerald-600" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Bạn đã đăng bài thành công
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessToast(false);
                    navigate('/my-listings');
                  }}
                  className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed">
                {successToastData?.subtitle || 'Bài đăng của bạn đã được ghi nhận trên hệ thống Chợ Sinh Viên.'}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-emerald-500/50">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px]">
                  ⏳ Chờ Quản trị viên duyệt
                </span>
                <span className="text-emerald-200 text-[10px] italic">
                  Đang chuyển hướng sang bài đăng của bạn...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
