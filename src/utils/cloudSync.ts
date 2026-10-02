/**
 * Cloud Sync Utility
 * Firebase Firestore integration for cross-device session synchronization
 *
 * - The user supplies their own Firebase web app config (validated by
 *   {@link parseFirebaseConfig}); nothing is hard-coded.
 * - Firebase is loaded with dynamic import() only, so it is never part of the
 *   main bundle; only `import type` may reference 'firebase/*' statically.
 * - Offline cache: `initializeFirestore(app, { localCache: persistentLocalCache() })`
 *   (enableIndexedDbPersistence is deprecated in Firebase 10+).
 * - Conflict resolution: last write wins, on client millisecond timestamps.
 * - Auto-sync pulls local data from a provider registered with
 *   {@link CloudSync.setLocalDataProvider} and emits `remote-data` when the
 *   cloud copy is newer.
 *
 * Privacy: data is stored at `users/{uid}` in the user's own Firestore. Who
 * can read it is decided by that project's security rules, which must
 * restrict the document to its owner.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth, Unsubscribe } from 'firebase/auth';
import type { ConversationSession, AppSettings, SessionStats, CustomCharacter } from '@/types';

/** The Firebase web app config from the Firebase console (Project settings > Your apps). */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
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

export type LocalDataProvider = () => Partial<SyncData>;

type Listener = (data: unknown) => void;

const CONFIG_KEY = 'cloudSyncFirebaseConfig';
const OPTIONS_KEY = 'cloudSyncOptions';
const DEVICE_KEY = 'cloudSyncDeviceId';
const MIN_INTERVAL_MS = 10_000;
const MAX_INTERVAL_MS = 3_600_000;
/** Firestore's per-document limit is 1 MiB; leave room for field names. */
const MAX_DOC_BYTES = 1_000_000;

const REQUIRED_FIELDS = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;
const OPTIONAL_FIELDS = ['storageBucket', 'messagingSenderId', 'measurementId'] as const;

const FIELD_RULES: Record<(typeof REQUIRED_FIELDS)[number], { pattern: RegExp; hint: string }> = {
  apiKey: { pattern: /^AIza[0-9A-Za-z_-]{35}$/, hint: 'starts with "AIza" (39 characters)' },
  authDomain: { pattern: /^[a-z0-9.-]+\.[a-z]{2,}$/i, hint: 'a host name such as my-app.firebaseapp.com' },
  projectId: { pattern: /^[a-z0-9][a-z0-9-]{2,62}$/, hint: 'lowercase letters, digits and hyphens' },
  appId: { pattern: /^\d+:\d+:web:[0-9a-f]+$/i, hint: 'like 1:1234567890:web:abc123' },
};

/** Extracts `key: "value"` pairs from the JavaScript snippet the Firebase console shows. */
function parseConfigSnippet(text: string): Record<string, string> | null {
  const trimmed = text.trim();
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : null;
  } catch {
    // Not JSON: fall through to the JS object literal form.
  }
  const result: Record<string, string> = {};
  for (const match of trimmed.matchAll(/["']?(\w+)["']?\s*:\s*(["'])([^"'\n]*)\2/g)) {
    result[match[1]] = match[3];
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Validates a user-supplied Firebase web config (an object, JSON, or the
 * console's JS snippet) and returns only the known fields. Throws an Error
 * that lists every problem.
 */
export function parseFirebaseConfig(input: unknown): FirebaseConfig {
  const raw = typeof input === 'string' ? parseConfigSnippet(input) : input;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Paste the Firebase web config object (apiKey, authDomain, projectId, appId)');
  }
  const record = raw as Record<string, unknown>;
  const problems: string[] = [];
  const config: Record<string, string> = {};

  for (const field of REQUIRED_FIELDS) {
    const value = typeof record[field] === 'string' ? (record[field] as string).trim() : '';
    if (!value) {
      problems.push(`${field} is required`);
    } else if (!FIELD_RULES[field].pattern.test(value)) {
      problems.push(`${field} looks wrong (${FIELD_RULES[field].hint})`);
    } else {
      config[field] = value;
    }
  }
  for (const field of OPTIONAL_FIELDS) {
    const value = record[field];
    if (typeof value === 'string' && value.trim() && value.length <= 200) config[field] = value.trim();
  }

  if (problems.length > 0) {
    throw new Error(`Invalid Firebase web config: ${problems.join('; ')}`);
  }
  return config as unknown as FirebaseConfig;
}

/** Firestore Timestamp, number, or missing -> epoch milliseconds. */
function toMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return Number(value.toMillis()) || 0;
  }
  return 0;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: settings simply do not persist.
  }
}

const DEFAULT_OPTIONS: SyncOptions = {
  enabled: false,
  autoSync: true,
  syncInterval: 60_000,
  conflictResolution: 'last-write-wins',
};

/**
 * CloudSync Class
 * Manages cloud synchronization of user data via Firebase
 */
export class CloudSync {
  private static instance: CloudSync | null = null;
  private firebaseApp: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private authUnsubscribe: Unsubscribe | null = null;
  private initPromise: Promise<void> | null = null;
  private disposed = false;
  private userId: string | null = null;
  private deviceId: string;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private options: SyncOptions;
  private status: SyncStatus;
  private listeners: Map<string, Listener[]> = new Map();
  private localDataProvider: LocalDataProvider | null = null;
  private readonly onOnline = () => this.handleOnline();
  private readonly onOffline = () => this.handleOffline();

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.options = this.loadSyncOptions();
    this.status = {
      isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
      isSyncing: false,
      lastSyncedAt: null,
      pendingChanges: 0,
      error: null,
    };

    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  static getInstance(): CloudSync {
    if (!CloudSync.instance) {
      CloudSync.instance = new CloudSync();
    }
    return CloudSync.instance;
  }

  /** The config saved by the last successful {@link initialize}, if any. */
  static getSavedConfig(): FirebaseConfig | null {
    const saved = readJSON<unknown>(CONFIG_KEY);
    if (!saved) return null;
    try {
      return parseFirebaseConfig(saved);
    } catch {
      return null;
    }
  }

  static forgetSavedConfig(): void {
    try {
      localStorage.removeItem(CONFIG_KEY);
    } catch {
      // ignore
    }
  }

  /** Test-only: tear down and forget the singleton. */
  static async resetForTests(): Promise<void> {
    await CloudSync.instance?.dispose();
    CloudSync.instance = null;
  }

  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Initialize Firebase with a user-supplied web config. Idempotent: a
   * second call while initialised (or initialising) is a no-op.
   */
  async initialize(input: FirebaseConfig | string): Promise<void> {
    const config = parseFirebaseConfig(input);
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      // Dynamic imports keep Firebase out of the main bundle.
      const [{ initializeApp }, firestore, authModule] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
        import('firebase/auth'),
      ]);
      if (this.disposed) throw new Error('Cloud sync was closed during initialisation');

      this.firebaseApp = initializeApp(config);
      this.db = firestore.initializeFirestore(this.firebaseApp, {
        localCache: firestore.persistentLocalCache({ tabManager: firestore.persistentMultipleTabManager() }),
        ignoreUndefinedProperties: true,
      });
      this.auth = authModule.getAuth(this.firebaseApp);

      this.authUnsubscribe = authModule.onAuthStateChanged(this.auth, (user) => {
        if (user) {
          this.userId = user.uid;
          this.emit('auth-state-changed', { isAuthenticated: true, userId: user.uid });
          if (this.options.enabled && this.options.autoSync) this.startAutoSync();
        } else {
          this.userId = null;
          this.stopAutoSync();
          this.emit('auth-state-changed', { isAuthenticated: false, userId: null });
        }
      });

      writeJSON(CONFIG_KEY, config);
      this.setStatus({ error: null });
    })().catch((error: unknown) => {
      this.initPromise = null;
      this.firebaseApp = null;
      this.db = null;
      this.auth = null;
      this.setStatus({ error: error instanceof Error ? error.message : 'Firebase initialisation failed' });
      throw error;
    });

    return this.initPromise;
  }

  /**
   * Releases everything: auth listener, auto-sync timer, window listeners,
   * event listeners and the Firebase app. The instance is unusable afterwards;
   * {@link getInstance} then creates a fresh one.
   */
  async dispose(): Promise<void> {
    this.disposed = true;
    this.stopAutoSync();
    this.authUnsubscribe?.();
    this.authUnsubscribe = null;
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    this.listeners.clear();
    this.localDataProvider = null;

    const app = this.firebaseApp;
    this.firebaseApp = null;
    this.db = null;
    this.auth = null;
    this.userId = null;
    this.initPromise = null;
    if (CloudSync.instance === this) CloudSync.instance = null;

    if (app) {
      try {
        const { deleteApp } = await import('firebase/app');
        await deleteApp(app);
      } catch (error) {
        console.warn('[CloudSync] Could not delete the Firebase app:', error);
      }
    }
  }

  /**
   * Sign in anonymously. Anonymous accounts belong to this browser profile:
   * they do not carry over to another device.
   */
  async signInAnonymously(): Promise<void> {
    if (!this.auth) {
      throw new Error('Cloud sync is not configured yet');
    }
    const { signInAnonymously } = await import('firebase/auth');
    const result = await signInAnonymously(this.auth);
    this.userId = result.user.uid;
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!this.auth) {
      throw new Error('Cloud sync is not configured yet');
    }
    const { signOut } = await import('firebase/auth');
    await signOut(this.auth);
    this.userId = null;
    this.stopAutoSync();
  }

  private requireReady(): { db: Firestore; userId: string } {
    if (!this.userId || !this.db) {
      throw new Error('Not signed in, or cloud sync is not configured');
    }
    return { db: this.db, userId: this.userId };
  }

  /**
   * Upload local data to cloud
   */
  async uploadData(data: Partial<SyncData>): Promise<void> {
    const { db, userId } = this.requireReady();
    this.setStatus({ isSyncing: true });
    this.emit('sync-start', null);

    try {
      const payload = { ...data, updatedAt: data.updatedAt ?? Date.now(), deviceId: this.deviceId };
      const size = JSON.stringify(payload).length;
      if (size > MAX_DOC_BYTES) {
        throw new Error(`Too much data to sync (${Math.round(size / 1024)} KB; the limit is about 1 MB)`);
      }

      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      // updatedAt stays a client number so it compares with local data;
      // the server time is kept alongside for auditing.
      await setDoc(doc(db, 'users', userId), { ...payload, serverUpdatedAt: serverTimestamp() }, { merge: true });

      this.setStatus({ lastSyncedAt: Date.now(), pendingChanges: 0, error: null });
      this.emit('sync-complete', { success: true });
    } catch (error) {
      this.setStatus({ error: error instanceof Error ? error.message : 'Upload failed' });
      this.emit('sync-error', { error: this.status.error });
      throw error;
    } finally {
      this.setStatus({ isSyncing: false });
    }
  }

  /**
   * Download data from cloud
   */
  async downloadData(): Promise<SyncData | null> {
    const { db, userId } = this.requireReady();
    this.setStatus({ isSyncing: true });
    this.emit('sync-start', null);

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'users', userId));
      this.setStatus({ lastSyncedAt: Date.now(), error: null });
      this.emit('sync-complete', { success: true });

      if (!docSnap.exists()) return null;
      const data = docSnap.data() as Record<string, unknown>;
      return { ...(data as unknown as SyncData), updatedAt: toMillis(data.updatedAt) };
    } catch (error) {
      this.setStatus({ error: error instanceof Error ? error.message : 'Download failed' });
      this.emit('sync-error', { error: this.status.error });
      throw error;
    } finally {
      this.setStatus({ isSyncing: false });
    }
  }

  /**
   * Bidirectional last-write-wins sync. Returns the cloud data when it is
   * newer than `localData` (the caller applies it), otherwise uploads the
   * local data and returns null.
   */
  async syncData(localData: Partial<SyncData>): Promise<SyncData | null> {
    const cloudData = await this.downloadData();
    const localTimestamp = toMillis(localData.updatedAt);

    if (!cloudData || localTimestamp > cloudData.updatedAt) {
      await this.uploadData({ ...localData, updatedAt: localTimestamp || Date.now() });
      return null;
    }
    return cloudData;
  }

  /**
   * Listen for real-time changes made on other devices
   */
  async subscribeToChanges(callback: (data: SyncData) => void): Promise<() => void> {
    const { db, userId } = this.requireReady();
    const { doc, onSnapshot } = await import('firebase/firestore');

    return onSnapshot(
      doc(db, 'users', userId),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const raw = docSnap.data() as Record<string, unknown>;
        if (raw.deviceId === this.deviceId) return;
        const data = { ...(raw as unknown as SyncData), updatedAt: toMillis(raw.updatedAt) };
        callback(data);
        this.emit('remote-change', data);
      },
      (error) => {
        this.setStatus({ error: error.message });
        this.emit('sync-error', { error: error.message });
      }
    );
  }

  /**
   * Registers the function auto-sync reads local data from. Without one,
   * auto-sync has nothing to upload and does nothing.
   */
  setLocalDataProvider(provider: LocalDataProvider | null): void {
    this.localDataProvider = provider;
  }

  /** One sync round using the registered provider; emits `remote-data` when the cloud copy wins. */
  async syncNow(): Promise<SyncData | null> {
    if (!this.localDataProvider) {
      throw new Error('Nothing to sync: no local data provider is registered');
    }
    const remote = await this.syncData(this.localDataProvider());
    if (remote) this.emit('remote-data', remote);
    return remote;
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (!this.options.enabled || !this.status.isOnline || this.status.isSyncing) return;
      if (!this.userId || !this.localDataProvider) return;
      this.syncNow().catch((error: unknown) => {
        console.warn('[CloudSync] Auto-sync failed:', error);
      });
    }, this.options.syncInterval);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Update sync options
   */
  updateOptions(options: Partial<SyncOptions>): void {
    this.options = this.sanitizeOptions({ ...this.options, ...options });
    writeJSON(OPTIONS_KEY, this.options);

    this.stopAutoSync();
    if (this.options.enabled && this.options.autoSync && this.userId) {
      this.startAutoSync();
    }
    this.emit('options-changed', this.getOptions());
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  getOptions(): SyncOptions {
    return { ...this.options };
  }

  isAuthenticated(): boolean {
    return this.userId !== null;
  }

  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Events: auth-state-changed, status-changed, options-changed, sync-start,
   * sync-complete, sync-error, remote-change, remote-data, online, offline.
   */
  on(event: string, callback: Listener): void {
    const callbacks = this.listeners.get(event) ?? [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  off(event: string, callback: Listener): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const index = callbacks.indexOf(callback);
    if (index > -1) callbacks.splice(index, 1);
  }

  private emit(event: string, data: unknown): void {
    // Copy: a listener may unsubscribe while we iterate.
    for (const callback of (this.listeners.get(event) ?? []).slice()) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[CloudSync] "${event}" listener failed:`, error);
      }
    }
  }

  private setStatus(patch: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...patch };
    this.emit('status-changed', this.getStatus());
  }

  private handleOnline(): void {
    this.setStatus({ isOnline: true });
    this.emit('online', null);
  }

  private handleOffline(): void {
    this.setStatus({ isOnline: false });
    this.emit('offline', null);
  }

  private getOrCreateDeviceId(): string {
    try {
      let deviceId = localStorage.getItem(DEVICE_KEY);
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(DEVICE_KEY, deviceId);
      }
      return deviceId;
    } catch {
      return `device_${Date.now()}`;
    }
  }

  private sanitizeOptions(options: Partial<SyncOptions>): SyncOptions {
    const interval = Number(options.syncInterval);
    return {
      enabled: options.enabled === true,
      autoSync: options.autoSync !== false,
      syncInterval: Number.isFinite(interval)
        ? Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, interval))
        : DEFAULT_OPTIONS.syncInterval,
      conflictResolution: options.conflictResolution === 'manual' ? 'manual' : 'last-write-wins',
    };
  }

  private loadSyncOptions(): SyncOptions {
    return this.sanitizeOptions({ ...DEFAULT_OPTIONS, ...readJSON<Partial<SyncOptions>>(OPTIONS_KEY) });
  }
}

export default CloudSync;
