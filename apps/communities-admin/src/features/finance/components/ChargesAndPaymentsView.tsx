'use client';

import React, { useState } from 'react';
import { Button } from '@dommia/ui';
import { Calendar, Wallet, Receipt, Plus, AlertTriangle } from 'lucide-react';
import { useFees } from '../hooks/useFees';
import { useBillingOperations } from '../hooks/useBillingOperations';
import { FeeConfigCard } from './FeeConfigCard';
import { FeeConfigModal } from './FeeConfigModal';
import { FeeSimulationModal } from './FeeSimulationModal';
import { CashPaymentModal } from './CashPaymentModal';
import { MonthlyCutoffModal } from './MonthlyCutoffModal';
import { FinanceMetricsHeader } from './FinanceMetricsHeader';
import { MonthlyChargesTable } from './MonthlyChargesTable';
import { PaymentsHistoryTable } from './PaymentsHistoryTable';
import { Property } from '@/types';
import { AnnualCampaignPanel } from './AnnualCampaignPanel';
import { useAnnualCampaigns } from '../hooks/useAnnualCampaigns';
import { MonthlyAccountabilityPanel } from './MonthlyAccountabilityPanel';

interface ChargesAndPaymentsViewProps {
  tenantSlug: string;
  properties: Property[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  stripeEnabled?: boolean;
  authToken?: string;
}

type FinanceSubTab = 'STRUCTURES' | 'CHARGES' | 'PAYMENTS' | 'REPORTS';

export function ChargesAndPaymentsView({
  tenantSlug,
  properties,
  showToast,
  stripeEnabled = false,
  authToken,
}: ChargesAndPaymentsViewProps) {
  const feesHook = useFees(authToken);
  const opsHook = useBillingOperations(authToken);
  const annualHook = useAnnualCampaigns(authToken);
  const [activeSubTab, setActiveSubTab] = useState<FinanceSubTab>('STRUCTURES');

  React.useEffect(() => {
    if (tenantSlug) {
      feesHook.loadFees(tenantSlug);
      opsHook.refreshAll(tenantSlug);
    }
  }, [tenantSlug]);

  const activeFeesCount = feesHook.fees.filter((f) => f.is_active).length;

  const q = (opsHook.filterSearch || '').toLowerCase();
  const filteredCharges = opsHook.charges.filter((c) =>
    (opsHook.filterChargeStatus === 'ALL' || c.status === opsHook.filterChargeStatus) &&
    (!q || c.concept.toLowerCase().includes(q) || (c.street && c.street.toLowerCase().includes(q)) || (c.primary_resident_name && c.primary_resident_name.toLowerCase().includes(q)))
  );

  const filteredPayments = opsHook.payments.filter((p) =>
    (opsHook.filterPaymentMethod === 'ALL' || p.payment_method === opsHook.filterPaymentMethod) &&
    (!q || p.reference.toLowerCase().includes(q) || (p.payer_name && p.payer_name.toLowerCase().includes(q)) || (p.street && p.street.toLowerCase().includes(q)))
  );
  const pendingPayments = opsHook.payments.filter((p) => p.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Dommia Finance • Cuotas & Recaudación
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
              Fase 3 Activa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestión de cuotas ordinarias/extraordinarias, emisión de cobros y recepción en ventanilla (Efectivo / SPEI).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => opsHook.setIsCutoffModalOpen(true)}
            className="border-slate-200 text-slate-700 font-semibold cursor-pointer shadow-2xs hover:bg-slate-50"
          >
            <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
            Emisión de Cobranza
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => opsHook.openCashPaymentModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm"
          >
            <Wallet className="w-4 h-4 mr-1.5" />
            Cobrar en Ventanilla
          </Button>
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <button
          type="button"
          onClick={() => setActiveSubTab('PAYMENTS')}
          className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left shadow-2xs hover:bg-amber-100"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            {pendingPayments.length} comprobante(s) SPEI esperan validación.
          </span>
          <span className="text-[11px] font-black uppercase text-amber-700">Revisar ahora</span>
        </button>
      )}

      <AnnualCampaignPanel tenantSlug={tenantSlug} properties={properties} authToken={authToken} {...annualHook} />

      {/* KPI Summary Cards */}
      <FinanceMetricsHeader
        summary={opsHook.summary}
        activeFeesCount={activeFeesCount}
        totalFeesCount={feesHook.fees.length}
      />

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(
            [
              { key: 'STRUCTURES', label: `1. Catálogo de Cuotas (${feesHook.fees.length})` },
              { key: 'CHARGES', label: `2. Cargos Emitidos (${opsHook.charges.length})` },
              { key: 'PAYMENTS', label: `3. Pagos Ventanilla / SPEI (${opsHook.payments.length})` },
              { key: 'REPORTS', label: '4. Rendición Mensual' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key)}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab === 'STRUCTURES' && (
          <Button
            variant="primary"
            size="sm"
            onClick={feesHook.openAddModal}
            className="mb-2 bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shrink-0 shadow-2xs text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nueva Cuota
          </Button>
        )}
      </div>

      {/* SUBTAB 1: Catálogo de Estructuras */}
      {activeSubTab === 'STRUCTURES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feesHook.fees.map((fee) => (
              <FeeConfigCard
                key={fee.id}
                fee={fee}
                onEdit={feesHook.openEditModal}
                onToggleActive={(f) => feesHook.handleToggleActive(tenantSlug, f, showToast)}
                onDelete={(id) => feesHook.handleDeleteFee(tenantSlug, id, showToast)}
                onSimulate={(id) => feesHook.handleSimulateFee(tenantSlug, id, showToast)}
              />
            ))}
          </div>
          {feesHook.fees.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No hay estructuras de cuotas configuradas</h3>
              <p className="text-xs text-slate-400 mt-1">Crea la primera cuota ordinaria para iniciar la cobranza.</p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Cargos de Cobranza Mensual */}
      {activeSubTab === 'CHARGES' && (
        <MonthlyChargesTable
          charges={filteredCharges}
          filterSearch={opsHook.filterSearch}
          onSearchChange={opsHook.setFilterSearch}
          filterStatus={opsHook.filterChargeStatus}
          onStatusChange={opsHook.setFilterChargeStatus}
          onCollectInCash={(propId, chargeId, amt) => opsHook.openCashPaymentModal(propId, chargeId, amt)}
        />
      )}

      {/* SUBTAB 3: Pagos en Ventanilla / SPEI */}
      {activeSubTab === 'PAYMENTS' && (
        <PaymentsHistoryTable
          payments={filteredPayments}
          filterSearch={opsHook.filterSearch}
          onSearchChange={opsHook.setFilterSearch}
          filterMethod={opsHook.filterPaymentMethod}
          onMethodChange={opsHook.setFilterPaymentMethod}
          onReview={(paymentId, status) => opsHook.reviewPayment(tenantSlug, paymentId, status, showToast)}
        />
      )}

      {activeSubTab === 'REPORTS' && (
        <MonthlyAccountabilityPanel
          tenantSlug={tenantSlug}
          authToken={authToken}
          showToast={showToast}
        />
      )}

      {/* Modals */}
      <CashPaymentModal
        isOpen={opsHook.isCashPaymentModalOpen}
        onClose={() => opsHook.setIsCashPaymentModalOpen(false)}
        form={opsHook.paymentForm}
        onChange={(f, v) => opsHook.setPaymentForm((prev) => ({ ...prev, [f]: v }))}
        onSubmit={() => opsHook.handleRecordPayment(tenantSlug, showToast)}
        properties={properties}
        charges={opsHook.charges}
        loading={opsHook.actionLoading}
        error={opsHook.formError}
        stripeEnabled={stripeEnabled}
      />

      <MonthlyCutoffModal
        isOpen={opsHook.isCutoffModalOpen}
        onClose={() => opsHook.setIsCutoffModalOpen(false)}
        form={opsHook.cutoffForm}
        onChange={(f, v) => opsHook.setCutoffForm((prev) => ({ ...prev, [f]: v }))}
        onExecute={() => opsHook.handleGenerateCutoff(tenantSlug, showToast)}
        loading={opsHook.actionLoading}
        result={opsHook.cutoffResult}
      />

      <FeeConfigModal
        isOpen={feesHook.isAddModalOpen || feesHook.isEditModalOpen}
        isEditing={feesHook.isEditModalOpen}
        formData={feesHook.feeForm}
        formError={feesHook.formError}
        loading={feesHook.actionLoading}
        onClose={() => {
          feesHook.setIsAddModalOpen(false);
          feesHook.setIsEditModalOpen(false);
        }}
        onChange={(data) => feesHook.setFeeForm((prev) => ({ ...prev, ...data }))}
        onSubmit={(e) => {
          e.preventDefault();
          if (feesHook.isEditModalOpen) {
            feesHook.handleUpdateFee(tenantSlug, showToast);
          } else {
            feesHook.handleCreateFee(tenantSlug, showToast);
          }
        }}
      />

      <FeeSimulationModal
        isOpen={feesHook.isSimulateModalOpen}
        onClose={() => feesHook.setIsSimulateModalOpen(false)}
        simulation={feesHook.simulationResult}
      />
    </div>
  );
}
