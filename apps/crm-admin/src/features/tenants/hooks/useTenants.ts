import { useState } from 'react';
import { parseClientError } from '@dommia/ui';
import { TenantFormData } from '../components/TenantModal';
import { ProspectItem, TenantItem } from '../../../types';
import { crmApiFetch } from '../../auth/api';

const INITIAL_TENANT_FORM: TenantFormData = {
  slug: '',
  name: '',
  tier: 'STANDARD',
  maxProperties: 100,
  contactEmail: '',
  hasCustomDomain: false,
  modules: ['FINANCE', 'ACCESS_QR', 'RESIDENT_APP'],
};

interface UseTenantsProps {
  onRefresh: () => void;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export function useTenants({ onRefresh, showFeedback }: UseTenantsProps) {
  const [tenantForm, setTenantForm] = useState<TenantFormData>(INITIAL_TENANT_FORM);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateTenant = () => {
    setEditingTenant(null);
    setTenantForm(INITIAL_TENANT_FORM);
    setIsTenantModalOpen(true);
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
    });
    setIsTenantModalOpen(true);
  };

  const populateFromProspect = (prospect: ProspectItem) => {
    setEditingTenant(null);
    const generatedSlug = prospect.community_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);

    let tier = 'STANDARD';
    if (prospect.estimated_houses <= 50) tier = 'BASIC';
    else if (prospect.estimated_houses <= 150) tier = 'STANDARD';
    else if (prospect.estimated_houses <= 300) tier = 'PROFESSIONAL';
    else tier = 'ENTERPRISE';

    setTenantForm({
      slug: generatedSlug,
      name: prospect.community_name,
      tier,
      maxProperties: prospect.estimated_houses || 100,
      contactEmail: prospect.email,
      hasCustomDomain: tier === 'ENTERPRISE',
      modules: ['FINANCE', 'ACCESS_QR', 'RESIDENT_APP'],
    });

    setIsTenantModalOpen(true);
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
    isTenantModalOpen,
    setIsTenantModalOpen,
    editingTenant,
    isSubmitting,
    openCreateTenant,
    openEditTenant,
    populateFromProspect,
    handleSaveTenant,
  };
}

