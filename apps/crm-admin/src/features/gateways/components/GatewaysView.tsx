'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Plus } from 'lucide-react';
import { GatewayItem } from '../../../types';
import { GatewaysTable } from './GatewaysTable';

interface GatewaysViewProps {
  gateways: GatewayItem[];
  onOpenModal: () => void;
  onSimulateHeartbeat: (uuid: string) => void;
}

export function GatewaysView({
  gateways,
  onOpenModal,
  onSimulateHeartbeat,
}: GatewaysViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
            Inventario & Telemetría IoT en Casetas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoreo de Gateways en tiempo real vía MQTT (EMQX). Alerta automática tras 90 segundos sin reporte.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenModal}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Registrar Gateway
        </Button>
      </div>

      <GatewaysTable
        gateways={gateways}
        onSimulateHeartbeat={onSimulateHeartbeat}
      />
    </div>
  );
}
