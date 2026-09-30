'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CrmAlert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'CHANNELS' | 'SECURITY' | 'BILLING' | 'SYSTEM' | 'TELEMETRY';
  title: string;
  description: string;
  tenantSlug?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken?: string;
  chatId?: string;
  botUsername?: string;
  lastTestedAt?: string;
  lastError?: string;
}

export interface AlertSummary {
  total: number;
  active_count: number;
  critical_active: number;
  warning_active: number;
  acknowledged_count: number;
  resolved_count: number;
}

import { parseClientError, ClientErrorState } from '@dommia/ui';
import { API_BASE } from '@/lib/api-url';

export function useCrmAlerts(token: string | null) {
  const [alerts, setAlerts] = useState<CrmAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [error, setError] = useState<ClientErrorState | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (severityFilter !== 'ALL') queryParams.set('severity', severityFilter);

      const res = await fetch(`${API_BASE}/crm/alerts?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAlerts(json.data || []);
        setSummary(json.summary || null);
      } else {
        setError(parseClientError(json, 'No fue posible consultar el centro de alertas.'));
      }
    } catch (err) {
      setError(parseClientError(err, 'No fue posible conectar con el centro de alertas.'));
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter, token]);

  const fetchTelegramConfig = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/crm/alerts/telegram-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTelegramConfig(json.data);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    void fetchAlerts();
    void fetchTelegramConfig();
  }, [fetchAlerts, fetchTelegramConfig]);

  const acknowledgeAlert = async (id: string) => {
    if (!token) return;
    try {
      setActionBusy(id);
      const res = await fetch(`${API_BASE}/crm/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAlerts();
      }
    } finally {
      setActionBusy(null);
    }
  };

  const resolveAlert = async (id: string, notes?: string) => {
    if (!token) return;
    try {
      setActionBusy(id);
      const res = await fetch(`${API_BASE}/crm/alerts/${id}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAlerts();
      }
    } finally {
      setActionBusy(null);
    }
  };

  const saveTelegramConfig = async (config: {
    enabled: boolean;
    botToken?: string;
    chatId?: string;
    botUsername?: string;
  }) => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/crm/alerts/telegram-config`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTelegramConfig(json.data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const testTelegramAlert = async (botToken?: string, chatId?: string) => {
    if (!token) return { success: false, message: 'No autenticado' };
    try {
      const res = await fetch(`${API_BASE}/crm/alerts/telegram-test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botToken, chatId }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Error de conexión' };
    }
  };

  return {
    alerts,
    summary,
    telegramConfig,
    loading,
    error,
    actionBusy,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    refresh: fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
    saveTelegramConfig,
    testTelegramAlert,
  };
}
