'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Receipt,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { FeeConfigCard } from './FeeConfigCard';
import { FeeConfigModal } from './FeeConfigModal';
import { FeeSimulationModal } from './FeeSimulationModal';
import { useFees } from '../hooks/useFees';
import { FeeType } from '@/types';

interface FeesConfigViewProps {
  tenantSlug: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function FeesConfigView({ tenantSlug, showToast }: FeesConfigViewProps) {
  const feesHook = useFees();

  // Load fees on mount or slug change
  React.useEffect(() => {
    if (tenantSlug) {
      feesHook.loadFees(tenantSlug);
    }
  }, [tenantSlug]);

  const activeFeesCount = feesHook.fees.filter((f) => f.is_active).length;
  const fixedCount = feesHook.fees.filter((f) => f.fee_type === 'FIXED_RECURRENT').length;
  const variableCount = feesHook.fees.filter((f) => f.fee_type === 'VARIABLE_LOT_SIZE').length;
  const extraordinaryCount = feesHook.fees.filter((f) => f.fee_type === 'EXTRAORDINARY').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Estructura de Cuotas & Finanzas Comunitarias
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
              Fase 3 Activa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configura el catálogo de conceptos de cobro (cuotas fijas, variables por m² y extraordinarias) con reglas de vencimiento, recargos y pronto pago.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={feesHook.openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Estructura de Cuota
        </Button>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Estructuras</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-heading mt-1 block">
            {feesHook.fees.length}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">
            {activeFeesCount} activas para cobro
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Cuotas Ordinarias</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-heading mt-1 block">
            {fixedCount}
          </span>
          <span className="text-[10px] text-slate-500">Monto uniforme fijo</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Por Metraje (m²)</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-heading mt-1 block">
            {variableCount}
          </span>
          <span className="text-[10px] text-slate-500">Proporcional al lote</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">Extraordinarias</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-heading mt-1 block">
            {extraordinaryCount}
          </span>
          <span className="text-[10px] text-slate-500">Proyectos / Plumas</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por concepto o descripción..."
            value={feesHook.feeSearchQuery}
            onChange={(e) => feesHook.setFeeSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Todas' },
            { key: 'FIXED_RECURRENT', label: 'Ordinarias' },
            { key: 'VARIABLE_LOT_SIZE', label: 'Por Metraje (m²)' },
            { key: 'EXTRAORDINARY', label: 'Extraordinarias' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => feesHook.setFilterFeeType(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                feesHook.filterFeeType === tab.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {feesHook.loadingFees ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Cargando catálogo de cuotas...
        </div>
      ) : feesHook.filteredFees.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No se encontraron estructuras de cuotas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {feesHook.feeSearchQuery
              ? 'Intenta con otro término de búsqueda o limpia los filtros.'
              : 'Empieza configurando la primera cuota ordinaria mensual o extraordinaria para tu fraccionamiento.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={feesHook.openAddModal}
            className="text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Configurar Primera Cuota
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {feesHook.filteredFees.map((fee) => (
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
      )}

      {/* Modals */}
      <FeeConfigModal
        isOpen={feesHook.isAddModalOpen}
        isEditing={false}
        formData={feesHook.feeForm}
        formError={feesHook.formError}
        loading={feesHook.actionLoading}
        onClose={() => feesHook.setIsAddModalOpen(false)}
        onChange={(data) => feesHook.setFeeForm((prev) => ({ ...prev, ...data }))}
        onSubmit={(e) => {
          e.preventDefault();
          feesHook.handleCreateFee(tenantSlug, showToast);
        }}
      />

      <FeeConfigModal
        isOpen={feesHook.isEditModalOpen}
        isEditing={true}
        formData={feesHook.feeForm}
        formError={feesHook.formError}
        loading={feesHook.actionLoading}
        onClose={() => feesHook.setIsEditModalOpen(false)}
        onChange={(data) => feesHook.setFeeForm((prev) => ({ ...prev, ...data }))}
        onSubmit={(e) => {
          e.preventDefault();
          feesHook.handleUpdateFee(tenantSlug, showToast);
        }}
      />

      <FeeSimulationModal
        isOpen={feesHook.isSimulateModalOpen}
        simulation={feesHook.simulationResult}
        onClose={() => feesHook.setIsSimulateModalOpen(false)}
      />
    </div>
  );
}
