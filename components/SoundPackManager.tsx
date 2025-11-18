/**
 * Sound Pack Manager Component (v1.10.0)
 *
 * UI for browsing, installing, and sharing custom sound packs.
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { Theme } from '@/constants';
import type { SoundPack } from '@/utils/soundPackFormat';
import {
  validateSoundPack,
  generateShareCode,
  parseShareCode,
  getSoundPackSize
} from '@/utils/soundPackFormat';
import { soundPackPlayer } from '@/utils/soundPackPlayer';

interface SoundPackManagerProps {
  theme: Theme;
  audioContext: AudioContext | null;
  onClose: () => void;
  onCreateNew: () => void;
}

const STORAGE_KEY = 'dr_sbaitso_sound_packs';

export default function SoundPackManager({
  theme,
  audioContext,
  onClose,
  onCreateNew
}: SoundPackManagerProps) {
  const [installedPacks, setInstalledPacks] = useState<SoundPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<SoundPack | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [showShareInput, setShowShareInput] = useState(false);
  const [currentPackId, setCurrentPackId] = useState<string | null>(null);

  // Load installed packs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const packs = JSON.parse(stored) as SoundPack[];
        setInstalledPacks(packs);
      }
    } catch (error) {
      console.error('Failed to load sound packs:', error);
    }

    // Get current active pack
    const currentPack = soundPackPlayer.getCurrentPack();
    if (currentPack) {
      setCurrentPackId(currentPack.metadata.name);
    }
  }, []);

  // Save packs to localStorage
  const savePacks = useCallback((packs: SoundPack[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
      setInstalledPacks(packs);
    } catch (error) {
      console.error('Failed to save sound packs:', error);
      alert('Failed to save sound packs to storage');
    }
  }, []);

  // Install a pack
  const installPack = useCallback((pack: SoundPack) => {
    // Check if pack with same name already exists
    const existing = installedPacks.find(p => p.metadata.name === pack.metadata.name);

    if (existing) {
      const replace = confirm(
        `A pack named "${pack.metadata.name}" already exists. Replace it?`
      );

      if (!replace) return;

      // Replace existing
      const updated = installedPacks.map(p =>
        p.metadata.name === pack.metadata.name ? pack : p
      );
      savePacks(updated);
    } else {
      // Add new
      savePacks([...installedPacks, pack]);
    }

    alert(`Sound pack "${pack.metadata.name}" installed successfully!`);
  }, [installedPacks, savePacks]);

  // Uninstall a pack
  const uninstallPack = useCallback((packName: string) => {
    const confirmed = confirm(`Are you sure you want to uninstall "${packName}"?`);

    if (!confirmed) return;

    const updated = installedPacks.filter(p => p.metadata.name !== packName);
    savePacks(updated);

    if (currentPackId === packName) {
      soundPackPlayer.unload();
      setCurrentPackId(null);
    }

    setSelectedPack(null);
  }, [installedPacks, savePacks, currentPackId]);

  // Load/activate a pack
  const loadPack = useCallback(async (pack: SoundPack) => {
    if (!audioContext) {
      alert('Audio context not available');
      return;
    }

    try {
      await soundPackPlayer.loadPack(pack, audioContext);
      setCurrentPackId(pack.metadata.name);
      alert(`Sound pack "${pack.metadata.name}" loaded!`);
    } catch (error) {
      console.error('Failed to load sound pack:', error);
      alert(`Failed to load sound pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [audioContext]);

  // Unload current pack
  const unloadCurrentPack = useCallback(() => {
    soundPackPlayer.unload();
    setCurrentPackId(null);
  }, []);

  // Generate share code for selected pack
  const handleGenerateShareCode = useCallback(() => {
    if (!selectedPack) return;

    try {
      const code = generateShareCode(selectedPack);
      setShareCode(code);
      alert('Share code generated! You can now copy it to share this sound pack.');
    } catch (error) {
      alert(`Failed to generate share code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedPack]);

  // Install from share code
  const handleInstallFromShareCode = useCallback(() => {
    const code = prompt('Enter share code:');

    if (!code) return;

    try {
      const pack = parseShareCode(code);
      const validation = validateSoundPack(pack);

      if (!validation.valid) {
        alert(`Invalid sound pack:\n${validation.errors.join('\n')}`);
        return;
      }

      installPack(pack);
    } catch (error) {
      alert(`Failed to install from share code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [installPack]);

  // Copy share code to clipboard
  const copyShareCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      alert('Share code copied to clipboard!');
    } catch (error) {
      // Fallback: select text
      const textarea = document.createElement('textarea');
      textarea.value = shareCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Share code copied to clipboard!');
    }
  }, [shareCode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-auto border-4 rounded p-6"
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
            className="px-4 py-2 border-2 rounded hover:opacity-80"
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
            className="px-4 py-2 border-2 rounded hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.primary,
              color: theme.colors.background
            }}
          >
            ➕ Create New Pack
          </button>

          <button
            onClick={handleInstallFromShareCode}
            className="px-4 py-2 border-2 rounded hover:opacity-80"
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
              className="px-4 py-2 border-2 rounded hover:opacity-80"
              style={{
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.background
              }}
            >
              ⏹️ Unload Current Pack
            </button>
          )}
        </div>

        {/* Current Pack Status */}
        {currentPackId && (
          <div
            className="mb-6 p-4 border-2 rounded"
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
                  className="p-4 border-2 rounded cursor-pointer hover:opacity-80"
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
                          className="text-xs px-2 py-1 rounded"
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
                      className="flex-1 px-3 py-1 border rounded text-sm hover:opacity-80"
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
                      className="px-3 py-1 border rounded text-sm hover:opacity-80"
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
          <div className="p-4 border-2 rounded" style={{ borderColor: theme.colors.primary }}>
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
                className="w-full px-4 py-2 border-2 rounded hover:opacity-80 mb-2"
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
                      className="flex-1 p-2 border rounded text-xs font-mono"
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
                      className="px-3 py-1 border rounded hover:opacity-80"
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
