/**
 * Component Tests for VoiceInput (v1.11.0 - Option D1)
 *
 * Tests:
 * - Browser support detection
 * - Start/stop voice recognition
 * - Transcript handling (interim and final)
 * - Error handling (6+ error types)
 * - Disabled state
 * - Clear functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceInput, useVoiceInput } from './VoiceInput';
import { renderHook, act } from '@testing-library/react';

// Mock Speech Recognition API
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;

  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onnomatch: (() => void) | null = null;
  onsoundstart: (() => void) | null = null;
  onsoundend: (() => void) | null = null;

  start() {
    if (this.onstart) {
      this.onstart();
    }
  }

  stop() {
    if (this.onend) {
      this.onend();
    }
  }

  abort() {
    if (this.onerror) {
      this.onerror({ error: 'aborted' });
    }
  }

  // Helper to simulate results
  simulateResult(transcript: string, isFinal: boolean = true) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [
          {
            0: { transcript },
            isFinal,
            length: 1
          }
        ],
        length: 1
      };
      this.onresult(event);
    }
  }

  // Helper to simulate errors
  simulateError(errorType: string) {
    if (this.onerror) {
      this.onerror({ error: errorType });
    }
  }
}

describe('VoiceInput Component', () => {
  let mockRecognitionInstance: MockSpeechRecognition;

  beforeEach(() => {
    // Setup mock Speech Recognition
    mockRecognitionInstance = new MockSpeechRecognition();

    (window as any).SpeechRecognition = vi.fn(() => mockRecognitionInstance);
    (window as any).webkitSpeechRecognition = vi.fn(() => mockRecognitionInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  describe('Browser Support', () => {
    it('should render normally when speech recognition is supported', () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      expect(screen.getByRole('button', { name: /start listening/i })).toBeInTheDocument();
    });

    it('should show error message when speech recognition is not supported', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      const mockTranscript = vi.fn();
      const mockError = vi.fn();

      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      expect(screen.getByText(/voice input not supported/i)).toBeInTheDocument();
      expect(mockError).toHaveBeenCalledWith('Speech recognition not supported in this browser');
    });

    it('should show disabled message when isEnabled is false', () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} isEnabled={false} />);

      expect(screen.getByText(/voice input disabled/i)).toBeInTheDocument();
    });
  });

  describe('Start/Stop Functionality', () => {
    it('should start listening when start button is clicked', async () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/listening.../i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /stop listening/i })).toBeInTheDocument();
    });

    it('should stop listening when stop button is clicked', async () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      // Start listening
      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/listening.../i)).toBeInTheDocument();
      });

      // Stop listening
      const stopButton = screen.getByRole('button', { name: /stop listening/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.queryByText(/listening.../i)).not.toBeInTheDocument();
      });
    });

    it('should configure recognition with correct settings', () => {
      const mockTranscript = vi.fn();
      render(
        <VoiceInput
          onTranscript={mockTranscript}
          language="es-ES"
          continuous={true}
        />
      );

      expect(mockRecognitionInstance.lang).toBe('es-ES');
      expect(mockRecognitionInstance.continuous).toBe(true);
      expect(mockRecognitionInstance.interimResults).toBe(true);
    });
  });

  describe('Transcript Handling', () => {
    it('should call onTranscript with final transcript', async () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      // Start listening
      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      // Simulate speech result
      mockRecognitionInstance.simulateResult('Hello world', true);

      await waitFor(() => {
        expect(mockTranscript).toHaveBeenCalledWith('Hello world');
      });
    });

    it('should display interim transcript', async () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      // Start listening
      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      // Simulate interim result
      mockRecognitionInstance.simulateResult('Hello', false);

      await waitFor(() => {
        expect(screen.getByText(/Hello/i)).toBeInTheDocument();
      });

      // Should not call onTranscript for interim results
      expect(mockTranscript).not.toHaveBeenCalled();
    });

    it('should accumulate multiple final transcripts', async () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      // Start listening
      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      // Simulate multiple results
      mockRecognitionInstance.simulateResult('Hello', true);
      mockRecognitionInstance.simulateResult('world', true);

      await waitFor(() => {
        expect(mockTranscript).toHaveBeenCalledTimes(2);
      });

      expect(mockTranscript).toHaveBeenNthCalledWith(1, 'Hello');
      expect(mockTranscript).toHaveBeenNthCalledWith(2, 'world');
    });

    it('should show transcript with interim text in italic', async () => {
      const mockTranscript = vi.fn();
      const { container } = render(<VoiceInput onTranscript={mockTranscript} />);

      // Start listening
      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      // Final + interim
      mockRecognitionInstance.simulateResult('Final text', true);
      mockRecognitionInstance.simulateResult('interim', false);

      await waitFor(() => {
        const italic = container.querySelector('span.italic');
        expect(italic).toBeInTheDocument();
        expect(italic).toHaveTextContent('interim');
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should clear transcript when clear button is clicked', async () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      // Start and get transcript
      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);
      mockRecognitionInstance.simulateResult('Test transcript', true);

      await waitFor(() => {
        expect(screen.getByText(/Test transcript/i)).toBeInTheDocument();
      });

      // Stop listening
      const stopButton = screen.getByRole('button', { name: /stop listening/i });
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear transcript/i })).toBeInTheDocument();
      });

      // Clear
      const clearButton = screen.getByRole('button', { name: /clear transcript/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText(/Test transcript/i)).not.toBeInTheDocument();
      });
    });

    it('should not show clear button while listening', async () => {
      const mockTranscript = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      mockRecognitionInstance.simulateResult('Test', true);

      await waitFor(() => {
        expect(screen.getByText(/listening.../i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /clear transcript/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle no-speech error', async () => {
      const mockTranscript = vi.fn();
      const mockError = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      mockRecognitionInstance.simulateError('no-speech');

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('No speech detected. Please try again.');
      });
    });

    it('should handle audio-capture error', async () => {
      const mockTranscript = vi.fn();
      const mockError = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      mockRecognitionInstance.simulateError('audio-capture');

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('No microphone found. Please check your device.');
      });
    });

    it('should handle not-allowed error', async () => {
      const mockTranscript = vi.fn();
      const mockError = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      mockRecognitionInstance.simulateError('not-allowed');

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Microphone permission denied. Please enable in browser settings.');
      });
    });

    it('should handle network error', async () => {
      const mockTranscript = vi.fn();
      const mockError = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      mockRecognitionInstance.simulateError('network');

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Network error. Please check your connection.');
      });
    });

    it('should handle aborted error', async () => {
      const mockTranscript = vi.fn();
      const mockError = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      mockRecognitionInstance.simulateError('aborted');

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Voice input was cancelled.');
      });
    });

    it('should handle generic errors', async () => {
      const mockTranscript = vi.fn();
      const mockError = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      mockRecognitionInstance.simulateError('unknown-error');

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith('Voice input error: unknown-error');
      });
    });

    it('should stop listening on error', async () => {
      const mockTranscript = vi.fn();
      const mockError = vi.fn();
      render(<VoiceInput onTranscript={mockTranscript} onError={mockError} />);

      const startButton = screen.getByRole('button', { name: /start listening/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/listening.../i)).toBeInTheDocument();
      });

      mockRecognitionInstance.simulateError('no-speech');

      await waitFor(() => {
        expect(screen.queryByText(/listening.../i)).not.toBeInTheDocument();
      });
    });
  });
});

describe('useVoiceInput Hook', () => {
  let mockRecognitionInstance: MockSpeechRecognition;

  beforeEach(() => {
    mockRecognitionInstance = new MockSpeechRecognition();
    (window as any).SpeechRecognition = vi.fn(() => mockRecognitionInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (window as any).SpeechRecognition;
  });

  it('should return isSupported as true when speech recognition is available', () => {
    const mockTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript })
    );

    expect(result.current.isSupported).toBe(true);
  });

  it('should return isSupported as false when speech recognition is not available', () => {
    delete (window as any).SpeechRecognition;

    const mockTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript })
    );

    expect(result.current.isSupported).toBe(false);
  });

  it('should start listening when start() is called', () => {
    const mockTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('should stop listening when stop() is called', () => {
    const mockTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('should toggle listening state when toggle() is called', () => {
    const mockTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript })
    );

    // Toggle on
    act(() => {
      result.current.toggle();
    });

    expect(result.current.isListening).toBe(true);

    // Toggle off
    act(() => {
      result.current.toggle();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('should call onTranscript with final results', () => {
    const mockTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript })
    );

    act(() => {
      result.current.start();
    });

    mockRecognitionInstance.simulateResult('Test transcript', true);

    expect(mockTranscript).toHaveBeenCalledWith('Test transcript');
  });

  it('should call onError when error occurs', () => {
    const mockTranscript = vi.fn();
    const mockError = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript, onError: mockError })
    );

    act(() => {
      result.current.start();
    });

    mockRecognitionInstance.simulateError('not-allowed');

    expect(mockError).toHaveBeenCalledWith('Microphone permission denied. Please enable in browser settings.');
  });

  it('should auto-start if autoStart option is true', () => {
    const mockTranscript = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript, autoStart: true })
    );

    expect(result.current.isListening).toBe(true);
  });

  it('should configure language correctly', () => {
    const mockTranscript = vi.fn();
    renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript, language: 'fr-FR' })
    );

    expect(mockRecognitionInstance.lang).toBe('fr-FR');
  });

  it('should cleanup on unmount', () => {
    const mockTranscript = vi.fn();
    const stopSpy = vi.spyOn(mockRecognitionInstance, 'stop');

    const { unmount } = renderHook(() =>
      useVoiceInput({ onTranscript: mockTranscript })
    );

    unmount();

    expect(stopSpy).toHaveBeenCalled();
  });
});
