/**
 * AccessibilityPanel Component
 *
 * UI panel for configuring accessibility settings.
 * Provides controls for high contrast, reduced motion, font size,
 * screen reader optimization, and keyboard navigation hints.
 *
 * @module AccessibilityPanel
 * @since 1.4.0
 */

import React from 'react';
import { AccessibilitySettings } from '../utils/accessibilityManager';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface AccessibilityPanelProps {
  isOpen: boolean;
  settings: AccessibilitySettings;
  onClose: () => void;
  onUpdateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  onResetSettings: () => void;
}

export default function AccessibilityPanel({
  isOpen,
  settings,
  onClose,
  onUpdateSetting,
  onResetSettings
}: AccessibilityPanelProps) {
  const containerRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-panel-title"
      aria-describedby="a11y-panel-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={containerRef}
        className="bg-blue-900 border-4 border-white p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: 'monospace',
          color: '#ffffff'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 id="a11y-panel-title" className="text-2xl font-bold">
            ACCESSIBILITY SETTINGS
          </h2>
          <button
            onClick={onClose}
            aria-label="Close accessibility settings"
            className="text-yellow-300 hover:text-yellow-100 text-2xl font-bold px-3 py-1 border-2 border-yellow-300 hover:border-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          >
            X
          </button>
        </div>

        <p id="a11y-panel-description" className="text-sm mb-6 text-gray-300">
          Configure accessibility features to improve your experience. These settings are saved automatically.
        </p>

        {/* Settings Grid */}
        <div className="space-y-6">
          {/* High Contrast Mode */}
          <div className="border-2 border-gray-400 p-4">
            <label
              htmlFor="high-contrast-toggle"
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-lg">HIGH CONTRAST MODE</div>
                <div className="text-sm text-gray-300 mt-1">
                  Increases contrast between text and background for better visibility
                </div>
              </div>
              <button
                id="high-contrast-toggle"
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => onUpdateSetting('highContrast', !settings.highContrast)}
                className={`ml-4 px-6 py-2 border-2 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  settings.highContrast
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-gray-700 border-gray-500 text-gray-300'
                }`}
              >
                {settings.highContrast ? 'ON' : 'OFF'}
              </button>
            </label>
          </div>

          {/* Reduced Motion */}
          <div className="border-2 border-gray-400 p-4">
            <label
              htmlFor="reduced-motion-toggle"
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-lg">REDUCED MOTION</div>
                <div className="text-sm text-gray-300 mt-1">
                  Minimizes animations and transitions for users with motion sensitivity
                </div>
              </div>
              <button
                id="reduced-motion-toggle"
                role="switch"
                aria-checked={settings.reducedMotion}
                onClick={() => onUpdateSetting('reducedMotion', !settings.reducedMotion)}
                className={`ml-4 px-6 py-2 border-2 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  settings.reducedMotion
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-gray-700 border-gray-500 text-gray-300'
                }`}
              >
                {settings.reducedMotion ? 'ON' : 'OFF'}
              </button>
            </label>
          </div>

          {/* Font Size */}
          <div className="border-2 border-gray-400 p-4">
            <label htmlFor="font-size-select">
              <div className="font-bold text-lg mb-2">FONT SIZE</div>
              <div className="text-sm text-gray-300 mb-3">
                Adjust text size for better readability
              </div>
              <select
                id="font-size-select"
                value={settings.fontSize}
                onChange={(e) =>
                  onUpdateSetting('fontSize', e.target.value as AccessibilitySettings['fontSize'])
                }
                className="w-full bg-blue-800 border-2 border-gray-400 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value="small">SMALL (12px)</option>
                <option value="medium">MEDIUM (16px) - Default</option>
                <option value="large">LARGE (20px)</option>
                <option value="x-large">EXTRA LARGE (24px)</option>
              </select>
            </label>
          </div>

          {/* Focus Indicator Style */}
          <div className="border-2 border-gray-400 p-4">
            <label htmlFor="focus-style-select">
              <div className="font-bold text-lg mb-2">FOCUS INDICATOR STYLE</div>
              <div className="text-sm text-gray-300 mb-3">
                Change how focused elements are highlighted
              </div>
              <select
                id="focus-style-select"
                value={settings.focusIndicatorStyle}
                onChange={(e) =>
                  onUpdateSetting(
                    'focusIndicatorStyle',
                    e.target.value as AccessibilitySettings['focusIndicatorStyle']
                  )
                }
                className="w-full bg-blue-800 border-2 border-gray-400 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                <option value="default">DEFAULT (3px outline)</option>
                <option value="thick">THICK (5px outline)</option>
                <option value="underline">UNDERLINE (bottom border)</option>
              </select>
            </label>
          </div>

          {/* Screen Reader Optimized */}
          <div className="border-2 border-gray-400 p-4">
            <label
              htmlFor="screen-reader-toggle"
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-lg">SCREEN READER OPTIMIZATION</div>
                <div className="text-sm text-gray-300 mt-1">
                  Enhanced ARIA labels and descriptions for screen reader users
                </div>
              </div>
              <button
                id="screen-reader-toggle"
                role="switch"
                aria-checked={settings.screenReaderOptimized}
                onClick={() =>
                  onUpdateSetting('screenReaderOptimized', !settings.screenReaderOptimized)
                }
                className={`ml-4 px-6 py-2 border-2 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  settings.screenReaderOptimized
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-gray-700 border-gray-500 text-gray-300'
                }`}
              >
                {settings.screenReaderOptimized ? 'ON' : 'OFF'}
              </button>
            </label>
          </div>

          {/* Message Announcements */}
          <div className="border-2 border-gray-400 p-4">
            <label
              htmlFor="announce-messages-toggle"
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-lg">ANNOUNCE NEW MESSAGES</div>
                <div className="text-sm text-gray-300 mt-1">
                  Screen readers will announce new messages as they arrive
                </div>
              </div>
              <button
                id="announce-messages-toggle"
                role="switch"
                aria-checked={settings.announceMessages}
                onClick={() => onUpdateSetting('announceMessages', !settings.announceMessages)}
                className={`ml-4 px-6 py-2 border-2 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  settings.announceMessages
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-gray-700 border-gray-500 text-gray-300'
                }`}
              >
                {settings.announceMessages ? 'ON' : 'OFF'}
              </button>
            </label>
          </div>

          {/* Keyboard Navigation Hints */}
          <div className="border-2 border-gray-400 p-4">
            <label
              htmlFor="keyboard-hints-toggle"
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-bold text-lg">KEYBOARD NAVIGATION HINTS</div>
                <div className="text-sm text-gray-300 mt-1">
                  Show helpful hints when navigating with keyboard
                </div>
              </div>
              <button
                id="keyboard-hints-toggle"
                role="switch"
                aria-checked={settings.keyboardNavigationHints}
                onClick={() =>
                  onUpdateSetting('keyboardNavigationHints', !settings.keyboardNavigationHints)
                }
                className={`ml-4 px-6 py-2 border-2 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  settings.keyboardNavigationHints
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-gray-700 border-gray-500 text-gray-300'
                }`}
              >
                {settings.keyboardNavigationHints ? 'ON' : 'OFF'}
              </button>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-4 border-t-2 border-gray-400">
          <button
            onClick={onResetSettings}
            className="px-6 py-2 bg-red-600 border-2 border-red-400 text-white font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          >
            RESET TO DEFAULTS
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2 bg-green-600 border-2 border-green-400 text-white font-bold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          >
            CLOSE
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          Settings are automatically saved and persist across sessions
        </div>
      </div>
    </div>
  );
}
