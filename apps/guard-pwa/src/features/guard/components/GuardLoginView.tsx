'use client';

import type { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Logo } from '@dommia/ui';

interface GuardLoginViewProps {
  tenantSlug: string;
  onTenantSlugChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  isOnline: boolean;
  busy: boolean;
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function GuardLoginView({
  tenantSlug, onTenantSlugChange, email, onEmailChange, password, onPasswordChange,
  isOnline, busy, error, onSubmit,
}: GuardLoginViewProps) {
  return (
    <section className="login-layout" aria-labelledby="login-title">
      <div className="intro-copy">
        <p className="eyebrow">SEGURIDAD · ACCESO DE VISITAS</p>
        <h1 id="login-title">Un acceso claro.<br /><span>Una decisión segura.</span></h1>
        <p>Inicia sesión para validar credenciales QR en tiempo real dentro de tu comunidad.</p>
        <div className="live-note"><span className="live-ring" aria-hidden="true" /> Validación conectada al servidor</div>
      </div>
      <form className="login-panel" onSubmit={onSubmit}>
        <div className="panel-heading">
          <span className="panel-index">01 / IDENTIFICACIÓN</span>
          <h2>Acceso de guardia</h2>
          <p>Usa las credenciales asignadas por tu administración.</p>
        </div>
        <label htmlFor="tenantSlug">ID de tu Fraccionamiento / Caseta</label>
        <input id="tenantSlug" name="tenantSlug" autoComplete="organization" aria-describedby="guard-tenant-help" required value={tenantSlug} onChange={(event) => onTenantSlugChange(event.target.value)} placeholder="Ej. bosques" />
        <p id="guard-tenant-help" className="field-help">Ingresa el ID asignado a tu fraccionamiento (ej. <code>bosques</code>).</p>
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="guardia@comunidad.mx" />
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Tu contraseña" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button variant="primary" size="md" className="login-button" type="submit" disabled={!isOnline} isLoading={busy}>
          {busy ? 'Verificando...' : 'Iniciar sesión'} <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <p className="form-footnote">Tu sesión se conserva únicamente mientras esta ventana permanece abierta.</p>
      </form>
    </section>
  );
}