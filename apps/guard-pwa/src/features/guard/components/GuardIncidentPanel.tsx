'use client';

import type { FormEvent } from 'react';
import { Siren } from 'lucide-react';
import type { GuardIncidentPriority, GuardIncidentType } from '../types';

const INCIDENT_TYPES: Array<[GuardIncidentType, string]> = [
  ['SECURITY', 'Seguridad'],
  ['SUSPICIOUS_VEHICLE', 'Vehículo sospechoso'],
  ['MEDICAL', 'Emergencia médica'],
  ['FIRE', 'Incendio'],
  ['MAINTENANCE', 'Mantenimiento'],
  ['OTHER', 'Otro'],
];

interface GuardIncidentPanelProps {
  isOnline: boolean;
  type: GuardIncidentType;
  onTypeChange: (type: GuardIncidentType) => void;
  priority: GuardIncidentPriority;
  onPriorityChange: (priority: GuardIncidentPriority) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  propertyAddress: string;
  onPropertyAddressChange: (value: string) => void;
  vehiclePlates: string;
  onVehiclePlatesChange: (value: string) => void;
  submitting: boolean;
  message: string;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function GuardIncidentPanel({
  isOnline, type, onTypeChange, priority, onPriorityChange, description, onDescriptionChange,
  propertyAddress, onPropertyAddressChange, vehiclePlates, onVehiclePlatesChange,
  submitting, message, error, onSubmit,
}: GuardIncidentPanelProps) {
  return (
    <section className="delivery-section" aria-labelledby="incident-title">
      <div className="panel-heading">
        <span className="panel-index">04 / REPORTE</span>
        <h2 id="incident-title">Reportar incidencia</h2>
        <p>El reporte queda registrado para seguimiento de la administración.</p>
      </div>
      <form className="guard-incident-form" onSubmit={onSubmit}>
        <label>Tipo de incidencia
          <select value={type} onChange={(event) => onTypeChange(event.target.value as GuardIncidentType)} disabled={!isOnline || submitting}>
            {INCIDENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Prioridad
          <select value={priority} onChange={(event) => onPriorityChange(event.target.value as GuardIncidentPriority)} disabled={!isOnline || submitting}>
            <option value="LOW">Baja</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
          </select>
        </label>
        <label>Propiedad o ubicación (opcional)
          <input value={propertyAddress} onChange={(event) => onPropertyAddressChange(event.target.value)} maxLength={200} disabled={!isOnline || submitting} />
        </label>
        <label>Placas relacionadas (opcional)
          <input value={vehiclePlates} onChange={(event) => onVehiclePlatesChange(event.target.value)} maxLength={15} disabled={!isOnline || submitting} />
        </label>
        <label className="guard-incident-description">Descripción
          <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} minLength={5} maxLength={1000} required rows={3} disabled={!isOnline || submitting} />
        </label>
        <button type="submit" disabled={!isOnline || submitting || description.trim().length < 5}>
          <Siren size={17} aria-hidden="true" /> {submitting ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </form>
      {message && <p className="guard-ops-success" role="status">{message}</p>}
      {error && <p className="guard-ops-error" role="alert">{error}</p>}
    </section>
  );
}