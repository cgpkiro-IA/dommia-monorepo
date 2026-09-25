'use client';

import { ResidentProfile, VisitorPass, CommunityNotice, OfflineSyncQueueItem } from '../types';

const DB_NAME = 'dommia_resident_db';
const DB_VERSION = 2;

class ResidentIndexedDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('IndexedDB is only available in browser environment'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onblocked = () => {
          console.warn('IndexedDB upgrade blocked by open connection in another tab.');
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('profile')) {
            db.createObjectStore('profile', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('invitations')) {
            db.createObjectStore('invitations', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('notices')) {
            db.createObjectStore('notices', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('syncQueue')) {
            db.createObjectStore('syncQueue', { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('IndexedDB open error:', request.error);
          reject(request.error);
        };
      } catch (err) {
        reject(err);
      }
    });

    return this.dbPromise;
  }

  // Profile Store
  profile = {
    get: async (id: string = 'current_resident'): Promise<ResidentProfile | null> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('profile')) return null;

        return new Promise((resolve) => {
          const tx = db.transaction('profile', 'readonly');
          const store = tx.objectStore('profile');
          const req = store.get(id);
          req.onsuccess = () => {
            if (req.result) {
              resolve(req.result);
            } else {
              // Fallback to first profile if saved with different key
              const allReq = store.getAll();
              allReq.onsuccess = () => resolve(allReq.result?.[0] || null);
              allReq.onerror = () => resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        });
      } catch (err) {
        console.warn('Error accessing profile in IndexedDB:', err);
        return null;
      }
    },
    put: async (profile: ResidentProfile): Promise<void> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('profile')) return;

        return new Promise((resolve) => {
          const tx = db.transaction('profile', 'readwrite');
          const store = tx.objectStore('profile');
          const req = store.put(profile);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch (err) {
        console.warn('Error saving profile to IndexedDB:', err);
      }
    },
    update: async (id: string, partial: Partial<ResidentProfile>): Promise<void> => {
      try {
        const current = await this.profile.get(id);
        if (current) {
          await this.profile.put({ ...current, ...partial });
        }
      } catch (err) {
        console.warn('Error updating profile in IndexedDB:', err);
      }
    },
  };

  // Invitations Store
  invitations = {
    toArray: async (): Promise<VisitorPass[]> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('invitations')) return [];

        return new Promise((resolve) => {
          const tx = db.transaction('invitations', 'readonly');
          const store = tx.objectStore('invitations');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
      } catch (err) {
        console.warn('Error getting invitations:', err);
        return [];
      }
    },
    add: async (pass: VisitorPass): Promise<void> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('invitations')) return;

        return new Promise((resolve) => {
          const tx = db.transaction('invitations', 'readwrite');
          const store = tx.objectStore('invitations');
          const req = store.put(pass);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch (err) {
        console.warn('Error adding invitation:', err);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('invitations')) return;

        return new Promise((resolve) => {
          const tx = db.transaction('invitations', 'readwrite');
          const store = tx.objectStore('invitations');
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch (err) {
        console.warn('Error deleting invitation:', err);
      }
    },
  };

  // Notices Store
  notices = {
    toArray: async (): Promise<CommunityNotice[]> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('notices')) return [];

        return new Promise((resolve) => {
          const tx = db.transaction('notices', 'readonly');
          const store = tx.objectStore('notices');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
      } catch (err) {
        console.warn('Error reading notices:', err);
        return [];
      }
    },
    bulkPut: async (notices: CommunityNotice[]): Promise<void> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('notices')) return;

        return new Promise((resolve) => {
          const tx = db.transaction('notices', 'readwrite');
          const store = tx.objectStore('notices');
          notices.forEach((n) => store.put(n));
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch (err) {
        console.warn('Error saving notices:', err);
      }
    },
  };

  // Sync Queue Store
  syncQueue = {
    toArray: async (): Promise<OfflineSyncQueueItem[]> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('syncQueue')) return [];

        return new Promise((resolve) => {
          const tx = db.transaction('syncQueue', 'readonly');
          const store = tx.objectStore('syncQueue');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
      } catch (err) {
        console.warn('Error reading syncQueue:', err);
        return [];
      }
    },
    add: async (item: OfflineSyncQueueItem): Promise<void> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('syncQueue')) return;

        return new Promise((resolve) => {
          const tx = db.transaction('syncQueue', 'readwrite');
          const store = tx.objectStore('syncQueue');
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch (err) {
        console.warn('Error adding to syncQueue:', err);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const db = await this.getDB();
        if (!db.objectStoreNames.contains('syncQueue')) return;

        return new Promise((resolve) => {
          const tx = db.transaction('syncQueue', 'readwrite');
          const store = tx.objectStore('syncQueue');
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      } catch (err) {
        console.warn('Error deleting from syncQueue:', err);
      }
    },
  };
}

export const db = new ResidentIndexedDB();
