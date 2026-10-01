'use client';

import { Button } from '@dommia/ui';
import { Bike, Camera, LogOut, Package, Siren, ClipboardList, AlertOctagon } from 'lucide-react';
import type { GuardSession } from '../types';

export type GuardModule = 'VISITS' | 'CONSIGNS' | 'INCIDENTS' | 'DELIVERIES';

interface GuardWorkspaceHeaderProps {
  session: GuardSession;
  tenantCopied: boolean;
  activeModule: GuardModule;
  unreadConsignsCount?: number;
  openIncidentsCount?: number;
  onCopyTenantId: () => void;
  onLogout: () => void;
  onModuleChange: (module: GuardModule) => void;
  onOpenPanic: () => void;
}

export function GuardWorkspaceHeader({
  session,
  tenantCopied,
  activeModule,
  unreadConsignsCount = 0,
  openIncidentsCount = 0,
  onCopyTenantId,
  onLogout,
  onModuleChange,
  onOpenPanic,
}: GuardWorkspaceHeaderProps) {
  const hasConsignsAlert = unreadConsignsCount > 0;
  const hasIncidentsAlert = openIncidentsCount > 0;

  return (
    <>
      <div className="guard-heading">
        <div>
          <p className="eyebrow">PUESTO ACTIVO <span className="heading-divider">/</span> {session.tenantName}</p>
          <button type="button" className="tenant-id-chip" onClick={onCopyTenantId} aria-label={`Copiar IDTENANT ${session.tenantSlug}`}>
            <span>IDTENANT</span><code>{session.tenantSlug}</code><span className="tenant-id-copy-state">{tenantCopied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <h1 id="guard-title">Control de Acceso y Caseta</h1>
          <p className="guard-subtitle">Valida pases QR, autoriza visitas y gestiona servicios de comida, gas, agua y paquetería.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPanic}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg shadow-rose-900/50 flex items-center gap-2 cursor-pointer transition-all border border-rose-500 animate-pulse"
          >
            <AlertOctagon size={18} aria-hidden="true" />
            <span>🚨 PÁNICO</span>
          </button>

          <Button variant="dark-outline" size="md" className="logout-button" type="button" onClick={onLogout}>
            <LogOut size={15} aria-hidden="true" />Cerrar sesión
          </Button>
        </div>
      </div>

      <nav className="guard-module-nav" aria-label="Secciones de Dommia Guard">
        <button
          type="button"
          onClick={() => onModuleChange('VISITS')}
          aria-current={activeModule === 'VISITS' ? 'page' : undefined}
          className="relative"
        >
          <Camera size={18} aria-hidden="true" />
          <span>Visitas / Accesos</span>
        </button>

        <button
          type="button"
          onClick={() => onModuleChange('CONSIGNS')}
          aria-current={activeModule === 'CONSIGNS' ? 'page' : undefined}
          className={`relative ${hasConsignsAlert && activeModule !== 'CONSIGNS' ? 'text-amber-300 font-extrabold ring-1 ring-amber-500/50 bg-amber-500/10 rounded-t-lg animate-pulse' : ''}`}
        >
          <ClipboardList size={18} aria-hidden="true" className={hasConsignsAlert ? 'text-amber-400' : ''} />
          <span>Consignas</span>
          {hasConsignsAlert && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-900/50 animate-bounce">
              {`${unreadConsignsCount} nueva${unreadConsignsCount > 1 ? 's' : ''}`}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onModuleChange('INCIDENTS')}
          aria-current={activeModule === 'INCIDENTS' ? 'page' : undefined}
          className={`relative ${hasIncidentsAlert && activeModule !== 'INCIDENTS' ? 'text-rose-300 font-extrabold ring-1 ring-rose-500/50 bg-rose-500/10 rounded-t-lg animate-pulse' : ''}`}
        >
          <Siren size={18} aria-hidden="true" className={hasIncidentsAlert ? 'text-rose-400' : ''} />
          <span>Incidencias</span>
          {hasIncidentsAlert && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-md shadow-rose-900/50 animate-bounce">
              {openIncidentsCount} activa{openIncidentsCount > 1 ? 's' : ''}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onModuleChange('DELIVERIES')}
          aria-current={activeModule === 'DELIVERIES' ? 'page' : undefined}
        >
          <Package size={18} aria-hidden="true" />
          <span>Paquetería</span>
        </button>
      </nav>
    </>
  );
}