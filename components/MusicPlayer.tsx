/**
 * Music Player Component (v1.10.0)
 *
 * Control panel for procedural chiptune music
 */

import React, { useState, useEffect } from 'react';
import { musicEngine, type MusicMood, type MusicTempo } from '@/utils/musicEngine';

interface MusicPlayerProps {
  theme: {
    colors: {
      background: string;
      text: string;
      accent: string;
      border: string;
    };
  };
}

export default function MusicPlayer({ theme }: MusicPlayerProps) {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(50);
  const [mood, setMood] = useState<MusicMood>('auto');
  const [tempo, setTempo] = useState<MusicTempo>('normal');

  useEffect(() => {
    musicEngine.init();
  }, []);

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    musicEngine.updateSettings({ enabled: newEnabled });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    musicEngine.updateSettings({ volume: newVolume });
  };

  const handleMoodChange = (newMood: MusicMood) => {
    setMood(newMood);
    musicEngine.updateSettings({ mood: newMood });
  };

  const handleTempoChange = (newTempo: MusicTempo) => {
    setTempo(newTempo);
    musicEngine.updateSettings({ tempo: newTempo });
  };

  return (
    <div
      className="border-2 rounded p-4"
      style={{ borderColor: theme.colors.border }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
          🎵 Background Music
        </h3>
        <button
          onClick={handleToggle}
          className={`px-4 py-1 rounded font-bold transition ${enabled ? 'opacity-100' : 'opacity-60'}`}
          style={{
            backgroundColor: enabled ? theme.colors.accent : theme.colors.border,
            color: enabled ? theme.colors.background : theme.colors.text
          }}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Volume */}
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>
          Volume: {volume}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          disabled={!enabled}
          className="w-full"
          style={{ accentColor: theme.colors.accent }}
        />
      </div>

      {/* Mood */}
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>
          Mood:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['auto', 'happy', 'neutral', 'sad', 'tense'] as MusicMood[]).map(m => (
            <button
              key={m}
              onClick={() => handleMoodChange(m)}
              disabled={!enabled}
              className={`px-2 py-1 text-sm rounded font-semibold ${mood === m ? 'opacity-100' : 'opacity-50'} disabled:opacity-30`}
              style={{
                backgroundColor: mood === m ? theme.colors.accent : theme.colors.border,
                color: mood === m ? theme.colors.background : theme.colors.text
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tempo */}
      <div>
        <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>
          Tempo:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['slow', 'normal', 'fast'] as MusicTempo[]).map(t => (
            <button
              key={t}
              onClick={() => handleTempoChange(t)}
              disabled={!enabled}
              className={`px-2 py-1 text-sm rounded font-semibold ${tempo === t ? 'opacity-100' : 'opacity-50'} disabled:opacity-30`}
              style={{
                backgroundColor: tempo === t ? theme.colors.accent : theme.colors.border,
                color: tempo === t ? theme.colors.background : theme.colors.text
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs mt-3 opacity-70" style={{ color: theme.colors.text }}>
        Procedural 8-bit music adapts to conversation mood
      </p>
    </div>
  );
}
