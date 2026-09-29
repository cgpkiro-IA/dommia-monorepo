'use client';

import type { ChangeEvent, RefObject } from 'react';
import {
  Camera,
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Ban,
  User,
  Home,
  Mail,
  Phone,
  Ticket,
  Search,
  AlertCircle,
  ShieldAlert,
  X,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@dommia/ui';
import { vehicleClassificationText } from '../guard-utils';
import type { GuardLookupResult } from '../types';

interface GuardLookupPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  result: GuardLookupResult | null;
  busy: boolean;
  onLookup: () => void;
  onClear: () => void;
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
  query,
  onQueryChange,
  result,
  busy,
  onLookup,
  onClear,
  isOnline,
  photo,
  photoUrl,
  imageInputRef,
  ocrBusy,
  ocrProgress,
  ocrMessage,
  onPhotoChange,
  onReadPhoto,
  onRemovePhoto,
}: GuardLookupPanelProps) {
  return (
    <section className="lookup-panel" aria-labelledby="lookup-title">
      <div className="panel-heading">
        <span className="panel-index">00 / CONSULTA RÁPIDA</span>
        <h2 id="lookup-title">Buscar residente o placas</h2>
      </div>

      <div className="lookup-controls flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Nombre, correo, teléfono o placas (ej. Ana, 101, QAA-1001)"
            aria-label="Buscar residente o placas"
            disabled={!isOnline}
            className="w-full text-sm sm:text-base min-h-[46px] pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Borrar texto"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant="primary"
          size="md"
          type="button"
          className="lookup-control-button min-h-[46px] font-bold shrink-0"
          onClick={onLookup}
          disabled={!isOnline || busy || !query.trim()}
          isLoading={busy}
        >
          {busy ? 'Buscando...' : 'Buscar'}
        </Button>
        {(query || result || photo) && (
          <button
            type="button"
            onClick={onClear}
            title="Limpiar consulta y pantalla"
            className="px-3 min-h-[46px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      <div className="plate-assist">
        <div className="plate-assist-heading">
          <div>
            <span className="panel-index">LECTURA ASISTIDA</span>
            <h3>Buscar placa desde una foto</h3>
            <p>La imagen se procesa en este dispositivo. Revisa la sugerencia antes de buscar.</p>
          </div>
          <Camera size={18} aria-hidden="true" />
        </div>
        <input
          ref={imageInputRef}
          className="plate-file-input"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Seleccionar foto de una placa"
          onChange={onPhotoChange}
        />
        <button
          type="button"
          className="plate-capture-button"
          onClick={() => imageInputRef.current?.click()}
          disabled={!isOnline || ocrBusy}
        >
          <Camera size={16} aria-hidden="true" />
          Tomar foto o elegir imagen
        </button>

        {photo && photoUrl && (
          <div className="plate-photo-preview">
            <img src={photoUrl} alt="Vista previa de la placa" />
            <div className="plate-photo-details">
              <strong title={photo.name}>{photo.name}</strong>
              <span>La foto no se envía al servidor.</span>
              {ocrBusy && <progress value={ocrProgress} max={100} aria-label={`Lectura OCR ${ocrProgress}%`} />}
              <div className="plate-photo-actions">
                <button type="button" onClick={onReadPhoto} disabled={!isOnline || ocrBusy}>
                  {ocrBusy ? `Leyendo ${ocrProgress}%…` : 'Leer placa'}
                </button>
                <button type="button" onClick={onRemovePhoto} disabled={ocrBusy}>
                  Quitar foto
                </button>
              </div>
            </div>
          </div>
        )}
        {ocrMessage && <p className="plate-ocr-message" role="status">{ocrMessage}</p>}
        <p className="plate-assist-note">La sugerencia nunca autoriza ni deniega un acceso. Confirma el resultado del buscador y aplica el protocolo visual de caseta.</p>
      </div>

      {result && (
        <div className="mt-5 space-y-6" aria-live="polite">
          {result.total > 0 && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-sm">
              <span className="flex items-center gap-2 text-slate-300 font-medium">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Datos visibles por <strong>3 minutos</strong> para proteger la privacidad del residente.</span>
              </span>
              <button
                type="button"
                onClick={onClear}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold border border-slate-700 transition-colors flex items-center gap-1 shrink-0 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar pantalla</span>
              </button>
            </div>
          )}
          {result.total === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-slate-400">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                {/^[a-z0-9 -]{4,15}$/i.test(result.query) && /\d/.test(result.query)
                  ? `La placa ${result.query} no está registrada ni tiene una clasificación activa.`
                  : `No se encontraron coincidencias para “${result.query}”.`}
              </p>
            </div>
          ) : (
            <>
              {/* Sección de Residentes */}
              {result.residents.length > 0 && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-sky-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Residentes Encontrados ({result.residents.length})
                  </h3>

                  {result.residents.map((resident) => (
                    <article
                      key={resident.id}
                      className="rounded-2xl border-2 border-slate-700/80 bg-slate-900/95 p-4 sm:p-5 shadow-xl space-y-3.5"
                    >
                      {/* Cabecera del Residente */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                            {resident.fullName || `${resident.firstName || ''} ${resident.lastName || ''}`.trim()}
                          </h4>
                          {resident.role && (
                            <span className="text-xs font-semibold text-slate-400">
                              {resident.role === 'OWNER' ? 'Propietario' : resident.role === 'TENANT' ? 'Inquilino' : 'Familiar'}
                              {resident.isPrimary ? ' · Titular' : ''}
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${
                            resident.isDelinquent
                              ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                          }`}
                        >
                          {resident.isDelinquent ? '⚠️ Moroso' : '✓ Activo'}
                        </span>
                      </div>

                      {/* Domicilio Destacado */}
                      <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-sky-200 bg-slate-950/90 px-3.5 py-2.5 rounded-xl border border-slate-800">
                        <Home className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="truncate">{resident.propertyAddress || 'Domicilio no disponible'}</span>
                      </div>

                      {/* Contacto */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-300 pt-1">
                        {resident.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {resident.email}
                          </span>
                        )}
                        {resident.phone && (
                          <span className="flex items-center gap-1.5 font-semibold text-blue-300">
                            <Phone className="w-3.5 h-3.5 text-blue-400" /> {resident.phone}
                          </span>
                        )}
                      </div>

                      {/* Pases de Visita del Residente */}
                      {resident.activePasses && resident.activePasses.length > 0 && (
                        <div className="pt-3 border-t border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                              <Ticket className="w-3.5 h-3.5 text-blue-400" /> Pases de visita ({resident.activePasses.length})
                            </strong>
                          </div>

                          <div className="space-y-2">
                            {resident.activePasses.map((pass) => {
                              const isUsed = pass.status === 'USED';
                              const isExpired = pass.status === 'EXPIRED';
                              const isRevoked = pass.status === 'REVOKED';
                              const isActive = !isUsed && !isExpired && !isRevoked;

                              const badgeBg = isActive
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                                : isUsed
                                ? 'bg-blue-950/90 text-blue-300 border-blue-500/50'
                                : isExpired
                                ? 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                                : 'bg-rose-950/90 text-rose-300 border-rose-500/50';

                              const cardBg = isActive
                                ? 'bg-emerald-950/30 border-emerald-500/40'
                                : isUsed
                                ? 'bg-blue-950/20 border-blue-500/30 opacity-90'
                                : isExpired
                                ? 'bg-amber-950/20 border-amber-500/30 opacity-80'
                                : 'bg-rose-950/20 border-rose-500/30 opacity-75';

                              return (
                                <div
                                  key={pass.id}
                                  className={`p-3 rounded-xl border ${cardBg} flex items-center justify-between gap-3 text-xs transition-all`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="font-extrabold text-sm text-white truncate">
                                        {pass.visitorName}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border flex items-center gap-1 ${badgeBg}`}>
                                        {isActive && <CheckCircle2 className="w-2.5 h-2.5" />}
                                        {isUsed && <Clock className="w-2.5 h-2.5" />}
                                        {isExpired && <AlertCircle className="w-2.5 h-2.5" />}
                                        {isRevoked && <Ban className="w-2.5 h-2.5" />}
                                        <span>{isActive ? 'Vigente' : isUsed ? 'Usado' : isExpired ? 'Vencido' : 'Cancelado'}</span>
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-300 font-medium block">
                                      {isUsed && pass.usedAt
                                        ? `Usado: ${new Date(pass.usedAt).toLocaleString('es-MX')}`
                                        : isExpired
                                        ? `Venció: ${new Date(pass.validUntil).toLocaleString('es-MX')}`
                                        : `Válido hasta: ${new Date(pass.validUntil).toLocaleString('es-MX')}`}
                                    </span>
                                  </div>

                                  <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider shrink-0 border border-slate-700">
                                    {pass.passType === 'SINGLE' || pass.passType === 'SINGLE_USE' ? '1 Uso' : pass.passType === 'RECURRENT' || pass.passType === 'TEMPORARY' ? 'Temporal' : 'Frecuente'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {/* Sección de Vehículos */}
              {result.vehicles.length > 0 && (
                <div className="space-y-3.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-sky-400 flex items-center gap-2">
                    <Car className="w-4 h-4" /> Vehículos y Placas ({result.vehicles.length})
                  </h3>

                  {result.vehicles.map((vehicle) => {
                    const isBlocked = vehicle.blocked;
                    const tone = vehicleClassificationText(vehicle.classification);

                    return (
                      <article
                        key={vehicle.id}
                        className={`rounded-2xl border-2 p-4 sm:p-5 shadow-xl space-y-3.5 ${
                          isBlocked
                            ? 'border-rose-500 bg-rose-950/40'
                            : 'border-slate-700/80 bg-slate-900/95'
                        }`}
                      >
                        {/* Placa Gigante Táctica y Clasificación */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="px-4 py-2 rounded-xl bg-slate-950 border-2 border-amber-400/70 font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider shadow-inner">
                            {vehicle.plates}
                          </div>

                          <span
                            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${
                              isBlocked
                                ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                                : 'bg-blue-950/90 text-blue-300 border-blue-500/50'
                            }`}
                          >
                            {isBlocked ? '⛔ LISTA DE BLOQUEO' : tone}
                          </span>
                        </div>

                        {/* Domicilio Destacado */}
                        <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-sky-200 bg-slate-950/90 px-3.5 py-2.5 rounded-xl border border-slate-800">
                          <Home className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="truncate">{vehicle.propertyAddress || 'Domicilio no disponible'}</span>
                        </div>

                        {/* Datos del Auto y Residente Asociado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                          <div className="flex items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                            <Car className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-semibold text-white">
                              {vehicle.brand || 'Marca'} {vehicle.model || ''} {vehicle.color ? `· ${vehicle.color}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-300 truncate">
                              {vehicle.residentName || 'Sin residente asociado'}
                            </span>
                          </div>
                        </div>

                        {/* Advertencias */}
                        {vehicle.isDelinquent && (
                          <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Propiedad con adeudo; la consulta no autoriza ni deniega el acceso.</span>
                          </div>
                        )}

                        {vehicle.flagReason && (
                          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Motivo de reporte: {vehicle.flagReason}</span>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}