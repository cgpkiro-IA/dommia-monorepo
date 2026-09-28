'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { guardApiRequest } from '../guard-api';
import type { GuardHistoryEvent, GuardIncidentPriority, GuardIncidentType, GuardSession } from '../types';

export function useGuardOperations(session: GuardSession | null, isOnline: boolean) {
  const [incidentType, setIncidentType] = useState<GuardIncidentType>('SECURITY');
  const [incidentPriority, setIncidentPriority] = useState<GuardIncidentPriority>('MEDIUM');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentPropertyAddress, setIncidentPropertyAddress] = useState('');
  const [incidentVehiclePlates, setIncidentVehiclePlates] = useState('');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentMessage, setIncidentMessage] = useState('');
  const [incidentError, setIncidentError] = useState('');
  const [historyEvents, setHistoryEvents] = useState<GuardHistoryEvent[]>([]);
  const [historyType, setHistoryType] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyProperty, setHistoryProperty] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const loadHistory = useCallback(async () => {
    if (!session) return;
    if (!isOnline) {
      setHistoryError('El historial requiere conexión.');
      return;
    }
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const query = new URLSearchParams();
      if (historyType) query.set('type', historyType);
      if (historyFrom) query.set('from', new Date(historyFrom).toISOString());
      if (historyTo) query.set('to', new Date(historyTo).toISOString());
      if (historyProperty.trim()) query.set('property', historyProperty.trim());
      const events = await guardApiRequest<GuardHistoryEvent[]>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/guard/history?${query}`,
        session.token,
      );
      setHistoryEvents(events);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'No se pudo cargar el historial.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFrom, historyProperty, historyTo, historyType, isOnline, session]);

  useEffect(() => {
    if (session) void loadHistory();
  }, [loadHistory, session]);

  const reportIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || incidentSubmitting || !isOnline) return;
    setIncidentSubmitting(true);
    setIncidentMessage('');
    setIncidentError('');
    try {
      await guardApiRequest(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/guard/incidents`,
        session.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: incidentType,
            priority: incidentPriority,
            description: incidentDescription.trim(),
            propertyAddress: incidentPropertyAddress.trim() || undefined,
            vehiclePlates: incidentVehiclePlates.trim() || undefined,
          }),
        },
      );
      setIncidentDescription('');
      setIncidentPropertyAddress('');
      setIncidentVehiclePlates('');
      setIncidentMessage('Incidencia enviada a administración.');
      await loadHistory();
    } catch (error) {
      setIncidentError(error instanceof Error ? error.message : 'No se pudo reportar la incidencia.');
    } finally {
      setIncidentSubmitting(false);
    }
  };

  return {
    incidentType,
    setIncidentType,
    incidentPriority,
    setIncidentPriority,
    incidentDescription,
    setIncidentDescription,
    incidentPropertyAddress,
    setIncidentPropertyAddress,
    incidentVehiclePlates,
    setIncidentVehiclePlates,
    incidentSubmitting,
    incidentMessage,
    incidentError,
    reportIncident,
    historyEvents,
    historyType,
    setHistoryType,
    historyFrom,
    setHistoryFrom,
    historyTo,
    setHistoryTo,
    historyProperty,
    setHistoryProperty,
    historyLoading,
    historyError,
    loadHistory,
  };
}