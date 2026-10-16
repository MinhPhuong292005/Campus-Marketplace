import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { rentalService } from '../../services/rentalService';
import { RentalContract } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ReportModal } from '../../components/features/ReportModal';

export const RentalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    const contractId = parseInt(id, 10);
    const res = await rentalService.getRentalById(contractId);
    if (res.success && res.data) {
      setContract(res.data);
      setProofImages(res.data.proofImages || []);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!contract) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-slate-500">
        <p>Đang tải thông tin hợp đồng #{id}...</p>
      </div>
    );
  }

  const handleSimulateAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (proofImages.length + files.length > 4) {
      setErrorMsg('Tối đa 4 ảnh đối chiếu hiện trạng theo tiêu chí nghiệm thu (AC2).');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      setProofImages((prev) => [...prev, url]);
    }
    setErrorMsg(null);
  };

  const handleRemoveImage = (index: number) => {
    setProofImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProofImages = async () => {
    if (proofImages.length < 2 || proofImages.length > 4) {
      setErrorMsg('Bắt buộc phải tải từ 2 đến 4 ảnh chứng minh tình trạng thiết bị trước khi bàn giao (AC2).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await rentalService.uploadProofImages(contract.id, proofImages);
      if (res.success) {
        setSuccessMsg('Đã lưu 2-4 ảnh hiện trạng bàn giao! Hợp đồng đã kích hoạt (ACTIVE).');
        setContract((prev) => (prev ? { ...prev, status: 'ACTIVE', proofImages } : null));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!window.confirm('Xác nhận thiết bị đã được hoàn trả nguyên vẹn và hoàn cọc đầy đủ?')) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const res = await rentalService.confirmReturnAndRefund(contract.id);
      if (res.success) {
        setSuccessMsg('Xác nhận trả đồ & Hoàn cọc thành công! Cả 2 bên đều được thưởng +5 Karma.');
        setContract((prev) => (prev ? { ...prev, status: 'RETURNED' } : null));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/rentals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách hợp đồng thuê</span>
        </Link>
      </div>

      {/* Header card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                contract.status === 'ACTIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : contract.status === 'PENDING'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : contract.status === 'RETURNED'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {contract.status === 'ACTIVE'
                ? 'Đang thuê thiết bị'
                : contract.status === 'PENDING'
                ? 'Chờ check-in ảnh trước khi bàn giao'
                : contract.status === 'RETURNED'
                ? 'Đã hoàn tất trả đồ & Hoàn cọc'
                : 'Đang tranh chấp cọc'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Mã HĐ #{contract.id}</span>
          </div>

          <span className="text-xs text-slate-400">
            Tạo lúc: {formatDate(contract.createdAt)}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          {contract.listingTitle}
        </h1>

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Contract summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Người cho thuê</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{contract.ownerName}</p>
            <span className="text-[10px] text-blue-500 font-medium">Karma: {contract.ownerKarma} điểm</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Người thuê</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{contract.renterName}</p>
            <span className="text-[10px] text-blue-500 font-medium">Karma: {contract.renterKarma} điểm</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-semibold uppercase">Tiền cọc bắt buộc</span>
            <p className="text-base font-extrabold text-blue-700 dark:text-blue-300 font-mono mt-0.5">
              {formatCurrency(contract.depositAmount)}
            </p>
            <span className="text-[10px] text-slate-500">Hoàn lại khi trả đồ</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Tổng giá thuê</span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
              {formatCurrency(contract.totalRentAmount)}
            </p>
            <span className="text-[10px] text-slate-400">Thời hạn: {formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
          </div>
        </div>
      </div>

      {/* Proof images check-in area (AC2: Bắt buộc từ 2 đến 4 ảnh đối chiếu hiện trạng) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Ảnh Chụp Đối Chiếu Hiện Trạng Thiết Bị ({proofImages.length}/4 ảnh)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tiêu chí AC2: Bắt buộc cả 2 bên chụp từ 2 - 4 góc (mặt trước, màn hình, số serial, vết trầy cũ) trước khi nhận/giao đồ.
            </p>
          </div>

          {contract.status === 'PENDING' && proofImages.length < 2 && (
            <button
              type="button"
              onClick={() => {
                setProofImages([
                  'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&q=80',
                  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80',
                ]);
              }}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" /> Tải 2 ảnh mẫu kiểm tra
            </button>
          )}
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
          {proofImages.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group"
            >
              <img src={url} alt={`Hiện trạng ${idx + 1}`} className="w-full h-full object-cover" />
              {contract.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                  title="Xóa ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] bg-black/60 backdrop-blur-sm text-white font-medium">
                Góc #{idx + 1}
              </span>
            </div>
          ))}

          {contract.status === 'PENDING' && proofImages.length < 4 && (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-950 transition-colors p-3 text-center group">
              <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-500 mb-1 transition-colors" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Thêm ảnh góc #{proofImages.length + 1}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Yêu cầu 2-4 ảnh</span>
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

        {/* Submit proof button if PENDING */}
        {contract.status === 'PENDING' && (
          <div className="flex justify-end pt-2">
            <BaseButton
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={proofImages.length < 2 || proofImages.length > 4}
              onClick={handleSaveProofImages}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận ảnh hiện trạng & Bắt đầu thuê (Kích hoạt ACTIVE)</span>
            </BaseButton>
          </div>
        )}
      </div>

      {/* Lifecycle Actions (AC3 & AC4) */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Quy trình Kết thúc & Hoàn cọc (AC3 - AC4)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Khi nhận lại đồ nguyên vẹn, chủ thiết bị bấm xác nhận để hoàn trả tiền cọc và nhận điểm tín nhiệm.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {contract.status === 'ACTIVE' && (
            <>
              {/* Dispute Button (AC4) */}
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => setIsDisputeModalOpen(true)}
                className="text-rose-600 border-rose-300 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Báo cáo tranh chấp cọc</span>
              </BaseButton>

              {/* Confirm Return & Refund Button (AC3) */}
              <BaseButton
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleConfirmReturn}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận trả đồ & Hoàn cọc (+5 Karma)</span>
              </BaseButton>
            </>
          )}

          {contract.status === 'RETURNED' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Hợp đồng đã hoàn tất thành công. Tiền cọc đã hoàn lại.</span>
            </div>
          )}

          {contract.status === 'DISPUTED' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Đang giải quyết tranh chấp cọc qua Moderator</span>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal */}
      <ReportModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        targetUserName={contract.renterName}
        targetUserId={contract.renterId}
        rentalContractId={contract.id}
        onReportSuccess={() => {
          setContract((prev) => (prev ? { ...prev, status: 'DISPUTED' } : null));
        }}
      />
    </div>
  );
};
