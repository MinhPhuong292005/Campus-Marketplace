import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  Paperclip,
} from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';
import { User } from '../../types';
import { reportService } from '../../services/reportService';
import { adminNotificationService } from '../../services/adminNotificationService';

interface SuspendedAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const SuspendedAccountModal: React.FC<SuspendedAccountModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  // Determine target time: use user.suspendedUntil if present, else 7 days from updatedAt/now
  const getTargetTimeMs = (): number => {
    if (!user) return Date.now();
    if (user.suspendedUntil) {
      const parsed = new Date(user.suspendedUntil).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) return parsed;
    }
    // Default fallback: 6 days 18 hours 35 minutes for demonstration (or 7 days from updatedAt)
    const baseTime = user.updatedAt ? new Date(user.updatedAt).getTime() : Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const computed = baseTime + oneWeekMs;
    // If computed time is already passed or too close, provide 6 days 18 hours window
    if (computed <= Date.now()) {
      return Date.now() + (6 * 24 * 3600 + 18 * 3600 + 25 * 60) * 1000;
    }
    return computed;
  };

  const [targetTimeMs, setTargetTimeMs] = useState<number>(getTargetTimeMs());

  useEffect(() => {
    if (isOpen) {
      setTargetTimeMs(getTargetTimeMs());
    }
  }, [isOpen, user]);

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const diff = targetTimeMs - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetTimeMs]);

  // Appeal state
  const [appealMessage, setAppealMessage] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealSent, setAppealSent] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEvidenceUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealMessage.trim()) return;

    try {
      setIsSubmittingAppeal(true);
      await reportService.createReport({
        reportedUserId: user?.id,
        reason: 'SCAM_OR_FRAUD',
        description: `[ĐƠN KHIẾU NẠI MỞ KHÓA TÀI KHOẢN] Từ sinh viên ${user?.fullName || ''} (${user?.email || ''}): ${appealMessage.trim()}`,
        evidenceUrl: evidenceUrl || undefined,
        severity: 'HIGH',
      });

      adminNotificationService.addNotification({
        type: 'APPEAL',
        title: `Đơn khiếu nại mở khóa từ ${user?.fullName || 'Sinh viên'}`,
        studentId: user?.id,
        studentName: user?.fullName || 'Sinh viên',
        studentEmail: user?.email || '',
        message: appealMessage.trim(),
        imageUrl: evidenceUrl || undefined,
      });

      setAppealSent(true);
      setAppealMessage('');
      setEvidenceUrl('');
      setTimeout(() => {
        setAppealSent(false);
      }, 6000);
    } catch {
      adminNotificationService.addNotification({
        type: 'APPEAL',
        title: `Đơn khiếu nại mở khóa từ ${user?.fullName || 'Sinh viên'}`,
        studentId: user?.id,
        studentName: user?.fullName || 'Sinh viên',
        studentEmail: user?.email || '',
        message: appealMessage.trim(),
        imageUrl: evidenceUrl || undefined,
      });
      setAppealSent(true);
      setAppealMessage('');
      setEvidenceUrl('');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200">
        {/* Header Alert */}
        <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 dark:border-amber-500/40">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-sm">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Tài Khoản Đang Bị Tạm Khóa
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                TẠM KHÓA 1 TUẦN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Bạn tạm thời không thể đăng bài mới, trao đổi mua bán hoặc gửi tin nhắn trong thời gian tài khoản bị áp dụng chế tài.
            </p>
          </div>
        </div>

        {/* Violation Reason Box */}
        <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Lý do tạm khóa từ Ban Quản Trị:
            </span>
            <span className="text-[10px] text-slate-400">
              Chủ tài khoản: <strong className="text-slate-800 dark:text-slate-100">{user?.fullName || 'Sinh viên'}</strong>
            </span>
          </div>
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            {user?.blockReason || 'Tạm khóa 1 tuần do bị báo cáo vi phạm quy định sàn liên tục trong 24h.'}
          </p>
        </div>

        {/* Live Countdown Clock */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs">
              <Clock className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
              Thời gian còn lại cho đến khi được mở khóa tự động:
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Đếm ngược thời gian thực
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {/* Days */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-500/20 dark:to-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-2.5 sm:p-3 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-amber-800/80 dark:text-amber-300/80 tracking-wider uppercase mt-0.5">
                Ngày
              </div>
            </div>

            {/* Hours */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-500/20 dark:to-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-2.5 sm:p-3 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-amber-800/80 dark:text-amber-300/80 tracking-wider uppercase mt-0.5">
                Giờ
              </div>
            </div>

            {/* Minutes */}
            <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-500/20 dark:to-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-2.5 sm:p-3 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-amber-800/80 dark:text-amber-300/80 tracking-wider uppercase mt-0.5">
                Phút
              </div>
            </div>

            {/* Seconds */}
            <div className="bg-gradient-to-b from-rose-50 to-rose-100/50 dark:from-rose-500/20 dark:to-slate-900 border border-rose-300 dark:border-rose-500/40 rounded-2xl p-2.5 sm:p-3 text-center shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight font-mono">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-rose-800/80 dark:text-rose-300/80 tracking-wider uppercase mt-0.5">
                Giây
              </div>
            </div>
          </div>
        </div>

        {/* Section: Liên hệ với Admin & Gửi Khiếu Nại */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-500" />
              <span>Mục liên hệ với Quản Trị Viên (Admin) để khiếu nại</span>
            </h4>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              Hỗ trợ 24/7
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Nếu bạn cho rằng việc tạm khóa tài khoản là sự nhầm lẫn, vui lòng liên hệ ngay với Ban Quản Trị qua các kênh hỗ trợ chính thức dưới đây hoặc gửi thư giải trình:
          </p>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Email Ban Quản Trị:</p>
                <a
                  href="mailto:admin@campus.edu.vn"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline truncate block"
                >
                  admin@campus.edu.vn
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Hotline Hỗ Trợ KTX:</p>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  024 6291 8118 (Phòng CTSV)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Appeal Form */}
          <form onSubmit={handleSendAppeal} className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Gửi lời giải trình & yêu cầu mở khóa tới Admin:</span>
              </label>
              {appealSent && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã gửi khiếu nại kèm ảnh tới BQT thành công!
                </span>
              )}
            </div>

            <textarea
              rows={2}
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              placeholder="Nhập nội dung giải trình về bài đăng hoặc giao dịch (ví dụ: đã giải quyết xong với người mua, bằng chứng chuyển tiền...)"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
            />

            {/* Attached Image Section */}
            <div className="space-y-2 bg-slate-100/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                  Đính kèm hình ảnh bằng chứng / biên lai đối chứng:
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <label className="cursor-pointer px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 font-semibold flex items-center gap-1 transition">
                    <Upload className="w-3 h-3" />
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 font-semibold transition"
                  >
                    Dán URL ảnh
                  </button>
                </div>
              </div>

              {/* URL Input */}
              {showUrlInput && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/anh-bien-lai.jpg"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <BaseButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (urlInput.trim()) {
                        setEvidenceUrl(urlInput.trim());
                        setUrlInput('');
                        setShowUrlInput(false);
                      }
                    }}
                  >
                    Lưu
                  </BaseButton>
                </div>
              )}

              {/* Quick Preset Evidence Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-medium">Gợi ý ảnh mẫu:</span>
                <button
                  type="button"
                  onClick={() => setEvidenceUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition"
                >
                  🧾 Bill chuyển khoản Vietcombank
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceUrl('https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&q=80')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition"
                >
                  💬 Ảnh tin nhắn đối chất
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceUrl('https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=900&q=80')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition"
                >
                  📦 Ảnh sản phẩm thực tế
                </button>
              </div>

              {/* Attached Preview */}
              {evidenceUrl && (
                <div className="pt-2 flex items-center gap-3">
                  <div className="relative group rounded-xl overflow-hidden border border-indigo-500/40 bg-slate-950 h-20 w-32 shadow-sm shrink-0">
                    <img
                      src={evidenceUrl}
                      alt="Ảnh bằng chứng"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEvidenceUrl('')}
                      className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full text-xs shadow-md"
                      title="Gỡ ảnh"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã đính kèm 1 ảnh bằng chứng
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Hình ảnh này sẽ được gửi kèm đơn để Ban Quản Trị xem xét mở khóa.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-0.5">
              <BaseButton
                type="submit"
                size="sm"
                variant="primary"
                disabled={isSubmittingAppeal || !appealMessage.trim()}
                className="gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingAppeal ? 'Đang gửi...' : 'Gửi đơn khiếu nại tới Admin'}</span>
              </BaseButton>
            </div>
          </form>
        </div>

        {/* Footer Close Button */}
        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <BaseButton variant="secondary" size="sm" onClick={onClose}>
            Đã hiểu & Đóng cửa sổ
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
};
