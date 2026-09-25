'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { WorkspacePicker } from '@/features/auth/components/WorkspacePicker';

import { useProperties } from '@/features/properties/hooks/useProperties';
import { PropertiesTable } from '@/features/properties/components/PropertiesTable';
import { AddPropertyModal } from '@/features/properties/components/AddPropertyModal';
import { EditPropertyModal } from '@/features/properties/components/EditPropertyModal';
import { UpgradeModal } from '@/features/properties/components/UpgradeModal';

import { useResidents } from '@/features/residents/hooks/useResidents';
import { ResidentsTable } from '@/features/residents/components/ResidentsTable';
import { ResidentModal } from '@/features/residents/components/ResidentModal';

import { useVehicles } from '@/features/vehicles/hooks/useVehicles';
import { VehiclesTable } from '@/features/vehicles/components/VehiclesTable';
import { VehicleModal } from '@/features/vehicles/components/VehicleModal';

import { useNotices } from '@/features/notices/hooks/useNotices';
import { NoticesTable } from '@/features/notices/components/NoticesTable';
import { NoticeModal } from '@/features/notices/components/NoticeModal';

import { useFees } from '@/features/finance/hooks/useFees';
import { ChargesAndPaymentsView } from '@/features/finance/components/ChargesAndPaymentsView';

import { TopNavbar } from '@/features/dashboard/components/TopNavbar';
import { CapacityHeroBanner } from '@/features/dashboard/components/CapacityHeroBanner';
import { StatsMetricsGrid } from '@/features/dashboard/components/StatsMetricsGrid';
import { TabNavigation, AdminTab } from '@/features/dashboard/components/TabNavigation';
import { ToastNotification } from '@/features/dashboard/components/ToastNotification';
import { NotificationToast } from '@/types';

export default function CommunitiesAdminPage() {
  const auth = useAuth();
  const properties = useProperties();
  const residents = useResidents();
  const vehicles = useVehicles();
  const notices = useNotices();
  const fees = useFees();

  const [activeTab, setActiveTab] = useState<AdminTab>('PROPERTIES');
  const [toast, setToast] = useState<NotificationToast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync data whenever activeTenant changes
  useEffect(() => {
    if (auth.activeTenant?.slug) {
      properties.loadProperties(auth.activeTenant.slug);
      residents.loadResidents(auth.activeTenant.slug);
      vehicles.loadVehicles(auth.activeTenant.slug);
      notices.loadNotices(auth.activeTenant.slug);
      fees.loadFees(auth.activeTenant.slug);
    }
  }, [auth.activeTenant?.slug]);

  // Auth gate 1: Show multi-tenant picker if logged in with multiple workspaces
  if (auth.showWorkspacePicker || (!auth.activeTenant && (auth.userSession?.tenants?.length ?? 0) > 1)) {
    return (
      <WorkspacePicker
        tenants={auth.userSession?.tenants || []}
        userName={
          auth.userSession?.user
            ? `${auth.userSession.user.firstName} ${auth.userSession.user.lastName}`.trim()
            : auth.userSession?.user?.email || 'Administrador'
        }
        onSelectTenant={auth.handleSelectTenant}
        onLogout={auth.handleLogout}
      />
    );
  }

  // Auth gate 2: Show login form if not authenticated
  if (!auth.activeTenant || !auth.userSession) {
    return (
      <LoginForm
        form={auth.loginForm}
        onChange={(f, v) => auth.setLoginForm((prev) => ({ ...prev, [f]: v }))}
        onSubmit={auth.handleLogin}
        loading={auth.loginLoading}
        error={auth.loginError}
        onQuickDemo={(email, pass) => auth.setLoginForm({ email, password: pass })}
      />
    );
  }

  // Active Workspace Portal View
  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      <TopNavbar
        activeTenant={auth.activeTenant}
        userSession={auth.userSession}
        onSwitchWorkspace={() => auth.setShowWorkspacePicker(true)}
        onLogout={auth.handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <CapacityHeroBanner
          metrics={properties.metrics}
          activeTenant={auth.activeTenant}
          onOpenUpgradeModal={() => properties.setIsUpgradeModalOpen(true)}
        />

        <StatsMetricsGrid
          metrics={properties.metrics}
          residentsCount={residents.residents.length}
          vehiclesCount={vehicles.vehicles.length}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onFilterDelinquent={() => {
            setActiveTab('PROPERTIES');
            properties.setFilterDelinquent('DELINQUENT');
          }}
        />

        <TabNavigation
          activeTab={activeTab}
          propertiesCount={properties.properties.length}
          residentsCount={residents.residents.length}
          vehiclesCount={vehicles.vehicles.length}
          noticesCount={notices.notices.length}
          feesCount={fees.fees.length}
          onTabChange={setActiveTab}
        />

        {activeTab === 'PROPERTIES' && (
          <PropertiesTable
            properties={properties.filteredProperties}
            allPropertiesCount={properties.properties.length}
            metrics={properties.metrics}
            loading={properties.loadingData}
            searchQuery={properties.searchQuery}
            onSearchChange={properties.setSearchQuery}
            filterDelinquent={properties.filterDelinquent}
            onFilterChange={properties.setFilterDelinquent}
            onRefresh={() => auth.activeTenant?.slug && properties.loadProperties(auth.activeTenant.slug)}
            onOpenAdd={() => {
              if (properties.metrics?.isLimitReached) {
                properties.setIsUpgradeModalOpen(true);
              } else {
                properties.setIsAddModalOpen(true);
              }
            }}
            onOpenEdit={(p) => {
              properties.setEditingProperty(p);
              properties.setIsEditModalOpen(true);
            }}
            onDelete={(id, street, num) => {
              if (auth.activeTenant?.slug) {
                properties.handleDeleteProperty(auth.activeTenant.slug, id, street, num, showToast);
              }
            }}
            onFilterResidentsByProperty={(propId) => {
              residents.setResidentPropertyFilter(propId);
              setActiveTab('RESIDENTS');
            }}
            onFilterVehiclesByProperty={(propId) => {
              vehicles.setVehiclePropertyFilter(propId);
              setActiveTab('VEHICLES');
            }}
            onAddResidentToProperty={(propId) => {
              residents.openAddModal(propId, properties.properties);
            }}
            onAddVehicleToProperty={(propId) => {
              vehicles.openAddModal(propId, undefined, properties.properties);
            }}
          />
        )}

        {activeTab === 'RESIDENTS' && (
          <ResidentsTable
            residents={residents.filteredResidents}
            allResidents={residents.residents}
            loading={residents.loadingResidents}
            searchQuery={residents.residentSearchQuery}
            onSearchChange={residents.setResidentSearchQuery}
            filterRole={residents.filterResidentRole}
            onFilterRoleChange={residents.setFilterResidentRole}
            propertyFilter={residents.residentPropertyFilter}
            onClearPropertyFilter={() => residents.setResidentPropertyFilter(null)}
            onRefresh={() => auth.activeTenant?.slug && residents.loadResidents(auth.activeTenant.slug)}
            onOpenAdd={() => residents.openAddModal(undefined, properties.properties)}
            onOpenEdit={residents.openEditModal}
            onDelete={(id, name) => {
              if (auth.activeTenant?.slug) {
                residents.handleDeleteResident(auth.activeTenant.slug, id, name, showToast);
              }
            }}
            onAddVehicleToResident={(propId, resId) => {
              vehicles.openAddModal(propId, resId, properties.properties);
            }}
          />
        )}

        {activeTab === 'VEHICLES' && (
          <VehiclesTable
            vehicles={vehicles.filteredVehicles}
            allVehiclesCount={vehicles.vehicles.length}
            searchQuery={vehicles.vehicleSearchQuery}
            onSearchChange={vehicles.setVehicleSearchQuery}
            propertyFilter={vehicles.vehiclePropertyFilter}
            onClearPropertyFilter={() => vehicles.setVehiclePropertyFilter(null)}
            loading={vehicles.loadingVehicles}
            onRefresh={() => auth.activeTenant?.slug && vehicles.loadVehicles(auth.activeTenant.slug)}
            onOpenAdd={() => vehicles.openAddModal(undefined, undefined, properties.properties)}
            onOpenEdit={vehicles.openEditModal}
            onDelete={(id, plates) => {
              if (auth.activeTenant?.slug) {
                vehicles.handleDeleteVehicle(auth.activeTenant.slug, id, plates, showToast);
              }
            }}
          />
        )}

        {activeTab === 'NOTICES' && (
          <NoticesTable
            notices={notices.filteredNotices}
            allNoticesCount={notices.notices.length}
            loading={notices.loadingNotices}
            searchQuery={notices.noticeSearchQuery}
            onSearchChange={notices.setNoticeSearchQuery}
            filterCategory={notices.filterNoticeCategory}
            onFilterCategory={notices.setFilterNoticeCategory}
            onOpenAdd={notices.openAddNoticeModal}
            onOpenEdit={notices.openEditNoticeModal}
            onDelete={(id, title) => {
              if (auth.activeTenant?.slug) {
                notices.handleDeleteNotice(auth.activeTenant.slug, id, title, showToast);
              }
            }}
          />
        )}

        {activeTab === 'FINANCE' && auth.activeTenant?.slug && (
          <ChargesAndPaymentsView
            tenantSlug={auth.activeTenant.slug}
            properties={properties.properties}
            showToast={showToast}
          />
        )}
      </main>

      {/* Property Modals */}
      <AddPropertyModal
        isOpen={properties.isAddModalOpen}
        onClose={() => properties.setIsAddModalOpen(false)}
        form={properties.propertyForm}
        onChange={(f, v) => properties.setPropertyForm((prev) => ({ ...prev, [f]: v }))}
        onSubmit={(e) => {
          e.preventDefault();
          if (auth.activeTenant?.slug) {
            properties.handleAddProperty(auth.activeTenant.slug, showToast);
          }
        }}
        loading={properties.actionLoading}
        error={properties.formError}
        metrics={properties.metrics}
      />

      <EditPropertyModal
        isOpen={properties.isEditModalOpen}
        onClose={() => properties.setIsEditModalOpen(false)}
        property={properties.editingProperty}
        onChange={properties.setEditingProperty}
        onSubmit={(e) => {
          e.preventDefault();
          if (auth.activeTenant?.slug) {
            properties.handleUpdateProperty(auth.activeTenant.slug, showToast);
          }
        }}
        loading={properties.actionLoading}
        error={properties.formError}
      />


      <UpgradeModal
        isOpen={properties.isUpgradeModalOpen}
        onClose={() => properties.setIsUpgradeModalOpen(false)}
        activeTenant={auth.activeTenant}
        metrics={properties.metrics}
      />

      {/* Resident Modal */}
      <ResidentModal
        isOpen={residents.isAddResidentModalOpen || residents.isEditResidentModalOpen}
        isEdit={residents.isEditResidentModalOpen}
        onClose={() => {
          residents.setIsAddResidentModalOpen(false);
          residents.setIsEditResidentModalOpen(false);
        }}
        properties={properties.properties}
        form={residents.residentForm}
        onChange={(f, v) => residents.setResidentForm((prev) => ({ ...prev, [f]: v }))}
        onSubmit={(e) => {
          e.preventDefault();
          if (auth.activeTenant?.slug) {
            if (residents.isEditResidentModalOpen) {
              residents.handleUpdateResident(auth.activeTenant.slug, showToast);
            } else {
              residents.handleAddResident(auth.activeTenant.slug, showToast);
            }
          }
        }}
        loading={residents.actionLoading}
        error={residents.formError}
      />

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={vehicles.isAddVehicleModalOpen || vehicles.isEditVehicleModalOpen}
        isEdit={vehicles.isEditVehicleModalOpen}
        onClose={() => {
          vehicles.setIsAddVehicleModalOpen(false);
          vehicles.setIsEditVehicleModalOpen(false);
        }}
        properties={properties.properties}
        residents={residents.residents}
        form={vehicles.vehicleForm}
        onChange={(f, v) => vehicles.setVehicleForm((prev) => ({ ...prev, [f]: v }))}
        onSubmit={(e) => {
          e.preventDefault();
          if (auth.activeTenant?.slug) {
            if (vehicles.isEditVehicleModalOpen) {
              vehicles.handleUpdateVehicle(auth.activeTenant.slug, showToast);
            } else {
              vehicles.handleAddVehicle(auth.activeTenant.slug, showToast);
            }
          }
        }}
        loading={vehicles.actionLoading}
        error={vehicles.formError}
      />

      {/* Notice Modal */}
      <NoticeModal
        isOpen={notices.isAddNoticeModalOpen || notices.isEditNoticeModalOpen}
        isEditing={notices.isEditNoticeModalOpen}
        form={notices.noticeForm}
        onChange={(f, v) => notices.setNoticeForm((prev) => ({ ...prev, [f]: v }))}
        onSubmit={() => {
          if (auth.activeTenant?.slug) {
            if (notices.isEditNoticeModalOpen) {
              notices.handleUpdateNotice(auth.activeTenant.slug, showToast);
            } else {
              notices.handleCreateNotice(auth.activeTenant.slug, showToast);
            }
          }
        }}
        onClose={() => {
          notices.setIsAddNoticeModalOpen(false);
          notices.setIsEditNoticeModalOpen(false);
        }}
        loading={notices.actionLoading}
        error={notices.formError}
      />

      {/* Toast Notification */}
      <ToastNotification notification={toast} />
    </div>
  );
}
