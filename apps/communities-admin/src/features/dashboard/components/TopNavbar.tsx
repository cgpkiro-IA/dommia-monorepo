'use client';

import React, { useState } from 'react';
import { Building2, Layers, LogOut, Copy, Check } from 'lucide-react';
import { TenantMetadata, UserSession } from '@/types';

interface TopNavbarProps {
  activeTenant: TenantMetadata | null;
  userSession: UserSession;
  onSwitchWorkspace: () => void;
  onLogout: () => void;
}

export function TopNavbar({
  activeTenant,
  userSession,
  onSwitchWorkspace,
  onLogout,
}: TopNavbarProps) {
  const [tenantCopied, setTenantCopied] = useState(false);

  const copyTenantId = async () => {
    if (!activeTenant?.slug) return;
    try {
      await navigator.clipboard.writeText(activeTenant.slug);
      setTenantCopied(true);
      window.setTimeout(() => setTenantCopied(false), 1800);
    } catch {
      setTenantCopied(false);
    }
  };

  return (
    <header className="bg-[#0F172A] border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Community Name */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-white tracking-wider font-heading block leading-none">
                  DOMMIA
                </span>
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">
                  Communities
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-white font-bold text-sm">
                {activeTenant?.name || 'Fraccionamiento'}
              </span>
              {activeTenant?.slug && <button type="button" onClick={() => void copyTenantId()} title="Copiar IDTENANT para acceso Resident y Guard" aria-label={tenantCopied ? `IDTENANT ${activeTenant.slug} copiado` : `Copiar IDTENANT ${activeTenant.slug}`} className="inline-flex min-h-7 items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 font-mono text-[10px] font-semibold text-sky-200 hover:border-blue-500/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">
                {tenantCopied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
                <span>IDTENANT: {activeTenant.slug}</span>
              </button>}
              <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-mono font-semibold text-[10px]">
                Plan {activeTenant?.tier || 'STANDARD'}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({activeTenant?.accessUrl || `${activeTenant?.slug}.dommia.com`})
              </span>
            </div>
          </div>

          {/* Actions: Switch Community & User Profile */}
          <div className="flex items-center gap-3">
            {userSession.tenants.length > 1 && (
              <button
                type="button"
                onClick={onSwitchWorkspace}
                className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-700/60 text-blue-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cambiar a otra comunidad administrada"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cambiar Fraccionamiento</span>
              </button>
            )}

            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-white">
                {userSession.user.firstName} {userSession.user.lastName}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Admin Conectado</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
