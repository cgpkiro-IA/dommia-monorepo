'use client';

import React from 'react';
import { Send, Loader2, Phone, Mail, Building, User } from 'lucide-react';
import { DemoFormData } from '../../../types';

interface DemoFormProps {
  formData: DemoFormData;
  loading: boolean;
  onFormChange: (data: DemoFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DemoForm: React.FC<DemoFormProps> = ({
  formData,
  loading,
  onFormChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Invisible Honeypot for Anti-Bot protection */}
      <input
        type="text"
        name="website_anti_bot_trap"
        value={formData.honeypot}
        onChange={(e) => onFormChange({ ...formData, honeypot: e.target.value })}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Nombre Completo *
          </label>
          <div className="relative">
            <User className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="Ing. Carlos Mendoza"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Correo Electrónico *
          </label>
          <div className="relative">
            <Mail className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              placeholder="carlos@residencia.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Teléfono / WhatsApp *
          </label>
          <div className="relative">
            <Phone className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
              placeholder="+52 55 1234 5678"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Fraccionamiento / Residencial *
          </label>
          <div className="relative">
            <Building className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={formData.communityName}
              onChange={(e) => onFormChange({ ...formData, communityName: e.target.value })}
              placeholder="Residencial Las Palmas"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Notas o preguntas para la demostración
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
            placeholder="Ej. Quisiéramos ver cómo funciona la app para colonos y si es compatible con nuestras plumas existentes."
            className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Agendando demostración privada...</span>
          </>
        ) : (
          <>
            <span>Solicitar Demostración Guiada</span>
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
