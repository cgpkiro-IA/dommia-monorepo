'use client';

import React from 'react';
import { X, ShieldCheck, Clock, WifiOff } from 'lucide-react';
import { TotpResult } from '../../../lib/totp';

interface DynamicQRModalProps {
  isOpen: boolean;
  residentName: string;
  propertyAddress: string;
  totp: TotpResult;
  isOnline: boolean;
  onClose: () => void;
}

export const DynamicQRModal: React.FC<DynamicQRModalProps> = ({
  isOpen,
  residentName,
  propertyAddress,
  totp,
  isOnline,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F172A] border border-slate-700/80 shadow-2xl p-6 text-white text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Acceso Dinámico TOTP</span>
        </div>

        <h3 className="text-xl font-extrabold text-white font-heading">
          {residentName}
        </h3>
        <p className="text-xs text-slate-400 mb-6">{propertyAddress}</p>

        {/* QR Code Container */}
        <div className="relative mx-auto w-56 h-56 p-4 rounded-2xl bg-white flex flex-col items-center justify-center shadow-xl mb-4 overflow-hidden">
          {/* Animated Laser Scanner Line */}
          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-bounce opacity-80" />

          {totp.qrImage ? <img src={totp.qrImage} alt="Credencial QR temporal" className="h-full w-full" /> : <span className="text-xs text-slate-500">{totp.error || 'Renovando credencial...'}</span>}
        </div>

        {/* 6-digit TOTP Pin */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-3xl font-black font-mono tracking-widest text-emerald-400 bg-emerald-950/60 px-4 py-1 rounded-xl border border-emerald-500/40">
            {totp.code}
          </span>
        </div>

        {/* Countdown Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Expira en {totp.timeRemaining}s</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">Auto-renovación</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                totp.timeRemaining <= 5 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${totp.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
          {!isOnline && <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          <span>
            {!isOnline
              ? 'Se requiere conexión para renovar y validar este código en caseta.'
              : 'Código firmado por el servidor. Vence cada 15 segundos y se valida en línea.'}
          </span>
        </div>
      </div>
    </div>
  );
};
