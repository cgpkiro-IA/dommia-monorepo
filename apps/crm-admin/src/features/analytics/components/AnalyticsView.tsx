import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Building2,
  Home,
  Users,
  Smartphone,
  QrCode,
  Package,
  Truck,
  AlertTriangle,
  Database,
  Activity,
  Server,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ClientErrorCard, ClientErrorState } from '@dommia/ui';
import { CrmAnalyticsData } from '../hooks/useCrmAnalytics';

interface AnalyticsViewProps {
  analytics: CrmAnalyticsData | null;
  loading: boolean;
  error: ClientErrorState | string | null;
  onRefresh: () => void;
}

export function AnalyticsView({
  analytics,
  loading,
  error,
  onRefresh,
}: AnalyticsViewProps) {
  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Calculando analítica global multi-tenant...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="p-8">
        <ClientErrorCard error={error} onRetry={onRefresh} />
      </div>
    );
  }

  const fin = analytics?.financials;
  const adopt = analytics?.adoption;
  const telem = analytics?.telemetry;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header with Title and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
              Dommia Analytics Core
            </span>
            <span className="text-xs text-slate-500 font-mono">Multi-Tenant SaaS Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Tablero Global de Salud y Negocio SaaS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas financieras consolidadas, adopción de colonos en la red y telemetría de infraestructura.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {/* 1. KPIs Financieros Principales */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Rendimiento Financiero SaaS (Recurrencia)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0F172A] text-white border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-3 top-3 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MRR Consolidado</p>
            <p className="text-3xl font-black text-white mt-1">
              ${fin?.mrr?.toLocaleString('es-MX') || 0}{' '}
              <span className="text-xs font-bold text-emerald-400">MXN/mes</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Ingreso mensual recurrente facturado
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ARR Proyectado</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              ${fin?.arr?.toLocaleString('es-MX') || 0}{' '}
              <span className="text-xs font-bold text-emerald-600">MXN/año</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Proyección anualizada sobre cartera activa
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Comunidades Activas</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {adopt?.activeTenants || 0}{' '}
              <span className="text-xs font-normal text-slate-500">de {adopt?.totalTenants || 0} totales</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Fraccionamientos en operación continua
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ticket Promedio (ARPU)</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              ${fin?.averageTicket?.toLocaleString('es-MX') || 0}{' '}
              <span className="text-xs font-bold text-slate-500">MXN</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Ingreso mensual promedio por fraccionamiento
            </p>
          </div>
        </div>
      </div>

      {/* 2. Distribución de Planes y Addons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Tier de Plan */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Distribución de Suscripciones por Plan</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Ingresos por segmento</span>
          </div>

          <div className="space-y-3">
            {fin?.plansDistribution.map((item) => (
              <div key={item.tier} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${
                    item.tier === 'ENTERPRISE'
                      ? 'bg-purple-100 text-purple-800'
                      : item.tier === 'STANDARD'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {item.tier}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.count} fraccionamiento(s) contratado(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">
                    ${item.revenue.toLocaleString('es-MX')} MXN
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">Facturación / mes</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Addons y Módulos Activos */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Módulos y Add-ons Contratados en la Red</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">Capacidades habilitadas</span>
          </div>

          <div className="space-y-3">
            {fin?.addonsBreakdown.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{item.type}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Habilitado en <span className="font-bold text-slate-700">{item.count}</span> fraccionamiento(s)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold font-mono">
                    +${item.revenue.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Métricas de Adopción y Operación en Tiempo Real */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span>Adopción y Operación Global en la Red DOMMIA</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <Home className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900">{adopt?.totalProperties || 0}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Viviendas Censadas</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <Users className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900">{adopt?.totalResidents || 0}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Colonos Registrados</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <Smartphone className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-purple-700">{adopt?.pwaAdoptionRate || 0}%</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Adopción PWA Móvil</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <QrCode className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900">{adopt?.todayActivity.qrAccessesValidated || 0}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Accesos QR Hoy</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <Package className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900">{adopt?.todayActivity.packagesReceived || 0}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Paquetes en Caseta</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
            <Truck className="w-5 h-5 text-orange-600 mx-auto mb-1.5" />
            <p className="text-2xl font-black text-slate-900">{adopt?.todayActivity.servicesRegistered || 0}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Servicios Hoy</p>
          </div>
        </div>
      </div>

      {/* 4. Telemetría de Infraestructura y Servidor */}
      <div className="p-6 rounded-2xl bg-[#0F172A] text-white border border-slate-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-extrabold text-white">Telemetría de Infraestructura Cloud & Base de Datos</h4>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PostgreSQL 16 Cluster • Operación Normal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Esquemas Aislados (Tenants)</p>
            <p className="text-2xl font-black text-white mt-1">{telem?.tenantSchemasCount || 0} schemas</p>
            <p className="text-[11px] text-slate-400 mt-1">Multi-tenancy por Schema físico</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Almacenamiento BD</p>
            <p className="text-2xl font-black text-white mt-1">{telem?.databaseSizeMb || 0} MB</p>
            <p className="text-[11px] text-slate-400 mt-1">Uso de disco PostgreSQL</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Latencia Central API</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{telem?.apiLatencyStatus || 'OPTIMAL (<100ms)'}</p>
            <p className="text-[11px] text-slate-400 mt-1">p95 en endpoints de validación</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estado de Conexión</p>
            <p className="text-2xl font-black text-blue-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>{telem?.databaseHealth || 'OPTIMAL'}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Pool PostgreSQL saludable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
