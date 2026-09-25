'use client';

import { useState, useCallback } from 'react';
import {
  FinancialCharge,
  FinancialPayment,
  FinancialSummaryData,
  PaymentFormData,
  ChargeStatus,
  PaymentMethod,
} from '@/types';

const INITIAL_PAYMENT_FORM: PaymentFormData = {
  propertyId: '',
  chargeId: '',
  amount: 0,
  paymentMethod: 'CASH',
  reference: '',
  receivedByName: 'Administración',
  payerName: '',
  notes: '',
};

export function useBillingOperations() {
  const [charges, setCharges] = useState<FinancialCharge[]>([]);
  const [payments, setPayments] = useState<FinancialPayment[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterChargeStatus, setFilterChargeStatus] = useState<'ALL' | ChargeStatus>('ALL');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'ALL' | PaymentMethod>('ALL');

  // Modals
  const [isCutoffModalOpen, setIsCutoffModalOpen] = useState(false);
  const [isCashPaymentModalOpen, setIsCashPaymentModalOpen] = useState(false);
  const [cutoffResult, setCutoffResult] = useState<any | null>(null);

  // Forms
  const now = new Date();
  const [cutoffForm, setCutoffForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    dryRun: false,
  });

  const [paymentForm, setPaymentForm] = useState<PaymentFormData>(INITIAL_PAYMENT_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const loadSummary = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/summary`);
      const json = await res.json();
      if (res.ok && json.success) {
        setSummary(json.data);
      }
    } catch (err) {
      console.error('Error al cargar resumen financiero:', err);
    }
  }, []);

  const loadCharges = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/charges`);
      const json = await res.json();
      if (res.ok && json.success) {
        setCharges(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar cargos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async (slug: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/payments`);
      const json = await res.json();
      if (res.ok && json.success) {
        setPayments(json.data || []);
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err);
    }
  }, []);

  const refreshAll = useCallback(
    async (slug: string) => {
      await Promise.all([loadCharges(slug), loadPayments(slug), loadSummary(slug)]);
    },
    [loadCharges, loadPayments, loadSummary],
  );

  const openCashPaymentModal = (propertyId: string = '', chargeId: string = '', defaultAmount: number = 0) => {
    setPaymentForm({
      ...INITIAL_PAYMENT_FORM,
      propertyId,
      chargeId,
      amount: defaultAmount,
    });
    setFormError(null);
    setIsCashPaymentModalOpen(true);
  };

  const handleGenerateCutoff = async (
    slug: string,
    showToast: (msg: string, type?: 'success' | 'error') => void,
  ) => {
    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/billing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cutoffForm),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCutoffResult(json.data);
        if (!cutoffForm.dryRun) {
          showToast(json.message, 'success');
          await refreshAll(slug);
          setIsCutoffModalOpen(false);
        } else {
          showToast(`Simulación completada: ${json.data.chargesCount} cargos proyectados.`, 'success');
        }
      } else {
        const errorMsg = Array.isArray(json.message) ? json.message.join('. ') : (json.message || 'Error al emitir cobranza.');
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch {
      setFormError('Error de red al conectar con el servidor.');
      showToast('Error de conexión', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (
    slug: string,
    showToast: (msg: string, type?: 'success' | 'error') => void,
  ) => {
    if (!paymentForm.propertyId) {
      setFormError('Selecciona la vivienda a la que se aplicará el pago.');
      return false;
    }
    if (paymentForm.amount <= 0) {
      setFormError('El monto debe ser mayor a $0.00 MXN.');
      return false;
    }

    setActionLoading(true);
    setFormError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${slug}/finance/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: paymentForm.propertyId,
          chargeId: paymentForm.chargeId || undefined,
          amount: Number(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference.trim() || undefined,
          receivedByName: paymentForm.receivedByName.trim() || 'Administración',
          payerName: paymentForm.payerName.trim() || undefined,
          notes: paymentForm.notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message, 'success');
        setIsCashPaymentModalOpen(false);
        setPaymentForm(INITIAL_PAYMENT_FORM);
        await refreshAll(slug);
        return true;
      } else {
        const errorMsg = Array.isArray(json.message) ? json.message.join('. ') : (json.message || 'Error al registrar pago.');
        setFormError(errorMsg);
        showToast(errorMsg, 'error');
        return false;
      }
    } catch {
      setFormError('Error de red al intentar registrar el pago.');
      showToast('Error de red', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    charges,
    payments,
    summary,
    loading,
    actionLoading,
    filterChargeStatus,
    setFilterChargeStatus,
    filterSearch,
    setFilterSearch,
    filterPaymentMethod,
    setFilterPaymentMethod,
    isCutoffModalOpen,
    setIsCutoffModalOpen,
    isCashPaymentModalOpen,
    setIsCashPaymentModalOpen,
    cutoffForm,
    setCutoffForm,
    cutoffResult,
    setCutoffResult,
    paymentForm,
    setPaymentForm,
    formError,
    setFormError,
    loadCharges,
    loadPayments,
    loadSummary,
    refreshAll,
    openCashPaymentModal,
    handleGenerateCutoff,
    handleRecordPayment,
  };
}
