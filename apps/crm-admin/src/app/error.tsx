'use client';

import React, { useEffect } from 'react';
import { parseClientError } from '@dommia/ui';
import { AlertOctagon, RefreshCw, ArrowLeft } from 'lucide-react';

export default function CrmAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CRM Admin Error Boundary captured:', error);
  }, [error]);

  const errorState = parseClientError(error, 'No fue posible cargar el módulo solicitado en el CRM.');

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      <div className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block">
            CRM Central
          </span>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            {errorState.title}
          </h1>
          <p className="text-xs leading-relaxed text-slate-600">
            {errorState.description}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>

          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="py-2.5 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </button>
        </div>
      </div>
    </main>
  );
}
