'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MetricsData,
  TenantItem,
  ProspectItem,
  GatewayItem,
  PlanItem,
  FeedbackNotification,
} from '../../../types';
import { CrmTab } from '../components/TabNav';
import { crmApiFetch } from '../../auth/api';

export function useCrmDashboard(token: string | null) {
  const [activeTab, setActiveTab] = useState<CrmTab>('dashboard');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [prospects, setProspects] = useState<ProspectItem[]>([]);
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackNotification | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string, duration = 3000) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, duration);
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [resMetrics, resTenants, resProspects, resGateways, resPlans] = await Promise.all([
        crmApiFetch('/crm/metrics').then((r) => r.json()),
        crmApiFetch('/tenants').then((r) => r.json()),
        crmApiFetch('/crm/prospects').then((r) => r.json()),
        crmApiFetch('/crm/gateways').then((r) => r.json()),
        crmApiFetch('/crm/plans').then((r) => r.json()),
      ]);

      if (resMetrics.success) setMetrics(resMetrics.data);
      if (resTenants.success) setTenants(resTenants.data || []);
      if (resProspects.success) setProspects(resProspects.data || []);
      if (resGateways.success) setGateways(resGateways.data || []);
      if (resPlans.success) setPlans(resPlans.data || []);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetchAllData();
    // Poll every 30s for live gateway heartbeats and prospects
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData, token]);

  return {
    activeTab,
    setActiveTab,
    metrics,
    tenants,
    prospects,
    gateways,
    plans,
    isLoading,
    feedback,
    showFeedback,
    fetchAllData,
  };
}
