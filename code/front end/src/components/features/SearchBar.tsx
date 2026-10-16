import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  popularKeywords?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Tìm giáo trình, mã học phần (CS50, IT3010), máy tính...',
  popularKeywords = [
    'Giải tích 1',
    'Casio fx-580',
    'Bàn phím cơ',
    'Ấm đun siêu tốc',
    'KTX B5',
    'Áo cử nhân',
  ],
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Debounce 300ms (AC1)
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(internalValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [internalValue, onChange]);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <div className="w-full space-y-2">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-xs"
        />
        {internalValue && (
          <button
            type="button"
            onClick={() => setInternalValue('')}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Xóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Suggested keywords / Quick pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
        <span className="text-slate-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý:
        </span>
        {popularKeywords.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => setInternalValue(kw)}
            className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors whitespace-nowrap"
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
};
