'use client';

import React from 'react';
import { Button } from '@dommia/ui';
import { Radio, Wifi } from 'lucide-react';
import { GatewayItem } from '../../../types';

interface GatewaysTableProps {
  gateways: GatewayItem[];
  onSimulateHeartbeat: (uuid: string) => void;
}

export function GatewaysTable({ gateways, onSimulateHeartbeat }: GatewaysTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Nombre / Ubicación</th>
              <th className="px-6 py-3.5">Hardware UUID</th>
              <th className="px-6 py-3.5">Fraccionamiento Asignado</th>
              <th className="px-6 py-3.5">Estado Telemetría</th>
              <th className="px-6 py-3.5">Último Heartbeat</th>
              <th className="px-6 py-3.5">Firmware / IP</th>
              <th className="px-6 py-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gateways.map((g) => {
              const isOnline = g.dynamic_status === 'ONLINE';

              return (
                <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{g.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                    {g.uuid}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-800">
                    {g.tenant_name || <span className="text-slate-400 italic">Sin vincular</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isOnline
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span>{isOnline ? 'ONLINE (<90s)' : 'ALERTA: OFFLINE'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                    {g.last_heartbeat ? (
                      <span>
                        {new Date(g.last_heartbeat).toLocaleTimeString('es-MX')}{' '}
                        <span className="text-slate-400">({g.seconds_since_heartbeat || 0}s atrás)</span>
                      </span>
                    ) : (
                      'Nunca'
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">v{g.firmware_version}</span>
                    {g.ip_local && <span className="text-slate-400 block font-mono">{g.ip_local}</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSimulateHeartbeat(g.uuid)}
                      className="text-xs py-1"
                      title="Simular reporte MQTT desde caseta"
                    >
                      <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Reportar Heartbeat
                    </Button>
                  </td>
                </tr>
              );
            })}

            {gateways.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No hay gateways registrados en el inventario. Registra uno nuevo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
