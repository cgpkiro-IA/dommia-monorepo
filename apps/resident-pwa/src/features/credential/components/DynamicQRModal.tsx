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

          {/* SVG QR Code Simulation with DOMMIA Center logo */}
          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
            {/* Corner Marker Top Left */}
            <rect x="5" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="13" y="13" width="10" height="10" rx="2" fill="currentColor" />
            {/* Corner Marker Top Right */}
            <rect x="69" y="5" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="77" y="13" width="10" height="10" rx="2" fill="currentColor" />
            {/* Corner Marker Bottom Left */}
            <rect x="5" y="69" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="13" y="77" width="10" height="10" rx="2" fill="currentColor" />
            {/* Data matrix pattern */}
            <rect x="36" y="8" width="6" height="6" fill="currentColor" />
            <rect x="46" y="8" width="8" height="6" fill="currentColor" />
            <rect x="36" y="18" width="14" height="6" fill="currentColor" />
            <rect x="8" y="36" width="12" height="6" fill="currentColor" />
            <rect x="24" y="36" width="6" height="12" fill="currentColor" />
            <rect x="36" y="36" width="28" height="28" rx="6" fill="#0F172A" />
            <rect x="68" y="36" width="12" height="6" fill="currentColor" />
            <rect x="84" y="36" width="8" height="12" fill="currentColor" />
            <rect x="36" y="68" width="12" height="8" fill="currentColor" />
            <rect x="52" y="68" width="14" height="6" fill="currentColor" />
            <rect x="70" y="68" width="12" height="12" fill="currentColor" />
            <rect x="86" y="74" width="6" height="16" fill="currentColor" />
            {/* Center Dommia D badge */}
            <circle cx="50" cy="50" r="10" fill="#2563EB" />
            <path d="M47 45 L52 45 C54 45 55 47 55 50 C55 53 54 55 52 55 L47 55 Z" fill="white" />
          </svg>
        </div>

        {/* 6-digit TOTP Pin */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-3xl font-black font-mono tracking-widest text-emerald-400 bg-emerald-950/60 px-4 py-1 rounded-xl border border-emerald-500/40">
            {totp.code}
          </span>
        </div>

        {/* 30-Second Countdown Progress Bar */}
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

        {/* Offline Guarantee note */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
          {!isOnline && <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          <span>
            {!isOnline
              ? 'Generado localmente. La cámara de la caseta lo validará sin conexión.'
              : 'Código anti-capturas de pantalla. Cambia automáticamente cada 30 segundos.'}
          </span>
        </div>
      </div>
    </div>
  );
};
