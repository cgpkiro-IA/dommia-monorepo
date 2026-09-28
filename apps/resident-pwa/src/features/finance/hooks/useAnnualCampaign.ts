'use client';

import { useCallback, useEffect, useState } from 'react';
import { ResidentProfile } from '../../../types';

interface Campaign {
  id: string;
  name: string;
  discount_percentage: string | number;
  months_covered: number;
  period_start: string;
  period_end: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED';
}

interface Quote {
  campaign: Campaign;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  existingCommitment?: { status: string } | null;
}

export function useAnnualCampaign(profile: ResidentProfile) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCampaign = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${profile.communitySlug}/finance/annual-campaigns`);
      const json = await res.json();
      if (res.ok && json.success) {
        const active = (json.data || []).find((item: Campaign) => item.status === 'ACTIVE');
        setCampaign(active || null);
      }
    } catch {
      setError('No se pudo consultar la campaña anual.');
    } finally {
      setIsLoading(false);
    }
  }, [profile.communitySlug]);

  useEffect(() => { loadCampaign(); }, [loadCampaign]);

  const loadQuote = useCallback(async () => {
    if (!campaign || !profile.propertyId) return;
    const res = await fetch(`http://localhost:4000/api/v1/tenants/${profile.communitySlug}/finance/annual-campaigns/${campaign.id}/quote`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: profile.propertyId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'No se pudo calcular la campaña.');
    setQuote(json.data);
  }, [campaign, profile.communitySlug, profile.propertyId]);

  const submit = useCallback(async (reference: string, receiptUrl: string) => {
    if (!campaign || !quote || !profile.propertyId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/tenants/${profile.communitySlug}/finance/annual-campaigns/${campaign.id}/submissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: profile.propertyId, amount: quote.netAmount, reference, receiptUrl, payerName: profile.name }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'No se pudo enviar el comprobante.');
      setQuote((previous) => previous ? { ...previous, existingCommitment: { status: 'PENDING_APPROVAL' } } : previous);
    } finally {
      setIsSubmitting(false);
    }
  }, [campaign, profile, quote]);

  return { campaign, quote, isLoading, isSubmitting, error, loadQuote, submit };
}