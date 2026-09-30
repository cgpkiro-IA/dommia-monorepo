'use client';

import { Logo } from '@dommia/ui';
import { Wifi, WifiOff } from 'lucide-react';

export function GuardShellHeader({ isOnline }: { isOnline: boolean }) {
  return (
    <>
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
          <strong>Sin conexión</strong>
          <span>La autorización QR requiere una conexión activa. No se puede confirmar el acceso sin conexión.</span>
        </div>
      )}
    </>
  );
}