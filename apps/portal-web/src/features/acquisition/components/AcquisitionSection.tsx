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
    <section id="contacto" className="py-24 bg-slate-50 dark:bg-[#070D18] relative overflow-hidden border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-500/10 dark:bg-royal-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Onboarding Seguro • El Sistema Operativo de tu Comunidad</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-heading mb-4">
            Comienza a Operar con DOMMIA
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {process.env.NEXT_PUBLIC_PORTAL_STATIC_MODE === '1'
              ? 'Solicita una demostración para tu mesa directiva o consulta la activación de tu comunidad con nuestro equipo.'
              : 'Elige el camino ideal para tu comunidad: solicita una demostración guiada para tu mesa directiva o activa tu fraccionamiento de forma inmediata.'}
          </p>

          {/* Mode Switcher */}
          <div className="mt-8">
            <AcquisitionModeTabs
              activeMode={activeMode}
              onModeChange={(mode) => {
                setActiveMode(mode);
                setErrorMessage(null);
              }}
            />
          </div>
        </div>

        {/* Form Container Card */}
        <div className="p-7 sm:p-11 rounded-3xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800/80 shadow-xl dark:shadow-2xl relative">
          {/* Security Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>
              {process.env.NEXT_PUBLIC_PORTAL_STATIC_MODE === '1'
                ? 'Al enviar la solicitud se abrirá tu aplicación de correo con un mensaje dirigido a info@dommia.com.mx. Revísalo y envíalo para que podamos responderte.'
                : <><strong className="text-slate-900 dark:text-white">Entorno Seguro y Protegido:</strong> Las demostraciones se realizan en sesiones virtuales privadas bajo estricto acuerdo de confidencialidad. Los datos y el software permanecen aislados sin exposición pública.</>}
            </span>
          </div>

          {/* Plan badge from calculator */}
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Plan Seleccionado: <strong className="text-slate-900 dark:text-white text-sm">{selectedTier}</strong> ({selectedHouses} viviendas)
              </span>
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-heading">{estimatedPrice}</span>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/40 flex items-center gap-3 text-red-800 dark:text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
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
