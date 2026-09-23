import React from 'react';
import { ShieldCheck, ShieldAlert, Award } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KarmaBadgeProps {
  score: number;
  showText?: boolean;
  className?: string;
}

export const KarmaBadge: React.FC<KarmaBadgeProps> = ({ score, showText = true, className }) => {
  const getBadgeConfig = (score: number) => {
    if (score >= 50) {
      return {
        label: 'Sinh viên uy tín cao',
        icon: <Award className="w-4 h-4 text-amber-500" />,
        badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      };
    }
    if (score >= 20) {
      return {
        label: 'Sinh viên đã xác thực',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      };
    }
    return {
      label: 'Cần xác thực thêm',
      icon: <ShieldAlert className="w-4 h-4 text-slate-400" />,
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    };
  };

  const config = getBadgeConfig(score);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        config.badgeClass,
        className
      )}
      title={`${config.label} (${score} Karma)`}
    >
      {config.icon}
      <span>{score} Karma</span>
      {showText && <span className="hidden sm:inline font-normal">| {config.label}</span>}
    </span>
  );
};
