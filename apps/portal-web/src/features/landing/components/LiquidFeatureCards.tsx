'use client';

import React, { useState } from 'react';
import { Radio, Car, CreditCard, Lock, Sparkles } from 'lucide-react';

interface MetricItem {
  id: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  description: string;
  colorName: 'emerald' | 'blue' | 'amber' | 'cyan';
  accentColor: string;
  glowGradient: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  valueColor: string;
}

const metrics: MetricItem[] = [
  {
    id: 'offline',
    badge: 'Offline-First Real',
    icon: Radio,
    value: '100%',
    description: 'Plumas operativas aún sin internet en caseta (SQLite local)',
    colorName: 'emerald',
    accentColor: '#10B981',
    glowGradient: 'from-emerald-500/25 via-emerald-500/10 to-transparent',
    cardBorder: 'border-emerald-500/50 dark:border-emerald-500/60',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-500/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    valueColor: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
  },
  {
    id: 'access',
    badge: 'Acceso Vehicular',
    icon: Car,
    value: '< 0.3s',
    description: 'Lectura instantánea de tags RFID UHF sin bajar la ventana',
    colorName: 'blue',
    accentColor: '#2563EB',
    glowGradient: 'from-blue-500/25 via-blue-500/10 to-transparent',
    cardBorder: 'border-blue-500/50 dark:border-blue-500/60',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-500/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    valueColor: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
  },
  {
    id: 'finance',
    badge: 'Finanzas y Cuotas',
    icon: CreditCard,
    value: 'Auto-Sync',
    description: 'Conciliación con Stripe y referencias bancarias SPEI',
    colorName: 'amber',
    accentColor: '#F59E0B',
    glowGradient: 'from-amber-500/25 via-amber-500/10 to-transparent',
    cardBorder: 'border-amber-500/50 dark:border-amber-500/60',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-500/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    valueColor: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
  },
  {
    id: 'security',
    badge: 'Seguridad de Datos',
    icon: Lock,
    value: 'Aislamiento',
    description: 'Esquemas de PostgreSQL 16 independientes por residencial',
    colorName: 'cyan',
    accentColor: '#06B6D4',
    glowGradient: 'from-cyan-500/25 via-cyan-500/10 to-transparent',
    cardBorder: 'border-cyan-500/50 dark:border-cyan-500/60',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-500/40',
    badgeText: 'text-cyan-700 dark:text-cyan-400',
    valueColor: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400',
  },
];

export const LiquidFeatureCards: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; cardIdx: number | null }>({
    x: 0,
    y: 0,
    cardIdx: null,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, idx: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      cardIdx: idx,
    });
  };

  const activeColor = metrics[activeIdx].accentColor;

  return (
    <div className="relative pt-8 mt-4 border-t border-slate-200 dark:border-slate-800/80">
      {/* Liquid Ambient Dynamic Glow behind active card */}
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-36 rounded-full blur-[100px] pointer-events-none transition-all duration-700 opacity-40 dark:opacity-60 -z-10"
        style={{
          background: `radial-gradient(circle, ${activeColor} 0%, transparent 70%)`,
        }}
      />

      {/* Grid of Liquid Interactive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 text-left relative">
        {metrics.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIdx === index;
          const isHovered = mousePos.cardIdx === index;

          return (
            <div
              key={item.id}
              onMouseEnter={() => setActiveIdx(index)}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={() => setMousePos({ x: 0, y: 0, cardIdx: null })}
              className={`group relative p-5 sm:p-5.5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl ${
                isActive
                  ? `bg-white/95 dark:bg-slate-900/90 ${item.cardBorder} shadow-xl -translate-y-1`
                  : 'bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
              style={{
                boxShadow: isActive
                  ? `0 12px 30px -8px ${item.accentColor}30, 0 4px 12px -2px ${item.accentColor}20`
                  : undefined,
              }}
            >
              {/* Liquid Radial Spotlight under cursor */}
              {isHovered && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-200 opacity-100"
                  style={{
                    background: `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, ${item.accentColor}25, transparent 75%)`,
                  }}
                />
              )}

              {/* Liquid Top Shimmer Wave Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-500 ${
                  isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'
                }`}
                style={{
                  background: `linear-gradient(90deg, transparent, ${item.accentColor}, transparent)`,
                }}
              />

              {/* Liquid Background Gradient Aura */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${item.glowGradient} transition-opacity duration-500 pointer-events-none ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <div className="relative z-10">
                {/* Header with pill & fluid indicator */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${item.badgeBg} ${item.badgeText}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.badge}</span>
                  </div>

                  {/* Liquid Active Dot */}
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive ? 'scale-125 animate-pulse' : 'scale-75 opacity-30'
                    }`}
                    style={{ backgroundColor: item.accentColor }}
                  />
                </div>

                {/* Primary Metric Stat */}
                <p
                  className={`text-2xl sm:text-3xl font-black font-heading tracking-tight transition-colors duration-200 mt-2 ${
                    isActive
                      ? 'text-slate-950 dark:text-white'
                      : 'text-slate-900 dark:text-slate-200'
                  } ${item.valueColor}`}
                >
                  {item.value}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
