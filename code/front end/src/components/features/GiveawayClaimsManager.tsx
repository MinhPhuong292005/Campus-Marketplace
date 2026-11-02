import React, { useState, useEffect } from 'react';
import {
  Gift,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  MapPin,
  AlertTriangle,
  PackageCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BaseButton } from '../base/BaseButton';
import { giveawayService, GiveawayClaim } from '../../services/giveawayService';
import { KarmaBadge } from './KarmaBadge';
import { GiveawayWheelModal } from './GiveawayWheelModal';
import { PHENIKAA_SAFE_MEETING_POINTS } from '../../constants/phenikaaData';
import { useAuthStore } from '../../store/useAuthStore';

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
  const { user } = useAuthStore();
  const [claims, setClaims] = useState<GiveawayClaim[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);

  // Appointment states
  const [appointmentTime, setAppointmentTime] = useState('14:30 chiều nay');
  const [appointmentPoint, setAppointmentPoint] = useState(
    PHENIKAA_SAFE_MEETING_POINTS[0].name + ' (' + PHENIKAA_SAFE_MEETING_POINTS[0].address + ')'
  );
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);

  const loadClaims = async () => {
    try {
      const data = await giveawayService.getClaimsByListing(listingId);
      setClaims(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadClaims();
  }, [listingId]);

  const acceptedClaim = claims.find((c) => c.status === 'ACCEPTED' || c.status === 'COMPLETED');
  const isClosed = Boolean(acceptedClaim);
  const isCompleted = acceptedClaim?.status === 'COMPLETED';

  // Check if current user is either giver or receiver in accepted transaction
  const isGiver = user && user.id === acceptedClaim?.ownerId;
  const isReceiver = user && user.id === acceptedClaim?.requesterId;
  const isParticipantInTransaction = isGiver || isReceiver;

  if (!isOwner && claims.length === 0 && !isParticipantInTransaction) return null;

  const handleAcceptClaim = async (claim: GiveawayClaim) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn chốt tặng món đồ "${listingTitle}" cho bạn "${claim.requesterName}"?\n\nSau khi chốt:\n- Hệ thống sẽ gửi thông báo chúc mừng đến bạn ấy.\n- Hệ thống sẽ tự động thông báo đến tất cả các bạn khác rằng món đồ đã được trao tặng.\n- Bạn và người nhận sẽ tiến hành hẹn giờ và điểm gặp mặt để bàn giao đồ.`
    );
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await giveawayService.acceptClaim(listingId, claim.id);
      setIsWheelModalOpen(false);
      alert(`🎉 Đã chốt tặng thành công cho bạn ${claim.requesterName}! Hệ thống đã gửi thông báo đến các bạn học.`);
      await loadClaims();
      onListingUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Không thể chốt tặng lúc này. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAppointment = async () => {
    if (!acceptedClaim) return;
    try {
      setIsProcessing(true);
      await giveawayService.updateAppointment(acceptedClaim.id, {
        meetingTime: appointmentTime,
        meetingPoint: appointmentPoint,
      });
      alert('Đã cập nhật lịch hẹn gặp bàn giao đồ tại Phenikaa!');
      setIsEditingAppointment(false);
      await loadClaims();
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật lịch hẹn.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!acceptedClaim) return;
    const confirmMsg = isGiver
      ? 'Bạn xác nhận đã bàn giao món đồ tặng cho bạn học?'
      : 'Bạn xác nhận đã gặp mặt và nhận được món đồ tặng từ chủ sở hữu?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsProcessing(true);
      const res = await giveawayService.confirmHandover(acceptedClaim.id);
      if (res.data?.status === 'COMPLETED') {
        alert('🎉 Giao dịch tặng đồ hoàn tất thành công! Cả hai bạn đều được cộng +5 điểm Campus Karma!');
      } else {
        alert('Đã ghi nhận xác nhận của bạn. Vui lòng chờ đối phương xác nhận để hoàn tất giao dịch!');
      }
      await loadClaims();
      onListingUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Không thể xác nhận lúc này.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!acceptedClaim) return;
    const reason = window.prompt(
      'Vui lòng nhập lý do hủy giao dịch tặng đồ (Lưu ý: Hủy giao dịch hoặc không đến điểm hẹn sẽ bị trừ 10 điểm Karma):'
    );
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do cụ thể!');
      return;
    }

    try {
      setIsProcessing(true);
      await giveawayService.cancelTransaction(acceptedClaim.id, reason);
      alert('Đã hủy giao dịch tặng đồ. Tài khoản báo hủy bị trừ 10 điểm Karma.');
      await loadClaims();
      onListingUpdated?.();
    } catch (err: any) {
      alert(err.message || 'Không thể hủy giao dịch.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 space-y-4 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pink-200/60 dark:border-pink-900/40 pb-3">
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
                ? 'Món đồ đã được chốt tặng cho một bạn sinh viên. Hai bên tiến hành hẹn giờ và bàn giao đồ.'
                : 'Xem lý do xin đồ của từng bạn, hoặc dùng Vòng quay may mắn để chọn ngẫu nhiên công bằng.'}
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Nút Vòng quay Random */}
          {isOwner && !isClosed && claims.length > 0 && (
            <button
              type="button"
              onClick={() => setIsWheelModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Vòng quay Random</span>
            </button>
          )}

          {isClosed && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Giao dịch hoàn tất (+5 Karma)' : 'Đã chốt tặng - Đang bàn giao'}</span>
            </span>
          )}
        </div>
      </div>

      {/* ========================================================== */}
      {/* TIẾN TRÌNH GIAO NHẬN ĐỒ TẶNG (KHI ĐÃ CHỐT TẶNG CHO 1 BẠN)   */}
      {/* ========================================================== */}
      {acceptedClaim && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-2.5">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase">
                Tiến trình hẹn gặp & Bàn giao đồ tặng
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Mỗi bên nhận <strong className="text-emerald-600">+5 Karma</strong> khi hoàn tất
            </span>
          </div>

          {/* Người nhận được chọn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center gap-3">
              <img
                src={
                  acceptedClaim.requesterAvatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${acceptedClaim.requesterName}`
                }
                alt={acceptedClaim.requesterName}
                className="w-11 h-11 rounded-xl object-cover border border-emerald-300 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {acceptedClaim.requesterName} (Người nhận)
                  </span>
                  <KarmaBadge score={acceptedClaim.requesterKarma || 20} showText={false} />
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                    Được chọn trao tặng ✓
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  MSSV: {acceptedClaim.requesterStudentCode || 'N/A'} • SĐT: {acceptedClaim.requesterPhone || 'Chưa cập nhật'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BaseButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const targetId = isGiver ? acceptedClaim.requesterId : acceptedClaim.ownerId;
                  const targetName = isGiver ? acceptedClaim.requesterName : acceptedClaim.ownerName;
                  navigate('/chat', {
                    state: {
                      sellerId: targetId,
                      sellerName: targetName,
                      listingId: acceptedClaim.listingId,
                      listingTitle: acceptedClaim.listingTitle,
                    },
                  });
                }}
                className="text-xs font-bold gap-1 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Nhắn tin trao đổi</span>
              </BaseButton>
            </div>
          </div>

          {/* Hẹn thời gian & Địa điểm an toàn tại Phenikaa */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Điểm hẹn & Thời gian bàn giao tại trường Phenikaa:
              </span>
              {isParticipantInTransaction && !isCompleted && !isEditingAppointment && (
                <button
                  type="button"
                  onClick={() => setIsEditingAppointment(true)}
                  className="text-blue-600 hover:underline text-[11px] cursor-pointer"
                >
                  Thay đổi lịch hẹn
                </button>
              )}
            </div>

            {isEditingAppointment ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Thời gian hẹn gặp:
                  </label>
                  <input
                    type="text"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    placeholder="vd: 14h30 chiều nay, 9h sáng mai..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Điểm hẹn an toàn trong trường:
                  </label>
                  <select
                    value={appointmentPoint}
                    onChange={(e) => setAppointmentPoint(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                  >
                    {PHENIKAA_SAFE_MEETING_POINTS.map((pt) => (
                      <option key={pt.id} value={`${pt.name} (${pt.address})`}>
                        {pt.name} - {pt.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingAppointment(false)}
                    className="px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleSaveAppointment}
                    className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Lưu lịch hẹn
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <p>
                  <strong>• Thời gian:</strong> {acceptedClaim.meetingTime || appointmentTime}
                </p>
                <p>
                  <strong>• Điểm hẹn:</strong> {acceptedClaim.meetingPoint || appointmentPoint}
                </p>
                <p className="text-slate-400 text-[10px] italic">
                  * Điểm hẹn an toàn có camera an ninh và bảo vệ trực 24/7 để bảo vệ an toàn sinh viên.
                </p>
              </div>
            )}
          </div>

          {/* Các nút bấm xác nhận hoàn tất & Trạng thái 2 bên */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Bên tặng */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  acceptedClaim.giverConfirmed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>Người tặng:</span>
                <span>{acceptedClaim.giverConfirmed ? '✓ Đã xác nhận giao' : 'Chưa ấn xác nhận'}</span>
              </div>

              {/* Bên nhận */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                  acceptedClaim.receiverConfirmed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span>Người nhận:</span>
                <span>{acceptedClaim.receiverConfirmed ? '✓ Đã xác nhận nhận' : 'Chưa ấn xác nhận'}</span>
              </div>
            </div>

            {/* Nút hành động */}
            {isParticipantInTransaction && !isCompleted && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancelTransaction}
                  className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Hủy hẹn / Không đến (-10 Karma)</span>
                </button>

                <button
                  type="button"
                  disabled={Boolean(isProcessing || (isGiver && acceptedClaim.giverConfirmed) || (isReceiver && acceptedClaim.receiverConfirmed))}
                  onClick={handleConfirmHandover}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition ${
                    (isGiver && acceptedClaim.giverConfirmed) || (isReceiver && acceptedClaim.receiverConfirmed)
                      ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed opacity-80'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-95 cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {(isGiver && acceptedClaim.giverConfirmed) || (isReceiver && acceptedClaim.receiverConfirmed)
                      ? 'Bạn đã xác nhận xong (chờ đối phương)'
                      : isGiver
                      ? 'Xác nhận đã bàn giao đồ tặng (+5 Karma)'
                      : 'Xác nhận đã nhận đồ tặng (+5 Karma)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* DANH SÁCH TẤT CẢ NGƯỜI XIN NHẬN ĐỒ                         */}
      {/* ========================================================== */}
      {claims.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Chưa có bạn sinh viên nào gửi lời nhắn xin nhận món đồ này.
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const isThisAccepted = claim.status === 'ACCEPTED' || claim.status === 'COMPLETED';
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
                            Không được chọn
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
                          className="text-xs font-bold gap-1 py-1.5 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chốt tặng cho bạn này</span>
                        </BaseButton>
                      )}
                    </div>
                  )}
                </div>

                {/* Message / Reason Content */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-500 text-[11px] block mb-0.5">
                    Lý do xin nhận đồ:
                  </span>
                  "{claim.message}"
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vòng quay may mắn Modal */}
      <GiveawayWheelModal
        isOpen={isWheelModalOpen}
        onClose={() => setIsWheelModalOpen(false)}
        claims={claims}
        listingTitle={listingTitle}
        onSelectWinner={handleAcceptClaim}
        isProcessing={isProcessing}
      />
    </div>
  );
};
