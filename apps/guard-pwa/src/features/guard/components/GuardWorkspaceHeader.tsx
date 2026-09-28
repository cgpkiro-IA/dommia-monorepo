'use client';

import { Button } from '@dommia/ui';
import { Camera, LogOut, Package, Siren } from 'lucide-react';
import type { GuardSession } from '../types';

export type GuardModule = 'VISITS' | 'INCIDENTS' | 'DELIVERIES';

interface GuardWorkspaceHeaderProps {
  session: GuardSession;
  tenantCopied: boolean;
  activeModule: GuardModule;
  onCopyTenantId: () => void;
  onLogout: () => void;
  onModuleChange: (module: GuardModule) => void;
}

export function GuardWorkspaceHeader({
  session, tenantCopied, activeModule, onCopyTenantId, onLogout, onModuleChange,
}: GuardWorkspaceHeaderProps) {
  return (
    <>
      <div className="guard-heading">
        <div>
          <p className="eyebrow">PUESTO ACTIVO <span className="heading-divider">/</span> {session.tenantName}</p>
          <button type="button" className="tenant-id-chip" onClick={onCopyTenantId} aria-label={`Copiar IDTENANT ${session.tenantSlug}`}>
            <span>IDTENANT</span><code>{session.tenantSlug}</code><span className="tenant-id-copy-state">{tenantCopied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <h1 id="guard-title">Validar acceso</h1>
          <p className="guard-subtitle">Escanea el código QR del visitante o valida una visita programada sin QR.</p>
        </div>
        <Button variant="dark-outline" size="md" className="logout-button" type="button" onClick={onLogout}>
          <LogOut size={15} aria-hidden="true" />Cerrar sesión
        </Button>
      </div>

      <nav className="guard-module-nav" aria-label="Secciones de Dommia Guard">
        <button type="button" onClick={() => onModuleChange('VISITS')} aria-current={activeModule === 'VISITS' ? 'page' : undefined}>
          <Camera size={18} aria-hidden="true" /><span>Visitas</span>
        </button>
        <button type="button" onClick={() => onModuleChange('INCIDENTS')} aria-current={activeModule === 'INCIDENTS' ? 'page' : undefined}>
          <Siren size={18} aria-hidden="true" /><span>Incidencias</span>
        </button>
        <button type="button" onClick={() => onModuleChange('DELIVERIES')} aria-current={activeModule === 'DELIVERIES' ? 'page' : undefined}>
          <Package size={18} aria-hidden="true" /><span>Paquetería</span>
        </button>
      </nav>
    </>
  );
}