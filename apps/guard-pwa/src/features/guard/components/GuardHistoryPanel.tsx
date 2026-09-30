'use client';

import type { FormEvent } from 'react';
import { KeyRound, Layers, PackageCheck, PackagePlus, RefreshCw, ShieldAlert } from 'lucide-react';
import type { GuardHistoryEvent } from '../types';
import { CustomSelect, SelectOption } from './CustomSelect';

const HISTORY_TYPE_OPTIONS: SelectOption<string>[] = [
  { value: '', label: 'Todos los eventos', icon: <Layers className="w-4 h-4 text-blue-400" /> },
  { value: 'ACCESS', label: 'Accesos (QR / Manual)', icon: <KeyRound className="w-4 h-4 text-emerald-400" /> },
  { value: 'DELIVERY_RECEIVED', label: 'Paquetes recibidos', icon: <PackagePlus className="w-4 h-4 text-purple-400" /> },
  { value: 'DELIVERY_COLLECTED', label: 'Paquetes retirados', icon: <PackageCheck className="w-4 h-4 text-indigo-400" /> },
  { value: 'INCIDENT', label: 'Incidencias', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
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
  isOnline,
  events,
  historyType,
  onHistoryTypeChange,
  historyFrom,
  onHistoryFromChange,
  historyTo,
  onHistoryToChange,
  historyProperty,
  onHistoryPropertyChange,
  loading,
  error,
  onRefresh,
  onSubmit,
}: GuardHistoryPanelProps) {
  return (
    <section className="delivery-section" aria-labelledby="history-title">
      <div className="guard-history-heading">
        <div className="panel-heading">
          <span className="panel-index">05 / BITÁCORA</span>
          <h2 id="history-title">Historial operativo</h2>
        </div>
        <button
          className="guard-history-refresh"
          type="button"
          onClick={onRefresh}
          disabled={!isOnline || loading}
          aria-label="Actualizar historial"
        >
          <RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      <form className="guard-history-filters" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1 text-left min-w-[190px]">
          <span className="text-xs font-semibold text-slate-300">Tipo de evento</span>
          <CustomSelect
            value={historyType}
            options={HISTORY_TYPE_OPTIONS}
            onChange={onHistoryTypeChange}
            disabled={!isOnline || loading}
          />
        </div>

        <label>
          Desde
          <input
            type="datetime-local"
            value={historyFrom}
            onChange={(event) => onHistoryFromChange(event.target.value)}
          />
        </label>

        <label>
          Hasta
          <input
            type="datetime-local"
            value={historyTo}
            onChange={(event) => onHistoryToChange(event.target.value)}
          />
        </label>

        <label>
          Propiedad
          <input
            value={historyProperty}
            onChange={(event) => onHistoryPropertyChange(event.target.value)}
            placeholder="Calle, número, manzana o lote"
          />
        </label>

        <button type="submit" disabled={!isOnline || loading}>
          Filtrar
        </button>
      </form>

      {error && <p className="guard-ops-error" role="alert">{error}</p>}

      <ol className="guard-history-list" aria-live="polite">
        {events.length === 0 && !loading ? (
          <li className="empty-state">No hay eventos para estos filtros.</li>
        ) : (
          events.map((item) => (
            <li key={`${item.type}-${item.id}-${item.occurred_at}`}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.details}</span>
              </div>
              <div>
                <span>{item.property_address || 'Sin propiedad asociada'}</span>
                <span>{item.actor_name || 'Operador no identificado'}</span>
              </div>
              <time dateTime={item.occurred_at}>
                {new Date(item.occurred_at).toLocaleString('es-MX')}
              </time>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}