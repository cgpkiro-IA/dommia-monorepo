'use client';

import React, { useState } from 'react';
import { CalendarCheck, CheckCircle2, Upload } from 'lucide-react';

interface AnnualCampaignCardProps {
  campaign: any;
  quote: any;
  isSubmitting: boolean;
  onLoadQuote: () => Promise<void>;
  onSubmit: (reference: string, receiptUrl: string) => Promise<void>;
}

export function AnnualCampaignCard({ campaign, quote, isSubmitting, onLoadQuote, onSubmit }: AnnualCampaignCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const [cashInfo, setCashInfo] = useState(false);

  if (!campaign) return null;

  const handleFile = (file?: File) => {
    if (!file || file.size > 4 * 1024 * 1024) {
      setMessage('Adjunta un archivo de máximo 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(typeof reader.result === 'string' ? reader.result : '');
      setFileName(file.name);
      setMessage('');
    };
    reader.readAsDataURL(file);
  };

  const open = async () => {
    setIsOpen(true);
    try { await onLoadQuote(); } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo calcular la campaña.'); }
  };

  const submit = async () => {
    if (!reference.trim() || !receiptUrl) { setMessage('Captura la referencia y adjunta el comprobante.'); return; }
    try { await onSubmit(reference.trim(), receiptUrl); setMessage('Comprobante enviado. Queda pendiente de validación.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo enviar.'); }
  };

  return (
    <div className="mx-4 mb-4 rounded-3xl border border-amber-700/60 bg-gradient-to-br from-amber-950/80 to-slate-900 p-5 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3"><CalendarCheck className="mt-1 h-5 w-5 text-amber-300" /><div><p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Campaña anual</p><h3 className="font-heading text-base font-black">{campaign.name}</h3><p className="mt-1 text-[11px] text-slate-300">Paga {campaign.months_covered} meses con {campaign.discount_percentage}% de descuento.</p></div></div>
        <button type="button" onClick={open} className="rounded-xl bg-amber-400 px-3 py-2 text-[11px] font-black text-slate-950">Ver oferta</button>
      </div>
      {isOpen && quote && (
        <div className="mt-4 space-y-3 border-t border-amber-800/70 pt-4 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center"><div><span className="block text-slate-400">Normal</span><b>${Number(quote.grossAmount).toLocaleString('es-MX')}</b></div><div><span className="block text-amber-300">Descuento</span><b>-${Number(quote.discountAmount).toLocaleString('es-MX')}</b></div><div><span className="block text-emerald-300">Total</span><b>${Number(quote.netAmount).toLocaleString('es-MX')}</b></div></div>
          {quote.existingCommitment ? <p className="flex items-center gap-2 rounded-xl bg-emerald-950/60 p-3 text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Comprobante enviado. Pendiente de validación administrativa.</p> : <><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Referencia SPEI" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-950 p-3 font-bold"><Upload className="h-4 w-4 text-amber-300" />{fileName || 'Adjuntar comprobante'}<input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} /></label><button type="button" disabled={isSubmitting} onClick={submit} className="w-full rounded-xl bg-amber-400 py-3 font-black text-slate-950 disabled:opacity-50">{isSubmitting ? 'Enviando...' : 'Enviar comprobante SPEI'}</button><button type="button" onClick={() => setCashInfo(!cashInfo)} className="w-full rounded-xl border border-slate-700 py-2 text-[11px] font-bold text-slate-200">Pagar en efectivo en administración</button>{cashInfo && <p className="rounded-xl bg-slate-950 p-3 text-[11px] text-slate-300">Acude a administración con tu vivienda y solicita registrar la campaña <b>{campaign.name}</b>. El administrador validará el efectivo y te entregará el folio anual.</p>}</>}
          {message && <p className="text-[11px] text-amber-200">{message}</p>}
        </div>
      )}
    </div>
  );
}