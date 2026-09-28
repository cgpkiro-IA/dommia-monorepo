'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../lib/db';
import { CommunityNotice } from '../../../types';

export function useNotices(communitySlug?: string) {
  const [notices, setNotices] = useState<CommunityNotice[]>([]);

  const loadNotices = useCallback(async () => {
    try {
      // 1. First, immediate load from local IndexedDB (zero latency offline)
      let list = await db.notices.toArray();

      if (list.length === 0) {
        const initialNotices: CommunityNotice[] = [
          {
            id: 'notice_1',
            title: 'Mantenimiento Preventivo de Plumas de Acceso',
            content: 'Este jueves de 10:00 a 14:00 hrs se dará servicio a los motores y antenas RFID del carril poniente.',
            category: 'MAINTENANCE',
            publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            author: 'Administración General',
            isRead: false,
          },
          {
            id: 'notice_2',
            title: 'Asamblea General Ordinaria de Colonos',
            content: 'Convocatoria para la presentación de estados financieros y votación de mejoras en áreas verdes.',
            category: 'ASSEMBLY',
            publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            author: 'Mesa Directiva',
            isRead: true,
          },
        ];

        await db.notices.bulkPut(initialNotices);
        list = initialNotices;
      }

      setNotices(list);

      // 2. If online and slug provided, sync fresh delta from backend API
      if (navigator.onLine && communitySlug) {
        try {
          const res = await fetch(`http://localhost:4000/api/v1/tenants/${communitySlug}/notices?publishedOnly=true`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              const freshNotices: CommunityNotice[] = json.data.map((item: any) => ({
                id: item.id,
                title: item.title,
                content: item.content,
                category: item.category,
                publishedAt: item.published_at || item.created_at,
                author: item.author_name || 'Administración',
                isRead: false,
              }));
              await db.notices.bulkPut(freshNotices);
              setNotices(freshNotices);
            }
          }
        } catch {
          // Silent network fallback to IndexedDB data
        }
      }
    } catch (err) {
      console.warn('Error loading notices from IndexedDB:', err);
    }
  }, [communitySlug]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  return {
    notices,
    refreshNotices: loadNotices,
  };
}

