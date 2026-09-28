'use client';

export interface TotpResult {
  code: string;
  payload: string;
  qrImage: string;
  timeRemaining: number;
  progressPercent: number;
  error?: string;
}
