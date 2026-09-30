import { useState, useEffect, useCallback } from 'react';
import { parseClientError, ClientErrorState } from '@dommia/ui';
import { API_BASE } from '@/lib/api-url';

export interface CrmAnalyticsData {
  financials: {
    mrr: number;
    arr: number;
    averageTicket: number;
    plansDistribution: {
      tier: string;
      count: number;
      revenue: number;
    }[];
    addonsBreakdown: {
      type: string;
      count: number;
      revenue: number;
    }[];
  };
  adoption: {
    totalTenants: number;
    activeTenants: number;
    totalProperties: number;
    totalResidents: number;
    estimatedPwaUsers: number;
    pwaAdoptionRate: number;
    todayActivity: {
      qrAccessesValidated: number;
      packagesReceived: number;
      servicesRegistered: number;
      incidentsReported: number;
    };
  };
  telemetry: {
    databaseSizeMb: number;
    tenantSchemasCount: number;
    databaseHealth: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    apiLatencyStatus: string;
    serverTimestamp: string;
  };
}

export function useCrmAnalytics(token: string | null) {
  const [data, setData] = useState<CrmAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ClientErrorState | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/crm/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(parseClientError(json, 'No fue posible consolidar la analítica global en este momento.'));
      }
    } catch (err) {
      setError(parseClientError(err, 'No fue posible conectar con el servicio de analítica.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics: data,
    loading,
    error,
    refresh: fetchAnalytics,
  };
}

