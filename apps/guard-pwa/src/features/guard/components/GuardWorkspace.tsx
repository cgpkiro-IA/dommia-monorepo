'use client';

import { useState } from 'react';
import type { GuardSession } from '../types';
import { useGuardAccess } from '../hooks/useGuardAccess';
import { useGuardDeliveries } from '../hooks/useGuardDeliveries';
import { useGuardLookup } from '../hooks/useGuardLookup';
import { useGuardOperations } from '../hooks/useGuardOperations';
import { GuardAccessResult } from './GuardAccessResult';
import { GuardDeliveryPanel } from './GuardDeliveryPanel';
import { GuardHistoryPanel } from './GuardHistoryPanel';
import { GuardIncidentPanel } from './GuardIncidentPanel';
import { GuardLookupPanel } from './GuardLookupPanel';
import { GuardQrScannerPanel } from './GuardQrScannerPanel';
import { GuardWorkspaceHeader, type GuardModule } from './GuardWorkspaceHeader';
import { ManualVisitPanel } from './ManualVisitPanel';

interface GuardWorkspaceProps {
  session: GuardSession;
  isOnline: boolean;
  onLogout: () => void;
}

export function GuardWorkspace({ session, isOnline, onLogout }: GuardWorkspaceProps) {
  const [activeModule, setActiveModule] = useState<GuardModule>('VISITS');
  const [tenantCopied, setTenantCopied] = useState(false);
  const access = useGuardAccess(session, isOnline);
  const lookup = useGuardLookup(session, isOnline);
  const deliveries = useGuardDeliveries(session, isOnline);
  const operations = useGuardOperations(session, isOnline);

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
    void access.startCamera();
  };

  return (
    <section className="guard-layout" aria-labelledby="guard-title">
      <GuardWorkspaceHeader
        session={session}
        tenantCopied={tenantCopied}
        activeModule={activeModule}
        onCopyTenantId={() => void handleCopyTenantId()}
        onLogout={handleLogout}
        onModuleChange={handleModuleChange}
      />

      {activeModule === 'VISITS' && <>
        <div className="workflow-grid">
          <GuardLookupPanel
            query={lookup.lookupQuery}
            onQueryChange={lookup.setLookupQuery}
            result={lookup.lookupResult}
            busy={lookup.lookupBusy}
            onLookup={() => void lookup.handleLookup()}
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
        {access.result && <GuardAccessResult
          result={access.result}
          isOnline={isOnline}
          manualJustification={access.manualJustification}
          onManualJustificationChange={access.setManualJustification}
          manualOverrideBusy={access.manualOverrideBusy}
          manualOverrideError={access.manualOverrideError}
          onManualOverride={access.handleManualOverride}
          onNext={handleNextVisit}
        />}
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
      </>}

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
        onAddressChange={deliveries.setDeliveryAddress}
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