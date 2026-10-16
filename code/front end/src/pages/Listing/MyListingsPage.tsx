import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  CheckCircle,
  Clock,
  Archive,
  Trash2,
  Sparkles,
  ArrowLeftRight,
  Check,
  X,
  Star,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { ReviewModal } from '../../components/features/ReviewModal';
import { listingService } from '../../services/listingService';
import { swapService, SwapProposal } from '../../services/swapService';
import { Listing } from '../../types';
import { formatCurrency, formatTimeAgo } from '../../utils/formatters';

export const MyListingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'ARCHIVED' | 'SWAP_PROPOSALS'>('ALL');
  const [listings, setListings] = useState<Listing[]>([]);
  const [, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Review modal state
  const [reviewModalData, setReviewModalData] = useState<{
    isOpen: boolean;
    targetUserId: number;
    targetUserName: string;
    listingId?: number;
    listingTitle?: string;
    isGiveaway?: boolean;
  }>({
    isOpen: false,
    targetUserId: 102,
    targetUserName: 'Lê Thuỳ Linh',
  });

  // Swap proposals state
  const [swapProposals, setSwapProposals] = useState<SwapProposal[]>([]);

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'SWAP_PROPOSALS') {
        const res = await swapService.getMyProposals();
        if (res.data) setSwapProposals(res.data);
        return;
      }

      const res = await listingService.getMyListings(activeTab);
      if (res.success && res.data?.content) {
        setListings(res.data.content);
      } else {
        setListings([]);
      }
    } catch {
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      setActionLoadingId(id);
      await listingService.updateListingStatus(id, newStatus);
      setListings((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus as any } : item
        )
      );

      // If completing transaction, prompt review modal
      if (newStatus === 'COMPLETED') {
        const item = listings.find((l) => l.id === id);
        setReviewModalData({
          isOpen: true,
          targetUserId: 102,
          targetUserName: 'Bạn học giao dịch',
          listingId: id,
          listingTitle: item?.title,
          isGiveaway: item?.transactionType === 'GIVEAWAY',
        });
      }
    } catch {
      setListings((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus as any } : item
        )
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSwapAction = async (proposalId: number, newStatus: 'ACCEPTED' | 'REJECTED') => {
    try {
      await swapService.updateProposalStatus(proposalId, newStatus);
      setSwapProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: newStatus } : p))
      );
    } catch (e: any) {
      alert(e.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) return;
    try {
      setActionLoadingId(id);
      await listingService.deleteListing(id);
      setListings((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setListings((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING_APPROVAL', label: '⏳ Chờ duyệt' },
    { key: 'ACTIVE', label: 'Đang hiển thị' },
    { key: 'REJECTED', label: '❌ Bị từ chối' },
    { key: 'RESERVED', label: 'Đang hẹn gặp (Giữ chỗ)' },
    { key: 'COMPLETED', label: 'Đã hoàn tất' },
    { key: 'SWAP_PROPOSALS', label: 'Đề xuất đổi đồ (Swap)' },
    { key: 'ARCHIVED', label: 'Đã ẩn' },
  ];

  const filteredListings =
    activeTab === 'ALL'
      ? listings
      : listings.filter((l) => l.status === activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-600" />
            <span>Kho đồ Sinh viên (My Listings)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi vòng đời sản phẩm, phản hồi đề xuất đổi đồ (Swap) và hoàn tất giao dịch để nhận Karma.
          </p>
        </div>

        <a href="/create-listing">
          <BaseButton variant="primary" size="md" className="gap-2 shadow-lg shadow-blue-500/20">
            <PlusCircle className="w-4 h-4" />
            <span>Đăng món đồ mới</span>
          </BaseButton>
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* View: Swap Proposals Tab */}
      {activeTab === 'SWAP_PROPOSALS' ? (
        <div className="space-y-4">
          {swapProposals.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <ArrowLeftRight className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Chưa có đề xuất đổi đồ nào
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Khi các bạn sinh viên khác muốn đổi đồ với bạn, đề xuất sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            swapProposals.map((prop) => (
              <div
                key={prop.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center gap-1">
                      <ArrowLeftRight className="w-3.5 h-3.5" /> ĐỀ XUẤT ĐỔI ĐỒ #{prop.id}
                    </span>
                    <span className="text-xs text-slate-400">{formatTimeAgo(prop.createdAt)}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      prop.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : prop.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}
                  >
                    {prop.status === 'ACCEPTED'
                      ? 'Đã chấp thuận (Giữ chỗ)'
                      : prop.status === 'REJECTED'
                      ? 'Đã từ chối'
                      : 'Đang chờ bạn phản hồi'}
                  </span>
                </div>

                {/* Items Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Họ đề xuất món đồ:
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {prop.initiatorListingTitle}
                    </p>
                    <p className="text-xs text-blue-600 font-bold">
                      {formatCurrency(prop.initiatorListingPrice)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Người gửi: {prop.initiatorUserName} (Karma: {prop.initiatorKarma || 40})
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">
                      Để đổi lấy món đồ của bạn:
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {prop.targetListingTitle}
                    </p>
                    <p className="text-xs text-blue-600 font-bold">
                      {formatCurrency(prop.targetListingPrice)}
                    </p>
                  </div>
                </div>

                {/* Cash adjustment & Note */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/30 p-3 rounded-2xl">
                  <div>
                    <span className="text-slate-400">Phương án bù trừ tiền mặt:</span>
                    <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {prop.cashAdjustment > 0
                        ? `Người đổi bù thêm cho bạn: +${formatCurrency(prop.cashAdjustment)}`
                        : prop.cashAdjustment < 0
                        ? `Yêu cầu bạn bù: ${formatCurrency(Math.abs(prop.cashAdjustment))}`
                        : 'Đổi ngang (0đ không bù)'}
                    </p>
                    {prop.note && <p className="text-slate-500 mt-1 italic">"{prop.note}"</p>}
                  </div>

                  {prop.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <BaseButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleSwapAction(prop.id, 'ACCEPTED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Đồng ý đổi</span>
                      </BaseButton>
                      <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwapAction(prop.id, 'REJECTED')}
                        className="text-rose-600 text-xs gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </BaseButton>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Regular Listings View */
        filteredListings.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Chưa có bài đăng nào trong mục này
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Bạn có sách vở cũ hoặc đồ dùng không dùng tới? Hãy đăng lên để trao đổi cùng bạn học!
            </p>
            <a href="/create-listing">
              <BaseButton variant="outline" size="sm">Đăng tin ngay</BaseButton>
            </a>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredListings.map((item) => {
              const isGiveaway = item.transactionType === 'GIVEAWAY';
              const isActionLoading = actionLoadingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Product Info */}
                  <div className="flex items-start gap-4">
                    <Link
                      to={`/listings/${item.id}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800 group"
                    >
                      <img
                        src={
                          item.images?.[0]?.mediaUrl ||
                          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : item.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              : item.status === 'RESERVED'
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                              : item.status === 'COMPLETED'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {item.status === 'ACTIVE'
                            ? 'Đang hiển thị'
                            : item.status === 'PENDING_APPROVAL'
                            ? '⏳ Chờ Quản trị viên duyệt'
                            : item.status === 'REJECTED'
                            ? '❌ Bị từ chối duyệt'
                            : item.status === 'RESERVED'
                            ? 'Đang giữ chỗ / Hẹn gặp'
                            : item.status === 'COMPLETED'
                            ? 'Đã hoàn tất giao dịch'
                            : 'Đã ẩn'}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          {item.categoryName || 'Giáo trình'} • {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <Link
                        to={`/listings/${item.id}`}
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-blue-600 transition-colors block"
                      >
                        {item.title}
                      </Link>

                      {item.status === 'REJECTED' && item.riskReason && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-1.5 rounded-lg font-medium">
                          ⚠️ {item.riskReason}
                        </p>
                      )}

                      {item.status === 'PENDING_APPROVAL' && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                          Bài đăng đang chờ Ban Quản trị phê duyệt để đảm bảo an toàn giao dịch.
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        {isGiveaway ? (
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                            <Sparkles className="w-3.5 h-3.5" /> TẶNG 0đ (+10 Karma)
                          </span>
                        ) : (
                          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                    {item.status === 'ACTIVE' && (
                      <BaseButton
                        variant="outline"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() => handleStatusChange(item.id, 'RESERVED')}
                        className="text-amber-600 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs"
                        title="Có người hẹn xem đồ"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Giữ chỗ</span>
                      </BaseButton>
                    )}

                    {item.status === 'RESERVED' && (
                      <>
                        <BaseButton
                          variant="primary"
                          size="sm"
                          isLoading={isActionLoading}
                          onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1"
                          title="Đã giao dịch thành công"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đã giao đồ & Đánh giá</span>
                        </BaseButton>

                        <BaseButton
                          variant="outline"
                          size="sm"
                          isLoading={isActionLoading}
                          onClick={() => handleStatusChange(item.id, 'ACTIVE')}
                          className="text-xs"
                          title="Hủy hẹn gặp, mở lại bài đăng"
                        >
                          Mở lại
                        </BaseButton>
                      </>
                    )}

                    {item.status === 'COMPLETED' && (
                      <BaseButton
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReviewModalData({
                            isOpen: true,
                            targetUserId: 102,
                            targetUserName: 'Bạn học giao dịch',
                            listingId: item.id,
                            listingTitle: item.title,
                            isGiveaway,
                          })
                        }
                        className="text-amber-600 text-xs gap-1"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Đánh giá lại</span>
                      </BaseButton>
                    )}

                    {item.status === 'ACTIVE' && (
                      <BaseButton
                        variant="outline"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() => handleStatusChange(item.id, 'ARCHIVED')}
                        className="text-slate-500 text-xs"
                        title="Tạm ẩn bài đăng"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Ẩn tin</span>
                      </BaseButton>
                    )}

                    {item.status === 'ARCHIVED' && (
                      <BaseButton
                        variant="outline"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() => handleStatusChange(item.id, 'ACTIVE')}
                        className="text-blue-600 text-xs"
                      >
                        Hiện tin lại
                      </BaseButton>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalData.isOpen}
        onClose={() => setReviewModalData((prev) => ({ ...prev, isOpen: false }))}
        targetUserId={reviewModalData.targetUserId}
        targetUserName={reviewModalData.targetUserName}
        listingId={reviewModalData.listingId}
        listingTitle={reviewModalData.listingTitle}
        isGiveaway={reviewModalData.isGiveaway}
        onSuccess={(awarded) => {
          alert(`Đã hoàn tất đánh giá và cộng +${awarded} điểm Campus Karma!`);
        }}
      />
    </div>
  );
};
