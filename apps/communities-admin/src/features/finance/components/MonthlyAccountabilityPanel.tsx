'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, LockKeyhole, Plus, Upload } from 'lucide-react';
import { API_BASE } from '@/lib/api-url';
import { MonthlyExpense, useMonthlyReports } from '../hooks/useMonthlyReports';

const CATEGORIES = [
  ['SECURITY_PAYROLL', 'Sueldos de vigilancia'],
  ['ADMINISTRATION', 'Administración'],
  ['CLEANING', 'Limpieza comunal'],
  ['GARDENING', 'Poda y jardinería'],
  ['GATE_MAINTENANCE', 'Portón y accesos'],
  ['UTILITIES', 'Servicios'],
  ['REPAIRS', 'Reparaciones'],
  ['SUPPLIES', 'Insumos'],
  ['INSURANCE', 'Seguros'],
  ['BANK_FEES', 'Comisiones bancarias'],
  ['OTHER', 'Otro'],
] as const;
const INCOME_CATEGORIES: Record<string, string> = {
  MAINTENANCE_FEE: 'Mantenimiento',
  EXTRAORDINARY_FEE: 'Cuota extraordinaria',
  ADVANCE_MAINTENANCE: 'Anticipo de mantenimiento',
};

interface Props {
  tenantSlug: string;
  authToken?: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function MonthlyAccountabilityPanel({ tenantSlug, authToken, showToast }: Props) {
  const reports = useMonthlyReports(authToken);
  const now = new Date();
  const [period, setPeriod] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [openingBank, setOpeningBank] = useState('0');
  const [openingCash, setOpeningCash] = useState('0');
  const [expense, setExpense] = useState({ category: 'CLEANING', description: '', vendorName: '', expenseDate: `${period}-01`, amount: '', paymentMethod: 'SPEI_TRANSFER', reference: '' });
  const [reportedBank, setReportedBank] = useState('0');
  const [reportedCash, setReportedCash] = useState('0');
  const [publicationNotes, setPublicationNotes] = useState('');
  const [reportEvidenceVisibility, setReportEvidenceVisibility] = useState<'ADMIN_ONLY' | 'RESIDENTS'>('ADMIN_ONLY');
  const [reportEvidenceRedacted, setReportEvidenceRedacted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void reports.load(tenantSlug); }, [reports.load, tenantSlug]);
  useEffect(() => { setExpense((current) => ({ ...current, expenseDate: `${period}-01` })); }, [period]);

  const run = async (operation: () => Promise<void>, success: string) => {
    setError('');
    try {
      await operation();
      showToast(success);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'No se pudo completar la operación.';
      setError(message);
      showToast(message, 'error');
    }
  };

  const selected = reports.selected;
  const isDraft = selected?.status === 'DRAFT';
  const currentIncome = selected?.current;
  const cashIncome = (currentIncome?.payments || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    + (currentIncome?.annualPayments || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const approvedExpenseTotal = (currentIncome?.expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const openingTotal = Number(selected?.opening_bank_balance || 0) + Number(selected?.opening_cash_balance || 0);

  return (
    <section className="space-y-5" aria-labelledby="monthly-accountability-title">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-700"><FileText className="h-5 w-5" aria-hidden="true" /><span className="text-xs font-black uppercase">Rendición obligatoria</span></div>
          <h2 id="monthly-accountability-title" className="mt-1 font-heading text-xl font-black text-slate-950">Ingresos y egresos mensuales</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Solo administración captura y publica. Residentes consultan el cierre publicado y evidencias redactadas de su comunidad.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600"><LockKeyhole className="h-4 w-4" aria-hidden="true" /> Evidencia privada</span>
      </header>

      {error && <p role="alert" className="border-l-4 border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-4 border-r-0 border-slate-200 lg:border-r lg:pr-5">
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const [year, month] = period.split('-').map(Number);
            void run(() => reports.createDraft(tenantSlug, { year, month, openingBankBalance: Number(openingBank), openingCashBalance: Number(openingCash) }), 'Borrador mensual preparado.');
          }}>
            <h3 className="text-sm font-black text-slate-900">Nuevo periodo</h3>
            <label className="block text-xs font-bold text-slate-700">Mes<input required type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-bold text-slate-700">Saldo bancario inicial<input required type="number" step="0.01" value={openingBank} onChange={(e) => setOpeningBank(e.target.value)} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-bold text-slate-700">Efectivo inicial<input required type="number" step="0.01" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
            <button disabled={!authToken || reports.loading} className="inline-flex min-h-10 w-full items-center justify-center gap-2 bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden="true" /> Crear borrador</button>
          </form>

          <div>
            <h3 className="mb-2 text-sm font-black text-slate-900">Periodos</h3>
            <div className="space-y-2">
              {reports.reports.map((report) => {
                const active = report.id ? selected?.id === report.id : !selected && period === report.period_start.slice(0, 7);
                return <button key={`${report.period_start}-${report.revision}`} type="button" onClick={() => { if (report.id) void reports.open(tenantSlug, report.id); else { setPeriod(report.period_start.slice(0, 7)); reports.setSelected(null); } }} className={`w-full border px-3 py-2 text-left text-xs ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}><b className="block text-slate-900">{formatPeriod(report.period_start)}{report.revision ? ` · rev. ${report.revision}` : ''}</b><span className={report.status === 'PUBLISHED' ? 'text-emerald-700' : report.status === 'MISSING' ? 'text-rose-700' : report.status === 'IN_PROGRESS' ? 'text-blue-700' : 'text-amber-700'}>{report.status === 'PUBLISHED' ? 'Publicado' : report.status === 'DRAFT' ? 'Borrador' : report.status === 'IN_PROGRESS' ? 'Periodo actual' : 'Falta rendir'}</span></button>;
              })}
              {!reports.reports.length && <p className="text-xs text-slate-500">No hay rendiciones todavía.</p>}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          {!selected && <div className="border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Selecciona o crea un periodo mensual.</div>}
          {selected && <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Estado" value={selected.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'} />
              <Metric label="Saldo inicial" value={money(Number(selected.opening_bank_balance) + Number(selected.opening_cash_balance))} />
              <Metric label="Diferencia" value={selected.variance == null ? 'Pendiente' : money(Number(selected.variance))} />
            </div>

            <div className="space-y-3 border-y border-slate-200 py-4">
              <h3 className="text-sm font-black text-slate-900">Vista previa de caja del periodo</h3>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Ingresos cobrados" value={money(cashIncome)} />
                <Metric label="Egresos aprobados" value={money(approvedExpenseTotal)} />
                <Metric label="Cierre calculado" value={money(openingTotal + cashIncome - approvedExpenseTotal)} />
                <Metric label="Comprobantes pendientes" value={`${currentIncome?.pendingPayments?.count || 0} · ${money(Number(currentIncome?.pendingPayments?.amount || 0))}`} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(currentIncome?.payments || []).map((item, index) => <div key={`${item.date}-${item.category}-${item.payment_method}-${index}`} className="flex justify-between border-b border-slate-200 py-2 text-xs"><span>{item.date} · {INCOME_CATEGORIES[item.category] || item.category} · {item.payment_method} ({item.count})</span><b>{money(Number(item.amount))}</b></div>)}
                {(currentIncome?.annualPayments || []).map((item) => <div key={`advance-${item.date}-${item.payment_method}`} className="flex justify-between border-b border-slate-200 py-2 text-xs"><span>{item.date} · Anticipos campaña anual · {item.payment_method} ({item.count})</span><b>{money(Number(item.amount))}</b></div>)}
                <div className="flex justify-between border-b border-slate-200 py-2 text-xs"><span>Cargos emitidos / saldo sin cobrar</span><b>{money(Number(currentIncome?.charges?.balance_due || 0))}</b></div>
              </div>
              <p className="text-[11px] text-slate-500">Los cargos emitidos y comprobantes pendientes se informan aparte y no suman a ingresos cobrados.</p>
            </div>

            {isDraft && <form className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await reports.createExpense(tenantSlug, selected.id, { ...expense, amount: Number(expense.amount) });
                setExpense((current) => ({ ...current, description: '', vendorName: '', amount: '', reference: '' }));
              }, 'Gasto registrado.');
            }}>
              <h3 className="sm:col-span-2 text-sm font-black text-slate-900">Registrar egreso</h3>
              <label className="text-xs font-bold text-slate-700">Categoría<select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm">{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs font-bold text-slate-700">Fecha<input required type="date" value={expense.expenseDate} onChange={(e) => setExpense({ ...expense, expenseDate: e.target.value })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-700 sm:col-span-2">Descripción<input required maxLength={500} value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-700">Proveedor<input maxLength={160} value={expense.vendorName} onChange={(e) => setExpense({ ...expense, vendorName: e.target.value })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-700">Monto<input required min="0.01" step="0.01" type="number" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-700">Método<select value={expense.paymentMethod} onChange={(e) => setExpense({ ...expense, paymentMethod: e.target.value })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"><option value="SPEI_TRANSFER">SPEI</option><option value="BANK_TRANSFER">Transferencia</option><option value="CASH">Efectivo</option><option value="CHECK">Cheque</option><option value="CARD">Tarjeta</option><option value="OTHER">Otro</option></select></label>
              <label className="text-xs font-bold text-slate-700">Referencia<input maxLength={128} value={expense.reference} onChange={(e) => setExpense({ ...expense, reference: e.target.value })} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <button className="sm:col-span-2 inline-flex min-h-10 items-center justify-center gap-2 bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" aria-hidden="true" /> Agregar egreso</button>
            </form>}

            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900">Egresos del periodo</h3>
              {(selected.expenses || []).map((item) => <ExpenseRow key={item.id} expense={item} isDraft={Boolean(isDraft)} authToken={authToken} tenantSlug={tenantSlug} reportId={selected.id} onUpload={reports.uploadEvidence} onApprove={reports.approveExpense} run={run} />)}
              {!selected.expenses?.length && <p className="text-sm text-slate-500">No hay egresos capturados.</p>}
            </div>

            {isDraft && <section className="space-y-3 border-t border-slate-200 pt-5" aria-labelledby="period-evidence-heading">
              <div><h3 id="period-evidence-heading" className="text-sm font-black text-slate-900">Estado de cuenta y evidencia del periodo</h3><p className="text-xs text-slate-500">Adjunta aquí estados bancarios u otros documentos generales del cierre.</p></div>
              <div className="space-y-2">{(selected.reportEvidence || []).map((item) => <div key={item.id} className="flex items-center justify-between border border-slate-200 px-3 py-2 text-xs"><span>{item.fileName} · {item.visibility === 'RESIDENTS' ? 'Residentes (redactada)' : 'Solo administración'}</span><button type="button" onClick={() => void downloadEvidence(`${API_BASE}/tenants/${tenantSlug}/finance/monthly-reports/evidence/${item.id}/content`, authToken, item.fileName)} className="text-blue-700 underline">Descargar</button></div>)}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Visibilidad del archivo<select value={reportEvidenceVisibility} onChange={(e) => setReportEvidenceVisibility(e.target.value as typeof reportEvidenceVisibility)} className="mt-1 w-full border border-slate-300 px-3 py-2"><option value="ADMIN_ONLY">Solo administración</option><option value="RESIDENTS">Compartir copia redactada con residentes</option></select></label>
                {reportEvidenceVisibility === 'RESIDENTS' && <label className="flex items-start gap-2 pt-5 text-xs text-slate-700"><input type="checkbox" checked={reportEvidenceRedacted} onChange={(e) => setReportEvidenceRedacted(e.target.checked)} className="mt-0.5 h-4 w-4" /><span>Confirmo que esta copia oculta cuentas bancarias, CLABE, nómina y demás datos personales.</span></label>}
                <label className="text-xs font-bold text-slate-700">Agregar PDF/JPG/PNG<input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-1 block w-full text-xs" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (reportEvidenceVisibility === 'RESIDENTS' && !reportEvidenceRedacted) { setError('Confirma que la copia está redactada antes de compartirla.'); event.target.value = ''; return; } void run(() => reports.uploadReportEvidence(tenantSlug, selected.id, file, reportEvidenceVisibility, reportEvidenceRedacted), 'Evidencia del periodo cargada.'); event.target.value = ''; }} /></label>
              </div>
            </section>}

            {isDraft && <form className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event) => {
              event.preventDefault();
              void run(() => reports.publish(tenantSlug, selected.id, { reportedBankBalance: Number(reportedBank), reportedCashBalance: Number(reportedCash), publicationNotes: publicationNotes || undefined }), 'Rendición publicada para residentes.');
            }}>
              <h3 className="sm:col-span-2 text-sm font-black text-slate-900">Conciliar y publicar</h3>
              <label className="text-xs font-bold text-slate-700">Saldo bancario final<input required type="number" step="0.01" value={reportedBank} onChange={(e) => setReportedBank(e.target.value)} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-700">Efectivo final<input required type="number" step="0.01" value={reportedCash} onChange={(e) => setReportedCash(e.target.value)} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold text-slate-700 sm:col-span-2">Notas de conciliación<textarea value={publicationNotes} onChange={(e) => setPublicationNotes(e.target.value)} maxLength={3000} rows={3} className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm" /></label>
              <button className="sm:col-span-2 inline-flex min-h-10 items-center justify-center gap-2 bg-emerald-600 px-3 py-2 text-sm font-bold text-white"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Publicar cierre mensual</button>
            </form>}
          </>}
        </div>
      </div>
    </section>
  );
}

function ExpenseRow({ expense, isDraft, tenantSlug, reportId, authToken, onUpload, onApprove, run }: {
  expense: MonthlyExpense; isDraft: boolean; tenantSlug: string; reportId: string; authToken?: string;
  onUpload: ReturnType<typeof useMonthlyReports>['uploadEvidence']; onApprove: ReturnType<typeof useMonthlyReports>['approveExpense'];
  run: (operation: () => Promise<void>, success: string) => Promise<void>;
}) {
  const [visibility, setVisibility] = useState<'ADMIN_ONLY' | 'RESIDENTS'>('ADMIN_ONLY');
  const [isRedacted, setIsRedacted] = useState(false);
  const [exception, setException] = useState('');
  return <article className="border border-slate-200 bg-white p-4">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><b className="text-sm text-slate-900">{expense.description}</b><p className="text-xs text-slate-500">{expense.expense_date.slice(0, 10)} · {expense.vendor_name || 'Sin proveedor'} · {expense.category}</p></div><b className="text-sm text-rose-700">{money(Number(expense.amount))}</b></div>
    <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="font-bold text-slate-600">{expense.status}</span>{expense.evidence.map((item) => <a key={item.id} href={`${API_BASE}/tenants/${tenantSlug}/finance/monthly-reports/evidence/${item.id}/content`} onClick={(event) => { event.preventDefault(); void downloadEvidence(event.currentTarget.href, authToken, item.fileName); }} className="text-blue-700 underline">{item.fileName}{item.visibility === 'RESIDENTS' ? ' · visible' : ' · privado'}</a>)}</div>
    {isDraft && expense.status === 'DRAFT' && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
      <label className="text-xs font-bold text-slate-700">Evidencia PDF/JPG/PNG<input type="file" accept="application/pdf,image/jpeg,image/png" className="mt-1 block w-full text-xs" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (visibility === 'RESIDENTS' && !isRedacted) { event.target.value = ''; return; } void run(() => onUpload(tenantSlug, reportId, expense.id, file, visibility, isRedacted), 'Evidencia almacenada.'); event.target.value = ''; }} /></label>
      <label className="text-xs font-bold text-slate-700">Visibilidad<select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="mt-1 w-full border border-slate-300 px-2 py-2"><option value="ADMIN_ONLY">Solo admin</option><option value="RESIDENTS">Residentes (redactada)</option></select></label>
      {visibility === 'RESIDENTS' && <label className="sm:col-span-3 flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" checked={isRedacted} onChange={(e) => setIsRedacted(e.target.checked)} className="mt-0.5 h-4 w-4" /><span>Confirmo que la copia oculta cuentas bancarias, CLABE, nómina y demás datos personales.</span></label>}
      <button type="button" onClick={() => void run(() => onApprove(tenantSlug, reportId, expense.id, exception), 'Egreso aprobado.' )} className="mt-5 min-h-10 bg-slate-900 px-3 py-2 text-xs font-bold text-white">Aprobar</button>
      {!expense.evidence.length && <label className="sm:col-span-3 text-xs font-bold text-slate-700">Excepción sin evidencia<input value={exception} onChange={(e) => setException(e.target.value)} maxLength={500} placeholder="Justificación obligatoria si no hay archivo" className="mt-1 w-full border border-slate-300 px-3 py-2" /></label>}
    </div>}
  </article>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-slate-200 bg-slate-50 p-3"><span className="block text-[10px] font-bold uppercase text-slate-500">{label}</span><b className="mt-1 block text-lg text-slate-950">{value}</b></div>; }
function money(value: number) { return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }); }
function formatPeriod(value: string) { return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }); }
async function downloadEvidence(url: string, authToken: string | undefined, fileName: string) { const response = await fetch(url, { headers: { Authorization: `Bearer ${authToken || ''}` } }); if (!response.ok) return; const objectUrl = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(objectUrl); }
