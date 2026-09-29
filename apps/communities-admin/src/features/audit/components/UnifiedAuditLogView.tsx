'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Bell,
  Bike,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Download,
  Droplets,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  History,
  Key,
  MapPin,
  Package,
  QrCode,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Truck,
  User,
  UserCheck,
  UserX,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  AuditCategoryFilter,
  AuditPeriodFilter,
  UnifiedAuditLogItem,
  UnifiedAuditLogSummary,
} from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface UnifiedAuditLogViewProps {
  tenantSlug: string;
  authToken: string;
}

export function UnifiedAuditLogView({ tenantSlug, authToken }: UnifiedAuditLogViewProps) {
  // Filters
  const [period, setPeriod] = useState<AuditPeriodFilter>('TODAY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [category, setCategory] = useState<AuditCategoryFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Data
  const [events, setEvents] = useState<UnifiedAuditLogItem[]>([]);
  const [summary, setSummary] = useState<UnifiedAuditLogSummary>({
    totalEvents: 0,
    grantedAccessCount: 0,
    rejectedAccessCount: 0,
    servicesCount: 0,
    incidentsCount: 0,
    deliveriesCount: 0,
    noticesCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Calculate Date Ranges based on period selection
  const computeDatesForPeriod = useCallback((selectedPeriod: AuditPeriodFilter) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (selectedPeriod === 'TODAY') {
      const today = new Date(year, month, day);
      return { start: formatDate(today), end: formatDate(today) };
    }

    if (selectedPeriod === 'WEEK') {
      const sevenDaysAgo = new Date(year, month, day - 6);
      return { start: formatDate(sevenDaysAgo), end: formatDate(now) };
    }

    if (selectedPeriod === 'FORTNIGHT') {
      if (day <= 15) {
        const startFortnight = new Date(year, month, 1);
        const endFortnight = new Date(year, month, 15);
        return { start: formatDate(startFortnight), end: formatDate(endFortnight) };
      } else {
        const startFortnight = new Date(year, month, 16);
        const endMonth = new Date(year, month + 1, 0);
        return { start: formatDate(startFortnight), end: formatDate(endMonth) };
      }
    }

    if (selectedPeriod === 'MONTH') {
      const startMonth = new Date(year, month, 1);
      const endMonth = new Date(year, month + 1, 0);
      return { start: formatDate(startMonth), end: formatDate(endMonth) };
    }

    return { start: startDate, end: endDate };
  }, [startDate, endDate]);

  const loadAuditLog = useCallback(async () => {
    if (!tenantSlug || !authToken) return;
    setLoading(true);
    setError('');

    try {
      const dateRange = computeDatesForPeriod(period);
      const params = new URLSearchParams();

      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);
      if (category !== 'ALL') params.set('category', category);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '250');

      const res = await fetch(
        `${API}/tenants/${encodeURIComponent(tenantSlug)}/access/unified-log?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Cache-Control': 'no-store',
          },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'No se pudo cargar la bitácora de eventos.');
      }

      const body = await res.json();
      if (body.success && body.data) {
        setEvents(body.data.events || []);
        if (body.data.summary) {
          setSummary(body.data.summary);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al consultar la bitácora de eventos.');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, authToken, period, computeDatesForPeriod, category, statusFilter, search]);

  useEffect(() => {
    loadAuditLog();
  }, [loadAuditLog]);

  // Handle Period switch
  const handlePeriodChange = (newPeriod: AuditPeriodFilter) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'CUSTOM') {
      const dates = computeDatesForPeriod(newPeriod);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (events.length === 0) return;
    setIsExporting(true);

    try {
      const headers = [
        'Fecha y Hora',
        'Categoría',
        'Tipo de Evento',
        'Título / Detalle',
        'Descripción',
        'Domicilio / Ubicación',
        'Placas',
        'Resultado / Estado',
        'Responsable / Guardia',
        'Notas / Motivo',
      ];

      const rows = events.map((e) => [
        new Date(e.createdAt).toLocaleString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        e.category,
        e.eventType,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${(e.propertyAddress || 'N/A').replace(/"/g, '""')}"`,
        `"${(e.vehiclePlates || '').replace(/"/g, '""')}"`,
        e.status,
        `"${(e.actorName || 'Sistema').replace(/"/g, '""')}"`,
        `"${(e.notes || e.rejectionReason || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        '\uFEFF' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Bitacora_Accesos_${tenantSlug}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Export error handler
    } finally {
      setIsExporting(false);
    }
  };

  const getEventIcon = (category: string, eventType: string, isGranted: boolean) => {
    if (category === 'ACCESS') {
      if (!isGranted) return <ShieldX className="w-4 h-4 text-rose-600" />;
      if (eventType.includes('RESIDENT')) return <Key className="w-4 h-4 text-blue-600" />;
      if (eventType.includes('MANUAL')) return <UserCheck className="w-4 h-4 text-amber-600" />;
      return <QrCode className="w-4 h-4 text-emerald-600" />;
    }
    if (category === 'SERVICE') {
      if (eventType === 'SERVICE_EXIT') return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
      return <Truck className="w-4 h-4 text-orange-600" />;
    }
    if (category === 'INCIDENT') {
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    }
    if (category === 'DELIVERY') {
      return <Package className="w-4 h-4 text-purple-600" />;
    }
    if (category === 'NOTICE') {
      return <Bell className="w-4 h-4 text-indigo-600" />;
    }
    return <History className="w-4 h-4 text-slate-600" />;
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ACCESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Acceso</span>;
      case 'SERVICE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Servicio</span>;
      case 'INCIDENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Incidencia</span>;
      case 'DELIVERY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Paquetería</span>;
      case 'NOTICE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Comunicado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Evento</span>;
    }
  };

  const getStatusBadge = (status: string, isGranted: boolean) => {
    if (status === 'GRANTED' || (status === 'COMPLETED' && isGranted)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Autorizado
        </span>
      );
    }
    if (status === 'REJECTED' || !isGranted) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Denegado
        </span>
      );
    }
    if (status === 'IN_TRANSIT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          En Tránsito
        </span>
      );
    }
    if (status === 'OPEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
          Abierta
        </span>
      );
    }
    if (status === 'RESOLVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          Resuelta
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
          En Caseta
        </span>
      );
    }
    if (status === 'PUBLISHED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          Publicado
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 font-heading">
                Bitácora Unificada de Eventos y Accesos
              </h1>
              <p className="text-xs text-slate-500">
                Auditoría histórica de visitas QR, ingresos manuales, servicios, paquetería e incidencias de {tenantSlug}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadAuditLog}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Actualizar bitácora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || events.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
            title="Descargar reporte en formato Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Eventos</div>
          <div className="text-xl font-black text-slate-900 mt-1">{summary.totalEvents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">En el periodo seleccionado</div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Accesos Autorizados</span>
          </div>
          <div className="text-xl font-black text-emerald-900 mt-1">{summary.grantedAccessCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">QR y visitas validadas</div>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Accesos Denegados</span>
          </div>
          <div className="text-xl font-black text-rose-900 mt-1">{summary.rejectedAccessCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Expirados o no autorizados</div>
        </div>

        <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3 h-3 text-orange-600" />
            <span>Proveedores & Servicios</span>
          </div>
          <div className="text-xl font-black text-orange-900 mt-1">{summary.servicesCount}</div>
          <div className="text-[10px] text-orange-700 mt-0.5">Gas, agua, entregas, etc.</div>
        </div>

        <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Incidencias</span>
          </div>
          <div className="text-xl font-black text-rose-900 mt-1">{summary.incidentsCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Reportes de seguridad</div>
        </div>

        <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
            <Package className="w-3 h-3 text-purple-600" />
            <span>Paquetería</span>
          </div>
          <div className="text-xl font-black text-purple-900 mt-1">{summary.deliveriesCount}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">Entregas en caseta</div>
        </div>
      </div>

      {/* Filters Control Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Temporal Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Periodo:</span>
            </span>

            <button
              type="button"
              onClick={() => handlePeriodChange('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'TODAY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange('WEEK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'WEEK'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Esta Semana (7d)
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange('FORTNIGHT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'FORTNIGHT'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Esta Quincena
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'MONTH'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Este Mes
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'CUSTOM'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rango Personalizado
            </button>
          </div>

          {period === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-800 bg-white font-mono text-xs"
                placeholder="Desde"
              />
              <span className="text-slate-400">al</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-800 bg-white font-mono text-xs"
                placeholder="Hasta"
              />
            </div>
          )}
        </div>

        {/* Category & Status & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar visitante, residente, placas, notas..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AuditCategoryFilter)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="ACCESS">🔑 Accesos QR & Residentes</option>
              <option value="SERVICE">🛵 🚛 Proveedores & Servicios</option>
              <option value="INCIDENT">🚨 Incidencias de Vigilancia</option>
              <option value="DELIVERY">📦 Paquetería en Caseta</option>
              <option value="NOTICE">📢 Comunicados y Avisos</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="GRANTED">🟢 Accesos Autorizados</option>
              <option value="REJECTED">🔴 Accesos Denegados</option>
              <option value="IN_TRANSIT">🟡 Servicios En Tránsito</option>
              <option value="COMPLETED">⚪ Servicios Concluidos</option>
              <option value="OPEN">🚨 Incidencias Abiertas</option>
              <option value="RESOLVED">🔵 Incidencias Resueltas</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-center">
            {(category !== 'ALL' || statusFilter !== 'ALL' || search || period !== 'TODAY') && (
              <button
                type="button"
                onClick={() => {
                  setCategory('ALL');
                  setStatusFilter('ALL');
                  setSearch('');
                  handlePeriodChange('TODAY');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Event Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Registros Encontrados
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {events.length} {events.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Cargando bitácora de auditoría...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Sin eventos en este periodo</p>
            <p className="text-xs text-slate-400 mt-1">
              No se registraron accesos, servicios ni incidencias con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Evento / Descripción</th>
                  <th className="px-4 py-3">Domicilio / Destino</th>
                  <th className="px-4 py-3">Placas</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => {
                  const Icon = getEventIcon(event.category, event.eventType, event.isGranted);
                  return (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {new Date(event.createdAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(event.createdAt).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 rounded bg-slate-100">{Icon}</div>
                          {getCategoryBadge(event.category)}
                        </div>
                      </td>

                      {/* Event Title & Description */}
                      <td className="px-4 py-3 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900 leading-snug">
                          {event.title}
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                          {event.description}
                        </div>
                        {event.notes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            {event.notes}
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3">
                        {event.propertyAddress ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]" title={event.propertyAddress}>
                              {event.propertyAddress}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">N/A</span>
                        )}
                      </td>

                      {/* Plates */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {event.vehiclePlates ? (
                          <span className="font-mono font-bold bg-slate-900 text-yellow-300 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                            {event.vehiclePlates}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(event.status, event.isGranted)}
                      </td>

                      {/* Actor / Guard */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{event.actorName || 'Sistema'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
