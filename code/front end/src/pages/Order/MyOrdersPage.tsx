import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  RotateCcw,
  Clock,
  AlertTriangle,
  Star,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { PurchaseOrder, orderService } from '../../services/orderService';
import { ShopeeDisputeModal } from '../../components/features/ShopeeDisputeModal';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/useAuthStore';

export const MyOrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'DISPUTED'>('ALL');
  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<PurchaseOrder | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadOrders = () => {
    setOrders(orderService.getMyOrders());
  };

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => {
      loadOrders();
    };
    window.addEventListener('campus_orders_updated', handleUpdate);
    return () => {
      window.removeEventListener('campus_orders_updated', handleUpdate);
    };
  }, []);

  // Chỉ hiển thị những đơn bản thân MUA (không hiển thị sản phẩm bản thân tự bán)
  const myPurchaseOrders = orders.filter((o) => {
    if (user?.id) {
      return o.buyerId === user.id && o.sellerId !== user.id;
    }
    return true;
  });

  const filteredOrders = myPurchaseOrders.filter((o) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'CONFIRMED') return o.status === 'CONFIRMED' || o.status === 'DELIVERED';
    return o.status === activeTab;
  });

  const handleOpenDispute = (order: PurchaseOrder) => {
    setSelectedDisputeOrder(order);
    setIsDisputeModalOpen(true);
  };

  const handleConfirmReceived = (orderId: string) => {
    orderService.updateOrderStatus(orderId, 'COMPLETED');
    setSuccessToast(`Đã nhận được hàng thành công! Đơn hàng #${orderId} chuyển sang trạng thái ĐÃ HOÀN TẤT.`);
    setTimeout(() => setSuccessToast(null), 3500);
    loadOrders();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Đơn Mua Của Tôi (My Purchases)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý các sản phẩm bạn đã đặt mua từ bạn học trong trường Phenikaa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
        {[
          { key: 'ALL', label: `Tất cả (${myPurchaseOrders.length})` },
          {
            key: 'CONFIRMED',
            label: `Đang giao dịch (${myPurchaseOrders.filter((o) => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length})`,
          },
          {
            key: 'COMPLETED',
            label: `Đã hoàn tất (${myPurchaseOrders.filter((o) => o.status === 'COMPLETED').length})`,
          },
          {
            key: 'DISPUTED',
            label: `Khiếu nại / Trả hàng (${myPurchaseOrders.filter((o) => o.status === 'DISPUTED').length})`,
          },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Order List */}
      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Order Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    Mã đơn: #{order.id}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[11px] text-slate-500">
                    Người bán: <strong className="text-slate-700 dark:text-slate-300">{order.sellerName}</strong>
                  </span>
                </div>

                {/* Status Pill */}
                <div>
                  {(order.status === 'CONFIRMED' || order.status === 'DELIVERED') && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Đang giao dịch / Chờ nhận đồ
                    </span>
                  )}
                  {order.status === 'COMPLETED' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ HOÀN TẤT
                    </span>
                  )}
                  {order.status === 'DISPUTED' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Đang khiếu nại Trả hàng / Hoàn tiền
                    </span>
                  )}
                </div>
              </div>

              {/* Order Item Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={order.listingImage}
                    alt={order.listingTitle}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 shrink-0"
                  />
                  <div className="space-y-1">
                    <Link
                      to={`/listings/${order.listingId}`}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition line-clamp-1"
                    >
                      {order.listingTitle}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN')} • Điểm hẹn: Sảnh Safe Meeting Point Phenikaa
                    </p>
                    <p className="text-sm font-black text-orange-600 dark:text-orange-400">
                      Tổng thanh toán: {formatCurrency(order.price)}
                    </p>
                  </div>
                </div>

                {/* Dispute Information banner if in dispute */}
                {order.status === 'DISPUTED' && order.disputeReason && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 max-w-sm">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Lý do khiếu nại: {order.disputeReason}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {order.disputeDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer: Strictly for buyer */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Link to={`/listings/${order.listingId}`}>
                  <BaseButton variant="outline" size="sm" className="text-xs">
                    Xem lại bài đăng
                  </BaseButton>
                </Link>

                {/* When order is still active, buyer can confirm receipt to complete order */}
                {(order.status === 'CONFIRMED' || order.status === 'DELIVERED') && (
                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleConfirmReceived(order.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã nhận được hàng (Hoàn tất)</span>
                  </BaseButton>
                )}

                {/* When completed, buyer can review */}
                {order.status === 'COMPLETED' && (
                  <Link to={`/listings/${order.listingId}`}>
                    <BaseButton variant="secondary" size="sm" className="text-xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Đánh giá sản phẩm</span>
                    </BaseButton>
                  </Link>
                )}

                {/* Dispute Button */}
                {order.status !== 'DISPUTED' && order.status !== 'COMPLETED' ? (
                  <BaseButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDispute(order)}
                    className="text-rose-600 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khiếu nại / Trả hàng</span>
                  </BaseButton>
                ) : order.status === 'DISPUTED' ? (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Đang chờ Ban Quản Trị đối soát
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Chưa có đơn mua nào trong mục này
            </h3>
            <p className="text-xs text-slate-500">
              Khi bạn đặt mua sản phẩm từ bạn học trong trường, đơn mua sẽ xuất hiện tại đây.
            </p>
            <Link to="/">
              <BaseButton variant="primary" size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700 text-white">
                Khám phá sản phẩm trên Chợ Phenikaa
              </BaseButton>
            </Link>
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      <ShopeeDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        order={selectedDisputeOrder}
        onSuccess={() => {
          loadOrders();
        }}
      />
    </div>
  );
};