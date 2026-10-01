'use client';

import { useState, useMemo } from 'react';
import { FeeConfiguration, FeeFormData, FeeType, FeeSimulationResult } from '@/types';
import { API_BASE } from '@/lib/api-url';

const INITIAL_FORM: FeeFormData = {
  name: '',
  feeType: 'FIXED_RECURRENT',
  baseAmount: 1200,
  frequency: 'MONTHLY',
  dueDay: 10,
  graceDays: 5,
  lateFeeType: 'PERCENTAGE',
  lateFeeAmount: 10,
  earlyBirdDiscountType: 'NONE',
  earlyBirdDiscountAmount: 0,
  earlyBirdDeadlineDay: 5,
  appliesToAllProperties: true,
  isActive: true,
  description: '',
};

export function useFees(authToken?: string) {
  const [fees, setFees] = useState<FeeConfiguration[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);

  // Filters
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [filterFeeType, setFilterFeeType] = useState<'ALL' | FeeType>('ALL');

  // Modals & Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

  const [editingFee, setEditingFee] = useState<FeeConfiguration | null>(null);
  const [simulationResult, setSimulationResult] = useState<FeeSimulationResult | null>(null);
  const [feeForm, setFeeForm] = useState<FeeFormData>(INITIAL_FORM);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadFees = async (slug: string) => {
    setLoadingFees(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/finance/fees`, { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
      const data = await res.json();
      if (data.success) {
        setFees(data.data || []);
      }
    } catch (err) {
      console.error('Error cargando configuración de cuotas:', err);
    } finally {
      setLoadingFees(false);
    }
  };

  const openAddModal = () => {
    setFeeForm(INITIAL_FORM);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (fee: FeeConfiguration) => {
    setEditingFee(fee);
    setFeeForm({
      name: fee.name,
      feeType: fee.fee_type,
      baseAmount: Number(fee.base_amount),
      frequency: fee.frequency,
      dueDay: fee.due_day,
      graceDays: fee.grace_days,
      lateFeeType: fee.late_fee_type,
      lateFeeAmount: Number(fee.late_fee_amount),
      earlyBirdDiscountType: fee.early_bird_discount_type,
      earlyBirdDiscountAmount: Number(fee.early_bird_discount_amount),
      earlyBirdDeadlineDay: fee.early_bird_deadline_day || 5,
      appliesToAllProperties: fee.applies_to_all_properties,
      isActive: fee.is_active,
      description: fee.description || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleCreateFee = async (slug: string, showToast: (msg: string, type?: 'success' | 'error') => void) => {
    if (!feeForm.name.trim()) {
      setFormError('El nombre de la cuota es obligatorio.');
      return false;
    }
    if (feeForm.baseAmount <= 0) {
      setFormError('El monto base debe ser mayor a 0.');
      return false;
    }

    setActionLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/finance/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(feeForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al crear la estructura de cuota');
      }

      showToast(`Cuota "${feeForm.name}" guardada exitosamente.`, 'success');
      setIsAddModalOpen(false);
      await loadFees(slug);
      return true;
    } catch (err: any) {
      setFormError(err.message || 'Error de red o servidor.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFee = async (slug: string, showToast: (msg: string, type?: 'success' | 'error') => void) => {
    if (!editingFee) return false;
    if (!feeForm.name.trim()) {
      setFormError('El nombre de la cuota es obligatorio.');
      return false;
    }

    setActionLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/finance/fees/${editingFee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(feeForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar la cuota');
      }

      showToast('Configuración de cuota actualizada exitosamente.', 'success');
      setIsEditModalOpen(false);
      setEditingFee(null);
      await loadFees(slug);
      return true;
    } catch (err: any) {
      setFormError(err.message || 'Error de red o servidor.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (slug: string, fee: FeeConfiguration, showToast: (msg: string, type?: 'success' | 'error') => void) => {
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/finance/fees/${fee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ isActive: !fee.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Cuota ${!fee.is_active ? 'activada' : 'desactivada'} correctamente.`, 'success');
        await loadFees(slug);
      }
    } catch (err) {
      console.error('Error al cambiar estatus de cuota:', err);
      showToast('No se pudo cambiar el estatus de la cuota.', 'error');
    }
  };

  const handleDeleteFee = async (slug: string, feeId: string, showToast: (msg: string, type?: 'success' | 'error') => void) => {
    if (!confirm('¿Estás seguro de eliminar esta estructura de cuota?')) return;
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/finance/fees/${feeId}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        showToast('Estructura de cuota eliminada exitosamente.', 'success');
        await loadFees(slug);
      } else {
        showToast(data.message || 'Error al eliminar', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar cuota:', err);
      showToast('Error de conexión al eliminar cuota.', 'error');
    }
  };

  const handleSimulateFee = async (slug: string, feeId: string, showToast: (msg: string, type?: 'success' | 'error') => void) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/finance/fees/${feeId}/simulate`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.data);
        setIsSimulateModalOpen(true);
      } else {
        showToast(data.message || 'No se pudo realizar la simulación', 'error');
      }
    } catch (err) {
      console.error('Error al simular cuota:', err);
      showToast('Error al conectar con el motor de cálculo.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      const matchSearch =
        fee.name.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
        (fee.description && fee.description.toLowerCase().includes(feeSearchQuery.toLowerCase()));

      const matchType = filterFeeType === 'ALL' || fee.fee_type === filterFeeType;

      return matchSearch && matchType;
    });
  }, [fees, feeSearchQuery, filterFeeType]);

  return {
    fees,
    filteredFees,
    loadingFees,
    feeSearchQuery,
    setFeeSearchQuery,
    filterFeeType,
    setFilterFeeType,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isSimulateModalOpen,
    setIsSimulateModalOpen,
    editingFee,
    simulationResult,
    feeForm,
    setFeeForm,
    actionLoading,
    formError,
    loadFees,
    openAddModal,
    openEditModal,
    handleCreateFee,
    handleUpdateFee,
    handleToggleActive,
    handleDeleteFee,
    handleSimulateFee,
  };
}
