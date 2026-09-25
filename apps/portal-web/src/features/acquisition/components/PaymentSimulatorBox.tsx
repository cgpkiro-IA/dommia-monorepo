'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
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
    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Suscripción Recurrente Mensual (Sandbox Stripe)</span>
        </span>
        <div className="text-right">
          <span className="text-emerald-400 font-bold text-sm block">
            {hasCustomDomain && tierKey !== 'ENTERPRISE'
              ? `${estimatedPrice} + $490 MXN/mes`
              : estimatedPrice}
          </span>
          {hasCustomDomain && tierKey !== 'ENTERPRISE' && (
            <span className="text-[10px] text-purple-300">Incluye Add-on Subdominio</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div className="col-span-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
          <span>4242 •••• •••• 4242</span>
          <span className="text-slate-500 text-[10px]">VISA</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-center">
          12/28 • CVC
        </div>
      </div>
    </div>
  );
};
