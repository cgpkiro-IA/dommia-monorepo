'use client';

import type { FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import type { GuardHistoryEvent } from '../types';

const HISTORY_TYPES = [
  ['', 'Todos los eventos'],
  ['ACCESS', 'Accesos'],
  ['DELIVERY_RECEIVED', 'Paquetes recibidos'],
  ['DELIVERY_COLLECTED', 'Paquetes retirados'],
  ['INCIDENT', 'Incidencias'],
];

interface GuardHistoryPanelProps {
  isOnline: boolean;
  events: GuardHistoryEvent[];
  historyType: string;
  onHistoryTypeChange: (value: string) => void;
  historyFrom: string;
  onHistoryFromChange: (value: string) => void;
  historyTo: string;
  onHistoryToChange: (value: string) => void;
  historyProperty: string;
  onHistoryPropertyChange: (value: string) => void;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function GuardHistoryPanel({
  isOnline, events, historyType, onHistoryTypeChange, historyFrom, onHistoryFromChange,
  historyTo, onHistoryToChange, historyProperty, onHistoryPropertyChange,
  loading, error, onRefresh, onSubmit,
}: GuardHistoryPanelProps) {
  return (
    <section className="delivery-section" aria-labelledby="history-title">
      <div className="guard-history-heading">
        <div className="panel-heading">
          <span className="panel-index">05 / BITÁCORA</span>
          <h2 id="history-title">Historial operativo</h2>
        </div>
        <button className="guard-history-refresh" type="button" onClick={onRefresh} disabled={!isOnline || loading} aria-label="Actualizar historial">
          <RefreshCw size={16} aria-hidden="true" /> {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>
      <form className="guard-history-filters" onSubmit={onSubmit}>
        <label>Tipo de evento
          <select value={historyType} onChange={(event) => onHistoryTypeChange(event.target.value)}>
            {HISTORY_TYPES.map(([value, label]) => <option key={value || 'all'} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Desde<input type="datetime-local" value={historyFrom} onChange={(event) => onHistoryFromChange(event.target.value)} /></label>
        <label>Hasta<input type="datetime-local" value={historyTo} onChange={(event) => onHistoryToChange(event.target.value)} /></label>
        <label>Propiedad<input value={historyProperty} onChange={(event) => onHistoryPropertyChange(event.target.value)} placeholder="Calle, número, manzana o lote" /></label>
        <button type="submit" disabled={!isOnline || loading}>Filtrar</button>
      </form>
      {error && <p className="guard-ops-error" role="alert">{error}</p>}
      <ol className="guard-history-list" aria-live="polite">
        {events.length === 0 && !loading ? <li className="empty-state">No hay eventos para estos filtros.</li> : events.map((item) => (
          <li key={`${item.type}-${item.id}-${item.occurred_at}`}>
            <div><strong>{item.title}</strong><span>{item.details}</span></div>
            <div><span>{item.property_address || 'Sin propiedad asociada'}</span><span>{item.actor_name || 'Operador no identificado'}</span></div>
            <time dateTime={item.occurred_at}>{new Date(item.occurred_at).toLocaleString('es-MX')}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}