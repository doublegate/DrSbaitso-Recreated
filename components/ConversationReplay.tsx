/**
 * Conversation Replay Component (v1.6.0)
 *
 * Timeline-based conversation playback system with:
 * - Visual timeline scrubber with message markers
 * - Play/Pause/Previous/Next controls
 * - Speed control (0.5x, 1x, 2x, 5x)
 * - Typewriter effect with configurable speed
 * - Loop playback option
 * - Keyboard shortcuts for control
 * - Jump to any message via timeline
 */

import { useState, useEffect, useRef, useCallback, MouseEvent } from 'react';
import type { ConversationSession, ReplayState } from '../types';

interface ConversationReplayProps {
  isOpen: boolean;
  onClose: () => void;
  session: ConversationSession;
}

const SPEEDS = [0.5, 1, 2, 5];

export function ConversationReplay({ isOpen, onClose, session }: ConversationReplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMessage = session.messages[currentIndex];
  const messages = session.messages;

  // Reset to beginning when session changes or component opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsPlaying(false);
      setDisplayedText('');
    }
  }, [isOpen, session.id]);

  // Typewriter effect
  useEffect(() => {
    if (!currentMessage) return;

    const baseDelay = 40; // ms per character
    const effectiveDelay = baseDelay / speed;

    setIsTyping(true);
    setDisplayedText('');

    let charIndex = 0;
    const typeNextChar = () => {
      if (charIndex < currentMessage.text.length) {
        setDisplayedText(currentMessage.text.substring(0, charIndex + 1));
        charIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, effectiveDelay);
      } else {
        setIsTyping(false);
      }
    };

    typeNextChar();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentIndex, currentMessage, speed]);

  // Auto-advance after message complete
  useEffect(() => {
    if (!isTyping && isPlaying) {
      pauseTimeoutRef.current = setTimeout(() => {
        if (currentIndex < messages.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (loop) {
          setCurrentIndex(0);
        } else {
          setIsPlaying(false);
        }
      }, 1000); // 1 second pause between messages
    }

    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [isTyping, isPlaying, currentIndex, loop, messages.length]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previousMessage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextMessage();
          break;
        case 'Home':
          e.preventDefault();
          jumpToStart();
          break;
        case 'End':
          e.preventDefault();
          jumpToEnd();
          break;
        case '[':
          e.preventDefault();
          decreaseSpeed();
          break;
        case ']':
          e.preventDefault();
          increaseSpeed();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          toggleLoop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, isPlaying, speed, loop, messages.length]);

  if (!isOpen) return null;

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const previousMessage = () => {
    if (currentIndex > 0) {
      setIsPlaying(false);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const nextMessage = () => {
    if (currentIndex < messages.length - 1) {
      setIsPlaying(false);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const jumpToStart = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const jumpToEnd = () => {
    setIsPlaying(false);
    setCurrentIndex(messages.length - 1);
  };

  const jumpToMessage = (index: number) => {
    setIsPlaying(false);
    setCurrentIndex(index);
  };

  const cycleSpeed = () => {
    const currentSpeedIndex = SPEEDS.indexOf(speed);
    const nextSpeedIndex = (currentSpeedIndex + 1) % SPEEDS.length;
    setSpeed(SPEEDS[nextSpeedIndex]);
  };

  const decreaseSpeed = () => {
    const currentSpeedIndex = SPEEDS.indexOf(speed);
    if (currentSpeedIndex > 0) {
      setSpeed(SPEEDS[currentSpeedIndex - 1]);
    }
  };

  const increaseSpeed = () => {
    const currentSpeedIndex = SPEEDS.indexOf(speed);
    if (currentSpeedIndex < SPEEDS.length - 1) {
      setSpeed(SPEEDS[currentSpeedIndex + 1]);
    }
  };

  const toggleLoop = () => {
    setLoop(!loop);
  };

  const calculateMarkerPosition = (index: number) => {
    return (index / (messages.length - 1)) * 100;
  };

  const handleTimelineClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetIndex = Math.round(percentage * (messages.length - 1));
    jumpToMessage(Math.max(0, Math.min(messages.length - 1, targetIndex)));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-background)',
          border: '2px solid var(--color-border)',
          borderRadius: '0',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          color: 'var(--color-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-primary)' }}>
              🎬 CONVERSATION REPLAY
            </h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
              {session.name}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>Speed:</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={cycleSpeed}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: speed === s ? 'var(--color-primary)' : 'var(--color-border)',
                    color: speed === s ? 'var(--color-background)' : 'var(--color-text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
              }}
              title="Close (ESC)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Playback Controls */}
        <div
          style={{
            padding: '15px 20px',
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={jumpToStart}
            disabled={currentIndex === 0}
            style={{
              padding: '10px 15px',
              backgroundColor: currentIndex === 0 ? '#666' : 'var(--color-border)',
              color: 'var(--color-text)',
              border: 'none',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
            title="Jump to Start (Home)"
          >
            ⏮
          </button>

          <button
            onClick={previousMessage}
            disabled={currentIndex === 0}
            style={{
              padding: '10px 15px',
              backgroundColor: currentIndex === 0 ? '#666' : 'var(--color-border)',
              color: 'var(--color-text)',
              border: 'none',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
            title="Previous (←)"
          >
            ⏪
          </button>

          <button
            onClick={togglePlayPause}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '20px',
            }}
            title="Play/Pause (Space)"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            onClick={nextMessage}
            disabled={currentIndex === messages.length - 1}
            style={{
              padding: '10px 15px',
              backgroundColor: currentIndex === messages.length - 1 ? '#666' : 'var(--color-border)',
              color: 'var(--color-text)',
              border: 'none',
              cursor: currentIndex === messages.length - 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
            title="Next (→)"
          >
            ⏩
          </button>

          <button
            onClick={jumpToEnd}
            disabled={currentIndex === messages.length - 1}
            style={{
              padding: '10px 15px',
              backgroundColor: currentIndex === messages.length - 1 ? '#666' : 'var(--color-border)',
              color: 'var(--color-text)',
              border: 'none',
              cursor: currentIndex === messages.length - 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
            title="Jump to End (End)"
          >
            ⏭
          </button>

          <button
            onClick={toggleLoop}
            style={{
              padding: '10px 15px',
              backgroundColor: loop ? 'var(--color-accent)' : 'var(--color-border)',
              color: loop ? 'var(--color-background)' : 'var(--color-text)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}
            title="Toggle Loop (L)"
          >
            🔁
          </button>
        </div>

        {/* Message Display */}
        <div
          style={{
            flex: 1,
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'auto',
          }}
        >
          <div style={{ maxWidth: '800px', width: '100%' }}>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--color-primary)',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              {currentMessage?.author === 'user' ? 'USER' : session.characterId.toUpperCase()}
            </div>

            <div
              style={{
                fontSize: '18px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                minHeight: '100px',
                padding: '20px',
                backgroundColor: currentMessage?.author === 'user'
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'rgba(251, 191, 36, 0.1)',
                border: `2px solid ${currentMessage?.author === 'user' ? 'var(--color-primary)' : 'var(--color-accent)'}`,
              }}
            >
              {displayedText}
              {isTyping && <span style={{ animation: 'blink 1s infinite' }}>▋</span>}
            </div>

            <div
              style={{
                marginTop: '15px',
                fontSize: '12px',
                opacity: 0.6,
                textAlign: 'center',
              }}
            >
              Message {currentIndex + 1} / {messages.length}
              {currentMessage?.timestamp && (
                <> · {new Date(currentMessage.timestamp).toLocaleTimeString()}</>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div style={{ padding: '20px', borderTop: '2px solid var(--color-border)' }}>
          <div
            onClick={handleTimelineClick}
            style={{
              position: 'relative',
              height: '40px',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            {/* Message markers */}
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${calculateMarkerPosition(index)}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: msg.author === 'user' ? 'var(--color-primary)' : 'var(--color-accent)',
                  opacity: index === currentIndex ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
                title={`Message ${index + 1}: ${msg.text.substring(0, 30)}...`}
              />
            ))}

            {/* Playhead */}
            <div
              style={{
                position: 'absolute',
                left: `${calculateMarkerPosition(currentIndex)}%`,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: 'var(--color-text)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Keyboard Shortcuts Help */}
          <div
            style={{
              marginTop: '10px',
              fontSize: '10px',
              opacity: 0.5,
              textAlign: 'center',
            }}
          >
            Keyboard: Space=Play/Pause | ←→=Prev/Next | Home/End=Jump | []=Speed | L=Loop
          </div>
        </div>

        {/* Inline CSS for cursor blink animation */}
        <style>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
