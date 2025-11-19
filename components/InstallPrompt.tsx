/**
 * Custom PWA Install Prompt Component (v1.10.0)
 *
 * Provides a better install experience than the browser's default prompt.
 * Shows benefits of installing and allows user to install or dismiss.
 */

import React from 'react';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
  theme: {
    colors: {
      background: string;
      text: string;
      accent: string;
      border: string;
    };
  };
}

export default function InstallPrompt({ onInstall, onDismiss, theme }: InstallPromptProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up"
      role="dialog"
      aria-labelledby="install-title"
      aria-describedby="install-description"
    >
      <div
        className="border-4 rounded-lg p-4 shadow-2xl"
        style={{
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.accent,
          boxShadow: `0 0 30px ${theme.colors.accent}33`
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3
            id="install-title"
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: theme.colors.accent }}
          >
            📱 Install Dr. Sbaitso
          </h3>
          <button
            onClick={onDismiss}
            className="text-2xl hover:opacity-70 focus:outline-none focus:ring-2 rounded"
            style={{ color: theme.colors.text }}
            aria-label="Dismiss install prompt"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p
          id="install-description"
          className="text-sm mb-4"
          style={{ color: theme.colors.text }}
        >
          Get the full retro AI experience! Install for:
        </p>

        {/* Benefits */}
        <ul className="text-sm mb-4 space-y-2" style={{ color: theme.colors.text }}>
          <li className="flex items-start gap-2">
            <span style={{ color: theme.colors.accent }}>✓</span>
            <span>Offline access to past conversations</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: theme.colors.accent }}>✓</span>
            <span>Faster loading times</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: theme.colors.accent }}>✓</span>
            <span>Desktop/homescreen shortcut</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: theme.colors.accent }}>✓</span>
            <span>Full-screen immersive experience</span>
          </li>
        </ul>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onInstall}
            className="flex-1 px-4 py-2 font-bold rounded hover:opacity-90 focus:outline-none focus:ring-2 transition-opacity"
            style={{
              backgroundColor: theme.colors.accent,
              color: theme.colors.background
            }}
          >
            Install Now
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 font-bold rounded hover:opacity-70 focus:outline-none focus:ring-2 transition-opacity"
            style={{
              backgroundColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            Maybe Later
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs mt-3 opacity-70" style={{ color: theme.colors.text }}>
          Takes only a few seconds • No app store needed
        </p>
      </div>
    </div>
  );
}
