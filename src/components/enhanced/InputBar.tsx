/** The chat prompt: text input, the voice-input toggle and SEND. */
import type { KeyboardEvent, RefObject } from 'react';
import { shortcutLabel } from '../../utils/shortcuts';

export interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  /** A turn (or the greeting) is in progress: input is locked. */
  isLoading: boolean;
  personaName: string;
  voiceInputOpen: boolean;
  onToggleVoiceInput: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function InputBar({
  value,
  onChange,
  onKeyDown,
  onSend,
  isLoading,
  personaName,
  voiceInputOpen,
  onToggleVoiceInput,
  inputRef,
}: InputBarProps) {
  return (
    <div
      className="shrink-0 flex items-center gap-2 mt-3 border-t-2 border-(--color-border) pt-3"
      data-tour-id="chat-input"
    >
      <span className="text-(--color-accent)" aria-hidden="true">
        {'>'}
      </span>
      <input
        id="chat-input"
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isLoading}
        className="bg-transparent border-none text-(--color-accent) w-full focus:outline-hidden placeholder-gray-500"
        placeholder={isLoading ? '' : 'TYPE HERE AND PRESS ENTER...'}
        aria-label="Enter your message"
        aria-describedby="chat-input-help"
      />
      <span id="chat-input-help" className="sr-only">
        Type your message and press Enter to send it to {personaName}
      </span>
      <button
        type="button"
        onClick={onToggleVoiceInput}
        className="enh-icon-button"
        data-keyboard-hint={shortcutLabel('voiceInput')}
        data-tour-id="voice-input"
        aria-label="Speak instead of typing"
        aria-pressed={voiceInputOpen}
        title={`Voice input (${shortcutLabel('voiceInput')})`}
      >
        <span aria-hidden="true">🎤</span>
      </button>
      <button type="button" onClick={onSend} disabled={isLoading || !value.trim()} className="enh-send-button">
        SEND
      </button>
    </div>
  );
}
