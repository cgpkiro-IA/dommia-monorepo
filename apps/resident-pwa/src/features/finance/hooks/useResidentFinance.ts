'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ResidentProfile, ResidentFinancialStatus, ResidentPayment } from '../../../types';
import { db } from '../../../lib/db';
import { API_BASE } from '@/lib/api-url';

interface UseResidentFinanceOptions {
  profile: ResidentProfile;
  token: string | null;
  onStatusChange?: (newStatus: 'UP_TO_DATE' | 'OVERDUE') => void;
}

interface SpeiSubmission {
  amount: number;
  reference: string;
  receiptUrl: string;
}

export function useResidentFinance({ profile, token, onStatusChange }: UseResidentFinanceOptions) {
  const [financialStatus, setFinancialStatus] = useState<ResidentFinancialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestPaymentAlert, setLatestPaymentAlert] = useState<ResidentPayment | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const isFetchingRef = useRef(false);

  const getSeenPaymentIds = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem('dommia_seen_payment_ids');
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  }, []);

  const markPaymentAsSeen = useCallback((paymentId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const seen = getSeenPaymentIds();
      seen.add(paymentId);
      localStorage.setItem('dommia_seen_payment_ids', JSON.stringify(Array.from(seen)));
    } catch {}
    setLatestPaymentAlert(null);
  }, [getSeenPaymentIds, token]);

  const fetchStatus = useCallback(async () => {
    if (isFetchingRef.current || !navigator.onLine) return;
    isFetchingRef.current = true;

    const current = profileRef.current;
    const propertyId = current.propertyId || 'a0000000-0000-0000-0000-000000000142';
    const slug = current.communitySlug || 'valle_real';

    try {
      const tenantRes = await fetch(`${API_BASE}/tenants/${slug}`);
      if (tenantRes.ok) {
        const tenantJson = await tenantRes.json();
        const modules = tenantJson.data?.modules;
        setStripeEnabled(Array.isArray(modules)
          ? modules.some((module: string) => ['STRIPE', 'STRIPE_CONNECT', 'FINANCE_STRIPE'].includes(module))
          : Boolean(modules && Object.entries(modules).some(([key, enabled]) => enabled && ['STRIPE', 'STRIPE_CONNECT', 'FINANCE_STRIPE'].includes(key))));
      }
      const url = `${API_BASE}/tenants/${slug}/finance/properties/${propertyId}/status`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        const data: ResidentFinancialStatus = json.data;
        setFinancialStatus(data);
        setError(null);

        const newPaymentStatus = data.totalBalanceDue > 0 ? 'OVERDUE' : 'UP_TO_DATE';
        if (current.paymentStatus !== newPaymentStatus) {
          onStatusChangeRef.current?.(newPaymentStatus);
          db.profile.update('current_resident', { paymentStatus: newPaymentStatus }).catch(() => {});
        }

        if (data.recentPayments && data.recentPayments.length > 0) {
          const newest = data.recentPayments[0];
          const seen = getSeenPaymentIds();
          if (!seen.has(newest.id)) {
            setLatestPaymentAlert(newest);
          }
        }
      }
    } catch (err: any) {
      console.warn('Fallback financiero local:', err.message);
      setError('Modo sin conexión');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [getSeenPaymentIds]);

  const submitSpeiPayment = useCallback(async (submission: SpeiSubmission) => {
    const current = profileRef.current;
    const propertyId = current.propertyId;
    const slug = current.communitySlug;
    if (!propertyId || !slug) return false;

    const res = await fetch(`${API_BASE}/tenants/${slug}/finance/payments/spei-submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        propertyId,
        amount: submission.amount,
        reference: submission.reference,
        receiptUrl: submission.receiptUrl,
        payerName: current.name,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(Array.isArray(json.message) ? json.message.join('. ') : json.message || 'No se pudo enviar el comprobante.');
    }
    await fetchStatus();
    return true;
  }, [fetchStatus, token]);

  useEffect(() => {
    setIsLoading(true);
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    financialStatus,
    isLoading,
    error,
    refreshFinancialStatus: fetchStatus,
    submitSpeiPayment,
    latestPaymentAlert,
    stripeEnabled,
    dismissPaymentAlert: () => {
      if (latestPaymentAlert) {
        markPaymentAsSeen(latestPaymentAlert.id);
      }
    },
  };
}
