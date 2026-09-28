'use client';

import { BrowserQRCodeReader } from '@zxing/browser';
import { TenantModule, UserRole } from '@dommia/shared-types';
import { Button, Logo } from '@dommia/ui';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, Check, CircleAlert, CircleHelp, CircleX, Copy, LogOut, Wifi, WifiOff } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SESSION_KEY = 'dommia_guard_session';

type GuardSession = {
  token: string;
  tenantSlug: string;
  tenantName: string;
};

type AccessResult = {
  authorized: boolean;
  manualOverride?: boolean;
  manualOverrideToken?: string;
  justification?: string;
  notificationStatus?: 'SENT_WHATSAPP' | 'SENT_EMAIL' | 'NOT_CONFIGURED' | 'FAILED';
  reason?: string;
  visitorName?: string;
  propertyId?: string;
  propertyAddress?: string;
  hostName?: string;
  requiresManualReview?: boolean;
};

type ResultState = {
  kind: 'authorized' | 'denied' | 'review' | 'error';
  data?: AccessResult;
  message?: string;
};

type GuardLookupItem = {
  id: string;
  propertyId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  propertyAddress?: string;
  isDelinquent?: boolean;
  plates?: string;
  brand?: string;
  model?: string;
  color?: string;
  residentId?: string;
  residentName?: string;
};

type GuardLookupResult = {
  query: string;
  total: number;
  residents: GuardLookupItem[];
  vehicles: GuardLookupItem[];
  checkedBy?: string;
};

type GuardDelivery = {
  id: string;
  recipientName: string;
  propertyAddress: string;
  carrier: string;
  trackingCode?: string;
  notes?: string;
  status: 'PENDING' | 'COLLECTED';
  receivedAt: string;
  collectedByName?: string;
  collectedAt?: string;
};

function hasAccessModule(modules: unknown) {
  if (Array.isArray(modules)) return modules.includes(TenantModule.ACCESS_QR);
  if (modules && typeof modules === 'object') {
    return Object.prototype.hasOwnProperty.call(modules, TenantModule.ACCESS_QR) && Boolean((modules as Record<string, unknown>)[TenantModule.ACCESS_QR]);
  }
  return false;
}

function reasonText(reason?: string) {
  if (!reason) return 'El codigo no esta autorizado.';
  const known: Record<string, string> = {
    PROPERTY_DELINQUENT: 'La propiedad requiere revisión manual antes de permitir el acceso.',
    INVALID_OR_EXPIRED_QR: 'El código QR no es válido o ya venció. Acceso denegado.',
    INVALID_QR: 'El código QR no es válido. Acceso denegado.',
    PASS_NOT_FOUND: 'No se encontró el pase. Acceso denegado.',
    PASS_REVOKED: 'El pase fue revocado. Acceso denegado.',
    PASS_NOT_YET_VALID: 'El pase todavía no está vigente. Acceso denegado.',
    PASS_EXPIRED: 'El pase venció. Acceso denegado.',
    PASS_ALREADY_USED: 'El pase de un solo uso ya fue utilizado. Acceso denegado.',
    QR_ALREADY_USED: 'Este código QR ya fue utilizado. Acceso denegado.',
  };
  return known[reason] || reason.replaceAll('_', ' ').toLowerCase();
}

function notificationText(status?: AccessResult['notificationStatus']) {
  if (status === 'SENT_WHATSAPP') return 'Aviso enviado al anfitrión por WhatsApp.';
  if (status === 'SENT_EMAIL') return 'Aviso enviado al anfitrión por correo.';
  if (status === 'NOT_CONFIGURED') return 'No se notificó al anfitrión porque no hay un canal premium configurado.';
  if (status === 'FAILED') return 'El acceso quedó registrado, pero no se pudo notificar al anfitrión. Informa a administración.';
  return '';
}

function StatusMark({ kind }: { kind: ResultState['kind'] }) {
  const Mark = kind === 'authorized' ? Check : kind === 'review' ? CircleAlert : kind === 'denied' ? CircleX : CircleHelp;
  return <span aria-hidden="true" className={`status-mark status-mark-${kind}`}><Mark size={20} strokeWidth={2} /></span>;
}

export default function GuardPage() {
  const [session, setSession] = useState<GuardSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tenantSlug, setTenantSlug] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('tenant') || '';
  });
  const [tenantCopied, setTenantCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [payload, setPayload] = useState('');
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'scanning'>('idle');
  const [cameraMessage, setCameraMessage] = useState('');
  const [result, setResult] = useState<ResultState | null>(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<GuardLookupResult | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [deliveries, setDeliveries] = useState<GuardDelivery[]>([]);
  const [deliveryFilter, setDeliveryFilter] = useState<'PENDING' | 'COLLECTED'>('PENDING');
  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCarrier, setDeliveryCarrier] = useState('');
  const [deliveryTrackingCode, setDeliveryTrackingCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [collectingDeliveryId, setCollectingDeliveryId] = useState<string | null>(null);
  const [collectedByName, setCollectedByName] = useState('');
  const [validationBusy, setValidationBusy] = useState(false);
  const [manualJustification, setManualJustification] = useState('');
  const [manualOverrideBusy, setManualOverrideBusy] = useState(false);
  const [manualOverrideError, setManualOverrideError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const cameraRequestedRef = useRef(false);
  const inFlightRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    const syncOnline = () => setIsOnline(navigator.onLine);
    syncOnline();
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GuardSession;
        if (parsed.token && parsed.tenantSlug && parsed.tenantName) setSession(parsed);
        else sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setSessionReady(true);
    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  const stopCamera = useCallback(() => {
    cameraRequestedRef.current = false;
    controlsRef.current?.stop();
    controlsRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    setCameraState('idle');
  }, []);

  useEffect(() => () => controlsRef.current?.stop(), []);

  const validatePayload = useCallback(async (rawPayload: string) => {
    const cleanPayload = rawPayload.trim();
    if (!cleanPayload || inFlightRef.current) return;
    if (!navigator.onLine) {
      stopCamera();
      setCameraMessage('Sin conexion. La autorizacion QR requiere una conexion activa.');
      return;
    }
    if (!session) return;

    inFlightRef.current = true;
    autoSubmittedRef.current = true;
    stopCamera();
    setValidationBusy(true);
    setResult(null);
    setCameraMessage('');
    try {
      const response = await fetch(`${API_BASE}/tenants/${encodeURIComponent(session.tenantSlug)}/access/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ payload: cleanPayload }),
      });
      const body = await response.json().catch(() => null);
      const data = body?.data as AccessResult | undefined;
      if (body?.success && data && typeof data.authorized === 'boolean') {
        const isReview = data.reason === 'PROPERTY_DELINQUENT' || data.requiresManualReview === true;
        setResult({ kind: isReview ? 'review' : data.authorized ? 'authorized' : 'denied', data });
      } else {
        const reason = body?.data?.reason || body?.code || body?.message;
        setResult({ kind: 'denied', message: reasonText(typeof reason === 'string' ? reason : undefined) });
      }
    } catch {
      setResult({
        kind: 'error',
        message: 'No se pudo confirmar el codigo. No se autorizo el acceso; verifica la conexion e intenta de nuevo.',
      });
    } finally {
      inFlightRef.current = false;
      setValidationBusy(false);
    }
  }, [session, stopCamera]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !isOnline || validationBusy || inFlightRef.current) return;
    stopCamera();
    setCameraMessage('');
    setCameraState('starting');
    autoSubmittedRef.current = false;
    cameraRequestedRef.current = true;
    const scanner = new BrowserQRCodeReader();
    scannerRef.current = scanner;
    try {
      const controls = await scanner.decodeFromVideoDevice(undefined, videoRef.current, (decoded, _error, scanControls) => {
        if (!decoded || !cameraRequestedRef.current || autoSubmittedRef.current || inFlightRef.current) return;
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
      controlsRef.current = controls;
      setCameraState('scanning');
    } catch {
      cameraRequestedRef.current = false;
      setCameraState('idle');
      setCameraMessage('No se pudo iniciar la camara. Revisa el permiso del navegador o usa la entrada manual.');
    }
  }, [isOnline, stopCamera, validatePayload, validationBusy]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');
    if (!navigator.onLine) {
      setLoginError('Se requiere conexion para iniciar sesion.');
      return;
    }
    setLoginBusy(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, tenantSlug: tenantSlug.trim() }),
      });
      const body = await response.json().catch(() => null);
      const data = body?.data;
      const activeTenant = data?.activeTenant;
      if (!response.ok || !body?.success || activeTenant?.role !== UserRole.GUARD || !hasAccessModule(activeTenant?.modules)) {
        setLoginError('Acceso no disponible. Verifica tus datos y que tu cuenta tenga el rol de guardia con modulo de acceso QR.');
        return;
      }
      if (typeof data?.token !== 'string' || !data.token) {
        setLoginError('La respuesta de inicio de sesion no incluyo una credencial valida.');
        return;
      }
      const nextSession: GuardSession = {
        token: data.token,
        tenantSlug: activeTenant.slug || tenantSlug.trim(),
        tenantName: activeTenant.name || activeTenant.tenantName || activeTenant.slug || tenantSlug.trim(),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setPassword('');
    } catch {
      setLoginError('No se pudo conectar con el servidor. Intenta de nuevo cuando haya conexion.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    autoSubmittedRef.current = true;
    void validatePayload(payload);
  };

  const handleLookup = useCallback(async () => {
    if (!session || !lookupQuery.trim()) {
      setLookupResult(null);
      return;
    }

    setLookupBusy(true);
    try {
      const response = await fetch(`${API_BASE}/tenants/${encodeURIComponent(session.tenantSlug)}/access/lookup?query=${encodeURIComponent(lookupQuery.trim())}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        throw new Error(body?.message || 'No se pudo consultar la base del fraccionamiento.');
      }
      setLookupResult(body.data as GuardLookupResult);
    } catch {
      setLookupResult({ query: lookupQuery.trim(), total: 0, residents: [], vehicles: [] });
    } finally {
      setLookupBusy(false);
    }
  }, [lookupQuery, session]);

  const loadDeliveries = useCallback(async (statusFilter: 'PENDING' | 'COLLECTED' = deliveryFilter) => {
    if (!session) return;
    try {
      const response = await fetch(`${API_BASE}/tenants/${encodeURIComponent(session.tenantSlug)}/guard/deliveries?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.message || 'No se pudo cargar el registro de paquetería.');
      setDeliveries(body.data as GuardDelivery[]);
      setDeliveryError('');
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'No se pudo cargar el registro de paquetería.');
    }
  }, [deliveryFilter, session]);

  useEffect(() => {
    if (session) void loadDeliveries();
  }, [loadDeliveries, session]);

  const handleReceiveDelivery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || deliveryBusy || !isOnline) return;
    setDeliveryBusy(true);
    setDeliveryError('');
    setDeliveryMessage('');
    try {
      const response = await fetch(`${API_BASE}/tenants/${encodeURIComponent(session.tenantSlug)}/guard/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          recipientName: deliveryRecipient.trim(),
          propertyAddress: deliveryAddress.trim(),
          carrier: deliveryCarrier.trim(),
          trackingCode: deliveryTrackingCode.trim() || undefined,
          notes: deliveryNotes.trim() || undefined,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.message || 'No se pudo registrar el paquete.');
      setDeliveryRecipient('');
      setDeliveryAddress('');
      setDeliveryCarrier('');
      setDeliveryTrackingCode('');
      setDeliveryNotes('');
      setDeliveryMessage('Paquete registrado en resguardo.');
      setDeliveryFilter('PENDING');
      await loadDeliveries('PENDING');
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'No se pudo registrar el paquete.');
    } finally {
      setDeliveryBusy(false);
    }
  };

  const handleCollectDelivery = async (event: FormEvent<HTMLFormElement>, deliveryId: string) => {
    event.preventDefault();
    if (!session || !collectedByName.trim() || deliveryBusy || !isOnline) return;
    setDeliveryBusy(true);
    setDeliveryError('');
    setDeliveryMessage('');
    try {
      const response = await fetch(`${API_BASE}/tenants/${encodeURIComponent(session.tenantSlug)}/guard/deliveries/${encodeURIComponent(deliveryId)}/collect`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ collectedByName: collectedByName.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) throw new Error(body?.message || 'No se pudo registrar el retiro.');
      setCollectedByName('');
      setCollectingDeliveryId(null);
      setDeliveryMessage('Retiro registrado.');
      await loadDeliveries();
    } catch (error) {
      setDeliveryError(error instanceof Error ? error.message : 'No se pudo registrar el retiro.');
    } finally {
      setDeliveryBusy(false);
    }
  };

  const handleManualOverride = async (event: FormEvent<HTMLFormElement>) => {
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
      const response = await fetch(`${API_BASE}/tenants/${encodeURIComponent(session.tenantSlug)}/access/manual-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ overrideToken, justification: manualJustification.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success || body.data?.authorized !== true) {
        throw new Error(body?.message || 'No se pudo registrar la excepción. El acceso no fue autorizado.');
      }
      setResult({ kind: 'authorized', data: body.data as AccessResult });
      setManualJustification('');
    } catch (requestError) {
      setManualOverrideError(requestError instanceof Error ? requestError.message : 'No se pudo registrar la excepción. El acceso no fue autorizado.');
    } finally {
      setManualOverrideBusy(false);
    }
  };

  const scanAgain = () => {
    setPayload('');
    setManualJustification('');
    setManualOverrideError('');
    setResult(null);
    setCameraMessage('');
    autoSubmittedRef.current = false;
    void startCamera();
  };

  const logout = () => {
    stopCamera();
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setResult(null);
    setPayload('');
  };

  const copyTenantId = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.tenantSlug);
      setTenantCopied(true);
      window.setTimeout(() => setTenantCopied(false), 1800);
    } catch {
      setTenantCopied(false);
    }
  };

  if (!sessionReady) {
    return <main className="boot-screen" aria-live="polite">Preparando control de acceso...</main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DOMMIA Guard, inicio">
          <Logo size="md" variant="light" showText={false} className="brand-logo" />
          <span><strong>DOMMIA</strong><small>CONTROL DE ACCESO</small></span>
        </a>
        <div className={`connection-pill ${isOnline ? 'is-online' : 'is-offline'}`} role="status">
          {isOnline ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
          <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
        </div>
      </header>

      {!isOnline && (
        <div className="offline-banner" role="alert">
          <strong>Sin conexion</strong>
          <span>La autorización QR requiere una conexión activa. No se puede confirmar el acceso sin conexión.</span>
        </div>
      )}

      {!session ? (
        <section className="login-layout" aria-labelledby="login-title">
          <div className="intro-copy">
            <p className="eyebrow">SEGURIDAD · ACCESO DE VISITAS</p>
            <h1 id="login-title">Un acceso claro.<br /><span>Una decisión segura.</span></h1>
            <p>Inicia sesión para validar credenciales QR en tiempo real dentro de tu comunidad.</p>
            <div className="live-note"><span className="live-ring" aria-hidden="true" /> Validacion conectada al servidor</div>
          </div>
          <form className="login-panel" onSubmit={handleLogin}>
            <div className="panel-heading">
              <span className="panel-index">01 / IDENTIFICACION</span>
              <h2>Acceso de guardia</h2>
              <p>Usa las credenciales asignadas por tu administración.</p>
            </div>
            <label htmlFor="tenantSlug">IDTENANT de tu comunidad</label>
            <input id="tenantSlug" name="tenantSlug" autoComplete="organization" aria-describedby="guard-tenant-help" required value={tenantSlug} onChange={(event) => setTenantSlug(event.target.value)} placeholder="Ej. bosques" />
            <p id="guard-tenant-help" className="field-help">Es el código corto del fraccionamiento, no el UUID interno. Puedes abrir Guard con <code>?tenant=bosques</code> para precargarlo.</p>
            <label htmlFor="email">Correo electronico</label>
            <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="guardia@comunidad.mx" />
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contrasena" />
            {loginError && <p className="form-error" role="alert">{loginError}</p>}
            <Button variant="primary" size="md" className="login-button" type="submit" disabled={!isOnline} isLoading={loginBusy}>
              {loginBusy ? 'Verificando...' : 'Iniciar sesión'} <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <p className="form-footnote">Tu sesión se conserva únicamente mientras esta ventana permanece abierta.</p>
          </form>
        </section>
      ) : (
        <section className="guard-layout" aria-labelledby="guard-title">
          <div className="guard-heading">
            <div>
              <p className="eyebrow">PUESTO ACTIVO <span className="heading-divider">/</span> {session.tenantName}</p>
              <button type="button" className="tenant-id-chip" onClick={() => void copyTenantId()} aria-label={`Copiar IDTENANT ${session.tenantSlug}`}>
                <span>IDTENANT</span><code>{session.tenantSlug}</code><span className="tenant-id-copy-state">{tenantCopied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <h1 id="guard-title">Validar acceso</h1>
              <p className="guard-subtitle">Escanea el código QR del visitante o ingresa el contenido manualmente.</p>
            </div>
            <Button variant="dark-outline" size="md" className="logout-button" type="button" onClick={logout}>
              <LogOut size={15} aria-hidden="true" />Cerrar sesión
            </Button>
          </div>

          <div className="workflow-grid">
            <section className="lookup-panel" aria-labelledby="lookup-title">
              <div className="panel-heading">
                <span className="panel-index">00 / CONSULTA RÁPIDA</span>
                <h2 id="lookup-title">Buscar residente o placas</h2>
              </div>
              <div className="lookup-controls">
                <input
                  value={lookupQuery}
                  onChange={(event) => setLookupQuery(event.target.value)}
                  placeholder="Nombre, correo, teléfono o placas"
                  aria-label="Buscar residente o placas"
                  disabled={!isOnline}
                />
                <Button variant="primary" size="md" type="button" className="lookup-control-button" onClick={() => void handleLookup()} disabled={!isOnline || lookupBusy || !lookupQuery.trim()} isLoading={lookupBusy}>
                  {lookupBusy ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>

              {lookupResult && (
                <div className="lookup-results" aria-live="polite">
                  {lookupResult.total === 0 ? (
                    <p className="empty-state">No se encontraron coincidencias para “{lookupResult.query}”.</p>
                  ) : (
                    <>
                      {lookupResult.residents.length > 0 && (
                        <div className="lookup-group">
                          <h3>Residentes</h3>
                          {lookupResult.residents.map((resident) => (
                            <article key={resident.id} className="lookup-card">
                              <div className="lookup-meta-row">
                                <strong>{resident.fullName || `${resident.firstName || ''} ${resident.lastName || ''}`.trim()}</strong>
                                {resident.isDelinquent ? <span className="status-badge bad">Moroso</span> : <span className="status-badge ok">Activo</span>}
                              </div>
                              <p>{resident.propertyAddress || 'Dirección no disponible'}</p>
                              <small>{resident.email || resident.phone || 'Sin contacto principal'}</small>
                            </article>
                          ))}
                        </div>
                      )}

                      {lookupResult.vehicles.length > 0 && (
                        <div className="lookup-group">
                          <h3>Vehículos</h3>
                          {lookupResult.vehicles.map((vehicle) => (
                            <article key={vehicle.id} className="lookup-card">
                              <div className="lookup-meta-row">
                                <strong>{vehicle.plates}</strong>
                                {vehicle.isDelinquent ? <span className="status-badge bad">Propiedad morosa</span> : <span className="status-badge ok">Vigente</span>}
                              </div>
                              <p>{vehicle.propertyAddress || 'Dirección no disponible'}</p>
                              <small>{vehicle.residentName || 'Sin residente asociado'} · {vehicle.brand || 'Marca'} {vehicle.model || ''} {vehicle.color ? `· ${vehicle.color}` : ''}</small>
                            </article>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

            <section className="scan-panel" aria-labelledby="camera-title">
              <div className="panel-heading scan-panel-heading">
                <div><span className="panel-index">01 / ESCANEO</span><h2 id="camera-title">Lector QR</h2></div>
                <span className={`scan-state ${cameraState === 'scanning' ? 'scan-state-active' : ''}`}><span />{cameraState === 'scanning' ? 'Buscando código' : 'Cámara detenida'}</span>
              </div>
              <div className={`camera-frame ${cameraState === 'scanning' ? 'camera-frame-active' : ''}`}>
                <video ref={videoRef} className="camera-video" muted playsInline aria-label="Vista de la camara para escanear un codigo QR" />
                {cameraState !== 'scanning' && (
                  <div className="camera-placeholder">
                    <div className="camera-glyph" aria-hidden="true"><span /></div>
                    <strong>{cameraState === 'starting' ? 'Iniciando cámara...' : 'Cámara lista'}</strong>
                    <span>{isOnline ? 'Activa la cámara para leer un QR' : 'Conéctate para validar un QR'}</span>
                  </div>
                )}
                <span className="viewfinder viewfinder-tl" aria-hidden="true" />
                <span className="viewfinder viewfinder-tr" aria-hidden="true" />
                <span className="viewfinder viewfinder-bl" aria-hidden="true" />
                <span className="viewfinder viewfinder-br" aria-hidden="true" />
              </div>
              {cameraMessage && <p className="inline-message" role="status">{cameraMessage}</p>}
              <Button variant="primary" size="md" className="camera-button" type="button" onClick={() => void startCamera()} disabled={!isOnline || cameraState !== 'idle' || validationBusy || Boolean(result)}>
                {cameraState === 'starting' ? 'Iniciando...' : cameraState === 'scanning' ? 'Cámara activa' : 'Iniciar cámara'}
                <Camera size={16} aria-hidden="true" />
              </Button>
            </section>

            <section className="manual-panel" aria-labelledby="manual-title">
              <div className="panel-heading">
                <span className="panel-index">02 / ALTERNATIVA</span>
                <h2 id="manual-title">Entrada manual</h2>
                <p>Pega el contenido completo del QR si no puedes usar la cámara.</p>
              </div>
              <form onSubmit={handleManualSubmit}>
                <label htmlFor="qr-payload">Contenido del código QR</label>
                <textarea id="qr-payload" name="payload" rows={5} value={payload} onChange={(event) => setPayload(event.target.value)} placeholder="Pega aquí el contenido del código..." required disabled={!isOnline || validationBusy || Boolean(result)} />
                <Button variant="dark-outline" size="md" className="secondary-button" type="submit" disabled={!isOnline || validationBusy || Boolean(result) || !payload.trim()} isLoading={validationBusy}>
                  {validationBusy ? 'Validando...' : 'Validar código'} <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </form>
              <p className="secure-note"><span aria-hidden="true">●</span> Cada codigo se valida en linea y una sola vez.</p>
            </section>
          </div>

          <section className="delivery-section" aria-labelledby="delivery-title">
            <div className="delivery-heading">
              <div className="panel-heading">
                <span className="panel-index">03 / RESGUARDO</span>
                <h2 id="delivery-title">Paquetería</h2>
                <p>Registra cada paquete recibido y confirma su retiro con el nombre de quien lo recoge.</p>
              </div>
              <div className="delivery-tabs" role="group" aria-label="Filtrar paquetes">
                <button type="button" aria-pressed={deliveryFilter === 'PENDING'} onClick={() => setDeliveryFilter('PENDING')}>Pendientes</button>
                <button type="button" aria-pressed={deliveryFilter === 'COLLECTED'} onClick={() => setDeliveryFilter('COLLECTED')}>Entregados</button>
              </div>
            </div>

            <div className="delivery-grid">
              <form className="delivery-form" onSubmit={handleReceiveDelivery}>
                <h3>Recibir paquete</h3>
                <label htmlFor="delivery-recipient">Residente destinatario</label>
                <input id="delivery-recipient" value={deliveryRecipient} onChange={(event) => setDeliveryRecipient(event.target.value)} required maxLength={150} disabled={!isOnline || deliveryBusy} />
                <label htmlFor="delivery-address">Domicilio / unidad</label>
                <input id="delivery-address" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} required maxLength={200} placeholder="Calle y número, privada o lote" disabled={!isOnline || deliveryBusy} />
                <div className="delivery-form-row">
                  <div>
                    <label htmlFor="delivery-carrier">Paquetería</label>
                    <input id="delivery-carrier" value={deliveryCarrier} onChange={(event) => setDeliveryCarrier(event.target.value)} required maxLength={100} placeholder="Ej. DHL" disabled={!isOnline || deliveryBusy} />
                  </div>
                  <div>
                    <label htmlFor="delivery-tracking">Guía (opcional)</label>
                    <input id="delivery-tracking" value={deliveryTrackingCode} onChange={(event) => setDeliveryTrackingCode(event.target.value)} maxLength={100} disabled={!isOnline || deliveryBusy} />
                  </div>
                </div>
                <label htmlFor="delivery-notes">Observaciones (opcional)</label>
                <textarea id="delivery-notes" rows={2} value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} maxLength={500} disabled={!isOnline || deliveryBusy} />
                <Button variant="primary" size="md" type="submit" disabled={!isOnline || deliveryBusy} isLoading={deliveryBusy}>Registrar en resguardo</Button>
              </form>

              <div className="delivery-list" aria-live="polite">
                {deliveryError && <p className="form-error" role="alert">{deliveryError}</p>}
                {deliveryMessage && <p className="delivery-success" role="status">{deliveryMessage}</p>}
                {deliveries.length === 0 ? (
                  <p className="empty-state">{deliveryFilter === 'PENDING' ? 'No hay paquetes pendientes de retiro.' : 'Aún no hay paquetes entregados.'}</p>
                ) : deliveries.map((delivery) => (
                  <article key={delivery.id} className="delivery-card">
                    <div className="delivery-card-heading">
                      <div><strong>{delivery.recipientName}</strong><span>{delivery.propertyAddress}</span></div>
                      <span className={`status-badge ${delivery.status === 'PENDING' ? 'pending' : 'ok'}`}>{delivery.status === 'PENDING' ? 'En resguardo' : 'Entregado'}</span>
                    </div>
                    <p>{delivery.carrier}{delivery.trackingCode ? ` · Guía ${delivery.trackingCode}` : ''}</p>
                    {delivery.notes && <small>{delivery.notes}</small>}
                    {delivery.status === 'PENDING' && collectingDeliveryId === delivery.id ? (
                      <form className="collect-form" onSubmit={(event) => void handleCollectDelivery(event, delivery.id)}>
                        <label htmlFor={`collected-by-${delivery.id}`}>Nombre de quien retira</label>
                        <input id={`collected-by-${delivery.id}`} value={collectedByName} onChange={(event) => setCollectedByName(event.target.value)} required maxLength={150} disabled={!isOnline || deliveryBusy} />
                        <div>
                          <Button variant="primary" size="sm" type="submit" disabled={!isOnline || deliveryBusy || !collectedByName.trim()} isLoading={deliveryBusy}>Confirmar retiro</Button>
                          <Button variant="dark-outline" size="sm" type="button" onClick={() => { setCollectingDeliveryId(null); setCollectedByName(''); }}>Cancelar</Button>
                        </div>
                      </form>
                    ) : delivery.status === 'PENDING' ? (
                      <Button variant="dark-outline" size="sm" type="button" onClick={() => setCollectingDeliveryId(delivery.id)} disabled={!isOnline || deliveryBusy}>Registrar retiro</Button>
                    ) : (
                      <small>Retiró {delivery.collectedByName || 'No indicado'} · {delivery.collectedAt ? new Date(delivery.collectedAt).toLocaleString('es-MX') : ''}</small>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>

          {validationBusy && <div className="validation-progress" role="status"><span className="progress-pulse" /> Consultando autorizacion con la comunidad...</div>}

          {result && (
            <section className={`result-panel result-${result.kind}`} aria-live="assertive" aria-labelledby="result-title">
              <div className="result-summary">
                <StatusMark kind={result.kind} />
                <div>
                  <p className="panel-index">RESULTADO DE VALIDACION</p>
                  <h2 id="result-title">{result.kind === 'authorized' ? 'Acceso autorizado' : result.kind === 'review' ? 'Revisión manual requerida' : result.kind === 'denied' ? 'Acceso denegado' : 'No se pudo confirmar'}</h2>
                  <p>{result.kind === 'review' ? reasonText(result.data?.reason || 'PROPERTY_DELINQUENT') : result.kind === 'authorized' ? result.data?.manualOverride ? 'Acceso autorizado por excepción con justificación registrada.' : 'La credencial es válida para esta visita.' : result.message || reasonText(result.data?.reason)}</p>
                  {result.kind === 'authorized' && result.data?.notificationStatus && <p className={`notification-note notification-${result.data.notificationStatus}`} role="status">{notificationText(result.data.notificationStatus)}</p>}
                </div>
              </div>
              {result.data && (
                <dl className="result-details">
                  {result.data.visitorName && <div><dt>Visitante / residente</dt><dd>{result.data.visitorName}</dd></div>}
                  {result.data.propertyAddress && <div><dt>Propiedad</dt><dd>{result.data.propertyAddress}</dd></div>}
                  {!result.data.propertyAddress && result.data.propertyId && <div><dt>Propiedad</dt><dd>{result.data.propertyId}</dd></div>}
                  {result.data.hostName && <div><dt>Anfitrión</dt><dd>{result.data.hostName}</dd></div>}
                  {result.data.justification && <div><dt>Justificación registrada</dt><dd>{result.data.justification}</dd></div>}
                  {result.kind === 'denied' && result.data.reason && <div><dt>Motivo</dt><dd>{reasonText(result.data.reason)}</dd></div>}
                </dl>
              )}
              {result.kind === 'review' && result.data?.manualOverrideToken && (
                <form className="manual-override-form" onSubmit={handleManualOverride}>
                  <div>
                    <h3>Excepción por contingencia</h3>
                    <p>La propiedad tiene adeudo. Registra por qué se autoriza esta visita; el pase debe seguir vigente y el evento quedará auditado.</p>
                  </div>
                  <label htmlFor="manual-override-justification">Justificación obligatoria</label>
                  <textarea
                    id="manual-override-justification"
                    minLength={20}
                    maxLength={500}
                    required
                    value={manualJustification}
                    onChange={(event) => setManualJustification(event.target.value)}
                    placeholder="Ej. ingreso de servicio médico solicitado por el anfitrión..."
                    disabled={manualOverrideBusy || !isOnline}
                  />
                  {manualOverrideError && <p className="form-error" role="alert">{manualOverrideError}</p>}
                  <Button variant="primary" size="md" type="submit" disabled={manualOverrideBusy || !isOnline || manualJustification.trim().length < 20} isLoading={manualOverrideBusy}>
                    Autorizar y registrar excepción <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                </form>
              )}
              <Button variant="primary" size="md" className="next-scan-button" type="button" onClick={scanAgain} disabled={!isOnline}>
                Escanear siguiente QR <Camera size={16} aria-hidden="true" />
              </Button>
            </section>
          )}
          <footer className="guard-footer"><span>DOMMIA GUARD</span><span>Validacion en tiempo real</span></footer>
        </section>
      )}
    </main>
  );
}