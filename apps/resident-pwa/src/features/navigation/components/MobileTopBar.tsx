'use client';

import React from 'react';
import { Logo } from '@dommia/ui';
import { ConnectivityBadge } from '../../offline/components/ConnectivityBadge';

interface MobileTopBarProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulate: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  isOnline,
  isSimulatedOffline,
  onToggleSimulate,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="sm" variant="light" showText={false} />
          <span className="font-extrabold text-sm text-white tracking-tight font-heading">
            DOMMIA <span className="text-blue-400 font-semibold text-xs">Resident</span>
          </span>
        </div>

        <ConnectivityBadge
          isOnline={isOnline}
          isSimulatedOffline={isSimulatedOffline}
          onToggleSimulate={onToggleSimulate}
        />
      </div>
    </header>
  );
};
