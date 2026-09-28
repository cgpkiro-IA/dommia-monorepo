'use client';

import type { FormEvent } from 'react';
import { Button } from '@dommia/ui';
import type { GuardDelivery } from '../types';

interface GuardDeliveryPanelProps {
  isOnline: boolean;
  deliveries: GuardDelivery[];
  filter: 'PENDING' | 'COLLECTED';
  onFilterChange: (filter: 'PENDING' | 'COLLECTED') => void;
  recipient: string;
  onRecipientChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  carrier: string;
  onCarrierChange: (value: string) => void;
  trackingCode: string;
  onTrackingCodeChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  busy: boolean;
  error: string;
  message: string;
  collectingId: string | null;
  onCollectingIdChange: (value: string | null) => void;
  collectedByName: string;
  onCollectedByNameChange: (value: string) => void;
  onReceive: (event: FormEvent<HTMLFormElement>) => void;
  onCollect: (event: FormEvent<HTMLFormElement>, deliveryId: string) => void;
}

export function GuardDeliveryPanel({
  isOnline, deliveries, filter, onFilterChange, recipient, onRecipientChange,
  address, onAddressChange, carrier, onCarrierChange, trackingCode,
  onTrackingCodeChange, notes, onNotesChange, busy, error, message,
  collectingId, onCollectingIdChange, collectedByName, onCollectedByNameChange,
  onReceive, onCollect,
}: GuardDeliveryPanelProps) {
  return (
    <section className="delivery-section" aria-labelledby="delivery-title">
      <div className="delivery-heading">
        <div className="panel-heading">
          <span className="panel-index">03 / RESGUARDO</span>
          <h2 id="delivery-title">Paquetería</h2>
          <p>Registra cada paquete recibido y confirma su retiro con el nombre de quien lo recoge.</p>
        </div>
        <div className="delivery-tabs" role="group" aria-label="Filtrar paquetes">
          <button type="button" aria-pressed={filter === 'PENDING'} onClick={() => onFilterChange('PENDING')}>Pendientes</button>
          <button type="button" aria-pressed={filter === 'COLLECTED'} onClick={() => onFilterChange('COLLECTED')}>Entregados</button>
        </div>
      </div>
      <div className="delivery-grid">
        <form className="delivery-form" onSubmit={onReceive}>
          <h3>Recibir paquete</h3>
          <label htmlFor="delivery-recipient">Residente destinatario</label>
          <input id="delivery-recipient" value={recipient} onChange={(event) => onRecipientChange(event.target.value)} required maxLength={150} disabled={!isOnline || busy} />
          <label htmlFor="delivery-address">Domicilio / unidad</label>
          <input id="delivery-address" value={address} onChange={(event) => onAddressChange(event.target.value)} required maxLength={200} placeholder="Calle y número, privada o lote" disabled={!isOnline || busy} />
          <div className="delivery-form-row">
            <div><label htmlFor="delivery-carrier">Paquetería</label><input id="delivery-carrier" value={carrier} onChange={(event) => onCarrierChange(event.target.value)} required maxLength={100} placeholder="Ej. DHL" disabled={!isOnline || busy} /></div>
            <div><label htmlFor="delivery-tracking">Guía (opcional)</label><input id="delivery-tracking" value={trackingCode} onChange={(event) => onTrackingCodeChange(event.target.value)} maxLength={100} disabled={!isOnline || busy} /></div>
          </div>
          <label htmlFor="delivery-notes">Observaciones (opcional)</label>
          <textarea id="delivery-notes" rows={2} value={notes} onChange={(event) => onNotesChange(event.target.value)} maxLength={500} disabled={!isOnline || busy} />
          <Button variant="primary" size="md" type="submit" disabled={!isOnline || busy} isLoading={busy}>Registrar en resguardo</Button>
        </form>
        <div className="delivery-list" aria-live="polite">
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="delivery-success" role="status">{message}</p>}
          {deliveries.length === 0 ? <p className="empty-state">{filter === 'PENDING' ? 'No hay paquetes pendientes de retiro.' : 'Aún no hay paquetes entregados.'}</p> : deliveries.map((delivery) => (
            <article key={delivery.id} className="delivery-card">
              <div className="delivery-card-heading"><div><strong>{delivery.recipientName}</strong><span>{delivery.propertyAddress}</span></div><span className={`status-badge ${delivery.status === 'PENDING' ? 'pending' : 'ok'}`}>{delivery.status === 'PENDING' ? 'En resguardo' : 'Entregado'}</span></div>
              <p>{delivery.carrier}{delivery.trackingCode ? ` · Guía ${delivery.trackingCode}` : ''}</p>
              {delivery.notes && <small>{delivery.notes}</small>}
              {delivery.status === 'PENDING' && collectingId === delivery.id ? (
                <form className="collect-form" onSubmit={(event) => onCollect(event, delivery.id)}>
                  <label htmlFor={`collected-by-${delivery.id}`}>Nombre de quien retira</label>
                  <input id={`collected-by-${delivery.id}`} value={collectedByName} onChange={(event) => onCollectedByNameChange(event.target.value)} required maxLength={150} disabled={!isOnline || busy} />
                  <div><Button variant="primary" size="sm" type="submit" disabled={!isOnline || busy || !collectedByName.trim()} isLoading={busy}>Confirmar retiro</Button><Button variant="dark-outline" size="sm" type="button" onClick={() => { onCollectingIdChange(null); onCollectedByNameChange(''); }}>Cancelar</Button></div>
                </form>
              ) : delivery.status === 'PENDING' ? (
                <Button variant="dark-outline" size="sm" type="button" onClick={() => onCollectingIdChange(delivery.id)} disabled={!isOnline || busy}>Registrar retiro</Button>
              ) : <small>Retiró {delivery.collectedByName || 'No indicado'} · {delivery.collectedAt ? new Date(delivery.collectedAt).toLocaleString('es-MX') : ''}</small>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
