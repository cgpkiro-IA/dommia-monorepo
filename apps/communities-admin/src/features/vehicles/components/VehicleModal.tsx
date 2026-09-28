'use client';

import React from 'react';
import { Car, AlertTriangle, Loader2 } from 'lucide-react';
import { Property, Resident } from '@/types';

interface VehicleModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  properties: Property[];
  residents: Resident[];
  form: {
    propertyId: string;
    residentId: string;
    plates: string;
    brand: string;
    model: string;
    color: string;
  };
  onChange: (field: string, val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

export function VehicleModal({
  isOpen,
  isEdit,
  onClose,
  properties,
  residents,
  form,
  onChange,
  onSubmit,
  loading,
  error,
}: VehicleModalProps) {
  if (!isOpen) return null;

  // Filter residents matching the selected property
  const propertyResidents = residents.filter((r) => r.property_id === form.propertyId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                {isEdit ? 'Editar Vehículo' : 'Registrar Vehículo'}
              </h3>
              <p className="text-xs text-slate-500">
                Asocia el vehículo a una vivienda para control de acceso automatizado.
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
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Vivienda Asignada *
            </label>
            <select
              required
              value={form.propertyId}
              onChange={(e) => {
                onChange('propertyId', e.target.value);
                onChange('residentId', '');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">-- Selecciona una propiedad --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.street} #{p.exterior_number} {p.interior_number ? `(Int. ${p.interior_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Residente Conductor / Propietario (Opcional)
            </label>
            <select
              value={form.residentId}
              onChange={(e) => onChange('residentId', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 bg-white"
            >
              <option value="">-- Uso general de la casa / No especificado --</option>
              {propertyResidents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.first_name} {r.last_name} ({r.role === 'OWNER' ? 'Propietario' : r.role === 'TENANT' ? 'Inquilino' : 'Familiar'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Placas Vehiculares *
            </label>
            <input
              type="text"
              required
              value={form.plates}
              onChange={(e) => onChange('plates', e.target.value.toUpperCase())}
              placeholder="NXX-4521"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-emerald-500 uppercase"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => onChange('brand', e.target.value)}
                placeholder="Mazda"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => onChange('model', e.target.value)}
                placeholder="CX-5"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => onChange('color', e.target.value)}
                placeholder="Gris Grafito"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
              />
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEdit ? 'Guardar Cambios' : 'Registrar Vehículo'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
