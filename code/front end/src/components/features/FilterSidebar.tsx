import React from 'react';
import { Filter, RotateCcw, Tag, DollarSign, MapPin } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export interface FilterState {
  category: string;
  transactionType: string;
  condition: string;
  campus: string;
  maxPrice: number;
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const categories = [
    { id: 'ALL', label: 'Tất cả danh mục' },
    { id: 'BOOKS', label: 'Giáo trình & Tài liệu' },
    { id: 'TECH', label: 'Thiết bị công nghệ' },
    { id: 'ROOM', label: 'Đồ dùng phòng trọ' },
    { id: 'TOOLS', label: 'Dụng cụ chuyên ngành' },
  ];

  const transactionTypes = [
    { id: 'ALL', label: 'Tất cả hình thức' },
    { id: 'SELL', label: 'Bán (Sell)' },
    { id: 'RENT', label: 'Cho thuê (Rent)' },
    { id: 'GIVEAWAY', label: 'Tặng 0đ (Giveaway)' },
    { id: 'SWAP', label: 'Đổi đồ (Swap)' },
  ];

  const conditions = [
    { id: 'ALL', label: 'Mọi tình trạng' },
    { id: 'NEW_100', label: 'Mới 100% nguyên seal' },
    { id: 'LIKE_NEW_99', label: 'Như mới (99%)' },
    { id: 'GOOD_90', label: 'Tốt (90%)' },
    { id: 'FAIR_70', label: 'Khá (70%)' },
  ];

  const campuses = [
    { id: 'ALL', label: 'Tất cả cơ sở / KTX' },
    { id: 'KTX_K1', label: 'KTX Phenikaa Tòa K1' },
    { id: 'KTX_K2', label: 'KTX Phenikaa Tòa K2' },
    { id: 'KTX_K3', label: 'KTX Phenikaa Tòa K3' },
    { id: 'KTX_NU', label: 'KTX Nữ Phenikaa' },
    { id: 'CO_SO_CHINH', label: 'Cơ sở Yên Nghĩa (Trụ sở chính)' },
  ];

  return (
    <aside className="w-full lg:w-64 space-y-6 p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Bộ lọc đa tiêu chí</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Transaction Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Hình thức giao dịch
        </label>
        <div className="space-y-1">
          {transactionTypes.map((type) => (
            <label
              key={type.id}
              className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer py-1"
            >
              <input
                type="radio"
                name="transactionType"
                checked={filters.transactionType === type.id}
                onChange={() => onChange({ ...filters, transactionType: type.id })}
                className="text-blue-600 focus:ring-blue-500 rounded"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span>Khoảng giá tối đa</span>
          </label>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {filters.maxPrice >= 1000000 ? 'Tất cả' : formatCurrency(filters.maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1000000"
          step="50000"
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>0đ (Tặng 0đ)</span>
          <span>500k</span>
          <span>1 triệu+</span>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-blue-600" />
          <span>Danh mục</span>
        </label>
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
          Tình trạng đồ dùng
        </label>
        <select
          value={filters.condition}
          onChange={(e) => onChange({ ...filters, condition: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
        >
          {conditions.map((cond) => (
            <option key={cond.id} value={cond.id}>
              {cond.label}
            </option>
          ))}
        </select>
      </div>

      {/* Campus Location */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Cơ sở / KTX lân cận</span>
        </label>
        <select
          value={filters.campus}
          onChange={(e) => onChange({ ...filters, campus: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
        >
          {campuses.map((camp) => (
            <option key={camp.id} value={camp.id}>
              {camp.label}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2 text-center text-xs text-slate-400">
        Hiển thị <b>{totalResults}</b> món đồ phù hợp
      </div>
    </aside>
  );
};
