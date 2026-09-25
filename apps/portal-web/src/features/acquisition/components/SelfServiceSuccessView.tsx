'use client';

import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { SelfServiceSuccessData } from '../../../types';

interface SelfServiceSuccessViewProps {
  data: SelfServiceSuccessData;
}

export const SelfServiceSuccessView: React.FC<SelfServiceSuccessViewProps> = ({ data }) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mb-2">
        ¡Tu Fraccionamiento ha Sido Activado!
      </h3>
      <p className="text-slate-300 text-sm max-w-lg mx-auto mb-6">
        Se ha aprovisionado exitosamente tu esquema en PostgreSQL y tu cuenta de Administrador Maestro está lista para operar.
      </p>

      <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 max-w-lg mx-auto text-left text-xs space-y-2.5 mb-8 shadow-xl">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="font-semibold text-slate-300">URL Oficial de Acceso:</span>
          <a
            href={data.portalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1"
          >
            <span>https://{data.accessUrl || data.subdomain}</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Modalidad de Dominio:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            data.hasCustomDomain 
              ? 'bg-purple-950 text-purple-300 border border-purple-800' 
              : 'bg-blue-950 text-blue-300 border border-blue-800'
          }`}>
            {data.hasCustomDomain ? 'Subdominio Propio Personalizado' : 'Dominio Estándar Compartido'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">PostgreSQL Schema:</span>
          <span className="font-mono text-emerald-400">tenant_{data.slug}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Administrador:</span>
          <span className="text-white font-semibold">{data.adminEmail}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Plan Activado:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
            {data.tier} ({data.maxProperties} casas)
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-slate-400">Estatus en CRM:</span>
          <span className="font-bold text-emerald-400 uppercase">Cierre Ganado (WON)</span>
        </div>
      </div>

      <a
        href="http://localhost:3001"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/30"
      >
        <span>Ver en Dommia CRM</span>
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
};
