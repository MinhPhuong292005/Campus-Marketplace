import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  Camera,
  Maximize2,
  Clock,
  Send,
  RotateCcw,
} from 'lucide-react';
import { BaseButton } from '../base/BaseButton';
import { useAuthStore } from '../../store/useAuthStore';
import { studentCardService } from '../../services/studentCardService';

interface StudentCardVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmittedSuccess?: () => void;
  onVerifiedSuccess?: (res?: any) => void;
}

export const StudentCardVerifyModal: React.FC<StudentCardVerifyModalProps> = ({
  isOpen,
  onClose,
  onSubmittedSuccess,
  onVerifiedSuccess,
}) => {
  const { user, updateUser } = useAuthStore();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Load existing submission if user has pending card
  useEffect(() => {
    if (user?.id) {
      const existing = studentCardService.getSubmission(user.id);
      if (existing) {
        setFrontImage(existing.frontImageUrl);
        setBackImage(existing.backImageUrl);
        if (user.studentCardStatus === 'PENDING') {
          setIsSubmittedSuccess(true);
        }
      } else if (user.studentCardFrontUrl) {
        setFrontImage(user.studentCardFrontUrl);
        setBackImage(user.studentCardBackUrl || null);
        if (user.studentCardStatus === 'PENDING') {
          setIsSubmittedSuccess(true);
        }
      }
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSelectFront = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSelectBack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSubmitVerification = async () => {
    if (!frontImage || !backImage) {
      setErrorMsg('Vui lòng chụp và tải lên đầy đủ ảnh cả 2 mặt (mặt trước và mặt sau) của thẻ sinh viên.');
      return;
    }

    if (!user) {
      setErrorMsg('Vui lòng đăng nhập tài khoản sinh viên trước khi gửi xác thực.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await studentCardService.submitVerificationRequest({
        user,
        frontImageUrl: frontImage,
        backImageUrl: backImage,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setIsSubmittedSuccess(true);
        updateUser({
          studentCardStatus: 'PENDING',
          studentCardFrontUrl: frontImage,
          studentCardBackUrl: backImage,
        });
        if (onSubmittedSuccess) {
          onSubmittedSuccess();
        }
        if (onVerifiedSuccess) {
          onVerifiedSuccess({ status: 'PENDING' });
        }
      } else {
        setErrorMsg(res.message || 'Không thể gửi hồ sơ xác thực lúc này.');
      }
    } catch {
      setErrorMsg('Đã có lỗi xảy ra khi gửi hồ sơ xác thực. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResubmit = () => {
    setIsSubmittedSuccess(false);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Xác Thực Thẻ Sinh Viên Phenikaa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chụp ảnh 2 mặt thẻ sinh viên để xét duyệt và cấp Tích Xanh chính chủ (+15 Karma)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MÀN HÌNH 1: ĐÃ GỬI DUYỆT THÀNH CÔNG / ĐANG CHỜ QUẢN TRỊ VIÊN DUYỆT */}
        {isSubmittedSuccess || user?.studentCardStatus === 'PENDING' ? (
          <div className="mt-5 space-y-5 animate-in zoom-in-95 duration-200 text-center sm:text-left">
            <div className="p-5 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-black text-amber-950 dark:text-amber-200">
                    Hồ Sơ Xác Thực Đang Chờ Ban Quản Trị Duyệt
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-extrabold">
                    ⏳ Đang chờ kiểm duyệt
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Ảnh 2 mặt thẻ sinh viên của bạn đã được chuyển đến Ban Quản Trị Chợ Sinh Viên Phenikaa. Quản trị viên sẽ đối chiếu Họ tên, MSSV và kích hoạt{' '}
                  <strong className="text-blue-600 dark:text-blue-400">Tích Xanh chính chủ (+15 Karma)</strong> cho bạn trong vòng 24 giờ.
                </p>
              </div>
            </div>

            {/* Xem lại 2 ảnh thẻ đã gửi */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Ảnh 2 mặt thẻ sinh viên bạn đã gửi duyệt:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {frontImage && (
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      Mặt trước thẻ sinh viên
                    </span>
                    <div className="relative aspect-[16/10] max-h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <img src={frontImage} alt="Mặt trước thẻ" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
                {backImage && (
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      Mặt sau thẻ sinh viên
                    </span>
                    <div className="relative aspect-[16/10] max-h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <img src={backImage} alt="Mặt sau thẻ" className="w-full h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResubmit}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Chụp lại hoặc tải ảnh thẻ khác
              </button>
              <BaseButton variant="primary" size="sm" onClick={onClose} className="px-6">
                Đã hiểu &amp; Đóng
              </BaseButton>
            </div>
          </div>
        ) : (
          /* MÀN HÌNH 2: FORM TẢI ẢNH 2 MẶT & LƯU Ý */
          <div className="mt-5 space-y-5">
            {/* LƯU Ý CHỤP THẺ */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Lưu ý khi chụp ảnh thẻ:</p>
              <p>• Chụp rõ nét cả 2 mặt thẻ, thấy rõ Họ tên và Mã sinh viên Phenikaa.</p>
              <p>• Đặt thẻ ngay ngắn, đủ ánh sáng, không lóa và không che khuất thông tin.</p>
            </div>

            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tải lên 2 mặt thẻ sinh viên của bạn:
            </div>

            {/* 2 VÙNG TẢI ẢNH: MẶT TRƯỚC VÀ MẶT SAU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mặt trước */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>1. Mặt trước thẻ *</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">(Ảnh, Họ tên, MSSV, Logo)</span>
                </label>

                {frontImage ? (
                  <div className="relative aspect-[16/10] max-h-52 w-full rounded-2xl overflow-hidden border-2 border-blue-500/60 shadow-md group bg-slate-900 flex items-center justify-center">
                    <img
                      src={frontImage}
                      alt="Mặt trước thẻ sinh viên"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                      Mặt trước
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: frontImage, title: 'Mặt trước thẻ sinh viên' })}
                        className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 transition"
                        title="Xem ảnh lớn"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrontImage(null)}
                        className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition"
                        title="Chọn lại ảnh"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="aspect-[16/10] max-h-52 w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 p-4 text-center transition-all group">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tải ảnh mặt trước
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Chụp rõ ảnh chân dung &amp; mã sinh viên
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectFront}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Mặt sau */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>2. Mặt sau thẻ *</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">(Dải từ, Mã vạch, Niên khóa)</span>
                </label>

                {backImage ? (
                  <div className="relative aspect-[16/10] max-h-52 w-full rounded-2xl overflow-hidden border-2 border-purple-500/60 shadow-md group bg-slate-900 flex items-center justify-center">
                    <img
                      src={backImage}
                      alt="Mặt sau thẻ sinh viên"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold shadow-xs">
                      Mặt sau
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: backImage, title: 'Mặt sau thẻ sinh viên' })}
                        className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 transition"
                        title="Xem ảnh lớn"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackImage(null)}
                        className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition"
                        title="Chọn lại ảnh"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="aspect-[16/10] max-h-52 w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 p-4 text-center transition-all group">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tải ảnh mặt sau
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Chụp rõ mã vạch barcode &amp; thông tin thẻ
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSelectBack}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Ghi chú thêm (Tùy chọn) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ghi chú thêm gửi Quản trị viên (Không bắt buộc)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="vd: Thẻ mới cấp lại kỳ này, sinh viên K17 khoa CNTT..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Dữ liệu được bảo mật cho mục đích xác thực nội bộ
              </span>

              <div className="flex items-center gap-2.5">
                <BaseButton variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Hủy
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitVerification}
                  isLoading={isSubmitting}
                  disabled={!frontImage || !backImage}
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Ban Quản Trị duyệt (+15 Karma)</span>
                </BaseButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Phóng To Xem Chi Tiết Ảnh Thẻ */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-950 p-3 rounded-3xl border border-slate-800 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white text-xs font-bold px-2">
              <span>{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full h-auto max-h-[68vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
