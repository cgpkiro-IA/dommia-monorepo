'use client';

import React from 'react';
import { AlertTriangle, Zap, ExternalLink } from 'lucide-react';
import { TenantMetadata, Metrics } from '@/types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: TenantMetadata | null;
  metrics: Metrics | null;
}

export function UpgradeModal({
  isOpen,
  onClose,
  activeTenant,
  metrics,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500 relative">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-100">
            <AlertTriangle className="w-9 h-9" />
          </div>

          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold uppercase tracking-wider text-xs">
            Bloqueo de Capacidad (Límite Duro)
          </span>

          <h3 className="text-2xl font-black text-slate-900 font-heading mt-3 mb-2">
            ¡Has Alcanzado el Límite de tu Plan!
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Tu comunidad actualmente está en el paquete <strong>{activeTenant?.tier}</strong> con un límite contratado de{' '}
            <strong className="text-red-600">{metrics?.maxAllowed} viviendas</strong>. Para garantizar la estabilidad del servicio y cumplir las condiciones de suscripción, el sistema no permite agregar la propiedad #{((metrics?.total ?? 0) + 1)}.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-3 mb-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Plan Actual:</span>
              <span className="font-bold text-slate-900">
                {activeTenant?.tier} ({metrics?.maxAllowed} casas)
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-semibold text-emerald-700">Upgrade Recomendado:</span>
              <span className="font-bold text-emerald-700">
                {activeTenant?.tier === 'BASIC'
                  ? 'Plan Estándar (Hasta 100 casas)'
                  : activeTenant?.tier === 'STANDARD'
                  ? 'Plan Profesional (Hasta 250 casas)'
                  : 'Plan Enterprise (Hasta 1,000 casas)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">¿Tienes un caso especial?</span>
              <span className="text-slate-700 font-medium">Contrata Add-on por casa extra</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Gestionar Upgrade en Dommia CRM</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cerrar por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
