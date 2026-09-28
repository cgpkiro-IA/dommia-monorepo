'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Plus } from 'lucide-react';
import { TenantItem } from '../../../types';
import { TenantsTable } from './TenantsTable';

interface TenantsViewProps {
  tenants: TenantItem[];
  onOpenModal: () => void;
  onEditTenant: (tenant: TenantItem) => void;
}

export function TenantsView({ tenants, onOpenModal, onEditTenant }: TenantsViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Fraccionamientos Activos & Schemas Multi-Tenant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Aislamiento estricto en PostgreSQL por esquemas independientes (<code>tenant_&lt;slug&gt;</code>).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenModal}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Alta de Fraccionamiento
        </Button>
      </div>

      <TenantsTable tenants={tenants} onEditTenant={onEditTenant} />
    </div>
  );
}

