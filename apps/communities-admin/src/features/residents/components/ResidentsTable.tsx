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
}: ResidentsTableProps) {
  const ownersCount = allResidents.filter((r) => r.role === 'OWNER').length;
  const tenantsCount = allResidents.filter((r) => r.role === 'TENANT').length;
  const familyCount = allResidents.filter((r) => r.role === 'FAMILY_MEMBER').length;

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
        </div>
      </div>

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
                <td colSpan={6} className="py-12 text-center text-slate-400">
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
