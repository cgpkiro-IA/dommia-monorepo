'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        const guardRegistrations = registrations.filter((registration) => registration.scope === `${window.location.origin}/`);
        const cachesToDelete = await caches.keys();
        await Promise.all([
          ...guardRegistrations.map((registration) => registration.unregister()),
          ...cachesToDelete.filter((key) => key.startsWith('dommia-guard-')).map((key) => caches.delete(key)),
        ]);
        const reloadKey = 'dommia_guard_dev_worker_cleanup';
        if (guardRegistrations.length > 0 && !sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, '1');
          window.location.reload();
        }
      }).catch(() => undefined);
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }, []);

  return null;
}