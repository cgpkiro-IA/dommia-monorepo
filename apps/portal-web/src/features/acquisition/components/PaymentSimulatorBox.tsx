'use client';

import React from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { TierKey } from '../../../types';

interface PaymentSimulatorBoxProps {
  hasCustomDomain: boolean;
  tierKey: TierKey;
  estimatedPrice?: string;
}

export const PaymentSimulatorBox: React.FC<PaymentSimulatorBoxProps> = ({
  hasCustomDomain,
  tierKey,
  estimatedPrice,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 space-y-3.5 shadow-inner">
      <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
        <span className="font-bold flex items-center gap-2 font-heading">
          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Suscripción Recurrente Mensual</span>
        </span>
        <div className="text-right">
          <span className="text-emerald-600 dark:text-emerald-400 font-black text-base block font-heading">
            {hasCustomDomain && tierKey !== 'ENTERPRISE'
              ? `${estimatedPrice} + $490 MXN/mes`
              : estimatedPrice}
          </span>
          {hasCustomDomain && tierKey !== 'ENTERPRISE' && (
            <span className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold">Incluye Add-on Subdominio</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div className="col-span-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-xs">
          <span className="tracking-wider">4242 •••• •••• 4242</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">VISA</span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-center font-semibold shadow-xs">
          12/28 • CVC
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
        <span>Cifrado SSL 256-bit y procesamiento certificado PCI-DSS vía Stripe.</span>
      </div>
    </div>
  );
};
