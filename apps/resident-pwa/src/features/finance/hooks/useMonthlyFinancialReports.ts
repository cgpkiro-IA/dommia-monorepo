'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '@/lib/api-url';

export interface PublishedMonthlyReport {
  id: string;
  period_start: string;
  period_end: string;
  revision: number;
  published_at: string;
  publication_notes?: string;
  reviewed_by_current_resident: boolean;
  report_snapshot: {
    opening: { bank: number; cash: number; total: number };
    income: { total: number; regular: Array<{ date: string; category: string; paymentMethod: string; count: number; amount: number }>; annualAdvance: { count: number; amount: number; entries: Array<{ date: string; paymentMethod: string; count: number; amount: number }> } };
    expenses: { total: number; byCategory: Array<{ category: string; count: number; amount: number }>; items: Array<{ id: string; category: string; description: string; vendorName?: string; expenseDate: string; amount: number; evidence: Array<{ id: string; fileName: string }> }> };
    reportEvidence: Array<{ id: string; fileName: string; contentType: string; sizeBytes: number }>;
    activity: { pendingPaymentCount: number; pendingPaymentAmount: number; chargesIssuedCount: number; chargesIssuedAmount: number; chargesOutstandingAmount: number };
    closing: { calculated: number; reportedBank: number; reportedCash: number; reportedTotal: number; variance: number };
  };
}

export function useMonthlyFinancialReports(token: string | null) {
  const [reports, setReports] = useState<PublishedMonthlyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/auth/resident/finance/monthly-reports`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.message || 'No se pudieron cargar las rendiciones.');
      setReports(body.data || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las rendiciones.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const markReviewed = useCallback(async (id: string) => {
    if (!token) return;
    const response = await fetch(`${API_BASE}/auth/resident/finance/monthly-reports/${id}/review`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('No se pudo registrar la revisión.');
    setReports((current) => current.map((report) => report.id === id ? { ...report, reviewed_by_current_resident: true } : report));
  }, [token]);

  const downloadEvidence = useCallback(async (id: string, fileName: string) => {
    if (!token) return;
    const response = await fetch(`${API_BASE}/auth/resident/finance/monthly-reports/evidence/${id}/content`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('La evidencia no está disponible.');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [token]);

  return { reports, loading, error, load, markReviewed, downloadEvidence };
}
