'use client';

import React from 'react';
import { QrCode, ShieldCheck, Home, CheckCircle2, AlertCircle } from 'lucide-react';
import { ResidentProfile } from '../../../types';

interface ResidentCardProps {
  profile: ResidentProfile;
  totpCode: string;
  onOpenQR: () => void;
  onOpenFinance?: () => void;
}

export const ResidentCard: React.FC<ResidentCardProps> = ({
  profile,
  totpCode,
  onOpenQR,
  onOpenFinance,
}) => {
  const isUpToDate = profile.paymentStatus === 'UP_TO_DATE';

  return (
    <div className="mx-4 mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] border border-slate-700/60 shadow-2xl p-5 text-white">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header: Community name & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400">
            Credencial Digital
          </span>
          <h2 className="text-base font-extrabold text-white font-heading">
            {profile.communityName}
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenFinance}
          title="Ver estado de cuenta y cuotas"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border cursor-pointer hover:scale-105 transition-all ${
            isUpToDate
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80'
              : 'bg-red-950/80 text-red-300 border-red-500/40 hover:bg-red-900/80'
          }`}
        >
          {isUpToDate ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Al Corriente ›</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span>Cuota Pendiente ›</span>
            </>
          )}
        </button>
      </div>

      {/* Resident Info Body */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Colono Acreditado
          </p>
          <h3 className="text-xl font-black text-white font-heading tracking-tight mt-0.5">
            {profile.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-2">
            <Home className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{profile.propertyAddress}</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {profile.role === 'OWNER'
                ? 'Propietario'
                : profile.role === 'TENANT'
                ? 'Arrendatario'
                : 'Familiar'}
            </span>
            {profile.isPrimary && (
              <span className="text-[10px] font-semibold text-blue-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                <span>Titular</span>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic QR Quick Button */}
        <button
          type="button"
          onClick={onOpenQR}
          className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 transition-all flex flex-col items-center justify-center gap-1 shrink-0 text-blue-300 cursor-pointer group active:scale-95 shadow-lg shadow-blue-950/50"
        >
          <QrCode className="w-8 h-8 group-hover:scale-105 transition-transform text-white" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-blue-200">
            {totpCode}
          </span>
          <span className="text-[9px] uppercase font-bold text-blue-400">Ver QR</span>
        </button>
      </div>

      {/* Card Footer: Offline Security note */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono text-slate-500">ID: {profile.id.slice(0, 14)}...</span>
        <span className="text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Acceso Vehicular Autorizado</span>
        </span>
      </div>
    </div>
  );
};
