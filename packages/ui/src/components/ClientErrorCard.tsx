import React from 'react';
import { ClientErrorState } from '../errors/parseClientError';

export interface ClientErrorCardProps {
  error: ClientErrorState | string | null;
  onRetry?: () => void;
  className?: string;
  variant?: 'banner' | 'card';
}

export function ClientErrorCard({
  error,
  onRetry,
  className = '',
  variant = 'card',
}: ClientErrorCardProps) {
  if (!error) return null;

  const errorState: ClientErrorState =
    typeof error === 'string'
      ? {
          title: 'Aviso del sistema',
          description: error,
          actionText: onRetry ? 'Reintentar' : undefined,
          type: 'validation',
        }
      : error;

  const isNetwork = errorState.type === 'network';
  const isAuth = errorState.type === 'auth' || errorState.type === 'permission';

  const badgeBg = isNetwork
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : isAuth
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : 'bg-rose-100 text-rose-800 border-rose-200';

  const cardBorder = isNetwork
    ? 'border-amber-200 bg-amber-50/60'
    : isAuth
    ? 'border-blue-200 bg-blue-50/60'
    : 'border-rose-200 bg-rose-50/60';

  if (variant === 'banner') {
    return (
      <div className={`p-4 rounded-xl border ${cardBorder} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left ${className}`}>
        <div className="flex items-start gap-2.5 min-w-0">
          <span className={`p-1.5 rounded-lg border text-xs font-bold ${badgeBg} shrink-0 mt-0.5`}>
            {isNetwork ? '⚠️ Red' : isAuth ? '🔒 Acceso' : '⚠️ Atención'}
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-900">{errorState.title}</h5>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{errorState.description}</p>
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            {errorState.actionText || 'Reintentar'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl border ${cardBorder} shadow-sm space-y-4 max-w-lg mx-auto text-left ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl border ${badgeBg} shrink-0`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="text-sm font-extrabold text-slate-900">{errorState.title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed">{errorState.description}</p>
        </div>
      </div>

      {onRetry && (
        <div className="flex justify-end pt-1">
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{errorState.actionText || 'Reintentar'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
