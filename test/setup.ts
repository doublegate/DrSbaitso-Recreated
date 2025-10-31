/**
 * Vitest Setup File
 * Global test configuration and mocks
 *
 * @version 1.7.0
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Helper to ensure matchMedia is always available
const ensureMatchMedia = () => {
  if (!window.matchMedia || typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
};

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  ensureMatchMedia(); // Re-initialize matchMedia if it was cleared
});

// Mock Web Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createBuffer: vi.fn((channels, length, sampleRate) => ({
    length: length || 1000,
    duration: (length || 1000) / (sampleRate || 24000),
    sampleRate: sampleRate || 24000,
    numberOfChannels: channels || 1,
    getChannelData: vi.fn(() => new Float32Array(length || 1000)),
  })),
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
    playbackRate: { value: 1 },
    onended: null,
  })),
  createScriptProcessor: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onaudioprocess: null,
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  })),
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
    type: 'sine',
    onended: null,
  })),
  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteTimeDomainData: vi.fn(),
    getByteFrequencyData: vi.fn(),
    smoothingTimeConstant: 0.8,
  })),
  createBiquadFilter: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 1000 },
    Q: { value: 1 },
    type: 'lowpass',
  })),
  createMediaStreamSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  destination: {},
  state: 'running',
  sampleRate: 24000,
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  decodeAudioData: vi.fn().mockResolvedValue({
    length: 1000,
    duration: 1,
    sampleRate: 24000,
    numberOfChannels: 1,
    getChannelData: vi.fn(() => new Float32Array(1000)),
  }),
}));

// Mock OfflineAudioContext
global.OfflineAudioContext = vi.fn().mockImplementation(() => ({
  createBuffer: vi.fn(),
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    buffer: null,
  })),
  createBiquadFilter: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { value: 1000 },
    Q: { value: 1 },
    type: 'lowpass',
  })),
  destination: {},
  startRendering: vi.fn().mockResolvedValue({
    length: 1000,
    duration: 1,
    sampleRate: 11025,
    numberOfChannels: 1,
    getChannelData: vi.fn(() => new Float32Array(1000)),
  }),
  length: 1000,
  sampleRate: 11025,
}));

// Mock AudioWorklet
Object.defineProperty(global.AudioContext.prototype, 'audioWorklet', {
  value: {
    addModule: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock Web Speech API
const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onstart: null,
  onend: null,
  onerror: null,
  onresult: null,
}));

Object.defineProperty(global, 'webkitSpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
});

Object.defineProperty(global, 'SpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
});

// Mock matchMedia - must be configurable to allow test overrides
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 0) as any;
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: {
        state: 'activated',
        postMessage: vi.fn(),
      },
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(true),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    ready: Promise.resolve({
      active: {
        state: 'activated',
        postMessage: vi.fn(),
      },
      installing: null,
      waiting: null,
      update: vi.fn(),
      unregister: vi.fn(),
    }),
    controller: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock Gemini API
vi.mock('@google/genai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn(() => ({
      startChat: vi.fn(() => ({
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: vi.fn(() => 'HELLO, I AM DR. SBAITSO. TELL ME ABOUT YOUR PROBLEMS.'),
          },
        }),
      })),
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn(() => 'PARITY CHECKING...'),
        },
      }),
    })),
  })),
}));

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
      })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
      })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      canvas: {
        width: 300,
        height: 150,
      },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as any;
  }
  return null;
});

console.log('✅ Vitest setup complete - All mocks initialized');
