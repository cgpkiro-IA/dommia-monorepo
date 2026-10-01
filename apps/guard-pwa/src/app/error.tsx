'use client';

import React, { useEffect } from 'react';
import { parseClientError } from '@dommia/ui';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

export default function GuardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log privately to console for dev debugging without exposing to UI
    console.error('Guard Error Boundary captured:', error);
  }, [error]);

  const errorState = parseClientError(error, 'Ocurrió un inconveniente temporal en la terminal de caseta.');

  return (
    <main className="min-h-screen bg-[#08111f] flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80">
            {errorState.type === 'network' ? 'Problema de Conexión' : 'Servicio en Caseta'}
          </span>
          <h1 className="text-xl font-black font-heading text-white">
            {errorState.title}
          </h1>
          <p className="text-xs leading-relaxed text-slate-400">
            {errorState.description}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/40"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar operación</span>
          </button>

          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="w-full py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Volver a pantalla de acceso</span>
          </button>
        </div>
      </div>
    </main>
  );
}
