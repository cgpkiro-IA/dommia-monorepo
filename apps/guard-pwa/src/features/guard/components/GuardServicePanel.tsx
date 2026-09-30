'use client';

import React from 'react';
import {
  Bike,
  Truck,
  Droplets,
  Package,
  Car,
  Wrench,
  HelpCircle,
  Search,
  Plus,
  X,
  LogOut,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { GuardServiceType, GuardServiceItem, GuardServiceDestination } from '../types';

interface GuardServicePanelProps {
  isOnline: boolean;
  serviceType: GuardServiceType;
  onServiceTypeChange: (type: GuardServiceType) => void;
  customServiceName: string;
  onCustomServiceNameChange: (name: string) => void;
  supplierName: string;
  onSupplierNameChange: (name: string) => void;
  vehiclePlates: string;
  onVehiclePlatesChange: (plates: string) => void;
  destinationType: 'SPECIFIC' | 'GENERAL';
  onDestinationTypeChange: (destType: 'SPECIFIC' | 'GENERAL') => void;
  destinations: GuardServiceDestination[];
  onAddDestination: (dest: { propertyId: string; propertyAddress: string; residentName: string; residentPhone?: string; residentEmail?: string }) => void;
  onRemoveDestination: (propertyId: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: Array<{ propertyId: string; propertyAddress: string; residentName: string; residentPhone?: string; residentEmail?: string }>;
  searchBusy: boolean;
  activeServices: GuardServiceItem[];
  loadingServices: boolean;
  selectedActiveServiceId: string | null;
  onSelectActiveService: (id: string | null) => void;
  submitting: boolean;
  exitingId: string | null;
  message: string | null;
  error: string | null;
  onSubmit: () => void;
  onRegisterExit: (serviceId: string) => void;
  onRefreshServices: () => void;
}

const SERVICE_CONFIGS: Array<{
  type: GuardServiceType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  placeholderSupplier: string;
}> = [
  {
    type: 'FOOD_DELIVERY',
    label: 'Comida',
    icon: Bike,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    placeholderSupplier: 'Ej. Rappi, UberEats, Domino\'s',
  },
  {
    type: 'GAS_SUPPLY',
    label: 'Gas L.P.',
    icon: Truck,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
    placeholderSupplier: 'Ej. Gas Imperial, Vela Gas',
  },
  {
    type: 'WATER_SUPPLY',
    label: 'Agua / Garrafón',
    icon: Droplets,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    placeholderSupplier: 'Ej. Bonafont, Ciel, Epura',
  },
  {
    type: 'PARCEL_COURIER',
    label: 'Mensajería',
    icon: Package,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    placeholderSupplier: 'Ej. Amazon, Mercado Libre, DHL',
  },
  {
    type: 'TAXI_RIDE',
    label: 'Taxi / App',
    icon: Car,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/40',
    placeholderSupplier: 'Ej. Uber, Didi, Taxi local',
  },
  {
    type: 'MAINTENANCE',
    label: 'Mantenimiento',
    icon: Wrench,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    placeholderSupplier: 'Ej. Pintor, Plomero, Climas',
  },
  {
    type: 'OTHER',
    label: 'Otro',
    icon: HelpCircle,
    color: 'text-slate-300',
    bgColor: 'bg-slate-700/30',
    borderColor: 'border-slate-600',
    placeholderSupplier: 'Ej. Mudanzas, Veterinario',
  },
];

function formatTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Hace un momento';
  if (mins === 1) return 'Hace 1 min';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `Hace ${hours} h ${mins % 60} min`;
}

export function GuardServicePanel({
  isOnline,
  serviceType,
  onServiceTypeChange,
  customServiceName,
  onCustomServiceNameChange,
  supplierName,
  onSupplierNameChange,
  vehiclePlates,
  onVehiclePlatesChange,
  destinationType,
  onDestinationTypeChange,
  destinations,
  onAddDestination,
  onRemoveDestination,
  notes,
  onNotesChange,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searchBusy,
  activeServices,
  loadingServices,
  selectedActiveServiceId,
  onSelectActiveService,
  submitting,
  exitingId,
  message,
  error,
  onSubmit,
  onRegisterExit,
  onRefreshServices,
}: GuardServicePanelProps) {
  const activeConfig = SERVICE_CONFIGS.find((c) => c.type === serviceType) || SERVICE_CONFIGS[0];

  return (
    <div className="space-y-6">
      {/* 1. SECCIÓN PRINCIPAL: FORMULARIO DE INGRESO */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Acceso de Servicios y Proveedores</h2>
              <p className="text-xs text-slate-400">Comida, gas, garrafones, paquetería y servicios generales</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {activeServices.length} dentro
          </span>
        </div>

        {/* Notificaciones de éxito o error */}
        {message && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-5"
        >
          {/* Selector de Iconos / Tipos de Servicios */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              1. Selecciona Tipo de Servicio:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {SERVICE_CONFIGS.map((cfg) => {
                const Icon = cfg.icon;
                const isSelected = serviceType === cfg.type;
                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => onServiceTypeChange(cfg.type)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer min-h-[76px] ${
                      isSelected
                        ? `${cfg.bgColor} ${cfg.borderColor} border-2 shadow-lg ring-2 ring-blue-500/20 scale-[1.02]`
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${cfg.color}`} />
                    <span className="text-[11px] font-bold text-white leading-tight">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo adicional si se eligió "Otro" */}
          {serviceType === 'OTHER' && (
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 animate-fade-in">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ¿Qué servicio o empresa está ingresando? *
              </label>
              <input
                type="text"
                value={customServiceName}
                onChange={(e) => onCustomServiceNameChange(e.target.value)}
                placeholder="Ej. Mudanzas San José, Médico Veterinario, Fumigación..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Datos del Proveedor y Placas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nombre de Empresa / Repartidor (Opcional)
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => onSupplierNameChange(e.target.value)}
                placeholder={activeConfig.placeholderSupplier}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Placas / Matrícula (Opcional)
              </label>
              <input
                type="text"
                value={vehiclePlates}
                onChange={(e) => onVehiclePlatesChange(e.target.value.toUpperCase())}
                placeholder="Ej. MTO-889 o N/A"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* 2. DESTINO DEL SERVICIO */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              2. Destino del Servicio:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => onDestinationTypeChange('SPECIFIC')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                  destinationType === 'SPECIFIC'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${destinationType === 'SPECIFIC' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-white">Domicilio(s) Específico(s)</strong>
                  <span className="text-[11px] text-slate-400">Notifica a 1 o varios residentes que el servicio va en camino</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDestinationTypeChange('GENERAL')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                  destinationType === 'GENERAL'
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-md'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${destinationType === 'GENERAL' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-white">Recorrido General</strong>
                  <span className="text-[11px] text-slate-400">Proveedor circulando en fraccionamiento (avisa a administración)</span>
                </div>
              </button>
            </div>

            {/* Búsqueda y selección multi-residente para SPECIFIC */}
            {destinationType === 'SPECIFIC' && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3 animate-fade-in">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="Buscar por nombre de residente o calle y número..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  />
                  {searchBusy && (
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin absolute right-3.5 top-3" />
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-900/90 rounded-xl p-2 border border-slate-700 shadow-xl">
                    {searchResults.map((item, idx) => (
                      <button
                        key={`${item.propertyId}-${idx}`}
                        type="button"
                        onClick={() => onAddDestination(item)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-blue-600/20 text-slate-200 hover:text-white flex items-center justify-between text-xs transition-colors group cursor-pointer"
                      >
                        <div>
                          <strong className="text-white block">{item.propertyAddress}</strong>
                          <span className="text-slate-400 text-[11px]">{item.residentName}</span>
                        </div>
                        <span className="p-1 rounded bg-blue-500/20 text-blue-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Domicilios seleccionados (Badges) */}
                {destinations.length > 0 ? (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Domicilios a notificar ({destinations.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {destinations.map((d) => (
                        <span
                          key={d.propertyId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900/50 border border-blue-600/50 text-blue-200 text-xs font-bold shadow-sm"
                        >
                          <MapPin className="w-3 h-3 text-blue-400" />
                          <span>{d.propertyAddress} ({d.residentName})</span>
                          <button
                            type="button"
                            onClick={() => onRemoveDestination(d.propertyId)}
                            className="p-0.5 hover:bg-blue-800 rounded text-blue-300 hover:text-white cursor-pointer"
                            title="Quitar destino"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-300/90 font-medium">
                    * Agrega al menos un domicilio escribiendo en el buscador arriba.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={submitting || !isOnline}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm tracking-wide shadow-xl hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Registrando Ingreso y Notificando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Registrar Ingreso de {activeConfig.label}
              </>
            )}
          </button>
        </form>
      </section>

      {/* 2. SECCIÓN: LISTADO DE SERVICIOS ACTIVOS DENTRO ("EN TRÁNSITO") */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Servicios en Fraccionamiento (En Tránsito)</h3>
          </div>
          <button
            type="button"
            onClick={onRefreshServices}
            disabled={loadingServices}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingServices ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>

        {activeServices.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 text-center">
            <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No hay proveedores o servicios dentro actualmente</p>
            <p className="text-xs text-slate-500 mt-0.5">Todos los servicios registrados han marcado salida.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeServices.map((service) => {
              const cfg = SERVICE_CONFIGS.find((c) => c.type === service.service_type) || SERVICE_CONFIGS[0];
              const Icon = cfg.icon;
              const isSelected = selectedActiveServiceId === service.id;
              const isExiting = exitingId === service.id;

              return (
                <div
                  key={service.id}
                  onClick={() => onSelectActiveService(isSelected ? null : service.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500/80 shadow-xl ring-2 ring-amber-500/20'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${cfg.bgColor} ${cfg.borderColor} border`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-white block">
                          {service.service_type === 'OTHER' ? service.custom_service_name || 'Servicio General' : cfg.label}
                        </strong>
                        <span className="text-xs text-slate-300">
                          {service.supplier_name || 'Proveedor no especificado'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/60 shrink-0">
                      {formatTimeAgo(service.entered_at)}
                    </span>
                  </div>

                  {/* Placas y Destinos */}
                  <div className="text-xs space-y-1 mt-2 text-slate-300">
                    {service.vehicle_plates && (
                      <p className="font-mono text-slate-400">
                        Placas: <span className="text-white font-bold">{service.vehicle_plates}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {service.destination_type === 'GENERAL' ? (
                        <span className="text-amber-300 font-semibold">Recorrido General</span>
                      ) : (
                        <span className="truncate">
                          {(service.destinations || []).map((d) => d.propertyAddress).join(', ') || 'Sin domicilio registrado'}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Botón de Registrar Salida */}
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      {isSelected ? 'Listo para registrar salida' : 'Toca para marcar salida'}
                    </span>
                    <button
                      type="button"
                      disabled={isExiting || !isOnline}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRegisterExit(service.id);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isExiting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      Registrar Salida
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
