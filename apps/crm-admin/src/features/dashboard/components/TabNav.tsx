'use client';

import React from 'react';
import { TrendingUp, BarChart3, Bell, Layers, Building2, Radio, SlidersHorizontal, ShieldCheck } from 'lucide-react';

export type CrmTab = 'dashboard' | 'analytics' | 'alerts' | 'pipeline' | 'tenants' | 'gateways' | 'plans' | 'security';

interface TabNavProps {
  activeTab: CrmTab;
  onTabChange: (tab: CrmTab) => void;
  prospectsCount: number;
  tenantsCount: number;
  gatewaysCount: number;
  activeAlertsCount?: number;
}

export function TabNav({
  activeTab,
  onTabChange,
  prospectsCount,
  tenantsCount,
  gatewaysCount,
  activeAlertsCount = 0,
}: TabNavProps) {
  return (
    <div className="bg-[#0B1120] border-b border-slate-800/80 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <nav className="flex space-x-1 sm:space-x-2 text-xs sm:text-sm font-semibold text-slate-400 overflow-x-auto">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tablero</span>
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => onTabChange('alerts')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 relative ${
              activeTab === 'alerts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Bell className="w-4 h-4 text-rose-400" />
            <span>Alertas</span>
            {activeAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('pipeline')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pipeline Comercial</span>
            {prospectsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-blue-300">
                {prospectsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('tenants')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tenants'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Fraccionamientos ({tenantsCount})</span>
          </button>

          <button
            onClick={() => onTabChange('gateways')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gateways'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Inventario IoT ({gatewaysCount})</span>
          </button>

          <button
            onClick={() => onTabChange('plans')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Planes & Módulos</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('security')}
            aria-current={activeTab === 'security' ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'security' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck aria-hidden="true" className="w-4 h-4" />
            <span>Seguridad</span>
          </button>
        </nav>

        {/* Quick link to Landing Comercial */}
        <div className="hidden md:flex items-center text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Landing Comercial Activa en{' '}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:underline font-mono"
            >
              :3000
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
