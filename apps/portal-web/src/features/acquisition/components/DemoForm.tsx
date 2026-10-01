'use client';

import React from 'react';
import { Send, Loader2, Phone, Mail, Building, User } from 'lucide-react';
import { DemoFormData } from '../../../types';
import { Button } from '@dommia/ui';

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
    <form onSubmit={onSubmit} className="space-y-6">
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
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
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
            Correo Electrónico *
          </label>
          <div className="relative">
            <Mail className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              placeholder="carlos@residencial.com"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
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
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
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
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
            Notas o inquietudes para la sesión de demostración
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
            placeholder="Ej. Quisiéramos revisar la facturación automatizada CFDI y la sincronización con nuestras plumas vehiculares."
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none shadow-inner"
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="w-full !py-4 font-bold text-sm shadow-xl shadow-blue-600/25 cursor-pointer disabled:opacity-50"
        rightIcon={
          loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )
        }
      >
        {loading ? 'Agendando demostración privada...' : 'Solicitar Demostración Guiada'}
      </Button>
    </form>
  );
};
