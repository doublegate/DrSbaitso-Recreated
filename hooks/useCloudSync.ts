/**
 * useCloudSync Hook
 * React integration for Firebase cloud synchronization
 *
 * @version 1.7.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CloudSync, type SyncStatus, type SyncOptions, type SyncData } from '@/utils/cloudSync';
import type { ConversationSession, AppSettings, SessionStats, CustomCharacter } from '@/types';

export interface UseCloudSyncReturn {
  // Status
  status: SyncStatus;
  options: SyncOptions;
  isAuthenticated: boolean;
  userId: string | null;

  // Actions
  initialize: (apiKey: string, projectId: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  uploadData: (data: Partial<SyncData>) => Promise<void>;
  downloadData: () => Promise<SyncData | null>;
  syncData: (localData: Partial<SyncData>) => Promise<SyncData | null>;
  updateOptions: (options: Partial<SyncOptions>) => void;
  startAutoSync: () => void;
  stopAutoSync: () => void;

  // Events
  onRemoteChange: (callback: (data: SyncData) => void) => () => void;
}

export function useCloudSync(): UseCloudSyncReturn {
  const cloudSync = useRef(CloudSync.getInstance());
  const [status, setStatus] = useState<SyncStatus>(cloudSync.current.getStatus());
  const [options, setOptions] = useState<SyncOptions>(cloudSync.current.getOptions());
  const [isAuthenticated, setIsAuthenticated] = useState(cloudSync.current.isAuthenticated());
  const [userId, setUserId] = useState(cloudSync.current.getUserId());

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(cloudSync.current.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = (data: { isAuthenticated: boolean; userId: string | null }) => {
      setIsAuthenticated(data.isAuthenticated);
      setUserId(data.userId);
    };

    cloudSync.current.on('auth-state-changed', handleAuthChange);

    return () => {
      cloudSync.current.off('auth-state-changed', handleAuthChange);
    };
  }, []);

  // Initialize Firebase
  const initialize = useCallback(async (apiKey: string, projectId: string) => {
    const config = {
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId: '123456789', // Placeholder
      appId: '1:123456789:web:abcdef', // Placeholder
    };

    await cloudSync.current.initialize(config);
  }, []);

  // Sign in anonymously
  const signInAnonymously = useCallback(async () => {
    await cloudSync.current.signInAnonymously();
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await cloudSync.current.signOut();
  }, []);

  // Upload data
  const uploadData = useCallback(async (data: Partial<SyncData>) => {
    await cloudSync.current.uploadData(data);
  }, []);

  // Download data
  const downloadData = useCallback(async (): Promise<SyncData | null> => {
    return await cloudSync.current.downloadData();
  }, []);

  // Sync data
  const syncData = useCallback(
    async (localData: Partial<SyncData>): Promise<SyncData | null> => {
      return await cloudSync.current.syncData(localData);
    },
    []
  );

  // Update options
  const updateOptions = useCallback((newOptions: Partial<SyncOptions>) => {
    cloudSync.current.updateOptions(newOptions);
    setOptions(cloudSync.current.getOptions());
  }, []);

  // Start auto-sync
  const startAutoSync = useCallback(() => {
    cloudSync.current.startAutoSync();
  }, []);

  // Stop auto-sync
  const stopAutoSync = useCallback(() => {
    cloudSync.current.stopAutoSync();
  }, []);

  // Subscribe to remote changes
  const onRemoteChange = useCallback((callback: (data: SyncData) => void) => {
    cloudSync.current.on('remote-change', callback);

    return () => {
      cloudSync.current.off('remote-change', callback);
    };
  }, []);

  return {
    // Status
    status,
    options,
    isAuthenticated,
    userId,

    // Actions
    initialize,
    signInAnonymously,
    signOut,
    uploadData,
    downloadData,
    syncData,
    updateOptions,
    startAutoSync,
    stopAutoSync,

    // Events
    onRemoteChange,
  };
}

export default useCloudSync;
