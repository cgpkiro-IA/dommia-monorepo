'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Building2, Globe, CheckCircle2 } from 'lucide-react';

export interface TenantFormData {
  slug: string;
  name: string;
  tier: string;
  maxProperties: number;
  contactEmail: string;
  hasCustomDomain: boolean;
  modules: string[];
}

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: TenantFormData;
  onChange: (data: TenantFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isEdit?: boolean;
}

export function TenantModal({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isSubmitting,
  isEdit = false,
}: TenantModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                {isEdit ? 'Modificar Fraccionamiento' : 'Alta y Aprovisionamiento de Fraccionamiento'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Actualiza límites, tier, dominio y módulos activos.' : 'Crea un esquema aislado en PostgreSQL.'}
              </p>
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
              Nombre del Fraccionamiento / Razón Social *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Residencial Campestre Las Fuentes"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Identificador / Subdominio (Slug) *
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                disabled={isEdit}
                placeholder="las_fuentes"
                value={form.slug}
                onChange={(e) =>
                  onChange({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  })
                }
                className={`w-full px-3 py-2 border border-slate-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs ${
                  isEdit ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                }`}
              />
              <span className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2 rounded-r-lg text-xs text-slate-500 font-mono">
                .dommia.com
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              PostgreSQL Schema: <code className="text-blue-600 font-mono">tenant_{form.slug || 'slug'}</code>
              {isEdit && <span className="ml-1 text-slate-400">(Aislamiento activo en PostgreSQL)</span>}
            </p>
          </div>


          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paquete / Tier *
              </label>
              <select
                value={form.tier}
                onChange={(e) => onChange({ ...form, tier: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                <option value="BASIC">BASIC (hasta 50 casas)</option>
                <option value="STANDARD">STANDARD (hasta 150 casas)</option>
                <option value="PROFESSIONAL">PROFESSIONAL (hasta 300 casas)</option>
                <option value="ENTERPRISE">ENTERPRISE (personalizado)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Límite Duro de Casas *
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.maxProperties}
                onChange={(e) => onChange({ ...form, maxProperties: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico del Administrador
            </label>
            <input
              type="email"
              placeholder="admin@lasfuentes.com"
              value={form.contactEmail}
              onChange={(e) => onChange({ ...form, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Módulos Activos */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Módulos Activos Habilitados:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'FINANCE', label: 'Dommia Finance (Stripe/SPEI)' },
                { key: 'ACCESS_QR', label: 'Dommia Access (QR TOTP)' },
                { key: 'ACCESS_RFID', label: 'Dommia Access (RFID UHF)' },
                { key: 'RESIDENT_APP', label: 'Dommia Resident (PWA)' },
              ].map((mod) => (
                <label key={mod.key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.modules.includes(mod.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange({ ...form, modules: [...form.modules, mod.key] });
                      } else {
                        onChange({ ...form, modules: form.modules.filter((m) => m !== mod.key) });
                      }
                    }}
                    className="rounded text-blue-600"
                  />
                  <span>{mod.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Configuración de Dominio y Subdominio */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                Dominio & URL de Acceso
              </span>
              {form.tier === 'ENTERPRISE' ? (
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Gratis en Enterprise
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                  Estándar por Defecto
                </span>
              )}
            </div>

            {form.tier === 'ENTERPRISE' ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Subdominio Propio Asignado:
                </p>
                <p className="font-mono font-bold text-emerald-800 text-[11px] pl-5">
                  https://{form.slug || 'slug'}.dommia.com
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-slate-700 space-y-1">
                  <span className="text-[11px] text-slate-500 block">Acceso en Dominio Estándar Compartido:</span>
                  <p className="font-mono font-bold text-blue-900 text-[11px]">
                    https://standar.dommia.com/{form.slug || 'slug'}
                  </p>
                </div>

                <label className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/60 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={form.hasCustomDomain}
                    onChange={(e) => onChange({ ...form, hasCustomDomain: e.target.checked })}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      Contratar Add-on de Subdominio Personalizado (+ $490 MXN/mes)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Habilita acceso exclusivo en <strong className="font-mono text-slate-700">https://{form.slug || 'slug'}.dommia.com</strong>
                    </span>
                  </div>
                </label>
              </div>
            )}
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
              {isEdit ? 'Guardar Cambios del Fraccionamiento' : 'Aprovisionar Schema en PostgreSQL'}
            </Button>

          </div>
        </form>
      </div>
    </div>
  );
}
