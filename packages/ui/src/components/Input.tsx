import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'dark';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      variant = 'default',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const hasError = Boolean(error);

    const isDark = variant === 'dark';

    const baseInputStyles =
      'w-full rounded-xl text-sm transition-all duration-150 outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = isDark
      ? `bg-slate-950/80 border text-white placeholder-slate-500 ${
          hasError
            ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
            : 'border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`
      : `bg-white border text-slate-900 placeholder-slate-400 ${
          hasError
            ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
            : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`;

    const paddingStyles = leftIcon && rightIcon
      ? 'pl-10 pr-10 py-2.5'
      : leftIcon
      ? 'pl-10 pr-3.5 py-2.5'
      : rightIcon
      ? 'pl-3.5 pr-10 py-2.5'
      : 'px-3.5 py-2.5';

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-xs font-bold tracking-wide ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div
              className={`absolute left-3.5 flex items-center justify-center pointer-events-none ${
                isDark ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`${baseInputStyles} ${variantStyles} ${paddingStyles} ${className}`}
            aria-invalid={hasError}
            {...props}
          />

          {rightIcon && (
            <div
              className={`absolute right-3.5 flex items-center justify-center ${
                isDark ? 'text-slate-400' : 'text-slate-400'
              }`}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] font-medium text-rose-500">{error}</p>
        ) : helperText ? (
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
