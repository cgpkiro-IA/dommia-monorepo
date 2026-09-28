'use client';

import { useState, useMemo } from 'react';
import { Vehicle, Property } from '@/types';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Filters
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [vehiclePropertyFilter, setVehiclePropertyFilter] = useState<string | null>(null);

  // Modals
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [vehicleForm, setVehicleForm] = useState({
    propertyId: '',
    residentId: '',
    plates: '',
    brand: '',
    model: '',
    color: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadVehicles = async (slug: string) => {
    setLoadingVehicles(true);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/vehicles`);
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data || []);
        return data.data;
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const openAddModal = (propertyId?: string, residentId?: string, properties?: Property[]) => {
    setFormError(null);
    const targetPropId = propertyId || (properties && properties.length > 0 ? properties[0].id : '');
    setVehicleForm({
      propertyId: targetPropId,
      residentId: residentId || '',
      plates: '',
      brand: '',
      model: '',
      color: '',
    });
    setIsAddVehicleModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleForm({
      propertyId: v.property_id,
      residentId: v.resident_id || '',
      plates: v.plates,
      brand: v.brand || '',
      model: v.model || '',
      color: v.color || '',
    });
    setFormError(null);
    setIsEditVehicleModalOpen(true);
  };

  const handleAddVehicle = async (slug: string, onSuccess: (msg: string) => void) => {
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsAddVehicleModalOpen(false);
        onSuccess(`Vehículo "${result.data.plates}" registrado exitosamente.`);
        loadVehicles(slug);
      } else {
        setFormError(result.message || 'Error al registrar vehículo.');
      }
    } catch {
      setFormError('Error de red al intentar registrar vehículo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVehicle = async (slug: string, onSuccess: (msg: string) => void) => {
    if (!editingVehicle) return;
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsEditVehicleModalOpen(false);
        onSuccess('Vehículo actualizado exitosamente.');
        loadVehicles(slug);
      } else {
        setFormError(result.message || 'Error al actualizar vehículo.');
      }
    } catch {
      setFormError('Error de conexión al actualizar vehículo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVehicle = async (
    slug: string,
    id: string,
    plates: string,
    onSuccess: (msg: string) => void,
  ) => {
    if (!window.confirm(`¿Confirmas la baja del vehículo con placas "${plates}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/vehicles/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        onSuccess(`Vehículo con placas "${plates}" eliminado.`);
        loadVehicles(slug);
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (vehiclePropertyFilter && v.property_id !== vehiclePropertyFilter) {
        return false;
      }

      const matchesSearch =
        v.plates.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
        (v.brand && v.brand.toLowerCase().includes(vehicleSearchQuery.toLowerCase())) ||
        (v.model && v.model.toLowerCase().includes(vehicleSearchQuery.toLowerCase())) ||
        (v.color && v.color.toLowerCase().includes(vehicleSearchQuery.toLowerCase())) ||
        v.street.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
        v.exterior_number.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
        (v.resident_first_name && v.resident_first_name.toLowerCase().includes(vehicleSearchQuery.toLowerCase())) ||
        (v.resident_last_name && v.resident_last_name.toLowerCase().includes(vehicleSearchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [vehicles, vehicleSearchQuery, vehiclePropertyFilter]);

  return {
    vehicles,
    setVehicles,
    loadingVehicles,
    vehicleSearchQuery,
    setVehicleSearchQuery,
    vehiclePropertyFilter,
    setVehiclePropertyFilter,
    filteredVehicles,
    isAddVehicleModalOpen,
    setIsAddVehicleModalOpen,
    isEditVehicleModalOpen,
    setIsEditVehicleModalOpen,
    editingVehicle,
    vehicleForm,
    setVehicleForm,
    actionLoading,
    formError,
    setFormError,
    loadVehicles,
    openAddModal,
    openEditModal,
    handleAddVehicle,
    handleUpdateVehicle,
    handleDeleteVehicle,
  };
}
