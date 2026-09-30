'use client';

import { useRef, useState, useEffect, type FormEvent } from 'react';
import { Button } from '@dommia/ui';
import { Check, Home, MapPin, Package, RefreshCw, Search, User, X } from 'lucide-react';
import type { GuardDelivery } from '../types';
import type { AddressSuggestion } from '../hooks/useGuardDeliveries';

interface GuardDeliveryPanelProps {
  isOnline: boolean;
  deliveries: GuardDelivery[];
  filter: 'PENDING' | 'COLLECTED';
  onFilterChange: (filter: 'PENDING' | 'COLLECTED') => void;
  recipient: string;
  onRecipientChange: (value: string) => void;
  address: string;
  onAddressChange: (value: string) => void;
  addressSuggestions?: AddressSuggestion[];
  addressSearchBusy?: boolean;
  showAddressDropdown?: boolean;
  setShowAddressDropdown?: (show: boolean) => void;
  onSelectAddressSuggestion?: (suggestion: AddressSuggestion) => void;
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
  isOnline,
  deliveries,
  filter,
  onFilterChange,
  recipient,
  onRecipientChange,
  address,
  onAddressChange,
  addressSuggestions = [],
  addressSearchBusy = false,
  showAddressDropdown = false,
  setShowAddressDropdown,
  onSelectAddressSuggestion,
  carrier,
  onCarrierChange,
  trackingCode,
  onTrackingCodeChange,
  notes,
  onNotesChange,
  busy,
  error,
  message,
  collectingId,
  onCollectingIdChange,
  collectedByName,
  onCollectedByNameChange,
  onReceive,
  onCollect,
}: GuardDeliveryPanelProps) {
  const [selectedPropertyResidents, setSelectedPropertyResidents] = useState<string[]>([]);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(event.target as Node)
      ) {
        setShowAddressDropdown?.(false);
      }
    }
    if (showAddressDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddressDropdown, setShowAddressDropdown]);

  const handleSelectSuggestion = (s: AddressSuggestion) => {
    if (onSelectAddressSuggestion) {
      onSelectAddressSuggestion(s);
    } else {
      onAddressChange(s.propertyAddress);
      setShowAddressDropdown?.(false);
    }
    if (s.residents && s.residents.length > 0) {
      setSelectedPropertyResidents(s.residents);
    }
  };

  return (
    <section className="delivery-section" aria-labelledby="delivery-title">
      <div className="delivery-heading">
        <div className="panel-heading">
          <span className="panel-index">03 / RESGUARDO</span>
          <h2 id="delivery-title">Paquetería</h2>
          <p>Registra cada paquete recibido y confirma su retiro con el nombre de quien lo recoge.</p>
        </div>
        <div className="delivery-tabs" role="group" aria-label="Filtrar paquetes">
          <button
            type="button"
            aria-pressed={filter === 'PENDING'}
            onClick={() => onFilterChange('PENDING')}
          >
            Pendientes
          </button>
          <button
            type="button"
            aria-pressed={filter === 'COLLECTED'}
            onClick={() => onFilterChange('COLLECTED')}
          >
            Entregados
          </button>
        </div>
      </div>

      <div className="delivery-grid">
        <form className="delivery-form" onSubmit={onReceive}>
          <h3>Recibir paquete</h3>

          {/* Domicilio / Unidad con Búsqueda Predictiva de Calles del Fraccionamiento */}
          <div ref={addressContainerRef} className="relative flex flex-col gap-1 text-left">
            <label htmlFor="delivery-address" className="text-xs font-semibold text-slate-300">
              Domicilio / Unidad (Búsqueda predictiva de calles) *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="delivery-address"
                value={address}
                onChange={(event) => {
                  onAddressChange(event.target.value);
                  setShowAddressDropdown?.(true);
                }}
                onFocus={() => {
                  if (addressSuggestions.length > 0) {
                    setShowAddressDropdown?.(true);
                  }
                }}
                required
                maxLength={200}
                placeholder="Escribe calle o número (ej. Roble 101, Lote 02...)"
                disabled={!isOnline || busy}
                autoComplete="off"
                style={{ paddingLeft: '42px', paddingRight: '40px' }}
                className="w-full !pl-11 !pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                {addressSearchBusy && (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                )}
                {address && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddressChange('');
                      setSelectedPropertyResidents([]);
                      setShowAddressDropdown?.(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                    title="Limpiar domicilio"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Menú Flotante de Sugerencias Predictivas */}
            {showAddressDropdown && addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 py-2 max-h-56 overflow-y-auto backdrop-blur-xl animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 flex items-center gap-1 mb-1">
                  <Home className="w-3 h-3" />
                  <span>Calles y unidades coincidentes ({addressSuggestions.length}):</span>
                </div>
                {addressSuggestions.map((sug) => (
                  <button
                    key={sug.propertyId}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-blue-600/25 flex items-start justify-between gap-2 text-xs transition-colors group cursor-pointer border-b border-slate-800/40 last:border-0"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-blue-200 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{sug.propertyAddress}</span>
                      </div>
                      {sug.residents && sug.residents.length > 0 && (
                        <div className="text-[11px] text-slate-400 mt-0.5 pl-5">
                          Titulares: <span className="text-slate-300 font-medium">{sug.residents.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 group-hover:bg-blue-600 group-hover:text-white font-mono shrink-0">
                      Seleccionar
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Destinatario: Campo abierto y libre para que el guardia ingrese el nombre */}
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="delivery-recipient" className="text-xs font-semibold text-slate-300">
              Nombre del destinatario (Persona a quien viene el paquete) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="delivery-recipient"
                value={recipient}
                onChange={(event) => onRecipientChange(event.target.value)}
                required
                maxLength={150}
                placeholder="Ingresa nombre de la persona, familiar o visitante..."
                disabled={!isOnline || busy}
                style={{ paddingLeft: '42px' }}
                className="w-full !pl-11 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Sugerencias rápidas opcionales de residentes del domicilio */}
            {selectedPropertyResidents.length > 0 && !recipient && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-[10px] text-slate-400">¿Es para?:</span>
                {selectedPropertyResidents.map((rName, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onRecipientChange(rName)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-blue-900/60 border border-slate-700 text-blue-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + {rName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Paquetería y Guía */}
          <div className="delivery-form-row">
            <div>
              <label htmlFor="delivery-carrier" className="text-xs font-semibold text-slate-300">
                Empresa / Paquetería *
              </label>
              <input
                id="delivery-carrier"
                value={carrier}
                onChange={(event) => onCarrierChange(event.target.value)}
                required
                maxLength={100}
                placeholder="Ej. Amazon, Mercado Libre, DHL, Estafeta..."
                disabled={!isOnline || busy}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="delivery-tracking" className="text-xs font-semibold text-slate-300">
                Número de guía (opcional)
              </label>
              <input
                id="delivery-tracking"
                value={trackingCode}
                onChange={(event) => onTrackingCodeChange(event.target.value)}
                maxLength={100}
                placeholder="Ej. MX987654321"
                disabled={!isOnline || busy}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <label htmlFor="delivery-notes">
            Observaciones (opcional)
            <textarea
              id="delivery-notes"
              rows={2}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              maxLength={500}
              placeholder="Caja mediana, sobre sellado, etc."
              disabled={!isOnline || busy}
            />
          </label>

          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={!isOnline || busy || !address.trim() || !recipient.trim()}
            isLoading={busy}
          >
            <Package className="w-4 h-4 mr-1.5" />
            Registrar paquete en resguardo
          </Button>
        </form>

        <div className="delivery-list" aria-live="polite">
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="delivery-success" role="status">{message}</p>}
          {deliveries.length === 0 ? (
            <p className="empty-state">
              {filter === 'PENDING'
                ? 'No hay paquetes pendientes de retiro.'
                : 'Aún no hay paquetes entregados.'}
            </p>
          ) : (
            deliveries.map((delivery) => (
              <article key={delivery.id} className="delivery-card">
                <div className="delivery-card-heading">
                  <div>
                    <strong>{delivery.recipientName}</strong>
                    <span>{delivery.propertyAddress}</span>
                  </div>
                  <span
                    className={`status-badge ${
                      delivery.status === 'PENDING' ? 'pending' : 'ok'
                    }`}
                  >
                    {delivery.status === 'PENDING' ? 'En resguardo' : 'Entregado'}
                  </span>
                </div>
                <p>
                  {delivery.carrier}
                  {delivery.trackingCode ? ` · Guía ${delivery.trackingCode}` : ''}
                </p>
                {delivery.notes && <small>{delivery.notes}</small>}
                {delivery.status === 'PENDING' && collectingId === delivery.id ? (
                  <form
                    className="collect-form"
                    onSubmit={(event) => onCollect(event, delivery.id)}
                  >
                    <label htmlFor={`collected-by-${delivery.id}`}>
                      Nombre de quien retira
                    </label>
                    <input
                      id={`collected-by-${delivery.id}`}
                      value={collectedByName}
                      onChange={(event) => onCollectedByNameChange(event.target.value)}
                      required
                      maxLength={150}
                      placeholder="Nombre y firma de recibido"
                      disabled={!isOnline || busy}
                    />
                    <div>
                      <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={!isOnline || busy || !collectedByName.trim()}
                        isLoading={busy}
                      >
                        Confirmar retiro
                      </Button>
                      <Button
                        variant="dark-outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          onCollectingIdChange(null);
                          onCollectedByNameChange('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : delivery.status === 'PENDING' ? (
                  <Button
                    variant="dark-outline"
                    size="sm"
                    type="button"
                    onClick={() => onCollectingIdChange(delivery.id)}
                    disabled={!isOnline || busy}
                  >
                    Registrar retiro
                  </Button>
                ) : (
                  <small>
                    Retiró {delivery.collectedByName || 'No indicado'} ·{' '}
                    {delivery.collectedAt
                      ? new Date(delivery.collectedAt).toLocaleString('es-MX')
                      : ''}
                  </small>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

