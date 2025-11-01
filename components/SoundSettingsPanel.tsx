/**
 * Sound Settings Panel Component (v1.9.0)
 *
 * Modal dialog for configuring retro sound effects and audio atmosphere
 */

import React, { useState, useEffect } from 'react';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { SoundSettings } from '../utils/soundEffects';

interface SoundSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SoundSettingsPanel({ isOpen, onClose }: SoundSettingsPanelProps) {
  const { playSound, startAmbience, stopAmbience, updateSettings, getSettings } = useSoundEffects();
  const [settings, setSettings] = useState<SoundSettings>(getSettings());

  useEffect(() => {
    if (isOpen) {
      setSettings(getSettings());
    }
  }, [isOpen, getSettings]);

  const handleSettingChange = (key: keyof SoundSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettings({ [key]: value });
  };

  const handleTestSound = (soundType: 'keypress' | 'success' | 'error' | 'notification') => {
    playSound(soundType);
  };

  const handlePreviewAmbience = () => {
    if (settings.ambienceEnabled) {
      startAmbience();
    } else {
      stopAmbience();
    }
  };

  useEffect(() => {
    handlePreviewAmbience();
  }, [settings.ambienceEnabled]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div
        className="bg-blue-900 border-4 border-gray-400 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="sound-settings-title"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="sound-settings-title" className="text-2xl font-bold text-white">
            🔊 SOUND SETTINGS
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-yellow-300 text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-300"
            aria-label="Close sound settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-white">
          {/* UI Sounds Section */}
          <div className="border-2 border-gray-400 p-4">
            <h3 className="text-lg font-bold mb-4 text-yellow-300">USER INTERFACE SOUNDS</h3>

            <div className="space-y-4">
              {/* Enable UI Sounds */}
              <div className="flex items-center justify-between">
                <label htmlFor="ui-sounds-enabled" className="text-sm">
                  Enable UI Sounds:
                </label>
                <input
                  id="ui-sounds-enabled"
                  type="checkbox"
                  checked={settings.uiSoundsEnabled}
                  onChange={(e) => handleSettingChange('uiSoundsEnabled', e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* UI Volume */}
              <div>
                <label htmlFor="ui-volume" className="text-sm block mb-2">
                  UI Volume: {Math.round(settings.uiVolume * 100)}%
                </label>
                <input
                  id="ui-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={settings.uiVolume * 100}
                  onChange={(e) => handleSettingChange('uiVolume', parseInt(e.target.value) / 100)}
                  disabled={!settings.uiSoundsEnabled}
                  className="w-full"
                />
              </div>

              {/* Keyboard Clicks */}
              <div className="flex items-center justify-between">
                <label htmlFor="keyboard-clicks" className="text-sm">
                  Keyboard Clicks:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="keyboard-clicks"
                    type="checkbox"
                    checked={settings.keyboardClicksEnabled}
                    onChange={(e) => handleSettingChange('keyboardClicksEnabled', e.target.checked)}
                    disabled={!settings.uiSoundsEnabled}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <button
                    onClick={() => handleTestSound('keypress')}
                    disabled={!settings.uiSoundsEnabled || !settings.keyboardClicksEnabled}
                    className="px-2 py-1 border border-gray-400 hover:border-yellow-300 text-xs disabled:opacity-50"
                  >
                    TEST
                  </button>
                </div>
              </div>

              {/* System Beeps */}
              <div className="flex items-center justify-between">
                <label htmlFor="system-beeps" className="text-sm">
                  System Beeps:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="system-beeps"
                    type="checkbox"
                    checked={settings.systemBeepsEnabled}
                    onChange={(e) => handleSettingChange('systemBeepsEnabled', e.target.checked)}
                    disabled={!settings.uiSoundsEnabled}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <button
                    onClick={() => handleTestSound('notification')}
                    disabled={!settings.uiSoundsEnabled || !settings.systemBeepsEnabled}
                    className="px-2 py-1 border border-gray-400 hover:border-yellow-300 text-xs disabled:opacity-50"
                  >
                    TEST
                  </button>
                </div>
              </div>

              {/* Boot Sounds */}
              <div className="flex items-center justify-between">
                <label htmlFor="boot-sounds" className="text-sm">
                  Boot Sequence Sounds:
                </label>
                <input
                  id="boot-sounds"
                  type="checkbox"
                  checked={settings.bootSoundsEnabled}
                  onChange={(e) => handleSettingChange('bootSoundsEnabled', e.target.checked)}
                  disabled={!settings.uiSoundsEnabled}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Background Ambience Section */}
          <div className="border-2 border-gray-400 p-4">
            <h3 className="text-lg font-bold mb-4 text-yellow-300">BACKGROUND AMBIENCE</h3>

            <div className="space-y-4">
              {/* Enable Ambience */}
              <div className="flex items-center justify-between">
                <label htmlFor="ambience-enabled" className="text-sm">
                  Enable Computer Room Ambience:
                </label>
                <input
                  id="ambience-enabled"
                  type="checkbox"
                  checked={settings.ambienceEnabled}
                  onChange={(e) => handleSettingChange('ambienceEnabled', e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {/* Ambience Volume */}
              <div>
                <label htmlFor="ambience-volume" className="text-sm block mb-2">
                  Ambience Volume: {Math.round(settings.ambienceVolume * 100)}%
                </label>
                <input
                  id="ambience-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={settings.ambienceVolume * 100}
                  onChange={(e) =>
                    handleSettingChange('ambienceVolume', parseInt(e.target.value) / 100)
                  }
                  disabled={!settings.ambienceEnabled}
                  className="w-full"
                />
              </div>

              <p className="text-xs text-gray-300">
                Ambient background sounds simulate a 1980s computer room atmosphere with low hum,
                fan noise, and occasional disk access sounds.
              </p>
            </div>
          </div>

          {/* Sound Pack Selection */}
          <div className="border-2 border-gray-400 p-4">
            <h3 className="text-lg font-bold mb-4 text-yellow-300">SOUND PACK</h3>

            <div className="space-y-2">
              {[
                {
                  id: 'dos-pc',
                  name: 'DOS PC (Default)',
                  description: 'IBM PC compatible sounds from the DOS era',
                },
                {
                  id: 'apple-ii',
                  name: 'Apple II',
                  description: 'Classic Apple II computer sounds',
                },
                {
                  id: 'commodore-64',
                  name: 'Commodore 64',
                  description: 'Iconic C64 synthesized sounds',
                },
                {
                  id: 'modern-synth',
                  name: 'Modern Synth',
                  description: 'Contemporary synthesized retro-inspired sounds',
                },
              ].map((pack) => (
                <label
                  key={pack.id}
                  className={`flex items-center p-2 border ${
                    settings.selectedSoundPack === pack.id
                      ? 'border-yellow-300 bg-blue-800'
                      : 'border-gray-400'
                  } cursor-pointer hover:border-yellow-300`}
                >
                  <input
                    type="radio"
                    name="sound-pack"
                    value={pack.id}
                    checked={settings.selectedSoundPack === pack.id}
                    onChange={(e) => handleSettingChange('selectedSoundPack', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-bold text-sm">{pack.name}</div>
                    <div className="text-xs text-gray-300">{pack.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="border-2 border-gray-400 p-4">
            <h3 className="text-lg font-bold mb-4 text-yellow-300">QUICK PRESETS</h3>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  updateSettings({
                    uiSoundsEnabled: false,
                    ambienceEnabled: false,
                  });
                  setSettings(getSettings());
                }}
                className="px-3 py-2 border-2 border-gray-400 hover:border-yellow-300 text-sm"
              >
                🔇 Silent Mode
              </button>
              <button
                onClick={() => {
                  updateSettings({
                    uiSoundsEnabled: true,
                    keyboardClicksEnabled: true,
                    systemBeepsEnabled: true,
                    bootSoundsEnabled: true,
                    ambienceEnabled: false,
                    uiVolume: 0.5,
                  });
                  setSettings(getSettings());
                }}
                className="px-3 py-2 border-2 border-gray-400 hover:border-yellow-300 text-sm"
              >
                🎵 UI Only
              </button>
              <button
                onClick={() => {
                  updateSettings({
                    uiSoundsEnabled: true,
                    ambienceEnabled: true,
                    keyboardClicksEnabled: true,
                    systemBeepsEnabled: true,
                    bootSoundsEnabled: true,
                    uiVolume: 0.5,
                    ambienceVolume: 0.3,
                  });
                  setSettings(getSettings());
                }}
                className="px-3 py-2 border-2 border-gray-400 hover:border-yellow-300 text-sm"
              >
                🖥️ Full Immersion
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
