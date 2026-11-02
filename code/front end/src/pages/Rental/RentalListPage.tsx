import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  ChevronRight,
  Camera,
  ShieldCheck,
  Package,
  CheckCircle,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { rentalService } from '../../services/rentalService';
import { RentalContract, RentalStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { KarmaBadge } from '../../components/features/KarmaBadge';

export const RentalListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'ALL' | RentalStatus>('ALL');
  const [rentals, setRentals] = useState<RentalContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const res = await rentalService.getMyRentals(activeTab);
      if (res.success && res.data) {
        setRentals(res.data.items || (res.data as any).content || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
    const handleUpdate = () => fetchRentals();
    window.addEventListener('campus_rentals_updated', handleUpdate);
    return () => window.removeEventListener('campus_rentals_updated', handleUpdate);
  }, [activeTab]);

  const handleApprove = async (contract: RentalContract) => {
    try {
      setIsProcessingId(contract.id);
      const res = await rentalService.approveContract(contract.id);
      if (res.success) {
        showToast(`🎉 Đã chấp thuận cho bạn ${contract.renterName} thuê "${contract.listingTitle}"! Hệ thống đã gửi thông báo đến bạn ấy.`);
        fetchRentals();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi duyệt hợp đồng thuê.');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleHandover = async (contract: RentalContract) => {
    try {
      setIsProcessingId(contract.id);
      const res = await rentalService.confirmHandover(contract.id);
      if (res.success) {
        showToast(`🤝 Đã xác nhận bàn giao đồ thành công! Giao dịch chuyển sang "Đang trong thời hạn thuê".`);
        fetchRentals();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác nhận bàn giao.');
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleReturn = async (contract: RentalContract) => {
    if (!window.confirm(`Xác nhận đã nhận lại thiết bị "${contract.listingTitle}" nguyên vẹn và hoàn trả tiền cọc cho bạn thuê? Cả 2 bạn sẽ được cộng +5 Karma!`)) {
      return;
    }
    try {
      setIsProcessingId(contract.id);
      const res = await rentalService.confirmReturnAndRefund(contract.id);
      if (res.success) {
        showToast(`✨ Hợp đồng hoàn tất và cọc đã được giải tỏa! Bạn nhận được +5 điểm tín nhiệm Karma.`);
        fetchRentals();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hoàn tất hợp đồng.');
    } finally {
      setIsProcessingId(null);
    }
  };

  const tabs: Array<{ key: 'ALL' | RentalStatus; label: string }> = [
    { key: 'ALL', label: 'Tất cả hợp đồng' },
    { key: 'PENDING', label: 'Chờ duyệt' },
    { key: 'APPROVED', label: 'Đang hẹn bàn giao' },
    { key: 'ACTIVE', label: 'Đang thuê' },
    { key: 'RETURNED', label: 'Đã hoàn tất & Hoàn cọc' },
    { key: 'DISPUTED', label: 'Khiếu nại cọc' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-900/30 font-semibold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Hợp Đồng Thuê & Bảo Vệ Tiền Cọc
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy trình thuê an toàn: Chụp ảnh hiện trạng 2-4 góc trước khi bàn giao để bảo vệ quyền lợi tiền cọc sinh viên.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Bảo Đảm Tiền Cọc Sinh Viên</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contract List */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p>Đang tải danh sách hợp đồng thuê...</p>
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Chưa có hợp đồng nào trong mục này
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Khi bạn hoặc bạn học thuê đồ (máy tính, lễ phục, thiết bị), hợp đồng và biên bản bàn giao ảnh sẽ xuất hiện tại đây.
          </p>
          <Link to="/?transactionType=RENT">
            <BaseButton variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Khám phá đồ cho thuê trên Chợ
            </BaseButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((contract) => {
            const isOwner = user?.id === contract.ownerId;
            const peerName = isOwner ? contract.renterName : contract.ownerName;
            const peerId = isOwner ? contract.renterId : contract.ownerId;
            const peerKarma = isOwner ? (contract.renterKarma || 50) : (contract.ownerKarma || 50);

            return (
              <div
                key={contract.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        contract.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : contract.status === 'APPROVED'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : contract.status === 'PENDING'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : contract.status === 'RETURNED'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {contract.status === 'ACTIVE'
                        ? '✓ Đang trong thời hạn thuê'
                        : contract.status === 'APPROVED'
                        ? '🤝 Đã duyệt - Đang hẹn bàn giao'
                        : contract.status === 'PENDING'
                        ? '⏳ Chờ người cho thuê duyệt'
                        : contract.status === 'RETURNED'
                        ? '✓ Đã hoàn tất & Hoàn cọc (+5 Karma)'
                        : '⚠️ Tranh chấp cọc (QTV xem xét)'}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      Hợp đồng #{contract.id}
                    </span>

                    <span className="text-[11px] text-slate-500 font-medium">
                      • {isOwner ? 'Bạn là Người cho thuê' : 'Bạn là Người thuê'}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Tạo lúc: {formatDate(contract.createdAt)}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{contract.listingTitle}</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        {isOwner ? 'Người gửi yêu cầu thuê:' : 'Chủ thiết bị:'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {peerName}
                        </span>
                        <KarmaBadge score={peerKarma} showText={false} />
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Tiền cọc bảo đảm:</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                        {contract.depositAmount > 0 ? formatCurrency(contract.depositAmount) : '0 ₫ (Theo thỏa thuận)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Tiền thuê:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(contract.totalRentAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Thời hạn thuê:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Terms display */}
                  {contract.rentalTerms && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                      <span className="font-bold mr-1">⚖️ Điều khoản thuê & Quy định cọc:</span>
                      <span>{contract.rentalTerms}</span>
                    </div>
                  )}

                  {/* Proof images indicator */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      Biên bản ảnh đối chiếu bàn giao:{' '}
                      <b className="text-slate-700 dark:text-slate-300">
                        {contract.proofImages?.length || 0}/4 ảnh
                      </b>
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Owner approval action */}
                    {contract.status === 'PENDING' && isOwner && (
                      <button
                        onClick={() => handleApprove(contract)}
                        disabled={isProcessingId === contract.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Xác nhận cho thuê</span>
                      </button>
                    )}

                    {/* Handover action */}
                    {contract.status === 'APPROVED' && (
                      <button
                        onClick={() => handleHandover(contract)}
                        disabled={isProcessingId === contract.id}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Package className="w-4 h-4" />
                        <span>Xác nhận đã bàn giao đồ</span>
                      </button>
                    )}

                    {/* Return & Refund action */}
                    {contract.status === 'ACTIVE' && isOwner && (
                      <button
                        onClick={() => handleReturn(contract)}
                        disabled={isProcessingId === contract.id}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Xác nhận nhận lại đồ & Hoàn cọc (+5 Karma)</span>
                      </button>
                    )}

                    {/* Chat with peer */}
                    {peerId && (
                      <button
                        onClick={() => navigate('/chat', { state: { peerUserId: peerId, peerName } })}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Nhắn tin với {peerName}</span>
                      </button>
                    )}
                  </div>

                  {/* Detail link */}
                  <Link to={`/rentals/${contract.id}`}>
                    <BaseButton variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs text-xs">
                      <span>Chi tiết hợp đồng</span>
                      <ChevronRight className="w-4 h-4" />
                    </BaseButton>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
