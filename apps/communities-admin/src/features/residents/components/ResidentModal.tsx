'use client';

import React from 'react';
import { Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Property } from '@/types';

interface ResidentModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  properties: Property[];
  form: {
    propertyId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';
    isPrimary: boolean;
    isActive: boolean;
  };
  onChange: (field: string, val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}

export function ResidentModal({
  isOpen,
  isEdit,
  onClose,
  properties,
  form,
  onChange,
  onSubmit,
  loading,
  error,
}: ResidentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                {isEdit ? 'Editar Residente' : 'Registrar Nuevo Residente'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? 'Actualiza datos de contacto o vivienda asignada.'
                  : 'Crea el perfil del habitante y habilita su acceso a la PWA Dommia Resident.'}
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
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Vivienda Asignada *</label>
            <select
              required
              value={form.propertyId}
              onChange={(e) => onChange('propertyId', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">-- Selecciona una propiedad --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.street} #{p.exterior_number} {p.interior_number ? `(Int. ${p.interior_number})` : ''} - {p.block || ''} {p.lot || ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Nombre(s) *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder="Carlos"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Apellido(s) *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
                placeholder="Mendoza"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Correo Electrónico (Login App) *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="carlos@correo.com"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Teléfono Celular</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Rol / Clasificación del Habitante *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChange('role', 'OWNER')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  form.role === 'OWNER'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Propietario</span>
                <span className="text-[9px] font-normal text-slate-500">Dueño del inmueble</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('role', 'TENANT')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  form.role === 'TENANT'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Arrendatario</span>
                <span className="text-[9px] font-normal text-slate-500">Inquilino en renta</span>
              </button>

              <button
                type="button"
                onClick={() => onChange('role', 'FAMILY_MEMBER')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  form.role === 'FAMILY_MEMBER'
                    ? 'bg-purple-50 border-purple-500 text-purple-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Familiar</span>
                <span className="text-[9px] font-normal text-slate-500">Hijos o dependientes</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  ¿Es el Contacto Titular Principal?
                </span>
                <span className="text-[10px] text-slate-500">
                  Aparecerá en el encabezado de la casa y recibirá las notificaciones clave.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.isPrimary}
                onChange={(e) => onChange('isPrimary', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
            </label>

            {isEdit && (
              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Acceso Habilitado</span>
                  <span className="text-[10px] text-slate-500">Permitir inicio de sesión en Dommia Resident PWA</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => onChange('isActive', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                />
              </label>
            )}
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEdit ? 'Guardar Cambios' : 'Registrar Residente'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
