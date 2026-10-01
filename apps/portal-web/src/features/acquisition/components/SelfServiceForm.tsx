'use client';

import React from 'react';
import { Loader2, Zap, Building, User, Mail, Lock, Globe } from 'lucide-react';
import { SelfServiceFormData, TierKey } from '../../../types';
import { DomainPolicyBox } from './DomainPolicyBox';
import { PaymentSimulatorBox } from './PaymentSimulatorBox';

interface SelfServiceFormProps {
  formData: SelfServiceFormData;
  tierKey: TierKey;
  estimatedPrice?: string;
  loading: boolean;
  onFormChange: (data: SelfServiceFormData) => void;
  onCommunityNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SelfServiceForm: React.FC<SelfServiceFormProps> = ({
  formData,
  tierKey,
  estimatedPrice,
  loading,
  onFormChange,
  onCommunityNameChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Invisible Honeypot */}
      <input
        type="text"
        name="website_anti_bot_trap_provision"
        value={formData.honeypot}
        onChange={(e) => onFormChange({ ...formData, honeypot: e.target.value })}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Community Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Nombre del Fraccionamiento / Condominio *
          </label>
          <div className="relative">
            <Building className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={formData.communityName}
              onChange={(e) => onCommunityNameChange(e.target.value)}
              placeholder="Residencial Los Laureles"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Subdomain Slug */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            ID / Enlace Único del Condominio *
          </label>
          <div className="relative">
            <Globe className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                onFormChange({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                })
              }
              placeholder="los_laureles"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Admin Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Nombre del Administrador Maestro *
          </label>
          <div className="relative">
            <User className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => onFormChange({ ...formData, adminName: e.target.value })}
              placeholder="Lic. Laura Villarreal"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Admin Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Correo de Acceso del Administrador *
          </label>
          <div className="relative">
            <Mail className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => onFormChange({ ...formData, adminEmail: e.target.value })}
              placeholder="admin@loslaureles.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Admin Password */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Contraseña Maestra para Dommia Communities * (Mínimo 8 caracteres)
          </label>
          <div className="relative">
            <Lock className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={formData.adminPassword}
              onChange={(e) => onFormChange({ ...formData, adminPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Domain Policy Box */}
      <DomainPolicyBox
        slug={formData.slug}
        hasCustomDomain={formData.hasCustomDomain}
        tierKey={tierKey}
        onCustomDomainChange={(hasCustom) => onFormChange({ ...formData, hasCustomDomain: hasCustom })}
      />

      {/* Payment Simulator Box */}
      <PaymentSimulatorBox
        hasCustomDomain={formData.hasCustomDomain}
        tierKey={tierKey}
        estimatedPrice={estimatedPrice}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Aprovisionando Schema y Cuenta Maestra...</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>Confirmar Pago y Activar Fraccionamiento</span>
          </>
        )}
      </button>
    </form>
  );
};
