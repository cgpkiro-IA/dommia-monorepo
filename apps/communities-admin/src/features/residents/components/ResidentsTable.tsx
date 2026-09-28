'use client';

import React from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Resident } from '@/types';
import { ResidentTableRow } from './ResidentTableRow';
import type { InviteContactMethod, InviteDelivery } from '../hooks/useResidents';

interface ResidentsTableProps {
  residents: Resident[];
  allResidents: Resident[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterRole: 'ALL' | 'OWNER' | 'TENANT' | 'FAMILY_MEMBER';
  onFilterRoleChange: (role: 'ALL' | 'OWNER' | 'TENANT' | 'FAMILY_MEMBER') => void;
  propertyFilter: string | null;
  onClearPropertyFilter: () => void;
  onRefresh: () => void;
  onOpenAdd: () => void;
  onOpenEdit: (r: Resident) => void;
  onDelete: (id: string, name: string) => void;
  onAddVehicleToResident: (propertyId: string, residentId: string) => void;
  selectedResidentIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onInvite: (ids: string[] | 'ALL', contactMethod: InviteContactMethod, delivery: InviteDelivery) => void;
  notificationsPremium: boolean;
  invitationResults: any[];
  error?: string | null;
}

export function ResidentsTable({
  residents,
  allResidents,
  loading,
  searchQuery,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  propertyFilter,
  onClearPropertyFilter,
  onRefresh,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onAddVehicleToResident,
  selectedResidentIds,
  onSelectionChange,
  onInvite,
  invitationResults,
  notificationsPremium,
  error,
}: ResidentsTableProps) {
  const residentAppUrl = (process.env.NEXT_PUBLIC_RESIDENT_APP_URL || 'http://localhost:3003').replace(/\/$/, '');
  const getActivationUrl = (token: string, tenantSlug?: string) => `${residentAppUrl}/activate-resident?token=${encodeURIComponent(token)}${tenantSlug ? `&tenant=${encodeURIComponent(tenantSlug)}` : ''}`;
  const [inviteContactMethod, setInviteContactMethod] = React.useState<InviteContactMethod>('AUTO');
  const [inviteDelivery, setInviteDelivery] = React.useState<InviteDelivery>('NONE');
  const ownersCount = allResidents.filter((r) => r.role === 'OWNER').length;
  const tenantsCount = allResidents.filter((r) => r.role === 'TENANT').length;
  const familyCount = allResidents.filter((r) => r.role === 'FAMILY_MEMBER').length;
  const allVisibleSelected = residents.length > 0 && residents.every((r) => selectedResidentIds.includes(r.id));

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
      {/* Header & Toolbar */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 font-heading">
              Padrón de Residentes e Inquilinos
            </h3>
            {propertyFilter && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1">
                <span>Filtrado por vivienda</span>
                <button
                  type="button"
                  onClick={onClearPropertyFilter}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Control de propietarios, arrendatarios y residentes con credenciales habilitadas para la App Dommia Resident.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700">Acceso por<select value={inviteContactMethod} onChange={(event) => setInviteContactMethod(event.target.value as InviteContactMethod)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-800"><option value="AUTO">Automático</option><option value="EMAIL">Correo</option><option value="PHONE">Celular</option></select></label>
          {notificationsPremium && <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700">Enviar por<select value={inviteDelivery} onChange={(event) => setInviteDelivery(event.target.value as InviteDelivery)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-800"><option value="NONE">Solo enlace</option><option value="EMAIL">Correo</option><option value="WHATSAPP">WhatsApp</option></select></label>}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refrescar padrón"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Residente</span>
          </button>
          <button
            type="button"
            onClick={() => onInvite('ALL', inviteContactMethod, inviteDelivery)}
            className="rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-[11px] font-black text-indigo-700 hover:bg-indigo-50"
          >
            Invitar a todos
          </button>
        </div>
      </div>

      {selectedResidentIds.length > 0 && (
        <div className="flex items-center justify-between border-t border-indigo-100 bg-indigo-50 px-6 py-3">
          <div className="flex items-center gap-3"><span className="text-xs font-bold text-indigo-900">{selectedResidentIds.length} residente(s) seleccionado(s)</span><label className="flex items-center gap-2 text-[11px] font-bold text-indigo-900">Acceso por<select value={inviteContactMethod} onChange={(event) => setInviteContactMethod(event.target.value as InviteContactMethod)} className="rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-[11px] text-indigo-900"><option value="AUTO">Automático</option><option value="EMAIL">Correo</option><option value="PHONE">Celular</option></select></label>{notificationsPremium && <label className="flex items-center gap-2 text-[11px] font-bold text-indigo-900">Enviar por<select value={inviteDelivery} onChange={(event) => setInviteDelivery(event.target.value as InviteDelivery)} className="rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-[11px] text-indigo-900"><option value="NONE">Solo enlace</option><option value="EMAIL">Correo</option><option value="WHATSAPP">WhatsApp</option></select></label>}</div>
          <button type="button" onClick={() => onInvite(selectedResidentIds, inviteContactMethod, inviteDelivery)} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-black text-white">
            Generar invitaciones
          </button>
        </div>
      )}

      {error && <div role="alert" className="border-t border-rose-200 bg-rose-50 px-6 py-3 text-xs font-semibold text-rose-800">{error}</div>}

      {invitationResults.length > 0 && (
        <div className="space-y-2 border-t border-emerald-100 bg-emerald-50 px-6 py-4">
          <div className="flex items-center justify-between"><p className="text-xs font-black text-emerald-900">Enlaces de activación generados</p><button type="button" onClick={() => navigator.clipboard.writeText(invitationResults.map((item) => `${item.residentName}: ${getActivationUrl(item.activationToken, item.tenantSlug)}`).join('\n'))} className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[10px] font-bold text-emerald-700">Copiar todos</button></div>
          {invitationResults.map((item) => <div key={item.residentId} className="flex flex-col gap-1 rounded-lg border border-emerald-100 bg-white p-2 text-[11px] sm:flex-row sm:items-center sm:justify-between"><span className="font-bold text-slate-800">{item.residentName} · {item.contactMethod === 'PHONE' ? `Celular: ${item.loginIdentifier}` : `Correo: ${item.loginIdentifier}`}</span><button type="button" onClick={() => navigator.clipboard.writeText(getActivationUrl(item.activationToken, item.tenantSlug))} className="text-left font-mono text-emerald-700 hover:underline">Copiar enlace</button></div>)}
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o dirección..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => onFilterRoleChange('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterRole === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({allResidents.length})
          </button>
          <button
            type="button"
            onClick={() => onFilterRoleChange('OWNER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterRole === 'OWNER'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Propietarios ({ownersCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterRoleChange('TENANT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterRole === 'TENANT'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inquilinos ({tenantsCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterRoleChange('FAMILY_MEMBER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterRole === 'FAMILY_MEMBER'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Familiares ({familyCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-5"><input type="checkbox" checked={allVisibleSelected} onChange={(event) => onSelectionChange(event.target.checked ? residents.map((r) => r.id) : [])} aria-label="Seleccionar residentes visibles" /></th>
              <th className="py-3 px-5">Residente</th>
              <th className="py-3 px-5">Vivienda Asignada</th>
              <th className="py-3 px-5">Clasificación / Rol</th>
              <th className="py-3 px-5">Contacto & App Dommia</th>
              <th className="py-3 px-5">Estatus</th>
              <th className="py-3 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {residents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No se encontraron residentes</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Haz clic en &quot;Registrar Residente&quot; para dar de alta al primer habitante.
                  </p>
                </td>
              </tr>
            ) : (
              residents.map((r) => (
                <ResidentTableRow
                  key={r.id}
                  resident={r}
                  selected={selectedResidentIds.includes(r.id)}
                  onSelect={(selected) => onSelectionChange(selected ? [...new Set([...selectedResidentIds, r.id])] : selectedResidentIds.filter((id) => id !== r.id))}
                  onOpenEdit={onOpenEdit}
                  onDelete={onDelete}
                  onAddVehicleToResident={onAddVehicleToResident}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
