'use client';

import React from 'react';
import { Radio, Loader2, CheckCircle2 } from 'lucide-react';

interface AccessGateButtonProps {
  isOpening: boolean;
  success: boolean;
  onOpenGate: () => void;
}

export const AccessGateButton: React.FC<AccessGateButtonProps> = ({
  isOpening,
  success,
  onOpenGate,
}) => {
  return (
    <div className="mx-4 mb-6">
      <button
        type="button"
        disabled={isOpening}
        onClick={onOpenGate}
        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm text-white transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98] ${
          success
            ? 'bg-emerald-600 shadow-emerald-900/30'
            : isOpening
            ? 'bg-blue-700 opacity-80 cursor-wait'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30'
        }`}
      >
        {isOpening ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Enviando señal al Gateway de caseta...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>¡Pluma abierta! Acceso autorizado</span>
          </>
        ) : (
          <>
            <Radio className="w-5 h-5 text-white animate-pulse" />
            <span>Abrir Pluma de Caseta (Apertura Rápida)</span>
          </>
        )}
      </button>
    </div>
  );
};
