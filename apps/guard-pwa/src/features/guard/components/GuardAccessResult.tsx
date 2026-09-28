'use client';

import type { FormEvent } from 'react';
import { AlertCircle, Check, CircleHelp, CircleX } from 'lucide-react';
import { Button } from '@dommia/ui';
import { notificationText, reasonText } from '../guard-utils';
import type { ResultState } from '../types';

interface GuardAccessResultProps {
  result: ResultState;
  isOnline: boolean;
  manualJustification: string;
  onManualJustificationChange: (value: string) => void;
  manualOverrideBusy: boolean;
  manualOverrideError: string;
  onManualOverride: (event: FormEvent<HTMLFormElement>) => void;
  onNext: () => void;
}

function StatusMark({ kind }: { kind: ResultState['kind'] }) {
  const Mark = kind === 'authorized' ? Check : kind === 'review' ? AlertCircle : kind === 'denied' ? CircleX : CircleHelp;
  return <span aria-hidden="true" className={`status-mark status-mark-${kind}`}><Mark size={20} strokeWidth={2} /></span>;
}

export function GuardAccessResult({
  result, isOnline, manualJustification, onManualJustificationChange,
  manualOverrideBusy, manualOverrideError, onManualOverride, onNext,
}: GuardAccessResultProps) {
  return (
    <section className={`result-panel result-${result.kind}`} aria-live="assertive" aria-labelledby="result-title">
      <div className="result-summary">
        <StatusMark kind={result.kind} />
        <div>
          <p className="panel-index">RESULTADO DE VALIDACIÓN</p>
          <h2 id="result-title">{result.kind === 'authorized' ? 'Acceso autorizado' : result.kind === 'review' ? 'Revisión manual requerida' : result.kind === 'denied' ? 'Acceso denegado' : 'No se pudo confirmar'}</h2>
          <p>{result.kind === 'review'
            ? reasonText(result.data?.reason || 'PROPERTY_DELINQUENT')
            : result.kind === 'authorized'
              ? result.data?.manualOverride
                ? 'Acceso autorizado por excepción con justificación registrada.'
                : result.data?.manualAccess
                  ? 'Acceso manual autorizado por llamada. INE verificada y evento auditado.'
                  : 'La credencial es válida para esta visita.'
              : result.message || reasonText(result.data?.reason)}</p>
          {result.kind === 'authorized' && result.data?.notificationStatus && <p className={`notification-note notification-${result.data.notificationStatus}`} role="status">{notificationText(result.data.notificationStatus)}</p>}
        </div>
      </div>
      {result.data && <dl className="result-details">
        {result.data.visitorName && <div><dt>Visitante / residente</dt><dd>{result.data.visitorName}</dd></div>}
        {result.data.propertyAddress && <div><dt>Propiedad</dt><dd>{result.data.propertyAddress}</dd></div>}
        {!result.data.propertyAddress && result.data.propertyId && <div><dt>Propiedad</dt><dd>{result.data.propertyId}</dd></div>}
        {result.data.hostName && <div><dt>Anfitrión</dt><dd>{result.data.hostName}</dd></div>}
        {result.data.manualAccess && <div><dt>Método</dt><dd>Sin QR · llamada confirmada</dd></div>}
        {result.data.justification && <div><dt>Justificación registrada</dt><dd>{result.data.justification}</dd></div>}
        {result.kind === 'denied' && result.data.reason && <div><dt>Motivo</dt><dd>{reasonText(result.data.reason)}</dd></div>}
      </dl>}
      {result.kind === 'review' && result.data?.manualOverrideToken && <form className="manual-override-form" onSubmit={onManualOverride}>
        <div><h3>Excepción por contingencia</h3><p>La propiedad tiene adeudo. Registra por qué se autoriza esta visita; el pase debe seguir vigente y el evento quedará auditado.</p></div>
        <label htmlFor="manual-override-justification">Justificación obligatoria</label>
        <textarea id="manual-override-justification" minLength={20} maxLength={500} required value={manualJustification} onChange={(event) => onManualJustificationChange(event.target.value)} placeholder="Ej. ingreso de servicio médico solicitado por el anfitrión..." disabled={manualOverrideBusy || !isOnline} />
        {manualOverrideError && <p className="form-error" role="alert">{manualOverrideError}</p>}
        <Button variant="primary" size="md" type="submit" disabled={manualOverrideBusy || !isOnline || manualJustification.trim().length < 20} isLoading={manualOverrideBusy}>Autorizar y registrar excepción</Button>
      </form>}
      <Button variant="primary" size="md" className="next-scan-button" type="button" onClick={onNext} disabled={!isOnline}>
        {result.data?.manualAccess ? 'Siguiente visita' : 'Escanear siguiente QR'}
      </Button>
    </section>
  );
}