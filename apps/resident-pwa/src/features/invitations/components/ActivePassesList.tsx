'use client';

import React from 'react';
import { Share2, Trash2, Calendar, QrCode, Plus, Check } from 'lucide-react';
import { VisitorPass } from '../../../types';

interface ActivePassesListProps {
  passes: VisitorPass[];
  onOpenNewInvite: () => void;
  onSharePass: (pass: VisitorPass) => void;
  onRevokePass: (id: string) => void;
  shareMessage: string | null;
}

export const ActivePassesList: React.FC<ActivePassesListProps> = ({
  passes,
  onOpenNewInvite,
  onSharePass,
  onRevokePass,
  shareMessage,
}) => {
  return (
    <div className="mx-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 font-heading">
            Pases de Visitas Vigentes
          </h3>
          <p className="text-[11px] text-slate-400">
            {passes.length} autorización(es) activa(s)
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

      {shareMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{shareMessage}</span>
        </div>
      )}

      {passes.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
          <QrCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold">No tienes pases de visita activos</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Genera un código QR para tus visitas familiares, amigos o proveedores.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {passes.map((pass) => (
            <div
              key={pass.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-white transition-all hover:border-slate-700"
            >
              <div 
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => onSharePass(pass)}
                title="Ver y compartir tarjeta QR"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm truncate">{pass.visitorName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                      pass.passType === 'SINGLE_USE'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : pass.passType === 'TEMPORARY'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {pass.passType === 'SINGLE_USE'
                      ? '1 Uso'
                      : pass.passType === 'TEMPORARY'
                      ? 'Temporal'
                      : 'Frecuente'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Vence: {new Date(pass.validUntil).toLocaleDateString()}</span>
                  {pass.notes && (
                    <span className="text-slate-500 truncate">• {pass.notes}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onSharePass(pass)}
                  title="Compartir tarjeta QR por WhatsApp"
                  className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onRevokePass(pass.id)}
                  title="Revocar pase de acceso"
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-slate-700 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
