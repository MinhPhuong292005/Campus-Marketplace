import React, { useState } from 'react';
import { ArrowLeftRight, Package, PlusCircle, Check } from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';
import { Listing } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { swapService } from '../../services/swapService';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: Listing;
  onSuccess?: () => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  targetListing,
  onSuccess,
}) => {
  // My active items available to swap
  const [myItems] = useState([
    {
      id: 101,
      title: 'Bàn phím cơ Akko 3084 Silent Switch',
      price: 650000,
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    },
    {
      id: 102,
      title: 'Bộ sạc nhanh Anker 65W GaN Type-C',
      price: 400000,
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80',
    },
    {
      id: 103,
      title: 'Tai nghe chụp tai Sony WH-CH520',
      price: 750000,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    },
  ]);

  const [selectedItemId, setSelectedItemId] = useState<number>(myItems[0]?.id || 0);
  const [cashAdjustment, setCashAdjustment] = useState<number>(100000);
  const [adjustmentType, setAdjustmentType] = useState<'PAY' | 'RECEIVE' | 'EQUAL'>('PAY');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const selectedItem = myItems.find((i) => i.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      alert('Vui lòng chọn một món đồ của bạn để đề xuất đổi');
      return;
    }

    try {
      setIsSubmitting(true);
      const actualAdjustment =
        adjustmentType === 'PAY'
          ? Math.abs(cashAdjustment)
          : adjustmentType === 'RECEIVE'
          ? -Math.abs(cashAdjustment)
          : 0;

      await swapService.createProposal({
        initiatorListingId: selectedItemId,
        targetListingId: targetListing.id,
        cashAdjustment: actualAdjustment,
        note,
      });

      setIsDone(true);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi gửi đề xuất đổi đồ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đề xuất Trao đổi đồ dùng (Swap Proposal)"
      maxWidth="lg"
    >
      {isDone ? (
        <div className="py-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Đề xuất đổi đồ đã được gửi tới người bán!
          </h3>
          <p className="text-xs text-slate-500">
            Bạn có thể theo dõi phản hồi trong mục Kho đồ sinh viên hoặc tin nhắn.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visual Comparison: My Item vs Target Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            {/* Target Item (Left) */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide">
                Món đồ bạn muốn nhận (Mục tiêu)
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={
                    targetListing.images?.[0]?.mediaUrl ||
                    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&q=80'
                  }
                  alt={targetListing.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {targetListing.title}
                  </p>
                  <p className="text-xs text-blue-600 font-bold mt-1">
                    {formatCurrency(targetListing.price)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Người đăng: {targetListing.authorName || 'Sinh viên'}
                  </p>
                </div>
              </div>
            </div>

            {/* My Selected Item (Right) */}
            <div className="p-4 rounded-2xl border-2 border-blue-500/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                Món đồ của bạn mang đi đổi
              </span>
              {selectedItem ? (
                <div className="flex items-center gap-3">
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedItem.title}
                    </p>
                    <p className="text-xs text-blue-600 font-bold mt-1">
                      {formatCurrency(selectedItem.price)}
                    </p>
                    <p className="text-[11px] text-slate-400">Kho đồ cá nhân của bạn</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa chọn món đồ</p>
              )}
            </div>

            {/* Middle Swap Icon */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 text-white items-center justify-center shadow-md">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>

          {/* Select from My Active Listings */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Chọn món đồ trong kho của bạn để mang đi đổi</span>
              <a href="/create-listing" className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" /> Đăng thêm đồ mới
              </a>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {myItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="truncate flex-1">
                      <p className="text-[11px] font-bold truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{formatCurrency(item.price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Adjustment (Bù trừ tiền) */}
          <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Phương án bù trừ tiền mặt (Chênh lệch giá trị)
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('PAY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  adjustmentType === 'PAY'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300'
                }`}
              >
                Tôi bù thêm tiền cho bạn (+VNĐ)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('RECEIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  adjustmentType === 'RECEIVE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300'
                }`}
              >
                Đề nghị bạn bù thêm tiền cho tôi (-VNĐ)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('EQUAL');
                  setCashAdjustment(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  adjustmentType === 'EQUAL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300'
                }`}
              >
                Đổi ngang (0đ không bù)
              </button>
            </div>

            {adjustmentType !== 'EQUAL' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={cashAdjustment}
                  onChange={(e) => setCashAdjustment(Number(e.target.value))}
                  placeholder="Nhập số tiền bù (ví dụ: 100000)"
                  className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono font-bold text-blue-600"
                />
                <span className="text-xs text-slate-500 font-semibold">VNĐ</span>
              </div>
            )}
          </div>

          {/* Note Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Lời nhắn trao đổi thương lượng
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Mình ở KTX B5, đồ mình còn rất mới, bạn xem ưng ý thì nhắn mình nhé..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <BaseButton type="button" variant="outline" size="sm" onClick={onClose}>
              Hủy
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <Package className="w-4 h-4" />
              <span>Gửi Đề Xuất Đổi Đồ</span>
            </BaseButton>
          </div>
        </form>
      )}
    </BaseModal>
  );
};
