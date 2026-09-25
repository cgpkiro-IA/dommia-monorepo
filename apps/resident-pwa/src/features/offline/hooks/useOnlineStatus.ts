'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../lib/db';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Reciente');

  // Register service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado con scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Fallo al registrar Service Worker:', err);
        });
    }
  }, []);

  // Update real connection status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = () => {
      setIsOnline(navigator.onLine);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  // Count pending sync items in IndexedDB
  const checkPendingSync = useCallback(async () => {
    try {
      const items = await db.syncQueue.toArray();
      setPendingSyncCount(items.length);
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  useEffect(() => {
    checkPendingSync();
    const interval = setInterval(checkPendingSync, 5000);
    return () => clearInterval(interval);
  }, [checkPendingSync]);

  // Synchronize pending items when online with jitter
  const triggerSync = useCallback(async () => {
    const effectiveOnline = isOnline && !isSimulatedOffline;
    if (!effectiveOnline) return;

    const items = await db.syncQueue.toArray();
    if (items.length === 0) return;

    // Apply 500ms jitter to prevent thundering herd
    await new Promise((r) => setTimeout(r, Math.random() * 500));

    for (const item of items) {
      // Simulate sync with backend
      await db.syncQueue.delete(item.id);
    }

    setPendingSyncCount(0);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [isOnline, isSimulatedOffline]);

  useEffect(() => {
    const effectiveOnline = isOnline && !isSimulatedOffline;
    if (effectiveOnline && pendingSyncCount > 0) {
      triggerSync();
    }
  }, [isOnline, isSimulatedOffline, pendingSyncCount, triggerSync]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  const effectiveOnline = isOnline && !isSimulatedOffline;

  return {
    isOnline: effectiveOnline,
    isRealOffline: !isOnline,
    isSimulatedOffline,
    pendingSyncCount,
    lastSyncTime,
    toggleSimulatedOffline,
    triggerSync,
  };
}
