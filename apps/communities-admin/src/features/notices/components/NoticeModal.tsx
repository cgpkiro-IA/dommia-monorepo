'use client';

import React from 'react';
import { NoticeFormData, NoticeCategory, NoticePriority } from '@/types';
import { X, Bell, Pin } from 'lucide-react';

interface NoticeModalProps {
  isOpen: boolean;
  isEditing: boolean;
  form: NoticeFormData;
  onChange: (field: keyof NoticeFormData, value: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

export function NoticeModal({
  isOpen,
  isEditing,
  form,
  onChange,
  onSubmit,
  onClose,
  loading,
  error,
}: NoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {isEditing ? 'Editar Comunicado' : 'Publicar Nuevo Comunicado'}
              </h3>
              <p className="text-xs text-slate-500">
                Difusión oficial hacia Dommia Resident PWA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título del Comunicado *
            </label>
            <input
              type="text"
              placeholder="Ej. Convocatoria a Asamblea General Extraordinaria"
              value={form.title}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoría *
              </label>
              <select
                value={form.category}
                onChange={(e) => onChange('category', e.target.value as NoticeCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="GENERAL">General</option>
                <option value="URGENT">Urgente</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="ASSEMBLY">Asamblea</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prioridad *
              </label>
              <select
                value={form.priority}
                onChange={(e) => onChange('priority', e.target.value as NoticePriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Firma o Emisor
            </label>
            <input
              type="text"
              placeholder="Ej. Mesa Directiva 2026-2027"
              value={form.author_name}
              onChange={(e) => onChange('author_name', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mensaje o Cuerpo del Comunicado *
            </label>
            <textarea
              rows={4}
              placeholder="Escribe el texto detallado de la circular para los residentes..."
              value={form.content}
              onChange={(e) => onChange('content', e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(e) => onChange('is_pinned', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-blue-600" />
                Fijar en parte superior
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => onChange('is_published', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Publicar inmediatamente</span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Publicar Ahora'}
          </button>
        </div>
      </div>
    </div>
  );
}
