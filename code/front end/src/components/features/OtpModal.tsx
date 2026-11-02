import React, { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerify,
  onResendOtp,
}) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 10-second cooldown timer (rút ngắn xuống 10 giây)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isOpen) {
      setCountdown(10);
      setCanResend(false);
      setOtp('');
      setErrorMsg(null);

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen]);

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await onResendOtp();
      setCanResend(false);
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg('Không thể gửi lại mã lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await onVerify(otp);
    } catch (err: unknown) {
      setErrorMsg('Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác thực Email Sinh viên"
      description="Nhập mã OTP gồm 6 chữ số vừa được gửi đến email trường của bạn."
      maxWidth="md"
    >
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-300">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="text-xs truncate">
            <p className="font-semibold text-slate-900 dark:text-white">Email nhận mã</p>
            <p className="truncate text-slate-500 dark:text-slate-400">{email}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
            MÃ XÁC MINH 6 CHỮ SỐ
          </label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full text-center text-3xl font-mono tracking-[0.5em] py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-900 dark:text-white transition-all"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Hiệu lực 5 phút</span>
          </div>

          <button
            type="button"
            disabled={!canResend || isLoading}
            onClick={handleResend}
            className={`flex items-center gap-1.5 font-medium transition-colors ${
              canResend
                ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {canResend ? 'Gửi lại mã OTP' : `Gửi lại sau ${countdown}s`}
          </button>
        </div>

        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => {
              setOtp('123456');
              setErrorMsg(null);
            }}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/50"
          >
            ⚡ Điền mã OTP thử nghiệm nhanh: 123456
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Tài khoản kích hoạt thành công sẽ được tặng ngay <strong>+20 điểm Campus Karma</strong>!</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <BaseButton type="button" variant="outline" className="w-1/3" onClick={onClose}>
            Hủy
          </BaseButton>
          <BaseButton type="submit" variant="primary" className="w-2/3" isLoading={isLoading}>
            Xác nhận & Hoàn tất
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
};
