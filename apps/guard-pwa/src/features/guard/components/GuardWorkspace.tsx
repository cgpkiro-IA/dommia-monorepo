'use client';

import { useState, useRef, useEffect } from 'react';
import type { GuardSession } from '../types';
import { useGuardAccess } from '../hooks/useGuardAccess';
import { useGuardDeliveries } from '../hooks/useGuardDeliveries';
import { useGuardLookup } from '../hooks/useGuardLookup';
import { useGuardOperations } from '../hooks/useGuardOperations';
import { useGuardServices } from '../hooks/useGuardServices';
import { GuardAccessResult } from './GuardAccessResult';
import { GuardDeliveryPanel } from './GuardDeliveryPanel';
import { GuardHistoryPanel } from './GuardHistoryPanel';
import { GuardIncidentPanel } from './GuardIncidentPanel';
import { GuardLookupPanel } from './GuardLookupPanel';
import { GuardQrScannerPanel } from './GuardQrScannerPanel';
import { GuardServicePanel } from './GuardServicePanel';
import { GuardWorkspaceHeader, type GuardModule } from './GuardWorkspaceHeader';
import { ManualVisitPanel } from './ManualVisitPanel';
import { Bike, Camera } from 'lucide-react';

interface GuardWorkspaceProps {
  session: GuardSession;
  isOnline: boolean;
  onLogout: () => void;
}

export function GuardWorkspace({ session, isOnline, onLogout }: GuardWorkspaceProps) {
  const [activeModule, setActiveModule] = useState<GuardModule>('VISITS');
  const [visitsMode, setVisitsMode] = useState<'STANDARD' | 'SERVICES'>('STANDARD');
  const [tenantCopied, setTenantCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const access = useGuardAccess(session, isOnline);
  const lookup = useGuardLookup(session, isOnline);
  const deliveries = useGuardDeliveries(session, isOnline);
  const operations = useGuardOperations(session, isOnline);
  const services = useGuardServices(session, isOnline);

  useEffect(() => {
    if (access.result) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [access.result]);

  const handleCopyTenantId = async () => {
    try {
      await navigator.clipboard.writeText(session.tenantSlug);
      setTenantCopied(true);
      window.setTimeout(() => setTenantCopied(false), 1800);
    } catch {
      setTenantCopied(false);
    }
  };

  const handleModuleChange = (module: GuardModule) => {
    if (module !== activeModule && access.cameraState !== 'idle') access.stopScanning();
    setActiveModule(module);
  };

  const handleLogout = () => {
    access.resetSession();
    onLogout();
  };

  const handleNextVisit = () => {
    access.resetAfterResult();
  };

  return (
    <section className="guard-layout" aria-labelledby="guard-title">
      <GuardWorkspaceHeader
        session={session}
        tenantCopied={tenantCopied}
        activeModule={activeModule}
        activeServicesCount={services.activeServices.length}
        onCopyTenantId={() => void handleCopyTenantId()}
        onLogout={handleLogout}
        onModuleChange={handleModuleChange}
      />

      {activeModule === 'VISITS' && (
        <div className="space-y-4">
          {/* Sub-navegación dentro de Visitas */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md max-w-xl">
            <button
              type="button"
              onClick={() => setVisitsMode('STANDARD')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                visitsMode === 'STANDARD'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Validación QR & Visitas</span>
            </button>
            <button
              type="button"
              onClick={() => setVisitsMode('SERVICES')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                visitsMode === 'SERVICES'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Servicios & Proveedores</span>
              {services.activeServices.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  visitsMode === 'SERVICES' ? 'bg-amber-950 text-amber-200' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {services.activeServices.length}
                </span>
              )}
            </button>
          </div>

          {visitsMode === 'STANDARD' ? (
            <>
              <div className="workflow-grid">
                <GuardLookupPanel
                  query={lookup.lookupQuery}
                  onQueryChange={lookup.setLookupQuery}
                  result={lookup.lookupResult}
                  busy={lookup.lookupBusy}
                  onLookup={() => void lookup.handleLookup()}
                  onClear={lookup.clearLookup}
                  isOnline={isOnline}
                  photo={lookup.platePhoto}
                  photoUrl={lookup.platePhotoUrl}
                  imageInputRef={lookup.plateImageInputRef}
                  ocrBusy={lookup.plateOcrBusy}
                  ocrProgress={lookup.plateOcrProgress}
                  ocrMessage={lookup.plateOcrMessage}
                  onPhotoChange={lookup.handlePlatePhotoChange}
                  onReadPhoto={() => void lookup.readPlatePhoto()}
                  onRemovePhoto={lookup.removePlatePhoto}
                />
                <GuardQrScannerPanel
                  videoRef={access.videoRef}
                  state={access.cameraState}
                  message={access.cameraMessage}
                  isOnline={isOnline}
                  validationBusy={access.validationBusy}
                  hasResult={Boolean(access.result)}
                  onStart={() => void access.startCamera()}
                  onStop={access.stopScanning}
                />
                <ManualVisitPanel
                  isOnline={isOnline}
                  query={access.manualVisitQuery}
                  onQueryChange={access.setManualVisitQuery}
                  candidates={access.manualVisitCandidates}
                  selected={access.selectedManualVisit}
                  busy={access.manualVisitBusy}
                  authorizationBusy={access.manualVisitAuthorizationBusy}
                  error={access.manualVisitError}
                  message={access.manualVisitMessage}
                  identityVerified={access.identityVerified}
                  onIdentityVerifiedChange={access.setIdentityVerified}
                  callConfirmed={access.callConfirmed}
                  onCallConfirmedChange={access.setCallConfirmed}
                  onSearch={access.searchManualVisits}
                  onSelect={access.selectManualVisit}
                  onAuthorize={() => void access.authorizeManualVisit()}
                />
              </div>
              {access.validationBusy && <div className="validation-progress" role="status"><span className="progress-pulse" /> Consultando autorización con la comunidad...</div>}
              {access.result && (
                <div ref={resultRef} className="scroll-mt-4">
                  <GuardAccessResult
                    result={access.result}
                    isOnline={isOnline}
                    manualJustification={access.manualJustification}
                    onManualJustificationChange={access.setManualJustification}
                    manualOverrideBusy={access.manualOverrideBusy}
                    manualOverrideError={access.manualOverrideError}
                    onManualOverride={access.handleManualOverride}
                    onNext={handleNextVisit}
                  />
                </div>
              )}
              <GuardHistoryPanel
                isOnline={isOnline}
                events={operations.historyEvents}
                historyType={operations.historyType}
                onHistoryTypeChange={operations.setHistoryType}
                historyFrom={operations.historyFrom}
                onHistoryFromChange={operations.setHistoryFrom}
                historyTo={operations.historyTo}
                onHistoryToChange={operations.setHistoryTo}
                historyProperty={operations.historyProperty}
                onHistoryPropertyChange={operations.setHistoryProperty}
                loading={operations.historyLoading}
                error={operations.historyError}
                onRefresh={() => void operations.loadHistory()}
                onSubmit={(event) => { event.preventDefault(); void operations.loadHistory(); }}
              />
            </>
          ) : (
            <GuardServicePanel
              isOnline={isOnline}
              serviceType={services.serviceType}
              onServiceTypeChange={services.setServiceType}
              customServiceName={services.customServiceName}
              onCustomServiceNameChange={services.setCustomServiceName}
              supplierName={services.supplierName}
              onSupplierNameChange={services.setSupplierName}
              vehiclePlates={services.vehiclePlates}
              onVehiclePlatesChange={services.setVehiclePlates}
              destinationType={services.destinationType}
              onDestinationTypeChange={services.setDestinationType}
              destinations={services.destinations}
              onAddDestination={services.addDestination}
              onRemoveDestination={services.removeDestination}
              notes={services.notes}
              onNotesChange={services.setNotes}
              searchQuery={services.searchQuery}
              onSearchQueryChange={services.setSearchQuery}
              searchResults={services.searchResults}
              searchBusy={services.searchBusy}
              activeServices={services.activeServices}
              loadingServices={services.loadingServices}
              selectedActiveServiceId={services.selectedActiveServiceId}
              onSelectActiveService={services.setSelectedActiveServiceId}
              submitting={services.submitting}
              exitingId={services.exitingId}
              message={services.message}
              error={services.error}
              onSubmit={services.handleCreateService}
              onRegisterExit={services.handleRegisterExit}
              onRefreshServices={services.loadActiveServices}
            />
          )}
        </div>
      )}

      {activeModule === 'SERVICES' && (
        <GuardServicePanel
          isOnline={isOnline}
          serviceType={services.serviceType}
          onServiceTypeChange={services.setServiceType}
          customServiceName={services.customServiceName}
          onCustomServiceNameChange={services.setCustomServiceName}
          supplierName={services.supplierName}
          onSupplierNameChange={services.setSupplierName}
          vehiclePlates={services.vehiclePlates}
          onVehiclePlatesChange={services.setVehiclePlates}
          destinationType={services.destinationType}
          onDestinationTypeChange={services.setDestinationType}
          destinations={services.destinations}
          onAddDestination={services.addDestination}
          onRemoveDestination={services.removeDestination}
          notes={services.notes}
          onNotesChange={services.setNotes}
          searchQuery={services.searchQuery}
          onSearchQueryChange={services.setSearchQuery}
          searchResults={services.searchResults}
          searchBusy={services.searchBusy}
          activeServices={services.activeServices}
          loadingServices={services.loadingServices}
          selectedActiveServiceId={services.selectedActiveServiceId}
          onSelectActiveService={services.setSelectedActiveServiceId}
          submitting={services.submitting}
          exitingId={services.exitingId}
          message={services.message}
          error={services.error}
          onSubmit={services.handleCreateService}
          onRegisterExit={services.handleRegisterExit}
          onRefreshServices={services.loadActiveServices}
        />
      )}

      {activeModule === 'INCIDENTS' && <GuardIncidentPanel
        isOnline={isOnline}
        type={operations.incidentType}
        onTypeChange={operations.setIncidentType}
        priority={operations.incidentPriority}
        onPriorityChange={operations.setIncidentPriority}
        description={operations.incidentDescription}
        onDescriptionChange={operations.setIncidentDescription}
        propertyAddress={operations.incidentPropertyAddress}
        onPropertyAddressChange={operations.setIncidentPropertyAddress}
        vehiclePlates={operations.incidentVehiclePlates}
        onVehiclePlatesChange={operations.setIncidentVehiclePlates}
        submitting={operations.incidentSubmitting}
        message={operations.incidentMessage}
        error={operations.incidentError}
        onSubmit={operations.reportIncident}
      />}

      {activeModule === 'DELIVERIES' && <GuardDeliveryPanel
        isOnline={isOnline}
        deliveries={deliveries.deliveries}
        filter={deliveries.deliveryFilter}
        onFilterChange={deliveries.setDeliveryFilter}
        recipient={deliveries.deliveryRecipient}
        onRecipientChange={deliveries.setDeliveryRecipient}
        address={deliveries.deliveryAddress}
        onAddressChange={deliveries.handleAddressChange}
        addressSuggestions={deliveries.addressSuggestions}
        addressSearchBusy={deliveries.addressSearchBusy}
        showAddressDropdown={deliveries.showAddressDropdown}
        setShowAddressDropdown={deliveries.setShowAddressDropdown}
        onSelectAddressSuggestion={deliveries.handleSelectAddressSuggestion}
        carrier={deliveries.deliveryCarrier}
        onCarrierChange={deliveries.setDeliveryCarrier}
        trackingCode={deliveries.deliveryTrackingCode}
        onTrackingCodeChange={deliveries.setDeliveryTrackingCode}
        notes={deliveries.deliveryNotes}
        onNotesChange={deliveries.setDeliveryNotes}
        busy={deliveries.deliveryBusy}
        error={deliveries.deliveryError}
        message={deliveries.deliveryMessage}
        collectingId={deliveries.collectingDeliveryId}
        onCollectingIdChange={deliveries.setCollectingDeliveryId}
        collectedByName={deliveries.collectedByName}
        onCollectedByNameChange={deliveries.setCollectedByName}
        onReceive={deliveries.handleReceiveDelivery}
        onCollect={deliveries.handleCollectDelivery}
      />}
      <footer className="guard-footer"><span>DOMMIA GUARD</span><span>Validación en tiempo real</span></footer>
    </section>
  );
}