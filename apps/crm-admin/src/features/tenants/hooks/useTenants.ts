import { useEffect, useState } from 'react';
import { parseClientError } from '@dommia/ui';
import { TenantFormData } from '../components/TenantModal';
import { PlanItem, ProspectItem, TenantItem } from '../../../types';
import { crmApiFetch } from '../../auth/api';
import { getTenantModulesForPlan } from '../../plans/module-catalog';

const INITIAL_TENANT_FORM: TenantFormData = {
  slug: '',
  name: '',
  tier: 'STANDARD',
  maxProperties: 100,
  contactEmail: '',
  hasCustomDomain: false,
  modules: [],
  billingInterval: 'MONTHLY',
};

interface UseTenantsProps {
  plans: PlanItem[];
  onRefresh: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function useTenants({ plans, onRefresh, showFeedback }: UseTenantsProps) {
  const [planCatalog, setPlanCatalog] = useState<PlanItem[]>(plans);
  const [tenantForm, setTenantForm] = useState<TenantFormData>(INITIAL_TENANT_FORM);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plans.length > 0) setPlanCatalog(plans);
  }, [plans]);

  const loadPlanCatalog = async () => {
    const cachedPlans = plans.length > 0 ? plans : planCatalog;
    if (cachedPlans.length > 0) return cachedPlans.filter((plan) => plan.is_active);

    const response = await crmApiFetch('/crm/plans');
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      throw new Error(result.message || 'No fue posible consultar los planes activos.');
    }

    const activePlans = (result.data as PlanItem[]).filter((plan) => plan.is_active);
    if (activePlans.length === 0) throw new Error('No hay planes activos para asignar.');
    setPlanCatalog(activePlans);
    return activePlans;
  };

  const planModules = (plan: PlanItem) => getTenantModulesForPlan(Array.isArray(plan.included_modules) ? plan.included_modules : []);

  const openCreateTenant = async () => {
    try {
      const activePlans = await loadPlanCatalog();
      const defaultPlan = activePlans.find((plan) => plan.code === 'STANDARD') || activePlans[0];
      setEditingTenant(null);
      setTenantForm({
        ...INITIAL_TENANT_FORM,
        tier: defaultPlan.code,
        maxProperties: Number(defaultPlan.max_properties),
        hasCustomDomain: defaultPlan.includes_custom_domain,
        modules: planModules(defaultPlan),
      });
      setIsTenantModalOpen(true);
    } catch (error) {
      const parsed = parseClientError(error, 'No fue posible obtener los módulos del plan.');
      showFeedback('error', parsed.description);
    }
  };

  const openEditTenant = (tenant: TenantItem) => {
    setEditingTenant(tenant);
    let parsedModules = ['FINANCE', 'ACCESS_QR', 'RESIDENT_APP'];
    if (Array.isArray(tenant.modules)) {
      parsedModules = tenant.modules;
    } else if (typeof tenant.modules === 'object' && tenant.modules !== null) {
      parsedModules = Object.keys(tenant.modules).filter((k) => (tenant.modules as any)[k]);
    }

    setTenantForm({
      slug: tenant.slug,
      name: tenant.name,
      tier: tenant.tier || 'STANDARD',
      maxProperties: tenant.max_properties || 100,
      contactEmail: tenant.contact_email || '',
      hasCustomDomain: tenant.has_custom_domain || false,
      modules: parsedModules,
      billingInterval: 'MONTHLY',
    });
    setIsTenantModalOpen(true);
  };

  const handleTierChange = (tier: string, isEdit: boolean) => {
    const selectedPlan = planCatalog.find((plan) => plan.code === tier && plan.is_active);
    setTenantForm((current) => {
      if (isEdit || !selectedPlan) return { ...current, tier };
      return {
        ...current,
        tier,
        maxProperties: Number(selectedPlan.max_properties),
        hasCustomDomain: selectedPlan.includes_custom_domain,
        modules: planModules(selectedPlan),
      };
    });
  };

  const populateFromProspect = async (prospect: ProspectItem) => {
    try {
      const activePlans = await loadPlanCatalog();

      const estimatedHouses = prospect.estimated_houses || 100;
      const selectedPlan = activePlans.find((plan) =>
        estimatedHouses >= Number(plan.min_properties) && estimatedHouses <= Number(plan.max_properties));
      if (!selectedPlan) {
        throw new Error(`Los planes activos no cubren una comunidad de ${estimatedHouses} viviendas. Ajusta los rangos en CRM Maestro.`);
      }
      const tier = String(selectedPlan.code).toUpperCase();
      const generatedSlug = prospect.community_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 30);

      setEditingTenant(null);
      setTenantForm({
        slug: generatedSlug,
        name: prospect.community_name,
        tier,
        maxProperties: estimatedHouses,
        contactEmail: prospect.email,
        hasCustomDomain: selectedPlan.includes_custom_domain,
        modules: planModules(selectedPlan),
        billingInterval: 'MONTHLY',
      });
      setIsTenantModalOpen(true);
    } catch (error) {
      const parsed = parseClientError(error, 'No fue posible obtener los límites de los planes.');
      showFeedback('error', parsed.description);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingTenant) {
        // UPDATE existing tenant
        const res = await crmApiFetch(`/tenants/${editingTenant.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: tenantForm.name.trim(),
            tier: tenantForm.tier,
            maxProperties: Number(tenantForm.maxProperties),
            contactEmail: tenantForm.contactEmail || undefined,
            hasCustomDomain: tenantForm.tier === 'ENTERPRISE' || tenantForm.hasCustomDomain,
            modules: tenantForm.modules,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Error al actualizar fraccionamiento');

        showFeedback('success', `¡Fraccionamiento "${tenantForm.name}" actualizado correctamente!`);
      } else {
        // CREATE new tenant
        const res = await crmApiFetch('/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: tenantForm.slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_'),
            name: tenantForm.name.trim(),
            tier: tenantForm.tier,
            maxProperties: Number(tenantForm.maxProperties),
            contactEmail: tenantForm.contactEmail || undefined,
            hasCustomDomain: tenantForm.tier === 'ENTERPRISE' || tenantForm.hasCustomDomain,
            modules: tenantForm.modules,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Error al aprovisionar fraccionamiento');

        let contractIssue: string | null = null;
        try {
          if (!json.data?.id) throw new Error('La API no devolvió el ID del fraccionamiento creado.');
          const contractResponse = await crmApiFetch(`/crm/tenants/${json.data.id}/contract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ billingInterval: tenantForm.billingInterval }),
          });
          const contractResult = await contractResponse.json();
          if (!contractResponse.ok || !contractResult.success) {
            contractIssue = contractResult.message || 'No se pudo registrar el snapshot del precio vigente.';
          }
        } catch (error) {
          contractIssue = error instanceof Error ? error.message : 'No se pudo registrar el snapshot del precio vigente.';
        }
        if (contractIssue) {
          showFeedback('error', `El fraccionamiento fue creado, pero el contrato quedó pendiente. Abre su ficha para reconciliarlo. ${contractIssue}`);
          setTenantForm(INITIAL_TENANT_FORM);
          setEditingTenant(null);
          setTimeout(() => setIsTenantModalOpen(false), 1000);
          onRefresh();
          return;
        }

        showFeedback('success', `¡Fraccionamiento "${tenantForm.name}" aprovisionado con schema tenant_${tenantForm.slug}!`);
      }

      setTenantForm(INITIAL_TENANT_FORM);
      setEditingTenant(null);
      setTimeout(() => {
        setIsTenantModalOpen(false);
      }, 1000);
      onRefresh();
    } catch (err: any) {
      const parsed = parseClientError(err, 'No fue posible completar la operación del fraccionamiento.');
      showFeedback('error', parsed.description);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    tenantForm,
    setTenantForm,
    planCatalog,
    isTenantModalOpen,
    setIsTenantModalOpen,
    editingTenant,
    isSubmitting,
    openCreateTenant,
    openEditTenant,
    handleTierChange,
    populateFromProspect,
    handleSaveTenant,
  };
}

