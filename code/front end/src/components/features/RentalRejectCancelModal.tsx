import React, { useState } from 'react';
import { X, AlertCircle, Calendar, Wrench, MapPin, Clock, Lightbulb, DollarSign, Send } from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';

export interface RentalRejectCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
  type: 'REJECT' | 'CANCEL';
  listingTitle?: string;
  peerName?: string;
  isLoading?: boolean;
}

export const RentalRejectCancelModal: React.FC<RentalRejectCancelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  listingTitle = 'Thiết bị thuê',
  peerName = 'Đối phương',
  isLoading = false,
}) => {
  const isReject = type === 'REJECT';

  const rejectPresets = [
    { label: 'Hôm đó tôi đã có lịch thuê / bận', icon: Calendar },
    { label: 'Thiết bị đang bảo dưỡng / kiểm tra lại', icon: Wrench },
    { label: 'Địa điểm hoặc thời gian hẹn gặp không phù hợp', icon: MapPin },
    { label: 'Thời gian thuê quá ngắn / không tiện bàn giao', icon: Clock },
  ];

  const cancelPresets = [
    { label: 'Đã đổi ý / Đã mượn được thiết bị từ bạn bè', icon: Lightbulb },
    { label: 'Lịch học / thi thay đổi, không còn nhu cầu thuê', icon: Calendar },
    { label: 'Chờ phản hồi lâu / muốn đổi thời gian khác', icon: Clock },
    { label: 'Muốn thỏa thuận lại tiền cọc hoặc giá thuê', icon: DollarSign },
  ];

  const presets = isReject ? rejectPresets : cancelPresets;

  const [selectedPreset, setSelectedPreset] = useState<string>(presets[0].label);
  const [customReason, setCustomReason] = useState<string>(presets[0].label);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPreset = (label: string) => {
    setSelectedPreset(label);
    setCustomReason(label);
    setError(null);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customReason.trim()) {
      setError('Vui lòng chọn hoặc nhập lý do cụ thể.');
      return;
    }
    setError(null);
    await onSubmit(customReason.trim());
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="p-6 space-y-5 text-left">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isReject
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isReject ? 'Từ Chối Yêu Cầu Cho Thuê' : 'Hủy Yêu Cầu Thuê Đồ'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isReject
                  ? `Từ chối yêu cầu của bạn ${peerName} cho "${listingTitle}"`
                  : `Hủy yêu cầu thuê món đồ "${listingTitle}"`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Quick Reason Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Chọn nhanh lý do {isReject ? 'từ chối' : 'hủy yêu cầu'} *
          </label>
          <div className="grid grid-cols-1 gap-2">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.label;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.label)}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition border ${
                    isSelected
                      ? isReject
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200 font-bold'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="flex-1">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Nội dung lý do chi tiết gửi đến {peerName} *
          </label>
          <textarea
            rows={3}
            value={customReason}
            onChange={(e) => {
              setCustomReason(e.target.value);
              setSelectedPreset('');
              if (error) setError(null);
            }}
            placeholder={`Nhập chi tiết lý do ${isReject ? 'từ chối cho thuê' : 'hủy yêu cầu'}...`}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            required
          />
        </div>



        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <BaseButton type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Quay lại
          </BaseButton>
          <BaseButton
            type="button"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={handleConfirm}
            className={`font-bold text-white shadow-md ${
              isReject
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {isReject ? 'Xác nhận từ chối cho thuê' : 'Xác nhận hủy yêu cầu'}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
};
