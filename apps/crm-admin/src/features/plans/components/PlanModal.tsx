'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { SlidersHorizontal } from 'lucide-react';
import { PlanItem } from '../../../types';

export interface PlanFormData {
  name: string;
  description: string;
  monthlyPrice: number;
  maxProperties: number;
  includesCustomDomain: boolean;
  customDomainAddonPrice: number;
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: PlanFormData;
  editingPlan: PlanItem | null;
  onChange: (data: PlanFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function PlanModal({
  isOpen,
  onClose,
  form,
  editingPlan,
  onChange,
  onSubmit,
  isSubmitting,
}: PlanModalProps) {
  if (!isOpen || !editingPlan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Editar Configuración: {editingPlan.name}
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Código: Tier {editingPlan.code}</span>
            </div>
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
              Nombre Comercial del Plan *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descripción
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Precio Mensual Base (MXN) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  required
                  min={0}
                  step="10"
                  value={form.monthlyPrice}
                  onChange={(e) => onChange({ ...form, monthlyPrice: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Límite Máximo de Viviendas *
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.maxProperties}
                onChange={(e) => onChange({ ...form, maxProperties: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">Límite duro validado en API</p>
            </div>
          </div>

          {/* Subdominio y Reglas de Acceso */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-800 block">
                  ¿Incluye Subdominio Propio de Cortesía?
                </label>
                <p className="text-[11px] text-slate-500">
                  Si está activo, el fraccionamiento recibe &#123;slug&#125;.dommia.com gratis.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.includesCustomDomain}
                onChange={(e) => onChange({ ...form, includesCustomDomain: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {!form.includesCustomDomain && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Precio Add-on Subdominio Personalizado (MXN / mes)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    step="10"
                    value={form.customDomainAddonPrice}
                    onChange={(e) => onChange({ ...form, customDomainAddonPrice: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Costo adicional si el condominio en este plan desea subdominio propio en lugar de standar.dommia.com
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="shadow-md shadow-blue-900/20"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
