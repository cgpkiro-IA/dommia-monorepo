'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bike,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  Droplets,
  HelpCircle,
  MapPin,
  Package,
  Radio,
  RefreshCw,
  ShieldAlert,
  Truck,
  Wrench,
} from 'lucide-react';
import type { GuardServiceItem, GuardServiceType } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const serviceIcons: Record<GuardServiceType, any> = {
  FOOD_DELIVERY: Bike,
  GAS_SUPPLY: Truck,
  WATER_SUPPLY: Droplets,
  PARCEL_COURIER: Package,
  TAXI_RIDE: Car,
  MAINTENANCE: Wrench,
  OTHER: HelpCircle,
};

const serviceLabels: Record<GuardServiceType, string> = {
  FOOD_DELIVERY: 'Comida / Delivery',
  GAS_SUPPLY: 'Gas L.P. / Pipa',
  WATER_SUPPLY: 'Agua / Garrafones',
  PARCEL_COURIER: 'Mensajería / Paquetería',
  TAXI_RIDE: 'Taxi / Transporte App',
  MAINTENANCE: 'Mantenimiento / Obra',
  OTHER: 'Proveedor / Servicio',
};

interface AdminProviderLiveAlertProps {
  tenantSlug: string;
  authToken: string;
  onNavigateToGuards?: () => void;
}

export function AdminProviderLiveAlert({
  tenantSlug,
  authToken,
  onNavigateToGuards,
}: AdminProviderLiveAlertProps) {
  const [activeServices, setActiveServices] = useState<GuardServiceItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActiveServices = useCallback(async () => {
    if (!tenantSlug || !authToken) return;
    try {
      const res = await fetch(
        `${API}/tenants/${encodeURIComponent(tenantSlug)}/access/services?status=IN_TRANSIT`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Cache-Control': 'no-store',
          },
        }
      );
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          setActiveServices(body.data);
        }
      }
    } catch {
      // Non-blocking background poll
    }
  }, [tenantSlug, authToken]);

  // Initial load + live polling every 6 seconds
  useEffect(() => {
    fetchActiveServices();
    const interval = setInterval(fetchActiveServices, 6000);
    return () => clearInterval(interval);
  }, [fetchActiveServices]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchActiveServices();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // If no services are currently inside the community, don't display anything (auto-disappears on exit)
  if (activeServices.length === 0) {
    return null;
  }

  const generalCirculationCount = activeServices.filter((s) => s.destination_type === 'GENERAL').length;
  const specificCirculationCount = activeServices.filter((s) => s.destination_type === 'SPECIFIC').length;

  const formatElapsed = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
      if (diff < 1) return 'Hace menos de 1 min';
      if (diff === 1) return 'Hace 1 min';
      if (diff < 60) return `Hace ${diff} min`;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `Hace ${hours}h ${mins}m`;
    } catch {
      return '';
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-lg shadow-amber-500/10 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      {/* Header Banner */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase">
                Aviso: Proveedores y Servicios en Fraccionamiento
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs font-mono">
                {activeServices.length} {activeServices.length === 1 ? 'activo' : 'activos'}
              </span>
            </div>
            <p className="text-xs text-amber-100 font-medium">
              Notificación automática para Administración · Se retirará automáticamente cuando el guardia registre la salida
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToGuards && (
            <button
              type="button"
              onClick={onNavigateToGuards}
              className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Ver Caseta
            </button>
          )}
          <button
            type="button"
            onClick={handleManualRefresh}
            className={`p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-transform cursor-pointer ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Actualizar estado de proveedores"
            aria-label="Actualizar proveedores activos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Minimizar' : 'Expandir'}
            aria-label={isExpanded ? 'Minimizar lista' : 'Expandir lista'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="px-5 py-2 bg-amber-100/60 border-b border-amber-200/80 flex flex-wrap items-center justify-between text-xs text-amber-900 gap-2">
        <div className="flex items-center gap-3">
          {generalCirculationCount > 0 && (
            <span className="inline-flex items-center gap-1 font-bold text-orange-900 bg-orange-200/80 px-2 py-0.5 rounded-md border border-orange-300">
              <Truck className="w-3.5 h-3.5 text-orange-700" />
              {generalCirculationCount} en Recorrido General (Pipas / Suministro)
            </span>
          )}
          {specificCirculationCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md border border-amber-300">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              {specificCirculationCount} con Destino a Residentes
            </span>
          )}
        </div>
        <span className="text-[11px] text-amber-700 font-mono">
          Monitoreo en tiempo real
        </span>
      </div>

      {/* Expanded Service Cards */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeServices.map((service) => {
            const Icon = serviceIcons[service.service_type] || HelpCircle;
            const isGeneral = service.destination_type === 'GENERAL';

            return (
              <div
                key={service.id}
                className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                  isGeneral
                    ? 'bg-orange-50/90 border-orange-300 shadow-sm ring-1 ring-orange-400/30'
                    : 'bg-white border-amber-200 shadow-sm hover:border-amber-300'
                }`}
              >
                <div>
                  {/* Top line: Icon + Type + Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isGeneral
                            ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/30'
                            : 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                          {service.custom_service_name || serviceLabels[service.service_type]}
                        </div>
                        {service.supplier_name && (
                          <div className="text-xs font-semibold text-slate-700">
                            {service.supplier_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isGeneral
                          ? 'bg-orange-600 text-white'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isGeneral ? 'Recorrido General' : 'A Domicilio'}
                    </span>
                  </div>

                  {/* Vehicle Plates & Time */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-2.5">
                    {service.vehicle_plates && (
                      <span className="font-mono font-bold bg-slate-900 text-yellow-300 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                        {service.vehicle_plates}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTime(service.entered_at)} ({formatElapsed(service.entered_at)})
                    </span>
                  </div>

                  {/* Destinations details */}
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 text-xs">
                    {isGeneral ? (
                      <div className="flex items-start gap-1.5 text-orange-950">
                        <ShieldAlert className="w-3.5 h-3.5 text-orange-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold">Circulación abierta:</span> Pipa / Camión en recorrido por vialidades del fraccionamiento.
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span>Destinos asignados ({service.destinations.length}):</span>
                        </div>
                        <ul className="space-y-0.5 pl-4 list-disc text-slate-600 text-[11px]">
                          {service.destinations.map((d, i) => (
                            <li key={i}>
                              <span className="font-semibold text-slate-800">{d.propertyAddress}</span>
                              {d.residentName && (
                                <span className="text-slate-500"> ({d.residentName})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {service.notes && (
                      <p className="mt-1.5 pt-1.5 border-t border-slate-200 text-[11px] text-slate-500 italic">
                        Nota: "{service.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer indicator */}
                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Ingresó por: <strong className="text-slate-700">{service.entered_by || 'Guardia'}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    En Tránsito
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
