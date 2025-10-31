/**
 * Cloud Sync Utility
 * Firebase Firestore integration for cross-device session synchronization
 *
 * Features:
 * - Real-time session synchronization across devices
 * - Offline-first with automatic sync when connection restored
 * - Conflict resolution with last-write-wins strategy
 * - User authentication support (optional)
 * - Encrypted data transmission
 *
 * @version 1.7.0
 */

import type { ConversationSession, AppSettings, SessionStats, CustomCharacter } from '@/types';

// Firebase SDK types (lightweight interface to avoid bundling Firebase if not used)
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface SyncOptions {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // milliseconds
  conflictResolution: 'last-write-wins' | 'manual';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChanges: number;
  error: string | null;
}

export interface SyncData {
  sessions: ConversationSession[];
  settings: AppSettings;
  stats: SessionStats;
  customCharacters: CustomCharacter[];
  updatedAt: number;
  deviceId: string;
}

/**
 * CloudSync Class
 * Manages cloud synchronization of user data via Firebase
 */
export class CloudSync {
  private static instance: CloudSync | null = null;
  private firebaseApp: any = null;
  private db: any = null;
  private auth: any = null;
  private userId: string | null = null;
  private deviceId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private options: SyncOptions;
  private status: SyncStatus;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.options = this.loadSyncOptions();
    this.status = {
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncedAt: null,
      pendingChanges: 0,
      error: null,
    };

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  static getInstance(): CloudSync {
    if (!CloudSync.instance) {
      CloudSync.instance = new CloudSync();
    }
    return CloudSync.instance;
  }

  /**
   * Initialize Firebase connection
   */
  async initialize(config: FirebaseConfig): Promise<void> {
    try {
      // Dynamic import to avoid bundling Firebase if not used
      const { initializeApp } = await import('firebase/app');
      const { getFirestore, enableIndexedDbPersistence } = await import('firebase/firestore');
      const { getAuth } = await import('firebase/auth');

      this.firebaseApp = initializeApp(config);
      this.db = getFirestore(this.firebaseApp);
      this.auth = getAuth(this.firebaseApp);

      // Enable offline persistence
      try {
        await enableIndexedDbPersistence(this.db);
        console.log('[CloudSync] Offline persistence enabled');
      } catch (err: any) {
        if (err.code === 'failed-precondition') {
          console.warn('[CloudSync] Persistence failed - multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('[CloudSync] Persistence not supported by browser');
        }
      }

      // Listen for auth state changes
      this.auth.onAuthStateChanged((user: any) => {
        if (user) {
          this.userId = user.uid;
          this.emit('auth-state-changed', { isAuthenticated: true, userId: user.uid });

          if (this.options.autoSync) {
            this.startAutoSync();
          }
        } else {
          this.userId = null;
          this.stopAutoSync();
          this.emit('auth-state-changed', { isAuthenticated: false, userId: null });
        }
      });

      console.log('[CloudSync] Initialized successfully');
    } catch (error) {
      console.error('[CloudSync] Initialization failed:', error);
      this.status.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Sign in anonymously (for users without accounts)
   */
  async signInAnonymously(): Promise<void> {
    if (!this.auth) {
      throw new Error('[CloudSync] Firebase not initialized');
    }

    try {
      const { signInAnonymously } = await import('firebase/auth');
      const result = await signInAnonymously(this.auth);
      this.userId = result.user.uid;
      console.log('[CloudSync] Signed in anonymously');
    } catch (error) {
      console.error('[CloudSync] Anonymous sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!this.auth) {
      throw new Error('[CloudSync] Firebase not initialized');
    }

    try {
      const { signOut } = await import('firebase/auth');
      await signOut(this.auth);
      this.userId = null;
      this.stopAutoSync();
      console.log('[CloudSync] Signed out');
    } catch (error) {
      console.error('[CloudSync] Sign-out failed:', error);
      throw error;
    }
  }

  /**
   * Upload local data to cloud
   */
  async uploadData(data: Partial<SyncData>): Promise<void> {
    if (!this.userId || !this.db) {
      throw new Error('[CloudSync] Not authenticated or Firebase not initialized');
    }

    this.status.isSyncing = true;
    this.emit('sync-start', null);

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const userDocRef = doc(this.db, 'users', this.userId);

      const syncData: any = {
        ...data,
        updatedAt: serverTimestamp(),
        deviceId: this.deviceId,
      };

      await setDoc(userDocRef, syncData, { merge: true });

      this.status.lastSyncedAt = Date.now();
      this.status.pendingChanges = 0;
      this.status.error = null;

      console.log('[CloudSync] Data uploaded successfully');
      this.emit('sync-complete', { success: true });
    } catch (error) {
      console.error('[CloudSync] Upload failed:', error);
      this.status.error = error instanceof Error ? error.message : 'Upload failed';
      this.emit('sync-error', { error: this.status.error });
      throw error;
    } finally {
      this.status.isSyncing = false;
    }
  }

  /**
   * Download data from cloud
   */
  async downloadData(): Promise<SyncData | null> {
    if (!this.userId || !this.db) {
      throw new Error('[CloudSync] Not authenticated or Firebase not initialized');
    }

    this.status.isSyncing = true;
    this.emit('sync-start', null);

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const userDocRef = doc(this.db, 'users', this.userId);

      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as SyncData;
        this.status.lastSyncedAt = Date.now();
        this.status.error = null;

        console.log('[CloudSync] Data downloaded successfully');
        this.emit('sync-complete', { success: true });

        return data;
      } else {
        console.log('[CloudSync] No cloud data found');
        return null;
      }
    } catch (error) {
      console.error('[CloudSync] Download failed:', error);
      this.status.error = error instanceof Error ? error.message : 'Download failed';
      this.emit('sync-error', { error: this.status.error });
      throw error;
    } finally {
      this.status.isSyncing = false;
    }
  }

  /**
   * Sync local data with cloud (bidirectional)
   */
  async syncData(localData: Partial<SyncData>): Promise<SyncData | null> {
    if (!this.userId || !this.db) {
      throw new Error('[CloudSync] Not authenticated or Firebase not initialized');
    }

    try {
      const cloudData = await this.downloadData();

      if (!cloudData) {
        // No cloud data exists, upload local data
        await this.uploadData(localData);
        return null;
      }

      // Conflict resolution: last-write-wins
      const localTimestamp = localData.updatedAt || 0;
      const cloudTimestamp = cloudData.updatedAt || 0;

      if (localTimestamp > cloudTimestamp) {
        // Local data is newer, upload
        await this.uploadData(localData);
        console.log('[CloudSync] Local data uploaded (newer)');
        return null;
      } else {
        // Cloud data is newer or equal, use cloud data
        console.log('[CloudSync] Cloud data used (newer or equal)');
        return cloudData;
      }
    } catch (error) {
      console.error('[CloudSync] Sync failed:', error);
      throw error;
    }
  }

  /**
   * Listen for real-time changes
   */
  async subscribeToChanges(callback: (data: SyncData) => void): Promise<() => void> {
    if (!this.userId || !this.db) {
      throw new Error('[CloudSync] Not authenticated or Firebase not initialized');
    }

    const { doc, onSnapshot } = await import('firebase/firestore');
    const userDocRef = doc(this.db, 'users', this.userId);

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SyncData;

          // Only trigger callback if change came from another device
          if (data.deviceId !== this.deviceId) {
            console.log('[CloudSync] Remote change detected');
            callback(data);
            this.emit('remote-change', data);
          }
        }
      },
      (error) => {
        console.error('[CloudSync] Snapshot listener error:', error);
        this.status.error = error.message;
        this.emit('sync-error', { error: error.message });
      }
    );

    return unsubscribe;
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      return; // Already running
    }

    this.syncInterval = setInterval(() => {
      if (this.status.isOnline && !this.status.isSyncing) {
        this.emit('auto-sync-trigger', null);
      }
    }, this.options.syncInterval);

    console.log('[CloudSync] Auto-sync started');
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[CloudSync] Auto-sync stopped');
    }
  }

  /**
   * Update sync options
   */
  updateOptions(options: Partial<SyncOptions>): void {
    this.options = { ...this.options, ...options };
    this.saveSyncOptions();

    if (options.autoSync !== undefined) {
      if (options.autoSync && this.userId) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    if (options.syncInterval !== undefined && this.syncInterval) {
      this.stopAutoSync();
      this.startAutoSync();
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Get sync options
   */
  getOptions(): SyncOptions {
    return { ...this.options };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.userId !== null;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Event emitter
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.status.isOnline = true;
    this.emit('online', null);
    console.log('[CloudSync] Connection restored');
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.status.isOnline = false;
    this.emit('offline', null);
    console.log('[CloudSync] Connection lost');
  }

  /**
   * Generate or retrieve device ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('cloudSyncDeviceId');

    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('cloudSyncDeviceId', deviceId);
    }

    return deviceId;
  }

  /**
   * Load sync options from localStorage
   */
  private loadSyncOptions(): SyncOptions {
    const saved = localStorage.getItem('cloudSyncOptions');

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall through to defaults
      }
    }

    return {
      enabled: false,
      autoSync: true,
      syncInterval: 60000, // 1 minute
      conflictResolution: 'last-write-wins',
    };
  }

  /**
   * Save sync options to localStorage
   */
  private saveSyncOptions(): void {
    localStorage.setItem('cloudSyncOptions', JSON.stringify(this.options));
  }
}

export default CloudSync;
