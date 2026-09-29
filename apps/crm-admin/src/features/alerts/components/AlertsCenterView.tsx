'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Send,
  ShieldAlert,
  Bot,
  Info,
  Check,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { CrmAlert, useCrmAlerts } from '../hooks/useCrmAlerts';
import { TelegramConfigModal } from './TelegramConfigModal';
import { ClientErrorCard } from '@dommia/ui';

interface AlertsCenterViewProps {
  alertsState: ReturnType<typeof useCrmAlerts>;
}

export function AlertsCenterView({ alertsState }: AlertsCenterViewProps) {
  const {
    alerts,
    summary,
    telegramConfig,
    loading,
    error,
    actionBusy,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    refresh,
    acknowledgeAlert,
    resolveAlert,
    saveTelegramConfig,
    testTelegramAlert,
  } = alertsState;

  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleConfirmResolve = async (id: string) => {
    await resolveAlert(id, resolutionNotes);
    setResolvingAlertId(null);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider">
              Centro de Monitoreo & Alertas
            </span>
            <span className="text-xs text-slate-500 font-mono">SaaS Platform Operations</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Centro de Alertas & Incidentes Globales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección de fallos en canales, anomalías operativas y despacho en tiempo real a Telegram.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTelegramModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <Bot className={`w-4 h-4 ${telegramConfig?.enabled ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Bot de Telegram</span>
            {telegramConfig?.enabled ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Inactivo</span>
            )}
          </button>

          <button
            onClick={refresh}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Alertas Activas</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{summary?.active_count || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Requieren atención del equipo</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Críticas Activas</p>
          <p className="text-3xl font-black text-rose-600 mt-1">{summary?.critical_active || 0}</p>
          <p className="text-[11px] text-rose-400 mt-1">Alta prioridad e impacto</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Advertencias</p>
          <p className="text-3xl font-black text-amber-600 mt-1">{summary?.warning_active || 0}</p>
          <p className="text-[11px] text-amber-500 mt-1">Canales o latencias degradadas</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Resueltas</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{summary?.resolved_count || 0}</p>
          <p className="text-[11px] text-emerald-500 mt-1">Incidentes solucionados</p>
        </div>
      </div>

      {/* Telegram Status Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        telegramConfig?.enabled
          ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
          : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${
            telegramConfig?.enabled
              ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs font-bold text-white">Canal de Notificaciones Telegram</strong>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                telegramConfig?.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {telegramConfig?.enabled ? 'Activo y despachando' : 'Configuración pendiente'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {telegramConfig?.enabled
                ? `Conectado al Chat/Grupo ID ${telegramConfig.chatId}. Las alertas se despachan automáticamente.`
                : 'Configura el Bot de Telegram de tu equipo para recibir alertas instantáneas en tu smartphone.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsTelegramModalOpen(true)}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          {telegramConfig?.enabled ? 'Editar Configuración' : 'Configurar Bot'}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Estado:</span>
          </span>
          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st === 'ALL' ? 'Todas' : st === 'ACTIVE' ? 'Activas' : st === 'ACKNOWLEDGED' ? 'Reconocidas' : 'Resueltas'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Severidad:</span>
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                severityFilter === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-rose-600 text-white'
                    : sev === 'WARNING'
                    ? 'bg-amber-600 text-white'
                    : sev === 'INFO'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {sev === 'ALL' ? 'Todas' : sev === 'CRITICAL' ? '🔴 Crítica' : sev === 'WARNING' ? '🟡 Advertencia' : '🔵 Info'}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {error && alerts.length === 0 ? (
          <div className="p-4">
            <ClientErrorCard error={error} onRetry={refresh} />
          </div>
        ) : loading && alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            <p className="text-xs">Consultando bandeja de incidentes...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">¡Todo operando con normalidad!</h4>
            <p className="text-xs text-slate-400">No hay alertas que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
            const isResolved = alert.status === 'RESOLVED';
            const isAcknowledged = alert.status === 'ACKNOWLEDGED';

            const cardBorder = isResolved
              ? 'border-slate-200 bg-white/70 opacity-80'
              : isCritical
              ? 'border-rose-300 bg-rose-50/50 shadow-md'
              : isWarning
              ? 'border-amber-300 bg-amber-50/50 shadow-sm'
              : 'border-blue-200 bg-blue-50/50';

            const badgeBg = isCritical
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : isWarning
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-blue-100 text-blue-800 border-blue-300';

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all ${cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider border ${badgeBg}`}>
                      {alert.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                      {alert.category}
                    </span>
                    {alert.tenantSlug && (
                      <span className="text-xs text-slate-600 font-bold flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{alert.tenantSlug}</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(alert.createdAt).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{alert.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>

                  {/* Acknowledged / Resolved status metadata */}
                  {(isAcknowledged || isResolved) && (
                    <div className="pt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-3 border-t border-slate-200/60 mt-2">
                      {isAcknowledged && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3 h-3" />
                          Reconocida por: <strong>{alert.acknowledgedBy}</strong>
                        </span>
                      )}
                      {isResolved && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Resuelta por: <strong>{alert.resolvedBy}</strong> {alert.resolutionNotes ? `("${alert.resolutionNotes}")` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isResolved && (
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        disabled={actionBusy === alert.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Reconocer</span>
                      </button>
                    )}

                    {resolvingAlertId === alert.id ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <input
                          type="text"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Nota de solución..."
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-emerald-500 w-40"
                        />
                        <button
                          onClick={() => handleConfirmResolve(alert.id)}
                          disabled={actionBusy === alert.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setResolvingAlertId(null)}
                          className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingAlertId(alert.id)}
                        disabled={actionBusy === alert.id}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolver</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Telegram Configuration Modal */}
      <TelegramConfigModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        config={telegramConfig}
        onSave={saveTelegramConfig}
        onTest={testTelegramAlert}
      />
    </div>
  );
}
