'use client';

import React, { useEffect, useState } from 'react';
import { Landmark, Copy, Check, X, ShieldAlert, Upload, FileText, Loader2 } from 'lucide-react';
import { ResidentProfile } from '../../../types';

interface SpeiDetailsModalProps {
  isOpen: boolean;
  profile: ResidentProfile;
  amountDue: number;
  onSubmit: (submission: { amount: number; reference: string; receiptUrl: string }) => Promise<boolean>;
  onClose: () => void;
}

export const SpeiDetailsModal: React.FC<SpeiDetailsModalProps> = ({
  isOpen,
  profile,
  amountDue,
  onSubmit,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [amount, setAmount] = useState(amountDue);
  const [reference, setReference] = useState('');
  const [receiptData, setReceiptData] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(amountDue);
      setReference('');
      setReceiptData(null);
      setReceiptName('');
      setFileError(null);
      setSubmitError(null);
    }
  }, [amountDue, isOpen]);

  if (!isOpen) return null;

  const clabe = '012 180 00123456789 5';
  const cleanClabe = '012180001234567895';
  const bank = 'BBVA México';
  const beneficiary = `${profile.communityName} A.C.`;
  const transferReference = `MANT-${profile.propertyAddress.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (file?: File) => {
    setFileError(null);
    setReceiptData(null);
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Adjunta un PDF o una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setFileError('El comprobante debe pesar máximo 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptData(typeof reader.result === 'string' ? reader.result : null);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!amount || amount <= 0) {
      setSubmitError('Indica el monto transferido.');
      return;
    }
    if (!reference.trim()) {
      setSubmitError('Escribe la referencia SPEI.');
      return;
    }
    if (!receiptData) {
      setSubmitError('Adjunta el comprobante de transferencia.');
      return;
    }
    setIsSubmitting(true);
    try {
      const submitted = await onSubmit({ amount, reference: reference.trim(), receiptUrl: receiptData });
      if (submitted) onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar el comprobante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
          aria-label="Cerrar modal SPEI"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white font-heading">
              Transferencia SPEI
            </h3>
            <p className="text-xs text-slate-400">Datos bancarios oficiales</p>
          </div>
        </div>

        {/* Amount to pay */}
        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/60 mb-4 flex justify-between items-center">
          <div>
            <span className="text-[11px] text-blue-300">Total a liquidar:</span>
            <p className="text-xl font-black text-white font-heading">
              ${amountDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MXN</span>
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-blue-900/60 text-blue-200 border border-blue-700/50">
            Fase MVP
          </span>
        </div>

        {/* Bank Fields */}
        <div className="space-y-3 mb-5 text-xs">
          {/* CLABE */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">CLABE Interbancaria (18 dígitos)</p>
              <p className="font-mono text-sm text-slate-100 font-bold tracking-wider mt-0.5">{clabe}</p>
            </div>
            <button
              onClick={() => handleCopy(cleanClabe, 'clabe')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copiar CLABE"
            >
              {copiedField === 'clabe' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Banco & Beneficiario */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Banco Destino</p>
              <p className="font-bold text-slate-200 mt-0.5">{bank}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Beneficiario</p>
              <p className="font-bold text-slate-200 mt-0.5 truncate">{beneficiary}</p>
            </div>
          </div>

          {/* Concepto / Referencia */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Concepto de Transferencia (Obligatorio)</p>
              <p className="font-mono text-xs text-amber-300 font-bold mt-0.5">{transferReference}</p>
            </div>
            <button
              onClick={() => handleCopy(transferReference, 'reference')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copiar Concepto"
            >
              {copiedField === 'reference' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Cash notice footnote */}
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2 mb-5">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p>
            También puedes pagar en <strong>Efectivo</strong> acudiendo a las oficinas de Administración del fraccionamiento. La acreditación es inmediata.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-800/70 bg-amber-950/20 p-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-300">Enviar comprobante</p>
            <p className="text-[11px] text-slate-300 mt-1">El pago quedará pendiente hasta que administración valide la transferencia.</p>
          </div>
          <label className="block text-[11px] font-semibold text-slate-300">
            Monto transferido
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount || ''}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
            />
          </label>
          <label className="block text-[11px] font-semibold text-slate-300">
            Referencia SPEI
            <input
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder={reference || 'Referencia de la transferencia'}
              maxLength={128}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 bg-slate-950 px-3 py-3 text-xs font-bold text-slate-200 hover:border-amber-400">
            <Upload className="h-4 w-4 text-amber-300" />
            <span>{receiptName || 'Adjuntar PDF o imagen'}</span>
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => handleFileChange(event.target.files?.[0])} />
          </label>
          {receiptName && <p className="flex items-center gap-1 text-[10px] text-emerald-300"><FileText className="h-3 w-3" /> Comprobante listo para enviar.</p>}
          {(fileError || submitError) && <p className="text-[11px] font-semibold text-rose-300">{fileError || submitError}</p>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-black text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isSubmitting ? 'Enviando...' : 'Enviar a administración'}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
