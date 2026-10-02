/**
 * CloudSyncSettings Component
 * User interface for cloud synchronization configuration
 *
 * @version 1.7.0
 */

import React, { useState } from 'react';
import type { SyncStatus, SyncOptions } from '@/utils/cloudSync';

export interface CloudSyncSettingsProps {
  status: SyncStatus;
  options: SyncOptions;
  isAuthenticated: boolean;
  userId: string | null;
  /** Whether a Firebase web config has been accepted. */
  isConfigured?: boolean;
  /** Receives the pasted Firebase web config (object literal, JSON or console snippet); rejects with a readable error. */
  onConfigure?: (configText: string) => Promise<void>;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onUpdateOptions: (options: Partial<SyncOptions>) => void;
  onManualSync: () => void;
}

export const CloudSyncSettings: React.FC<CloudSyncSettingsProps> = ({
  status,
  options,
  isAuthenticated,
  userId,
  isConfigured = true,
  onConfigure,
  onClose,
  onSignIn,
  onSignOut,
  onUpdateOptions,
  onManualSync,
}) => {
  const [configText, setConfigText] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);

  const submitConfig = async () => {
    if (!onConfigure) return;
    setConfiguring(true);
    setConfigError(null);
    try {
      await onConfigure(configText);
      setConfigText('');
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Could not connect to Firebase');
    } finally {
      setConfiguring(false);
    }
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={onClose}
      role="dialog"
      aria-labelledby="cloud-sync-title"
      aria-modal="true"
    >
      <div
        style={{
          backgroundColor: '#000080',
          color: '#FFFF00',
          border: '4px solid #FFFF00',
          padding: '30px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          fontFamily: "'Courier New', monospace",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: '2px solid #FFFF00',
            paddingBottom: '12px',
          }}
        >
          <h2 id="cloud-sync-title" style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            ☁️ CLOUD SYNC SETTINGS
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#CC0000',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              fontFamily: "'Courier New', monospace",
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            aria-label="Close cloud sync settings"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Status Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>📊 STATUS</h3>
          <div style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <div>
              <strong>Connection:</strong>{' '}
              <span style={{ color: status.isOnline ? '#00FF00' : '#FF0000' }}>
                {status.isOnline ? '● ONLINE' : '● OFFLINE'}
              </span>
            </div>
            <div>
              <strong>Authentication:</strong>{' '}
              <span style={{ color: isAuthenticated ? '#00FF00' : '#808080' }}>
                {isAuthenticated ? '✓ SIGNED IN' : '✗ NOT SIGNED IN'}
              </span>
            </div>
            {isAuthenticated && (
              <div>
                <strong>User ID:</strong> {userId?.substring(0, 16)}...
              </div>
            )}
            <div>
              <strong>Sync Status:</strong>{' '}
              {status.isSyncing ? 'SYNCING...' : 'IDLE'}
            </div>
            <div>
              <strong>Last Synced:</strong> {formatTimestamp(status.lastSyncedAt)}
            </div>
            <div>
              <strong>Pending Changes:</strong> {status.pendingChanges}
            </div>
            {status.error && (
              <div style={{ color: '#FF0000' }}>
                <strong>Error:</strong> {status.error}
              </div>
            )}
          </div>
        </div>

        {/* Firebase project configuration */}
        {!isConfigured && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>FIREBASE PROJECT</h3>
            <div style={{ paddingLeft: '20px' }}>
              <p style={{ marginBottom: '8px' }}>
                Cloud sync stores data in your own Firebase project. Paste its web app config
                (Firebase console, Project settings, Your apps). It needs apiKey, authDomain,
                projectId and appId, with Anonymous sign-in and Firestore enabled.
              </p>
              <label htmlFor="cloud-sync-config" style={{ display: 'block', marginBottom: '4px' }}>
                Firebase web config:
              </label>
              <textarea
                id="cloud-sync-config"
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                rows={7}
                spellCheck={false}
                placeholder={'{\n  apiKey: "AIza...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app",\n  appId: "1:123:web:abc"\n}'}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  border: '2px solid #FFFF00',
                  padding: '8px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '12px',
                }}
              />
              {configError && (
                <p role="alert" style={{ color: '#FF6060', marginTop: '8px' }}>
                  {configError}
                </p>
              )}
              <button
                onClick={() => void submitConfig()}
                disabled={configuring || !configText.trim() || !onConfigure}
                style={{
                  backgroundColor: configuring ? '#808080' : '#FFFF00',
                  color: '#000080',
                  border: 'none',
                  padding: '12px 24px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: configuring ? 'not-allowed' : 'pointer',
                  marginTop: '8px',
                }}
              >
                {configuring ? 'CONNECTING...' : 'CONNECT'}
              </button>
            </div>
          </div>
        )}

        {/* Authentication Section */}
        {isConfigured && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>🔐 AUTHENTICATION</h3>
          <div style={{ paddingLeft: '20px' }}>
            {!isAuthenticated ? (
              <div>
                <p style={{ marginBottom: '12px' }}>
                  Sign in to enable cloud synchronization across devices.
                </p>
                <button
                  onClick={onSignIn}
                  style={{
                    backgroundColor: '#00FF00',
                    color: '#000000',
                    border: 'none',
                    padding: '12px 24px',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  SIGN IN ANONYMOUSLY
                </button>
                <p style={{ fontSize: '12px', color: '#CCCCCC', marginTop: '8px' }}>
                  Anonymous sign-in needs no email, but the account belongs to this browser
                  profile: clearing site data or using another device starts a new, empty account.
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={onSignOut}
                  style={{
                    backgroundColor: '#CC0000',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 24px',
                    fontFamily: "'Courier New', monospace",
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  SIGN OUT
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Sync Options */}
        {isConfigured && isAuthenticated && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>⚙️ SYNC OPTIONS</h3>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={options.enabled}
                    onChange={(e) => onUpdateOptions({ enabled: e.target.checked })}
                    style={{ marginRight: '8px', width: '20px', height: '20px' }}
                  />
                  <span>Enable Cloud Sync</span>
                </label>
              </div>

              {options.enabled && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={options.autoSync}
                        onChange={(e) => onUpdateOptions({ autoSync: e.target.checked })}
                        style={{ marginRight: '8px', width: '20px', height: '20px' }}
                      />
                      <span>Auto-Sync (every {options.syncInterval / 1000} seconds)</span>
                    </label>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>
                      Sync Interval (seconds):
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="10"
                      value={options.syncInterval / 1000}
                      onChange={(e) =>
                        onUpdateOptions({ syncInterval: parseInt(e.target.value) * 1000 })
                      }
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        border: '2px solid #FFFF00',
                        padding: '8px',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '14px',
                        width: '100px',
                      }}
                    />
                  </div>

                  <p style={{ marginBottom: '12px', fontSize: '12px', color: '#CCCCCC' }}>
                    Conflicts: the most recently changed copy wins.
                  </p>

                  <button
                    onClick={onManualSync}
                    disabled={status.isSyncing}
                    style={{
                      backgroundColor: status.isSyncing ? '#808080' : '#FFFF00',
                      color: '#000080',
                      border: 'none',
                      padding: '12px 24px',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: status.isSyncing ? 'not-allowed' : 'pointer',
                      marginTop: '8px',
                    }}
                  >
                    {status.isSyncing ? 'SYNCING...' : '🔄 SYNC NOW'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div style={{ marginTop: '24px', borderTop: '2px solid #FFFF00', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>ℹ️ INFORMATION</h3>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#CCCCCC' }}>
            <p>
              <strong>What is Cloud Sync?</strong>
            </p>
            <p>
              Cloud Sync allows you to save your conversations, settings, and custom characters to
              the cloud. Access your data from any device by signing in.
            </p>
            <p style={{ marginTop: '12px' }}>
              <strong>Privacy:</strong> Data travels over HTTPS and is stored at users/&#123;uid&#125;
              in your own Firestore. Who can read it is decided by that project&apos;s security
              rules, which must limit each document to its owner (request.auth.uid == uid).
            </p>
            <p style={{ marginTop: '12px' }}>
              <strong>Note:</strong> The Firebase config is saved in this browser so sync can
              reconnect on your next visit. Web API keys are not secrets; the security rules are
              what protect the data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncSettings;
