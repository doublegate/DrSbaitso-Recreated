/**
 * useCloudSync Hook
 * React integration for Firebase cloud synchronization.
 *
 * State follows CloudSync's events (no polling). A config saved by an
 * earlier visit is re-initialised on mount when sync is enabled. When the
 * last component using the hook unmounts, the CloudSync instance is
 * disposed (auth listener, timers and window listeners released).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CloudSync,
  type FirebaseConfig,
  type LocalDataProvider,
  type SyncStatus,
  type SyncOptions,
  type SyncData,
} from '@/utils/cloudSync';

export interface UseCloudSyncReturn {
  // Status
  status: SyncStatus;
  options: SyncOptions;
  isAuthenticated: boolean;
  isConfigured: boolean;
  userId: string | null;

  // Actions
  /** Accepts a config object, JSON, or the Firebase console's JS snippet. */
  initialize: (config: FirebaseConfig | string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  uploadData: (data: Partial<SyncData>) => Promise<void>;
  downloadData: () => Promise<SyncData | null>;
  syncData: (localData: Partial<SyncData>) => Promise<SyncData | null>;
  /** One sync round with the registered local data provider. */
  syncNow: () => Promise<SyncData | null>;
  setLocalDataProvider: (provider: LocalDataProvider | null) => void;
  updateOptions: (options: Partial<SyncOptions>) => void;
  startAutoSync: () => void;
  stopAutoSync: () => void;

  // Events
  onRemoteChange: (callback: (data: SyncData) => void) => () => void;
  /** Cloud data that won a sync round (manual or automatic). */
  onRemoteData: (callback: (data: SyncData) => void) => () => void;
}

let mountedConsumers = 0;

function subscribe(event: string, callback: (data: SyncData) => void): () => void {
  const instance = CloudSync.getInstance();
  const listener = (data: unknown) => callback(data as SyncData);
  instance.on(event, listener);
  return () => instance.off(event, listener);
}

export function useCloudSync(): UseCloudSyncReturn {
  const sync = () => CloudSync.getInstance();
  const [status, setStatus] = useState<SyncStatus>(() => sync().getStatus());
  const [options, setOptions] = useState<SyncOptions>(() => sync().getOptions());
  const [isAuthenticated, setIsAuthenticated] = useState(() => sync().isAuthenticated());
  const [isConfigured, setIsConfigured] = useState(() => sync().isInitialized());
  const [userId, setUserId] = useState(() => sync().getUserId());

  useEffect(() => {
    mountedConsumers++;
    const instance = CloudSync.getInstance();

    const handleAuth = (data: unknown) => {
      const { isAuthenticated: authed, userId: uid } = data as { isAuthenticated: boolean; userId: string | null };
      setIsAuthenticated(authed);
      setUserId(uid);
    };
    const handleStatus = (data: unknown) => setStatus(data as SyncStatus);
    const handleOptions = (data: unknown) => setOptions(data as SyncOptions);

    instance.on('auth-state-changed', handleAuth);
    instance.on('status-changed', handleStatus);
    instance.on('options-changed', handleOptions);

    // Reconnect with the config saved by an earlier visit.
    const saved = CloudSync.getSavedConfig();
    if (saved && instance.getOptions().enabled && !instance.isInitialized()) {
      instance
        .initialize(saved)
        .then(() => setIsConfigured(true))
        .catch((error: unknown) => console.warn('[CloudSync] Could not reconnect:', error));
    }

    return () => {
      instance.off('auth-state-changed', handleAuth);
      instance.off('status-changed', handleStatus);
      instance.off('options-changed', handleOptions);
      mountedConsumers--;
      if (mountedConsumers === 0) {
        void instance.dispose();
      }
    };
  }, []);

  const initialize = useCallback(async (config: FirebaseConfig | string) => {
    await CloudSync.getInstance().initialize(config);
    setIsConfigured(true);
  }, []);

  const signInAnonymously = useCallback(() => CloudSync.getInstance().signInAnonymously(), []);
  const signOut = useCallback(() => CloudSync.getInstance().signOut(), []);
  const uploadData = useCallback((data: Partial<SyncData>) => CloudSync.getInstance().uploadData(data), []);
  const downloadData = useCallback(() => CloudSync.getInstance().downloadData(), []);
  const syncData = useCallback((localData: Partial<SyncData>) => CloudSync.getInstance().syncData(localData), []);
  const syncNow = useCallback(() => CloudSync.getInstance().syncNow(), []);
  const setLocalDataProvider = useCallback(
    (provider: LocalDataProvider | null) => CloudSync.getInstance().setLocalDataProvider(provider),
    [],
  );
  const updateOptions = useCallback((newOptions: Partial<SyncOptions>) => {
    CloudSync.getInstance().updateOptions(newOptions);
  }, []);
  const startAutoSync = useCallback(() => CloudSync.getInstance().startAutoSync(), []);
  const stopAutoSync = useCallback(() => CloudSync.getInstance().stopAutoSync(), []);

  const onRemoteChange = useCallback((callback: (data: SyncData) => void) => subscribe('remote-change', callback), []);
  const onRemoteData = useCallback((callback: (data: SyncData) => void) => subscribe('remote-data', callback), []);

  return {
    status,
    options,
    isAuthenticated,
    isConfigured,
    userId,
    initialize,
    signInAnonymously,
    signOut,
    uploadData,
    downloadData,
    syncData,
    syncNow,
    setLocalDataProvider,
    updateOptions,
    startAutoSync,
    stopAutoSync,
    onRemoteChange,
    onRemoteData,
  };
}

export default useCloudSync;
