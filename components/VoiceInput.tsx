/**
 * Voice Input Component (v1.11.0 - Option C1)
 *
 * Enables voice-to-text input for conversations using Web Speech API.
 * Integrates with existing conversation flow.
 */

import React, { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  isEnabled?: boolean;
  language?: string;
  continuous?: boolean;
}

export function VoiceInput({
  onTranscript,
  onError,
  isEnabled = true,
  language = 'en-US',
  continuous = false
}: VoiceInputProps): JSX.Element {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      // Configure recognition
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;
      recognitionRef.current.maxAlternatives = 1;

      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log('[VoiceInput] Started listening');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        console.log('[VoiceInput] Stopped listening');
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalText) {
          setTranscript(prev => prev + finalText + ' ');
          onTranscript(finalText);
          console.log('[VoiceInput] Final transcript:', finalText);
        }

        setInterimTranscript(interimText);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('[VoiceInput] Error:', event.error);
        setIsListening(false);

        const errorMessage = getErrorMessage(event.error);
        if (onError) {
          onError(errorMessage);
        }
      };

      recognitionRef.current.onnomatch = () => {
        console.warn('[VoiceInput] No speech recognized');
      };

      recognitionRef.current.onsoundstart = () => {
        console.log('[VoiceInput] Sound detected');
      };

      recognitionRef.current.onsoundend = () => {
        console.log('[VoiceInput] Sound ended');
      };
    } else {
      console.warn('[VoiceInput] Speech recognition not supported');
      if (onError) {
        onError('Speech recognition not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn('[VoiceInput] Cleanup error:', e);
        }
      }
    };
  }, [language, continuous, onTranscript, onError]);

  const startListening = () => {
    if (!recognitionRef.current || !isEnabled) return;

    try {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('[VoiceInput] Start error:', error);
      if (onError) {
        onError('Failed to start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('[VoiceInput] Stop error:', error);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  if (!isSupported) {
    return (
      <div className="p-3 bg-red-900 border-2 border-red-400 rounded">
        <p className="text-sm text-white">
          ⚠️ Voice input not supported in this browser.
          Try Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="p-3 bg-gray-700 border-2 border-gray-500 rounded">
        <p className="text-sm text-gray-300">
          Voice input disabled. Enable in settings.
        </p>
      </div>
    );
  }

  return (
    <div className="voice-input-container">
      <div className="flex items-center gap-3 p-3 bg-blue-900 border-2 border-blue-400 rounded">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`px-4 py-2 font-bold rounded transition-colors ${
            isListening
              ? 'bg-red-600 hover:bg-red-500 border-2 border-red-400'
              : 'bg-green-600 hover:bg-green-500 border-2 border-green-400'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '⏹️ Stop' : '🎤 Start'} Voice Input
        </button>

        {isListening && (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-white">Listening...</span>
          </div>
        )}

        {transcript && !isListening && (
          <button
            onClick={clearTranscript}
            className="px-3 py-1 text-sm border-2 border-gray-400 hover:border-gray-200 rounded"
            aria-label="Clear transcript"
          >
            🗑️ Clear
          </button>
        )}
      </div>

      {(transcript || interimTranscript) && (
        <div className="mt-2 p-3 bg-black bg-opacity-50 border-2 border-gray-600 rounded">
          <p className="text-sm text-gray-400 mb-1">Transcript:</p>
          <p className="text-white">
            {transcript}
            {interimTranscript && (
              <span className="text-gray-400 italic">
                {interimTranscript}
              </span>
            )}
            {isListening && <span className="animate-pulse">_</span>}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'No microphone found. Please check your device.';
    case 'not-allowed':
      return 'Microphone permission denied. Please enable in browser settings.';
    case 'network':
      return 'Network error. Please check your connection.';
    case 'aborted':
      return 'Voice input was cancelled.';
    case 'service-not-allowed':
      return 'Speech recognition service not allowed.';
    default:
      return `Voice input error: ${error}`;
  }
}

/**
 * Hook for voice input
 */
export function useVoiceInput(options: {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
  autoStart?: boolean;
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = options.continuous || false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = options.language || 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            options.onTranscript(event.results[i][0].transcript);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (options.onError) {
          options.onError(getErrorMessage(event.error));
        }
      };

      if (options.autoStart) {
        recognitionRef.current.start();
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const start = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stop = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggle = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  return {
    isListening,
    isSupported,
    start,
    stop,
    toggle
  };
}

export default VoiceInput;
