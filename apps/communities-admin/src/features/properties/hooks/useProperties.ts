'use client';

import { useState, useMemo } from 'react';
import { Property, Metrics } from '@/types';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDelinquent, setFilterDelinquent] = useState<'ALL' | 'UP_TO_DATE' | 'DELINQUENT'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Form State
  const [propertyForm, setPropertyForm] = useState({
    street: '',
    exteriorNumber: '',
    interiorNumber: '',
    block: '',
    lot: '',
    notes: '',
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProperties = async (slug: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/properties`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.data || []);
        setMetrics(data.metrics || null);
        return data;
      }
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddProperty = async (slug: string, onSuccess: (msg: string) => void) => {
    setActionLoading(true);
    setFormError(null);

    if (metrics?.isLimitReached) {
      setIsAddModalOpen(false);
      setIsUpgradeModalOpen(true);
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyForm),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsAddModalOpen(false);
        setPropertyForm({
          street: '',
          exteriorNumber: '',
          interiorNumber: '',
          block: '',
          lot: '',
          notes: '',
        });
        onSuccess(`Vivienda "${result.data.street} #${result.data.exterior_number}" dada de alta correctamente.`);
        loadProperties(slug);
      } else {
        if (res.status === 409 || res.status === 403 || result.message?.includes('Límite')) {
          setIsAddModalOpen(false);
          setIsUpgradeModalOpen(true);
        } else {
          setFormError(result.message || 'Error al registrar la propiedad.');
        }
      }
    } catch {
      setFormError('Error de red al intentar registrar la propiedad.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProperty = async (slug: string, onSuccess: (msg: string) => void) => {
    if (!editingProperty) return;
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/properties/${editingProperty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: editingProperty.street,
          exteriorNumber: editingProperty.exterior_number,
          interiorNumber: editingProperty.interior_number,
          block: editingProperty.block,
          lot: editingProperty.lot,
          notes: editingProperty.notes,
          isDelinquent: editingProperty.is_delinquent,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsEditModalOpen(false);
        onSuccess('Propiedad actualizada exitosamente.');
        loadProperties(slug);
      } else {
        setFormError(result.message || 'Error al actualizar propiedad.');
      }
    } catch (err: any) {
      console.error('Error updating property:', err);
      setFormError('Error de red al intentar actualizar la propiedad.');
    } finally {
      setActionLoading(false);
    }
  };


  const handleDeleteProperty = async (
    slug: string,
    id: string,
    street: string,
    num: string,
    onSuccess: (msg: string) => void,
  ) => {
    if (!window.confirm(`¿Estás seguro de eliminar la vivienda "${street} #${num}"? Esta acción liberará 1 espacio en tu capacidad contratada.`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/properties/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (res.ok && result.success) {
        onSuccess('Vivienda eliminada. Se ha liberado un espacio en tu capacidad.');
        loadProperties(slug);
      }
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        p.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.exterior_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.block && p.block.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.lot && p.lot.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.primary_resident_name && p.primary_resident_name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterDelinquent === 'UP_TO_DATE') return !p.is_delinquent;
      if (filterDelinquent === 'DELINQUENT') return p.is_delinquent;
      return true;
    });
  }, [properties, searchQuery, filterDelinquent]);

  return {
    properties,
    setProperties,
    metrics,
    setMetrics,
    loadingData,
    searchQuery,
    setSearchQuery,
    filterDelinquent,
    setFilterDelinquent,
    filteredProperties,
    isAddModalOpen,
    setIsAddModalOpen,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingProperty,
    setEditingProperty,
    propertyForm,
    setPropertyForm,
    actionLoading,
    formError,
    setFormError,
    loadProperties,
    handleAddProperty,
    handleUpdateProperty,
    handleDeleteProperty,
  };
}
