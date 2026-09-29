'use client';

import type { FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@dommia/ui';
import type { ManualVisitCandidate } from '../types';

interface ManualVisitPanelProps {
  isOnline: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  candidates: ManualVisitCandidate[];
  selected: ManualVisitCandidate | null;
  busy: boolean;
  authorizationBusy: boolean;
  error: string;
  message: string;
  identityVerified: boolean;
  onIdentityVerifiedChange: (value: boolean) => void;
  callConfirmed: boolean;
  onCallConfirmedChange: (value: boolean) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSelect: (candidate: ManualVisitCandidate) => void;
  onAuthorize: () => void;
}

export function ManualVisitPanel({
  isOnline, query, onQueryChange, candidates, selected, busy, authorizationBusy,
  error, message, identityVerified, onIdentityVerifiedChange, callConfirmed,
  onCallConfirmedChange, onSearch, onSelect, onAuthorize,
}: ManualVisitPanelProps) {
  return (
    <section className="manual-panel" aria-labelledby="manual-title">
      <div className="panel-heading">
        <span className="panel-index">02 / ALTERNATIVA</span>
        <h2 id="manual-title">Visitante sin QR</h2>
        <p>Busca una visita programada por domicilio o nombre. Verifica la INE y confirma la autorización por llamada antes de registrar el ingreso.</p>
      </div>
      <form className="manual-visit-search" onSubmit={onSearch}>
        <label htmlFor="manual-visit-query">Domicilio, lote o nombre del visitante</label>
        <div className="manual-visit-search-row">
          <input id="manual-visit-query" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Ej. Circuito del Roble 101" minLength={2} maxLength={120} required disabled={!isOnline || busy || authorizationBusy} />
          <Button variant="dark-outline" size="md" type="submit" disabled={!isOnline || busy || authorizationBusy || query.trim().length < 2} isLoading={busy}>Buscar visita</Button>
        </div>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="delivery-success" role="status">{message}</p>}

      {candidates.length > 0 && <div className="manual-visit-candidates" aria-label="Visitas programadas encontradas">
        {candidates.map((candidate) => <article key={candidate.invitationId} className={`manual-visit-card ${selected?.invitationId === candidate.invitationId ? 'manual-visit-card-selected' : ''}`}>
          <div className="manual-visit-card-heading">
            <div><strong>{candidate.visitorName}</strong><span>{candidate.propertyAddress}</span></div>
            <span className={`status-badge ${candidate.isCurrentlyValid ? 'ok' : 'pending'}`}>{candidate.isCurrentlyValid ? 'Vigente ahora' : 'Programada'}</span>
          </div>
          <p>Anfitrión: {candidate.hostName} · {candidate.passType === 'SINGLE_USE' ? '1 uso' : candidate.passType === 'TEMPORARY' ? 'Temporal' : 'Frecuente'}</p>
          {candidate.hostPhone && <a className="manual-visit-phone" href={`tel:${candidate.hostPhone.replace(/[^\d+]/g, '')}`}>Llamar a {candidate.hostPhone}</a>}
          <small>Vigencia: {new Date(candidate.validFrom).toLocaleString('es-MX')} – {new Date(candidate.validUntil).toLocaleString('es-MX')}</small>
          {candidate.notes && <small>Nota: {candidate.notes}</small>}
          <Button variant={selected?.invitationId === candidate.invitationId ? 'primary' : 'dark-outline'} size="sm" type="button" onClick={() => onSelect(candidate)} disabled={!isOnline || authorizationBusy}>Seleccionar visita</Button>
        </article>)}
      </div>}

      {selected && <div className="manual-visit-confirmation">
        <h3>Confirmar ingreso de {selected.visitorName}</h3>
        
        <button
          type="button"
          onClick={() => !(!isOnline || authorizationBusy) && onIdentityVerifiedChange(!identityVerified)}
          className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none ${
            identityVerified
              ? 'bg-emerald-950/30 border-emerald-500/70 shadow-sm shadow-emerald-900/20'
              : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              identityVerified
                ? 'bg-emerald-500 text-slate-950'
                : 'border-2 border-slate-600 bg-slate-800'
            }`}
          >
            {identityVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
          <div className="text-xs leading-relaxed">
            <strong className={`block text-xs ${identityVerified ? 'text-emerald-300' : 'text-slate-200'}`}>
              Verificación física de identificación (INE)
            </strong>
            <span className="text-slate-400 text-[11px]">
              Verifiqué visualmente la INE y el nombre coincide con la visita programada. No capturar ni guardar número o foto.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => !(!isOnline || authorizationBusy) && onCallConfirmedChange(!callConfirmed)}
          className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none ${
            callConfirmed
              ? 'bg-emerald-950/30 border-emerald-500/70 shadow-sm shadow-emerald-900/20'
              : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              callConfirmed
                ? 'bg-emerald-500 text-slate-950'
                : 'border-2 border-slate-600 bg-slate-800'
            }`}
          >
            {callConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
          <div className="text-xs leading-relaxed">
            <strong className={`block text-xs ${callConfirmed ? 'text-emerald-300' : 'text-slate-200'}`}>
              Confirmación telefónica con residente
            </strong>
            <span className="text-slate-400 text-[11px]">
              Llamé a la propiedad/anfitrión y confirmó que autoriza el ingreso en este momento.
            </span>
          </div>
        </button>

        <Button variant="primary" size="md" type="button" onClick={onAuthorize} disabled={!isOnline || authorizationBusy || !selected.isCurrentlyValid || !identityVerified || !callConfirmed} isLoading={authorizationBusy}>
          Registrar acceso manual por llamada <ArrowRight size={16} aria-hidden="true" />
        </Button>
        {!selected.isCurrentlyValid && <p className="inline-message" role="status">Esta visita todavía no está vigente; no puede autorizarse anticipadamente.</p>}
      </div>}

      <p className="secure-note"><span aria-hidden="true">●</span> Solo aparecen pases activos. INE y llamada se confirman por el guardia y quedan auditadas; no se almacena la identificación.</p>
    </section>
  );
}