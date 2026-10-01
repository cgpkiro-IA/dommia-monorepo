'use client';

import { BrowserQRCodeReader } from '@zxing/browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { guardApiRequest } from '../guard-api';
import type { AccessResult, GuardSession, ManualVisitCandidate, ManualVisitPropertySuggestion, ResultState } from '../types';

export function useGuardAccess(session: GuardSession | null, isOnline: boolean) {
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'scanning'>('idle');
  const [cameraMessage, setCameraMessage] = useState('');
  const [result, setResult] = useState<ResultState | null>(null);
  const [validationBusy, setValidationBusy] = useState(false);
  const [manualJustification, setManualJustification] = useState('');
  const [manualOverrideBusy, setManualOverrideBusy] = useState(false);
  const [manualOverrideError, setManualOverrideError] = useState('');
  const [manualVisitQuery, setManualVisitQuery] = useState('');
  const [manualVisitPropertySuggestions, setManualVisitPropertySuggestions] = useState<ManualVisitPropertySuggestion[]>([]);
  const [manualVisitSuggestionsBusy, setManualVisitSuggestionsBusy] = useState(false);
  const [manualVisitSuggestionsResolved, setManualVisitSuggestionsResolved] = useState(false);
  const [manualVisitSuggestionsError, setManualVisitSuggestionsError] = useState('');
  const [manualVisitCandidates, setManualVisitCandidates] = useState<ManualVisitCandidate[]>([]);
  const [selectedManualVisit, setSelectedManualVisit] = useState<ManualVisitCandidate | null>(null);
  const [manualVisitBusy, setManualVisitBusy] = useState(false);
  const [manualVisitError, setManualVisitError] = useState('');
  const [manualVisitMessage, setManualVisitMessage] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);
  const [callConfirmed, setCallConfirmed] = useState(false);
  const [manualVisitAuthorizationBusy, setManualVisitAuthorizationBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const cameraRequestedRef = useRef(false);
  const cameraTimeoutRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const manualVisitSuggestionRequestRef = useRef(0);

  useEffect(() => {
    const normalized = manualVisitQuery.trim();
    const requestId = ++manualVisitSuggestionRequestRef.current;
    if (!session || !isOnline || normalized.length < 2) {
      setManualVisitPropertySuggestions([]);
      setManualVisitSuggestionsBusy(false);
      setManualVisitSuggestionsResolved(false);
      setManualVisitSuggestionsError('');
      return;
    }

    setManualVisitSuggestionsResolved(false);
    setManualVisitSuggestionsError('');
    const timeoutId = window.setTimeout(async () => {
      setManualVisitSuggestionsBusy(true);
      try {
        const data = await guardApiRequest<{ suggestions: ManualVisitPropertySuggestion[] }>(
          `/tenants/${encodeURIComponent(session.tenantSlug)}/access/manual-visits/properties?query=${encodeURIComponent(normalized)}`,
          session.token,
        );
        if (manualVisitSuggestionRequestRef.current === requestId) {
          setManualVisitPropertySuggestions(data.suggestions || []);
          setManualVisitSuggestionsResolved(true);
        }
      } catch (error) {
        if (manualVisitSuggestionRequestRef.current === requestId) {
          setManualVisitPropertySuggestions([]);
          setManualVisitSuggestionsError(error instanceof Error ? error.message : 'No se pudieron consultar los domicilios.');
          setManualVisitSuggestionsResolved(true);
        }
      } finally {
        if (manualVisitSuggestionRequestRef.current === requestId) setManualVisitSuggestionsBusy(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      manualVisitSuggestionRequestRef.current += 1;
    };
  }, [isOnline, manualVisitQuery, session]);

  const stopCamera = useCallback(() => {
    cameraRequestedRef.current = false;
    if (cameraTimeoutRef.current !== null) {
      window.clearTimeout(cameraTimeoutRef.current);
      cameraTimeoutRef.current = null;
    }
    controlsRef.current?.stop();
    controlsRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  }, []);

  useEffect(() => () => {
    cameraRequestedRef.current = false;
    if (cameraTimeoutRef.current !== null) window.clearTimeout(cameraTimeoutRef.current);
    controlsRef.current?.stop();
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const validatePayload = useCallback(async (rawPayload: string) => {
    const cleanPayload = rawPayload.trim();
    if (!cleanPayload || inFlightRef.current) return;
    if (!navigator.onLine) {
      stopCamera();
      setCameraMessage('Sin conexión. La autorización QR requiere una conexión activa.');
      return;
    }
    if (!session) return;

    inFlightRef.current = true;
    autoSubmittedRef.current = true;
    stopCamera();
    setValidationBusy(true);
    setResult(null);
    setCameraMessage('Código QR detectado. Validando autorización...');
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), 10_000);
    try {
      const data = await guardApiRequest<AccessResult>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/validate`,
        session.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: cleanPayload }),
          signal: abortController.signal,
        },
      );
      if (data && typeof data.authorized === 'boolean') {
        const isReview = data.reason === 'PROPERTY_DELINQUENT' || data.requiresManualReview === true;
        setResult({ kind: isReview ? 'review' : data.authorized ? 'authorized' : 'denied', data });
      } else {
        setResult({ kind: 'denied', message: 'La respuesta de validación no es válida.' });
      }
    } catch {
      setResult({
        kind: 'error',
        message: abortController.signal.aborted
          ? 'La validación tardó más de 10 segundos. No se autorizó el acceso; verifica la conexión e intenta de nuevo.'
          : 'No se pudo confirmar el código. No se autorizó el acceso; verifica la conexión e intenta de nuevo.',
      });
    } finally {
      window.clearTimeout(timeoutId);
      inFlightRef.current = false;
      setValidationBusy(false);
      setCameraMessage('');
    }
  }, [session, stopCamera]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !isOnline || validationBusy || inFlightRef.current) return;
    stopCamera();
    setResult(null);
    setCameraMessage('');
    setCameraState('starting');
    autoSubmittedRef.current = false;
    cameraRequestedRef.current = true;
    const startupTimeout = window.setTimeout(() => {
      if (!cameraRequestedRef.current || inFlightRef.current) return;
      stopCamera();
      setCameraMessage('La cámara tardó más de 12 segundos en iniciar. Revisa el permiso del navegador e intenta de nuevo.');
    }, 12_000);
    cameraTimeoutRef.current = startupTimeout;
    const scanner = new BrowserQRCodeReader();
    try {
      const controls = await scanner.decodeFromVideoDevice(undefined, videoRef.current, (decoded, _error, scanControls) => {
        if (!decoded || !cameraRequestedRef.current || autoSubmittedRef.current || inFlightRef.current) return;
        window.clearTimeout(startupTimeout);
        if (cameraTimeoutRef.current === startupTimeout) cameraTimeoutRef.current = null;
        autoSubmittedRef.current = true;
        cameraRequestedRef.current = false;
        scanControls.stop();
        controlsRef.current = scanControls;
        void validatePayload(decoded.getText());
      });
      if (!cameraRequestedRef.current || autoSubmittedRef.current || inFlightRef.current) {
        controls.stop();
        return;
      }
      window.clearTimeout(startupTimeout);
      if (cameraTimeoutRef.current === startupTimeout) {
        cameraTimeoutRef.current = window.setTimeout(() => {
          if (!cameraRequestedRef.current || inFlightRef.current) return;
          stopCamera();
          setCameraMessage('No se detectó un código QR en 30 segundos. Colócalo dentro del marco o inicia la cámara de nuevo.');
        }, 30_000);
      }
      controlsRef.current = controls;
      setCameraState('scanning');
    } catch {
      window.clearTimeout(startupTimeout);
      if (cameraTimeoutRef.current === startupTimeout) cameraTimeoutRef.current = null;
      cameraRequestedRef.current = false;
      setCameraState('idle');
      setCameraMessage('No se pudo iniciar la cámara. Revisa el permiso del navegador o usa la entrada manual.');
    }
  }, [isOnline, stopCamera, validatePayload, validationBusy]);

  const stopScanning = useCallback(() => {
    stopCamera();
    setCameraMessage('Escaneo detenido. Puedes volver a iniciar la cámara cuando estés listo.');
  }, [stopCamera]);

  const searchManualVisits = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !isOnline || manualVisitBusy || manualVisitQuery.trim().length < 2) return;
    manualVisitSuggestionRequestRef.current += 1;
    setManualVisitPropertySuggestions([]);
    setManualVisitSuggestionsBusy(false);
    setManualVisitSuggestionsResolved(false);
    setManualVisitSuggestionsError('');
    setManualVisitBusy(true);
    setManualVisitError('');
    setManualVisitMessage('');
    setSelectedManualVisit(null);
    setIdentityVerified(false);
    setCallConfirmed(false);
    try {
      const data = await guardApiRequest<{ candidates: ManualVisitCandidate[] }>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/manual-visits?query=${encodeURIComponent(manualVisitQuery.trim())}`,
        session.token,
      );
      const candidates = data.candidates || [];
      setManualVisitCandidates(candidates);
      if (candidates.length === 0) setManualVisitMessage('No hay visitas programadas activas para ese domicilio o nombre. No se puede autorizar sin un pase vigente.');
    } catch (error) {
      setManualVisitError(error instanceof Error ? error.message : 'No se pudieron buscar visitas programadas.');
    } finally {
      setManualVisitBusy(false);
    }
  }, [isOnline, manualVisitBusy, manualVisitQuery, session]);

  const selectManualVisit = useCallback((candidate: ManualVisitCandidate) => {
    setSelectedManualVisit(candidate);
    setIdentityVerified(false);
    setCallConfirmed(false);
    setManualVisitError('');
    setManualVisitMessage('');
  }, []);

  const updateManualVisitQuery = useCallback((query: string) => {
    manualVisitSuggestionRequestRef.current += 1;
    setManualVisitQuery(query);
    setManualVisitPropertySuggestions([]);
    setManualVisitSuggestionsBusy(false);
    setManualVisitSuggestionsResolved(false);
    setManualVisitSuggestionsError('');
    setManualVisitCandidates([]);
    setSelectedManualVisit(null);
    setIdentityVerified(false);
    setCallConfirmed(false);
    setManualVisitError('');
    setManualVisitMessage('');
  }, []);

  const selectManualVisitPropertySuggestion = useCallback((suggestion: ManualVisitPropertySuggestion) => {
    updateManualVisitQuery(suggestion.propertyAddress);
  }, [updateManualVisitQuery]);

  const authorizeManualVisit = useCallback(async () => {
    if (!session || !selectedManualVisit || !isOnline || manualVisitAuthorizationBusy) return;
    if (!selectedManualVisit.isCurrentlyValid || !identityVerified || !callConfirmed) return;
    setManualVisitAuthorizationBusy(true);
    setManualVisitError('');
    setManualVisitMessage('');
    try {
      const data = await guardApiRequest<AccessResult>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/manual-visits/${encodeURIComponent(selectedManualVisit.invitationId)}/authorize`,
        session.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identityVerified, callConfirmed }),
        },
      );
      setResult({ kind: 'authorized', data });
      setManualVisitMessage('Acceso manual autorizado por llamada y registrado en la bitácora.');
    } catch (error) {
      setManualVisitError(error instanceof Error ? error.message : 'No se pudo registrar la autorización manual.');
    } finally {
      setManualVisitAuthorizationBusy(false);
    }
  }, [callConfirmed, identityVerified, isOnline, manualVisitAuthorizationBusy, selectedManualVisit, session]);

  const handleManualOverride = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const overrideToken = result?.kind === 'review' ? result.data?.manualOverrideToken : undefined;
    if (!overrideToken || !session || manualOverrideBusy) return;
    if (!navigator.onLine) {
      setManualOverrideError('La excepción requiere conexión. No se autorizó el acceso.');
      return;
    }
    setManualOverrideBusy(true);
    setManualOverrideError('');
    try {
      const data = await guardApiRequest<AccessResult>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/manual-override`,
        session.token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overrideToken, justification: manualJustification.trim() }),
        },
      );
      if (data.authorized !== true) throw new Error('No se pudo registrar la excepción. El acceso no fue autorizado.');
      setResult({ kind: 'authorized', data });
      setManualJustification('');
    } catch (error) {
      setManualOverrideError(error instanceof Error ? error.message : 'No se pudo registrar la excepción. El acceso no fue autorizado.');
    } finally {
      setManualOverrideBusy(false);
    }
  }, [manualJustification, manualOverrideBusy, result, session]);

  const resetAfterResult = useCallback(() => {
    stopCamera();
    setManualVisitQuery('');
    setManualVisitPropertySuggestions([]);
    setManualVisitCandidates([]);
    setSelectedManualVisit(null);
    setManualVisitError('');
    setManualVisitMessage('');
    setIdentityVerified(false);
    setCallConfirmed(false);
    setManualJustification('');
    setManualOverrideError('');
    setResult(null);
    setCameraMessage('');
    autoSubmittedRef.current = false;
  }, [stopCamera]);

  const resetSession = useCallback(() => {
    stopCamera();
    setResult(null);
    setManualVisitQuery('');
    setManualVisitPropertySuggestions([]);
    setManualVisitCandidates([]);
    setSelectedManualVisit(null);
    setIdentityVerified(false);
    setCallConfirmed(false);
  }, [stopCamera]);

  return {
    cameraState,
    cameraMessage,
    videoRef,
    result,
    validationBusy,
    manualJustification,
    setManualJustification,
    manualOverrideBusy,
    manualOverrideError,
    manualVisitQuery,
    setManualVisitQuery: updateManualVisitQuery,
    manualVisitPropertySuggestions,
    manualVisitSuggestionsBusy,
    manualVisitSuggestionsResolved,
    manualVisitSuggestionsError,
    selectManualVisitPropertySuggestion,
    manualVisitCandidates,
    selectedManualVisit,
    manualVisitBusy,
    manualVisitError,
    manualVisitMessage,
    identityVerified,
    setIdentityVerified,
    callConfirmed,
    setCallConfirmed,
    manualVisitAuthorizationBusy,
    startCamera,
    stopScanning,
    validatePayload,
    searchManualVisits,
    selectManualVisit,
    authorizeManualVisit,
    handleManualOverride,
    resetAfterResult,
    resetSession,
  };
}