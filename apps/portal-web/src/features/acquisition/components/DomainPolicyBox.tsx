'use client';

import React from 'react';
import { TierKey } from '../../../types';

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
    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wider text-slate-300">
          Configuración de Dominio y Acceso
        </span>
        {tierKey === 'ENTERPRISE' ? (
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
            Gratis en Enterprise
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold">
            Dominio Estándar
          </span>
        )}
      </div>

      {tierKey === 'ENTERPRISE' ? (
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs">
          <p className="text-emerald-300 font-semibold mb-1">
            ✓ Subdominio propio incluido en tu plan
          </p>
          <p className="text-slate-400 font-mono text-[11px]">
            URL: <span className="text-white font-bold">https://{slug || 'tu_comunidad'}.dommia.com</span>
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <p className="text-slate-300 font-medium mb-1">
              URL Estándar de Acceso (Sin costo adicional):
            </p>
            <p className="text-blue-400 font-mono text-[11px]">
              https://standar.dommia.com/{slug || 'tu_comunidad'}
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 cursor-pointer hover:border-purple-600 transition-colors">
            <input
              type="checkbox"
              checked={hasCustomDomain}
              onChange={(e) => onCustomDomainChange(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-semibold text-purple-200 flex items-center gap-2">
                <span>Contratar Add-on de Subdominio Personalizado</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 font-bold border border-purple-700">
                  + $490 MXN/mes
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {hasCustomDomain ? (
                  <span>
                    Acceso contratado: <strong className="text-emerald-400 font-mono">https://{slug || 'tu_comunidad'}.dommia.com</strong>
                  </span>
                ) : (
                  <span>Otorga a tu fraccionamiento un subdominio exclusivo sin prefijos estándar.</span>
                )}
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
