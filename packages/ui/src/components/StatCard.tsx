import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'white' | 'dark' | 'glass';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'white',
  className = '',
}) => {
  const isDark = variant === 'dark' || variant === 'glass';

  const containerStyles =
    variant === 'dark'
      ? 'bg-slate-900/90 border border-slate-800 text-white shadow-lg shadow-black/20'
      : variant === 'glass'
      ? 'bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 text-white shadow-xl'
      : 'bg-white border border-slate-200/80 text-slate-900 shadow-card hover:shadow-card-hover';

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between ${containerStyles} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-black font-heading tracking-tight mt-1 truncate">
            {value}
          </p>
        </div>

        {icon && (
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                : 'bg-blue-50 border border-blue-100 text-blue-600'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100/10 flex items-center justify-between gap-2 text-xs">
          {subtitle && (
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
