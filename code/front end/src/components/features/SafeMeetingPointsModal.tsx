import React, { useState, useEffect } from 'react';
import { MapPin, ShieldCheck, Clock, Check } from 'lucide-react';
import { BaseModal } from '../base/BaseModal';
import { BaseButton } from '../base/BaseButton';
import { chatService, SafeMeetingPoint } from '../../services/chatService';

interface SafeMeetingPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPoint: (point: SafeMeetingPoint) => void;
}

export const SafeMeetingPointsModal: React.FC<SafeMeetingPointsModalProps> = ({
  isOpen,
  onClose,
  onSelectPoint,
}) => {
  const [points, setPoints] = useState<SafeMeetingPoint[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatService.getSafeMeetingPoints().then((res) => {
        if (res.data) {
          setPoints(res.data);
          if (res.data.length > 0 && selectedId === null) {
            setSelectedId(res.data[0].id);
          }
        }
      });
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const chosen = points.find((p) => p.id === selectedId);
    if (chosen) {
      onSelectPoint(chosen);
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Chọn Điểm Hẹn An Toàn Trong Trường (Safe Meeting Point)"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <b>Khuyến cáo an toàn:</b> Giao dịch tại các địa điểm công cộng trong trường có bảo vệ và camera giúp hạn chế tối đa nguy cơ lừa đảo hoặc bom hẹn.
          </span>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {points.map((point) => {
            const isSelected = selectedId === point.id;
            return (
              <div
                key={point.id}
                onClick={() => setSelectedId(point.id)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {point.name}
                    </h4>
                  </div>
                  {isSelected && (
                    <span className="p-1 rounded-full bg-emerald-500 text-white shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-6">
                  {point.address}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2 pl-6 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {point.recommendedHours}
                  </span>
                  {point.isCctvMonitored && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3 h-3" /> Có camera & bảo vệ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <BaseButton variant="outline" size="sm" onClick={onClose}>
            Hủy
          </BaseButton>
          <BaseButton variant="primary" size="sm" onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
            Hẹn gặp tại đây
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
};
