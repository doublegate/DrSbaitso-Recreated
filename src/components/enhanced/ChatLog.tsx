/**
 * The conversation log. It is not a live region (aria-live="off"): it would
 * re-announce every typed character, so finished replies are announced once
 * by the chat pipeline instead. Each line carries a hidden speaker label.
 */
import { useEffect, useRef } from 'react';
import type { Message } from '../../types';
import type { Persona } from '../../hooks/usePersona';

export interface ChatLogProps {
  messages: Message[];
  personas: Persona[];
  /** The active persona: the speaker label for lines whose persona no longer exists. */
  persona: Persona;
  /** A reply is being typed: show the cursor after the last persona line. */
  typing: boolean;
}

export default function ChatLog({ messages, personas, persona, typing }: ChatLogProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Keep the newest line in view (messages changes on every typed character).
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      id="main-content"
      className="grow overflow-y-auto pr-2 min-h-0"
      role="log"
      aria-live="off"
      aria-label="Conversation messages"
    >
      {messages.map((msg, index) => (
        <p
          key={index}
          className={`whitespace-pre-wrap ${msg.author === 'dr' ? 'text-(--color-text)' : 'text-(--color-accent)'}`}
        >
          <span className="sr-only">
            {msg.author === 'dr'
              ? `${personas.find((p) => p.id === msg.characterId)?.name ?? persona.name}: `
              : 'You: '}
          </span>
          {msg.author === 'user' && <span aria-hidden="true">{'> '}</span>}
          {msg.text}
          {typing && msg.author === 'dr' && index === messages.length - 1 && (
            <span className="animate-pulse" aria-hidden="true">
              _
            </span>
          )}
        </p>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
