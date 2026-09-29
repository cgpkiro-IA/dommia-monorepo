'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar...',
  className = '',
  id,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans ${className}`}
      id={id}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
          disabled
            ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            : isOpen
            ? 'bg-slate-900 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
            : 'bg-[#0F172A] border-slate-700 text-slate-100 hover:border-slate-600 hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center text-slate-400">
              {selectedOption.icon}
            </span>
          )}
          <span className="text-sm font-semibold truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                selectedOption.badgeColor || 'bg-slate-800 text-slate-300'
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-700/90 bg-[#0F172A] shadow-2xl shadow-black/80 py-1.5 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value || 'all-empty'}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {option.icon && (
                    <span
                      className={`shrink-0 flex items-center ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {option.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : option.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
