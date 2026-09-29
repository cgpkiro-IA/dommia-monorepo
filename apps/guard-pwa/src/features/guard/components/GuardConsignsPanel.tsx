'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, CheckCircle2, AlertTriangle, RefreshCw, Clock, User, ShieldCheck } from 'lucide-react';
import { API_BASE } from '../guard-api';
import { parseClientError } from '@dommia/ui';

interface GuardNoticeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  target_audience: string;
  author_name: string;
  is_pinned: boolean;
  published_at: string;
  acknowledged_guards: { guard_id: string; guard_name: string; acknowledged_at: string }[];
  expires_at?: string;
}

interface GuardConsignsPanelProps {
  tenantSlug: string;
  token: string;
  isOnline: boolean;
}

export function GuardConsignsPanel({ tenantSlug, token, isOnline }: GuardConsignsPanelProps) {
  const [consigns, setConsigns] = useState<GuardNoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchConsigns = useCallback(async () => {
    if (!isOnline) {
      setError('La consulta de consignas requiere conexión a internet.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/tenants/${encodeURIComponent(tenantSlug)}/notices?audience=GUARDS`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        setConsigns(json.data || []);
      } else {
        const err = parseClientError(json || { status: res.status }, 'No se pudieron obtener las consignas de caseta.');
        setError(err.description);
      }
    } catch (err) {
      const parsed = parseClientError(err, 'No fue posible conectar con el servidor para obtener consignas.');
      setError(parsed.description);
    } finally {
      setLoading(false);
    }
  }, [isOnline, tenantSlug, token]);

  useEffect(() => {
    void fetchConsigns();
  }, [fetchConsigns]);

  const handleAcknowledge = async (noticeId: string) => {
    if (!isOnline) return;
    try {
      setAcknowledgingId(noticeId);
      const res = await fetch(`${API_BASE}/tenants/${encodeURIComponent(tenantSlug)}/notices/${noticeId}/acknowledge-guard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guardUserId: 'guard_active',
          guardName: 'Guardia en Caseta',
        }),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        setSuccessMsg('Consigna marcada como leída y confirmada.');
        setTimeout(() => setSuccessMsg(null), 3000);
        void fetchConsigns();
      }
    } catch {
      // Ignorar error transitorio
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <section className="space-y-4 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>Consignas y Directivas de Caseta</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-950 text-blue-300 border border-blue-800">
                {consigns.length} activas
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Instrucciones y comunicados operativos de la administración para el personal de seguridad.
            </p>
          </div>
        </div>

        <button
          onClick={fetchConsigns}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200">
          {error}
        </div>
      )}

      {loading && consigns.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
          <p className="text-xs font-medium">Consultando directivas de caseta...</p>
        </div>
      ) : consigns.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-200">Sin consignas pendientes</h4>
          <p className="text-xs text-slate-500">
            No hay directivas u órdenes de turno activas en este momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {consigns.map((consign) => {
            const isUrgent = consign.priority === 'URGENT' || consign.priority === 'HIGH';
            const isAcknowledged = consign.acknowledged_guards?.length > 0;

            const badgeBg = isUrgent
              ? 'bg-rose-950 text-rose-300 border-rose-600/60'
              : consign.priority === 'MEDIUM'
              ? 'bg-amber-950 text-amber-300 border-amber-600/60'
              : 'bg-blue-950 text-blue-300 border-blue-600/60';

            return (
              <div
                key={consign.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isUrgent
                    ? 'bg-rose-950/20 border-rose-800/80 shadow-lg shadow-rose-950/30'
                    : 'bg-slate-900/90 border-slate-800'
                } space-y-3 text-left`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider border ${badgeBg}`}>
                      {consign.priority === 'URGENT' ? '🔴 URGENTE' : consign.priority === 'HIGH' ? '🟠 ALTA' : '🟡 INFORMATIVA'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{consign.author_name}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(consign.published_at).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {isAcknowledged && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Leída por guardia</span>
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-black text-white">{consign.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                    {consign.content}
                  </p>
                </div>

                {!isAcknowledged && (
                  <div className="pt-2 border-t border-slate-800/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(consign.id)}
                      disabled={acknowledgingId === consign.id}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{acknowledgingId === consign.id ? 'Confirmando...' : 'Confirmar de Enterado / Leído'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
