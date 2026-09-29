import { useState, useEffect, useCallback, useRef } from 'react';
import type { GuardSession, GuardServiceType, GuardServiceDestination, GuardServiceItem, GuardLookupResult } from '../types';
import { guardApiRequest } from '../guard-api';

export function useGuardServices(session: GuardSession, isOnline: boolean) {
  const [serviceType, setServiceType] = useState<GuardServiceType>('FOOD_DELIVERY');
  const [customServiceName, setCustomServiceName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [vehiclePlates, setVehiclePlates] = useState('');
  const [destinationType, setDestinationType] = useState<'SPECIFIC' | 'GENERAL'>('SPECIFIC');
  const [destinations, setDestinations] = useState<GuardServiceDestination[]>([]);
  const [notes, setNotes] = useState('');

  // Resident search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ propertyId: string; propertyAddress: string; residentName: string; residentPhone?: string; residentEmail?: string }>>([]);
  const [searchBusy, setSearchBusy] = useState(false);

  // Active services
  const [activeServices, setActiveServices] = useState<GuardServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedActiveServiceId, setSelectedActiveServiceId] = useState<string | null>(null);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadActiveServices = useCallback(async () => {
    if (!isOnline) return;
    try {
      setLoadingServices(true);
      const data = await guardApiRequest<GuardServiceItem[]>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/services?status=IN_TRANSIT`,
        session.token
      );
      setActiveServices(data || []);
    } catch {
      // Ignorar error transitorio en background
    } finally {
      setLoadingServices(false);
    }
  }, [isOnline, session.tenantSlug, session.token]);

  useEffect(() => {
    void loadActiveServices();
    const interval = setInterval(() => {
      void loadActiveServices();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadActiveServices]);

  // Handle resident query debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchBusy(false);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      if (!isOnline) return;
      try {
        setSearchBusy(true);
        const data = await guardApiRequest<GuardLookupResult>(
          `/tenants/${encodeURIComponent(session.tenantSlug)}/access/lookup?query=${encodeURIComponent(searchQuery.trim())}`,
          session.token
        );
        const mapped = (data?.residents || []).map((r) => ({
          propertyId: r.propertyId || r.id,
          propertyAddress: r.propertyAddress || 'Domicilio no especificado',
          residentName: r.fullName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Residente',
          residentPhone: r.phone,
          residentEmail: r.email,
        }));
        setSearchResults(mapped);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchBusy(false);
      }
    }, 280);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, isOnline, session.tenantSlug, session.token]);

  const addDestination = (item: { propertyId: string; propertyAddress: string; residentName: string; residentPhone?: string; residentEmail?: string }) => {
    if (destinations.some((d) => d.propertyId === item.propertyId)) return;
    setDestinations((prev) => [...prev, item]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeDestination = (propertyId: string) => {
    setDestinations((prev) => prev.filter((d) => d.propertyId !== propertyId));
  };

  const resetForm = () => {
    setSupplierName('');
    setVehiclePlates('');
    setCustomServiceName('');
    setDestinations([]);
    setNotes('');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreateService = async () => {
    if (!isOnline) {
      setError('Operación no disponible sin conexión a internet.');
      return;
    }
    if (destinationType === 'SPECIFIC' && destinations.length === 0) {
      setError('Por favor selecciona al menos un domicilio o residente de destino.');
      return;
    }
    if (serviceType === 'OTHER' && !customServiceName.trim()) {
      setError('Indica qué tipo de servicio o empresa está ingresando.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      await guardApiRequest<GuardServiceItem>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/services`,
        session.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType,
            customServiceName: customServiceName.trim() || undefined,
            supplierName: supplierName.trim() || undefined,
            vehiclePlates: vehiclePlates.trim().toUpperCase() || undefined,
            destinationType,
            destinations: destinationType === 'SPECIFIC' ? destinations : [],
            notes: notes.trim() || undefined,
          }),
        }
      );

      setMessage('✓ Ingreso de servicio registrado exitosamente.');
      resetForm();
      await loadActiveServices();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar ingreso de servicio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterExit = async (serviceId: string, exitNotes?: string) => {
    if (!isOnline) {
      setError('Operación no disponible sin conexión.');
      return;
    }

    try {
      setExitingId(serviceId);
      setError(null);
      setMessage(null);

      await guardApiRequest<GuardServiceItem>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/services/${serviceId}/exit`,
        session.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: exitNotes || undefined }),
        }
      );

      setMessage('✓ Salida de servicio confirmada. Retirado del fraccionamiento.');
      setSelectedActiveServiceId(null);
      await loadActiveServices();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la salida del servicio.');
    } finally {
      setExitingId(null);
    }
  };

  return {
    serviceType,
    setServiceType,
    customServiceName,
    setCustomServiceName,
    supplierName,
    setSupplierName,
    vehiclePlates,
    setVehiclePlates,
    destinationType,
    setDestinationType,
    destinations,
    notes,
    setNotes,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchBusy,
    activeServices,
    loadingServices,
    selectedActiveServiceId,
    setSelectedActiveServiceId,
    submitting,
    exitingId,
    message,
    error,
    addDestination,
    removeDestination,
    handleCreateService,
    handleRegisterExit,
    loadActiveServices,
    resetForm,
  };
}
