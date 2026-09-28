'use client';

import { useState, useEffect } from 'react';
import { 
  AcquisitionMode, 
  DemoFormData, 
  DemoSuccessData, 
  SelfServiceFormData, 
  SelfServiceSuccessData, 
  TierKey 
} from '../../../types';

import { trackEvent } from '../../../lib/analytics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface UseAcquisitionProps {
  selectedTier?: string;
  selectedHouses?: number;
  estimatedPrice?: string;
}

export function useAcquisition({
  selectedTier = 'Dommia Estándar',
  selectedHouses = 85,
  estimatedPrice = '$2,990 MXN/mes',
}: UseAcquisitionProps = {}) {
  const [activeMode, setActiveMode] = useState<AcquisitionMode>('demo');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDemo, setSuccessDemo] = useState<DemoSuccessData | null>(null);
  const [successProvision, setSuccessProvision] = useState<SelfServiceSuccessData | null>(null);

  // Demo Form State
  const [demoForm, setDemoForm] = useState<DemoFormData>({
    name: '',
    email: '',
    phone: '',
    communityName: '',
    estimatedHouses: selectedHouses,
    notes: '',
    honeypot: '',
  });

  // Self-Service Form State
  const [selfServiceForm, setSelfServiceForm] = useState<SelfServiceFormData>({
    communityName: '',
    slug: '',
    hasCustomDomain: false,
    maxProperties: selectedHouses,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '•••',
    honeypot: '',
  });

  // Synchronize when tier or houses change from calculator
  useEffect(() => {
    if (selectedHouses) {
      setDemoForm((prev) => ({
        ...prev,
        estimatedHouses: selectedHouses,
        notes: selectedTier ? `Interesado en ${selectedTier} (${estimatedPrice || ''})` : prev.notes,
      }));

      setSelfServiceForm((prev) => ({
        ...prev,
        maxProperties: selectedHouses,
      }));
    }
  }, [selectedHouses, selectedTier, estimatedPrice]);

  const mapTierToKey = (tierName: string): TierKey => {
    const lower = tierName.toLowerCase();
    if (lower.includes('básico') || lower.includes('basico')) return 'BASIC';
    if (lower.includes('estándar') || lower.includes('estandar')) return 'STANDARD';
    if (lower.includes('profesional')) return 'PROFESSIONAL';
    return 'ENTERPRISE';
  };

  // Auto-generate slug when community name changes in self-service
  const handleCommunityNameChange = (name: string) => {
    const generatedSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);

    setSelfServiceForm((prev) => ({
      ...prev,
      communityName: name,
      slug: prev.slug === '' || prev.slug === generatedSlug.slice(0, -1) ? generatedSlug : prev.slug,
    }));
  };

  // Submit Demo Request
  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    trackEvent('submit_demo_lead', {
      community_name: demoForm.communityName,
      houses_count: Number(demoForm.estimatedHouses),
      tier_name: selectedTier,
    });

    try {
      const response = await fetch(`${API_BASE}/crm/prospects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoForm.name,
          email: demoForm.email,
          phone: demoForm.phone,
          communityName: demoForm.communityName,
          estimatedHouses: Number(demoForm.estimatedHouses),
          notes: demoForm.notes || `Interesado en demostración de ${selectedTier}`,
          honeypot: demoForm.honeypot || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessDemo(result.data);
      } else {
        setErrorMessage(result.message || 'No se pudo agendar la demostración. Intenta de nuevo.');
      }
    } catch (err: any) {
      setErrorMessage('Error de conexión con el servidor central de Dommia.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Self-Service Activation
  const handleSelfServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const tierKey = mapTierToKey(selectedTier);

    trackEvent('start_self_service_provision', {
      community_name: selfServiceForm.communityName,
      slug: selfServiceForm.slug,
      tier_name: tierKey,
      houses_count: Number(selfServiceForm.maxProperties),
    });

    try {
      const response = await fetch(`${API_BASE}/crm/self-service-provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityName: selfServiceForm.communityName,
          slug: selfServiceForm.slug,
          tier: tierKey,
          maxProperties: Number(selfServiceForm.maxProperties),
          hasCustomDomain: tierKey === 'ENTERPRISE' || selfServiceForm.hasCustomDomain,
          adminName: selfServiceForm.adminName,
          adminEmail: selfServiceForm.adminEmail,
          adminPassword: selfServiceForm.adminPassword,
          paymentMethod: 'STRIPE_CREDIT_CARD',
          honeypot: selfServiceForm.honeypot || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessProvision(result.data);
      } else {
        setErrorMessage(result.message || 'Error al procesar la activación en línea.');
      }
    } catch (err: any) {
      setErrorMessage('Error de conexión con el motor de aprovisionamiento de Dommia.');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeMode,
    setActiveMode,
    loading,
    errorMessage,
    setErrorMessage,
    successDemo,
    setSuccessDemo,
    successProvision,
    setSuccessProvision,
    demoForm,
    setDemoForm,
    selfServiceForm,
    setSelfServiceForm,
    handleCommunityNameChange,
    handleDemoSubmit,
    handleSelfServiceSubmit,
    tierKey: mapTierToKey(selectedTier),
  };
}
