'use client';

import React from 'react';
import { Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAcquisition } from '../hooks/useAcquisition';
import { AcquisitionModeTabs } from './AcquisitionModeTabs';
import { DemoForm } from './DemoForm';
import { DemoSuccessView } from './DemoSuccessView';
import { SelfServiceForm } from './SelfServiceForm';
import { SelfServiceSuccessView } from './SelfServiceSuccessView';

interface AcquisitionSectionProps {
  selectedTier?: string;
  selectedHouses?: number;
  estimatedPrice?: string;
}

export const AcquisitionSection: React.FC<AcquisitionSectionProps> = ({
  selectedTier = 'Dommia Estándar',
  selectedHouses = 85,
  estimatedPrice = '$2,990 MXN/mes',
}) => {
  const {
    activeMode,
    setActiveMode,
    loading,
    errorMessage,
    setErrorMessage,
    successDemo,
    setSuccessDemo,
    successProvision,
    demoForm,
    setDemoForm,
    selfServiceForm,
    setSelfServiceForm,
    handleCommunityNameChange,
    handleDemoSubmit,
    handleSelfServiceSubmit,
    tierKey,
  } = useAcquisition({ selectedTier, selectedHouses, estimatedPrice });

  return (
    <section id="contacto" className="py-24 bg-[#0F172A] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Onboarding Seguro • El Sistema Operativo de tu Comunidad</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading mb-4">
            Comienza a Operar con DOMMIA
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
            Elige el camino ideal para tu comunidad: solicita una demostración guiada para tu mesa directiva o contrata y activa tu fraccionamiento de forma instantánea.
          </p>

          {/* Mode Switcher */}
          <AcquisitionModeTabs
            activeMode={activeMode}
            onModeChange={(mode) => {
              setActiveMode(mode);
              setErrorMessage(null);
            }}
          />
        </div>

        {/* Form Container Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative">
          {/* Security Banner */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Entorno Seguro y Protegido:</strong> Las demostraciones se realizan en sesiones virtuales privadas bajo estricto acuerdo de confidencialidad. Los datos y el software permanecen aislados sin exposición pública de archivos internos.
            </span>
          </div>

          {/* Plan badge from calculator */}
          <div className="mb-6 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Plan en Cotizador: <strong className="text-white">{selectedTier}</strong> ({selectedHouses} viviendas)
              </span>
            </span>
            <span className="font-bold text-emerald-400">{estimatedPrice}</span>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Option 1: Demo Form / Success */}
          {activeMode === 'demo' && (
            <div>
              {successDemo ? (
                <DemoSuccessView data={successDemo} onReset={() => setSuccessDemo(null)} />
              ) : (
                <DemoForm
                  formData={demoForm}
                  loading={loading}
                  onFormChange={setDemoForm}
                  onSubmit={handleDemoSubmit}
                />
              )}
            </div>
          )}

          {/* Option 2: Self-Service Form / Success */}
          {activeMode === 'self_service' && (
            <div>
              {successProvision ? (
                <SelfServiceSuccessView data={successProvision} />
              ) : (
                <SelfServiceForm
                  formData={selfServiceForm}
                  tierKey={tierKey}
                  estimatedPrice={estimatedPrice}
                  loading={loading}
                  onFormChange={setSelfServiceForm}
                  onCommunityNameChange={handleCommunityNameChange}
                  onSubmit={handleSelfServiceSubmit}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
