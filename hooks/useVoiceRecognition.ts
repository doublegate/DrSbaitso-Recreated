/**
 * useVoiceRecognition Hook
 *
 * React hook for Web Speech API integration.
 * Provides voice-to-text functionality with push-to-talk and continuous listening modes.
 *
 * @version 1.2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Type definitions for Web Speech API (with webkit prefix support)
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export interface VoiceRecognitionOptions {
  lang?: string; // BCP 47 language tag (e.g., 'en-US')
  continuous?: boolean; // Continue listening after recognition stops
  interimResults?: boolean; // Return interim (partial) results
  maxAlternatives?: number; // Maximum number of alternative transcripts
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

/**
 * Hook to integrate Web Speech API for voice input
 * @param options - Configuration and event handlers
 * @returns State and control methods
 */
export function useVoiceRecognition(options: VoiceRecognitionOptions = {}) {
  const {
    lang = 'en-US',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: checkSpeechRecognitionSupport(),
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (!state.isSupported) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
      onStart?.();
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
      onEnd?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: finalTranscript.trim() || prev.transcript,
        interimTranscript: interimTranscript.trim(),
      }));

      if (finalTranscript) {
        onResult?.(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult?.(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Voice recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please connect a microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Voice recognition aborted.';
          break;
        default:
          errorMessage = `Voice recognition error: ${event.error}`;
      }

      setState((prev) => ({ ...prev, error: errorMessage, isListening: false }));
      onError?.(errorMessage);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [lang, continuous, interimResults, maxAlternatives, onResult, onError, onStart, onEnd, state.isSupported]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, transcript: '', interimTranscript: '', error: null }));
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to start voice recognition',
        isListening: false,
      }));
    }
  }, [state.isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }, [state.isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    clearError,
  };
}

/**
 * Check if Web Speech API is supported in the current browser
 * @returns boolean
 */
export function checkSpeechRecognitionSupport(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/**
 * Get user-friendly browser support message
 * @returns string
 */
export function getSpeechRecognitionSupportMessage(): string {
  if (checkSpeechRecognitionSupport()) {
    return 'Voice input is supported on this browser.';
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('firefox')) {
    return 'Voice input is not supported in Firefox. Please use Chrome, Edge, or Safari.';
  }

  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Voice input requires Safari 14.1 or later.';
  }

  return 'Voice input is not supported on this browser. Please use Chrome 25+, Edge 79+, or Safari 14.1+.';
}
