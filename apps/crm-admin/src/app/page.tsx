'use client';

import React from 'react';
import { TopHeader } from '../features/dashboard/components/TopHeader';
import { TabNav } from '../features/dashboard/components/TabNav';
import { ToastFeedback } from '../features/dashboard/components/ToastFeedback';
import { DashboardView } from '../features/dashboard/components/DashboardView';
import { PipelineView } from '../features/pipeline/components/PipelineView';
import { ProspectModal } from '../features/pipeline/components/ProspectModal';
import { TenantsView } from '../features/tenants/components/TenantsView';
import { TenantModal } from '../features/tenants/components/TenantModal';
import { GatewaysView } from '../features/gateways/components/GatewaysView';
import { GatewayModal } from '../features/gateways/components/GatewayModal';
import { PlansView } from '../features/plans/components/PlansView';
import { PlanModal } from '../features/plans/components/PlanModal';

import { useCrmDashboard } from '../features/dashboard/hooks/useCrmDashboard';
import { useProspects } from '../features/pipeline/hooks/useProspects';
import { useTenants } from '../features/tenants/hooks/useTenants';
import { useGateways } from '../features/gateways/hooks/useGateways';
import { usePlans } from '../features/plans/hooks/usePlans';

export default function CrmDashboardPage() {
  const dashboard = useCrmDashboard();

  const feedbackProps = {
    onRefresh: dashboard.fetchAllData,
    showFeedback: dashboard.showFeedback,
  };

  const prospects = useProspects(feedbackProps);
  const tenants = useTenants(feedbackProps);
  const gateways = useGateways(feedbackProps);
  const plans = usePlans(feedbackProps);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <TopHeader
        isLoading={dashboard.isLoading}
        onRefresh={dashboard.fetchAllData}
        onOpenNewTenant={() => tenants.setIsTenantModalOpen(true)}
      />

      {/* Navigation Sub-header / Tabs */}
      <TabNav
        activeTab={dashboard.activeTab}
        onTabChange={dashboard.setActiveTab}
        prospectsCount={dashboard.prospects.length}
        tenantsCount={dashboard.tenants.length}
        gatewaysCount={dashboard.gateways.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        <ToastFeedback feedback={dashboard.feedback} />

        {dashboard.activeTab === 'dashboard' && (
          <DashboardView
            metrics={dashboard.metrics}
            onViewPipeline={() => dashboard.setActiveTab('pipeline')}
          />
        )}

        {dashboard.activeTab === 'pipeline' && (
          <PipelineView
            prospects={dashboard.prospects}
            onOpenModal={() => prospects.setIsProspectModalOpen(true)}
            onStageChange={prospects.handleStageChange}
            onProvision={tenants.populateFromProspect}
          />
        )}

        {dashboard.activeTab === 'tenants' && (
          <TenantsView
            tenants={dashboard.tenants}
            onOpenModal={tenants.openCreateTenant}
            onEditTenant={tenants.openEditTenant}
          />
        )}

        {dashboard.activeTab === 'gateways' && (
          <GatewaysView
            gateways={dashboard.gateways}
            onOpenModal={() => gateways.setIsGatewayModalOpen(true)}
            onSimulateHeartbeat={gateways.handleSimulateHeartbeat}
          />
        )}

        {dashboard.activeTab === 'plans' && (
          <PlansView
            plans={dashboard.plans}
            onEditPlan={plans.handleEditPlan}
          />
        )}
      </main>

      {/* Modals */}
      <TenantModal
        isOpen={tenants.isTenantModalOpen}
        onClose={() => tenants.setIsTenantModalOpen(false)}
        form={tenants.tenantForm}
        onChange={tenants.setTenantForm}
        onSubmit={tenants.handleSaveTenant}
        isSubmitting={tenants.isSubmitting}
        isEdit={!!tenants.editingTenant}
      />


      <ProspectModal
        isOpen={prospects.isProspectModalOpen}
        onClose={() => prospects.setIsProspectModalOpen(false)}
        form={prospects.prospectForm}
        onChange={prospects.setProspectForm}
        onSubmit={prospects.handleCreateProspect}
        isSubmitting={prospects.isSubmitting}
      />

      <GatewayModal
        isOpen={gateways.isGatewayModalOpen}
        onClose={() => gateways.setIsGatewayModalOpen(false)}
        form={gateways.gatewayForm}
        onChange={gateways.setGatewayForm}
        onSubmit={gateways.handleCreateGateway}
        isSubmitting={gateways.isSubmitting}
        tenants={dashboard.tenants}
      />

      <PlanModal
        isOpen={plans.isPlanModalOpen}
        onClose={() => plans.setIsPlanModalOpen(false)}
        form={plans.planForm}
        editingPlan={plans.editingPlan}
        onChange={plans.setPlanForm}
        onSubmit={plans.handleSavePlan}
        isSubmitting={plans.isSubmitting}
      />
    </div>
  );
}
