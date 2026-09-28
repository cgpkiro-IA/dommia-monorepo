'use client';

import React, { useState } from 'react';
import { X, UserPlus, Calendar, Clock, FileText } from 'lucide-react';
import { PassType } from '../../../types';

interface QuickInviteModalProps {
  isOpen: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onCreatePass: (data: {
    visitorName: string;
    passType: PassType;
    validDays: number;
    notes?: string;
  }) => void;
}

export const QuickInviteModal: React.FC<QuickInviteModalProps> = ({
  isOpen,
  errorMessage,
  onClose,
  onCreatePass,
}) => {
  const [visitorName, setVisitorName] = useState('');
  const [passType, setPassType] = useState<PassType>('SINGLE_USE');
  const [validDays, setValidDays] = useState(1);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    onCreatePass({
      visitorName: visitorName.trim(),
      passType,
      validDays: Number(validDays),
      notes: notes.trim() || undefined,
    });

    setVisitorName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700/80 shadow-2xl p-6 text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-heading">
              Generar Pase de Visita
            </h3>
            <p className="text-xs text-slate-400">Pase digital con código QR temporal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && <p role="alert" className="rounded-lg border border-rose-700 bg-rose-950 px-3 py-2 text-xs text-rose-200">{errorMessage}</p>}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nombre del Visitante / Proveedor *
            </label>
            <input
              type="text"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Ej. Ing. Daniel Soto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Modalidad de Acceso
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'SINGLE_USE', label: '1 Solo Uso' },
                { type: 'TEMPORARY', label: 'Fin de Semana' },
                { type: 'FREQUENT', label: 'Frecuente' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setPassType(item.type as PassType);
                    setValidDays(item.type === 'SINGLE_USE' ? 1 : item.type === 'TEMPORARY' ? 3 : 7);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    passType === item.type
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Vigencia (Días)
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                max="30"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Motivo o Notas (Opcional)
            </label>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Técnico de internet, comida, reunión"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Crear Pase y Compartir</span>
          </button>
        </form>
      </div>
    </div>
  );
};
