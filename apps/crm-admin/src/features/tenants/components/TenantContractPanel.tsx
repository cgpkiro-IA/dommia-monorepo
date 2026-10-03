'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, CircleDollarSign, LoaderCircle, MailCheck, RefreshCw } from 'lucide-react';
import { TenantContractSummary } from '../../../types';
import { crmApiFetch } from '../../auth/api';

interface TenantContractPanelProps {
  tenant: { id: string; contact_email?: string | null };
}

type ContractState = 'loading' | 'ready' | 'missing' | 'error';

function formatAmount(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined) return 'Sin monto verificado';
  return `$${Number(amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha registrada';
  return new Date(value).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

function toLocalDateTime(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TenantContractPanel({ tenant }: TenantContractPanelProps) {
  const [contract, setContract] = useState<TenantContractSummary | null>(null);
  const [contractState, setContractState] = useState<ContractState>('loading');
  const [contractMessage, setContractMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [agreedAmount, setAgreedAmount] = useState('');
  const [paidThrough, setPaidThrough] = useState('');
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [noticeRecipient, setNoticeRecipient] = useState(tenant.contact_email || '');
  const [noticeText, setNoticeText] = useState<string | null>(null);

  const loadContract = async (signal?: AbortSignal) => {
    setContractState('loading');
    setContractMessage(null);
    try {
      const response = await crmApiFetch(`/crm/tenants/${tenant.id}/contract`, { signal });
      if (response.status === 404) {
        setContract(null);
        setContractState('missing');
        return;
      }
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo consultar el contrato.');
      setContract(result.data as TenantContractSummary);
      setNoticeRecipient((current) => current || result.data?.renewalNoticeTo || '');
      setAgreedAmount(result.data?.amount == null ? '' : String(result.data.amount));
      setPaidThrough(toLocalDateTime(result.data?.currentPeriodEnd));
      setBillingInterval(result.data?.billingInterval === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY');
      setContractState('ready');
    } catch (error) {
      if (signal?.aborted) return;
      setContractMessage(error instanceof Error ? error.message : 'No se pudo consultar el contrato.');
      setContractState('error');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setContract(null);
    setNoticeRecipient(tenant.contact_email || '');
    setNoticeText(null);
    void loadContract(controller.signal);
    return () => controller.abort();
  }, [tenant.id]);

  const postContractAction = async (path: string, body?: Record<string, unknown>) => {
    setActionBusy(true);
    setContractMessage(null);
    try {
      const response = await crmApiFetch(`/crm/tenants/${tenant.id}/contract${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'No se pudo actualizar el contrato.');
      if (result.data?.suggestedNoticeText) setNoticeText(result.data.suggestedNoticeText);
      if (result.data?.emailSent) setNoticeText(`Aviso enviado a ${result.data.renewalNoticeTo}.`);
      if (result.data?.preview) setNoticeText(`Correo de prueba enviado a ${result.data.recipient}. El aviso original no cambió.`);
      await loadContract();
      return true;
    } catch (error) {
      setContractMessage(error instanceof Error ? error.message : 'No se pudo actualizar el contrato.');
      return false;
    } finally {
      setActionBusy(false);
    }
  };

  const reconcileContract = () => postContractAction('/reconcile', {
    amount: Number(agreedAmount),
    billingInterval,
    currentPeriodEnd: new Date(paidThrough).toISOString(),
  });

  const createInitialContract = () => postContractAction('');
  const sendNotice = () => postContractAction('/renewal-notice/send', { recipient: noticeRecipient });
  const previewNotice = () => postContractAction('/renewal-notice/preview', { recipient: noticeRecipient });
  const renewContract = () => postContractAction('/renew');

  const contractNeedsReview = contract?.contractReviewRequired || contract?.amount == null;
  const catalogPrice = Number(contract?.catalogRenewalAmount);
  const lockedPrice = Number(contract?.amount);
  const priceIncreasePending = Number.isFinite(catalogPrice) && Number.isFinite(lockedPrice) && catalogPrice > lockedPrice;
  const noticeMatchesCatalog = Boolean(
    contract?.renewalNoticeSentAt
    && contract?.renewalAmount != null
    && Number(contract.renewalAmount) === catalogPrice,
  );
  const periodDue = Boolean(contract?.currentPeriodEnd && new Date(contract.currentPeriodEnd).getTime() <= Date.now());
  const periodLabel = contract?.billingInterval === 'ANNUAL' ? 'año' : 'mes';
  const canRenew = Boolean(contract && !contractNeedsReview && periodDue && (!priceIncreasePending || noticeMatchesCatalog));

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3" aria-labelledby="tenant-contract-heading">
      <div className="flex items-center gap-2">
        <CircleDollarSign className="h-4 w-4 text-blue-600" aria-hidden="true" />
        <h4 id="tenant-contract-heading" className="text-xs font-bold text-slate-800">Contrato SaaS</h4>
      </div>

      {contractState === 'loading' && (
        <p className="flex items-center gap-2 text-xs text-slate-500" role="status">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Consultando contrato…
        </p>
      )}

      {contractState === 'error' && (
        <div className="space-y-2 text-xs text-rose-700" role="alert">
          <p>{contractMessage}</p>
          <button type="button" onClick={() => void loadContract()} className="font-semibold underline">Reintentar</button>
        </div>
      )}

      {(contractState === 'missing' || (contractState === 'ready' && contractNeedsReview)) && (
        <div className="space-y-3">
          <p className="flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {contractState === 'missing'
              ? 'No hay snapshot contractual. Captura el monto y la fecha pagada que confirma el acuerdo.'
              : 'El monto histórico no está verificado. No lo reemplazamos con el precio actual del catálogo.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-[11px] font-semibold text-slate-700">
              Periodicidad acordada
              <select
                value={billingInterval}
                onChange={(event) => setBillingInterval(event.target.value as 'MONTHLY' | 'ANNUAL')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <option value="MONTHLY">Mensual</option>
                <option value="ANNUAL">Anual prepagado</option>
              </select>
            </label>
            <label className="text-[11px] font-semibold text-slate-700">
              Monto {billingInterval === 'ANNUAL' ? 'anual' : 'mensual'} acordado (MXN)
              <input
                type="number"
                min="0"
                step="0.01"
                value={agreedAmount}
                onChange={(event) => setAgreedAmount(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
              />
            </label>
            <label className="text-[11px] font-semibold text-slate-700">
              Pagado hasta
              <input
                type="datetime-local"
                value={paidThrough}
                onChange={(event) => setPaidThrough(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={actionBusy || !agreedAmount || !paidThrough}
            onClick={() => void reconcileContract()}
            className="min-h-10 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {actionBusy ? 'Guardando…' : 'Guardar términos confirmados'}
          </button>
          {contractMessage && <p className="text-xs text-rose-700" role="alert">{contractMessage}</p>}
        </div>
      )}

      {contractState === 'ready' && contract && !contractNeedsReview && (
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div><dt className="text-slate-500">Precio protegido</dt><dd className="font-bold text-slate-900">{formatAmount(contract.amount)} / {periodLabel}</dd></div>
            <div><dt className="text-slate-500">Plan contratado</dt><dd className="font-bold text-slate-900">{contract.planTier}</dd></div>
            <div><dt className="text-slate-500">Pagado hasta</dt><dd className="font-semibold text-slate-800">{formatDate(contract.currentPeriodEnd)}</dd></div>
            <div><dt className="text-slate-500">Próxima tarifa de catálogo</dt><dd className="font-semibold text-slate-800">{formatAmount(contract.catalogRenewalAmount)} / {periodLabel}</dd></div>
          </dl>

          {priceIncreasePending && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs text-amber-950">El aumento queda pendiente para la renovación. Envía el aviso al correo del cliente antes del vencimiento.</p>
              {contract.renewalNoticeSentAt && (
                <p className="text-[11px] font-semibold text-emerald-800">Aviso registrado a {contract.renewalNoticeTo} el {formatDate(contract.renewalNoticeSentAt)} por {formatAmount(contract.renewalAmount)} / {periodLabel}.</p>
              )}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Correo destinatario
                  <input
                    type="email"
                    required
                    value={noticeRecipient}
                    onChange={(event) => setNoticeRecipient(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {!noticeMatchesCatalog && (
                  <button
                    type="button"
                    disabled={actionBusy || !noticeRecipient}
                    onClick={() => void sendNotice()}
                    className="min-h-9 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {actionBusy ? 'Enviando…' : 'Enviar aviso por correo'}
                  </button>
                  )}
                  <button
                    type="button"
                    disabled={actionBusy || !noticeRecipient}
                    onClick={() => void previewNotice()}
                    className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {actionBusy ? 'Enviando…' : 'Enviar correo de prueba'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {noticeText && (
            <p className="rounded-lg bg-white p-3 text-xs text-slate-700" aria-live="polite">{noticeText}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
            <p className="text-[11px] text-slate-500">
              {periodDue ? 'Periodo vencido.' : `Renovación disponible al vencer el ${formatDate(contract.currentPeriodEnd)}.`}
            </p>
            <button
              type="button"
              disabled={actionBusy || !canRenew}
              onClick={() => void renewContract()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {actionBusy ? 'Procesando…' : 'Confirmar renovación manual'}
            </button>
          </div>
          {contractMessage && <p className="text-xs text-rose-700" role="alert">{contractMessage}</p>}
        </div>
      )}
    </section>
  );
}