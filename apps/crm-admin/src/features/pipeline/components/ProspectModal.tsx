'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Plus } from 'lucide-react';

export interface ProspectFormData {
  name: string;
  email: string;
  phone: string;
  communityName: string;
  estimatedHouses: number;
  notes: string;
}

interface ProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ProspectFormData;
  onChange: (data: ProspectFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function ProspectModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isSubmitting,
}: ProspectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Nuevo Prospecto Comercial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre del Contacto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Lic. Roberto Garza"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                placeholder="rgarza@residencial.com"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                placeholder="+52 33 1234 5678"
                value={form.phone}
                onChange={(e) => onChange({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Fraccionamiento *
              </label>
              <input
                type="text"
                required
                placeholder="Residencial Los Sauces"
                value={form.communityName}
                onChange={(e) => onChange({ ...form, communityName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Casas Estimadas *
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.estimatedHouses}
                onChange={(e) => onChange({ ...form, estimatedHouses: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas Comerciales
            </label>
            <textarea
              rows={2}
              placeholder="Comentarios sobre necesidades, fecha de asamblea vecinal, etc."
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Guardar en Pipeline
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
