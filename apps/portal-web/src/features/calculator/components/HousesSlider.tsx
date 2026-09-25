'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TierInfo } from '../../../types';

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

  return (
    <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
      <div className="mb-6">
        <label htmlFor="house-slider" className="block text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
          ¿Cuántas casas o departamentos tiene tu comunidad?
        </label>

        <div className="flex items-baseline gap-3 mt-4 mb-6">
          <span className="text-5xl sm:text-6xl font-black text-white font-heading tracking-tight">
            {houses}
          </span>
          <span className="text-slate-400 font-medium text-lg">viviendas</span>
        </div>

        <input
          id="house-slider"
          type="range"
          min="15"
          max="450"
          step="5"
          value={houses}
          onChange={(e) => onHousesChange(Number(e.target.value))}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all"
        />

        <div className="flex justify-between items-center text-xs text-slate-400 mt-3 font-mono">
          <span>15 casas</span>
          <span>100 casas</span>
          <span>250 casas</span>
          <span>450+ casas</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Selección Rápida de Comunidad:
        </p>
        <div className="grid grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onHousesChange(preset)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                houses === preset
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {preset} v.
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <p className="text-xs text-slate-400 font-medium mb-1">Inversión mensual estimada:</p>
        {tierInfo.isCustom ? (
          <div>
            <p className="text-2xl font-extrabold text-blue-400 font-heading">Cotización Especial</p>
            <p className="text-xs text-slate-400 mt-1">Diseñado a medida según casetas y carriles</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-heading">
                ${tierInfo.priceMonthly.toLocaleString('es-MX')}
              </span>
              <span className="text-xs text-slate-400 uppercase">MXN / Mes + IVA</span>
            </div>
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              ≈ ${tierInfo.pricePerHouse} MXN mensuales por casa
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onApplyTier}
        className="mt-6 w-full py-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Solicitar Demostración con este Plan</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
