'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { extractPlateCandidate } from '../../../lib/plate-recognition.mjs';
import { guardApiRequest } from '../guard-api';
import type { GuardLookupResult, GuardSession } from '../types';

export function useGuardLookup(session: GuardSession | null, isOnline: boolean) {
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<GuardLookupResult | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [platePhoto, setPlatePhoto] = useState<File | null>(null);
  const [platePhotoUrl, setPlatePhotoUrl] = useState('');
  const [plateOcrBusy, setPlateOcrBusy] = useState(false);
  const [plateOcrProgress, setPlateOcrProgress] = useState(0);
  const [plateOcrMessage, setPlateOcrMessage] = useState('');
  const plateImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!platePhoto) {
      setPlatePhotoUrl('');
      return;
    }
    const imageUrl = URL.createObjectURL(platePhoto);
    setPlatePhotoUrl(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [platePhoto]);

  const autoClearTimeoutRef = useRef<number | null>(null);

  const clearLookup = useCallback(() => {
    if (autoClearTimeoutRef.current) {
      window.clearTimeout(autoClearTimeoutRef.current);
      autoClearTimeoutRef.current = null;
    }
    setLookupQuery('');
    setLookupResult(null);
    setPlatePhoto(null);
    setPlateOcrMessage('');
    setPlateOcrProgress(0);
  }, []);

  useEffect(() => () => {
    if (autoClearTimeoutRef.current) window.clearTimeout(autoClearTimeoutRef.current);
  }, []);

  const handleLookup = useCallback(async () => {
    if (autoClearTimeoutRef.current) {
      window.clearTimeout(autoClearTimeoutRef.current);
      autoClearTimeoutRef.current = null;
    }
    if (!session || !lookupQuery.trim()) {
      setLookupResult(null);
      return;
    }
    setLookupBusy(true);
    try {
      const data = await guardApiRequest<GuardLookupResult>(
        `/tenants/${encodeURIComponent(session.tenantSlug)}/access/lookup?query=${encodeURIComponent(lookupQuery.trim())}`,
        session.token,
      );
      setLookupResult(data);
      // Limpiar automáticamente la consulta tras 3 minutos por privacidad y seguridad
      autoClearTimeoutRef.current = window.setTimeout(() => {
        setLookupResult(null);
        setLookupQuery('');
      }, 3 * 60 * 1000);
    } catch {
      setLookupResult({ query: lookupQuery.trim(), total: 0, residents: [], vehicles: [] });
    } finally {
      setLookupBusy(false);
    }
  }, [lookupQuery, session]);

  const handlePlatePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const photo = event.currentTarget.files?.[0] || null;
    event.currentTarget.value = '';
    if (!photo) return;
    if (!photo.type.startsWith('image/')) {
      setPlateOcrMessage('Selecciona una imagen para leer la placa.');
      return;
    }
    if (photo.size > 12 * 1024 * 1024) {
      setPlateOcrMessage('La imagen supera 12 MB. Selecciona una foto más ligera para continuar.');
      return;
    }
    setPlatePhoto(photo);
    setLookupResult(null);
    setLookupQuery('');
    setPlateOcrMessage('');
    setPlateOcrProgress(0);
  };

  const readPlatePhoto = async () => {
    if (!platePhoto || plateOcrBusy) return;
    setPlateOcrBusy(true);
    setPlateOcrMessage('Cargando OCR local…');
    setPlateOcrProgress(0);
    try {
      const { createWorker, OEM, PSM } = await import('tesseract.js');
      const worker = await createWorker('eng', OEM.LSTM_ONLY, {
        logger: (message) => {
          if (message.status === 'recognizing text') setPlateOcrProgress(Math.round(message.progress * 100));
        },
      });
      try {
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        });
        const { data } = await worker.recognize(platePhoto);
        const candidate = extractPlateCandidate(data.text);
        const confidence = Math.round(data.confidence);
        if (!candidate || confidence < 40) {
          setPlateOcrMessage('No se detectó una placa con suficiente claridad. Ajusta la foto o escribe la placa manualmente.');
        } else {
          setLookupQuery(candidate);
          setLookupResult(null);
          setPlateOcrMessage(`Sugerencia: ${candidate} · confianza OCR ${confidence}%. Verifica o corrige la placa y pulsa Buscar.`);
        }
      } finally {
        await worker.terminate();
      }
    } catch {
      setPlateOcrMessage('No se pudo leer la imagen. Puedes escribir la placa manualmente; la foto no se envió al servidor.');
    } finally {
      setPlateOcrBusy(false);
    }
  };

  const removePlatePhoto = useCallback(() => {
    setPlatePhoto(null);
    setPlateOcrMessage('');
    setPlateOcrProgress(0);
  }, []);

  return {
    lookupQuery,
    setLookupQuery,
    lookupResult,
    lookupBusy,
    platePhoto,
    platePhotoUrl,
    plateOcrBusy,
    plateOcrProgress,
    plateOcrMessage,
    plateImageInputRef,
    handleLookup,
    handlePlatePhotoChange,
    readPlatePhoto,
    clearLookup,
    removePlatePhoto,
  };
}