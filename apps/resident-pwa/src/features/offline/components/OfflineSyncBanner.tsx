'use client';

import React from 'react';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTime: string;
  onSyncNow: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  pendingSyncCount,
  lastSyncTime,
  onSyncNow,
}) => {
  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div
      className={`mx-4 mb-4 p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-lg transition-all ${
        !isOnline
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {!isOnline ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <Database className="w-4 h-4 text-blue-400 shrink-0" />
        )}
        <div className="truncate">
          <p className="font-bold leading-tight">
            {!isOnline ? 'Operando en Modo Desconectado' : 'Sincronizando con Servidor'}
          </p>
          <p className="text-[11px] opacity-80 truncate">
            {!isOnline
              ? 'Tus códigos QR e invitaciones se generan desde la memoria local IndexedDB.'
              : `${pendingSyncCount} cambio(s) pendiente(s) • Última sincronización: ${lastSyncTime}`}
          </p>
        </div>
      </div>

      {isOnline && pendingSyncCount > 0 && (
        <button
          type="button"
          onClick={onSyncNow}
          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Sincronizar</span>
        </button>
      )}
    </div>
  );
};
