import React, { useState } from 'react';
import { Gift, Info, Send, User, AlertCircle } from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';
import { Listing } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { giveawayService } from '../../services/giveawayService';
import { KarmaBadge } from './KarmaBadge';

interface GiveawayClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess?: () => void;
}

export const GiveawayClaimModal: React.FC<GiveawayClaimModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Vui lòng đăng nhập để gửi yêu cầu nhận đồ.');
      return;
    }
    if (message.trim().length < 10) {
      setErrorMsg('Vui lòng nhập lý do bạn cần món đồ này (tối thiểu 10 ký tự) để chủ đồ xem xét.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const listingImg =
        listing.images && listing.images.length > 0
          ? listing.images[0].mediaUrl
          : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80';

      await giveawayService.submitClaim({
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listingImg,
        ownerId: listing.userId,
        requester: user,
        message: message.trim(),
        phone: phone.trim(),
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Đăng ký xin nhận món đồ tặng (0đ)">
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Listing Summary Card */}
        <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 flex items-center gap-3.5">
          <img
            src={
              listing.images && listing.images.length > 0
                ? listing.images[0].mediaUrl
                : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
            }
            alt={listing.title}
            className="w-14 h-14 rounded-xl object-cover border border-pink-200 dark:border-pink-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
              <Gift className="w-3 h-3" /> Tặng Miễn Phí
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
              {listing.title}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              Chủ đồ: <strong>{listing.authorName}</strong> • {listing.universityName || 'ĐH Phenikaa'}
            </p>
          </div>
        </div>

        {/* Requester Info Preview */}
        {user && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" />
                Thông tin người nhận (Chủ đồ sẽ xem):
              </span>
              <KarmaBadge score={user.karmaScore || 20} showText={false} />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <img
                src={user.avatarUrl || '/default-avatar.png'}
                alt={user.fullName}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  MSSV: {user.studentCode || 'Chưa cập nhật'} • {user.major || 'ĐH Phenikaa'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Lời nhắn gửi chủ đồ & Lý do cần nhận đồ *</span>
            <span className="text-[10px] text-slate-400 font-normal">Chân thành & lịch sự</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="vd: Chào bạn, mình là tân sinh viên K18 rất cần món đồ này để phục vụ việc học/sinh hoạt. Nếu còn, bạn cho mình xin nhé! Mình xin cảm ơn bạn rất nhiều..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        {/* Phone Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Số điện thoại / Zalo để chủ đồ tiện liên hệ hẹn gặp:
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="vd: 0987654321"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            Sau khi bạn gửi, chủ đồ sẽ nhận được thông báo ngay lập tức. Sau khi trao đổi, nếu chủ đồ chốt tặng cho bạn, hệ thống sẽ gửi thông báo đến bạn để hẹn nhận đồ.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <BaseButton type="button" variant="secondary" size="sm" onClick={onClose}>
            Hủy bỏ
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            className="bg-pink-600 hover:bg-pink-700 text-white gap-1.5 font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi yêu cầu nhận đồ</span>
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
};
