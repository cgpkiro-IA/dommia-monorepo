'use client';

import React from 'react';
import { Home, Users, Car, Bell, DollarSign, Settings2, ShieldCheck } from 'lucide-react';

export type AdminTab = 'PROPERTIES' | 'RESIDENTS' | 'VEHICLES' | 'NOTICES' | 'FINANCE' | 'NOTIFICATIONS' | 'GUARDS';

interface TabNavigationProps {
  activeTab: AdminTab;
  propertiesCount: number;
  residentsCount: number;
  vehiclesCount: number;
  noticesCount?: number;
  feesCount?: number;
  notificationsEnabled?: boolean;
  accessQrEnabled?: boolean;
  onTabChange: (tab: AdminTab) => void;
}

export function TabNavigation({
  activeTab,
  propertiesCount,
  residentsCount,
  vehiclesCount,
  noticesCount = 0,
  feesCount = 0,
  notificationsEnabled = false,
  accessQrEnabled = false,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit flex-wrap">
      <button
        type="button"
        onClick={() => onTabChange('PROPERTIES')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          activeTab === 'PROPERTIES'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Home className="w-4 h-4 text-blue-600" />
        <span>Viviendas & Lotes ({propertiesCount})</span>
      </button>

      {notificationsEnabled && <button
        type="button"
        onClick={() => onTabChange('NOTIFICATIONS')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          activeTab === 'NOTIFICATIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Settings2 className="w-4 h-4 text-indigo-600" />
        <span>Notificaciones Premium</span>
      </button>}

      {accessQrEnabled && <button
        type="button"
        onClick={() => onTabChange('GUARDS')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          activeTab === 'GUARDS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <ShieldCheck className="w-4 h-4 text-emerald-700" />
        <span>Guardias</span>
      </button>}

      <button
        type="button"
        onClick={() => onTabChange('RESIDENTS')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          activeTab === 'RESIDENTS'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Users className="w-4 h-4 text-indigo-600" />
        <span>Padrón de Residentes ({residentsCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('VEHICLES')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          activeTab === 'VEHICLES'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Car className="w-4 h-4 text-emerald-600" />
        <span>Control Vehicular ({vehiclesCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('NOTICES')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          activeTab === 'NOTICES'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Bell className="w-4 h-4 text-amber-500" />
        <span>Comunicados & Circulares ({noticesCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange('FINANCE')}
        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
          activeTab === 'FINANCE'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <DollarSign className="w-4 h-4 text-emerald-600" />
        <span>Finanzas & Cuotas ({feesCount})</span>
      </button>
    </div>
  );
}

