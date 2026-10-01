'use client';

import React from 'react';
import { ArrowRight, Home, Sparkles } from 'lucide-react';
import { TierInfo } from '../../../types';
import { Button } from '@dommia/ui';

interface HousesSliderProps {
  houses: number;
  tierInfo: TierInfo;
  onHousesChange: (houses: number) => void;
  onApplyTier: () => void;
}

export const HousesSlider: React.FC<HousesSliderProps> = ({
  houses,
  tierInfo,
  onHousesChange,
  onApplyTier,
}) => {
  const presets = [35, 90, 220, 380];
  const percentage = Math.round(((houses - 15) / (450 - 15)) * 100);

  return (
    <div className="lg:col-span-5 p-7 sm:p-9 rounded-3xl bg-white/95 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/80 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
            Dimensión de tu Fraccionamiento
          </span>
        </div>

        {/* Symmetrical Counter Display */}
        <div className="my-4 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-baseline gap-2.5">
            <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white font-heading tracking-tight drop-shadow-sm tabular-nums">
              {houses}
            </span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Viviendas
            </span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium bg-white dark:bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            Casas o departamentos
          </span>
        </div>

        <div className="relative pt-2 pb-1">
          <input
            id="house-slider"
            type="range"
            min="15"
            max="450"
            step="5"
            value={houses}
            onChange={(e) => onHousesChange(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #2563EB 0%, #3B82F6 ${percentage}%, #CBD5E1 ${percentage}%, #CBD5E1 100%)`,
            }}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all accent-blue-600"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
          <span>15 casas</span>
          <span>100</span>
          <span>250</span>
          <span>450+ casas</span>
        </div>
      </div>

      <div className="pt-5 border-t border-slate-200 dark:border-slate-800/80">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Selección Rápida:
        </p>
        <div className="grid grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onHousesChange(preset)}
              className={`py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                houses === preset
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 border border-blue-400/40'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {preset} v.
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 shadow-inner">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
          Inversión mensual estimada:
        </p>
        {tierInfo.isCustom ? (
          <div>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-heading">Cotización Especial</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Diseñado a medida según casetas, carriles e integración RFID</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
                ${tierInfo.priceMonthly.toLocaleString('es-MX')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">MXN / Mes + IVA</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                ≈ ${tierInfo.pricePerHouse} MXN mensuales por casa o lote
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onApplyTier}
        className="mt-6 w-full group !py-4 font-bold text-sm shadow-xl shadow-blue-600/25 cursor-pointer"
        rightIcon={<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
      >
        Solicitar Demostración con este Plan
      </Button>
    </div>
  );
};
