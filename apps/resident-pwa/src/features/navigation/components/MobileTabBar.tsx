'use client';

import React from 'react';
import { CreditCard, QrCode, UserPlus, Bell } from 'lucide-react';

export type TabKey = 'credential' | 'passes' | 'notices' | 'finance';

interface MobileTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  noticesCount?: number;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  noticesCount = 2,
}) => {
  const tabs = [
    { key: 'credential', label: 'Mi Credencial', icon: QrCode },
    { key: 'passes', label: 'Pases Visita', icon: UserPlus },
    { key: 'notices', label: 'Circulares', icon: Bell, badge: noticesCount },
    { key: 'finance', label: 'Mis Cuotas', icon: CreditCard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800/90 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key as TabKey)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer relative ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <IconComp className={`w-5 h-5 ${isActive ? 'scale-110 text-blue-400' : ''}`} />
                {Boolean(tab.badge) && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
