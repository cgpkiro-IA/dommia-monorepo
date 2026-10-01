'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../guard-api';
import type { GuardSession } from '../types';

export interface GuardNoticeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  target_audience: string;
  author_name: string;
  is_pinned: boolean;
  published_at: string;
  acknowledged_guards: { guard_id: string; guard_name: string; acknowledged_at: string }[];
  is_acknowledged_by_current_guard: boolean;
  expires_at?: string;
}

export function useGuardConsigns(session: GuardSession | null, isOnline: boolean) {
  const [consigns, setConsigns] = useState<GuardNoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsigns = useCallback(async () => {
    if (!session || !isOnline) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/tenants/${encodeURIComponent(session.tenantSlug)}/notices?audience=GUARDS`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setConsigns(json.data || []);
      }
    } catch {
      // Ignorar fallo transitorio
    } finally {
      setLoading(false);
    }
  }, [isOnline, session]);

  useEffect(() => {
    void fetchConsigns();
    // Poll cada 25s para detectar nuevas consignas emitidas por la administración
    const interval = window.setInterval(() => {
      void fetchConsigns();
    }, 25000);
    return () => window.clearInterval(interval);
  }, [fetchConsigns]);

  // Consignas pendientes de confirmación por este guardia
  const unreadConsignsCount = consigns.filter(
    (consign) => !consign.is_acknowledged_by_current_guard
  ).length;

  return {
    consigns,
    unreadConsignsCount,
    loading,
    error,
    refreshConsigns: fetchConsigns,
  };
}
