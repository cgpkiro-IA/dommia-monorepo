'use client';

import React from 'react';
import {
  Home,
  Users,
  Car,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Property, Metrics } from '@/types';

interface PropertiesTableProps {
  properties: Property[];
  allPropertiesCount: number;
  metrics: Metrics | null;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterDelinquent: 'ALL' | 'UP_TO_DATE' | 'DELINQUENT';
  onFilterChange: (filter: 'ALL' | 'UP_TO_DATE' | 'DELINQUENT') => void;
  onRefresh: () => void;
  onOpenAdd: () => void;
  onOpenEdit: (p: Property) => void;
  onDelete: (id: string, street: string, num: string) => void;
  onFilterResidentsByProperty: (propertyId: string) => void;
  onFilterVehiclesByProperty: (propertyId: string) => void;
  onAddResidentToProperty: (propertyId: string) => void;
  onAddVehicleToProperty: (propertyId: string) => void;
}

export function PropertiesTable({
  properties,
  allPropertiesCount,
  metrics,
  loading,
  searchQuery,
  onSearchChange,
  filterDelinquent,
  onFilterChange,
  onRefresh,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onFilterResidentsByProperty,
  onFilterVehiclesByProperty,
  onAddResidentToProperty,
  onAddVehicleToProperty,
}: PropertiesTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
      {/* Header & Toolbar */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 font-heading">
            Catálogo de Viviendas y Lotes
          </h3>
          <p className="text-xs text-slate-500">
            Inventario de residencias con asignación de titular, residentes y vehículos asociados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenAdd}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              metrics?.isLimitReached
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{metrics?.isLimitReached ? 'Límite Duro (Upgrade)' : 'Registrar Vivienda'}</span>
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
            placeholder="Buscar por calle, número exterior, manzana, lote o titular..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => onFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterDelinquent === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({allPropertiesCount})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('UP_TO_DATE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterDelinquent === 'UP_TO_DATE'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Al Corriente ({metrics?.upToDateCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('DELINQUENT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterDelinquent === 'DELINQUENT'
                ? 'bg-red-600 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Morosas ({metrics?.delinquentCount ?? 0})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-5">Calle y Número</th>
              <th className="py-3 px-5">Titular Principal</th>
              <th className="py-3 px-5">Población & Vehículos</th>
              <th className="py-3 px-5">Estatus Financiero</th>
              <th className="py-3 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Home className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No se encontraron propiedades</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {searchQuery
                      ? 'Intenta con otro término de búsqueda.'
                      : 'Haz clic en "Registrar Vivienda" para agregar la primera propiedad.'}
                  </p>
                </td>
              </tr>
            ) : (
              properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 text-sm">
                      {prop.street} #{prop.exterior_number}
                      {prop.interior_number && (
                        <span className="text-slate-500 font-normal ml-1">
                          (Int. {prop.interior_number})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {prop.block || prop.lot ? `${prop.block || ''} • ${prop.lot || ''}` : 'Ubicación sin manzana/lote'}
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    {prop.primary_resident_name ? (
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">
                          {prop.primary_resident_name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {prop.primary_resident_phone || prop.primary_resident_email || 'Sin contacto directo'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Sin titular asignado
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onFilterResidentsByProperty(prop.id)}
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ver habitantes de esta vivienda"
                      >
                        <Users className="w-3 h-3" />
                        <span>{prop.residents_count || 0} Residentes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onFilterVehiclesByProperty(prop.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ver vehículos de esta vivienda"
                      >
                        <Car className="w-3 h-3" />
                        <span>{prop.vehicles_count || 0} Autos</span>
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    {prop.is_delinquent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        <span>Moroso (Adeudo)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Al Corriente</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAddResidentToProperty(prop.id)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                        title="Agregar habitante a esta casa"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddVehicleToProperty(prop.id)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                        title="Registrar vehículo para esta casa"
                      >
                        <Car className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEdit(prop)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="Editar vivienda"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(prop.id, prop.street, prop.exterior_number)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                        title="Eliminar vivienda y liberar espacio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
