import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const fb = vi.hoisted(() => {
  const authUnsubscribe = vi.fn();
  let authCallback: ((user: { uid: string } | null) => void) | null = null;
  return {
    authUnsubscribe,
    emitUser: (user: { uid: string } | null) => authCallback?.(user),
    initializeApp: vi.fn((config: unknown) => ({ name: 'app', config })),
    deleteApp: vi.fn(async () => {}),
    initializeFirestore: vi.fn(() => ({ kind: 'db' })),
    persistentLocalCache: vi.fn((settings: unknown) => ({ kind: 'persistent', settings })),
    persistentMultipleTabManager: vi.fn(() => ({ kind: 'multi-tab' })),
    doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
    setDoc: vi.fn(async () => {}),
    getDoc: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
    serverTimestamp: vi.fn(() => ({ kind: 'serverTimestamp' })),
    getAuth: vi.fn(() => ({ kind: 'auth' })),
    onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: { uid: string } | null) => void) => {
      authCallback = cb;
      return authUnsubscribe;
    }),
    signInAnonymously: vi.fn(async () => ({ user: { uid: 'anon-uid' } })),
    signOut: vi.fn(async () => {}),
  };
});

vi.mock('firebase/app', () => ({ initializeApp: fb.initializeApp, deleteApp: fb.deleteApp }));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: fb.initializeFirestore,
  persistentLocalCache: fb.persistentLocalCache,
  persistentMultipleTabManager: fb.persistentMultipleTabManager,
  doc: fb.doc,
  setDoc: fb.setDoc,
  getDoc: fb.getDoc,
  serverTimestamp: fb.serverTimestamp,
}));
vi.mock('firebase/auth', () => ({
  getAuth: fb.getAuth,
  onAuthStateChanged: fb.onAuthStateChanged,
  signInAnonymously: fb.signInAnonymously,
  signOut: fb.signOut,
}));

import { CloudSync, parseFirebaseConfig, type FirebaseConfig } from '@/utils/cloudSync';

const valid: FirebaseConfig = {
  apiKey: 'AIzaSyA-1234567890abcdefghijklmnopqrstu',
  authDomain: 'my-app.firebaseapp.com',
  projectId: 'my-app',
  appId: '1:123456789012:web:abc123def456',
};

describe('parseFirebaseConfig', () => {
  it('accepts a full web config object and keeps only known fields', () => {
    const config = parseFirebaseConfig({ ...valid, storageBucket: 'my-app.appspot.com', extra: 'x' });
    expect(config).toEqual({ ...valid, storageBucket: 'my-app.appspot.com' });
  });

  it('accepts the JavaScript snippet the Firebase console shows', () => {
    const snippet = `const firebaseConfig = {
      apiKey: "${valid.apiKey}",
      authDomain: "${valid.authDomain}",
      projectId: "${valid.projectId}",
      storageBucket: "my-app.appspot.com",
      messagingSenderId: "123456789012",
      appId: "${valid.appId}"
    };`;
    expect(parseFirebaseConfig(snippet)).toMatchObject(valid);
  });

  it('rejects missing or malformed required fields with every problem listed', () => {
    expect(() => parseFirebaseConfig({ apiKey: 'nope', projectId: 'my-app' })).toThrow(
      /apiKey.*authDomain.*appId/s
    );
  });

  it('rejects non-objects', () => {
    expect(() => parseFirebaseConfig(42)).toThrow(/Firebase web config/);
    expect(() => parseFirebaseConfig('not a config')).toThrow(/Firebase web config/);
  });
});

describe('CloudSync', () => {
  beforeEach(async () => {
    await CloudSync.resetForTests();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it('uses initializeFirestore with a persistent multi-tab cache', async () => {
    await CloudSync.getInstance().initialize(valid);
    expect(fb.initializeApp).toHaveBeenCalledWith(valid);
    expect(fb.persistentLocalCache).toHaveBeenCalledWith({ tabManager: { kind: 'multi-tab' } });
    const settings = (fb.initializeFirestore.mock.calls[0] as unknown[])[1] as Record<string, unknown>;
    expect(settings.localCache).toEqual({ kind: 'persistent', settings: { tabManager: { kind: 'multi-tab' } } });
    expect(settings.ignoreUndefinedProperties).toBe(true);
  });

  it('validates the config before touching Firebase', async () => {
    await expect(CloudSync.getInstance().initialize({ ...valid, appId: '' })).rejects.toThrow(/appId/);
    expect(fb.initializeApp).not.toHaveBeenCalled();
  });

  it('remembers a valid config for the next visit', async () => {
    await CloudSync.getInstance().initialize(valid);
    expect(CloudSync.getSavedConfig()).toEqual(valid);
  });

  it('unsubscribes the auth listener and window listeners on dispose', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const sync = CloudSync.getInstance();
    await sync.initialize(valid);
    await sync.dispose();
    expect(fb.authUnsubscribe).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(fb.deleteApp).toHaveBeenCalledTimes(1);
  });

  it('auto-sync uploads data from the registered provider', async () => {
    vi.useFakeTimers();
    const sync = CloudSync.getInstance();
    sync.updateOptions({ enabled: true, autoSync: true, syncInterval: 10_000 });
    sync.setLocalDataProvider(() => ({ sessions: [], updatedAt: Date.now() }));
    await sync.initialize(valid);
    fb.emitUser({ uid: 'u1' });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(fb.setDoc).toHaveBeenCalledTimes(1);
    const [ref, data] = fb.setDoc.mock.calls[0] as unknown as [{ path: string }, Record<string, unknown>];
    expect(ref.path).toBe('users/u1');
    expect(typeof data.updatedAt).toBe('number');
  });

  it('does not auto-sync while sync is disabled', async () => {
    vi.useFakeTimers();
    const sync = CloudSync.getInstance();
    sync.updateOptions({ enabled: false, autoSync: true, syncInterval: 10_000 });
    sync.setLocalDataProvider(() => ({ sessions: [] }));
    await sync.initialize(valid);
    fb.emitUser({ uid: 'u1' });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fb.setDoc).not.toHaveBeenCalled();
  });

  it('hands newer cloud data to the remote-data listeners', async () => {
    vi.useFakeTimers();
    fb.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ sessions: [], updatedAt: 5_000, deviceId: 'other' }),
    } as never);
    const sync = CloudSync.getInstance();
    sync.updateOptions({ enabled: true, autoSync: true, syncInterval: 10_000 });
    sync.setLocalDataProvider(() => ({ sessions: [], updatedAt: 1_000 }));
    const onRemote = vi.fn();
    sync.on('remote-data', onRemote);
    await sync.initialize(valid);
    fb.emitUser({ uid: 'u1' });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(onRemote).toHaveBeenCalledWith(expect.objectContaining({ updatedAt: 5_000 }));
    expect(fb.setDoc).not.toHaveBeenCalled();
  });

  it('compares server Timestamps by milliseconds', async () => {
    fb.getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ updatedAt: { toMillis: () => 9_000 } }),
    } as never);
    const sync = CloudSync.getInstance();
    await sync.initialize(valid);
    fb.emitUser({ uid: 'u1' });
    const result = await sync.syncData({ updatedAt: 10_000 });
    expect(result).toBeNull();
    expect(fb.setDoc).toHaveBeenCalledTimes(1);
  });
});

describe('bundle boundary', () => {
  it('no source file imports firebase statically (it must stay a lazy chunk)', () => {
    const root = path.resolve(import.meta.dirname, '../../src');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name) && /^\s*import\s+(?!type\b)[^(]*?from\s+['"]firebase\//m.test(readFileSync(full, 'utf8'))) {
          offenders.push(path.relative(root, full));
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
