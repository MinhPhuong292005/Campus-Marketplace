import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertCircle,
  Scan,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { BaseButton } from '../base/BaseButton';
import { ocrService } from '../../services/ocrService';
import { OcrVerificationResult } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

interface StudentCardVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedSuccess?: (res: OcrVerificationResult) => void;
}

export const StudentCardVerifyModal: React.FC<StudentCardVerifyModalProps> = ({
  isOpen,
  onClose,
  onVerifiedSuccess,
}) => {
  const { user, updateKarma } = useAuthStore();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<OcrVerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateSelectFront = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSimulateSelectBack = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleStartOcrScan = async () => {
    if (!frontImage || !backImage) {
      setErrorMsg('Vui lòng chụp hoặc tải lên đầy đủ cả 2 mặt thẻ sinh viên.');
      return;
    }

    try {
      setIsScanning(true);
      setErrorMsg(null);
      setScanProgress(20);

      const progressInterval = setInterval(() => {
        setScanProgress((prev) => (prev < 90 ? prev + 25 : prev));
      }, 350);

      const res = await ocrService.verifyStudentCard(frontImage, backImage);
      clearInterval(progressInterval);
      setScanProgress(100);

      if (res.success && res.data) {
        setResult(res.data);
        if (user && res.data.autoApproved) {
          updateKarma(user.karmaScore + res.data.karmaAwarded);
        }
        if (onVerifiedSuccess) {
          onVerifiedSuccess(res.data);
        }
      }
    } catch {
      setErrorMsg('Không thể xử lý ảnh thẻ lúc này. Vui lòng thử lại với ảnh rõ nét hơn.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setResult(null);
    setErrorMsg(null);
    setScanProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Xác thực Thẻ Sinh Viên qua AI OCR
              </h2>
              <p className="text-xs text-slate-500">
                Dành cho trường chưa cấp email Edu • Nhận diện tự động & cộng +15 Karma
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

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!result ? (
          <div className="mt-5 space-y-5">
            {/* Guidance Alert */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Quy chuẩn ảnh chụp thẻ:
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5 pt-0.5">
                <li>Đặt thẻ trên mặt phẳng tối màu, đủ ánh sáng, không bị lóa đèn flash.</li>
                <li>Lấy trọn 4 góc thẻ, không che khuất Họ tên, MSSV và dấu trường.</li>
                <li>Thời gian bóc tách AI Vision: <b>dưới 3 giây</b>.</li>
              </ul>
            </div>

            {/* Upload Area: Front & Back */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Front Card */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Mặt trước thẻ (Có ảnh & MSSV) *
                </label>
                {frontImage ? (
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-sm group">
                    <img src={frontImage} alt="Mặt trước thẻ" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFrontImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                      title="Chụp lại"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="aspect-[16/10] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 p-4 text-center transition-all">
                    <CreditCard className="w-8 h-8 text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tải ảnh mặt trước
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG ≤ 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSimulateSelectFront}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Back Card */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Mặt sau thẻ (Có hạn dùng & dấu) *
                </label>
                {backImage ? (
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-sm group">
                    <img src={backImage} alt="Mặt sau thẻ" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setBackImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                      title="Chụp lại"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="aspect-[16/10] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 p-4 text-center transition-all">
                    <Upload className="w-8 h-8 text-slate-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tải ảnh mặt sau
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG ≤ 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSimulateSelectBack}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Quick Demo Pre-fill Button */}
            {!frontImage && !backImage && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setFrontImage('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80');
                    setBackImage('https://images.unsplash.com/photo-1584697964190-705b893683f1?w=600&q=80');
                  }}
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Sử dụng ảnh mẫu thẻ SV Phenikaa để test nhanh
                </button>
              </div>
            )}

            {/* Progress bar when scanning */}
            {isScanning && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    AI Vision đang nhận diện ký tự quang học OCR...
                  </span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <BaseButton variant="outline" size="sm" onClick={onClose} disabled={isScanning}>
                Đóng
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                onClick={handleStartOcrScan}
                isLoading={isScanning}
                disabled={!frontImage || !backImage}
                className="gap-1.5"
              >
                <Scan className="w-4 h-4" />
                <span>Bóc tách thông tin thẻ (&lt; 3s)</span>
              </BaseButton>
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="mt-5 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                Xác thực thành công! Độ tin cậy: {result.confidenceScore}%
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Hệ thống AI đã tự động phê duyệt danh tính sinh viên và thưởng{' '}
                <span className="font-extrabold text-emerald-600 dark:text-emerald-300">
                  +{result.karmaAwarded} Campus Karma
                </span>!
              </p>
            </div>

            {/* Parsed Attributes */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Họ và tên sinh viên</span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">
                  {result.fullName}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Mã số sinh viên (MSSV)</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {result.studentCode}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Trường đại học / Cao đẳng</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {result.universityName}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Trạng thái định danh</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Đã xác minh chính chủ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Quét lại thẻ khác
              </button>
              <BaseButton variant="primary" size="sm" onClick={onClose}>
                Hoàn tất & Đóng
              </BaseButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
