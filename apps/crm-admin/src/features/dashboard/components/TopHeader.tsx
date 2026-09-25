'use client';

import React from 'react';
import { Logo, Button } from '@dommia/ui';
import { RefreshCw, Plus } from 'lucide-react';

interface TopHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onOpenNewTenant: () => void;
}

export function TopHeader({ isLoading, onRefresh, onOpenNewTenant }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0F172A] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between text-white shadow-md">
      <div className="flex items-center gap-6">
        <Logo variant="light" size="md" />
        <div className="h-5 w-px bg-slate-700 hidden sm:block" />
        <span className="text-xs uppercase tracking-widest px-2.5 py-1 bg-blue-900/60 text-blue-300 font-semibold rounded-md border border-blue-700/50">
          CRM Maestro SaaS
        </span>
      </div>

      {/* Global actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="dark-outline"
          size="sm"
          onClick={onRefresh}
          className="text-xs font-semibold text-slate-100 border-slate-700 bg-slate-800/90 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewTenant}
          className="shadow-md shadow-blue-900/30 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Alta de Fraccionamiento
        </Button>
      </div>
    </header>
  );
}
