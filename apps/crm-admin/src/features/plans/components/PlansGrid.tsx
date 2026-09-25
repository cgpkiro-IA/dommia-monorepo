'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Globe, Crown, Home, Check, Edit3 } from 'lucide-react';
import { PlanItem } from '../../../types';

interface PlansGridProps {
  plans: PlanItem[];
  onEditPlan: (plan: PlanItem) => void;
}

export function PlansGrid({ plans, onEditPlan }: PlansGridProps) {
  return (
    <div className="space-y-6">
      {/* Banner de Política de Dominios y Subdominios */}
      <div className="p-4 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white flex items-start gap-3 shadow-xs">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
          <Globe className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-slate-900 text-sm">Política de Acceso y Subdominios de DOMMIA</h4>
          <p className="text-slate-600 leading-relaxed">
            Por regla de negocio, los planes <span className="font-semibold text-slate-900">Básico, Estándar y Profesional</span> se alojan en el dominio compartido oficial <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-mono font-bold">standar.dommia.com/&#123;slug&#125;</code>.
            El subdominio propio <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-mono font-bold">&#123;slug&#125;.dommia.com</code> se comercializa como un <strong>Add-on opcional con costo extra mensual</strong>. Únicamente el paquete <span className="font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">ENTERPRISE</span> incluye subdominio propio gratis de cortesía.
          </p>
        </div>
      </div>

      {/* Grid de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isEnterprise = p.code === 'ENTERPRISE';
          return (
            <div
              key={p.id}
              className={`rounded-2xl border transition-all duration-200 bg-white p-6 flex flex-col justify-between shadow-xs ${
                p.is_highlighted
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md relative'
                  : isEnterprise
                  ? 'border-purple-300 bg-gradient-to-b from-purple-50/20 to-white'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {p.is_highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Más Popular
                </span>
              )}

              <div className="space-y-4">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                      Tier {p.code}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                      {p.name}
                    </h3>
                  </div>
                  {isEnterprise && (
                    <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <Crown className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 min-h-[36px] line-clamp-2">
                  {p.description}
                </p>

                {/* Pricing */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      ${Number(p.monthly_price).toLocaleString('es-MX')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">MXN / mes</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Hasta {p.max_properties} viviendas (Límite Duro)</span>
                  </div>
                </div>

                {/* Regla de Subdominio */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dominio / Subdominio</span>
                  </div>

                  {p.includes_custom_domain ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Crown className="w-3 h-3 text-emerald-600" />
                        Subdominio Propio Incluido
                      </span>
                      <p className="text-[11px] font-mono text-slate-600 font-medium">
                        &#123;slug&#125;.dommia.com
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-600 font-medium">
                        Estándar: <span className="font-mono text-slate-800">standar.dommia.com</span>
                      </p>
                      <span className="inline-block text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                        Add-on Subdominio: +${Number(p.custom_domain_addon_price).toLocaleString('es-MX')} MXN/mes
                      </span>
                    </div>
                  )}
                </div>

                {/* Módulos Integrados */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                    Módulos Incluidos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(p.included_modules || []).map((mod, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        {mod.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add-ons Disponibles */}
                {(p.available_addons || []).length > 0 && (
                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                      Add-ons con Costo Extra:
                    </span>
                    <div className="space-y-1 text-[11px]">
                      {p.available_addons.map((addon, i) => (
                        <div key={i} className="flex items-center justify-between text-slate-600">
                          <span className="truncate pr-2">• {addon.name}</span>
                          <span className="font-mono font-bold text-slate-800 shrink-0">
                            +${addon.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-5 border-t border-slate-100 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditPlan(p)}
                  className="w-full text-xs font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Editar Configuración
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
