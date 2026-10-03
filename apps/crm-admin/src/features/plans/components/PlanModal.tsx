'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { SlidersHorizontal } from 'lucide-react';
import { PlanItem } from '../../../types';
import { getPlanModuleLabel, PLAN_MODULE_OPTIONS } from '../module-catalog';

export interface PlanFormData {
  name: string;
  description: string;
  monthlyPrice: number;
  minProperties: number;
  maxProperties: number;
  includedModules: string[];
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
  const knownModuleCodes = new Set<string>(PLAN_MODULE_OPTIONS.map((module) => module.code));
  const legacyModules = form.includedModules.filter((module) => !knownModuleCodes.has(module));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <div>
              <label className="block min-h-8 text-xs font-semibold text-slate-700 mb-1">
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
              <label className="block min-h-8 text-xs font-semibold text-slate-700 mb-1">
                Mínimo de viviendas *
              </label>
              <input
                type="number"
                required
                min={1}
                max={form.maxProperties}
                value={form.minProperties}
                onChange={(e) => onChange({ ...form, minProperties: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block min-h-8 text-xs font-semibold text-slate-700 mb-1">
                Máximo de viviendas *
              </label>
              <input
                type="number"
                required
                min={form.minProperties}
                value={form.maxProperties}
                onChange={(e) => onChange({ ...form, maxProperties: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-slate-900"
              />
            </div>

            <p className="text-[10px] text-slate-500 sm:col-span-3">El cotizador asigna este plan dentro del rango. Cada fraccionamiento conserva su límite particular.</p>
          </div>

          <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <legend className="px-1 text-xs font-bold text-slate-800">Módulos incluidos</legend>
            <p className="mb-3 text-[11px] text-slate-500">Selecciona las capacidades que se mostrarán incluidas en este plan. Stripe, RFID e IoT no se ofrecen en esta fase.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLAN_MODULE_OPTIONS.map((module) => (
                <label key={module.code} className="flex min-h-14 items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 cursor-pointer hover:border-blue-300">
                  <input
                    type="checkbox"
                    checked={form.includedModules.includes(module.code)}
                    onChange={(event) => onChange({
                      ...form,
                      includedModules: event.target.checked
                        ? [...new Set([...form.includedModules, module.code])]
                        : form.includedModules.filter((code) => code !== module.code),
                    })}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="block text-[11px] font-semibold text-slate-800">{module.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">{module.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {legacyModules.length > 0 && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="mb-2 text-[10px] font-semibold text-amber-800">Módulos heredados. Se conservan, pero no se pueden volver a agregar en esta fase.</p>
                <div className="flex flex-wrap gap-1.5">
                  {legacyModules.map((module) => (
                    <button
                      key={module}
                      type="button"
                      aria-label={`Quitar módulo heredado ${module}`}
                      onClick={() => onChange({ ...form, includedModules: form.includedModules.filter((code) => code !== module) })}
                      className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] text-amber-900"
                    >
                      {getPlanModuleLabel(module)} ×
                    </button>
                  ))}
                </div>
              </div>
            )}
          </fieldset>

          {/* Subdominio y Reglas de Acceso */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-800 block">
                  ¿Incluye Subdominio Propio de Cortesía?
                </label>
                <p className="text-[11px] text-slate-500">
                  Si está activo, el fraccionamiento recibe &#123;slug&#125;.dommia.com.mx gratis.
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
                  Costo adicional si el condominio en este plan desea subdominio propio en lugar de standar.dommia.com.mx
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
