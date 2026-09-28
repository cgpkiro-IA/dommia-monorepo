'use client';

import React from 'react';
import { Car, Plus, RefreshCw, Search, X, Edit2, Trash2 } from 'lucide-react';
import { Vehicle } from '@/types';

interface VehiclesTableProps {
  vehicles: Vehicle[];
  allVehiclesCount: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  propertyFilter: string | null;
  onClearPropertyFilter: () => void;
  loading: boolean;
  onRefresh: () => void;
  onOpenAdd: () => void;
  onOpenEdit: (v: Vehicle) => void;
  onDelete: (id: string, plates: string) => void;
}

export function VehiclesTable({
  vehicles,
  allVehiclesCount,
  searchQuery,
  onSearchChange,
  propertyFilter,
  onClearPropertyFilter,
  loading,
  onRefresh,
  onOpenAdd,
  onOpenEdit,
  onDelete,
}: VehiclesTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
      {/* Header & Toolbar */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 font-heading">
              Registro y Control Vehicular
            </h3>
            {propertyFilter && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
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
            Padrón de autos autorizados para acceso vehicular automatizado y lectura RFID UHF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refrescar vehículos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Vehículo</span>
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
            placeholder="Buscar por placas, marca, modelo, color o conductor..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <strong>{vehicles.length}</strong> de {allVehiclesCount} vehículos
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-5">Placas Vehiculares</th>
              <th className="py-3 px-5">Vehículo (Marca & Modelo)</th>
              <th className="py-3 px-5">Color</th>
              <th className="py-3 px-5">Vivienda Asignada</th>
              <th className="py-3 px-5">Residente Asignado</th>
              <th className="py-3 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Car className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No se encontraron vehículos</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Haz clic en &quot;Registrar Vehículo&quot; para asociar el primer automóvil a una vivienda.
                  </p>
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border-2 border-slate-800 shadow-xs font-mono font-black text-slate-900 text-xs tracking-wider">
                      <span className="text-[9px] text-blue-600 font-sans font-bold">MEX</span>
                      <span>{v.plates}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 text-sm">
                      {v.brand || 'Vehículo'} {v.model || ''}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {v.id.slice(0, 8)}...
                    </span>
                  </td>

                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                      <span className="w-2 h-2 rounded-full border border-slate-300 bg-slate-500" />
                      <span>{v.color || 'No especificado'}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-slate-800">
                      {v.street} #{v.exterior_number}
                      {v.interior_number && ` (Int. ${v.interior_number})`}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {v.block || v.lot ? `${v.block || ''} • ${v.lot || ''}` : 'Vivienda'}
                    </div>
                  </td>

                  <td className="py-3.5 px-5">
                    {v.resident_first_name ? (
                      <span className="font-bold text-slate-800 text-xs">
                        {v.resident_first_name} {v.resident_last_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Uso general de la casa
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenEdit(v)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="Editar vehículo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(v.id, v.plates)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                        title="Eliminar vehículo"
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
