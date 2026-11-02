import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  ShieldCheck,
  Package,
  Calendar,
  CreditCard,
  User,
  MessageCircle,
  Scale,
  Star,
  ExternalLink,
  Lock,
  Clock,
  MapPin,
  Check,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { BaseModal } from '../../components/base/BaseModal';
import { rentalService } from '../../services/rentalService';
import { RentalContract } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ReportModal } from '../../components/features/ReportModal';
import { ReviewModal } from '../../components/features/ReviewModal';
import { RentalRejectCancelModal } from '../../components/features/RentalRejectCancelModal';
import { useAuthStore } from '../../store/useAuthStore';
import { PHENIKAA_SAFE_MEETING_POINTS } from '../../constants/phenikaaData';

export const RentalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [contract, setContract] = useState<RentalContract | null>(null);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRejectCancelModalOpen, setIsRejectCancelModalOpen] = useState(false);
  const [isReturnConfirmModalOpen, setIsReturnConfirmModalOpen] = useState(false);
  const [rejectCancelType, setRejectCancelType] = useState<'REJECT' | 'CANCEL'>('REJECT');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Giờ và điểm hẹn gặp mặt (Đã bàn trước qua tin nhắn)
  const [meetingPoint, setMeetingPoint] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('');
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [hasSavedProof, setHasSavedProof] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    const contractId = parseInt(id, 10);
    const res = await rentalService.getRentalById(contractId);
    if (res.success && res.data) {
      setContract(res.data);
      const images = res.data.proofImages || [];
      setProofImages(images);
      setHasSavedProof(images.length >= 2);
      setMeetingPoint(
        res.data.meetingPoint || 'Sảnh Tòa A10 (Trung tâm Thư viện Phenikaa & Tòa nhà Điều hành)'
      );
      setMeetingTime(res.data.meetingTime || '14:30 - Ngày bắt đầu thuê đồ');
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium">Đang tải thông tin chi tiết hợp đồng #{id}...</p>
      </div>
    );
  }

  const isOwner = user?.id === contract.ownerId;

  // Trạng thái các bước trong quy trình giao dịch thuê
  const isStep1Done = contract.status !== 'PENDING';
  const isStep2Done =
    contract.status === 'ACTIVE' ||
    contract.status === 'RETURNED' ||
    (Boolean(contract.ownerHandoverConfirmed) && Boolean(contract.renterHandoverConfirmed));
  const isStep3Done =
    contract.status === 'RETURNED' ||
    (Boolean(contract.ownerReturnConfirmed) && Boolean(contract.renterReturnConfirmed));

  // 1. Phê duyệt cho thuê (Bước 1)
  const handleApproveContract = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await rentalService.approveContract(contract.id);
      if (res.success && res.data) {
        setSuccessMsg('Xác nhận cho thuê thành công! Bước 1 đã hoàn tất, Bước 2 đã được mở khóa.');
        setContract(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể xác nhận cho thuê.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectCancelSubmit = async (reason: string) => {
    if (!contract) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      if (rejectCancelType === 'REJECT') {
        const res = await rentalService.rejectRental(contract.id, reason);
        if (res.success && res.data) {
          setSuccessMsg('Đã từ chối yêu cầu cho thuê. Bài đăng đã tự động mở lại cho bạn khác thuê.');
          setContract(res.data);
        }
      } else {
        const res = await rentalService.cancelRental(contract.id, reason, 'renter');
        if (res.success && res.data) {
          setSuccessMsg('Đã hủy yêu cầu thuê thiết bị thành công.');
          setContract(res.data);
        }
      }
      setIsRejectCancelModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi thực hiện thao tác.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lưu lịch hẹn & điểm gặp mặt (Bước 2)
  const handleSaveMeetingDetails = async () => {
    if (!meetingPoint.trim() || !meetingTime.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ giờ hẹn và điểm gặp mặt an toàn.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await rentalService.updateMeetingDetails(contract.id, {
        meetingPoint,
        meetingTime,
      });
      if (res.success && res.data) {
        setContract(res.data);
        setIsEditingMeeting(false);
        setSuccessMsg('Đã lưu thành công giờ hẹn và điểm gặp mặt đã thống nhất!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu thông tin hẹn gặp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Chụp & Thêm ảnh đối chiếu hiện trạng thiết bị (Bước 2)
  const handleSimulateAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (proofImages.length + files.length > 4) {
      setErrorMsg('Tối đa 4 ảnh đối chiếu hiện trạng thiết bị khi bàn giao.');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      setProofImages((prev) => [...prev, url]);
    }
    setErrorMsg(null);
  };

  const handleAddSamplePhotos = () => {
    const samples = [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80',
      'https://images.unsplash.com/photo-1584697964190-705b893683f1?w=600&q=80',
    ];
    setProofImages(samples);
    setErrorMsg(null);
  };

  const handleRemoveImage = (index: number) => {
    setProofImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length < 2) setHasSavedProof(false);
      return updated;
    });
  };

  const handleSaveProofImages = async () => {
    if (proofImages.length < 2) {
      setErrorMsg('Vui lòng chụp ít nhất 2 ảnh hiện trạng của món đồ (mặt trước, màn hình, vết xước cũ) để đối chiếu bảo vệ cọc.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await rentalService.uploadProofImages(contract.id, proofImages);
      if (res.success && res.data) {
        setSuccessMsg(`Đã lưu biên bản ${proofImages.length} ảnh đối chiếu hiện trạng thiết bị thành công! Cả hai bên đã có đủ căn cứ an toàn để xác nhận bàn giao.`);
        setHasSavedProof(true);
        setContract(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể lưu ảnh đối chiếu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Bàn giao đồ trực tiếp (Cả 2 bên xác nhận, yêu cầu ít nhất 2 ảnh)
  const handleConfirmHandover = async (roleOverride?: 'owner' | 'renter') => {
    if (proofImages.length < 2) {
      setErrorMsg('⚠️ Cần chụp và lưu ít nhất 2 ảnh hiện trạng thiết bị trước khi ấn xác nhận đã giao/nhận đồ!');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const role = roleOverride || (isOwner ? 'owner' : 'renter');
      const res = await rentalService.confirmHandover(contract.id, role);
      if (res.success && res.data) {
        setSuccessMsg(res.message || 'Xác nhận bàn giao đồ thành công!');
        setContract(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể xác nhận bàn giao đồ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Hoàn tất trả đồ & hoàn cọc (+5 Karma) (Bước 3)
  const handleConfirmReturn = () => {
    setIsReturnConfirmModalOpen(true);
  };

  const executeConfirmReturn = async () => {
    if (!contract) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await rentalService.confirmReturnAndRefund(contract.id);
      if (res.success && res.data) {
        setSuccessMsg('Xác nhận nhận lại thiết bị & hoàn cọc 100% thành công! Bước 3 hoàn tất, Bước 4 đã mở khóa.');
        setContract(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi xác nhận hoàn tất hợp đồng.');
    } finally {
      setIsSubmitting(false);
      setIsReturnConfirmModalOpen(false);
    }
  };

  const getStatusBadge = () => {
    switch (contract.status) {
      case 'PENDING':
        return {
          label: 'Chờ người cho thuê duyệt',
          classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        };
      case 'APPROVED':
        return {
          label: 'Đã duyệt - Đang hẹn bàn giao',
          classes: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
        };
      case 'ACTIVE':
        return {
          label: 'Đang trong thời hạn thuê',
          classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
        };
      case 'RETURNED':
        return {
          label: 'Đã hoàn tất & Hoàn cọc (+5 Karma)',
          classes: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
        };
      case 'DISPUTED':
        return {
          label: 'Khiếu nại cọc (QTV xem xét)',
          classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
        };
      default:
        return {
          label: contract.status,
          classes: 'bg-slate-50 text-slate-700 border border-slate-200',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-16">
      {/* Back button & quick navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/rentals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách hợp đồng thuê</span>
        </Link>

        {contract.listingId && (
          <Link
            to={`/listings/${contract.listingId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            <span>Xem bài đăng thiết bị</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Contract Summary Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${badge.classes}`}>
              {badge.label}
            </span>
            <span className="text-xs text-slate-400 font-mono">Hợp đồng #{contract.id}</span>
          </div>

          <span className="text-xs text-slate-400">
            Ngày lập: {formatDate(contract.createdAt)}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <Package className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {contract.listingTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy trình thuê an toàn bảo vệ tiền cọc sinh viên tại Trường Đại học Phenikaa.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Contract summary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-blue-500" /> Chủ đồ (Cho thuê)
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{contract.ownerName}</p>
            <span className="text-[10px] text-slate-500 font-medium">Karma: {contract.ownerKarma || 20} điểm</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-500" /> Người thuê
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{contract.renterName}</p>
            <span className="text-[10px] text-slate-500 font-medium">Karma: {contract.renterKarma || 20} điểm</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Tiền cọc bảo đảm
            </span>
            <p className="text-base font-black text-blue-700 dark:text-blue-300 font-mono">
              {formatCurrency(contract.depositAmount)}
            </p>
            <span className="text-[10px] text-slate-500">Hoàn trả 100% khi trả máy</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-orange-500" /> Tiền thuê & Thời hạn
            </span>
            <p className="text-base font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(contract.totalRentAmount)}
            </p>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
            </span>
          </div>
        </div>

        {/* Rental Terms & Conditions Card */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>Quy định điều khoản thuê & Xử lý tiền cọc từ chủ đồ:</span>
          </div>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            {contract.rentalTerms ||
              'Áp dụng quy định chuẩn: Làm hỏng mất 100% cọc; Trầy xước khấu trừ 20-30%; Trả muộn tính phụ phí; Hai bên kiểm tra máy trực tiếp khi nhận và trả.'}
          </p>
          <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1">
            <span className="font-semibold shrink-0">Căn cứ Ban Quản Trị:</span>
            <span>
              Điều khoản này là cơ sở để Quản trị viên (QTV) phân xử khiếu nại (ví dụ: người thuê trả muộn 2 ngày và người cho thuê có bằng chứng, QTV sẽ xem xét chỉ hoàn lại một phần cọc chứ không hoàn đủ).
            </span>
          </div>
        </div>
      </div>

      {/* DANH SÁCH CÁC BƯỚC GIAO DỊCH (HIỂN THỊ ĐẦY ĐỦ DẠNG LIST TUẦN TỰ) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Quy trình giao dịch thuê đồ an toàn (4 bước)
          </h2>
          <span className="text-xs text-slate-500">
            Hoàn thành từng bước tuần tự để mở khóa bước kế tiếp
          </span>
        </div>

        {/* ==================== BƯỚC 1: DUYỆT YÊU CẦU THUÊ ĐỒ ==================== */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            isStep1Done
              ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80'
              : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-600/50 shadow-md ring-2 ring-amber-500/10'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isStep1Done
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isStep1Done ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Bước 1: Phê duyệt yêu cầu thuê đồ
                  </h3>
                  {isStep1Done ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      ✓ Đã xác nhận thành công bước 1
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Đang chờ duyệt
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isStep1Done
                    ? `Chủ sở hữu (${contract.ownerName}) đã đồng ý cho ${contract.renterName} thuê đồ từ ${formatDate(contract.startDate)} đến ${formatDate(contract.endDate)}.`
                    : isOwner
                    ? `Bạn có yêu cầu thuê từ ${contract.renterName}. Hãy xem xét thời gian và ấn xác nhận cho thuê để chuyển sang bước hẹn gặp.`
                    : `Yêu cầu thuê của bạn đang chờ ${contract.ownerName} phê duyệt.`}
                </p>
              </div>
            </div>

            {/* Actions Step 1 */}
            {!isStep1Done && (
              <div className="flex items-center gap-2 shrink-0">
                {isOwner ? (
                  <>
                    <BaseButton
                      variant="primary"
                      size="sm"
                      isLoading={isSubmitting}
                      onClick={handleApproveContract}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận cho thuê</span>
                    </BaseButton>
                    <BaseButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectCancelType('REJECT');
                        setIsRejectCancelModalOpen(true);
                      }}
                      className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Từ chối</span>
                    </BaseButton>
                  </>
                ) : (
                  <BaseButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRejectCancelType('CANCEL');
                      setIsRejectCancelModalOpen(true);
                    }}
                    className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy yêu cầu</span>
                  </BaseButton>
                )}
                <BaseButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate('/chat', {
                      state: {
                        sellerId: isOwner ? contract.renterId : contract.ownerId,
                        sellerName: isOwner ? contract.renterName : contract.ownerName,
                        listingId: contract.listingId,
                        listingTitle: contract.listingTitle,
                      },
                    })
                  }
                  className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Nhắn tin</span>
                </BaseButton>
              </div>
            )}
          </div>
        </div>

        {/* ==================== BƯỚC 2: HẸN GẶP, CHỤP ẢNH ĐỐI CHIẾU & BÀN GIAO THIẾT BỊ ==================== */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            !isStep1Done
              ? 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
              : isStep2Done
              ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80'
              : 'bg-white dark:bg-slate-900 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-500/10'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    !isStep1Done
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      : isStep2Done
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {!isStep1Done ? <Lock className="w-4 h-4" /> : isStep2Done ? <Check className="w-5 h-5" /> : '2'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bước 2: Hẹn gặp bàn giao thiết bị & Chụp ảnh đối chiếu hiện trạng
                    </h3>
                    {!isStep1Done ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Chưa mở khóa (Hoàn thành Bước 1)
                      </span>
                    ) : isStep2Done ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        ✓ Đã xác nhận thành công bước 2
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        Đang thực hiện bàn giao
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hai bạn hẹn gặp tại điểm an toàn trường Phenikaa. Trước khi xác nhận đã giao đồ, bắt buộc phải chụp ít nhất 2 ảnh sản phẩm để xác nhận tình trạng món đồ và lưu biên bản đối chiếu.
                  </p>
                </div>
              </div>
            </div>

            {/* Chi tiết Bước 2 khi đã được mở khóa */}
            {isStep1Done && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* 2.1: HIỂN THỊ GIỜ & ĐIỂM GẶP MẶT ĐÃ BÀN TRƯỚC Ở TIN NHẮN */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Giờ và điểm gặp mặt bàn giao (Đã bàn trước ở tin nhắn):</span>
                    </span>
                    {!isStep2Done && (
                      <button
                        type="button"
                        onClick={() => setIsEditingMeeting(!isEditingMeeting)}
                        className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingMeeting ? 'Đóng' : 'Thay đổi điểm/giờ hẹn'}</span>
                      </button>
                    )}
                  </div>

                  {!isEditingMeeting ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Điểm hẹn an toàn:</span>
                          <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                            {meetingPoint}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Giờ hẹn gặp:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {meetingTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Chọn điểm hẹn an toàn tại Trường ĐH Phenikaa:
                        </label>
                        <select
                          value={meetingPoint}
                          onChange={(e) => setMeetingPoint(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        >
                          {PHENIKAA_SAFE_MEETING_POINTS.map((pt) => (
                            <option key={pt.id} value={pt.name}>
                              {pt.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Giờ hẹn thống nhất:
                        </label>
                        <input
                          type="text"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          placeholder="vd: 14:30 - Thứ 3 (03/10/2026)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <BaseButton
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingMeeting(false)}
                          className="text-xs"
                        >
                          Hủy
                        </BaseButton>
                        <BaseButton
                          size="sm"
                          variant="primary"
                          onClick={handleSaveMeetingDetails}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Lưu điểm & giờ hẹn
                        </BaseButton>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Khu vực có camera an ninh và bảo vệ túc trực để đảm bảo an toàn giao dịch.
                    </span>
                    <BaseButton
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate('/chat', {
                          state: {
                            sellerId: isOwner ? contract.renterId : contract.ownerId,
                            sellerName: isOwner ? contract.renterName : contract.ownerName,
                            listingId: contract.listingId,
                            listingTitle: contract.listingTitle,
                          },
                        })
                      }
                      className="text-xs font-semibold text-indigo-700 border-indigo-300 hover:bg-indigo-100/50 gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Nhắn tin hẹn giờ & điểm gặp mặt</span>
                    </BaseButton>
                  </div>
                </div>

                {/* 2.2: BIÊN BẢN ẢNH ĐỐI CHIẾU HIỆN TRẠNG (CẦN ÍT NHẤT 2 ẢNH) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Biên bản ảnh đối chiếu hiện trạng thiết bị ({proofImages.length}/4 ảnh)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cả người thuê và người cho thuê đều chụp từ 2 - 4 góc (màn hình, mặt trước, số serial, vết trầy xước cũ nếu có) trước khi bàn giao để làm căn cứ bảo vệ tiền cọc.
                      </p>
                    </div>

                    {!isStep2Done && proofImages.length < 2 && (
                      <button
                        type="button"
                        onClick={handleAddSamplePhotos}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        + Dùng ảnh chụp mẫu nhanh
                      </button>
                    )}
                  </div>

                  {/* Grid ảnh */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {proofImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs bg-slate-100 dark:bg-slate-800"
                      >
                        <img src={url} alt={`Hiện trạng ${idx + 1}`} className="w-full h-full object-cover" />
                        {!isStep2Done && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                            title="Xóa ảnh"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] bg-black/60 backdrop-blur-sm text-white font-medium">
                          Góc ảnh #{idx + 1}
                        </span>
                      </div>
                    ))}

                    {!isStep2Done && proofImages.length < 4 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-slate-900 transition-colors p-3 text-center group">
                        <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-1" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Thêm ảnh góc #{proofImages.length + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Chụp từ 2-4 góc</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleSimulateAddImage}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Nút lưu ảnh đối chiếu */}
                  {!isStep2Done && (
                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[11px] font-semibold ${hasSavedProof ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {hasSavedProof
                          ? `✓ Đã lưu biên bản ${proofImages.length} ảnh hiện trạng hợp lệ.`
                          : proofImages.length >= 2
                          ? 'Đã tải đủ ảnh. Hãy ấn Lưu biên bản để hoàn tất điều kiện.'
                          : `⚠️ Cần tải lên ít nhất ${2 - proofImages.length} ảnh nữa để đủ điều kiện xác nhận.`}
                      </span>
                      <BaseButton
                        variant="primary"
                        size="sm"
                        isLoading={isSubmitting}
                        disabled={proofImages.length < 2}
                        onClick={handleSaveProofImages}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lưu biên bản ảnh đối chiếu</span>
                      </BaseButton>
                    </div>
                  )}
                </div>

                {/* 2.3: XÁC NHẬN BÀN GIAO THIẾT BỊ (ĐIỀU KIỆN TIÊN QUYẾT: ĐÃ CÓ ẢNH & LỊCH HẸN) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Trạng thái xác nhận bàn giao đồ của 2 bên:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Cả 2 bên đều phải xác nhận khi gặp mặt trực tiếp
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        contract.ownerHandoverConfirmed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span>1. Chủ đồ ({contract.ownerName}):</span>
                      <span>{contract.ownerHandoverConfirmed ? '✓ Đã xác nhận đã giao đồ' : '⏳ Chưa xác nhận'}</span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        contract.renterHandoverConfirmed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span>2. Người thuê ({contract.renterName}):</span>
                      <span>{contract.renterHandoverConfirmed ? '✓ Đã xác nhận đã nhận đồ' : '⏳ Chưa xác nhận'}</span>
                    </div>
                  </div>

                  {/* Nút bấm xác nhận bàn giao */}
                  {!isStep2Done && (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <BaseButton
                          variant="primary"
                          isLoading={isSubmitting}
                          disabled={proofImages.length < 2 || !hasSavedProof}
                          onClick={() => handleConfirmHandover()}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2 disabled:opacity-50"
                          title={
                            proofImages.length < 2
                              ? 'Cần chụp ít nhất 2 ảnh hiện trạng thiết bị trước khi xác nhận'
                              : 'Xác nhận đã gặp mặt và bàn giao đồ thành công'
                          }
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isOwner
                              ? contract.ownerHandoverConfirmed
                                ? '✓ Bạn đã xác nhận đã giao đồ (Chờ người thuê)'
                                : 'Xác nhận đã giao đồ'
                              : contract.renterHandoverConfirmed
                              ? '✓ Bạn đã xác nhận đã nhận đồ (Chờ chủ đồ)'
                              : 'Xác nhận đã nhận được đồ'}
                          </span>
                        </BaseButton>

                        {/* Nút hỗ trợ test nhanh xác nhận cả 2 bên */}
                        <BaseButton
                          variant="outline"
                          size="sm"
                          isLoading={isSubmitting}
                          disabled={proofImages.length < 2 || !hasSavedProof}
                          onClick={() => {
                            handleConfirmHandover('owner');
                            setTimeout(() => handleConfirmHandover('renter'), 300);
                          }}
                          className="text-xs font-semibold text-slate-600 border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                          title="Mô phỏng cả chủ đồ và người thuê cùng bấm xác nhận"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Xác nhận cả 2 bên (Test nhanh)</span>
                        </BaseButton>
                      </div>

                      {(!hasSavedProof || proofImages.length < 2) && (
                        <p className="text-[11px] text-amber-600 font-medium">
                          * Lưu ý: Nút xác nhận chỉ khả dụng sau khi bạn chụp ít nhất 2 ảnh đối chiếu hiện trạng và ấn "Lưu biên bản ảnh đối chiếu".
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================== BƯỚC 3: ĐANG TRONG THỜI HẠN THUÊ & HẸN GẶP HOÀN TRẢ ==================== */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            !isStep2Done
              ? 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
              : isStep3Done
              ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80'
              : 'bg-white dark:bg-slate-900 border-emerald-400 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/10'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    !isStep2Done
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      : isStep3Done
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {!isStep2Done ? <Lock className="w-4 h-4" /> : isStep3Done ? <Check className="w-5 h-5" /> : '3'}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bước 3: Sử dụng thiết bị trong thời hạn & Hẹn gặp hoàn trả đồ
                    </h3>
                    {!isStep2Done ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Chưa mở khóa (Hoàn thành Bước 2)
                      </span>
                    ) : isStep3Done ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        ✓ Đã xác nhận thành công bước 3
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        Đang trong thời hạn thuê
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hạn trả đồ đến ngày: <strong>{formatDate(contract.endDate)}</strong>. Đến hạn trả, người thuê nhắn tin hẹn gặp lại chủ đồ. Cả hai gặp nhau kiểm tra máy, nếu nguyên vẹn không phát sinh lỗi thì ấn hoàn tất để hoàn trả 100% tiền cọc.
                  </p>
                </div>
              </div>
            </div>

            {/* Chi tiết Bước 3 khi mở khóa */}
            {isStep2Done && !isStep3Done && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <BaseButton
                    variant="primary"
                    isLoading={isSubmitting}
                    onClick={handleConfirmReturn}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận đã hoàn tất trả hàng & Hoàn cọc (+5 Karma)</span>
                  </BaseButton>

                  <BaseButton
                    variant="outline"
                    onClick={() =>
                      navigate('/chat', {
                        state: {
                          sellerId: isOwner ? contract.renterId : contract.ownerId,
                          sellerName: isOwner ? contract.renterName : contract.ownerName,
                          listingId: contract.listingId,
                          listingTitle: contract.listingTitle,
                        },
                      })
                    }
                    className="text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Nhắn tin hẹn trả đồ</span>
                  </BaseButton>

                  <BaseButton
                    variant="outline"
                    onClick={() => setIsDisputeModalOpen(true)}
                    className="text-xs font-semibold text-rose-600 border-rose-300 hover:bg-rose-50 gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Khiếu nại cọc gửi QTV</span>
                  </BaseButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ==================== BƯỚC 4: HOÀN TẤT GIAO DỊCH & ĐÁNH GIÁ TRẢI NGHIỆM ==================== */}
        <div
          className={`p-6 rounded-3xl border transition-all ${
            !isStep3Done
              ? 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
              : 'bg-white dark:bg-slate-900 border-blue-500 dark:border-blue-500 shadow-md ring-2 ring-blue-500/15'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    !isStep3Done
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  }`}
                >
                  {!isStep3Done ? <Lock className="w-4 h-4" /> : <Check className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bước 4: Hoàn tất giao dịch & Đánh giá trải nghiệm
                    </h3>
                    {!isStep3Done ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Chưa mở khóa (Hoàn thành Bước 3)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        ✓ Giao dịch đã hoàn thành 100%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isStep3Done
                      ? `Thiết bị đã được trả lại an toàn và giải tỏa 100% tiền cọc (${formatCurrency(contract.depositAmount)}). Cả hai bạn đều nhận được +5 điểm tín nhiệm Campus Karma!`
                      : 'Sau khi hoàn tất trả hàng và hoàn cọc, giao dịch sẽ chính thức hoàn thành và bạn có thể gửi đánh giá cho đối phương.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Chi tiết Bước 4 khi mở khóa */}
            {isStep3Done && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
                <BaseButton
                  variant="primary"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold gap-2 shadow-sm"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>Đánh giá trải nghiệm thuê đồ</span>
                </BaseButton>

                {contract.listingId && (
                  <Link to={`/listings/${contract.listingId}`}>
                    <BaseButton variant="outline" className="text-xs font-bold border-slate-300 text-slate-700 gap-1.5">
                      <span>Xem đánh giá trên trang món đồ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </BaseButton>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetUserId={isOwner ? contract.renterId : contract.ownerId}
        targetUserName={isOwner ? contract.renterName || 'Người thuê' : contract.ownerName || 'Chủ thiết bị'}
        listingId={contract.listingId}
        listingTitle={contract.listingTitle}
        onSuccess={() => {
          setSuccessMsg('Đánh giá trải nghiệm thành công! Nhận xét của bạn đã được lưu và hiển thị trên trang sản phẩm.');
        }}
      />

      {/* Dispute Modal */}
      <ReportModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        targetUserName={isOwner ? contract.renterName : contract.ownerName}
        targetUserId={isOwner ? contract.renterId : contract.ownerId}
        rentalContractId={contract.id}
        onReportSuccess={() => {
          setContract((prev) => (prev ? { ...prev, status: 'DISPUTED' } : null));
          setSuccessMsg('Đã gửi báo cáo khiếu nại cọc tới Ban Quản Trị!');
        }}
      />

      {/* Reject / Cancel Reason Modal */}
      <RentalRejectCancelModal
        isOpen={isRejectCancelModalOpen}
        onClose={() => setIsRejectCancelModalOpen(false)}
        onSubmit={handleRejectCancelSubmit}
        type={rejectCancelType}
        listingTitle={contract.listingTitle}
        peerName={isOwner ? contract.renterName : contract.ownerName}
        isLoading={isSubmitting}
      />

      {/* Confirmation Modal for Return & Refund (In-App thay cho localhost say) */}
      {isReturnConfirmModalOpen && (
        <BaseModal
          isOpen={isReturnConfirmModalOpen}
          onClose={() => setIsReturnConfirmModalOpen(false)}
          title="Xác nhận nhận lại thiết bị & Hoàn cọc"
          maxWidth="md"
        >
          <div className="space-y-4 py-1">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Xác nhận bạn đã nhận lại thiết bị <strong>"{contract.listingTitle}"</strong> đầy đủ nguyên vẹn và hoàn trả 100% tiền cọc ({contract.depositAmount ? formatCurrency(contract.depositAmount) : '0 đ'}) cho người thuê?
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Giao dịch thành công sẽ cộng ngay <strong>+5 điểm tín nhiệm Campus Karma</strong> cho cả hai bạn!</span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <BaseButton
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setIsReturnConfirmModalOpen(false)}
              >
                Hủy
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={executeConfirmReturn}
              >
                Xác nhận hoàn tất (+5 Karma)
              </BaseButton>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};
