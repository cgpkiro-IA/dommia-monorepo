'use client';

import { useCallback, useState } from 'react';
import { API_BASE } from '@/lib/api-url';

export interface MonthlyReport {
  id: string | null;
  period_start: string;
  period_end: string;
  revision: number;
  status: 'DRAFT' | 'PUBLISHED' | 'MISSING' | 'IN_PROGRESS';
  opening_bank_balance: string | number;
  opening_cash_balance: string | number;
  reported_bank_balance?: string | number;
  reported_cash_balance?: string | number;
  calculated_closing_balance?: string | number;
  variance?: string | number;
  published_at?: string;
  expenses?: MonthlyExpense[];
  reportEvidence?: Array<{ id: string; fileName: string; contentType: string; sizeBytes: number; visibility: 'ADMIN_ONLY' | 'RESIDENTS'; isRedacted: boolean }>;
  current?: {
    payments: Array<{ date: string; category: string; payment_method: string; count: number; amount: string | number }>;
    annualPayments: Array<{ date: string; payment_method: string; count: number; amount: string | number }>;
    expenses: Array<{ category: string; count: number; amount: string | number }>;
    pendingPayments: { count: number; amount: string | number };
    charges: { count: number; amount: string | number; balance_due: string | number };
  };
}

export interface MonthlyExpense {
  id: string;
  category: string;
  description: string;
  vendor_name?: string;
  expense_date: string;
  amount: string | number;
  payment_method: string;
  status: 'DRAFT' | 'APPROVED' | 'VOID';
  evidence_exception_reason?: string;
  evidence: Array<{
    id: string;
    fileName: string;
    visibility: 'ADMIN_ONLY' | 'RESIDENTS';
    isRedacted: boolean;
  }>;
}

export function useMonthlyReports(authToken?: string) {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [selected, setSelected] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const requestHeaders = new Headers(init.headers);
    requestHeaders.set('Authorization', `Bearer ${authToken || ''}`);
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: requestHeaders });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) {
      const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message;
      throw new Error(message || 'No se pudo completar la operación financiera.');
    }
    return body.data;
  }, [authToken]);

  const load = useCallback(async (slug: string) => {
    if (!authToken) return;
    setLoading(true);
    try {
      setReports(await api(`/tenants/${slug}/finance/monthly-reports`));
    } finally {
      setLoading(false);
    }
  }, [api, authToken]);

  const open = useCallback(async (slug: string, id: string) => {
    setLoading(true);
    try {
      const report = await api(`/tenants/${slug}/finance/monthly-reports/${id}`);
      setSelected(report);
      return report as MonthlyReport;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const createDraft = useCallback(async (slug: string, input: Record<string, unknown>) => {
    const report = await api(`/tenants/${slug}/finance/monthly-reports`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    });
    await load(slug);
    await open(slug, report.id);
  }, [api, load, open]);

  const createExpense = useCallback(async (slug: string, reportId: string, input: Record<string, unknown>) => {
    await api(`/tenants/${slug}/finance/monthly-reports/${reportId}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    });
    await open(slug, reportId);
  }, [api, open]);

  const uploadEvidence = useCallback(async (
    slug: string,
    reportId: string,
    expenseId: string,
    file: File,
    visibility: 'ADMIN_ONLY' | 'RESIDENTS',
    isRedacted: boolean,
  ) => {
    const contentBase64 = await readBase64(file);
    await api(`/tenants/${slug}/finance/monthly-reports/expenses/${expenseId}/evidence`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, contentBase64, visibility, isRedacted }),
    });
    await open(slug, reportId);
  }, [api, open]);

  const uploadReportEvidence = useCallback(async (
    slug: string,
    reportId: string,
    file: File,
    visibility: 'ADMIN_ONLY' | 'RESIDENTS',
    isRedacted: boolean,
  ) => {
    const contentBase64 = await readBase64(file);
    await api(`/tenants/${slug}/finance/monthly-reports/${reportId}/evidence`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, contentBase64, visibility, isRedacted }),
    });
    await open(slug, reportId);
  }, [api, open]);

  const approveExpense = useCallback(async (slug: string, reportId: string, expenseId: string, evidenceExceptionReason?: string) => {
    await api(`/tenants/${slug}/finance/monthly-reports/expenses/${expenseId}/approve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ evidenceExceptionReason: evidenceExceptionReason || undefined }),
    });
    await open(slug, reportId);
  }, [api, open]);

  const publish = useCallback(async (slug: string, reportId: string, input: Record<string, unknown>) => {
    await api(`/tenants/${slug}/finance/monthly-reports/${reportId}/publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    });
    await load(slug);
    await open(slug, reportId);
  }, [api, load, open]);

  return { reports, selected, loading, setSelected, load, open, createDraft, createExpense, uploadEvidence, uploadReportEvidence, approveExpense, publish };
}

function readBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la evidencia.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(file);
  });
}
