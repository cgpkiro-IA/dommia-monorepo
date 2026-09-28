'use client';

import type { RefObject } from 'react';
import { Camera, CircleX } from 'lucide-react';
import { Button } from '@dommia/ui';

interface GuardQrScannerPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: 'idle' | 'starting' | 'scanning';
  message: string;
  isOnline: boolean;
  validationBusy: boolean;
  hasResult: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function GuardQrScannerPanel({ videoRef, state, message, isOnline, validationBusy, hasResult, onStart, onStop }: GuardQrScannerPanelProps) {
  return (
    <section className="scan-panel" aria-labelledby="camera-title">
      <div className="panel-heading scan-panel-heading">
        <div><span className="panel-index">01 / ESCANEO</span><h2 id="camera-title">Lector QR</h2></div>
        <span className={`scan-state ${state === 'scanning' ? 'scan-state-active' : ''}`}><span />{state === 'starting' ? 'Solicitando cámara' : state === 'scanning' ? 'Buscando código' : 'Cámara detenida'}</span>
      </div>
      <div className={`camera-frame ${state === 'scanning' ? 'camera-frame-active' : ''}`}>
        <video ref={videoRef} className="camera-video" muted playsInline aria-label="Vista de la cámara para escanear un código QR" />
        {state !== 'scanning' && <div className="camera-placeholder">
          <div className="camera-glyph" aria-hidden="true"><span /></div>
          <strong>{state === 'starting' ? 'Iniciando cámara...' : 'Cámara lista'}</strong>
          <span>{isOnline ? 'Activa la cámara para leer un QR' : 'Conéctate para validar un QR'}</span>
        </div>}
        <span className="viewfinder viewfinder-tl" aria-hidden="true" /><span className="viewfinder viewfinder-tr" aria-hidden="true" />
        <span className="viewfinder viewfinder-bl" aria-hidden="true" /><span className="viewfinder viewfinder-br" aria-hidden="true" />
      </div>
      {message && <p className="inline-message" role="status">{message}</p>}
      <Button variant={state === 'idle' ? 'primary' : 'dark-outline'} size="md" className={`camera-button ${state !== 'idle' ? 'camera-button-stop' : ''}`} type="button" onClick={state === 'idle' ? onStart : onStop} disabled={!isOnline || validationBusy || hasResult}>
        {state === 'starting' ? 'Cancelar inicio' : state === 'scanning' ? 'Detener cámara' : 'Iniciar cámara'}
        {state === 'idle' ? <Camera size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
      </Button>
    </section>
  );
}