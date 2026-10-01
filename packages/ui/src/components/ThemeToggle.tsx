'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../theme/ThemeContext';

export interface ThemeToggleProps {
  variant?: 'segmented' | 'dropdown' | 'compact';
  className?: string;
}

const SunIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const LaptopIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: Theme; label: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: 'Modo Día (Claro)',
      icon: <SunIcon className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'dark',
      label: 'Modo Noche (Oscuro)',
      icon: <MoonIcon className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'system',
      label: 'Automático (Sistema)',
      icon: <LaptopIcon className="w-4 h-4 text-slate-400" />,
    },
  ];

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold ${className}`}
      >
        {options.map((opt) => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
              }`}
              title={opt.label}
              aria-label={opt.label}
            >
              <span className="shrink-0">{opt.icon}</span>
              <span className="hidden sm:inline">{opt.label.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact circular toggle that rotates between light and dark
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-sm ${className}`}
        title={`Cambiar a modo ${resolvedTheme === 'dark' ? 'día' : 'noche'}`}
        aria-label="Cambiar tema visual"
      >
        {resolvedTheme === 'dark' ? (
          <MoonIcon className="w-4 h-4 text-blue-400 transition-transform hover:scale-110" />
        ) : (
          <SunIcon className="w-4 h-4 text-amber-500 transition-transform hover:scale-110" />
        )}
      </button>
    );
  }

  // Default: Dropdown selector (Light / Dark / System)
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
        aria-expanded={open}
        aria-label="Selector de tema visual"
      >
        <span className="shrink-0">
          {theme === 'system' ? (
            <LaptopIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          ) : resolvedTheme === 'dark' ? (
            <MoonIcon className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <SunIcon className="w-3.5 h-3.5 text-amber-500" />
          )}
        </span>
        <span className="hidden sm:inline">
          {theme === 'light' ? 'Día' : theme === 'dark' ? 'Noche' : 'Auto'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80 mb-1">
            Apariencia Visual
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0">{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
                {isSelected && <CheckIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
