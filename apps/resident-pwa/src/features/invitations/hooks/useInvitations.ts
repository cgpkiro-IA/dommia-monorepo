'use client';

import { useState, useEffect, useCallback } from 'react';
import { VisitorPass, PassType } from '../../../types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function useInvitations(token: string | null, tenantSlug: string | null, enabled: boolean) {
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPasses = useCallback(async () => {
    if (!token || !tenantSlug || !enabled) {
      setPasses([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API}/auth/resident/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'No se pudieron cargar los pases.');
      setPasses(json.data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudieron cargar los pases.');
    } finally {
      setIsLoading(false);
    }
  }, [token, tenantSlug, enabled]);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  const createPass = async (data: {
    visitorName: string;
    passType: PassType;
    validDays: number;
    notes?: string;
  }) => {
    if (!token) return;
    setErrorMessage(null);
    try {
      const response = await fetch(`${API}/auth/resident/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo crear el pase.');
      setPasses((previous) => [json.data, ...previous]);
      setIsInviteModalOpen(false);
      setShareSuccessMessage('Pase creado. Comparte el enlace para que el QR se actualice al abrirlo.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo crear el pase.');
    }
  };

  const revokePass = async (id: string) => {
    if (!token) return;
    setErrorMessage(null);
    try {
      const response = await fetch(`${API}/auth/resident/invitations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'No se pudo revocar el pase.');
      setPasses((previous) => previous.map((pass) => pass.id === id ? { ...pass, status: 'REVOKED' } : pass));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo revocar el pase.');
    }
  };

  const [sharingPass, setSharingPass] = useState<VisitorPass | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const openShareModal = (pass: VisitorPass) => {
    setSharingPass(pass);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setSharingPass(null);
  };

  const sharePass = (pass: VisitorPass) => {
    openShareModal(pass);
  };

  return {
    passes,
    isInviteModalOpen,
    setIsInviteModalOpen,
    sharingPass,
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    shareSuccessMessage,
    errorMessage,
    isLoading,
    createPass,
    revokePass,
    sharePass,
  };
}
