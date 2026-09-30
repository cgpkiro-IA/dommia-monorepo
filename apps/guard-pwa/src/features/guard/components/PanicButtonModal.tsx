'use client';

import { useState } from 'react';
import { AlertOctagon, Ambulance, Flame, ShieldAlert, ShieldCheck, X, Check, Siren } from 'lucide-react';
import { API_BASE } from '../guard-api';
import { parseClientError } from '@dommia/ui';

interface PanicButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  token: string;
  isOnline: boolean;
  onAlertDispatched: (alertData: any) => void;
}

type PanicType = 'MEDICAL' | 'FIRE' | 'INTRUSION' | 'POLICE' | 'OTHER';

const PANIC_OPTIONS: { type: PanicType; label: string; icon: any; color: string; desc: string }[] = [
  {
    type: 'INTRUSION',
    label: 'Intrusión / Robo',
    icon: ShieldAlert,
    color: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500',
    desc: 'Personas sospechosas o allanamiento en curso',
  },
  {
    type: 'MEDICAL',
    label: 'Emergencia Médica',
    icon: Ambulance,
    color: 'bg-red-600 hover:bg-red-500 text-white border-red-500',
    desc: 'Ambulancia / Accidente / Persona inconsciente',
  },
  {
    type: 'FIRE',
    label: 'Incendio / Bomberos',
    icon: Flame,
    color: 'bg-orange-600 hover:bg-orange-500 text-white border-orange-500',
    desc: 'Connato de incendio o fuga de gas peligrosa',
  },
  {
    type: 'POLICE',
    label: 'Asistencia Policial',
    icon: Siren,
    color: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500',
    desc: 'Alteración del orden público o apoyo preventivo',
  },
];

export function PanicButtonModal({
  isOpen,
  onClose,
  tenantSlug,
  token,
  isOnline,
  onAlertDispatched,
}: PanicButtonModalProps) {
  const [selectedType, setSelectedType] = useState<PanicType>('INTRUSION');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    if (!isOnline) {
      setError('La alerta de pánico requiere conexión a internet activa.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/tenants/${encodeURIComponent(tenantSlug)}/guard/panic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          panicType: selectedType,
          propertyAddress: propertyAddress.trim() || undefined,
          description: notes.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const err = parseClientError(json || { status: res.status }, 'No fue posible emitir la alerta de pánico.');
        throw new Error(err.description);
      }

      setSuccess(true);
      onAlertDispatched(json.data);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setPropertyAddress('');
        setNotes('');
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al despachar alerta de emergencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-left">
      <div className="bg-[#0B1120] border-2 border-rose-600/80 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Warning Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white animate-pulse">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-400 tracking-wide uppercase">
                Alerta de Emergencia / Pánico
              </h3>
              <p className="text-xs text-slate-400">
                Notificación inmediata de máxima prioridad a la mesa directiva y administración.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3 bg-emerald-950/60 border border-emerald-500/60 rounded-2xl animate-fade-in">
            <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-xl font-black text-emerald-300">¡Alerta de Pánico Despachada!</h4>
            <p className="text-xs text-slate-300">
              La administración ha sido notificada en tiempo real y el evento quedó registrado con prioridad URGENTE.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs text-rose-200">
                {error}
              </div>
            )}

            {/* Emergency Type Grid */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                1. Selecciona el Tipo de Emergencia:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PANIC_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setSelectedType(opt.type)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-950/50 ring-2 ring-rose-500/40'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl border shrink-0 ${isSelected ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>{opt.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Location Input */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Ubicación / Propiedad (Opcional):
                </label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="Ej: Manzana 4, Lote 12 / Entrada Principal"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Detalle breve de la situación (Opcional):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Se solicita apoyo de patrulla / Ambulancia requerida de urgencia"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleDispatch}
                disabled={loading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-sm font-black tracking-wide shadow-xl shadow-rose-900/50 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <AlertOctagon className="w-5 h-5 animate-spin-slow" />
                <span>{loading ? 'Despachando...' : 'EMITIR ALERTA DE PÁNICO AHORA'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
