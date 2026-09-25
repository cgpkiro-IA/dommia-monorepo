'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Radio } from 'lucide-react';
import { TenantItem } from '../../../types';

export interface GatewayFormData {
  uuid: string;
  name: string;
  tenantId: string;
  firmwareVersion: string;
  notes: string;
}

interface GatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: GatewayFormData;
  onChange: (data: GatewayFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  tenants: TenantItem[];
}

export function GatewayModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isSubmitting,
  tenants,
}: GatewayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Registrar Gateway IoT en Caseta
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
              Nombre del Gateway / Caseta *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Gateway Caseta Acceso Sur"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hardware UUID Único *
            </label>
            <input
              type="text"
              required
              placeholder="gw-caseta-sur-vallereal-01"
              value={form.uuid}
              onChange={(e) => onChange({ ...form, uuid: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fraccionamiento Vinculado
            </label>
            <select
              value={form.tenantId}
              onChange={(e) => onChange({ ...form, tenantId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            >
              <option value="">-- Sin vincular aún --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Versión del Firmware
            </label>
            <input
              type="text"
              value={form.firmwareVersion}
              onChange={(e) => onChange({ ...form, firmwareVersion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
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
              Registrar en Inventario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
