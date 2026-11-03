import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Package,
  PlusCircle,
  Check,
  Camera,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';
import { Listing } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { swapService } from '../../services/swapService';
import { listingService } from '../../services/listingService';
import { useAuthStore } from '../../store/useAuthStore';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing: Listing;
  onSuccess?: () => void;
}

export interface SwapItemOption {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  condition?: string;
  description?: string;
  isQuickAdd?: boolean;
}

// Danh mục từ khóa cấm theo quy chế Phenikaa Campus
const FORBIDDEN_KEYWORDS = [
  'vũ khí',
  'súng',
  'đạn',
  'dao',
  'kiếm',
  'ma túy',
  'cần sa',
  'chất kích thích',
  'cờ bạc',
  'lừa đảo',
  'tiền giả',
  'tài liệu mật',
  'đề thi trộm',
  'thuốc lắc',
  'bóng cười',
  'hack',
  'cheat',
  'scam',
];

export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  targetListing,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const isOwner = Boolean(user && targetListing && user.id === targetListing.userId);

  // Active items from user's warehouse
  const [myItems, setMyItems] = useState<SwapItemOption[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Active tab: 'INVENTORY' or 'QUICK_ADD'
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'QUICK_ADD'>('INVENTORY');

  // Proposal params
  const [cashAdjustment, setCashAdjustment] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'PAY' | 'RECEIVE' | 'EQUAL'>('EQUAL');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Add Item Form State (Chưa có trong kho)
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPrice, setQuickPrice] = useState<number>(targetListing?.price || 100000);
  const [quickCondition, setQuickCondition] = useState('Đã sử dụng (Còn tốt)');
  const [quickImageUrl, setQuickImageUrl] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickMessage, setQuickMessage] = useState('');

  // Fetch real user listings from inventory (KHÔNG DÙNG DỮ LIỆU MẪU)
  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchMyInventory = async () => {
      try {
        setIsLoadingItems(true);
        const res = await listingService.getMyListings();
        if (res.success && res.data) {
          const list: any[] = res.data.content || res.data.items || (Array.isArray(res.data) ? res.data : []);
          const validItems: SwapItemOption[] = list
            .filter((item: any) => item.id !== targetListing.id)
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              price: item.price,
              imageUrl:
                item.images && item.images.length > 0
                  ? item.images[0].mediaUrl
                  : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
              condition: item.conditionStatus || 'Đã dùng',
              description: item.description,
            }));
          setMyItems(validItems);
          if (validItems.length > 0) {
            setSelectedItemId(validItems[0].id);
          } else {
            // Nếu kho trống, tự động chuyển sang tab nhập nhanh để sinh viên tiện trao đổi
            setActiveTab('QUICK_ADD');
          }
        } else {
          setMyItems([]);
          setActiveTab('QUICK_ADD');
        }
      } catch {
        setMyItems([]);
        setActiveTab('QUICK_ADD');
      } finally {
        setIsLoadingItems(false);
      }
    };

    fetchMyInventory();
  }, [isOpen, user?.id, targetListing.id]);

  if (!isOpen) return null;

  // Handle local image upload or photo capture
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setQuickImageUrl(url);
    }
  };

  // Check forbidden keywords before submitting
  const checkForbiddenWords = (text: string): string | null => {
    const lower = text.toLowerCase();
    for (const kw of FORBIDDEN_KEYWORDS) {
      if (lower.includes(kw)) {
        return kw;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwner) {
      setErrorMsg('Bạn là chủ bài đăng nên không thể tự đổi đồ của chính mình.');
      return;
    }

    setErrorMsg(null);

    // 1. Case: Quick Add (Đồ chưa có trong kho cá nhân)
    if (activeTab === 'QUICK_ADD') {
      if (!quickTitle.trim()) {
        setErrorMsg('Vui lòng nhập tên món đồ bạn muốn đem đổi.');
        return;
      }
      if (!quickDesc.trim()) {
        setErrorMsg('Vui lòng nhập mô tả tình trạng món đồ.');
        return;
      }

      // Kiểm duyệt từ khóa cấm
      const combinedText = `${quickTitle} ${quickDesc} ${quickMessage}`;
      const banned = checkForbiddenWords(combinedText);
      if (banned) {
        setErrorMsg(`⚠️ Nội dung chứa từ khóa bị cấm theo quy chế Phenikaa: "${banned}". Vui lòng điều chỉnh lại thông tin!`);
        return;
      }

      try {
        setIsSubmitting(true);
        // Lưu tạm vào danh sách để gửi đề xuất (Không đẩy lên kho công khai, không cần admin duyệt)
        const quickItem: SwapItemOption = {
          id: -Date.now(),
          title: quickTitle.trim(),
          price: Number(quickPrice) || 0,
          imageUrl: quickImageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
          condition: quickCondition,
          description: quickDesc.trim(),
          isQuickAdd: true,
        };

        const actualAdjustment =
          adjustmentType === 'PAY'
            ? Math.abs(cashAdjustment)
            : adjustmentType === 'RECEIVE'
            ? -Math.abs(cashAdjustment)
            : 0;

        await swapService.createProposal({
          initiatorListingId: quickItem.id,
          targetListingId: targetListing.id,
          cashAdjustment: actualAdjustment,
          note: `[Đổi đồ nhập nhanh] ${quickItem.title} (Giá ước tính: ${quickItem.price.toLocaleString()} đ) - Tình trạng: ${quickCondition}.\n${quickDesc}.\nLời nhắn: ${quickMessage || note}`,
        });

        setIsDone(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2200);
      } catch (err: any) {
        setErrorMsg(err.message || 'Không thể gửi đề xuất trao đổi lúc này.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Case: Select from existing Inventory
    if (!selectedItemId) {
      setErrorMsg('Vui lòng chọn một món đồ trong kho hàng cá nhân của bạn để đề xuất đổi.');
      return;
    }

    // Kiểm duyệt từ khóa cấm trong lời nhắn
    const banned = checkForbiddenWords(note);
    if (banned) {
      setErrorMsg(`⚠️ Lời nhắn chứa từ khóa bị cấm: "${banned}". Vui lòng sửa lại!`);
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
        note: note.trim(),
      });

      setIsDone(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể gửi đề xuất đổi đồ lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem =
    activeTab === 'INVENTORY'
      ? myItems.find((i) => i.id === selectedItemId)
      : {
          id: -1,
          title: quickTitle || 'Món đồ của bạn',
          price: quickPrice,
          imageUrl: quickImageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80',
          condition: quickCondition,
        };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Đề Xuất Trao Đổi Đồ Dùng (Swap)">
      {isDone ? (
        <div className="py-10 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Check className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Đã gửi đề xuất trao đổi thành công!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Chủ bài đăng "{targetListing.title}" sẽ nhận được thông tin món đồ đề xuất của bạn qua tin nhắn và thông báo.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Comparison Preview (Target vs Offer) */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 items-center">
            {/* Target Item */}
            <div className="space-y-1.5 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Món đồ muốn đổi:
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={
                    targetListing.images && targetListing.images.length > 0
                      ? targetListing.images[0].mediaUrl
                      : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80'
                  }
                  alt={targetListing.title}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {targetListing.title}
                  </p>
                  <p className="text-[11px] font-extrabold text-blue-600">
                    {formatCurrency(targetListing.price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Offer Item Preview */}
            <div className="space-y-1.5 min-w-0 border-l border-slate-200 dark:border-slate-700 pl-3">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Đồ bạn đem đổi:
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={selectedItem?.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80'}
                  alt={selectedItem?.title}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-200 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedItem?.title || 'Chưa chọn đồ'}
                  </p>
                  <p className="text-[11px] font-extrabold text-amber-600">
                    {formatCurrency(selectedItem?.price || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('INVENTORY')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'INVENTORY'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Kho hàng cá nhân ({myItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('QUICK_ADD')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'QUICK_ADD'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Chưa có trong kho (Nhập nhanh)</span>
            </button>
          </div>

          {/* TAB 1: Kho hàng cá nhân */}
          {activeTab === 'INVENTORY' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Chọn món đồ từ kho hàng của bạn:</span>
                <span className="text-[10px] text-slate-400 font-normal">Chỉ đồ trong kho của bạn</span>
              </label>

              {isLoadingItems ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải kho đồ của bạn...</div>
              ) : myItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 text-center space-y-2">
                  <Package className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Kho hàng cá nhân của bạn hiện chưa có sản phẩm nào
                  </p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Bạn có thể chọn tab <b>"Chưa có trong kho (Nhập nhanh)"</b> để chụp ảnh và điền nhanh thông tin món đồ muốn đổi mà không cần đăng bài lên kho!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('QUICK_ADD')}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Chuyển sang Nhập Nhanh
                  </button>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {myItems.map((item) => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Tình trạng: {item.condition || 'Đã dùng'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-blue-600">{formatCurrency(item.price)}</p>
                          <span
                            className={`w-4 h-4 rounded-full border inline-flex items-center justify-center mt-1 ${
                              isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Nhập thông tin nhanh (Không tự lên kho, không cần admin duyệt) */}
          {activeTab === 'QUICK_ADD' && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Tên sản phẩm muốn đổi *
                </label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="vd: Chuột không dây Logitech M331 Silent"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Giá trị ước tính (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(Number(e.target.value))}
                    step={10000}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Tình trạng món đồ
                  </label>
                  <select
                    value={quickCondition}
                    onChange={(e) => setQuickCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Mới 100% nguyên hộp">Mới 100% nguyên hộp</option>
                    <option value="99% (Như mới / Like New)">99% (Như mới / Like New)</option>
                    <option value="Đã sử dụng (Còn tốt)">Đã sử dụng (Còn tốt)</option>
                    <option value="Có xước xát nhẹ">Có xước xát nhẹ</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload / Camera Capture */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Chụp ngay hoặc lấy ảnh từ thư viện</span>
                  <span className="text-[10px] text-slate-400">Ảnh thực tế sản phẩm</span>
                </label>
                <div className="flex items-center gap-3">
                  {quickImageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-300 shrink-0">
                      <img src={quickImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setQuickImageUrl('')}
                        className="absolute top-0 right-0 bg-black/60 text-white w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}

                  <label className="flex-1 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-xl p-3 text-center cursor-pointer hover:bg-amber-100/40 dark:hover:bg-amber-950/40 transition">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <Camera className="w-4 h-4 text-amber-600" />
                      <span>Chụp ảnh / Tải ảnh lên</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Mô tả món đồ *
                </label>
                <textarea
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  rows={2}
                  placeholder="Mô tả phụ kiện đi kèm, thời gian sử dụng, tính năng còn hoạt động tốt..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          )}

          {/* Cash Adjustment (Bù trừ tiền) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Thỏa thuận bù trừ tiền chênh lệch (nếu có):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'EQUAL', label: 'Đổi ngang (0đ bù)' },
                { type: 'PAY', label: 'Bạn bù thêm tiền' },
                { type: 'RECEIVE', label: 'Bên kia bù cho bạn' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setAdjustmentType(opt.type as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                    adjustmentType === opt.type
                      ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {adjustmentType !== 'EQUAL' && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Số tiền bù:</span>
                <input
                  type="number"
                  value={cashAdjustment}
                  onChange={(e) => setCashAdjustment(Number(e.target.value))}
                  step={10000}
                  min={0}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs font-bold text-slate-400">VNĐ</span>
              </div>
            )}
          </div>

          {/* Message / Note */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nhắn tin trao đổi gửi chủ đồ:
            </label>
            <textarea
              value={activeTab === 'QUICK_ADD' ? quickMessage : note}
              onChange={(e) =>
                activeTab === 'QUICK_ADD' ? setQuickMessage(e.target.value) : setNote(e.target.value)
              }
              rows={2}
              placeholder="vd: Mình có món đồ này còn rất mới muốn đổi lấy món đồ của bạn. Bạn thấy thế nào?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <BaseButton type="button" variant="secondary" size="sm" onClick={onClose}>
              Hủy
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shadow-sm"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Gửi đề xuất đổi đồ</span>
            </BaseButton>
          </div>
        </form>
      )}
    </BaseModal>
  );
};
