'use client';

import React, { useEffect, useState } from 'react';
import { BadgeDollarSign, Check, Plus, X } from 'lucide-react';
import { AnnualCampaign, AnnualCampaignFormData } from '@/types';
import { Property } from '@/types';
import { API_BASE } from '@/lib/api-url';

interface Props {
  tenantSlug: string;
  campaigns: AnnualCampaign[];
  form: AnnualCampaignFormData;
  setForm: React.Dispatch<React.SetStateAction<AnnualCampaignFormData>>;
  commitments: any[];
  loading: boolean;
  loadCampaigns: (slug: string) => Promise<void>;
  createCampaign: (slug: string) => Promise<boolean>;
  loadCommitments: (slug: string, id: string) => Promise<void>;
  review: (slug: string, id: string, status: 'APPROVED' | 'REJECTED') => Promise<boolean>;
  recordCash: (slug: string, campaignId: string, propertyId: string, amount: number, reference: string) => Promise<boolean>;
  properties: Property[];
}

export function AnnualCampaignPanel({ tenantSlug, campaigns, form, setForm, commitments, loading, loadCampaigns, createCampaign, loadCommitments, review, recordCash, properties }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [cashPropertyId, setCashPropertyId] = useState('');
  useEffect(() => { loadCampaigns(tenantSlug); }, [loadCampaigns, tenantSlug]);
  const selected = campaigns.find((item) => item.id === selectedId) || campaigns[0];
  const pending = commitments.filter((item) => item.status === 'PENDING_APPROVAL');
  const approved = commitments.filter((item) => item.status === 'APPROVED');
  const bag = approved.reduce((total, item) => total + Number(item.net_amount), 0);

  return <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-2xs">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><BadgeDollarSign className="h-5 w-5 text-amber-600" /><h2 className="font-heading text-lg font-black text-slate-900">Campañas de pago anual</h2></div><p className="mt-1 text-xs text-slate-500">Identifica compromisos, descuentos otorgados y la bolsa aprobada de prepago.</p></div><button type="button" onClick={() => setIsCreating(!isCreating)} className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950"><Plus className="h-4 w-4" /> Nueva campaña</button></div>
    {isCreating && <div className="mt-4 grid gap-3 rounded-xl bg-amber-50 p-4 sm:grid-cols-2"><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" placeholder="Nombre de campaña" /><input type="number" value={form.discountPercentage} onChange={(e) => setForm((f) => ({ ...f, discountPercentage: Number(e.target.value) }))} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" placeholder="Descuento %" /><input type="date" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /><input type="date" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs" /><button type="button" disabled={loading} onClick={async () => { await createCampaign(tenantSlug); setIsCreating(false); }} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white sm:col-span-2">Crear y activar campaña</button></div>}
    <div className="mt-4 flex flex-wrap gap-2">{campaigns.map((campaign) => <button key={campaign.id} type="button" onClick={() => { setSelectedId(campaign.id); loadCommitments(tenantSlug, campaign.id); }} className={`rounded-lg border px-3 py-2 text-left text-xs ${selected?.id === campaign.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'}`}><b className="block text-slate-900">{campaign.name}</b><span className="text-slate-500">{campaign.discount_percentage}% · {campaign.status}</span></button>)}</div>
    {selected && <><div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Compromisos" value={String(commitments.length)} /><Metric label="Pendientes" value={String(pending.length)} tone="amber" /><Metric label="Residentes aprobados" value={String(approved.length)} tone="green" /><Metric label="Bolsa aprobada" value={`$${bag.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} tone="blue" /></div><div className="mt-4 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3"><select value={cashPropertyId} onChange={(e) => setCashPropertyId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"><option value="">Registrar efectivo para vivienda...</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.street} #{p.exterior_number}</option>)}</select><button type="button" disabled={!cashPropertyId} onClick={async () => { const item = properties.find((p) => p.id === cashPropertyId); const quote = await fetch(`${API_BASE}/tenants/${tenantSlug}/finance/annual-campaigns/${selected.id}/quote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: cashPropertyId }) }).then((r) => r.json()); if (item && quote.data) { await recordCash(tenantSlug, selected.id, cashPropertyId, quote.data.netAmount, `CASH-ANUAL-${Date.now()}`); await loadCommitments(tenantSlug, selected.id); setCashPropertyId(''); } }} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Registrar pago en efectivo</button></div><div className="mt-4 space-y-2">{commitments.map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"><div><b className="text-slate-900">{item.street} #{item.exterior_number}</b><span className="ml-2 text-slate-500">{item.reference} · ${Number(item.net_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span><span className={`ml-2 font-bold ${item.status === 'APPROVED' ? 'text-emerald-600' : item.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`}>{item.status}</span></div>{item.status === 'PENDING_APPROVAL' && <div className="flex gap-2"><button type="button" onClick={() => review(tenantSlug, item.id, 'APPROVED')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white"><Check className="h-3 w-3" /> Aprobar</button><button type="button" onClick={() => review(tenantSlug, item.id, 'REJECTED')} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700"><X className="h-3 w-3" /> Rechazar</button></div>}</div>)}</div></>}
  </section>;
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string; tone?: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="block text-[10px] font-bold uppercase text-slate-400">{label}</span><b className={`mt-1 block text-lg font-black ${tone === 'amber' ? 'text-amber-600' : tone === 'green' ? 'text-emerald-600' : tone === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>{value}</b></div>; }