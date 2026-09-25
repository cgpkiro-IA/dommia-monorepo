'use client';

import React from 'react';
import { Edit2, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { Property } from '@/types';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onChange: (updated: Property) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error?: string | null;
}

export function EditPropertyModal({
  isOpen,
  onClose,
  property,
  onChange,
  onSubmit,
  loading,
  error,
}: EditPropertyModalProps) {
  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                Editar Vivienda
              </h3>
              <p className="text-xs text-slate-500">
                Modifica datos de ubicación o actualiza el estatus de pago.
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
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Calle *
              </label>
              <input
                type="text"
                required
                value={property.street}
                onChange={(e) => onChange({ ...property, street: e.target.value })}
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
                value={property.exterior_number}
                onChange={(e) => onChange({ ...property, exterior_number: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Núm. Int
              </label>
              <input
                type="text"
                value={property.interior_number || ''}
                onChange={(e) => onChange({ ...property, interior_number: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Manzana
              </label>
              <input
                type="text"
                value={property.block || ''}
                onChange={(e) => onChange({ ...property, block: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Lote
              </label>
              <input
                type="text"
                value={property.lot || ''}
                onChange={(e) => onChange({ ...property, lot: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Notas
            </label>
            <textarea
              rows={2}
              value={property.notes || ''}
              onChange={(e) => onChange({ ...property, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Status Toggle Box (Modern Verde / Rojo Switch) */}
          <div
            onClick={() =>
              onChange({
                ...property,
                is_delinquent: !property.is_delinquent,
              })
            }
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
              property.is_delinquent
                ? 'bg-red-50/70 border-red-200 hover:border-red-300'
                : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    property.is_delinquent
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {property.is_delinquent ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 block font-heading">
                      Estatus Financiero de la Vivienda
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        property.is_delinquent
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {property.is_delinquent ? 'Moroso' : 'Al Corriente'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    {property.is_delinquent
                      ? 'Marcada como MOROSA (restricción activa de TAG / Invitaciones)'
                      : 'Al corriente con sus cuotas de mantenimiento'}
                  </span>
                </div>
              </div>

              {/* Modern Dual-Color Toggle Switch */}
              <div className="shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={!property.is_delinquent}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({
                      ...property,
                      is_delinquent: !property.is_delinquent,
                    });
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    property.is_delinquent ? 'bg-red-600' : 'bg-emerald-500'
                  }`}
                >
                  <span className="sr-only">Estatus financiero</span>
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                      property.is_delinquent
                        ? 'translate-x-7 text-red-600'
                        : 'translate-x-0 text-emerald-600'
                    }`}
                  >
                    {property.is_delinquent ? '✕' : '✓'}
                  </span>
                </button>
              </div>
            </div>
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
