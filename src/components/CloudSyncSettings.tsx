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
  onClose,
  onSignIn,
  onSignOut,
  onUpdateOptions,
  onManualSync,
}) => {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

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

        {/* Authentication Section */}
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
                  Anonymous sign-in doesn't require an email. Your data will be accessible from any
                  device using this browser.
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

        {/* Sync Options */}
        {isAuthenticated && (
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

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px' }}>
                      Conflict Resolution:
                    </label>
                    <select
                      value={options.conflictResolution}
                      onChange={(e) =>
                        onUpdateOptions({
                          conflictResolution: e.target.value as 'last-write-wins' | 'manual',
                        })
                      }
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#000000',
                        border: '2px solid #FFFF00',
                        padding: '8px',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '14px',
                        width: '200px',
                      }}
                    >
                      <option value="last-write-wins">Last Write Wins</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

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
              <strong>Privacy:</strong> Your data is encrypted in transit and stored securely. Only
              you can access your synchronized data.
            </p>
            <p style={{ marginTop: '12px' }}>
              <strong>Note:</strong> This feature requires a Firebase project. See documentation
              for setup instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncSettings;
