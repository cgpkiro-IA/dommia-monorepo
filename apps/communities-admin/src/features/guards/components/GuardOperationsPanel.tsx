'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bike, Car, Check, Clock, Droplets, HelpCircle, MapPin, Package, RefreshCw, Trash2, Truck, Wrench } from 'lucide-react';
import type { GuardServiceItem, GuardServiceType } from '@/types';
import { API_BASE as API } from '@/lib/api-url';

type Incident = {
  id: string;
  incident_type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description: string;
  property_address?: string;
  vehicle_plates?: string;
  status: 'OPEN' | 'RESOLVED';
  is_panic_alert?: boolean;
  panic_type?: string;
  resolution_notes?: string;
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

const serviceConfig: Record<GuardServiceType, { label: string; icon: any; color: string; bg: string }> = {
  FOOD_DELIVERY: { label: 'Comida / Delivery', icon: Bike, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  GAS_SUPPLY: { label: 'Gas L.P.', icon: Truck, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  WATER_SUPPLY: { label: 'Agua / Garrafones', icon: Droplets, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  PARCEL_COURIER: { label: 'Paquetería', icon: Package, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  TAXI_RIDE: { label: 'Taxi / App', icon: Car, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  MAINTENANCE: { label: 'Mantenimiento', icon: Wrench, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  OTHER: { label: 'Otro Servicio', icon: HelpCircle, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

const incidentLabels: Record<string, string> = {
  PANIC_ALERT: '🚨 Botón de Pánico',
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
  URGENT: '🚨 Urgente / Pánico',
};

export function GuardOperationsPanel({ tenantSlug, authToken }: GuardOperationsPanelProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [vehicleFlags, setVehicleFlags] = useState<VehicleFlag[]>([]);
  const [activeServices, setActiveServices] = useState<GuardServiceItem[]>([]);
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
      const [incidentResponse, flagResponse, serviceResponse] = await Promise.all([
        fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guard/incidents?status=${showResolved ? 'RESOLVED' : 'OPEN'}`, { headers }),
        fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/guard/vehicle-flags`, { headers }),
        fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/access/services?status=IN_TRANSIT`, { headers }),
      ]);
      const [incidentBody, flagBody, serviceBody] = await Promise.all([
        incidentResponse.json(),
        flagResponse.json(),
        serviceResponse.json().catch(() => ({ success: true, data: [] })),
      ]);
      if (!incidentResponse.ok || !incidentBody.success) throw new Error(incidentBody.message || 'No se pudieron cargar las incidencias.');
      if (!flagResponse.ok || !flagBody.success) throw new Error(flagBody.message || 'No se pudo cargar la clasificación de placas.');
      setIncidents(incidentBody.data as Incident[]);
      setVehicleFlags(flagBody.data as VehicleFlag[]);
      setActiveServices((serviceBody?.data || []) as GuardServiceItem[]);
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

      {/* Sección de Proveedores y Servicios Activos en el Fraccionamiento */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="guard-services-admin-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-700" />
            <h3 id="guard-services-admin-title" className="text-sm font-bold text-slate-900">
              Proveedores y Servicios en Tránsito
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeServices.length} {activeServices.length === 1 ? 'servicio dentro' : 'servicios dentro'}
          </span>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando servicios en tránsito...</p>
        ) : activeServices.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <Check className="w-8 h-8 text-emerald-600 mx-auto mb-1.5 opacity-80" />
            <p className="text-sm font-semibold text-slate-700">Sin proveedores en recorrido actualmente</p>
            <p className="text-xs text-slate-500 mt-0.5">Todos los servicios y repartidores han completado su salida en caseta.</p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeServices.map((service) => {
              const cfg = serviceConfig[service.service_type] || serviceConfig.OTHER;
              const Icon = cfg.icon;
              return (
                <div
                  key={service.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all shadow-sm ${cfg.bg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white shadow-xs">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block leading-tight">
                          {service.service_type === 'OTHER' ? service.custom_service_name || 'Otro Servicio' : cfg.label}
                        </strong>
                        <span className="text-[11px] font-medium text-slate-600">
                          {service.supplier_name || 'Proveedor autorizado'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(service.entered_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                    {service.vehicle_plates && (
                      <p className="font-mono">
                        Placas: <span className="font-bold text-slate-900">{service.vehicle_plates}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1 truncate font-medium">
                      <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                      {service.destination_type === 'GENERAL' ? (
                        <span className="text-amber-800 font-bold">Recorrido General en Fraccionamiento</span>
                      ) : (
                        <span className="truncate">
                          {(service.destinations || []).map((d) => d.propertyAddress).join(', ') || 'Destino residencial'}
                        </span>
                      )}
                    </p>
                    <p>Ingresó por: <strong>{service.entered_access_point_name || 'Ubicación no registrada'}</strong></p>
                    <p>Registró: <strong>{service.entered_by_name || 'Guardia'}</strong></p>
                    {service.notes && <p className="text-[10px] text-slate-500 italic truncate">Nota: {service.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
              {incidents.map((incident) => {
                const isPanic = incident.is_panic_alert || incident.incident_type === 'PANIC_ALERT';
                return (
                  <li
                    key={incident.id}
                    className={`grid gap-2 p-4 transition-colors ${
                      isPanic && incident.status === 'OPEN'
                        ? 'bg-rose-50/80 border-l-4 border-l-rose-600'
                        : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {isPanic && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs animate-pulse">
                          🚨 Pánico
                        </span>
                      )}
                      <span className="text-sm font-bold text-slate-900">
                        {incidentLabels[incident.incident_type] || incident.incident_type}
                      </span>
                      <span
                        className={`rounded px-2 py-1 text-xs font-bold ${
                          incident.priority === 'URGENT' || incident.priority === 'HIGH' || isPanic
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {priorityLabels[incident.priority]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(incident.created_at).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <p className="m-0 text-sm font-medium leading-5 text-slate-800">{incident.description}</p>
                    <p className="m-0 text-xs text-slate-500">
                      {incident.property_address || 'Ubicación no indicada'}
                      {incident.vehicle_plates ? ` · Placas ${incident.vehicle_plates}` : ''} · Emisor: {incident.created_by_name || 'Guardia de Caseta'}
                    </p>
                    {!showResolved && (
                      <button
                        type="button"
                        onClick={() => void handleResolve(incident.id)}
                        disabled={resolvingId === incident.id}
                        className={`inline-flex min-h-10 w-fit items-center gap-2 rounded-md px-3 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer ${
                          isPanic
                            ? 'bg-rose-700 hover:bg-rose-800'
                            : 'bg-emerald-700 hover:bg-emerald-800'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        {resolvingId === incident.id ? 'Guardando...' : isPanic ? 'Atender y Resolver Pánico' : 'Marcar resuelta'}
                      </button>
                    )}
                    {showResolved && (
                      <p className="m-0 text-xs text-emerald-700">Resuelta por {incident.resolved_by_name || 'administración'}</p>
                    )}
                  </li>
                );
              })}
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