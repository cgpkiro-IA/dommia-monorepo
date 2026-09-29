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
import { AnalyticsView } from '../features/analytics/components/AnalyticsView';
import { AlertsCenterView } from '../features/alerts/components/AlertsCenterView';
import { CrmLogin, CrmMfaChallenge } from '../features/auth/components/CrmLogin';
import { useCrmAuth } from '../features/auth/hooks/useCrmAuth';
import { MfaSettingsPanel } from '../features/auth/components/MfaSettingsPanel';

import { useCrmDashboard } from '../features/dashboard/hooks/useCrmDashboard';
import { useProspects } from '../features/pipeline/hooks/useProspects';
import { useTenants } from '../features/tenants/hooks/useTenants';
import { useGateways } from '../features/gateways/hooks/useGateways';
import { usePlans } from '../features/plans/hooks/usePlans';
import { useCrmAnalytics } from '../features/analytics/hooks/useCrmAnalytics';
import { useCrmAlerts } from '../features/alerts/hooks/useCrmAlerts';

export default function CrmDashboardPage() {
  const auth = useCrmAuth();
  const dashboard = useCrmDashboard(auth.session?.token || null);
  const analytics = useCrmAnalytics(auth.session?.token || null);
  const alerts = useCrmAlerts(auth.session?.token || null);

  const feedbackProps = {
    onRefresh: dashboard.fetchAllData,
    showFeedback: dashboard.showFeedback,
  };

  const prospects = useProspects(feedbackProps);
  const tenants = useTenants(feedbackProps);
  const gateways = useGateways(feedbackProps);
  const plans = usePlans(feedbackProps);

  if (!auth.isHydrated) return <main className="min-h-screen bg-[#0F172A]" aria-busy="true" />;

  if (!auth.session) {
    if (auth.challengeToken) {
      return <CrmMfaChallenge onSubmit={auth.verifyMfa} onCancel={auth.cancelMfa} loading={auth.loading} error={auth.error} />;
    }
    return <CrmLogin onSubmit={auth.handleLogin} loading={auth.loading} error={auth.error} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Top Navbar */}
      <TopHeader
        isLoading={dashboard.isLoading}
        onRefresh={() => {
          dashboard.fetchAllData();
          analytics.refresh();
          alerts.refresh();
        }}
        onOpenNewTenant={() => tenants.setIsTenantModalOpen(true)}
        userEmail={auth.session.user.email}
        onLogout={auth.logout}
      />

      {/* Navigation Sub-header / Tabs */}
      <TabNav
        activeTab={dashboard.activeTab}
        onTabChange={dashboard.setActiveTab}
        prospectsCount={dashboard.prospects.length}
        tenantsCount={dashboard.tenants.length}
        gatewaysCount={dashboard.gateways.length}
        activeAlertsCount={alerts.summary?.active_count}
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

        {dashboard.activeTab === 'analytics' && (
          <AnalyticsView
            analytics={analytics.analytics}
            loading={analytics.loading}
            error={analytics.error}
            onRefresh={analytics.refresh}
          />
        )}

        {dashboard.activeTab === 'alerts' && (
          <AlertsCenterView
            alertsState={alerts}
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

        {dashboard.activeTab === 'security' && <MfaSettingsPanel />}
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
