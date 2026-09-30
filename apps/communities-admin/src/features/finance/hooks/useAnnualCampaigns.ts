'use client';

import { useCallback, useState } from 'react';
import { AnnualCampaignFormData, AnnualCampaign } from '@/types';
import { API_BASE } from '@/lib/api-url';

const INITIAL_FORM: AnnualCampaignFormData = {
  name: 'Pago anual con descuento',
  discountPercentage: 10,
  monthsCovered: 12,
  periodStart: `${new Date().getFullYear() + 1}-01-01`,
  periodEnd: `${new Date().getFullYear() + 1}-12-31`,
};

export function useAnnualCampaigns(authToken?: string) {
  const [campaigns, setCampaigns] = useState<AnnualCampaign[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCampaigns = useCallback(async (slug: string) => {
    const res = await fetch(`${API_BASE}/tenants/${slug}/finance/annual-campaigns`);
    const json = await res.json();
    if (res.ok && json.success) setCampaigns(json.data || []);
  }, []);

  const createCampaign = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tenants/${slug}/finance/annual-campaigns`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }, body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'No se pudo crear la campaña.');
      await loadCampaigns(slug);
      return true;
    } finally { setLoading(false); }
  }, [form, loadCampaigns]);

  const loadCommitments = useCallback(async (slug: string, campaignId: string) => {
    const res = await fetch(`${API_BASE}/tenants/${slug}/finance/annual-campaigns/${campaignId}/commitments`);
    const json = await res.json();
    if (res.ok && json.success) setCommitments(json.data || []);
  }, []);

  const review = useCallback(async (slug: string, id: string, status: 'APPROVED' | 'REJECTED') => {
    const res = await fetch(`${API_BASE}/tenants/${slug}/finance/annual-commitments/${id}/review`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }, body: JSON.stringify({ status, reviewedByName: 'Administración' }),
    });
    if (res.ok) setCommitments((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    return res.ok;
  }, []);

  const recordCash = useCallback(async (slug: string, campaignId: string, propertyId: string, amount: number, reference: string) => {
    const res = await fetch(`${API_BASE}/tenants/${slug}/finance/annual-campaigns/${campaignId}/cash`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: JSON.stringify({ propertyId, amount, reference, payerName: 'Pago en ventanilla' }),
    });
    return res.ok;
  }, []);

  return { campaigns, form, setForm, commitments, loading, loadCampaigns, createCampaign, loadCommitments, review, recordCash };
}