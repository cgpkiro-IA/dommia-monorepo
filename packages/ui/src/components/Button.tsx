import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'dark-outline' | 'danger' | 'ghost' | 'glass' | 'emerald' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer active:scale-[0.98] whitespace-nowrap flex-nowrap shrink-0';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 gap-1.5 font-semibold rounded-xl',
    md: 'text-sm px-4 py-2.5 gap-2 font-semibold rounded-xl',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-bold rounded-2xl',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 focus:ring-blue-500 border border-blue-400/30',
    secondary:
      'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white focus:ring-slate-900 shadow-sm border border-slate-800 dark:border-slate-200',
    outline:
      'border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-950 dark:hover:text-white focus:ring-slate-400 shadow-xs',
    'dark-outline':
      'border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 backdrop-blur-xs text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 focus:ring-slate-500 shadow-sm',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-900/30 focus:ring-rose-500 border border-rose-500/30',
    emerald:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 focus:ring-emerald-500 border border-emerald-500/30',
    success:
      'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-900/30 focus:ring-emerald-500 border border-emerald-400/30',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:ring-slate-300',
    glass:
      'bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/15 dark:hover:bg-white/15 backdrop-blur-md text-slate-900 dark:text-white border border-slate-900/10 dark:border-white/15 focus:ring-blue-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      )}
      <span className="inline-flex items-center">{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
    </button>
  );
};

