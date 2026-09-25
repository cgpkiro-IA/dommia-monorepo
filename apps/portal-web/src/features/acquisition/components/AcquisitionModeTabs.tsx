'use client';

import React from 'react';
import { Phone, Zap } from 'lucide-react';
import { AcquisitionMode } from '../../../types';

interface AcquisitionModeTabsProps {
  activeMode: AcquisitionMode;
  onModeChange: (mode: AcquisitionMode) => void;
}

export const AcquisitionModeTabs: React.FC<AcquisitionModeTabsProps> = ({
  activeMode,
  onModeChange,
}) => {
  return (
    <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
      <button
        type="button"
        onClick={() => onModeChange('demo')}
        className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
          activeMode === 'demo'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Phone className="w-4 h-4" />
        <span>Solicitar Demostración Guiada</span>
      </button>

      <button
        type="button"
        onClick={() => onModeChange('self_service')}
        className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
          activeMode === 'self_service'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Zap className="w-4 h-4" />
        <span>Contratar y Activar de Inmediato</span>
      </button>
    </div>
  );
};
