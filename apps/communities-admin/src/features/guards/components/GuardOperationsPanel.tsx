'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Car, Check, RefreshCw, Trash2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type Incident = {
  id: string;
  incident_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  property_address?: string;
  vehicle_plates?: string;
  status: 'OPEN' | 'RESOLVED';
  created_by_name?: string;
  created_at: string;
  resolved_by_name?: string;
};

type VehicleFlag = {
  id: string;
  plates: string;
  flag_type: 'BLOCKED' | 'FREQUENT_VISITOR';
  reason: string;
  created_at: string;
};

type GuardOperationsPanelProps = {
  tenantSlug: string;
  authToken: string;
};

const incidentLabels: Record<string, string> = {
  SECURITY: 'Seguridad',
  SUSPICIOUS_VEHICLE: 'Vehículo sospechoso',
  MEDICAL: 'Emergencia médica',
  FIRE: 'Incendio',
  MAINTENANCE: 'Mantenimiento',
  OTHER: 'Otro',
};

const priorityLabels: Record<Incident['priority'], string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export function GuardOperationsPanel({ tenantSlug, authToken }: GuardOperationsPanelProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vehicleFlags, setVehicleFlags] = useState<VehicleFlag[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [plates, setPlates] = useState('');
  const [flagType, setFlagType] = useState<VehicleFlag['flag_type']>('BLOCKED');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOperations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${authToken}`, 'Cache-Control': 'no-store' };
      const [incidentResponse, flagResponse] = await Promise.all([
        fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guard/incidents?status=${showResolved ? 'RESOLVED' : 'OPEN'}`, { headers }),
        fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guard/vehicle-flags`, { headers }),
      ]);
      const [incidentBody, flagBody] = await Promise.all([incidentResponse.json(), flagResponse.json()]);
      if (!incidentResponse.ok || !incidentBody.success) throw new Error(incidentBody.message || 'No se pudieron cargar las incidencias.');
      if (!flagResponse.ok || !flagBody.success) throw new Error(flagBody.message || 'No se pudo cargar la clasificación de placas.');
      setIncidents(incidentBody.data as Incident[]);
      setVehicleFlags(flagBody.data as VehicleFlag[]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las operaciones de Guard.');
    } finally {
      setLoading(false);
    }
  }, [authToken, showResolved, tenantSlug]);

  useEffect(() => {
    void loadOperations();
  }, [loadOperations]);

  const handleResolve = async (incidentId: string) => {
    setResolvingId(incidentId);
    setError('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guard/incidents/${encodeURIComponent(incidentId)}/resolve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudo resolver la incidencia.');
      setMessage('Incidencia marcada como resuelta.');
      await loadOperations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo resolver la incidencia.');
    } finally {
      setResolvingId(null);
    }
  };

  const handleCreateFlag = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guard/vehicle-flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ plates: plates.trim(), flagType, reason: reason.trim() }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudo guardar la clasificación.');
      setPlates('');
      setReason('');
      setMessage('Clasificación guardada y disponible para Guard.');
      await loadOperations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar la clasificación.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFlag = async (flagId: string) => {
    setError('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guard/vehicle-flags/${encodeURIComponent(flagId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudo retirar la clasificación.');
      setMessage('Clasificación retirada.');
      await loadOperations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo retirar la clasificación.');
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="guard-operations-admin-title">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Dommia Guard</p>
          <h2 id="guard-operations-admin-title" className="mt-1 text-xl font-bold text-slate-900">Operación y alertas</h2>
          <p className="mt-1 text-sm text-slate-600">Incidencias reportadas por caseta y clasificación de placas para {tenantSlug}.</p>
        </div>
        <button type="button" onClick={() => void loadOperations()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" aria-label="Actualizar incidencias y placas">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </header>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="guard-incidents-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><h3 id="guard-incidents-title" className="text-sm font-bold text-slate-900">Incidencias</h3></div>
            <div className="flex gap-1" role="group" aria-label="Filtrar incidencias">
              <button type="button" aria-pressed={!showResolved} onClick={() => setShowResolved(false)} className="min-h-9 rounded-md px-3 text-xs font-semibold aria-pressed:bg-slate-900 aria-pressed:text-white">Pendientes</button>
              <button type="button" aria-pressed={showResolved} onClick={() => setShowResolved(true)} className="min-h-9 rounded-md px-3 text-xs font-semibold aria-pressed:bg-slate-900 aria-pressed:text-white">Resueltas</button>
            </div>
          </div>
          {loading ? <p className="p-5 text-sm text-slate-500">Cargando incidencias...</p> : incidents.length === 0 ? <p className="p-5 text-sm text-slate-500">No hay incidencias en esta vista.</p> : (
            <ul className="divide-y divide-slate-100">
              {incidents.map((incident) => (
                <li key={incident.id} className="grid gap-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{incidentLabels[incident.incident_type] || incident.incident_type}</span>
                    <span className={`rounded px-2 py-1 text-xs font-bold ${incident.priority === 'URGENT' || incident.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{priorityLabels[incident.priority]}</span>
                    <span className="text-xs text-slate-500">{new Date(incident.created_at).toLocaleString('es-MX')}</span>
                  </div>
                  <p className="m-0 text-sm leading-5 text-slate-700">{incident.description}</p>
                  <p className="m-0 text-xs text-slate-500">{incident.property_address || 'Ubicación no indicada'}{incident.vehicle_plates ? ` · Placas ${incident.vehicle_plates}` : ''} · {incident.created_by_name || 'Guardia'}</p>
                  {!showResolved && <button type="button" onClick={() => void handleResolve(incident.id)} disabled={resolvingId === incident.id} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"><Check className="h-4 w-4" />{resolvingId === incident.id ? 'Guardando...' : 'Marcar resuelta'}</button>}
                  {showResolved && <p className="m-0 text-xs text-emerald-700">Resuelta por {incident.resolved_by_name || 'administración'}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="vehicle-flags-title">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3"><Car className="h-4 w-4 text-blue-700" /><h3 id="vehicle-flags-title" className="text-sm font-bold text-slate-900">Placas clasificadas</h3></div>
          <form onSubmit={handleCreateFlag} className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">Placas
              <input required pattern="[A-Za-z0-9 -]{4,15}" maxLength={15} value={plates} onChange={(event) => setPlates(event.target.value.toUpperCase())} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">Clasificación
              <select value={flagType} onChange={(event) => setFlagType(event.target.value as VehicleFlag['flag_type'])} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="BLOCKED">Lista de bloqueo</option><option value="FREQUENT_VISITOR">Visita frecuente</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Motivo
              <input required minLength={5} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
            </label>
            <button type="submit" disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 sm:col-span-2">{saving ? 'Guardando...' : 'Guardar clasificación'}</button>
          </form>
          {vehicleFlags.length === 0 ? <p className="p-4 text-sm text-slate-500">No hay placas clasificadas manualmente.</p> : (
            <ul className="divide-y divide-slate-100">
              {vehicleFlags.map((flag) => (
                <li key={flag.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">{flag.plates}<span className={`rounded px-2 py-1 text-[10px] font-bold ${flag.flag_type === 'BLOCKED' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>{flag.flag_type === 'BLOCKED' ? 'Bloqueado' : 'Visita frecuente'}</span></p>
                    <p className="mb-0 mt-1 text-xs text-slate-600">{flag.reason}</p>
                  </div>
                  <button type="button" onClick={() => void handleRemoveFlag(flag.id)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" aria-label={`Retirar clasificación de ${flag.plates}`}><Trash2 className="h-4 w-4" />Retirar</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}