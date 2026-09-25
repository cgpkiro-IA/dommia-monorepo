'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateDynamicQR, TotpResult } from '../../../lib/totp';
import { ResidentProfile } from '../../../types';

export function useDynamicQR(profile: ResidentProfile | null) {
  const [totp, setTotp] = useState<TotpResult>({
    code: '000000',
    payload: '',
    timeRemaining: 30,
    progressPercent: 100,
  });

  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isOpeningGate, setIsOpeningGate] = useState<boolean>(false);
  const [gateSuccess, setGateSuccess] = useState<boolean>(false);

  const updateTOTP = useCallback(() => {
    if (!profile) return;
    const result = generateDynamicQR(
      profile.communitySlug,
      profile.id,
      profile.totpSecret
    );
    setTotp(result);
  }, [profile]);

  useEffect(() => {
    updateTOTP();
    const interval = setInterval(updateTOTP, 1000);
    return () => clearInterval(interval);
  }, [updateTOTP]);

  const handleOpenGate = async () => {
    setIsOpeningGate(true);
    setGateSuccess(false);

    // Simulate RFID/QR optical validation in caseta
    await new Promise((r) => setTimeout(r, 1200));

    setIsOpeningGate(false);
    setGateSuccess(true);

    setTimeout(() => {
      setGateSuccess(false);
    }, 4000);
  };

  return {
    totp,
    isQRModalOpen,
    setIsQRModalOpen,
    isOpeningGate,
    gateSuccess,
    handleOpenGate,
  };
}
