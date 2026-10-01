'use client';

import React from 'react';
import { TierKey } from '../../../types';
import { Globe, Check } from 'lucide-react';

interface DomainPolicyBoxProps {
  slug: string;
  hasCustomDomain: boolean;
  tierKey: TierKey;
  onCustomDomainChange: (hasCustom: boolean) => void;
}

export const DomainPolicyBox: React.FC<DomainPolicyBoxProps> = ({
  slug,
  hasCustomDomain,
  tierKey,
  onCustomDomainChange,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 space-y-3.5 shadow-inner">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-heading">
            Configuración de Dominio y Acceso Web
          </span>
        </div>
        {tierKey === 'ENTERPRISE' ? (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-[10px] font-black uppercase">
            Incluido en Enterprise
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 text-[10px] font-bold uppercase">
            Dominio Estándar
          </span>
        )}
      </div>

      {tierKey === 'ENTERPRISE' ? (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold mb-1">
            <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Subdominio exclusivo incluido en tu plan</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
            Enlace de acceso: <span className="text-slate-900 dark:text-white font-bold underline">https://{slug || 'tu_fraccionamiento'}.dommia.com</span>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
              Enlace Estándar de Acceso (Sin costo adicional):
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-mono text-[11px] font-semibold">
              https://standar.dommia.com/{slug || 'tu_fraccionamiento'}
            </p>
          </div>

          <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 hover:border-purple-500/60 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={hasCustomDomain}
              onChange={(e) => onCustomDomainChange(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer accent-purple-600"
            />
            <div className="text-xs">
              <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                <span>Contratar Add-on de Subdominio Personalizado</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-200 font-bold border border-purple-300 dark:border-purple-700">
                  + $490 MXN/mes
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">
                {hasCustomDomain ? (
                  <span>
                    Acceso activo: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">https://{slug || 'tu_fraccionamiento'}.dommia.com</strong>
                  </span>
                ) : (
                  <span>Otorga a tu comunidad un enlace propio y exclusivo para colonos y administradores.</span>
                )}
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
