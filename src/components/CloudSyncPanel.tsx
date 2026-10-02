/**
 * CloudSyncPanel: CloudSyncSettings wired to useCloudSync.
 *
 * Render it lazily (React.lazy) so the cloud-sync code is only loaded when
 * the panel is opened; Firebase itself is loaded later still, on connect.
 * Auto-sync keeps running while the panel is mounted; closing it disposes
 * the sync instance (it reconnects from the saved config next time).
 */

import { useEffect, useEffectEvent, useState } from 'react';
import { CloudSyncSettings } from './CloudSyncSettings';
import { useCloudSync } from '@/hooks/useCloudSync';
import type { SyncData } from '@/utils/cloudSync';

export interface CloudSyncPanelProps {
  onClose: () => void;
  /** Local data to upload (sessions, settings, ...), with `updatedAt` = last local change. */
  getLocalData: () => Partial<SyncData>;
  /** Called with cloud data that is newer than the local copy; apply it locally. */
  onRemoteData: (data: SyncData) => void;
}

export default function CloudSyncPanel({ onClose, getLocalData, onRemoteData }: CloudSyncPanelProps) {
  const cloud = useCloudSync();
  const [message, setMessage] = useState<string | null>(null);

  const provideLocalData = useEffectEvent(() => getLocalData());
  const handleRemote = useEffectEvent((data: SyncData) => onRemoteData(data));

  const { setLocalDataProvider, onRemoteData: subscribeRemoteData } = cloud;
  useEffect(() => {
    setLocalDataProvider(() => provideLocalData());
    const off = subscribeRemoteData((data) => handleRemote(data));
    return () => {
      off();
      setLocalDataProvider(null);
    };
  }, [setLocalDataProvider, subscribeRemoteData]);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage(`${failure}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  };

  return (
    <>
      <CloudSyncSettings
        status={cloud.status}
        options={cloud.options}
        isAuthenticated={cloud.isAuthenticated}
        userId={cloud.userId}
        isConfigured={cloud.isConfigured}
        onConfigure={async (text) => {
          await cloud.initialize(text);
          cloud.updateOptions({ enabled: true });
        }}
        onClose={onClose}
        onSignIn={() => void run(cloud.signInAnonymously, 'Sign-in failed')}
        onSignOut={() => void run(cloud.signOut, 'Sign-out failed')}
        onUpdateOptions={cloud.updateOptions}
        onManualSync={() => void run(cloud.syncNow, 'Sync failed')}
      />
      {message && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10001,
            background: '#CC0000',
            color: '#FFFFFF',
            padding: '8px 16px',
            fontFamily: "'Courier New', monospace",
          }}
        >
          {message}
        </div>
      )}
    </>
  );
}
