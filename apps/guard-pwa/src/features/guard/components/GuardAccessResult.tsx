'use client';

import { useEffect, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
  XCircle,
  User,
  Home,
  UserCheck,
  BellRing,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@dommia/ui';
import { notificationText, reasonText } from '../guard-utils';
import type { ResultState } from '../types';

interface GuardAccessResultProps {
  result: ResultState;
  isOnline: boolean;
  manualJustification: string;
  onManualJustificationChange: (value: string) => void;
  manualOverrideBusy: boolean;
  manualOverrideError: string;
  onManualOverride: (event: FormEvent<HTMLFormElement>) => void;
  onNext: () => void;
}

export function GuardAccessResult({
  result,
  isOnline,
  manualJustification,
  onManualJustificationChange,
  manualOverrideBusy,
  manualOverrideError,
  onManualOverride,
  onNext,
}: GuardAccessResultProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !manualOverrideBusy) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, manualOverrideBusy]);

  const kind = result.kind;
  const isAuth = kind === 'authorized';
  const isDenied = kind === 'denied';
  const isReview = kind === 'review';

  const theme = isAuth
    ? {
        border: 'border-emerald-500/70 shadow-emerald-950/70',
        glow: 'from-emerald-950/80 via-slate-900 to-slate-950',
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        titleColor: 'text-emerald-300',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 focus:ring-emerald-400',
        statusLabel: 'ACCESO PERMITIDO',
        title: 'Acceso Autorizado',
        Icon: CheckCircle2,
      }
    : isDenied
    ? {
        border: 'border-rose-500/70 shadow-rose-950/70',
        glow: 'from-rose-950/80 via-slate-900 to-slate-950',
        badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
        titleColor: 'text-rose-300',
        buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/60 focus:ring-rose-400',
        statusLabel: 'ACCESO DENEGADO',
        title: 'Acceso Denegado',
        Icon: XCircle,
      }
    : isReview
    ? {
        border: 'border-amber-500/70 shadow-amber-950/70',
        glow: 'from-amber-950/80 via-slate-900 to-slate-950',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
        titleColor: 'text-amber-300',
        buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60 focus:ring-amber-400',
        statusLabel: 'REVISIÓN REQUERIDA',
        title: 'Revisión Manual Requerida',
        Icon: AlertTriangle,
      }
    : {
        border: 'border-slate-500/70 shadow-slate-950/70',
        glow: 'from-slate-800/80 via-slate-900 to-slate-950',
        badgeBg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
        iconBg: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
        titleColor: 'text-slate-100',
        buttonClass: 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-950/60 focus:ring-slate-400',
        statusLabel: 'VERIFICACIÓN FALLIDA',
        title: 'No se pudo confirmar',
        Icon: HelpCircle,
      };

  const StatusIcon = theme.Icon;
  const data = result.data;

  const explanation = isReview
    ? reasonText(data?.reason || 'PROPERTY_DELINQUENT')
    : isAuth
    ? data?.manualOverride
      ? 'Acceso autorizado por excepción con justificación registrada.'
      : data?.manualAccess
      ? 'Acceso manual autorizado por llamada. INE verificada y evento auditado.'
      : 'La credencial es válida para esta visita.'
    : result.message || reasonText(data?.reason);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guard-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !manualOverrideBusy) onNext();
      }}
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl border-2 ${theme.border} bg-gradient-to-b ${theme.glow} shadow-2xl p-6 sm:p-8 text-white my-auto overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onNext}
          disabled={manualOverrideBusy}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 pb-6 border-b border-slate-700/60">
          <div className={`p-4 rounded-2xl border-2 ${theme.iconBg} shadow-inner shrink-0`}>
            <StatusIcon className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border mb-2 ${theme.badgeBg}`}>
              {theme.statusLabel}
            </span>
            <h2 id="guard-modal-title" className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${theme.titleColor}`}>
              {theme.title}
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              {explanation}
            </p>
            {isAuth && data?.notificationStatus && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                <BellRing className="w-3.5 h-3.5" />
                <span>{notificationText(data.notificationStatus)}</span>
              </div>
            )}
          </div>
        </div>

        {data && (
          <div className="py-6 border-b border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
            {data.visitorName && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Visitante / Residente
                </span>
                <p className="text-base font-bold text-white truncate">{data.visitorName}</p>
              </div>
            )}

            {(data.propertyAddress || data.propertyId) && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  <Home className="w-3.5 h-3.5 text-slate-400" /> Propiedad Destino
                </span>
                <p className="text-base font-bold text-white truncate">{data.propertyAddress || data.propertyId}</p>
              </div>
            )}

            {data.hostName && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Anfitrión
                </span>
                <p className="text-base font-bold text-white truncate">{data.hostName}</p>
              </div>
            )}

            {data.manualAccess && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Método de Entrada
                </span>
                <p className="text-sm font-semibold text-blue-300">Sin QR · Llamada confirmada</p>
              </div>
            )}

            {data.justification && (
              <div className="sm:col-span-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
                  Justificación Registrada
                </span>
                <p className="text-sm text-slate-200">{data.justification}</p>
              </div>
            )}

            {isDenied && data.reason && (
              <div className="sm:col-span-2 bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5">
                <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1 block">
                  Causa del Rechazo
                </span>
                <p className="text-sm font-bold text-rose-200">{reasonText(data.reason)}</p>
              </div>
            )}
          </div>
        )}

        {isReview && data?.manualOverrideToken && (
          <form className="py-6 border-b border-slate-700/60 space-y-3" onSubmit={onManualOverride}>
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Excepción por contingencia
              </h3>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                La propiedad tiene adeudo. Si autorizas el ingreso excepcional, registra el motivo fundado (mín. 20 caracteres); el evento quedará auditado.
              </p>
            </div>
            <div>
              <label htmlFor="manual-override-justification" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Justificación obligatoria *
              </label>
              <textarea
                id="manual-override-justification"
                minLength={20}
                maxLength={500}
                required
                value={manualJustification}
                onChange={(e) => onManualJustificationChange(e.target.value)}
                placeholder="Ej. Ingreso de servicio médico autorizado por administración..."
                disabled={manualOverrideBusy || !isOnline}
                rows={3}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {manualOverrideError && (
              <p className="text-xs text-rose-400 font-semibold" role="alert">
                {manualOverrideError}
              </p>
            )}
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={manualOverrideBusy || !isOnline || manualJustification.trim().length < 20}
              isLoading={manualOverrideBusy}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 text-base rounded-xl"
            >
              Autorizar y registrar excepción
            </Button>
          </form>
        )}

        <div className="pt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onNext}
            disabled={!isOnline || manualOverrideBusy}
            autoFocus
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-lg sm:text-xl shadow-lg transition-all duration-150 flex items-center justify-center gap-2.5 active:scale-[0.98] focus:outline-none focus:ring-4 ${theme.buttonClass}`}
          >
            {isAuth ? (
              <>
                <CheckCircle2 className="w-6 h-6" />
                <span>Aceptar y Continuar</span>
              </>
            ) : isDenied ? (
              <>
                <XCircle className="w-6 h-6" />
                <span>Aceptar</span>
              </>
            ) : (
              <span>Aceptar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}