'use client';

import React from 'react';
import { Loader2, Zap, Building, User, Mail, Globe } from 'lucide-react';
import { SelfServiceFormData, TierKey } from '../../../types';
import { DomainPolicyBox } from './DomainPolicyBox';
import { Button } from '@dommia/ui';

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
    <form onSubmit={onSubmit} className="space-y-6">
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
            Nombre del Fraccionamiento / Residencial *
          </label>
          <div className="relative">
            <Building className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={formData.communityName}
              onChange={(e) => onCommunityNameChange(e.target.value)}
              placeholder="Residencial Los Laureles"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Subdomain Slug */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
            {process.env.NEXT_PUBLIC_PORTAL_STATIC_MODE === '1' ? 'ID / Enlace Web Solicitado *' : 'ID / Enlace Web Asignado *'}
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
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Admin Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
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
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Admin Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-heading">
            {process.env.NEXT_PUBLIC_PORTAL_STATIC_MODE === '1' ? 'Correo de contacto del administrador *' : 'Correo de Acceso del Administrador *'}
          </label>
          <div className="relative">
            <Mail className="absolute inset-y-0 left-3.5 my-auto w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => onFormChange({ ...formData, adminEmail: e.target.value })}
              placeholder="admin@loslaureles.com"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
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

      <Button
        type="submit"
        variant="success"
        size="lg"
        disabled={loading}
        className="w-full !py-4 font-bold text-sm shadow-xl shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
        rightIcon={
          loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )
        }
      >
        {loading
          ? 'Solicitando Activación...'
          : 'Solicitar Activación'}
      </Button>
    </form>
  );
};
