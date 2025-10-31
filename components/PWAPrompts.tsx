/**
 * PWAPrompts Component - User prompts for PWA features
 *
 * Displays:
 * - Install prompt for adding app to home screen
 * - Update available notification
 * - Offline mode indicator
 *
 * @version 1.7.0
 */

import React from 'react';

export interface PWAPromptsProps {
  isInstallable: boolean;
  hasUpdate: boolean;
  isOffline: boolean;
  onInstall: () => void;
  onUpdate: () => void;
  onDismissUpdate: () => void;
}

export const PWAPrompts: React.FC<PWAPromptsProps> = ({
  isInstallable,
  hasUpdate,
  isOffline,
  onInstall,
  onUpdate,
  onDismissUpdate,
}) => {
  return (
    <>
      {/* Offline Indicator */}
      {isOffline && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: '#CC0000',
            color: '#FFFF00',
            padding: '12px 24px',
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            fontWeight: 'bold',
            border: '3px solid #FFFF00',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            textAlign: 'center',
            maxWidth: '90%',
          }}
          role="alert"
          aria-live="assertive"
        >
          ⚠️ OFFLINE MODE - LIMITED FUNCTIONALITY
        </div>
      )}

      {/* Install Prompt */}
      {isInstallable && !isOffline && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            backgroundColor: '#000080',
            color: '#FFFF00',
            padding: '20px',
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            border: '3px solid #FFFF00',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            maxWidth: '90%',
            width: '400px',
          }}
          role="dialog"
          aria-labelledby="install-prompt-title"
        >
          <div
            id="install-prompt-title"
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            📱 INSTALL DR. SBAITSO
          </div>
          <div style={{ marginBottom: '16px', textAlign: 'center', lineHeight: '1.5' }}>
            Install this app on your device for:
            <ul style={{ textAlign: 'left', marginTop: '8px', paddingLeft: '20px' }}>
              <li>Faster loading times</li>
              <li>Offline access to conversations</li>
              <li>Desktop/home screen icon</li>
              <li>Fullscreen experience</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={onInstall}
              style={{
                backgroundColor: '#FFFF00',
                color: '#000080',
                border: 'none',
                padding: '10px 20px',
                fontFamily: "'Courier New', monospace",
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              aria-label="Install app"
            >
              INSTALL NOW
            </button>
            <button
              onClick={() => {
                // Hide prompt by not showing it
                const event = new CustomEvent('pwa-install-dismissed');
                window.dispatchEvent(event);
              }}
              style={{
                backgroundColor: '#808080',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                fontFamily: "'Courier New', monospace",
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              aria-label="Dismiss install prompt"
            >
              LATER
            </button>
          </div>
        </div>
      )}

      {/* Update Available Notification */}
      {hasUpdate && !isOffline && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9998,
            backgroundColor: '#008000',
            color: '#FFFF00',
            padding: '20px',
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            border: '3px solid #FFFF00',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            maxWidth: '90%',
            width: '350px',
          }}
          role="alert"
          aria-live="polite"
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            🔄 UPDATE AVAILABLE
          </div>
          <div style={{ marginBottom: '16px', textAlign: 'center', lineHeight: '1.5' }}>
            A new version of Dr. Sbaitso is available. Update now to get the latest features and
            improvements.
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={onUpdate}
              style={{
                backgroundColor: '#FFFF00',
                color: '#000080',
                border: 'none',
                padding: '10px 20px',
                fontFamily: "'Courier New', monospace",
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              aria-label="Update app now"
            >
              UPDATE NOW
            </button>
            <button
              onClick={onDismissUpdate}
              style={{
                backgroundColor: '#808080',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                fontFamily: "'Courier New', monospace",
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              aria-label="Dismiss update notification"
            >
              LATER
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAPrompts;
