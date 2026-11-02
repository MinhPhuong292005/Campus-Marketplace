import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  Store,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import { CartItem, cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';
import { BaseButton } from '../../components/base/BaseButton';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { useAuthStore } from '../../store/useAuthStore';

export const CheckoutPage: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Location state can contain multiple items from cart or a single direct item
  const routeState = location.state as {
    items?: CartItem[];
    directItem?: {
      listingId: number;
      listingTitle: string;
      listingImage: string;
      transactionType: 'SELL' | 'RENT';
      price: number;
      quantity: number; // or rentalDays
      sellerId: number;
      sellerName: string;
      sellerAvatar?: string;
      sellerKarma?: number;
      safeMeetingPoint?: string;
    };
    isFromCart?: boolean;
  } | null;

  // Compile items list to checkout
  const checkoutItems: CartItem[] = routeState?.items?.length
    ? routeState.items
    : routeState?.directItem
    ? [
        {
          id: `direct_${routeState.directItem.listingId}`,
          listingId: routeState.directItem.listingId,
          listingTitle: routeState.directItem.listingTitle,
          listingImage: routeState.directItem.listingImage,
          transactionType: routeState.directItem.transactionType,
          price: routeState.directItem.price,
          quantity: routeState.directItem.quantity,
          sellerId: routeState.directItem.sellerId,
          sellerName: routeState.directItem.sellerName,
          sellerAvatar: routeState.directItem.sellerAvatar,
          sellerKarma: routeState.directItem.sellerKarma,
          safeMeetingPoint: routeState.directItem.safeMeetingPoint,
          selected: true,
        },
      ]
    : [];

  const selectedMeetingPoint =
    checkoutItems[0]?.safeMeetingPoint || 'Sảnh Tòa A2 (Khu Giảng đường Phenikaa)';

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{
    orderId: string;
    sellerId: number;
    sellerName: string;
    totalAmount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER';
    listingTitle: string;
  } | null>(null);

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          Chưa có sản phẩm nào được chọn để thanh toán
        </h2>
        <p className="text-xs text-slate-500">
          Vui lòng quay lại giỏ hàng hoặc chọn mua trực tiếp từ trang chi tiết sản phẩm.
        </p>
        <Link to="/cart">
          <BaseButton variant="primary" className="mt-2 text-xs font-semibold px-6 py-2.5 rounded-xl">
            Quay lại giỏ hàng
          </BaseButton>
        </Link>
      </div>
    );
  }

  // Calculate totals
  const totalAmount = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Sample MB Bank account for VietQR demo
  const bankInfo = {
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    accountNumber: '0382888999',
    accountName: checkoutItems[0]?.sellerName?.toUpperCase() || 'NGUYEN MINH PHUONG',
    transferContent: `CAMPUS DH${Math.floor(1000 + Math.random() * 9000)} ${user?.studentCode || '23010190'}`,
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmOrder = () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create orders for each item
      let lastCreatedOrderId = '';
      const primaryItem = checkoutItems[0];

      checkoutItems.forEach((item) => {
        const order = orderService.createOrder({
          listingId: item.listingId,
          listingTitle: item.listingTitle,
          listingImage: item.listingImage,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          buyerId: user.id,
          buyerName: user.fullName,
          price: item.price * item.quantity,
          transactionType: item.transactionType,
          quantity: item.quantity,
          rentalDays: item.transactionType === 'RENT' ? item.quantity : undefined,
          paymentMethod: paymentMethod,
          paymentStatus: 'PENDING',
          meetingPoint: selectedMeetingPoint,
        });
        lastCreatedOrderId = order.id;
      });

      // If came from cart, remove checked out items from cart
      if (routeState?.isFromCart) {
        cartService.clearSelectedItems();
      }

      setSuccessOrder({
        orderId: lastCreatedOrderId,
        sellerId: primaryItem.sellerId,
        sellerName: primaryItem.sellerName,
        totalAmount,
        paymentMethod,
        listingTitle: primaryItem.listingTitle,
      });
    } catch (err) {
      console.error('Error placing order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <span>Xác Nhận Đơn Mua & Thanh Toán</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giao dịch trực tiếp an toàn giữa sinh viên trong khuôn viên Trường ĐH Phenikaa
          </p>
        </div>
      </div>

      {/* 1. Shopee-style Campus Meeting Point Display */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
          <MapPin className="w-5 h-5 shrink-0" />
          <span>Địa Điểm Nhận Đồ Tại Trường ĐH Phenikaa</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-orange-800 dark:text-orange-300">Nơi nhận đồ do người bán thiết lập sẵn:</span>
            <span className="font-bold text-slate-900 dark:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/50 shadow-xs">
              {selectedMeetingPoint}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Điểm hẹn đã được người bán nhập sẵn trong tin đăng. Thời gian và lịch hẹn cụ thể sẽ được hai bạn trao đổi, thống nhất qua tin nhắn nội bộ.
          </p>
        </div>
      </div>

      {/* 2. Order Items List with Seller Info (Shopee Style) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Store className="w-4 h-4 text-blue-600" />
          <span>Thông Tin Sản Phẩm & Người Bán</span>
        </h2>

        <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
          {checkoutItems.map((item) => {
            const itemSubtotal = item.price * item.quantity;

            return (
              <div key={item.id} className="pt-3 first:pt-0 space-y-3">
                {/* Seller Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Người bán: {item.sellerName}
                    </span>
                    {item.sellerKarma !== undefined && (
                      <KarmaBadge score={item.sellerKarma} showText={false} />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Sinh viên Đại học Phenikaa
                  </span>
                </div>

                {/* Product Detail Row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.listingImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'}
                      alt={item.listingTitle}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.listingTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Hình thức:{' '}
                        {item.transactionType === 'RENT' ? (
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            Thuê ngắn hạn ({item.quantity} ngày)
                          </span>
                        ) : (
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            Mua thanh lý (x{item.quantity})
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Đơn giá: {formatCurrency(item.price)}
                        {item.transactionType === 'RENT' ? '/ngày' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Thành tiền:</p>
                    <p className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
                      {formatCurrency(itemSubtotal)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Payment Methods (Tiền mặt trực tiếp vs Chuyển khoản ngân hàng - Hoàn toàn không dùng QR) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Phương Thức Thanh Toán</span>
        </h2>

        {/* Radio Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Method 1: Cash */}
          <div
            onClick={() => setPaymentMethod('CASH')}
            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
              paymentMethod === 'CASH'
                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Tiền mặt khi gặp mặt
                </span>
                {paymentMethod === 'CASH' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Thanh toán tiền mặt trực tiếp cho bạn sinh viên khi gặp tại sảnh hoặc thư viện sau khi kiểm tra đồ nguyên vẹn.
              </p>
            </div>
          </div>

          {/* Method 2: Direct Bank Transfer (NO QR) */}
          <div
            onClick={() => setPaymentMethod('BANK_TRANSFER')}
            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
              paymentMethod === 'BANK_TRANSFER'
                ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Chuyển khoản trực tiếp (Số tài khoản)
                </span>
                {paymentMethod === 'BANK_TRANSFER' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Chuyển tiền trực tiếp vào tài khoản ngân hàng của sinh viên khi giao nhận hàng (nhập số tài khoản, không dùng mã QR).
              </p>
            </div>
          </div>
        </div>

        {/* Bank Details Frame when selected (NO QR) */}
        {paymentMethod === 'BANK_TRANSFER' && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-200/80 dark:border-blue-900/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-blue-200/50 dark:border-blue-800/40">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Thông Tin Tài Khoản Nhận Tiền Của Người Bán</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                Chuyển khoản 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bank Info */}
              <div className="space-y-3 text-xs bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{bankInfo.bankName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{bankInfo.accountName}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số tài khoản:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {bankInfo.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankInfo.accountNumber, 'accNum')}
                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedField === 'accNum' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'accNum' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Amount & Transfer Message */}
              <div className="space-y-3 text-xs bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Số tiền cần chuyển:</span>
                  <span className="font-bold text-base text-orange-600 dark:text-orange-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nội dung chuyển khoản:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs truncate max-w-[180px] block">
                      {bankInfo.transferContent}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankInfo.transferContent, 'content')}
                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedField === 'content' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'content' ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  * Mở app ngân hàng của bạn, chuyển tiền theo đúng STK và nội dung trên khi gặp mặt kiểm tra đồ.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Payment Breakdown & Confirmation Bar (Shopee Style) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Chi Tiết Thanh Toán
        </h3>

        <div className="space-y-2 text-xs border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Tổng tiền hàng / tiền thuê ({checkoutItems.length} sản phẩm):</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Phí trung gian & Phí bảo vệ Campus:</span>
            <span className="font-semibold text-emerald-600">0 ₫ (Miễn phí sinh viên)</span>
          </div>

          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Phương thức thanh toán đã chọn:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {paymentMethod === 'CASH' ? '💵 Tiền mặt khi gặp mặt' : '🏦 Chuyển khoản ngân hàng trực tiếp'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div>
            <span className="text-xs text-slate-500">Tổng số tiền phải bỏ ra:</span>
            <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          <BaseButton
            onClick={handleConfirmOrder}
            isLoading={isSubmitting}
            variant="primary"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Xác Nhận Đặt Mua Hàng</span>
          </BaseButton>
        </div>
      </div>

      {/* 5. Order Success Modal */}
      {successOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Đặt mua hàng thành công!
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Đơn hàng <strong>#{successOrder.orderId}</strong> đã được gửi đến người bán{' '}
                <strong>{successOrder.sellerName}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng thanh toán:</span>
                <span className="font-bold text-orange-600">{formatCurrency(successOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hình thức:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {successOrder.paymentMethod === 'CASH' ? '💵 Tiền mặt khi gặp mặt' : '🏦 Chuyển khoản ngân hàng trực tiếp'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm hẹn dự kiến:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                  {selectedMeetingPoint}
                </span>
              </div>
            </div>



            <div className="flex flex-col gap-2 pt-2">
              <BaseButton
                onClick={() => {
                  navigate('/chat', {
                    state: {
                      sellerId: successOrder.sellerId,
                      sellerName: successOrder.sellerName,
                      listingTitle: successOrder.listingTitle,
                    },
                  });
                }}
                variant="primary"
                className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Nhắn tin ngay với {successOrder.sellerName}</span>
              </BaseButton>

              <BaseButton
                onClick={() => navigate('/orders')}
                variant="outline"
                className="w-full py-2.5 text-xs font-semibold rounded-xl"
              >
                Xem danh sách Đơn mua của tôi
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
