'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { TotpResult } from '../../../lib/totp';
import { ResidentProfile } from '../../../types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const EMPTY_QR: TotpResult = { code: '', payload: '', qrImage: '', timeRemaining: 0, progressPercent: 0 };

export function useDynamicQR(profile: ResidentProfile | null, token: string | null, enabled: boolean) {
  const [totp, setTotp] = useState<TotpResult>({
    code: '',
    payload: '',
    qrImage: '',
    timeRemaining: 0,
    progressPercent: 0,
  });

  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!profile || !token || !enabled) {
      setTotp(EMPTY_QR);
      return;
    }

    let cancelled = false;
    let expiresAt = 0;
    let refreshTimer = 0;
    const countdownTimer = window.setInterval(() => {
      if (!expiresAt) return;
      setTotp((previous) => {
        const timeRemaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
        return { ...previous, timeRemaining, progressPercent: Math.round((timeRemaining / 15) * 100) };
      });
    }, 1000);

    const refresh = async () => {
      try {
        const response = await fetch(`${API}/auth/resident/access-credential`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo renovar la credencial.');
        const data = json.data;
        const qrImage = await QRCode.toDataURL(data.payload, { width: 280, margin: 2, errorCorrectionLevel: 'H' });
        if (cancelled) return;
        expiresAt = data.stepExpiresAt;
        setTotp({
          code: data.code,
          payload: data.payload,
          qrImage,
          timeRemaining: Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
          progressPercent: Math.round((Math.max(0, expiresAt - Date.now()) / 15000) * 100),
        });
        refreshTimer = window.setTimeout(refresh, Math.max(100, expiresAt - Date.now() + 50));
      } catch (error) {
        if (cancelled) return;
        setTotp({ ...EMPTY_QR, error: error instanceof Error ? error.message : 'No se pudo renovar la credencial.' });
        refreshTimer = window.setTimeout(refresh, 5000);
      }
    };

    void refresh();
    return () => {
      cancelled = true;
      window.clearInterval(countdownTimer);
      window.clearTimeout(refreshTimer);
    };
  }, [profile?.id, profile?.communitySlug, token, enabled]);

  return {
    totp,
    isQRModalOpen,
    setIsQRModalOpen,
  };
}
