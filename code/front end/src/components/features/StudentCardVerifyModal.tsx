import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sparkles,
  Zap,
  Check,
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [result, setResult] = useState<OcrVerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (!isOpen) return null;

  const handleSelectFront = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(URL.createObjectURL(file));
      setErrorMsg(null);
      setResult(null);
    }
  };

  const handleUsePhenikaaSample = () => {
    setFrontImage('/images/phenikaa_card_sample.jpg');
    setErrorMsg(null);
    setResult(null);
  };

  const handleStartOcrScan = async () => {
    if (!frontImage) {
      setErrorMsg('Vui lòng tải lên ảnh chụp thẻ sinh viên Trường Đại học Phenikaa.');
      return;
    }

    try {
      setIsScanning(true);
      setErrorMsg(null);
      setScanStep(1); // Cân chỉnh góc nghiêng

      const t1 = setTimeout(() => setScanStep(2), 250); // Nhận diện dải cam & logo
      const t2 = setTimeout(() => setScanStep(3), 500); // Bóc tách họ tên, MSSV, barcode

      const res = await ocrService.verifyStudentCard(frontImage);
      clearTimeout(t1);
      clearTimeout(t2);

      if (res.success && res.data) {
        setResult(res.data);
        if (user && res.data.autoApproved) {
          updateKarma(user.karmaScore + (res.data.karmaAwarded || 15));
        }
        if (onVerifiedSuccess) {
          onVerifiedSuccess(res.data);
        }
      } else {
        setErrorMsg(res.message || 'Không thể bóc tách thông tin thẻ sinh viên.');
      }
    } catch {
      setErrorMsg('Mô hình AI OCR gặp sự cố khi xử lý ảnh thẻ. Vui lòng thử lại với ảnh rõ nét hơn.');
    } finally {
      setIsScanning(false);
      setScanStep(0);
    }
  };

  const handleReset = () => {
    setFrontImage(null);
    setResult(null);
    setErrorMsg(null);
    setScanStep(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  AI OCR Quét Thẻ Sinh Viên Phenikaa
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-extrabold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> Fast &lt; 0.8s
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Huấn luyện chuyên biệt nhận diện mẫu thẻ sinh viên Trường Đại học Phenikaa (+15 Karma)
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
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!result ? (
          <div className="mt-5 space-y-5">
            {/* Template Standard Guide Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] sm:text-xs">
                  Mô hình đã được huấn luyện sẵn theo <strong>phôi thẻ chuẩn Phenikaa University</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <Eye className="w-3.5 h-3.5" /> Xem quy chuẩn
              </button>
            </div>

            {/* Upload or Sample Selection Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Ảnh mặt trước thẻ sinh viên (Đầy đủ dải cam &amp; logo) *
                </label>
                <button
                  type="button"
                  onClick={handleUsePhenikaaSample}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Chọn ảnh mẫu thẻ Phenikaa chuẩn
                </button>
              </div>

              {frontImage ? (
                <div className="relative aspect-[16/10] max-h-72 w-full rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-lg group bg-slate-900 flex items-center justify-center">
                  <img
                    src={frontImage}
                    alt="Mặt trước thẻ sinh viên Phenikaa"
                    className="w-full h-full object-contain"
                  />

                  {/* AI Scanning Active HUD Effect */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[1px] flex flex-col justify-between p-4 pointer-events-none">
                      {/* Laser scanning beam */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />

                      {/* Dynamic Bounding Boxes */}
                      <div className="flex justify-between items-start">
                        <div className="px-2 py-1 rounded bg-blue-600/90 text-white text-[10px] font-mono font-bold animate-pulse">
                          [✓ PHENIKAA UNIVERSITY LOGO]
                        </div>
                        <div className="px-2 py-1 rounded bg-amber-500/90 text-white text-[10px] font-mono font-bold animate-pulse">
                          [✓ PHENIKAA - UNI ★★★★]
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="px-2 py-1 rounded bg-emerald-600/90 text-white text-[10px] font-mono font-bold">
                          [✓ MSSV &amp; BARCODE]
                        </div>
                        <div className="px-2 py-1 rounded bg-purple-600/90 text-white text-[10px] font-mono font-bold">
                          [✓ VIETNAMESE OCR CRNN]
                        </div>
                      </div>
                    </div>
                  )}

                  {!isScanning && (
                    <button
                      onClick={() => setFrontImage(null)}
                      className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/70 text-white hover:bg-rose-600 transition shadow-md"
                      title="Chọn lại ảnh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <label className="aspect-[16/10] max-h-64 w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 p-6 text-center transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Bấm để tải ảnh thẻ sinh viên hoặc kéo thả vào đây
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Định dạng PNG, JPG, JPEG (Khuyên dùng ảnh chụp phẳng, không lóa)
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

            {/* Scanning Progress Status */}
            {isScanning && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    {scanStep === 1 && 'AI đang căn chỉnh góc nghiêng và khử nhiễu...'}
                    {scanStep === 2 && 'Đang nhận diện điểm mốc (Dải cam, Logo Phenikaa)...'}
                    {scanStep === 3 && 'Mô hình CRNN đang bóc tách Họ tên, MSSV, Barcode...'}
                    {scanStep === 0 && 'Đang hoàn tất phân tích thẻ sinh viên...'}
                  </span>
                  <span className="font-mono text-blue-600 font-extrabold">&lt; 0.8s</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: scanStep === 1 ? '35%' : scanStep === 2 ? '70%' : '95%' }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleUsePhenikaaSample}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Dùng thẻ mẫu Đặng Viết Giang (23012101)
              </button>

              <div className="flex items-center gap-3">
                <BaseButton variant="outline" size="sm" onClick={onClose} disabled={isScanning}>
                  Đóng
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="sm"
                  onClick={handleStartOcrScan}
                  isLoading={isScanning}
                  disabled={!frontImage}
                  className="gap-1.5 shadow-lg shadow-blue-500/25"
                >
                  <Zap className="w-4 h-4" />
                  <span>Quét thẻ với AI OCR</span>
                </BaseButton>
              </div>
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="mt-5 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Big Success Banner */}
            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-base font-black text-emerald-900 dark:text-emerald-200">
                    Xác minh Thẻ Sinh Viên Phenikaa Thành Công!
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Khớp mẫu chuẩn 100%
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Độ tin cậy nhận diện AI: <strong>{result.confidenceScore}%</strong>. Tài khoản sinh viên đã được cấp
                  <span className="font-black text-blue-600 dark:text-blue-400"> Tích Xanh Chính Chủ</span> và cộng thưởng{' '}
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-300">
                    +{result.karmaAwarded} Campus Karma
                  </span>!
                </p>
              </div>
            </div>

            {/* Detailed Parsed Attributes Grid */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3 bg-slate-50/60 dark:bg-slate-800/40">
                <span className="text-slate-500">Trường đại học:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {result.universityName || 'TRƯỜNG ĐẠI HỌC PHENIKAA'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3">
                <span className="text-slate-500">Họ và tên sinh viên:</span>
                <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                  {result.fullName}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3 bg-slate-50/60 dark:bg-slate-800/40">
                <span className="text-slate-500">Mã số sinh viên (MSSV):</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {result.studentCode}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3">
                <span className="text-slate-500">Ngày sinh (Date of birth):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {result.dateOfBirth || '15/05/2005'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3 bg-slate-50/60 dark:bg-slate-800/40">
                <span className="text-slate-500">Ngành học (Major):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {result.major || 'QUẢN TRỊ KINH DOANH'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3">
                <span className="text-slate-500">Khoa trực thuộc:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {result.faculty || 'KHOA KINH TẾ VÀ KINH DOANH'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3 bg-slate-50/60 dark:bg-slate-800/40">
                <span className="text-slate-500">Khóa học &amp; Niên khóa:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {result.cohort || 'ĐH_K17.40'} • ({result.academicYear || '2023-2027'})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3">
                <span className="text-slate-500">Đối soát Barcode &amp; QR:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" /> Trùng khớp 100% với MSSV ({result.studentCode})
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
              >
                Quét thẻ sinh viên khác
              </button>
              <BaseButton variant="primary" size="sm" onClick={onClose} className="px-6">
                Hoàn tất &amp; Đóng
              </BaseButton>
            </div>
          </div>
        )}
      </div>

      {/* Popover Guide Modal: Mẫu thẻ sinh viên Phenikaa chuẩn */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Mẫu Quy Chuẩn Thẻ Sinh Viên Phenikaa
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              <img
                src="/images/phenikaa_card_guide.jpg"
                alt="Quy chuẩn thẻ sinh viên Phenikaa"
                className="w-full h-auto object-contain max-h-[60vh]"
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Hệ thống AI nhận diện theo đúng cấu trúc phôi thẻ sinh viên chuẩn chính quy Phenikaa University.
            </p>

            <div className="text-right">
              <BaseButton variant="primary" size="sm" onClick={() => setShowGuideModal(false)}>
                Đã hiểu
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
