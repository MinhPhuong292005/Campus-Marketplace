import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  Upload,
  CheckCircle,
  Info,
} from 'lucide-react';
import { BaseButton } from '../base/BaseButton';
import { reportService, CreateReportPayload } from '../../services/reportService';
import { ReportReason, SeverityLevel } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserName?: string;
  targetUserId?: number;
  listingId?: number;
  listingTitle?: string;
  rentalContractId?: number;
  reportedType?: 'LISTING' | 'USER' | 'TRANSACTION' | 'RENTAL';
  reportedId?: number;
  reportedTitle?: string;
  onSubmit?: (data: { reason: string; description: string; evidenceUrl?: string }) => void | Promise<void>;
  onReportSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetUserName = 'Người dùng',
  targetUserId,
  listingId,
  listingTitle,
  rentalContractId,
  reportedType,
  reportedId: _reportedId,
  reportedTitle,
  onSubmit,
  onReportSuccess,
}) => {
  const isRentalTransaction = Boolean(
    rentalContractId || reportedType === 'RENTAL' || reportedType === 'TRANSACTION'
  );

  const [reason, setReason] = useState<string>(
    isRentalTransaction ? 'KHONG_TRA_COC' : 'NOI_DUNG_CAM'
  );
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Options for rental contract reporting / dispute
  const rentalOptions = [
    {
      id: 'KHONG_TRA_COC',
      label: 'Không hoàn trả cọc / Chiếm giữ tiền cọc',
      desc: 'Bên cho thuê từ chối hoàn cọc dù thiết bị nguyên vẹn, vi phạm cam kết',
      sev: 'HIGH',
    },
    {
      id: 'THIET_BI_HONG_HOC',
      label: 'Thiết bị hỏng hóc / Không đúng mô tả',
      desc: 'Thiết bị lỗi nguồn, không sử dụng được, trầy xước nặng hoặc thiếu phụ kiện',
      sev: 'HIGH',
    },
    {
      id: 'QUA_HAN_KHONG_TRA',
      label: 'Quá hạn không trả đồ / Mất liên lạc',
      desc: 'Người thuê giữ thiết bị quá thời hạn hợp đồng không trả, không thể liên hệ',
      sev: 'HIGH',
    },
    {
      id: 'BOM_HEN_BAN_GIAO',
      label: 'Không đến điểm hẹn / Hủy hẹn không lý do',
      desc: 'Đối phương không xuất hiện tại điểm hẹn gặp bàn giao hoặc trả máy trong trường',
      sev: 'MEDIUM',
    },
    {
      id: 'TRANH_CHAP_HET_TRANG',
      label: 'Tranh chấp hiện trạng máy & mức bồi thường',
      desc: 'Bất đồng về lỗi thiết bị phát sinh sau khi thuê và số tiền cọc cần khấu trừ',
      sev: 'MEDIUM',
    },
    {
      id: 'THAI_DO_XAU_GIAN_LAN',
      label: 'Gian lận tiền bạc / Ngôn từ thiếu văn hóa',
      desc: 'Có dấu hiệu gian lận, chiếm đoạt tài sản hoặc cư xử đe dọa, thiếu văn minh học đường',
      sev: 'HIGH',
    },
  ];

  // Options for listing content reporting (Applicable for all viewers)
  const contentOptions = [
    {
      id: 'NOI_DUNG_CAM',
      label: 'Nội dung phản cảm, thô tục',
      desc: 'Ngôn từ xúc phạm, thiếu văn hóa, phản cảm',
      sev: 'MEDIUM',
    },
    {
      id: 'HINH_ANH_NHAY_CAM',
      label: 'Hình ảnh không phù hợp',
      desc: 'Ảnh nhạy cảm, phản cảm, vi phạm bản quyền',
      sev: 'MEDIUM',
    },
    {
      id: 'HANG_CAM_KTX',
      label: 'Hàng cấm theo quy chế trường',
      desc: 'Rao bán chất cấm, vape, thuốc lá điện tử KTX',
      sev: 'HIGH',
    },
    {
      id: 'SPAM_GIA_AO',
      label: 'Thông tin sai lệch / Giá ảo / Spam',
      desc: 'Giá ảo 0đ, spam đăng tin lặp lại nhiều lần',
      sev: 'LOW',
    },
  ];

  const activeOptions = isRentalTransaction ? rentalOptions : contentOptions;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chỉ chọn tệp hình ảnh (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceUrl(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setErrorMsg(
        isRentalTransaction
          ? 'Vui lòng mô tả chi tiết sự việc tranh chấp để Ban Quản trị xác minh và phân xử.'
          : 'Vui lòng mô tả chi tiết nội dung hoặc hình ảnh vi phạm để Ban Quản trị xử lý.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (onSubmit) {
        await onSubmit({
          reason,
          description: description.trim(),
          evidenceUrl: evidenceUrl.trim() || undefined,
        });
        setIsSubmitting(false);
        onClose();
        return;
      }

      const payload: CreateReportPayload = {
        reportedUserId: targetUserId,
        reportedListingId: listingId,
        reason: reason as ReportReason,
        description: isRentalTransaction
          ? `[Khiếu nại hợp đồng thuê #${rentalContractId || ''}] ${description.trim()}`
          : `[Báo cáo bài viết] ${description.trim()}`,
        evidenceUrl: evidenceUrl.trim() || undefined,
        severity,
      };

      const res = await reportService.createReport(payload);
      if (res.success) {
        setSuccessMsg(
          isRentalTransaction
            ? 'Đã gửi khiếu nại giao dịch thuê thành công! Ban Quản trị sẽ đối soát và giải quyết phân xử.'
            : 'Đã gửi báo cáo bài viết thành công! Ban Quản trị sẽ kiểm duyệt và xử lý trong vòng 24h.'
        );
        if (onReportSuccess) onReportSuccess();
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
          setDescription('');
          setEvidenceUrl('');
        }, 1500);
      }
    } catch {
      setErrorMsg('Không thể gửi báo cáo lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isRentalTransaction ? 'Khiếu Nại Giao Dịch Thuê Đồ' : 'Báo Cáo Bài Viết'}
              </h2>
              <p className="text-xs text-slate-500">
                {isRentalTransaction ? (
                  <span>{reportedTitle || `Hợp đồng thuê`} • Đối phương: <b className="text-slate-700 dark:text-slate-300">{targetUserName}</b></span>
                ) : (
                  <>
                    Đối tượng: <b className="text-slate-700 dark:text-slate-300">{targetUserName}</b>
                    {listingTitle && ` • Tin: ${listingTitle}`}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guidance banner */}
        <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {isRentalTransaction
              ? 'Ban Quản Trị sẽ trực tiếp đối soát hợp đồng, biên bản ảnh hiện trạng và lịch sử giao dịch để phân xử quyền lợi & xử lý tiền cọc công bằng.'
              : 'Mục này chỉ dùng để báo cáo nếu bài viết có hình ảnh hoặc nội dung phản cảm, hàng cấm hoặc không phù hợp quy chế sinh viên campus.'}
          </span>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reason selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRentalTransaction ? 'Lý do khiếu nại giao dịch thuê *' : 'Lý do báo cáo vi phạm *'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setReason(item.id);
                    setSeverity(item.sev as SeverityLevel);
                  }}
                  className={`p-3 rounded-2xl text-left border text-xs transition-all ${
                    reason === item.id
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-semibold ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isRentalTransaction
                ? 'Mô tả chi tiết nội dung khiếu nại giao dịch *'
                : 'Mô tả chi tiết nội dung / hình ảnh vi phạm *'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isRentalTransaction
                  ? 'VD: Bên cho thuê không chịu hoàn tiền cọc dù máy còn nguyên vẹn; hoặc người thuê giữ thiết bị quá hạn 3 ngày không trả và ngắt liên lạc...'
                  : 'VD: Hình ảnh đính kèm bài viết chứa nội dung nhạy cảm, hoặc bài viết rao bán vape/pod cấm trong khuôn viên KTX...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Evidence Image - Real complainant photo (No sample images) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ảnh bằng chứng xác thực (chụp thực tế từ người khiếu nại)
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="Dán đường dẫn ảnh hoặc bấm Tải ảnh từ máy..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-900 dark:text-white"
                />
                <label className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh từ máy</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview of actual uploaded image */}
              {evidenceUrl && (
                <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={evidenceUrl}
                    alt="Bằng chứng khiếu nại"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setEvidenceUrl('')}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition"
                    title="Xóa ảnh"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isRentalTransaction ? 'Gửi Khiếu Nại Giao Dịch' : 'Gửi Báo Cáo Bài Viết'}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
};
