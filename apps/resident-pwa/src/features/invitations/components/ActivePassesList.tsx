'use client';

import React, { useState, useMemo } from 'react';
import { Share2, Trash2, Calendar, QrCode, Plus, Check, Clock, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { VisitorPass } from '../../../types';

interface ActivePassesListProps {
  passes: VisitorPass[];
  onOpenNewInvite: () => void;
  onSharePass: (pass: VisitorPass) => void;
  onRevokePass: (id: string) => void;
  shareMessage: string | null;
  errorMessage?: string | null;
  isLoading?: boolean;
}

type FilterTab = 'ALL' | 'ACTIVE' | 'HISTORY';

export const ActivePassesList: React.FC<ActivePassesListProps> = ({
  passes,
  onOpenNewInvite,
  onSharePass,
  onRevokePass,
  shareMessage,
  errorMessage,
  isLoading,
}) => {
  const [tab, setTab] = useState<FilterTab>('ACTIVE');

  const activeCount = useMemo(() => passes.filter((p) => p.status === 'ACTIVE').length, [passes]);
  const historyCount = useMemo(() => passes.filter((p) => p.status !== 'ACTIVE').length, [passes]);

  const filteredPasses = useMemo(() => {
    if (tab === 'ACTIVE') return passes.filter((p) => p.status === 'ACTIVE');
    if (tab === 'HISTORY') return passes.filter((p) => p.status !== 'ACTIVE');
    return passes;
  }, [passes, tab]);

  return (
    <div className="mx-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 font-heading">
            Pases de Visitas
          </h3>
          <p className="text-[11px] text-slate-400">
            {activeCount} activo(s) · {historyCount} en historial
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewInvite}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Pase</span>
        </button>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-3 text-xs">
        <button
          type="button"
          onClick={() => setTab('ACTIVE')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
            tab === 'ACTIVE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Vigentes ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setTab('HISTORY')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
            tab === 'HISTORY'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Historial / Usados ({historyCount})
        </button>
        <button
          type="button"
          onClick={() => setTab('ALL')}
          className={`py-1.5 px-2.5 rounded-lg font-bold transition-all text-center ${
            tab === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({passes.length})
        </button>
      </div>

      {shareMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{shareMessage}</span>
        </div>
      )}

      {errorMessage && <div role="alert" className="mb-3 rounded-xl border border-rose-700 bg-rose-950 px-3 py-2 text-xs text-rose-200">{errorMessage}</div>}

      {isLoading ? (
        <p className="p-6 text-center text-xs text-slate-400">Cargando pases...</p>
      ) : filteredPasses.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
          <QrCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold">
            {tab === 'ACTIVE'
              ? 'No tienes pases de visita vigentes'
              : tab === 'HISTORY'
              ? 'No hay pases usados o vencidos en el historial'
              : 'No hay pases registrados'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {tab === 'ACTIVE' && 'Genera un nuevo pase para autorizar el acceso de tus visitantes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPasses.map((pass) => {
            const isActive = pass.status === 'ACTIVE';
            const isUsed = pass.status === 'USED';
            const isExpired = pass.status === 'EXPIRED';
            const isRevoked = pass.status === 'REVOKED';

            return (
              <div
                key={pass.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-white'
                    : 'bg-slate-950/80 border-slate-850 opacity-80 text-slate-300'
                } flex items-center justify-between gap-3`}
              >
                <div 
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSharePass(pass)}
                  title="Ver detalles del pase"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm truncate text-white">{pass.visitorName}</span>
                    
                    {/* Badge de Estado */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                          : isUsed
                          ? 'bg-blue-950/90 text-blue-300 border-blue-500/40'
                          : isExpired
                          ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                          : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isActive && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {isUsed && <Clock className="w-2.5 h-2.5" />}
                      {isExpired && <AlertCircle className="w-2.5 h-2.5" />}
                      {isRevoked && <Ban className="w-2.5 h-2.5" />}
                      <span>{isActive ? 'Vigente' : isUsed ? 'Usado' : isExpired ? 'Vencido' : 'Cancelado'}</span>
                    </span>

                    {/* Badge de Tipo */}
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                      {pass.passType === 'SINGLE_USE' ? '1 Uso' : pass.passType === 'TEMPORARY' ? 'Temporal' : 'Frecuente'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>
                      {isUsed && pass.usedAt
                        ? `Usado: ${new Date(pass.usedAt).toLocaleString('es-MX')}`
                        : isExpired
                        ? `Venció: ${new Date(pass.validUntil).toLocaleString('es-MX')}`
                        : `Vence: ${new Date(pass.validUntil).toLocaleDateString('es-MX')}`}
                    </span>
                    {pass.notes && (
                      <span className="text-slate-500 truncate">• {pass.notes}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSharePass(pass)}
                    title={isActive ? 'Compartir pase o tarjeta QR' : 'Ver detalle del pase'}
                    aria-label={`Ver pase de ${pass.visitorName}`}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => onRevokePass(pass.id)}
                      title="Revocar pase de acceso"
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-slate-700 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
