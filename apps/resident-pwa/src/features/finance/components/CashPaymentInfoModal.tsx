'use client';

import React, { useEffect, useRef } from 'react';
import { Building2, Clock3, ShieldCheck, X } from 'lucide-react';

interface CashPaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CashPaymentInfoModal({ isOpen, onClose }: CashPaymentInfoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="presentation" onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="cash-payment-title" onClick={(event) => event.stopPropagation()} className="relative w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 text-white shadow-2xl shadow-emerald-950/50">
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Cerrar información de pago en efectivo" className="absolute right-4 top-4 rounded-full bg-slate-800/70 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white">
          <X className="h-4 w-4" />
        </button>
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-8 ring-emerald-500/5"><Building2 className="h-7 w-7" /></div>
          <span className="mb-2 rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">Pago presencial</span>
          <h2 id="cash-payment-title" className="font-heading text-xl font-black">Pago en ventanilla</h2>
          <p className="mt-2 text-xs leading-5 text-slate-300">Acude a las oficinas de administración de tu fraccionamiento para realizar tu pago en efectivo.</p>
        </div>
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
          <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><p><strong className="text-white">Horario de atención:</strong><br />Lunes a viernes, de 9:00 a 18:00 hrs.</p></div>
          <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><p>La administración registrará el pago y recibirás tu comprobante digital junto con la actualización de tu estado de cuenta.</p></div>
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-emerald-950/60 transition hover:from-emerald-500 hover:to-teal-500">Entendido</button>
      </div>
    </div>
  );
}
