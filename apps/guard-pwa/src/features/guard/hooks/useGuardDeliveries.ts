import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { guardApiRequest } from '../guard-api';
import type { GuardDelivery, GuardLookupResult, GuardSession } from '../types';

export interface AddressSuggestion {
  propertyId: string;
  propertyAddress: string;
  residents: string[];
}

export function useGuardDeliveries(session: GuardSession | null, isOnline: boolean) {
  const [deliveries, setDeliveries] = useState<GuardDelivery[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<'PENDING' | 'COLLECTED'>('PENDING');
  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCarrier, setDeliveryCarrier] = useState('');
  const [deliveryTrackingCode, setDeliveryTrackingCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [collectingDeliveryId, setCollectingDeliveryId] = useState<string | null>(null);
  const [collectedByName, setCollectedByName] = useState('');

  // Predictive Address Search State
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSearchBusy, setAddressSearchBusy] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadDeliveries = useCallback(async (statusFilter: 'PENDING' | 'COLLECTED' = deliveryFilter) => {
    if (!session) return;
    try {
      const data = await guardApiRequest<GuardDelivery[]>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/guard/deliveries?status=${statusFilter}`,
        session.token,
      );
      setDeliveries(data);
      setDeliveryError('');
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'No se pudo cargar el registro de paquetería.');
    }
  }, [deliveryFilter, session]);

  useEffect(() => {
    if (session) void loadDeliveries();
  }, [loadDeliveries, session]);

  // Predictive search when typing in deliveryAddress
  const handleAddressChange = (value: string) => {
    setDeliveryAddress(value);
    setShowAddressDropdown(true);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!value.trim() || value.trim().length < 2) {
      setAddressSuggestions([]);
      setAddressSearchBusy(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      if (!session || !isOnline) return;
      try {
        setAddressSearchBusy(true);
        const data = await guardApiRequest<GuardLookupResult>(
          `/tenants/${encodeURIComponent(session.tenantSlug)}/access/lookup?query=${encodeURIComponent(value.trim())}`,
          session.token,
        );

        // Group by unique property address
        const propertyMap = new Map<string, AddressSuggestion>();

        for (const r of data?.residents || []) {
          const propId = r.propertyId || r.id;
          const propAddress = r.propertyAddress || 'Domicilio no especificado';
          const residentName = r.fullName || `${r.firstName || ''} ${r.lastName || ''}`.trim();

          if (!propertyMap.has(propId)) {
            propertyMap.set(propId, {
              propertyId: propId,
              propertyAddress: propAddress,
              residents: residentName ? [residentName] : [],
            });
          } else if (residentName) {
            const existing = propertyMap.get(propId)!;
            if (!existing.residents.includes(residentName)) {
              existing.residents.push(residentName);
            }
          }
        }

        setAddressSuggestions(Array.from(propertyMap.values()));
      } catch {
        setAddressSuggestions([]);
      } finally {
        setAddressSearchBusy(false);
      }
    }, 250);
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    setDeliveryAddress(suggestion.propertyAddress);
    setAddressSuggestions([]);
    setShowAddressDropdown(false);
  };

  const handleReceiveDelivery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || deliveryBusy || !isOnline) return;
    setDeliveryBusy(true);
    setDeliveryError('');
    setDeliveryMessage('');
    try {
      await guardApiRequest<GuardDelivery>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/guard/deliveries`,
        session.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientName: deliveryRecipient.trim(),
            propertyAddress: deliveryAddress.trim(),
            carrier: deliveryCarrier.trim(),
            trackingCode: deliveryTrackingCode.trim() || undefined,
            notes: deliveryNotes.trim() || undefined,
          }),
        },
      );
      setDeliveryRecipient('');
      setDeliveryAddress('');
      setDeliveryCarrier('');
      setDeliveryTrackingCode('');
      setDeliveryNotes('');
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      setDeliveryMessage('Paquete registrado en resguardo.');
      setDeliveryFilter('PENDING');
      await loadDeliveries('PENDING');
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'No se pudo registrar el paquete.');
    } finally {
      setDeliveryBusy(false);
    }
  };

  const handleCollectDelivery = async (event: FormEvent<HTMLFormElement>, deliveryId: string) => {
    event.preventDefault();
    if (!session || !collectedByName.trim() || deliveryBusy || !isOnline) return;
    setDeliveryBusy(true);
    setDeliveryError('');
    setDeliveryMessage('');
    try {
      await guardApiRequest<GuardDelivery>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/guard/deliveries/${encodeURIComponent(deliveryId)}/collect`,
        session.token,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectedByName: collectedByName.trim() }),
        },
      );
      setCollectedByName('');
      setCollectingDeliveryId(null);
      setDeliveryMessage('Retiro registrado.');
      await loadDeliveries();
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'No se pudo registrar el retiro.');
    } finally {
      setDeliveryBusy(false);
    }
  };

  return {
    deliveries,
    deliveryFilter,
    setDeliveryFilter,
    deliveryRecipient,
    setDeliveryRecipient,
    deliveryAddress,
    setDeliveryAddress,
    handleAddressChange,
    addressSuggestions,
    addressSearchBusy,
    showAddressDropdown,
    setShowAddressDropdown,
    handleSelectAddressSuggestion,
    deliveryCarrier,
    setDeliveryCarrier,
    deliveryTrackingCode,
    setDeliveryTrackingCode,
    deliveryNotes,
    setDeliveryNotes,
    deliveryBusy,
    deliveryError,
    deliveryMessage,
    collectingDeliveryId,
    setCollectingDeliveryId,
    collectedByName,
    setCollectedByName,
    loadDeliveries,
    handleReceiveDelivery,
    handleCollectDelivery,
  };
}