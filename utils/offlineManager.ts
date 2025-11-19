/**
 * Offline Manager (v1.10.0)
 *
 * Manages offline data storage using IndexedDB for robust offline experience.
 * Stores conversation sessions, settings, and cached data for offline access.
 */

import { ConversationSession } from '@/types';

const DB_NAME = 'DrSbaitsoOfflineDB';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const SETTINGS_STORE = 'settings';
const CACHE_STORE = 'cache';

class OfflineManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineManager] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Sessions store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
          sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
          sessionsStore.createIndex('characterId', 'characterId', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }

        // Cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('[OfflineManager] Database schema created');
      };
    });

    return this.initPromise;
  }

  /**
   * Save a session to offline storage
   */
  async saveSession(session: ConversationSession): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.put(session);

      request.onsuccess = () => {
        console.log(`[OfflineManager] Session ${session.id} saved offline`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save session:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a session from offline storage
   */
  async getSession(sessionId: string): Promise<ConversationSession | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to get session:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all sessions from offline storage
   */
  async getAllSessions(): Promise<ConversationSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get all sessions:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a session from offline storage
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite');
      const store = transaction.objectStore(SESSIONS_STORE);
      const request = store.delete(sessionId);

      request.onsuccess = () => {
        console.log(`[OfflineManager] Session ${sessionId} deleted from offline storage`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete session:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Save a setting to offline storage
   */
  async saveSetting(key: string, value: any): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save setting:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a setting from offline storage
   */
  async getSetting(key: string): Promise<any> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };

      request.onerror = () => {
        console.error('Failed to get setting:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Cache arbitrary data with TTL
   */
  async cacheData(key: string, data: any, ttlMs: number = 86400000): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const expiresAt = Date.now() + ttlMs;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.put({ key, data, timestamp: Date.now(), expiresAt });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cached data (returns null if expired)
   */
  async getCachedData(key: string): Promise<any> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check expiration
        if (result.expiresAt && result.expiresAt < Date.now()) {
          // Expired, delete it
          this.deleteCachedData(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };

      request.onerror = () => {
        console.error('Failed to get cached data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete cached data
   */
  async deleteCachedData(key: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [SESSIONS_STORE, SETTINGS_STORE, CACHE_STORE],
        'readwrite'
      );

      transaction.objectStore(SESSIONS_STORE).clear();
      transaction.objectStore(SETTINGS_STORE).clear();
      transaction.objectStore(CACHE_STORE).clear();

      transaction.oncomplete = () => {
        console.log('[OfflineManager] All offline data cleared');
        resolve();
      };

      transaction.onerror = () => {
        console.error('Failed to clear offline data:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ sessions: number; settings: number; cache: number }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(
      [SESSIONS_STORE, SETTINGS_STORE, CACHE_STORE],
      'readonly'
    );

    const sessionsCount = await this.getCount(transaction.objectStore(SESSIONS_STORE));
    const settingsCount = await this.getCount(transaction.objectStore(SETTINGS_STORE));
    const cacheCount = await this.getCount(transaction.objectStore(CACHE_STORE));

    return {
      sessions: sessionsCount,
      settings: settingsCount,
      cache: cacheCount
    };
  }

  private getCount(store: IDBObjectStore): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();
