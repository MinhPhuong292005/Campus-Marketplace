import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { BaseButton } from '../base/BaseButton';
import { PurchaseOrder, orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';

interface ShopeeDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onSuccess?: () => void;
}

export const ShopeeDisputeModal: React.FC<ShopeeDisputeModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const [reason, setReason] = useState<string>('CHUA_NHAN_HANG');
  const [solution, setSolution] = useState<'REFUND_RETURN' | 'REFUND_ONLY' | 'EXCHANGE'>('REFUND_RETURN');
  const [refundAmount, setRefundAmount] = useState<number>(order ? order.price : 50000);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const disputeReasons = [
    {
      id: 'CHUA_NHAN_HANG',
      title: 'Chưa nhận được hàng / Bom hẹn',
      desc: 'Người bán không tới điểm hẹn campus, không nghe máy, chặn tin nhắn',
    },
    {
      id: 'HANG_HU_HONG',
      title: 'Hàng bị hư hỏng / Bể vỡ khi nhận',
      desc: 'Sách rách nát, thiết bị nứt vỡ, hỏng hóc linh kiện khi kiểm tra',
    },
    {
      id: 'THIEU_HANG',
      title: 'Thiếu hàng / Phụ kiện cam kết',
      desc: 'Không kèm sạc, thiếu tài liệu hoặc quà tặng đã cam kết trong bài đăng',
    },
    {
      id: 'KHAC_MO_TA',
      title: 'Khác xa mô tả / Hàng giả kém chất lượng',
      desc: 'Đồ nhận được cũ nát hơn ảnh đăng nhiều, nghi ngờ hàng nhái',
    },
    {
      id: 'LUA_TIEN_COC',
      title: 'Gian lận tiền cọc / Đòi chuyển ngoài',
      desc: 'Người bán yêu cầu cọc nhưng không giao hàng, có dấu hiệu lừa đảo',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Vui lòng mô tả chi tiết lý do và bằng chứng để Ban Quản Trị Shopee Campus đối soát.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const selectedReasonObj = disputeReasons.find((r) => r.id === reason);
      const res = await orderService.submitDispute(order.id, {
        reason: selectedReasonObj ? selectedReasonObj.title : reason,
        solution,
        refundAmount: Number(refundAmount) || order.price,
        description: description.trim(),
        evidenceUrl: evidenceUrl || 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&q=80',
      });

      if (res.success) {
        setSuccessMsg(res.message);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
          setDescription('');
        }, 1800);
      }
    } catch {
      setErrorMsg('Không thể gửi khiếu nại lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
        {/* Header - Shopee Style Return & Refund */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Yêu Cầu Trả Hàng / Hoàn Tiền & Khiếu Nại
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-extrabold border border-orange-500/20">
                  Shopee Campus
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chỉ dành riêng cho người mua đã được xác nhận giao dịch • Mã đơn: <b>{order.id}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmed Order Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <img
            src={order.listingImage}
            alt={order.listingTitle}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white"
          />
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 mb-1">
              ✓ ĐÃ XÁC NHẬN MUA HÀNG
            </span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {order.listingTitle}
            </h4>
            <p className="text-[11px] text-slate-500">
              Người bán: <b className="text-slate-700 dark:text-slate-300">{order.sellerName}</b>
            </p>
            <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-0.5">
              {formatCurrency(order.price)}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dispute Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lý do bạn muốn Trả hàng / Hoàn tiền & Khiếu nại *
            </label>
            <div className="space-y-2">
              {disputeReasons.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReason(item.id)}
                  className={`w-full p-3 rounded-2xl text-left border text-xs transition-all flex items-start justify-between ${
                    reason === item.id
                      ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      reason === item.id
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {reason === item.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Phương án mong muốn *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'REFUND_RETURN', label: 'Trả hàng & Hoàn 100%' },
                { id: 'REFUND_ONLY', label: 'Hoàn tiền ngay' },
                { id: 'EXCHANGE', label: 'Đổi món đồ khác' },
              ].map((sol) => (
                <button
                  key={sol.id}
                  type="button"
                  onClick={() => setSolution(sol.id as any)}
                  className={`p-2.5 rounded-xl text-center text-xs font-semibold border transition ${
                    solution === sol.id
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-600 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sol.label}
                </button>
              ))}
            </div>
          </div>

          {/* Refund Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Số tiền yêu cầu hoàn lại (đ) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                max={order.price}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">VNĐ</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Tối đa: {formatCurrency(order.price)} (Số tiền bạn đã thanh toán cho đơn hàng này)
            </p>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Mô tả chi tiết bằng chứng & sự việc *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Mình hẹn bạn lúc 14h tại thư viện Phenikaa nhưng bạn không tới, gọi điện không bắt máy và chặn tin nhắn của mình..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Evidence Image */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Hình ảnh bằng chứng (Ảnh khui kiện hàng / lỗi sản phẩm / bill cọc / chat)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://... hoặc bấm nút đính kèm ảnh mẫu"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setEvidenceUrl(
                    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=600&q=80'
                  )
                }
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs hover:bg-slate-200 flex items-center gap-1 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ảnh mẫu</span>
              </button>
            </div>
          </div>

          {/* Shopee Campus Assurance Policy */}
          <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 text-[11px] text-orange-900 dark:text-orange-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
              Chính Sách Bảo Vệ Người Mua Shopee Campus:
            </p>
            <p className="text-[10px] leading-relaxed text-orange-800/90 dark:text-orange-400">
              Ban Quản Trị sẽ tạm hoãn giao dịch, trích xuất log chat đối chiếu giữa 2 bạn tại Safe Meeting Point và phán quyết hoàn tiền hoặc trừ điểm Karma người bán trong vòng 24 giờ.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </BaseButton>
            <BaseButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              Gửi Yêu Cầu Cho Shopee Campus
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
};
