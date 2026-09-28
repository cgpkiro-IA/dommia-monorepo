'use client';

import type { ChangeEvent, RefObject } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@dommia/ui';
import { vehicleClassificationText, vehicleClassificationTone } from '../guard-utils';
import type { GuardLookupResult } from '../types';

interface GuardLookupPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  result: GuardLookupResult | null;
  busy: boolean;
  onLookup: () => void;
  isOnline: boolean;
  photo: File | null;
  photoUrl: string;
  imageInputRef: RefObject<HTMLInputElement | null>;
  ocrBusy: boolean;
  ocrProgress: number;
  ocrMessage: string;
  onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onReadPhoto: () => void;
  onRemovePhoto: () => void;
}

export function GuardLookupPanel({
  query, onQueryChange, result, busy, onLookup, isOnline, photo, photoUrl,
  imageInputRef, ocrBusy, ocrProgress, ocrMessage, onPhotoChange, onReadPhoto, onRemovePhoto,
}: GuardLookupPanelProps) {
  return (
    <section className="lookup-panel" aria-labelledby="lookup-title">
      <div className="panel-heading">
        <span className="panel-index">00 / CONSULTA RÁPIDA</span>
        <h2 id="lookup-title">Buscar residente o placas</h2>
      </div>
      <div className="lookup-controls">
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Nombre, correo, teléfono o placas" aria-label="Buscar residente o placas" disabled={!isOnline} />
        <Button variant="primary" size="md" type="button" className="lookup-control-button" onClick={onLookup} disabled={!isOnline || busy || !query.trim()} isLoading={busy}>
          {busy ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      <div className="plate-assist">
        <div className="plate-assist-heading">
          <div><span className="panel-index">LECTURA ASISTIDA</span><h3>Buscar placa desde una foto</h3><p>La imagen se procesa en este dispositivo. Revisa la sugerencia antes de buscar.</p></div>
          <Camera size={18} aria-hidden="true" />
        </div>
        <input ref={imageInputRef} className="plate-file-input" type="file" accept="image/*" capture="environment" aria-label="Seleccionar foto de una placa" onChange={onPhotoChange} />
        <button type="button" className="plate-capture-button" onClick={() => imageInputRef.current?.click()} disabled={!isOnline || ocrBusy}>
          <Camera size={16} aria-hidden="true" />Tomar foto o elegir imagen
        </button>
        {photo && photoUrl && (
          <div className="plate-photo-preview">
            <img src={photoUrl} alt="Vista previa de la foto seleccionada para leer la placa" />
            <div className="plate-photo-details">
              <strong title={photo.name}>{photo.name}</strong><span>La foto no se envía al servidor.</span>
              {ocrBusy && <progress value={ocrProgress} max={100} aria-label={`Lectura OCR ${ocrProgress}%`} />}
              <div className="plate-photo-actions">
                <button type="button" onClick={onReadPhoto} disabled={!isOnline || ocrBusy}>{ocrBusy ? `Leyendo ${ocrProgress}%…` : 'Leer placa'}</button>
                <button type="button" onClick={onRemovePhoto} disabled={ocrBusy}>Quitar foto</button>
              </div>
            </div>
          </div>
        )}
        {ocrMessage && <p className="plate-ocr-message" role="status">{ocrMessage}</p>}
        <p className="plate-assist-note">La sugerencia nunca autoriza ni deniega un acceso. Confirma el resultado del buscador y aplica el protocolo visual de caseta.</p>
      </div>

      {result && (
        <div className="lookup-results" aria-live="polite">
          {result.total === 0 ? (
            <p className="empty-state">{/^[a-z0-9 -]{4,15}$/i.test(result.query) && /\d/.test(result.query) ? `La placa ${result.query} no está registrada ni tiene una clasificación activa.` : `No se encontraron coincidencias para “${result.query}”.`}</p>
          ) : (
            <>
              {result.residents.length > 0 && <div className="lookup-group">
                <h3>Residentes</h3>
                {result.residents.map((resident) => <article key={resident.id} className="lookup-card">
                  <div className="lookup-meta-row"><strong>{resident.fullName || `${resident.firstName || ''} ${resident.lastName || ''}`.trim()}</strong>{resident.isDelinquent ? <span className="status-badge bad">Moroso</span> : <span className="status-badge ok">Activo</span>}</div>
                  <p>{resident.propertyAddress || 'Dirección no disponible'}</p><small>{resident.email || resident.phone || 'Sin contacto principal'}</small>
                  {resident.activePasses && resident.activePasses.length > 0 && <div className="active-pass-list"><strong>Pases vigentes ({resident.activePasses.length})</strong><ul>{resident.activePasses.map((pass) => <li key={pass.id}><span>{pass.visitorName}</span><small>Válido hasta {new Date(pass.validUntil).toLocaleString('es-MX')}</small></li>)}</ul></div>}
                </article>)}
              </div>}
              {result.vehicles.length > 0 && <div className="lookup-group">
                <h3>Vehículos</h3>
                {result.vehicles.map((vehicle) => <article key={vehicle.id} className="lookup-card">
                  <div className="lookup-meta-row"><strong>{vehicle.plates}</strong><span className={`status-badge vehicle-classification-${vehicle.blocked ? 'bad' : vehicleClassificationTone(vehicle.classification)}`}>{vehicle.blocked ? 'Lista de bloqueo' : vehicleClassificationText(vehicle.classification)}</span></div>
                  <p>{vehicle.propertyAddress || 'Dirección no disponible'}</p><small>{vehicle.residentName || 'Sin residente asociado'} · {vehicle.brand || 'Marca'} {vehicle.model || ''} {vehicle.color ? `· ${vehicle.color}` : ''}</small>
                  {vehicle.isDelinquent && <p className="vehicle-warning">Propiedad morosa; la consulta no autoriza ni deniega el acceso.</p>}
                  {vehicle.flagReason && <p className="vehicle-flag-reason">Motivo: {vehicle.flagReason}</p>}
                </article>)}
              </div>}
            </>
          )}
        </div>
      )}
    </section>
  );
}