/**
 * Sound Pack Manager Component
 *
 * UI for browsing, installing, activating and sharing custom sound packs.
 * Packs are stored in IndexedDB (see utils/soundPackStore); the active pack
 * is remembered across reloads by utils/soundPackPlayer.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { Theme } from '@/constants';
import type { SoundPack } from '@/utils/soundPackFormat';
import { generateShareCode, parseShareCode, getSoundPackSize } from '@/utils/soundPackFormat';
import { soundPackPlayer, activateSoundPack, deactivateSoundPack } from '@/utils/soundPackPlayer';
import { listSoundPacks, saveSoundPack, deleteSoundPack } from '@/utils/soundPackStore';

interface SoundPackManagerProps {
  theme: Theme;
  /** @deprecated Ignored: packs always play on the shared AudioContext. */
  audioContext?: AudioContext | null;
  onClose: () => void;
  onCreateNew: () => void;
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

export default function SoundPackManager({
  theme,
  onClose,
  onCreateNew
}: SoundPackManagerProps) {
  const [installedPacks, setInstalledPacks] = useState<SoundPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<SoundPack | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [showShareInput, setShowShareInput] = useState(false);
  const [shareInput, setShareInput] = useState('');
  const [currentPackId, setCurrentPackId] = useState<string | null>(
    () => soundPackPlayer.getCurrentPack()?.metadata.name ?? null
  );
  const [status, setStatus] = useState('');

  const refresh = useCallback(async () => {
    try {
      setInstalledPacks(await listSoundPacks());
    } catch (error) {
      console.error('Failed to load sound packs:', error);
      setStatus(`Could not read installed sound packs: ${errorText(error)}`);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Install a pack
  const installPack = useCallback(async (pack: SoundPack) => {
    const existing = installedPacks.some(p => p.metadata.name === pack.metadata.name);
    if (existing && !confirm(`A pack named "${pack.metadata.name}" already exists. Replace it?`)) {
      return;
    }

    try {
      await saveSoundPack(pack);
      await refresh();
      setStatus(`Sound pack "${pack.metadata.name}" installed.`);
    } catch (error) {
      console.error('Failed to save sound pack:', error);
      setStatus(`Failed to install sound pack: ${errorText(error)}`);
    }
  }, [installedPacks, refresh]);

  // Uninstall a pack
  const uninstallPack = useCallback(async (packName: string) => {
    if (!confirm(`Are you sure you want to uninstall "${packName}"?`)) return;

    try {
      await deleteSoundPack(packName);
      if (currentPackId === packName) {
        deactivateSoundPack();
        setCurrentPackId(null);
      }
      setSelectedPack(null);
      await refresh();
      setStatus(`Sound pack "${packName}" uninstalled.`);
    } catch (error) {
      setStatus(`Failed to uninstall sound pack: ${errorText(error)}`);
    }
  }, [currentPackId, refresh]);

  // Load/activate a pack
  const loadPack = useCallback(async (pack: SoundPack) => {
    try {
      await activateSoundPack(pack);
      setCurrentPackId(pack.metadata.name);
      setStatus(`Sound pack "${pack.metadata.name}" is now active.`);
    } catch (error) {
      console.error('Failed to load sound pack:', error);
      setStatus(`Failed to load sound pack: ${errorText(error)}`);
    }
  }, []);

  // Unload current pack
  const unloadCurrentPack = useCallback(() => {
    deactivateSoundPack();
    setCurrentPackId(null);
    setStatus('Sound pack unloaded.');
  }, []);

  // Generate share code for selected pack
  const handleGenerateShareCode = useCallback(() => {
    if (!selectedPack) return;

    try {
      setShareCode(generateShareCode(selectedPack));
      setStatus('Share code generated.');
    } catch (error) {
      setStatus(`Failed to generate share code: ${errorText(error)}`);
    }
  }, [selectedPack]);

  // Install from a pasted share code (parseShareCode validates the schema)
  const handleInstallFromShareCode = useCallback(async () => {
    const code = shareInput.trim();
    if (!code) return;

    try {
      const pack = parseShareCode(code);
      await installPack(pack);
      setShareInput('');
      setShowShareInput(false);
    } catch (error) {
      setStatus(`Failed to install from share code: ${errorText(error)}`);
    }
  }, [shareInput, installPack]);

  // Copy share code to clipboard
  const copyShareCode = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(shareCode);
      setStatus('Share code copied to clipboard.');
    } catch {
      setStatus('Could not copy automatically. Select the share code and copy it manually.');
    }
  }, [shareCode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-auto border-4 rounded-sm p-6"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          borderColor: theme.colors.primary
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🎵 Sound Pack Manager</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 rounded-sm hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.background
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={onCreateNew}
            className="px-4 py-2 border-2 rounded-sm hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.primary,
              color: theme.colors.background
            }}
          >
            ➕ Create New Pack
          </button>

          <button
            onClick={() => setShowShareInput(v => !v)}
            aria-expanded={showShareInput}
            className="px-4 py-2 border-2 rounded-sm hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.background
            }}
          >
            📥 Install from Share Code
          </button>

          {currentPackId && (
            <button
              onClick={unloadCurrentPack}
              className="px-4 py-2 border-2 rounded-sm hover:opacity-80"
              style={{
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.background
              }}
            >
              ⏹️ Unload Current Pack
            </button>
          )}
        </div>

        {status && (
          <p role="status" className="mb-4 text-sm">
            {status}
          </p>
        )}

        {showShareInput && (
          <div className="mb-6 flex gap-2">
            <label htmlFor="sound-pack-share-input" className="sr-only">
              Share code
            </label>
            <textarea
              id="sound-pack-share-input"
              value={shareInput}
              onChange={(e) => setShareInput(e.target.value)}
              placeholder="Paste a share code"
              className="flex-1 p-2 border rounded-sm text-xs font-mono"
              style={{
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }}
              rows={3}
            />
            <button
              onClick={() => void handleInstallFromShareCode()}
              disabled={!shareInput.trim()}
              className="px-3 py-1 border rounded-sm hover:opacity-80"
              style={{ borderColor: theme.colors.primary }}
            >
              Install
            </button>
          </div>
        )}

        {/* Current Pack Status */}
        {currentPackId && (
          <div
            className="mb-6 p-4 border-2 rounded-sm"
            style={{ borderColor: '#00FF00', backgroundColor: 'rgba(0, 255, 0, 0.1)' }}
          >
            <div className="font-bold text-green-400 mb-1">✓ Active Sound Pack:</div>
            <div>{currentPackId}</div>
            <div className="text-sm opacity-70">
              {soundPackPlayer.getLoadedSoundCount()} sounds loaded
            </div>
          </div>
        )}

        {/* Installed Packs Grid */}
        <div className="mb-6">
          <h3 className="text-xl mb-4">📦 Installed Packs ({installedPacks.length})</h3>

          {installedPacks.length === 0 ? (
            <div className="text-center py-8 opacity-70">
              <div className="mb-2">No sound packs installed</div>
              <div className="text-sm">Create a new pack or install one from a share code</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {installedPacks.map((pack) => (
                <div
                  key={pack.metadata.name}
                  className="p-4 border-2 rounded-sm cursor-pointer hover:opacity-80"
                  style={{
                    borderColor: selectedPack?.metadata.name === pack.metadata.name
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: selectedPack?.metadata.name === pack.metadata.name
                      ? theme.colors.border
                      : 'transparent'
                  }}
                  onClick={() => setSelectedPack(pack)}
                >
                  <div className="font-bold text-lg mb-1">{pack.metadata.name}</div>
                  <div className="text-sm opacity-70 mb-2">by {pack.metadata.author}</div>
                  <div className="text-xs opacity-60 mb-3">
                    v{pack.metadata.version} • {pack.sounds.length} sounds • {pack.triggers.length} triggers
                  </div>
                  {pack.metadata.description && (
                    <div className="text-sm mb-3 line-clamp-2">{pack.metadata.description}</div>
                  )}
                  {pack.metadata.tags.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {pack.metadata.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-sm"
                          style={{ backgroundColor: theme.colors.border }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadPack(pack);
                      }}
                      className="flex-1 px-3 py-1 border rounded-sm text-sm hover:opacity-80"
                      style={{
                        borderColor: theme.colors.primary,
                        backgroundColor: currentPackId === pack.metadata.name
                          ? theme.colors.primary
                          : theme.colors.background,
                        color: currentPackId === pack.metadata.name
                          ? theme.colors.background
                          : theme.colors.text
                      }}
                      disabled={currentPackId === pack.metadata.name}
                    >
                      {currentPackId === pack.metadata.name ? '✓ Active' : '▶ Load'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        uninstallPack(pack.metadata.name);
                      }}
                      className="px-3 py-1 border rounded-sm text-sm hover:opacity-80"
                      style={{ borderColor: theme.colors.primary }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pack Details & Sharing */}
        {selectedPack && (
          <div className="p-4 border-2 rounded-sm" style={{ borderColor: theme.colors.primary }}>
            <h3 className="text-xl mb-4">📋 Pack Details</h3>

            <div className="space-y-3 mb-4">
              <div>
                <span className="font-bold">Name:</span> {selectedPack.metadata.name}
              </div>
              <div>
                <span className="font-bold">Author:</span> {selectedPack.metadata.author}
              </div>
              <div>
                <span className="font-bold">Version:</span> {selectedPack.metadata.version}
              </div>
              <div>
                <span className="font-bold">Size:</span> {getSoundPackSize(selectedPack).toFixed(2)} KB
              </div>
              <div>
                <span className="font-bold">Created:</span>{' '}
                {new Date(selectedPack.metadata.created).toLocaleDateString()}
              </div>
              <div>
                <span className="font-bold">Updated:</span>{' '}
                {new Date(selectedPack.metadata.updated).toLocaleDateString()}
              </div>
            </div>

            {/* Sound List */}
            <div className="mb-4">
              <div className="font-bold mb-2">🔊 Sounds:</div>
              <div className="max-h-32 overflow-y-auto text-sm">
                {selectedPack.sounds.map(sound => (
                  <div key={sound.id} className="py-1 opacity-80">
                    • {sound.name} ({sound.duration}ms, {sound.volume}% volume)
                  </div>
                ))}
              </div>
            </div>

            {/* Sharing */}
            <div>
              <button
                onClick={handleGenerateShareCode}
                className="w-full px-4 py-2 border-2 rounded-sm hover:opacity-80 mb-2"
                style={{
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.background
                }}
              >
                🔗 Generate Share Code
              </button>

              {shareCode && (
                <div className="mt-2">
                  <div className="text-sm mb-2 opacity-70">Share Code (copy to share this pack):</div>
                  <div className="flex gap-2">
                    <textarea
                      value={shareCode}
                      readOnly
                      className="flex-1 p-2 border rounded-sm text-xs font-mono"
                      style={{
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }}
                      rows={3}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                    <button
                      onClick={copyShareCode}
                      className="px-3 py-1 border rounded-sm hover:opacity-80"
                      style={{ borderColor: theme.colors.primary }}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
