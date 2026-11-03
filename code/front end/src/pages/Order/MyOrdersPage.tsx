import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  RotateCcw,
  Clock,
  AlertTriangle,
  Star,
  CheckCircle2,
  Check,
  MapPin,
  MessageCircle,
  Calendar,
  Store,
  PackageCheck,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { PurchaseOrder, orderService } from '../../services/orderService';
import { ShopeeDisputeModal } from '../../components/features/ShopeeDisputeModal';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/useAuthStore';
import { PHENIKAA_SAFE_MEETING_POINTS } from '../../constants/phenikaaData';
import { studentNotificationService } from '../../services/studentNotificationService';

export const MyOrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const initialType = searchParams.get('tab') === 'sales' ? 'SALE' : 'PURCHASE';
  const [orderType, setOrderType] = useState<'PURCHASE' | 'SALE'>(initialType);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'DISPUTED'>('ALL');

  const [selectedDisputeOrder, setSelectedDisputeOrder] = useState<PurchaseOrder | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Modal xác nhận & chọn điểm hẹn
  const [selectedConfirmOrder, setSelectedConfirmOrder] = useState<PurchaseOrder | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMeetingPoint, setConfirmMeetingPoint] = useState(
    PHENIKAA_SAFE_MEETING_POINTS[0]?.name + ' (' + PHENIKAA_SAFE_MEETING_POINTS[0]?.address + ')'
  );
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [confirmMeetingDate, setConfirmMeetingDate] = useState(getTodayStr());
  const [confirmMeetingTime, setConfirmMeetingTime] = useState('14:30');
  const [confirmMeetingNote, setConfirmMeetingNote] = useState('Gặp trực tiếp kiểm tra đồ trước khi thanh toán.');

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

  useEffect(() => {
    if (searchParams.get('tab') === 'sales') {
      setOrderType('SALE');
    }
  }, [searchParams]);

  const handleSwitchType = (type: 'PURCHASE' | 'SALE') => {
    setOrderType(type);
    setActiveTab('ALL');
    setSearchParams(type === 'SALE' ? { tab: 'sales' } : {});
  };

  // Đơn Mua: bản thân là người mua (buyerId === user.id)
  const myPurchaseOrders = orders.filter((o) => {
    if (user?.id) {
      return o.buyerId === user.id && o.sellerId !== user.id;
    }
    return true;
  });

  // Đơn Bán: bản thân là người bán (sellerId === user.id hoặc sellerStudentCode === user.studentCode)
  const mySaleOrders = orders.filter((o) => {
    if (user?.id) {
      return (
        o.sellerId === user.id ||
        (user.studentCode && o.sellerStudentCode === user.studentCode) ||
        (user.fullName && o.sellerName === user.fullName)
      );
    }
    return false;
  });

  const currentList = orderType === 'PURCHASE' ? myPurchaseOrders : mySaleOrders;

  const filteredOrders = currentList.filter((o) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return o.status === 'PENDING';
    if (activeTab === 'CONFIRMED') return o.status === 'CONFIRMED' || o.status === 'DELIVERED';
    return o.status === activeTab;
  });

  const handleOpenConfirmModal = (order: PurchaseOrder) => {
    setSelectedConfirmOrder(order);
    if (order.meetingPoint) {
      setConfirmMeetingPoint(order.meetingPoint);
    } else {
      const pt = PHENIKAA_SAFE_MEETING_POINTS[0];
      setConfirmMeetingPoint(`${pt.name} (${pt.address})`);
    }
    setConfirmMeetingDate(getTodayStr());
    setConfirmMeetingTime('14:30');
    setConfirmMeetingNote('Gặp trực tiếp kiểm tra đồ trước khi thanh toán.');
    setIsConfirmModalOpen(true);
  };

  const handleSaveConfirmMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfirmOrder) return;

    if (confirmMeetingTime) {
      const [hStr] = confirmMeetingTime.split(':');
      const hour = parseInt(hStr, 10);
      if (hour < 6 || hour > 22) {
        alert('Để đảm bảo an toàn giao dịch tại khuôn viên trường Phenikaa, vui lòng chọn thời gian hẹn gặp trong khung từ 6h00 đến 22h00!');
        return;
      }
    }

    orderService.confirmOrder(selectedConfirmOrder.id, {
      meetingPoint: confirmMeetingPoint,
      meetingDate: confirmMeetingDate,
      meetingTime: confirmMeetingTime,
      meetingNote: confirmMeetingNote,
    });

    studentNotificationService.notifyBuyerDeliveryScheduled({
      buyerId: selectedConfirmOrder.buyerId,
      listingTitle: selectedConfirmOrder.listingTitle,
      sellerName: selectedConfirmOrder.sellerName || user?.fullName || 'Người bán',
      meetingPoint: confirmMeetingPoint,
    });

    setIsConfirmModalOpen(false);
    setSuccessToast(`🎉 Đã xác nhận đơn hàng #${selectedConfirmOrder.id} và chốt điểm hẹn thành công!`);
    setTimeout(() => setSuccessToast(null), 3500);
    loadOrders();
  };

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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
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
                Quản Lý Đơn Hàng Phenikaa
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý các đơn mua và đơn bán trao đổi trực tiếp an toàn trong khuôn viên trường.
              </p>
            </div>
          </div>
        </div>

        {/* Main Tab Switcher: Đơn Mua vs Đơn Bán */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleSwitchType('PURCHASE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              orderType === 'PURCHASE'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn mua của tôi ({myPurchaseOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchType('SALE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              orderType === 'SALE'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Đơn bán / Yêu cầu nhận được ({mySaleOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
        {[
          { key: 'ALL', label: `Tất cả (${currentList.length})` },
          {
            key: 'PENDING',
            label: `Chờ chọn điểm hẹn (${currentList.filter((o) => o.status === 'PENDING').length})`,
          },
          {
            key: 'CONFIRMED',
            label: `Đang giao dịch (${currentList.filter((o) => o.status === 'CONFIRMED' || o.status === 'DELIVERED').length})`,
          },
          {
            key: 'COMPLETED',
            label: `Đã hoàn tất (${currentList.filter((o) => o.status === 'COMPLETED').length})`,
          },
          {
            key: 'DISPUTED',
            label: `Khiếu nại (${currentList.filter((o) => o.status === 'DISPUTED').length})`,
          },
        ].map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? orderType === 'SALE'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
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
          filteredOrders.map((order) => {
            const isSellerView = orderType === 'SALE';

            return (
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
                      {isSellerView ? (
                        <>
                          Người mua:{' '}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {order.buyerName} {order.buyerStudentCode ? `(MSSV: ${order.buyerStudentCode})` : ''}
                          </strong>
                        </>
                      ) : (
                        <>
                          Người bán:{' '}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {order.sellerName}
                          </strong>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Status Pill */}
                  <div>
                    {order.status === 'PENDING' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" /> Chờ xác nhận & chọn điểm hẹn
                      </span>
                    )}
                    {(order.status === 'CONFIRMED' || order.status === 'DELIVERED') && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Đang giao dịch / Đã chốt điểm hẹn
                      </span>
                    )}
                    {order.status === 'COMPLETED' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ HOÀN TẤT
                      </span>
                    )}
                    {order.status === 'DISPUTED' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Đang khiếu nại Trả hàng / Hoàn tiền
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Item Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={order.listingImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'}
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
                        Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Điểm hẹn: <strong>{order.meetingPoint || 'Chờ người bán chọn điểm hẹn'}</strong>
                          {order.meetingTime ? ` (${order.meetingTime}` : ''}
                          {order.meetingDate ? ` - ${order.meetingDate})` : order.meetingTime ? ')' : ''}
                        </span>
                      </p>
                      <p className="text-sm font-black text-orange-600 dark:text-orange-400">
                        Tổng thanh toán: {formatCurrency(order.price)} (Thanh toán trực tiếp)
                      </p>
                    </div>
                  </div>

                  {/* Dispute Banner if in dispute */}
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

                {/* Action Buttons Footer */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {/* Chat Button: Always available */}
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/chat', {
                        state: {
                          sellerId: isSellerView ? order.buyerId : order.sellerId,
                          sellerName: isSellerView ? order.buyerName : order.sellerName,
                          listingId: order.listingId,
                          listingTitle: order.listingTitle,
                        },
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Nhắn tin với {isSellerView ? order.buyerName : order.sellerName}</span>
                  </button>

                  {/* Seller Action: Confirm & Pick Meeting Point */}
                  {isSellerView && order.status === 'PENDING' && (
                    <BaseButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenConfirmModal(order)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Xác nhận & Chọn điểm hẹn</span>
                    </BaseButton>
                  )}

                  {/* Seller Action: Change Meeting Point if already confirmed */}
                  {isSellerView && (order.status === 'CONFIRMED' || order.status === 'DELIVERED') && (
                    <BaseButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenConfirmModal(order)}
                      className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Đổi điểm hẹn</span>
                    </BaseButton>
                  )}

                  {/* Buyer Action: Confirm Receipt when confirmed */}
                  {!isSellerView && (order.status === 'CONFIRMED' || order.status === 'DELIVERED') && (
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

                  {/* Buyer Review */}
                  {!isSellerView && order.status === 'COMPLETED' && (
                    <Link to={`/listings/${order.listingId}`}>
                      <BaseButton variant="secondary" size="sm" className="text-xs flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Đánh giá sản phẩm</span>
                      </BaseButton>
                    </Link>
                  )}

                  {/* Dispute Button */}
                  {!isSellerView && order.status !== 'DISPUTED' && order.status !== 'COMPLETED' ? (
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
            );
          })
        ) : (
          <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {orderType === 'PURCHASE'
                ? 'Chưa có đơn mua nào trong mục này'
                : 'Chưa có yêu cầu đặt mua nào từ sinh viên'}
            </h3>
            <p className="text-xs text-slate-500">
              {orderType === 'PURCHASE'
                ? 'Khi bạn đặt mua sản phẩm từ bạn học trong trường, đơn mua sẽ xuất hiện tại đây.'
                : 'Khi sinh viên gửi yêu cầu đặt mua các món đồ bạn đăng bán, đơn hàng sẽ hiển thị tại đây để bạn xác nhận và chọn điểm hẹn.'}
            </p>
            {orderType === 'PURCHASE' && (
              <Link to="/">
                <BaseButton variant="primary" size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700 text-white">
                  Khám phá sản phẩm trên Chợ Phenikaa
                </BaseButton>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Modal Xác nhận đơn & Chọn điểm hẹn giao dịch an toàn Phenikaa */}
      {isConfirmModalOpen && selectedConfirmOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Xác Nhận Đơn & Chọn Điểm Hẹn
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Giao dịch an toàn giữa sinh viên tại khuôn viên Trường ĐH Phenikaa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfirmMeeting} className="space-y-4 text-xs">
              {/* Product Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedConfirmOrder.listingTitle}
                </p>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>
                    Người mua: <strong>{selectedConfirmOrder.buyerName}</strong>{' '}
                    {selectedConfirmOrder.buyerStudentCode ? `(MSSV: ${selectedConfirmOrder.buyerStudentCode})` : ''}
                  </span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(selectedConfirmOrder.price)}
                  </span>
                </div>
              </div>

              {/* Safe Meeting Point Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Điểm hẹn giao nhận an toàn (Khuôn viên Phenikaa) *</span>
                </label>
                <select
                  value={confirmMeetingPoint}
                  onChange={(e) => setConfirmMeetingPoint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {PHENIKAA_SAFE_MEETING_POINTS.map((pt) => (
                    <option key={pt.id} value={`${pt.name} (${pt.address})`}>
                      {pt.name} - {pt.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Meeting Date & Time */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <label className="block font-bold text-slate-700 dark:text-slate-200 text-xs">
                  Thời gian hẹn gặp (Khung giờ an toàn 6h - 22h) *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                    <input
                      type="date"
                      required
                      value={confirmMeetingDate}
                      min={getTodayStr()}
                      onChange={(e) => setConfirmMeetingDate(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                    <input
                      type="time"
                      required
                      min="06:00"
                      max="22:00"
                      value={confirmMeetingTime}
                      onChange={(e) => setConfirmMeetingTime(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú cho người mua
                </label>
                <input
                  type="text"
                  value={confirmMeetingNote}
                  onChange={(e) => setConfirmMeetingNote(e.target.value)}
                  placeholder="Gặp trực tiếp kiểm tra đồ trước khi thanh toán."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận & Chốt điểm hẹn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
