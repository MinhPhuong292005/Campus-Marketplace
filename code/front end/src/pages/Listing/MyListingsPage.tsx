import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  CheckCircle,
  Clock,
  Archive,
  Trash2,
  Gift,
  RotateCcw,
  ArrowLeftRight,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { BaseModal } from '../../components/base/BaseModal';
import { ReviewModal } from '../../components/features/ReviewModal';
import { listingService } from '../../services/listingService';
import { swapService, SwapProposal } from '../../services/swapService';
import { studentNotificationService } from '../../services/studentNotificationService';
import { orderService } from '../../services/orderService';
import { useAuthStore } from '../../store/useAuthStore';
import { Listing } from '../../types';
import { formatCurrency, formatTimeAgo } from '../../utils/formatters';

export const MyListingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'RESERVED' | 'COMPLETED' | 'ARCHIVED' | 'SWAP_PROPOSALS'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SELL' | 'GIVEAWAY' | 'SWAP' | 'RENT'>('ALL');
  const [listings, setListings] = useState<Listing[]>([]);
  const [, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal xác nhận bán & giao hàng cho người mua
  const [confirmSaleModal, setConfirmSaleModal] = useState<{
    isOpen: boolean;
    listing: Listing | null;
    buyerName: string;
    meetingPoint: string;
  }>({
    isOpen: false,
    listing: null,
    buyerName: 'Bạn học / Người mua',
    meetingPoint: 'Sảnh Tòa A2 hoặc KTX Phenikaa',
  });

  // Modal xác nhận xóa bài đăng (thay thế window.confirm localhost)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    listing: Listing | null;
  }>({
    isOpen: false,
    listing: null,
  });

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

      const res = await listingService.getMyListings();
      if (res.success && (res.data?.content || res.data?.items)) {
        const rawItems = res.data.content || res.data.items || [];
        // Tự động khôi phục đồ cho thuê (RENT) về trạng thái ACTIVE nếu trước đó bị chuyển COMPLETED
        const normalized = rawItems.map((item: Listing) => {
          if (item.transactionType === 'RENT' && item.status === 'COMPLETED') {
            listingService.updateListingStatus(item.id, 'ACTIVE').catch(() => {});
            return { ...item, status: 'ACTIVE' as const };
          }
          return item;
        });
        setListings(normalized);
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

      // If completing transaction, synchronize with orderService and show toast
      if (newStatus === 'COMPLETED') {
        const existingOrder = orderService.getOrderByListingId(id);
        if (existingOrder) {
          orderService.updateOrderStatus(existingOrder.id, 'COMPLETED');
        }
        setToastMessage('Đã trao đồ đến tay người mua thành công! Đơn hàng đã chuyển sang ĐÃ HOÀN TẤT.');
        setTimeout(() => setToastMessage(null), 3500);
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
      setToastMessage(newStatus === 'ACCEPTED' ? 'Đã chấp thuận đề xuất đổi đồ!' : 'Đã từ chối đề xuất đổi đồ.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      setToastMessage(e.message || 'Lỗi khi cập nhật trạng thái');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleOpenDeleteConfirm = (item: Listing) => {
    setDeleteConfirmModal({
      isOpen: true,
      listing: item,
    });
  };

  const handleConfirmDelete = async () => {
    const item = deleteConfirmModal.listing;
    if (!item) return;
    try {
      setActionLoadingId(item.id);
      await listingService.deleteListing(item.id);
      setListings((prev) => prev.filter((l) => l.id !== item.id));
      setDeleteConfirmModal({ isOpen: false, listing: null });
      setToastMessage(`Đã xóa bài đăng "${item.title}" thành công!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setListings((prev) => prev.filter((l) => l.id !== item.id));
      setDeleteConfirmModal({ isOpen: false, listing: null });
      setToastMessage(`Đã xóa bài đăng "${item.title}" thành công!`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING_APPROVAL', label: '⏳ Chờ duyệt' },
    { key: 'ACTIVE', label: 'Đang hiển thị / Cho thuê' },
    { key: 'REJECTED', label: '❌ Bị từ chối' },
    { key: 'RESERVED', label: 'Đang hẹn gặp / Đang thuê' },
    { key: 'COMPLETED', label: 'Đã hoàn tất (Đã bán/Đã tặng)' },
    { key: 'SWAP_PROPOSALS', label: 'Đề xuất đổi đồ (Swap)' },
    { key: 'ARCHIVED', label: 'Đã ẩn' },
  ];

  const filteredListings = listings.filter((l) => {
    if (activeTab !== 'ALL') {
      if (l.transactionType === 'RENT') {
        if (activeTab === 'ACTIVE') {
          if (l.status !== 'ACTIVE' && l.status !== 'COMPLETED') return false;
        } else if (activeTab === 'COMPLETED') {
          // Sản phẩm cho thuê không phải là sản phẩm bán, không mất đi vào mục Đã hoàn tất bán
          return false;
        } else if (l.status !== activeTab) {
          return false;
        }
      } else if (l.status !== activeTab) {
        return false;
      }
    }
    if (typeFilter !== 'ALL' && l.transactionType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-600" />
            <span>Kho Đồ Sinh Viên (Giao Dịch Của Tôi)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp và quản lý những gì bạn đăng bán, cho tặng, trao đổi và cho thuê. Theo dõi việc giao đồ tới tay người mua.
          </p>
        </div>

        <a href="/create-listing">
          <BaseButton variant="primary" size="md" className="gap-2 shadow-lg shadow-blue-500/20">
            <PlusCircle className="w-4 h-4" />
            <span>Đăng món đồ mới</span>
          </BaseButton>
        </a>
      </div>

      {/* Category/Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
        {[
          { key: 'ALL', label: `Tất cả hình thức (${listings.length})` },
          { key: 'SELL', label: `Đang bán (${listings.filter((l) => l.transactionType === 'SELL').length})` },
          { key: 'GIVEAWAY', label: `Cho / Tặng 0đ (${listings.filter((l) => l.transactionType === 'GIVEAWAY').length})` },
          { key: 'SWAP', label: `Trao đổi (${listings.filter((l) => l.transactionType === 'SWAP').length})` },
          { key: 'RENT', label: `Cho thuê (${listings.filter((l) => l.transactionType === 'RENT').length})` },
        ].map((t) => {
          const isSelected = typeFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          );
        })}
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
                            item.transactionType === 'RENT'
                              ? item.status === 'RESERVED'
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                : item.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : item.status === 'REJECTED'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                : item.status === 'ARCHIVED'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : item.status === 'ACTIVE'
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
                          {item.transactionType === 'RENT'
                            ? item.status === 'RESERVED'
                              ? 'Đang cho thuê'
                              : item.status === 'PENDING_APPROVAL'
                              ? 'Chờ BQT duyệt'
                              : item.status === 'REJECTED'
                              ? 'Bị từ chối'
                              : item.status === 'ARCHIVED'
                              ? 'Tạm ngưng cho thuê'
                              : 'Sẵn sàng cho thuê'
                            : item.status === 'ACTIVE'
                            ? 'Đang hiển thị'
                            : item.status === 'PENDING_APPROVAL'
                            ? 'Chờ BQT duyệt'
                            : item.status === 'REJECTED'
                            ? 'Bị từ chối'
                            : item.status === 'RESERVED'
                            ? 'Đang hẹn gặp'
                            : item.status === 'COMPLETED'
                            ? 'Đã hoàn tất'
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

                      {item.status === 'REJECTED' && (
                        <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2 rounded-xl font-medium">
                          <p className="font-bold text-rose-800 dark:text-rose-400">❌ Lý do từ chối kiểm duyệt:</p>
                          <p className="mt-0.5">{item.moderationReason || item.riskReason || 'Ảnh chụp hoặc nội dung vi phạm tiêu chuẩn Chợ Sinh viên Phenikaa'}</p>
                        </div>
                      )}

                      {item.status === 'PENDING_APPROVAL' && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                          Bài đăng đang chờ Ban Quản trị phê duyệt để đảm bảo an toàn giao dịch.
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        {isGiveaway ? (
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                            <Gift className="w-3.5 h-3.5" /> TẶNG 0đ (+10 Karma)
                          </span>
                        ) : item.transactionType === 'RENT' ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                              {formatCurrency(item.price)} <span className="text-xs font-semibold text-slate-500">/ ngày</span>
                            </span>
                            {item.depositAmount ? (
                              <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-900/40 px-2 py-0.5 rounded-md font-medium">
                                Cọc: {formatCurrency(item.depositAmount)}
                              </span>
                            ) : null}
                          </div>
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
                    <Link to={`/listings/${item.id}`}>
                      <BaseButton variant="outline" size="sm" className="text-xs">
                        {item.transactionType === 'RENT' ? 'Xem bài cho thuê' : 'Xem lại bài đăng'}
                      </BaseButton>
                    </Link>

                    {/* DÀNH CHO ĐỒ CHO THUÊ (RENT): KHÔNG PHẢI BÁN, VẪN LUÔN THUỘC VỀ CHỦ SỞ HỮU */}
                    {item.transactionType === 'RENT' ? (
                      <>
                        <Link to="/rentals">
                          <BaseButton
                            variant="outline"
                            size="sm"
                            className="text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs gap-1 font-semibold"
                            title="Xem hợp đồng và lịch trình thuê món đồ này"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Hợp đồng thuê</span>
                          </BaseButton>
                        </Link>

                        {(item.status === 'COMPLETED' || item.status === 'ARCHIVED') && (
                          <BaseButton
                            variant="primary"
                            size="sm"
                            isLoading={isActionLoading}
                            onClick={() => handleStatusChange(item.id, 'ACTIVE')}
                            className="bg-purple-600 hover:bg-purple-700 text-xs gap-1 text-white font-semibold"
                            title="Tiếp tục mở cho thuê lượt tiếp theo"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Mở cho thuê tiếp</span>
                          </BaseButton>
                        )}

                        {item.status === 'ACTIVE' && (
                          <BaseButton
                            variant="outline"
                            size="sm"
                            isLoading={isActionLoading}
                            onClick={() => handleStatusChange(item.id, 'ARCHIVED')}
                            className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                            title="Tạm ngưng nhận lượt thuê mới"
                          >
                            Tạm ngưng
                          </BaseButton>
                        )}
                      </>
                    ) : (
                      /* DÀNH CHO ĐỒ BÁN (SELL), TẶNG (GIVEAWAY), ĐỔI (SWAP) */
                      <>
                        {item.status === 'ACTIVE' && (
                          <BaseButton
                            variant="outline"
                            size="sm"
                            isLoading={isActionLoading}
                            onClick={() =>
                              setConfirmSaleModal({
                                isOpen: true,
                                listing: item,
                                buyerName: 'Người mua',
                                meetingPoint: 'Khuôn viên Trường ĐH Phenikaa',
                              })
                            }
                            className="text-amber-600 border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs gap-1"
                            title="Xác nhận bán cho người mua & thông báo giao hàng"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Xác nhận bán</span>
                          </BaseButton>
                        )}

                        {item.status === 'RESERVED' && (
                          <>
                            <BaseButton
                              variant="primary"
                              size="sm"
                              isLoading={isActionLoading}
                              onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1 text-white font-bold"
                              title="Xác nhận đã bàn giao đồ cho người mua"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Xác nhận đã trao đồ cho người mua</span>
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
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            ✓ Đã trao tay hoàn tất
                          </span>
                        )}

                        {item.status === 'ACTIVE' && (
                          <BaseButton
                            variant="outline"
                            size="sm"
                            isLoading={isActionLoading}
                            onClick={() => handleStatusChange(item.id, 'ARCHIVED')}
                            className="text-slate-500 text-xs gap-1"
                            title="Tạm ẩn bài đăng"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Ẩn tin</span>
                          </BaseButton>
                        )}
                      </>
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
                      onClick={() => handleOpenDeleteConfirm(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Xóa bài đăng"
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

      {/* Modal Xác nhận bán & Lên lịch giao đồ cho người mua */}
      {confirmSaleModal.listing && (
        <BaseModal
          isOpen={confirmSaleModal.isOpen}
          onClose={() => setConfirmSaleModal((prev) => ({ ...prev, isOpen: false }))}
          title="Xác nhận bán sản phẩm"
        >
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {confirmSaleModal.listing.title}
                </p>
                <p className="text-orange-600 dark:text-orange-400 font-extrabold text-sm mt-0.5 font-mono">
                  {formatCurrency(confirmSaleModal.listing.price)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Người mua / Bạn học nhận đồ:
              </label>
              <input
                type="text"
                value={confirmSaleModal.buyerName}
                onChange={(e) =>
                  setConfirmSaleModal((prev) => ({ ...prev, buyerName: e.target.value }))
                }
                placeholder="Nhập tên người mua..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Địa điểm giao hàng tại trường:
              </label>
              <input
                type="text"
                value={confirmSaleModal.meetingPoint}
                onChange={(e) =>
                  setConfirmSaleModal((prev) => ({ ...prev, meetingPoint: e.target.value }))
                }
                placeholder="vd: Sảnh Tòa A2, Thư viện A9..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
              />
            </div>



            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <BaseButton
                variant="secondary"
                size="sm"
                onClick={() => setConfirmSaleModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Hủy bỏ
              </BaseButton>
              <BaseButton
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
                onClick={async () => {
                  const targetListing = confirmSaleModal.listing;
                  if (!targetListing) return;
                  await handleStatusChange(targetListing.id, 'RESERVED');
                  studentNotificationService.notifyBuyerDeliveryScheduled({
                    listingTitle: targetListing.title,
                    sellerName: user?.fullName || 'Người bán',
                    meetingPoint: confirmSaleModal.meetingPoint,
                  });
                  setConfirmSaleModal((prev) => ({ ...prev, isOpen: false }));
                  setToastMessage(`Đã xác nhận bán cho ${confirmSaleModal.buyerName}! Thông báo giao hàng đã được gửi tới người mua.`);
                  setTimeout(() => setToastMessage(null), 4000);
                }}
              >
                Xác nhận & Gửi thông báo
              </BaseButton>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Modal Xác nhận Xóa bài đăng (Thay thế hoàn toàn window.confirm của trình duyệt) */}
      {deleteConfirmModal.listing && (
        <BaseModal
          isOpen={deleteConfirmModal.isOpen}
          onClose={() => setDeleteConfirmModal({ isOpen: false, listing: null })}
          title="Xác nhận xóa bài đăng"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-rose-950 dark:text-rose-200">
                  Bạn có chắc chắn muốn xóa bài đăng này?
                </p>
                <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
                  Hành động này sẽ gỡ bỏ bài đăng vĩnh viễn khỏi Chợ Sinh viên Phenikaa và không thể khôi phục lại.
                </p>
              </div>
            </div>

            {/* Chi tiết sản phẩm */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <img
                src={
                  deleteConfirmModal.listing.images?.[0]?.mediaUrl ||
                  (deleteConfirmModal.listing as any).imageUrls?.[0] ||
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80'
                }
                alt={deleteConfirmModal.listing.title}
                className="w-12 h-12 rounded-xl object-cover bg-slate-200 dark:bg-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {deleteConfirmModal.listing.title}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-extrabold mt-0.5">
                  {deleteConfirmModal.listing.transactionType === 'GIVEAWAY'
                    ? 'Tặng 0đ'
                    : formatCurrency(deleteConfirmModal.listing.price)}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <BaseButton
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmModal({ isOpen: false, listing: null })}
                disabled={Boolean(actionLoadingId)}
              >
                Hủy bỏ
              </BaseButton>

              <BaseButton
                variant="primary"
                size="sm"
                isLoading={Boolean(actionLoadingId)}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa</span>
              </BaseButton>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Toast thông báo góc màn hình */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
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
          setToastMessage(`🎉 Đã hoàn tất đánh giá và cộng +${awarded} điểm Campus Karma!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </div>
  );
};
