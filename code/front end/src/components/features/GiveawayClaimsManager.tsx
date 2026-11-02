import React, { useState, useEffect } from 'react';
import { Gift, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BaseButton } from '../base/BaseButton';
import { giveawayService, GiveawayClaim } from '../../services/giveawayService';
import { KarmaBadge } from './KarmaBadge';

interface GiveawayClaimsManagerProps {
  listingId: number;
  listingTitle: string;
  isOwner: boolean;
  onListingUpdated?: () => void;
}

export const GiveawayClaimsManager: React.FC<GiveawayClaimsManagerProps> = ({
  listingId,
  listingTitle,
  isOwner,
  onListingUpdated,
}) => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<GiveawayClaim[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isClosed = giveawayService.isGiveawayClosed(listingId);

  const loadClaims = () => {
    setClaims(giveawayService.getClaimsByListing(listingId));
  };

  useEffect(() => {
    loadClaims();
    const handleUpdate = () => loadClaims();
    window.addEventListener('campus_giveaway_claims_updated', handleUpdate);
    return () => {
      window.removeEventListener('campus_giveaway_claims_updated', handleUpdate);
    };
  }, [listingId]);

  if (!isOwner && claims.length === 0) return null;

  // const acceptedClaim = claims.find((c) => c.status === 'ACCEPTED');

  const handleAcceptClaim = async (claim: GiveawayClaim) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn chốt tặng món đồ "${listingTitle}" cho bạn "${claim.requesterName}"?\n\nSau khi chốt:\n- Hệ thống sẽ gửi thông báo chúc mừng đến bạn ấy.\n- Hệ thống sẽ tự động thông báo đến tất cả các bạn khác rằng món đồ đã được trao tặng.\n- Bài đăng tặng đồ sẽ đóng lại và ngừng nhận thêm bất kỳ yêu cầu nào.`
    );
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await giveawayService.acceptClaim(claim.id, listingId);
      alert(`🎉 Đã chốt tặng thành công cho bạn ${claim.requesterName}! Hệ thống đã gửi thông báo đến tất cả người đăng ký.`);
      loadClaims();
      onListingUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Không thể chốt tặng lúc này. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 space-y-4 text-left animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-200/60 dark:border-pink-900/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Danh sách sinh viên xin nhận đồ
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-200/80 dark:bg-pink-900/50 text-pink-800 dark:text-pink-300 font-extrabold">
                {claims.length} yêu cầu
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {isClosed
                ? 'Món đồ đã được chốt tặng thành công và đã ngừng nhận thêm yêu cầu mới.'
                : 'Xem thông tin người nhận, nhắn tin trao đổi và chọn người phù hợp để chốt tặng.'}
            </p>
          </div>
        </div>

        {isClosed && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã chốt tặng thành công</span>
          </span>
        )}
      </div>

      {claims.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Chưa có bạn sinh viên nào gửi lời nhắn xin nhận món đồ này.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const isThisAccepted = claim.status === 'ACCEPTED';
            const isThisRejected = claim.status === 'REJECTED';

            return (
              <div
                key={claim.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isThisAccepted
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                    : isThisRejected
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-60'
                    : 'bg-white dark:bg-slate-900 border-pink-100 dark:border-pink-900/30 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        claim.requesterAvatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${claim.requesterName}`
                      }
                      alt={claim.requesterName}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {claim.requesterName}
                        </span>
                        <KarmaBadge score={claim.requesterKarma || 20} showText={false} />
                        {isThisAccepted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            ✓ Đã chốt tặng
                          </span>
                        )}
                        {isThisRejected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Đã đóng
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        MSSV: {claim.requesterStudentCode || 'Chưa cập nhật'} • Gửi lúc{' '}
                        {new Date(claim.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(claim.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Actions for owner */}
                  {isOwner && (
                    <div className="flex items-center gap-2 shrink-0">
                      <BaseButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          navigate('/chat', {
                            state: {
                              sellerId: claim.requesterId,
                              sellerName: claim.requesterName,
                              listingId: claim.listingId,
                              listingTitle: claim.listingTitle,
                            },
                          });
                        }}
                        className="text-xs font-bold gap-1 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                        <span>Nhắn tin</span>
                      </BaseButton>

                      {!isClosed && !isThisAccepted && (
                        <BaseButton
                          type="button"
                          size="sm"
                          variant="primary"
                          disabled={isProcessing}
                          onClick={() => handleAcceptClaim(claim)}
                          className="text-xs font-bold gap-1 py-1.5 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chốt tặng cho bạn này</span>
                        </BaseButton>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-500 text-[11px] block mb-0.5">Lời nhắn gửi:</span>
                  "{claim.message}"
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
