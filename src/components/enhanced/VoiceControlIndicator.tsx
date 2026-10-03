/** Hands-free voice control status (v1.6.0): listening state, suggestions, errors and confirmations. */
import type { useVoiceControl } from '../../hooks/useVoiceControl';

type VoiceControl = ReturnType<typeof useVoiceControl>;

export interface VoiceControlIndicatorProps {
  voiceControl: Pick<
    VoiceControl,
    | 'isListeningForWakeWord'
    | 'isListeningForCommand'
    | 'suggestions'
    | 'error'
    | 'pendingConfirmation'
    | 'confirmCommand'
    | 'cancelConfirmation'
  >;
  onShowHelp: () => void;
}

export default function VoiceControlIndicator({ voiceControl, onShowHelp }: VoiceControlIndicatorProps) {
  return (
    <div className="mt-2 p-2 border-2 border-green-400 bg-green-900/30">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={`${voiceControl.isListeningForWakeWord ? 'animate-pulse' : ''}`}>
            {voiceControl.isListeningForWakeWord && '🎤 Listening for "Hey Doctor"...'}
            {voiceControl.isListeningForCommand && '🎯 Listening for command...'}
            {!voiceControl.isListeningForWakeWord && !voiceControl.isListeningForCommand && '⏸ Standby'}
          </span>
          {voiceControl.suggestions.length > 0 && (
            <span className="text-yellow-300">
              Suggestions: {voiceControl.suggestions.map((s) => s.name).join(', ')}
            </span>
          )}
        </div>
        <button
          onClick={onShowHelp}
          className="px-2 py-1 border border-gray-400 hover:border-yellow-300 text-xs"
          title="View voice commands"
        >
          Help
        </button>
      </div>
      {voiceControl.error && <div className="mt-1 text-red-400 text-xs">⚠ {voiceControl.error}</div>}
      {voiceControl.pendingConfirmation && (
        <div className="mt-2 p-2 bg-yellow-900/50 border border-yellow-400">
          <div className="text-yellow-300 text-xs mb-2">Confirm: {voiceControl.pendingConfirmation.name}?</div>
          <div className="flex gap-2">
            <button
              onClick={() => voiceControl.confirmCommand()}
              className="px-3 py-1 bg-green-700 hover:bg-green-600 text-xs"
            >
              Yes
            </button>
            <button
              onClick={() => voiceControl.cancelConfirmation()}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 text-xs"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
