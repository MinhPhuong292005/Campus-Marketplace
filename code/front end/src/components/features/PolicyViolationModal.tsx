import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Zap,
  Info,
  ChevronDown,
  Check,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';

export interface ViolationAlertData {
  keyword?: string;
  message: string;
  isSuspended: boolean;
  remainingChances: number;
}

interface PolicyViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  violationData: ViolationAlertData | null;
  userName?: string;
  karmaScore?: number;
  onOpenSuspendedModal?: () => void;
}

export const PolicyViolationModal: React.FC<PolicyViolationModalProps> = ({
  isOpen,
  onClose,
  violationData,
  userName = 'Sinh viên',
  karmaScore = 0,
  onOpenSuspendedModal,
}) => {
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);

  if (!isOpen || !violationData) return null;

  const { keyword, message, isSuspended, remainingChances } = violationData;
  const strikeCount = Math.max(0, 3 - remainingChances);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200">
        {/* Header Alert - Styled like SuspendedAccountModal */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 dark:border-amber-500/40">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-sm">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                {isSuspended
                  ? 'Tài Khoản Đang Bị Tạm Khóa'
                  : 'Cảnh Báo Vi Phạm Quy Chế Đăng Bài'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                  isSuspended || remainingChances === 0
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : remainingChances === 1
                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 animate-pulse'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {isSuspended || remainingChances === 0
                  ? 'TẠM KHÓA 1 NGÀY'
                  : remainingChances === 1
                  ? 'CẢNH BÁO NGUY CẤP (1/3)'
                  : 'NHẮC NHỞ LẦN 1 (2/3)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {isSuspended
                ? 'Tài khoản của bạn đã bị tạm dừng quyền đăng bài do vi phạm đủ 3 lần quy định sàn.'
                : 'Hệ thống kiểm duyệt phát hiện bài đăng vi phạm quy chuẩn nội quy cộng đồng sinh viên Phenikaa.'}
            </p>
          </div>
        </div>

        {/* Violation Details Box */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              Chi tiết vi phạm & Chế tài áp dụng:
            </span>
            <span className="text-[10px] text-slate-500">
              Sinh viên: <strong className="text-slate-800 dark:text-slate-100">{userName}</strong>
            </span>
          </div>
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 leading-relaxed">
            {message}
          </p>
          {keyword && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
              <span className="font-medium">Từ khóa bị nghiêm cấm:</span>
              <code className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono font-bold border border-rose-500/30">
                "{keyword}"
              </code>
            </div>
          )}
        </div>

        {/* 3 Safe Chances Tracker Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              Tiến trình vi phạm & Lượt an toàn vi phạm:
            </span>
            <span
              className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                remainingChances === 3
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : remainingChances === 2
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : remainingChances === 1
                  ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40 animate-pulse'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40'
              }`}
            >
              {remainingChances}/3 lượt an toàn
              <span className="font-sans font-medium text-[10px] ml-1">
                {remainingChances === 3 && '(Tốt)'}
                {remainingChances === 2 && '(Nhắc 1 lần)'}
                {remainingChances === 1 && '(Nguy cấp)'}
                {remainingChances === 0 && '(Đã tạm khóa)'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* Vi phạm 1 */}
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                strikeCount >= 1
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-400'
              }`}
            >
              <div className="text-[11px] font-black uppercase tracking-wide">
                Lần 1
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                {strikeCount >= 1 ? '⚠️ Đã nhắc nhở' : '✅ An toàn'}
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                Nhắc nhở quy chế
              </div>
            </div>

            {/* Vi phạm 2 */}
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                strikeCount >= 2
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-800 dark:text-orange-200 shadow-sm animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-400'
              }`}
            >
              <div className="text-[11px] font-black uppercase tracking-wide">
                Lần 2
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                {strikeCount >= 2 ? '🚨 Nguy cấp' : 'Chưa vi phạm'}
              </div>
              <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                Cảnh báo gậy 2
              </div>
            </div>

            {/* Vi phạm 3 */}
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all ${
                strikeCount >= 3 || isSuspended
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-400'
              }`}
            >
              <div className="text-[11px] font-black uppercase tracking-wide">
                Lần 3
              </div>
              <div className="text-[10px] font-bold mt-0.5">
                {strikeCount >= 3 || isSuspended ? '⛔ Đã khóa 1 ngày' : 'Khóa 1 ngày'}
              </div>
              <div className={`text-[9px] mt-1 ${strikeCount >= 3 || isSuspended ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
                Chế tài tạm khóa
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Regulations (1 dòng điều khoản -> mở rộng 3 dòng quy chế) */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setShowPolicyDetails(!showPolicyDetails)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 hover:bg-amber-500/15 transition-all text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="group-hover:underline">
                Các điều khoản quy chế kiểm duyệt bài đăng (Bấm để {showPolicyDetails ? 'thu gọn' : 'xem chi tiết 3 quy chế'})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
              <span>{showPolicyDetails ? 'Thu gọn' : 'Xem chi tiết'}</span>
              <ChevronDown
                className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 shrink-0 ${
                  showPolicyDetails ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {showPolicyDetails && (
            <div className="flex flex-col gap-2 pt-1 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Dòng 1 */}
              <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-amber-500/20 space-y-1">
                <p className="font-bold text-[11px] flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Quy chế 1 - Chế tài 3 lần vi phạm:</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Nếu vi phạm đăng nội dung hoặc từ khóa cấm đủ <strong>3 lần</strong>, hệ thống sẽ <strong>tự động tạm khóa tài khoản trong 1 ngày (24 giờ)</strong> (Hiện tại bạn còn {remainingChances}/3 lượt an toàn).
                </p>
              </div>

              {/* Dòng 2 */}
              <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-amber-500/20 space-y-1">
                <p className="font-bold text-[11px] flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
                  <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Quy chế 2 - Kiểm duyệt & Duyệt nhanh tự động:</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Kiểm duyệt bài đăng chỉ áp dụng cho: tài khoản có điểm uy tín <strong>dưới 20 Karma</strong> (bạn đang có: {karmaScore} Karma) hoặc <strong>bài đăng đầu tiên</strong> của mỗi tài khoản. Các bài đăng còn lại sẽ được <strong>duyệt nhanh tự động</strong> xuất hiện công khai ngay nếu không có vi phạm.
                </p>
              </div>

              {/* Dòng 3 */}
              <div className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-amber-500/20 space-y-1">
                <p className="font-bold text-[11px] flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Quy chế 3 - Quy định chống Spam bài đăng:</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Nghiêm cấm gửi bài đăng liên tục trong thời gian ngắn (dưới 15 giây). Hệ thống sẽ cảnh báo ở lần đầu và <strong>tạm khóa đăng bài trong 1 tiếng (60 phút)</strong> nếu tiếp tục spam.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          {isSuspended ? (
            <>
              <BaseButton variant="secondary" size="sm" onClick={onClose}>
                Đóng
              </BaseButton>
              <BaseButton
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenSuspendedModal?.();
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 shadow-sm"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Xem thời gian khóa & Khiếu nại Admin</span>
              </BaseButton>
            </>
          ) : (
            <>
              <BaseButton variant="secondary" size="sm" onClick={onClose}>
                Đóng
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                onClick={onClose}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tôi đã hiểu & Sửa lại bài đăng</span>
              </BaseButton>
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
