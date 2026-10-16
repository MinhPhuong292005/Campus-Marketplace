import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { BaseButton } from '../../components/base/BaseButton';
import { rentalService } from '../../services/rentalService';
import { RentalContract, RentalStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const RentalListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | RentalStatus>('ALL');
  const [rentals, setRentals] = useState<RentalContract[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const res = await rentalService.getMyRentals(activeTab);
      if (res.success && res.data) {
        setRentals(res.data.items || res.data.content || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [activeTab]);

  const tabs: Array<{ key: 'ALL' | RentalStatus; label: string }> = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ check-in ảnh' },
    { key: 'ACTIVE', label: 'Đang thuê' },
    { key: 'RETURNED', label: 'Đã hoàn tất & Trả cọc' },
    { key: 'DISPUTED', label: 'Tranh chấp cọc' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Hợp Đồng Thuê & Quản Lý Tiền Cọc (Rental Contracts)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận điều khoản thuê, chụp ảnh đối chiếu 2-4 góc trước khi bàn giao và bảo vệ tiền cọc sinh viên.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

      {/* Contract List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Đang tải danh sách hợp đồng thuê...</div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Chưa có hợp đồng nào trong mục này
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Bạn có thể tìm máy tính Casio, lễ phục kỷ yếu hoặc thiết bị học tập trong mục Cho thuê trên Chợ.
          </p>
          <Link to="/">
            <BaseButton variant="outline" size="sm">Khám phá đồ cho thuê</BaseButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((contract) => (
            <div
              key={contract.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      contract.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : contract.status === 'PENDING'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : contract.status === 'RETURNED'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {contract.status === 'ACTIVE'
                      ? 'Đang thuê thiết bị'
                      : contract.status === 'PENDING'
                      ? 'Chờ chụp 2-4 ảnh check-in'
                      : contract.status === 'RETURNED'
                      ? 'Đã trả đồ & Hoàn cọc'
                      : 'Đang tranh chấp cọc'}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    HĐ #{contract.id}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {contract.listingTitle}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Chủ thiết bị:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {contract.ownerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Tiền cọc giữ chỗ:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {formatCurrency(contract.depositAmount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Tổng tiền thuê:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(contract.totalRentAmount)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Hạn trả đồ:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDate(contract.endDate)}
                    </span>
                  </div>
                </div>

                {/* Proof images indicator */}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    Ảnh hiện trạng bàn giao:{' '}
                    <b className="text-slate-700 dark:text-slate-300">
                      {contract.proofImages?.length || 0}/4 ảnh
                    </b>
                  </span>
                </div>
              </div>

              {/* Action Link */}
              <div className="self-end sm:self-center shrink-0">
                <Link to={`/rentals/${contract.id}`}>
                  <BaseButton variant="outline" size="sm" className="gap-1.5 shadow-xs">
                    <span>Xem chi tiết & Bàn giao</span>
                    <ChevronRight className="w-4 h-4" />
                  </BaseButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
