'use client';

import React from 'react';
import { CommunityNotice, NoticeCategory } from '@/types';
import { Plus, Search, Pin, AlertTriangle, Wrench, Users, Bell, Trash2, Edit2 } from 'lucide-react';

interface NoticesTableProps {
  notices: CommunityNotice[];
  allNoticesCount: number;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterCategory: 'ALL' | NoticeCategory;
  onFilterCategory: (c: 'ALL' | NoticeCategory) => void;
  onOpenAdd: () => void;
  onOpenEdit: (notice: CommunityNotice) => void;
  onDelete: (id: string, title: string) => void;
}

export function NoticesTable({
  notices,
  allNoticesCount,
  loading,
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterCategory,
  onOpenAdd,
  onOpenEdit,
  onDelete,
}: NoticesTableProps) {
  const getCategoryBadge = (category: NoticeCategory) => {
    switch (category) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Urgente
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Wrench className="w-3 h-3" /> Mantenimiento
          </span>
        );
      case 'ASSEMBLY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Users className="w-3 h-3" /> Asamblea
          </span>
        );
      case 'GUARD_CONSIGN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            🛡️ Consigna Caseta
          </span>
        );
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            🚨 Seguridad
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Bell className="w-3 h-3" /> General
          </span>
        );
    }
  };

  const getAudienceBadge = (audience?: string) => {
    switch (audience) {
      case 'GUARDS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            🛡️ Solo Caseta
          </span>
        );
      case 'RESIDENTS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            🏠 Residentes
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            👥 Todos
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Comunicados & Circulares Oficiales
            <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-200">
              {allNoticesCount}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Avisos publicados visibles de forma instantánea en Dommia Resident PWA
          </p>
        </div>

        <button
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Publicar Comunicado
        </button>
      </div>

      {/* Filters row */}
      <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, contenido o autor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          {(['ALL', 'URGENT', 'MAINTENANCE', 'ASSEMBLY', 'GENERAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {cat === 'ALL' ? 'Todos' : cat === 'URGENT' ? 'Urgentes' : cat === 'MAINTENANCE' ? 'Mantenimiento' : cat === 'ASSEMBLY' ? 'Asambleas' : 'Generales'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Comunicado</th>
              <th className="py-3 px-4">Audiencia</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Prioridad</th>
              <th className="py-3 px-4">Publicado Por</th>
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  Cargando comunicados...
                </td>
              </tr>
            ) : notices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  No hay comunicados registrados con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              notices.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      {n.is_pinned && <Pin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 fill-blue-600" />}
                      <div>
                        <div className="font-semibold text-slate-900">{n.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-sm mt-0.5">{n.content}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getAudienceBadge(n.target_audience)}</td>
                  <td className="py-3 px-4">{getCategoryBadge(n.category)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium ${n.priority === 'HIGH' ? 'text-rose-600' : n.priority === 'MEDIUM' ? 'text-amber-600' : 'text-slate-500'}`}>
                      {n.priority === 'HIGH' ? 'Alta' : n.priority === 'MEDIUM' ? 'Media' : 'Baja'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-700">{n.author_name}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(n.published_at || n.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenEdit(n)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(n.id, n.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
