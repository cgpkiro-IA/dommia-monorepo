'use client';

import React from 'react';
import { Layers, ArrowRight, LogOut } from 'lucide-react';
import { TenantMetadata } from '@/types';

interface WorkspacePickerProps {
  tenants: TenantMetadata[];
  userName: string;
  onSelectTenant: (tenant: TenantMetadata) => void;
  onLogout: () => void;
}

export function WorkspacePicker({
  tenants,
  userName,
  onSelectTenant,
  onLogout,
}: WorkspacePickerProps) {
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Cuenta Multi-Fraccionamiento Detectada</span>
          </div>
          <h2 className="text-3xl font-black text-white font-heading">
            Selecciona el Fraccionamiento a Operar
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
            Hola, <strong>{userName}</strong>. Cuentas con privilegios de administración en{' '}
            <strong className="text-white">{tenants.length} comunidades</strong>. Elige en cuál deseas trabajar:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenants.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectTenant(t)}
              className="group p-6 rounded-3xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/80 font-mono font-bold text-[11px]">
                    Plan {t.tier}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Capacidad: {t.maxProperties} casas
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-heading group-hover:text-blue-300 transition-colors">
                  {t.name}
                </h3>

                <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{t.accessUrl || `${t.slug}.dommia.com.mx`}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                <span>Gestionar Fraccionamiento</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión / Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
