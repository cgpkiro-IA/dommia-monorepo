'use client';

import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectivityBadgeProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulate: () => void;
}

export const ConnectivityBadge: React.FC<ConnectivityBadgeProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulate,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all ${
          isOnline
            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-900/20'
            : 'bg-amber-950/80 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-900/20 animate-pulse'
        }`}
      >
        {isOnline ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <Wifi className="w-3 h-3" />
            <span>En Línea</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Modo Offline</span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleSimulate}
        title="Simular pérdida de señal para probar operación sin internet"
        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
          isSimulatedOffline
            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
        }`}
      >
        {isSimulatedOffline ? 'Reconectar' : 'Simular Offline'}
      </button>
    </div>
  );
};
