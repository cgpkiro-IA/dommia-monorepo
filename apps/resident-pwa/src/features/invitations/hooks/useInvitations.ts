'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../lib/db';
import { VisitorPass, PassType } from '../../../types';

export function useInvitations() {
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);

  // Load from IndexedDB
  const loadPasses = useCallback(async () => {
    try {
      let list = await db.invitations.toArray();

      // Seed initial demo data if empty
      if (list.length === 0) {
        const initialPasses: VisitorPass[] = [
          {
            id: 'pass_1',
            visitorName: 'Arq. Roberto Garza',
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            passType: 'SINGLE_USE',
            accessCount: 0,
            qrPayload: 'DOMMIA_PASS_RG_SINGLE_2026',
            notes: 'Revisión de ampliación de jardín',
            status: 'ACTIVE',
            synced: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'pass_2',
            visitorName: 'Familia Morales',
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 3 * 86400000).toISOString(),
            passType: 'TEMPORARY',
            accessCount: 1,
            qrPayload: 'DOMMIA_PASS_FM_WEEKEND_2026',
            notes: 'Visita de fin de semana',
            status: 'ACTIVE',
            synced: true,
            createdAt: new Date().toISOString(),
          },
        ];

        for (const p of initialPasses) {
          await db.invitations.add(p);
        }
        list = initialPasses;
      }

      setPasses(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.warn('Error loading passes from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  // Create new visitor pass
  const createPass = async (data: {
    visitorName: string;
    passType: PassType;
    validDays: number;
    notes?: string;
  }) => {
    const newPass: VisitorPass = {
      id: `pass_${Date.now()}`,
      visitorName: data.visitorName,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + data.validDays * 86400000).toISOString(),
      passType: data.passType,
      accessCount: 0,
      qrPayload: `DOMMIA_PASS_${data.visitorName.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`,
      notes: data.notes,
      status: 'ACTIVE',
      synced: navigator.onLine,
      createdAt: new Date().toISOString(),
    };

    // Save to local IndexedDB
    await db.invitations.add(newPass);

    // If offline, enqueue sync item
    if (!navigator.onLine) {
      await db.syncQueue.add({
        id: `sync_${newPass.id}`,
        action: 'CREATE_INVITATION',
        payload: newPass,
        timestamp: Date.now(),
        attempts: 0,
      });
    }

    setPasses((prev) => [newPass, ...prev]);
    setIsInviteModalOpen(false);
  };

  // Revoke pass
  const revokePass = async (id: string) => {
    await db.invitations.delete(id);
    setPasses((prev) => prev.filter((p) => p.id !== id));
  };

  // State for graphic share modal
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

  // Share trigger: opens the graphic pass modal directly
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
    createPass,
    revokePass,
    sharePass,
  };
}
