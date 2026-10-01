'use client';

import { useState } from 'react';
import { ChevronDown, FileCheck2, FileText, RefreshCw } from 'lucide-react';
import { PublishedMonthlyReport } from '../hooks/useMonthlyFinancialReports';

interface Props {
  reports: PublishedMonthlyReport[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onReview: (id: string) => Promise<void>;
  onDownloadEvidence: (id: string, fileName: string) => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  SECURITY_PAYROLL: 'Vigilancia', ADMINISTRATION: 'Administración', CLEANING: 'Limpieza', GARDENING: 'Poda y jardinería',
  GATE_MAINTENANCE: 'Portón y accesos', UTILITIES: 'Servicios', REPAIRS: 'Reparaciones', SUPPLIES: 'Insumos',
  INSURANCE: 'Seguros', BANK_FEES: 'Comisiones bancarias', OTHER: 'Otros',
};
const INCOME_LABELS: Record<string, string> = {
  MAINTENANCE_FEE: 'Mantenimiento',
  EXTRAORDINARY_FEE: 'Cuota extraordinaria',
  ADVANCE_MAINTENANCE: 'Anticipo de mantenimiento',
};

export function MonthlyFinancialReports({ reports, loading, error, onRefresh, onReview, onDownloadEvidence }: Props) {
  const [openId, setOpenId] = useState<string | null>(reports[0]?.id || null);

  return <section className="mx-4 mb-6 border border-slate-800 bg-slate-900/90 text-white" aria-labelledby="monthly-reports-title">
    <header className="flex items-center justify-between border-b border-slate-800 p-4">
      <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-sky-400" aria-hidden="true" /><div><h3 id="monthly-reports-title" className="font-heading text-sm font-extrabold">Rendición mensual</h3><p className="text-[11px] text-slate-400">Ingresos, egresos y evidencias publicadas</p></div></div>
      <button type="button" onClick={onRefresh} aria-label="Actualizar rendiciones" className="flex min-h-10 min-w-10 items-center justify-center text-slate-300 hover:text-white"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /></button>
    </header>
    {error && <p role="alert" className="m-4 border-l-4 border-rose-500 bg-rose-950 px-3 py-2 text-xs text-rose-100">{error}</p>}
    {!loading && !reports.length && <p className="p-6 text-center text-xs text-slate-400">La administración aún no publica rendiciones mensuales.</p>}
    <div className="divide-y divide-slate-800">
      {reports.map((report) => {
        const expanded = openId === report.id;
        const snapshot = report.report_snapshot;
        return <article key={report.id}>
          <button type="button" onClick={() => setOpenId(expanded ? null : report.id)} aria-expanded={expanded} className="flex min-h-14 w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-800/60">
            <div><b className="block text-sm">{formatPeriod(report.period_start)} · revisión {report.revision}</b><span className="text-[11px] text-slate-400">Publicado {new Date(report.published_at).toLocaleDateString('es-MX')}</span></div>
            <div className="flex items-center gap-3"><span className={report.reviewed_by_current_resident ? 'text-emerald-400 text-xs' : 'text-slate-500 text-xs'}>{report.reviewed_by_current_resident ? 'Revisado' : 'Revisión opcional'}</span><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></div>
          </button>
          {expanded && <div className="space-y-4 bg-slate-950/50 p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Ingresos cobrados" value={money(snapshot.income.total)} tone="green" /><Metric label="Egresos pagados" value={money(snapshot.expenses.total)} tone="red" /><Metric label="Saldo final" value={money(snapshot.closing.reportedTotal)} /><Metric label="Diferencia" value={money(snapshot.closing.variance)} tone={Math.abs(snapshot.closing.variance) > 0.01 ? 'amber' : 'green'} /></div>
            <div><h4 className="text-xs font-black uppercase text-slate-300">Saldos</h4><div className="mt-2 grid gap-2 sm:grid-cols-2"><Metric label="Saldo inicial · banco" value={money(snapshot.opening.bank)} /><Metric label="Saldo inicial · efectivo" value={money(snapshot.opening.cash)} /><Metric label="Saldo final · banco" value={money(snapshot.closing.reportedBank)} /><Metric label="Saldo final · efectivo" value={money(snapshot.closing.reportedCash)} /></div></div>
            <div><h4 className="text-xs font-black uppercase text-slate-300">Ingresos registrados (agrupados sin datos de residentes)</h4><div className="mt-2 space-y-1">{snapshot.income.regular.map((item, index) => <div key={`${item.date}-${item.category}-${item.paymentMethod}-${index}`} className="flex justify-between border-b border-slate-800 py-2 text-xs"><span>{item.date} · {INCOME_LABELS[item.category] || item.category} · {item.paymentMethod} ({item.count})</span><b className="text-emerald-300">{money(item.amount)}</b></div>)}{snapshot.income.annualAdvance.entries.map((item) => <div key={`advance-${item.date}-${item.paymentMethod}`} className="flex justify-between border-b border-slate-800 py-2 text-xs"><span>{item.date} · Anticipos de campaña anual · {item.paymentMethod} ({item.count})</span><b className="text-emerald-300">{money(item.amount)}</b></div>)}</div></div>
            <div><h4 className="text-xs font-black uppercase text-slate-300">Egresos por categoría</h4><div className="mt-2 grid gap-2 sm:grid-cols-2">{snapshot.expenses.byCategory.map((item) => <div key={item.category} className="flex justify-between border-b border-slate-800 py-2 text-xs"><span>{CATEGORY_LABELS[item.category] || item.category} ({item.count})</span><b>{money(item.amount)}</b></div>)}</div></div>
            {snapshot.reportEvidence.length > 0 && <div><h4 className="text-xs font-black uppercase text-slate-300">Estados de cuenta y soportes publicados</h4><div className="mt-2 flex flex-wrap gap-2">{snapshot.reportEvidence.map((item) => <button key={item.id} type="button" onClick={() => void onDownloadEvidence(item.id, item.fileName)} className="inline-flex min-h-10 items-center gap-1 border border-slate-700 px-3 py-2 text-xs text-sky-300 underline"><FileCheck2 className="h-4 w-4" aria-hidden="true" />{item.fileName}</button>)}</div></div>}
            {(snapshot.activity.pendingPaymentCount > 0 || snapshot.activity.chargesOutstandingAmount > 0) && <p className="border-l-2 border-amber-400 pl-3 text-xs text-slate-300">No incluido en ingresos cobrados: {snapshot.activity.pendingPaymentCount} comprobantes pendientes ({money(snapshot.activity.pendingPaymentAmount)}) · cargos emitidos pendientes ({money(snapshot.activity.chargesOutstandingAmount)}).</p>}
            <div><h4 className="text-xs font-black uppercase text-slate-300">Detalle y evidencia</h4><div className="mt-2 space-y-2">{snapshot.expenses.items.map((item) => <div key={item.id} className="border border-slate-800 p-3 text-xs"><div className="flex justify-between gap-3"><div><b>{item.description}</b><p className="text-slate-400">{item.expenseDate} · {CATEGORY_LABELS[item.category] || item.category}</p></div><b className="text-rose-300">{money(item.amount)}</b></div>{item.evidence.map((evidence) => <button key={evidence.id} type="button" onClick={() => void onDownloadEvidence(evidence.id, evidence.fileName)} className="mt-2 inline-flex min-h-9 items-center gap-1 text-sky-300 underline"><FileCheck2 className="h-4 w-4" aria-hidden="true" />{evidence.fileName}</button>)}</div>)}</div></div>
            {report.publication_notes && <p className="border-l-2 border-amber-400 pl-3 text-xs text-slate-300"><b>Notas de conciliación:</b> {report.publication_notes}</p>}
            {!report.reviewed_by_current_resident && <button type="button" onClick={() => void onReview(report.id)} className="min-h-10 border border-sky-500 px-4 py-2 text-xs font-bold text-sky-200 hover:bg-sky-950">Marcar como revisado (opcional)</button>}
          </div>}
        </article>;
      })}
    </div>
  </section>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'red' | 'amber' }) { const color = tone === 'green' ? 'text-emerald-400' : tone === 'red' ? 'text-rose-400' : tone === 'amber' ? 'text-amber-300' : 'text-white'; return <div className="border border-slate-800 p-3"><span className="block text-[10px] font-bold uppercase text-slate-500">{label}</span><b className={`mt-1 block text-sm ${color}`}>{value}</b></div>; }
function money(value: number) { return Number(value || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }); }
function formatPeriod(value: string) { return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }); }
