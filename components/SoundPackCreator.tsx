/**
 * Sound Pack Creator Component (v1.10.0)
 *
 * UI for creating, editing, and managing custom sound packs.
 */

import React, { useState, useCallback, useRef } from 'react';
import type { Theme } from '@/constants';
import type { SoundPack, SoundEffect, SoundTrigger } from '@/utils/soundPackFormat';
import {
  createEmptySoundPack,
  validateSoundPack,
  exportSoundPack,
  importSoundPack,
  getSoundPackSize
} from '@/utils/soundPackFormat';

interface SoundPackCreatorProps {
  theme: Theme;
  onClose: () => void;
  onSave: (pack: SoundPack) => void;
  initialPack?: SoundPack;
}

export default function SoundPackCreator({
  theme,
  onClose,
  onSave,
  initialPack
}: SoundPackCreatorProps) {
  const [pack, setPack] = useState<SoundPack>(
    initialPack || createEmptySoundPack('Anonymous')
  );
  const [selectedSoundIndex, setSelectedSoundIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update metadata
  const updateMetadata = useCallback((field: string, value: string | string[]) => {
    setPack(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value,
        updated: Date.now()
      }
    }));
  }, []);

  // Add new sound
  const addSound = useCallback(() => {
    const newSound: SoundEffect = {
      id: `sound_${Date.now()}`,
      name: 'New Sound',
      description: '',
      audioData: '',
      duration: 0,
      volume: 100
    };

    setPack(prev => ({
      ...prev,
      sounds: [...prev.sounds, newSound]
    }));

    setSelectedSoundIndex(pack.sounds.length);
  }, [pack.sounds.length]);

  // Update sound
  const updateSound = useCallback((index: number, field: string, value: any) => {
    setPack(prev => ({
      ...prev,
      sounds: prev.sounds.map((sound, i) =>
        i === index ? { ...sound, [field]: value } : sound
      )
    }));
  }, []);

  // Delete sound
  const deleteSound = useCallback((index: number) => {
    const soundId = pack.sounds[index].id;

    setPack(prev => ({
      ...prev,
      sounds: prev.sounds.filter((_, i) => i !== index),
      triggers: prev.triggers.filter(t => t.soundId !== soundId)
    }));

    if (selectedSoundIndex === index) {
      setSelectedSoundIndex(null);
    }
  }, [pack.sounds, selectedSoundIndex]);

  // Add trigger
  const addTrigger = useCallback(() => {
    const newTrigger: SoundTrigger = {
      event: 'message_sent',
      soundId: pack.sounds[0]?.id || '',
      probability: 100
    };

    setPack(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }));
  }, [pack.sounds]);

  // Update trigger
  const updateTrigger = useCallback((index: number, field: string, value: any) => {
    setPack(prev => ({
      ...prev,
      triggers: prev.triggers.map((trigger, i) =>
        i === index ? { ...trigger, [field]: value } : trigger
      )
    }));
  }, []);

  // Delete trigger
  const deleteTrigger = useCallback((index: number) => {
    setPack(prev => ({
      ...prev,
      triggers: prev.triggers.filter((_, i) => i !== index)
    }));
  }, []);

  // Handle file import for sound
  const handleAudioImport = useCallback((index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        updateSound(index, 'audioData', base64);

        // Estimate duration (rough approximation)
        const durationMs = (arrayBuffer.byteLength / (24000 * 2)) * 1000;
        updateSound(index, 'duration', Math.round(durationMs));
      } catch (error) {
        console.error('Failed to import audio:', error);
        alert('Failed to import audio file');
      }
    };

    input.click();
  }, [updateSound]);

  // Validate pack
  const validatePack = useCallback(() => {
    const result = validateSoundPack(pack);
    setErrors(result.errors);
    setWarnings(result.warnings);
    return result.valid;
  }, [pack]);

  // Save pack
  const handleSave = useCallback(() => {
    if (validatePack()) {
      onSave(pack);
      onClose();
    } else {
      alert('Please fix validation errors before saving');
    }
  }, [pack, validatePack, onSave, onClose]);

  // Export to file
  const handleExport = useCallback(() => {
    try {
      const json = exportSoundPack(pack);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pack.metadata.name.replace(/\s+/g, '_')}.soundpack.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [pack]);

  // Import from file
  const handleImport = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const imported = importSoundPack(json);
        setPack(imported);
        alert('Sound pack imported successfully');
      } catch (error) {
        alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const packSize = getSoundPackSize(pack);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div
        className="w-full max-w-6xl max-h-[90vh] overflow-auto border-4 rounded p-6"
        style={{
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          borderColor: theme.colors.primary
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🎵 Sound Pack Creator</h2>
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

        {/* Metadata Section */}
        <div className="mb-6 p-4 border-2 rounded" style={{ borderColor: theme.colors.border }}>
          <h3 className="text-xl mb-4">📝 Metadata</h3>

          <div className="space-y-3">
            <div>
              <label className="block mb-1">Pack Name:</label>
              <input
                type="text"
                value={pack.metadata.name}
                onChange={(e) => updateMetadata('name', e.target.value)}
                className="w-full p-2 border-2 rounded"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary
                }}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block mb-1">Author:</label>
              <input
                type="text"
                value={pack.metadata.author}
                onChange={(e) => updateMetadata('author', e.target.value)}
                className="w-full p-2 border-2 rounded"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary
                }}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block mb-1">Version:</label>
              <input
                type="text"
                value={pack.metadata.version}
                onChange={(e) => updateMetadata('version', e.target.value)}
                className="w-full p-2 border-2 rounded"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary
                }}
                placeholder="1.0.0"
              />
            </div>

            <div>
              <label className="block mb-1">Description:</label>
              <textarea
                value={pack.metadata.description}
                onChange={(e) => updateMetadata('description', e.target.value)}
                className="w-full p-2 border-2 rounded"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary
                }}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="text-sm opacity-70">
              Pack Size: {packSize.toFixed(2)} KB
            </div>
          </div>
        </div>

        {/* Sounds Section */}
        <div className="mb-6 p-4 border-2 rounded" style={{ borderColor: theme.colors.border }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl">🔊 Sounds ({pack.sounds.length})</h3>
            <button
              onClick={addSound}
              className="px-3 py-1 border-2 rounded hover:opacity-80"
              style={{
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.background
              }}
            >
              + Add Sound
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pack.sounds.map((sound, index) => (
              <div
                key={sound.id}
                className="p-3 border rounded cursor-pointer hover:opacity-80"
                style={{
                  borderColor: selectedSoundIndex === index ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selectedSoundIndex === index ? theme.colors.border : 'transparent'
                }}
                onClick={() => setSelectedSoundIndex(index)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{sound.name || 'Untitled'}</div>
                    <div className="text-xs opacity-70">
                      ID: {sound.id} • Duration: {sound.duration}ms • Volume: {sound.volume}%
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSound(index);
                    }}
                    className="px-2 py-1 text-sm border rounded hover:opacity-80"
                    style={{ borderColor: theme.colors.primary }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sound Editor */}
          {selectedSoundIndex !== null && pack.sounds[selectedSoundIndex] && (
            <div className="mt-4 p-3 border-2 rounded" style={{ borderColor: theme.colors.primary }}>
              <h4 className="font-bold mb-3">Edit Sound</h4>

              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">Name:</label>
                  <input
                    type="text"
                    value={pack.sounds[selectedSoundIndex].name}
                    onChange={(e) => updateSound(selectedSoundIndex, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                    style={{
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.border
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Volume (0-100):</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pack.sounds[selectedSoundIndex].volume}
                    onChange={(e) => updateSound(selectedSoundIndex, 'volume', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-center">{pack.sounds[selectedSoundIndex].volume}%</div>
                </div>

                <button
                  onClick={() => handleAudioImport(selectedSoundIndex)}
                  className="w-full px-3 py-2 border-2 rounded hover:opacity-80"
                  style={{
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.background
                  }}
                >
                  📁 Import Audio File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Triggers Section */}
        <div className="mb-6 p-4 border-2 rounded" style={{ borderColor: theme.colors.border }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl">⚡ Triggers ({pack.triggers.length})</h3>
            <button
              onClick={addTrigger}
              className="px-3 py-1 border-2 rounded hover:opacity-80"
              style={{
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.background
              }}
              disabled={pack.sounds.length === 0}
            >
              + Add Trigger
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pack.triggers.map((trigger, index) => (
              <div
                key={index}
                className="p-2 border rounded flex items-center gap-2"
                style={{ borderColor: theme.colors.border }}
              >
                <select
                  value={trigger.event}
                  onChange={(e) => updateTrigger(index, 'event', e.target.value)}
                  className="flex-1 p-1 border rounded"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }}
                >
                  <option value="message_sent">Message Sent</option>
                  <option value="message_received">Message Received</option>
                  <option value="error">Error</option>
                  <option value="startup">Startup</option>
                  <option value="character_switch">Character Switch</option>
                  <option value="theme_change">Theme Change</option>
                </select>

                <select
                  value={trigger.soundId}
                  onChange={(e) => updateTrigger(index, 'soundId', e.target.value)}
                  className="flex-1 p-1 border rounded"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }}
                >
                  {pack.sounds.map(sound => (
                    <option key={sound.id} value={sound.id}>{sound.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trigger.probability}
                  onChange={(e) => updateTrigger(index, 'probability', parseInt(e.target.value))}
                  className="w-16 p-1 border rounded"
                  style={{
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border
                  }}
                />
                <span className="text-xs">%</span>

                <button
                  onClick={() => deleteTrigger(index)}
                  className="px-2 py-1 text-sm border rounded hover:opacity-80"
                  style={{ borderColor: theme.colors.primary }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Messages */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="mb-6">
            {errors.length > 0 && (
              <div className="mb-2 p-3 border-2 rounded" style={{ borderColor: '#FF0000' }}>
                <div className="font-bold text-red-500 mb-1">❌ Errors:</div>
                <ul className="text-sm list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="p-3 border-2 rounded" style={{ borderColor: '#FFA500' }}>
                <div className="font-bold text-orange-500 mb-1">⚠️ Warnings:</div>
                <ul className="text-sm list-disc list-inside">
                  {warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={validatePack}
            className="px-4 py-2 border-2 rounded hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.background
            }}
          >
            🔍 Validate
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 border-2 rounded hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.background
            }}
          >
            💾 Export
          </button>

          <button
            onClick={handleImport}
            className="px-4 py-2 border-2 rounded hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.background
            }}
          >
            📁 Import
          </button>

          <div className="flex-1" />

          <button
            onClick={handleSave}
            className="px-6 py-2 border-2 rounded font-bold hover:opacity-80"
            style={{
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.primary,
              color: theme.colors.background
            }}
          >
            ✓ Save Pack
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.soundpack.json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
