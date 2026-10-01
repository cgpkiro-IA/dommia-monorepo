'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { API_BASE as API } from '@/lib/api-url';

type AccessPoint = {
  id: string;
  name: string;
  is_active: boolean;
};

type AccessPointRowProps = {
  accessPoint: AccessPoint;
  activeCount: number;
  saving: boolean;
  onSave: (id: string, name: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
};

function AccessPointRow({ accessPoint, activeCount, saving, onSave, onToggle }: AccessPointRowProps) {
  const [name, setName] = useState(accessPoint.name);
  const changed = name.trim() !== accessPoint.name;

  useEffect(() => setName(accessPoint.name), [accessPoint.name]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(accessPoint.id, name.trim());
  };

  return (
    <li className="grid gap-3 border-b border-slate-100 p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <form onSubmit={handleSubmit} className="flex min-w-0 items-center gap-2">
        <label className="sr-only" htmlFor={`access-point-${accessPoint.id}`}>Nombre de caseta o acceso</label>
        <input
          id={`access-point-${accessPoint.id}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          minLength={2}
          required
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
        />
        <button
          type="submit"
          disabled={!changed || saving}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" /> Guardar
        </button>
      </form>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className={`text-xs font-semibold ${accessPoint.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
          {accessPoint.is_active ? 'Activo' : 'Inactivo'}
        </span>
        <button
          type="button"
          onClick={() => onToggle(accessPoint.id, !accessPoint.is_active)}
          disabled={saving || (accessPoint.is_active && activeCount <= 1)}
          title={accessPoint.is_active && activeCount <= 1 ? 'Debe permanecer al menos un acceso activo' : undefined}
          className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {accessPoint.is_active ? 'Desactivar' : 'Reactivar'}
        </button>
      </div>
    </li>
  );
}

type GuardAccessPointsPanelProps = {
  tenantSlug: string;
  authToken: string;
};

export function GuardAccessPointsPanel({ tenantSlug, authToken }: GuardAccessPointsPanelProps) {
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAccessPoints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/access-points`, {
        headers: { Authorization: `Bearer ${authToken}`, 'Cache-Control': 'no-store' },
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudieron cargar los accesos.');
      setAccessPoints(body.data as AccessPoint[]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los accesos.');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, authToken]);

  useEffect(() => { void loadAccessPoints(); }, [loadAccessPoints]);

  const updateAccessPoint = async (id: string, values: { name?: string; isActive?: boolean }) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/access-points/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(values),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudo actualizar el acceso.');
      setMessage('Acceso actualizado.');
      await loadAccessPoints();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el acceso.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API}/tenants/${encodeURIComponent(tenantSlug)}/access-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'No se pudo crear el acceso.');
      setName('');
      setMessage('Caseta o acceso creado.');
      await loadAccessPoints();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el acceso.');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = accessPoints.filter((accessPoint) => accessPoint.is_active).length;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]" aria-labelledby="access-points-title">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Puntos de acceso</p>
            <h2 id="access-points-title" className="mt-1 text-lg font-bold text-slate-900">Casetas y accesos</h2>
          </div>
          <button type="button" onClick={() => void loadAccessPoints()} disabled={loading} aria-label="Actualizar casetas y accesos" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </header>
        {error && <p role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
        {message && <p role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando casetas y accesos...</p>
        ) : accessPoints.length ? (
          <ul>
            {accessPoints.map((accessPoint) => (
              <AccessPointRow key={accessPoint.id} accessPoint={accessPoint} activeCount={activeCount} saving={saving} onSave={(id, nextName) => void updateAccessPoint(id, { name: nextName })} onToggle={(id, isActive) => void updateAccessPoint(id, { isActive })} />
            ))}
          </ul>
        ) : (
          <p className="p-5 text-sm text-slate-500">No hay casetas o accesos configurados.</p>
        )}
      </div>

      <form onSubmit={handleCreate} className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-700" />
          <h3 className="text-base font-bold text-slate-900">Agregar acceso</h3>
        </div>
        <label htmlFor="new-access-point-name" className="block text-xs font-semibold text-slate-700">Nombre
          <input id="new-access-point-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required placeholder="Caseta 2 o Acceso B" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" />
        </label>
        <p className="mt-2 text-xs leading-5 text-slate-500">El nombre aparecerá en Guard y en la bitácora. Los accesos con movimientos registrados se desactivan, no se eliminan.</p>
        <button type="submit" disabled={saving || !name.trim()} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Crear acceso
        </button>
      </form>
    </section>
  );
}