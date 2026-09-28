'use client';

import React from 'react';
import { Home, AlertTriangle, Loader2 } from 'lucide-react';
import { Metrics } from '@/types';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    street: string;
    exteriorNumber: string;
    interiorNumber: string;
    block: string;
    lot: string;
    notes: string;
  };
  onChange: (field: string, val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  metrics: Metrics | null;
}

export function AddPropertyModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  loading,
  error,
  metrics,
}: AddPropertyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Registrar Nueva Propiedad
              </h3>
              <p className="text-xs text-slate-500">
                Ocupará 1 lugar de los {metrics?.remaining} disponibles en tu plan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Calle / Avenida *
              </label>
              <input
                type="text"
                required
                value={form.street}
                onChange={(e) => onChange('street', e.target.value)}
                placeholder="Paseo de los Olivos"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Núm. Ext *
              </label>
              <input
                type="text"
                required
                value={form.exteriorNumber}
                onChange={(e) => onChange('exteriorNumber', e.target.value)}
                placeholder="104"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Núm. Int (Opcional)
              </label>
              <input
                type="text"
                value={form.interiorNumber}
                onChange={(e) => onChange('interiorNumber', e.target.value)}
                placeholder="Depto A"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Manzana
              </label>
              <input
                type="text"
                value={form.block}
                onChange={(e) => onChange('block', e.target.value)}
                placeholder="Manzana 3"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Lote
              </label>
              <input
                type="text"
                value={form.lot}
                onChange={(e) => onChange('lot', e.target.value)}
                placeholder="Lote 17"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Ej. Casa club contigua, medidor de luz exterior..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span>Esta será la propiedad registrada:</span>
            <span className="font-bold">
              #{(metrics?.total ?? 0) + 1} de {metrics?.maxAllowed} permitidas
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Registrar Vivienda</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
