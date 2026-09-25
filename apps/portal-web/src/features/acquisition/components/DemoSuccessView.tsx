'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DemoSuccessData } from '../../../types';

interface DemoSuccessViewProps {
  data: DemoSuccessData;
  onReset: () => void;
}

export const DemoSuccessView: React.FC<DemoSuccessViewProps> = ({ data, onReset }) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading mb-3">
        ¡Demostración Registrada!
      </h3>
      <p className="text-slate-300 text-base max-w-lg mx-auto mb-6">
        Gracias, <strong className="text-white">{data.name}</strong>. Hemos registrado tu solicitud para{' '}
        <strong className="text-blue-400">{data.community_name}</strong>. Un especialista comercial de Dommia se pondrá en contacto contigo para agendar tu sesión privada en vivo.
      </p>
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto text-left text-xs space-y-1.5 mb-8">
        <p className="text-slate-400">
          <span className="font-semibold text-slate-200">Folio Privado:</span>{' '}
          <span className="font-mono text-blue-400">{data.id}</span>
        </p>
        <p className="text-slate-400">
          <span className="font-semibold text-slate-200">Comunidad:</span> {data.community_name} ({data.estimated_houses} casas)
        </p>
        <p className="text-slate-400">
          <span className="font-semibold text-slate-200">Etapa en CRM:</span>{' '}
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase text-[10px]">
            {data.stage}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 cursor-pointer"
      >
        Registrar otra demostración
      </button>
    </div>
  );
};
