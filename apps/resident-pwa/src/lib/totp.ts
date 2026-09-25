'use client';

/**
 * TOTP Dynamic QR Generator (Offline-First)
 * Genera un código token seguro cada 30 segundos basado en tiempo y clave secreta local.
 * Compatible con la validación física en los Gateways de caseta.
 */

export interface TotpResult {
  code: string;
  payload: string;
  timeRemaining: number;
  progressPercent: number;
}

// Simple deterministic hash for browser environment without external crypto packages
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex.toUpperCase();
}

export function generateDynamicQR(
  communitySlug: string,
  residentId: string,
  totpSecret: string
): TotpResult {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(now / 30);
  const timeRemaining = 30 - (now % 30);
  const progressPercent = Math.round((timeRemaining / 30) * 100);

  // Generate 6-digit visual TOTP pin
  const seed = `${totpSecret}:${timeStep}:${communitySlug}`;
  const hashHex = simpleHash(seed);
  const pin = (parseInt(hashHex.slice(-6), 16) % 1000000).toString().padStart(6, '0');

  // Payload formatted for optical scanner in caseta
  const payload = JSON.stringify({
    app: 'DOMMIA_RESIDENT',
    tenant: communitySlug,
    rid: residentId,
    step: timeStep,
    token: pin,
    sig: hashHex.slice(0, 8),
  });

  return {
    code: pin,
    payload,
    timeRemaining,
    progressPercent,
  };
}
