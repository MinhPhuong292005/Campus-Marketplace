import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Store,
  Clock,
  Tag,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { cartService, CartItem } from '../../services/cartService';
import { formatCurrency } from '../../utils/formatters';
import { BaseButton } from '../../components/base/BaseButton';
import { KarmaBadge } from '../../components/features/KarmaBadge';
import { useAuthStore } from '../../store/useAuthStore';

export const CartPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);

  const loadCart = () => {
    setItems(cartService.getCart());
  };

  useEffect(() => {
    loadCart();

    const handleUpdate = () => loadCart();
    window.addEventListener('campus_cart_updated', handleUpdate);
    return () => window.removeEventListener('campus_cart_updated', handleUpdate);
  }, []);

  // Group items by seller
  const groupedBySeller = items.reduce((acc, item) => {
    const sId = item.sellerId;
    if (!acc[sId]) {
      acc[sId] = {
        sellerId: sId,
        sellerName: item.sellerName,
        sellerAvatar: item.sellerAvatar,
        sellerKarma: item.sellerKarma,
        items: [],
      };
    }
    acc[sId].items.push(item);
    return acc;
  }, {} as Record<number, { sellerId: number; sellerName: string; sellerAvatar?: string; sellerKarma?: number; items: CartItem[] }>);

  const selectedItems = items.filter((i) => i.selected);
  const totalAmount = selectedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const isAllSelected = items.length > 0 && items.every((i) => i.selected);

  const handleToggleSelectAll = () => {
    cartService.toggleSelectAll(!isAllSelected);
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    if (!user) {
      navigate('/auth/login', { state: { from: '/cart' } });
      return;
    }
    navigate('/checkout', {
      state: {
        items: selectedItems,
        isFromCart: true,
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Breadcrumb / Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
              <span>Giỏ Hàng Của Tôi</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quản lý các sản phẩm mua thanh lý và đồ thuê ngắn hạn trong trường Phenikaa
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => cartService.clearSelectedItems()}
            disabled={selectedItems.length === 0}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40 flex items-center gap-1 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Xóa các món đã chọn</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Giỏ hàng sinh viên của bạn đang trống!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Hãy dạo quanh Chợ Sinh Viên để tìm sách giáo trình, máy tính Casio, đồ công nghệ hoặc đồ dùng học tập giá tốt nhé.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/">
              <BaseButton variant="primary" className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-6 py-2.5 text-xs font-bold shadow-md shadow-orange-600/20">
                Khám phá Chợ Sinh Viên ngay
              </BaseButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List by Seller (Shopee Style) */}
          {Object.values(groupedBySeller).map((group) => {
            const isSellerAllSelected = group.items.every((i) => i.selected);

            return (
              <div
                key={group.sellerId}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Seller Header */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSellerAllSelected}
                      onChange={(e) =>
                        cartService.toggleSelectSeller(group.sellerId, e.target.checked)
                      }
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-orange-600" />
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {group.sellerName}
                      </span>
                      {group.sellerKarma !== undefined && (
                        <KarmaBadge score={group.sellerKarma} showText={false} />
                      )}
                    </div>
                  </div>

                  <Link
                    to="/chat"
                    state={{ sellerId: group.sellerId, sellerName: group.sellerName }}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Nhắn tin</span>
                  </Link>
                </div>

                {/* Items List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {group.items.map((item) => {
                    const itemTotal = item.price * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                      >
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => cartService.toggleSelect(item.id)}
                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                          />

                          <img
                            src={item.listingImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'}
                            alt={item.listingTitle}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0"
                          />

                          <div className="min-w-0 space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                item.transactionType === 'RENT'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              {item.transactionType === 'RENT' ? (
                                <>
                                  <Clock className="w-3 h-3" /> Cho thuê theo ngày
                                </>
                              ) : (
                                <>
                                  <Tag className="w-3 h-3" /> Mua thanh lý
                                </>
                              )}
                            </span>

                            <Link
                              to={`/listings/${item.listingId}`}
                              className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 hover:text-blue-600 transition block"
                            >
                              {item.listingTitle}
                            </Link>

                            <p className="text-xs text-slate-500 font-medium">
                              Đơn giá: <strong className="text-orange-600 dark:text-orange-400">{formatCurrency(item.price)}</strong>
                              {item.transactionType === 'RENT' ? ' / ngày' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Quantity / Days Controller & Subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                          {/* Counter */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                              {item.transactionType === 'RENT' ? 'Số ngày thuê:' : 'Số lượng:'}
                            </span>
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => cartService.updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-10 text-center font-bold text-xs text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => cartService.updateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {item.transactionType === 'RENT' && (
                              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                ngày
                              </span>
                            )}
                          </div>

                          {/* Subtotal */}
                          <div className="text-right min-w-[100px]">
                            <p className="text-sm font-extrabold text-orange-600 dark:text-orange-400">
                              {formatCurrency(itemTotal)}
                            </p>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => cartService.removeFromCart(item.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Summary Bar (Shopee Style) */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-start">
              <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <span>Chọn tất cả ({items.length})</span>
              </label>

              <span className="text-slate-400 hidden sm:inline">•</span>

              <span className="text-slate-500">
                Đã chọn: <strong className="text-slate-900 dark:text-white">{selectedItems.length}</strong> sản phẩm
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Tổng thanh toán dự kiến:</p>
                <p className="text-lg font-extrabold text-orange-600 dark:text-orange-400 leading-tight">
                  {formatCurrency(totalAmount)}
                </p>
              </div>

              <BaseButton
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                variant="primary"
                className="px-7 py-3 rounded-2xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 disabled:opacity-40 flex items-center gap-2"
              >
                <span>Mua hàng / Thanh toán</span>
                <ArrowRight className="w-4 h-4" />
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
