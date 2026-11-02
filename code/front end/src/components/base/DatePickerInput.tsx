import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DatePickerInputProps {
  label?: string;
  value: string; // ISO format: 'YYYY-MM-DD'
  onChange: (isoDate: string) => void;
  minDate?: string; // ISO format 'YYYY-MM-DD', default today
  maxDate?: string; // ISO format 'YYYY-MM-DD'
  error?: string;
  className?: string;
  placeholder?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  error,
  className = '',
  placeholder = 'dd/mm/yyyy',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Parse ISO string to Date object (normalized to midnight)
  const parseIso = (isoStr?: string): Date | null => {
    if (!isoStr) return null;
    const parts = isoStr.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    const date = new Date(y, m, d);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Format Date object to 'YYYY-MM-DD'
  const toIso = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Format Date object to 'DD/MM/YYYY'
  const toDisplay = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  };

  // Get Today normalized
  const getToday = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const today = getToday();
  const min = minDate ? parseIso(minDate) || today : today;
  const max = maxDate ? parseIso(maxDate) : null;

  // Selected date
  const selectedDate = parseIso(value) || today;

  // Viewing month & year in calendar popup
  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth()); // 0-11

  // Typed text input (in DD/MM/YYYY)
  const [typedText, setTypedText] = useState<string>(toDisplay(selectedDate));
  const [inputError, setInputError] = useState<string | null>(null);

  // Sync typed text when value prop changes externally
  useEffect(() => {
    const parsed = parseIso(value);
    if (parsed) {
      setTypedText(toDisplay(parsed));
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      setInputError(null);
    }
  }, [value]);

  // Click outside listener to close calendar popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle typing in input directly (DD/MM/YYYY)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    setTypedText(raw);

    // Validate DD/MM/YYYY format
    const parts = raw.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);

      if (!isNaN(d) && !isNaN(m) && !isNaN(y) && y >= 2024 && y <= 2040 && m >= 0 && m <= 11) {
        const candidate = new Date(y, m, d);
        candidate.setHours(0, 0, 0, 0);

        if (
          candidate.getFullYear() === y &&
          candidate.getMonth() === m &&
          candidate.getDate() === d
        ) {
          if (candidate < min) {
            setInputError(`Không thể chọn ngày trong quá khứ (tối thiểu ${toDisplay(min)})`);
            return;
          }
          if (max && candidate > max) {
            setInputError(`Không được vượt quá ngày ${toDisplay(max)}`);
            return;
          }
          setInputError(null);
          onChange(toIso(candidate));
          setViewYear(y);
          setViewMonth(m);
          return;
        }
      }
    }
  };

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Select a day from calendar grid
  const handleSelectDay = (day: number) => {
    const target = new Date(viewYear, viewMonth, day);
    target.setHours(0, 0, 0, 0);

    if (target < min) return; // Disallow past dates
    if (max && target > max) return;

    setInputError(null);
    setTypedText(toDisplay(target));
    onChange(toIso(target));
    setIsOpen(false);
  };

  // Quick select helper
  const handleQuickSelect = (offsetDays: number) => {
    const target = new Date(today);
    target.setDate(target.getDate() + offsetDays);
    target.setHours(0, 0, 0, 0);

    if (target < min) return;
    setInputError(null);
    setTypedText(toDisplay(target));
    onChange(toIso(target));
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  // Calculate days in month and Monday-based offset
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun, 1 is Mon
  const mondayOffset = (firstDayOfWeek + 6) % 7; // 0 for Mon, 6 for Sun

  // Check if viewing previous month is allowed
  const canGoPrevMonth = () => {
    const firstOfViewMonth = new Date(viewYear, viewMonth, 1);
    const minFirstOfMonth = new Date(min.getFullYear(), min.getMonth(), 1);
    return firstOfViewMonth > minFirstOfMonth;
  };

  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  return (
    <div ref={containerRef} className={`relative text-left ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Input row */}
      <div className="relative">
        <input
          type="text"
          value={typedText}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          maxLength={10}
          className={`w-full pl-3 pr-9 py-2 rounded-xl border bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white transition-all shadow-xs focus:outline-none focus:ring-2 ${
            inputError || error
              ? 'border-rose-400 focus:ring-rose-500/20'
              : 'border-purple-200 dark:border-purple-800/80 hover:border-purple-400 focus:ring-purple-500/20'
          }`}
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400 hover:text-purple-700 p-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
          title="Mở lịch chọn ngày"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Error message */}
      {(inputError || error) && (
        <p className="text-[10px] text-rose-500 font-medium mt-1">
          {inputError || error}
        </p>
      )}

      {/* Mini Calendar Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 sm:left-auto right-auto w-[280px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrevMonth()}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {monthNames[viewMonth]}, {viewYear}
              </span>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center text-[10px] font-bold text-slate-400">
            <div>T2</div>
            <div>T3</div>
            <div>T4</div>
            <div>T5</div>
            <div>T6</div>
            <div>T7</div>
            <div className="text-rose-500">CN</div>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Monday offset padding */}
            {Array.from({ length: mondayOffset }).map((_, idx) => (
              <div key={`pad-${idx}`} className="h-7 w-7" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateObj = new Date(viewYear, viewMonth, dayNum);
              dateObj.setHours(0, 0, 0, 0);

              const isPast = dateObj < min;
              const isFutureMax = max ? dateObj > max : false;
              const isDisabled = isPast || isFutureMax;

              const isSelected =
                selectedDate &&
                dateObj.getFullYear() === selectedDate.getFullYear() &&
                dateObj.getMonth() === selectedDate.getMonth() &&
                dateObj.getDate() === selectedDate.getDate();

              const isToday =
                dateObj.getFullYear() === today.getFullYear() &&
                dateObj.getMonth() === today.getMonth() &&
                dateObj.getDate() === today.getDate();

              return (
                <button
                  key={dayNum}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    isDisabled
                      ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                      : isSelected
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : isToday
                      ? 'border border-purple-400 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-50'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                  }`}
                  title={isDisabled ? 'Không được chọn ngày trong quá khứ' : toDisplay(dateObj)}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick shortcuts at bottom */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSelect(0)}
                className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-100"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(1)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
              >
                Ngày mai
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(3)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
              >
                +3 ngày
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title="Đóng lịch"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

