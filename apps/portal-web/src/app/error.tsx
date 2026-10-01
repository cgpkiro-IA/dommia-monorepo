'use client';

import React, { useEffect } from 'react';
import { parseClientError } from '@dommia/ui';
import { Globe, RefreshCw, Home } from 'lucide-react';

export default function PortalWebError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portal Web Error Boundary captured:', error);
  }, [error]);

  const errorState = parseClientError(error, 'La página solicitada no está disponible temporalmente.');

  return (
    <main className="min-h-screen bg-[#070D18] flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Globe className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
            DOMMIA
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
            <span>Reintentar</span>
          </button>

          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="w-full py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Volver al portal</span>
          </button>
        </div>
      </div>
    </main>
  );
}
