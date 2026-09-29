'use client';

import type { FormEvent } from 'react';
import { Activity, AlertCircle, Car, Flame, Shield, Siren, Wrench } from 'lucide-react';
import type { GuardIncidentPriority, GuardIncidentType } from '../types';
import { CustomSelect, SelectOption } from './CustomSelect';

const INCIDENT_TYPE_OPTIONS: SelectOption<GuardIncidentType>[] = [
  { value: 'SECURITY', label: 'Seguridad', icon: <Shield className="w-4 h-4 text-blue-400" /> },
  { value: 'SUSPICIOUS_VEHICLE', label: 'Vehículo sospechoso', icon: <Car className="w-4 h-4 text-amber-400" /> },
  { value: 'MEDICAL', label: 'Emergencia médica', icon: <Activity className="w-4 h-4 text-rose-400" /> },
  { value: 'FIRE', label: 'Incendio', icon: <Flame className="w-4 h-4 text-orange-400" /> },
  { value: 'MAINTENANCE', label: 'Mantenimiento', icon: <Wrench className="w-4 h-4 text-emerald-400" /> },
  { value: 'OTHER', label: 'Otro', icon: <AlertCircle className="w-4 h-4 text-purple-400" /> },
];

const PRIORITY_OPTIONS: SelectOption<GuardIncidentPriority>[] = [
  { value: 'LOW', label: 'Baja', badge: 'Normal', badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800' },
  { value: 'MEDIUM', label: 'Media', badge: 'Atención', badgeColor: 'bg-amber-950 text-amber-300 border border-amber-800' },
  { value: 'HIGH', label: 'Alta', badge: 'Urgente', badgeColor: 'bg-orange-950 text-orange-300 border border-orange-800' },
  { value: 'URGENT', label: 'Urgente', badge: 'Crítica', badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800' },
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
  isOnline,
  type,
  onTypeChange,
  priority,
  onPriorityChange,
  description,
  onDescriptionChange,
  propertyAddress,
  onPropertyAddressChange,
  vehiclePlates,
  onVehiclePlatesChange,
  submitting,
  message,
  error,
  onSubmit,
}: GuardIncidentPanelProps) {
  return (
    <section className="delivery-section" aria-labelledby="incident-title">
      <div className="panel-heading">
        <span className="panel-index">04 / REPORTE</span>
        <h2 id="incident-title">Reportar incidencia</h2>
        <p>El reporte queda registrado para seguimiento de la administración.</p>
      </div>
      <form className="guard-incident-form" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5 text-left">
          <span className="text-xs font-semibold text-slate-300">Tipo de incidencia</span>
          <CustomSelect
            value={type}
            options={INCIDENT_TYPE_OPTIONS}
            onChange={onTypeChange}
            disabled={!isOnline || submitting}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <span className="text-xs font-semibold text-slate-300">Prioridad</span>
          <CustomSelect
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={onPriorityChange}
            disabled={!isOnline || submitting}
          />
        </div>

        <label>
          Propiedad o ubicación (opcional)
          <input
            value={propertyAddress}
            onChange={(event) => onPropertyAddressChange(event.target.value)}
            maxLength={200}
            placeholder="Ej: Privada Robles #12"
            disabled={!isOnline || submitting}
          />
        </label>

        <label>
          Placas relacionadas (opcional)
          <input
            value={vehiclePlates}
            onChange={(event) => onVehiclePlatesChange(event.target.value)}
            maxLength={15}
            placeholder="Ej: ABC-123"
            disabled={!isOnline || submitting}
          />
        </label>

        <label className="guard-incident-description">
          Descripción
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            minLength={5}
            maxLength={1000}
            required
            rows={3}
            placeholder="Detalle de lo ocurrido en el fraccionamiento..."
            disabled={!isOnline || submitting}
          />
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