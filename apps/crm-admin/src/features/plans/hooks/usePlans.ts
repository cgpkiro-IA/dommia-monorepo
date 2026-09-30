'use client';

import { useState } from 'react';
import { PlanFormData } from '../components/PlanModal';
import { PlanItem } from '../../../types';
import { crmApiFetch } from '../../auth/api';

const INITIAL_PLAN_FORM: PlanFormData = {
  name: '',
  description: '',
  monthlyPrice: 0,
  maxProperties: 0,
  includesCustomDomain: false,
  customDomainAddonPrice: 490,
};

interface UsePlansProps {
  onRefresh: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function usePlans({ onRefresh, showFeedback }: UsePlansProps) {
  const [planForm, setPlanForm] = useState<PlanFormData>(INITIAL_PLAN_FORM);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditPlan = (plan: PlanItem) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: Number(plan.monthly_price),
      maxProperties: plan.max_properties,
      includesCustomDomain: plan.includes_custom_domain,
      customDomainAddonPrice: Number(plan.custom_domain_addon_price),
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSubmitting(true);

    try {
      const res = await crmApiFetch(`/crm/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm),
      });
      const data = await res.json();
      if (res.ok) {
        showFeedback('success', `¡Plan "${planForm.name}" actualizado exitosamente!`);
        setIsPlanModalOpen(false);
        onRefresh();
      } else {
        alert(data.message || 'Error al actualizar plan');
      }
    } catch (err) {
      console.error('Error saving plan:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    planForm,
    setPlanForm,
    editingPlan,
    isPlanModalOpen,
    setIsPlanModalOpen,
    isSubmitting,
    handleEditPlan,
    handleSavePlan,
  };
}
