'use client';

import { useState } from 'react';
import { ProspectFormData } from '../components/ProspectModal';
import { crmApiFetch } from '../../auth/api';

const INITIAL_PROSPECT_FORM: ProspectFormData = {
  name: '',
  email: '',
  phone: '',
  communityName: '',
  estimatedHouses: 100,
  notes: '',
};

interface UseProspectsProps {
  onRefresh: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function useProspects({ onRefresh, showFeedback }: UseProspectsProps) {
  const [prospectForm, setProspectForm] = useState<ProspectFormData>(INITIAL_PROSPECT_FORM);
  const [isProspectModalOpen, setIsProspectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStageChange = async (prospectId: string, newStage: string) => {
    try {
      const res = await crmApiFetch(`/crm/prospects/${prospectId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      if (res.ok) {
        onRefresh();
      } else {
        showFeedback('error', data.message || 'Error al actualizar etapa');
      }
    } catch (err) {
      console.error('Error updating stage:', err);
      showFeedback('error', 'No se pudo actualizar la etapa del prospecto.');
    }
  };

  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await crmApiFetch('/crm/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prospectForm.name.trim(),
          email: prospectForm.email.trim(),
          phone: prospectForm.phone?.trim() || undefined,
          communityName: prospectForm.communityName.trim(),
          estimatedHouses: Number(prospectForm.estimatedHouses),
          notes: prospectForm.notes || 'Prospecto registrado manualmente desde CRM',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al registrar prospecto');

      showFeedback('success', '¡Prospecto agregado al pipeline comercial con éxito!');
      setProspectForm(INITIAL_PROSPECT_FORM);
      setTimeout(() => {
        setIsProspectModalOpen(false);
      }, 1500);
      onRefresh();
    } catch (err: any) {
      showFeedback('error', err.message || 'Ocurrió un error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    prospectForm,
    setProspectForm,
    isProspectModalOpen,
    setIsProspectModalOpen,
    isSubmitting,
    handleStageChange,
    handleCreateProspect,
  };
}
