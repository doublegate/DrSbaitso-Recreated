/** Status bar: persistent display and privacy settings (audio mode, theme, saved history, mute). */
import { AUDIO_MODES, VOICE_PROFILES, type VoiceProfileId } from '../../constants';
import type { AudioModeId } from '../../utils/audio';
import { shortcutLabel } from '../../utils/shortcuts';

export interface StatusBarProps {
  audioMode: AudioModeId;
  onAudioModeChange: (mode: AudioModeId) => void;
  themeId: string;
  themes: ReadonlyArray<{ id: string; name: string }>;
  onThemeChange: (id: string) => void;
  keepHistory: boolean;
  onKeepHistoryChange: (keep: boolean) => void;
  muted: boolean;
  /** Dr. Sbaitso's voice profile (shown only while he is the active persona). */
  voiceProfile: VoiceProfileId;
  onVoiceProfileChange: (id: VoiceProfileId) => void;
  showVoiceProfile: boolean;
}

export default function StatusBar({
  audioMode,
  onAudioModeChange,
  themeId,
  themes,
  onThemeChange,
  keepHistory,
  onKeepHistoryChange,
  muted,
  voiceProfile,
  onVoiceProfileChange,
  showVoiceProfile,
}: StatusBarProps) {
  return (
    <footer className="shrink-0 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" data-tour-id="audio-settings">
      <label className="flex items-center gap-1">
        AUDIO
        <select
          id="audio-mode-select"
          value={audioMode}
          onChange={(e) => onAudioModeChange(e.target.value as AudioModeId)}
          className="enh-select"
          aria-label="Audio quality mode"
          title={AUDIO_MODES.find(m => m.id === audioMode)?.description || ''}
        >
          {AUDIO_MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>{mode.name}</option>
          ))}
        </select>
      </label>
      {showVoiceProfile && (
        <label className="flex items-center gap-1">
          VOICE
          <select
            id="voice-profile-select"
            value={voiceProfile}
            onChange={(e) => onVoiceProfileChange(e.target.value as VoiceProfileId)}
            className="enh-select"
            aria-label="Voice profile"
          >
            {Object.values(VOICE_PROFILES).map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.label}</option>
            ))}
          </select>
        </label>
      )}
      <label className="flex items-center gap-1">
        THEME
        <select
          id="theme-select"
          value={themeId}
          onChange={(e) => onThemeChange(e.target.value)}
          className="enh-select"
          aria-label="Colour theme"
        >
          {themes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>
      <label
        className="flex items-center gap-1"
        title="Off by default: memory contents are wiped when you leave. Turn on to keep sessions in this browser for search, replay and insights."
      >
        <input
          type="checkbox"
          checked={keepHistory}
          onChange={(e) => onKeepHistoryChange(e.target.checked)}
          className="accent-(--color-accent)"
        />
        SAVE HISTORY
      </label>
      {muted && <span aria-live="polite">SPEECH MUTED</span>}
      <span className="ml-auto opacity-60 hidden sm:inline">
        {shortcutLabel('switchMode')} classic screen
      </span>
    </footer>
  );
}
