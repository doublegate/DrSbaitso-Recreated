/**
 * Voice Control Help Modal (v1.6.0): the hands-free command list. The focus
 * trap is owned by the caller (useFocusTrap), which passes its ref here.
 */
import type { RefObject } from 'react';
import type { VoiceCommand } from '../../utils/voiceCommands';

export interface VoiceHelpDialogProps {
  commands: VoiceCommand[];
  containerRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export default function VoiceHelpDialog({ commands, containerRef, onClose }: VoiceHelpDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-help-title"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="bg-blue-900 border-4 border-gray-400 p-6 max-w-3xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="voice-help-title" className="text-2xl font-bold text-white">
            VOICE CONTROL COMMANDS
          </h2>
          <button onClick={onClose} className="text-white hover:text-yellow-300 text-2xl" aria-label="Close help">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="text-yellow-300 font-bold mb-2">HOW TO USE:</h3>
            <ol className="list-decimal list-inside space-y-1 text-white">
              <li>Click the 🎤 button to enable hands-free mode</li>
              <li>Say "Hey Doctor" followed by any command</li>
              <li>Or click the button again to speak a command directly</li>
            </ol>
          </div>

          {commands.length > 0 && (
            <>
              {['conversation', 'character', 'audio', 'navigation', 'settings'].map((category) => {
                const categoryCommands = commands.filter((c) => c.category === category);
                if (categoryCommands.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-yellow-300 font-bold mb-2">{category.toUpperCase()}:</h3>
                    <ul className="space-y-2">
                      {categoryCommands.map((cmd) => (
                        <li key={cmd.id} className="text-white">
                          <span className="text-green-400">"{cmd.phrases[0]}"</span>
                          <span className="text-gray-400"> - {cmd.description}</span>
                          {cmd.phrases.length > 1 && (
                            <div className="ml-4 text-xs text-gray-400">
                              Also: {cmd.phrases.slice(1, 3).join(', ')}
                              {cmd.phrases.length > 3 && '...'}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </>
          )}

          <div className="pt-4 border-t-2 border-gray-600">
            <h3 className="text-yellow-300 font-bold mb-2">WAKE WORDS:</h3>
            <p className="text-white text-xs">
              Say any of these to activate voice control: "Hey Doctor", "Hey Sbaitso", "Doctor Sbaitso", "Okay Doctor",
              "Listen Doctor"
            </p>
          </div>

          <div className="pt-4 border-t-2 border-gray-600">
            <h3 className="text-yellow-300 font-bold mb-2">TIPS:</h3>
            <ul className="list-disc list-inside space-y-1 text-white text-xs">
              <li>Speak clearly and wait for the command to be recognized</li>
              <li>Destructive commands (like "clear") require confirmation</li>
              <li>Voice control works best in quiet environments</li>
              <li>Not supported in Firefox (use Chrome, Edge, or Safari)</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-400 hover:border-yellow-300 focus:outline-hidden focus:ring-2 focus:ring-yellow-300"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
