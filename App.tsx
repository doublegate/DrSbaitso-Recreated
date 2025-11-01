import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Message, ConversationSession, CustomCharacter } from './types';
import { getDrSbaitsoResponse, synthesizeSpeech } from './services/geminiService';
import { decode, decodeAudioData, playAudio, playGlitchSound, playErrorBeep } from './utils/audio';
import { AUDIO_MODES, THEMES } from './constants';
import { useAccessibility } from './hooks/useAccessibility';
import { useScreenReader } from './hooks/useScreenReader';
import { useVoiceControl } from './hooks/useVoiceControl';
import SkipNav from './components/SkipNav';
import { CustomTheme } from './utils/themeValidator';

// Lazy-loaded components (only load when needed)
const AccessibilityPanel = lazy(() => import('./components/AccessibilityPanel'));
const ThemeCustomizer = lazy(() => import('./components/ThemeCustomizer').then(module => ({ default: module.ThemeCustomizer })));
const ConversationSearch = lazy(() => import('./components/ConversationSearch').then(module => ({ default: module.ConversationSearch })));
const AudioVisualizer = lazy(() => import('./components/AudioVisualizer').then(module => ({ default: module.AudioVisualizer })));
// v1.6.0 Components (lazy-loaded)
const AdvancedExporter = lazy(() => import('./components/AdvancedExporter').then(module => ({ default: module.AdvancedExporter })));
const CharacterCreator = lazy(() => import('./components/CharacterCreator').then(module => ({ default: module.CharacterCreator })));
const ConversationReplay = lazy(() => import('./components/ConversationReplay').then(module => ({ default: module.ConversationReplay })));
// v1.8.0 Components (lazy-loaded)
const OnboardingTutorial = lazy(() => import('./components/OnboardingTutorial'));
const ConversationInsights = lazy(() => import('./components/ConversationInsights'));

export default function App() {
  // Core state
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGreeting, setIsGreeting] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetingLines, setGreetingLines] = useState<string[]>([]);
  const [isPreparingGreeting, setIsPreparingGreeting] = useState(false);
  const [greetingAudio, setGreetingAudio] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);

  // Audio mode state (v1.3.0)
  const [audioMode, setAudioMode] = useState<'modern' | 'subtle' | 'authentic' | 'ultra'>('authentic');

  // Accessibility state (v1.4.0)
  const { settings: accessibilitySettings, updateSetting, resetSettings } = useAccessibility();
  const { announce } = useScreenReader();
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);

  // v1.5.0 Feature states
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showConversationSearch, setShowConversationSearch] = useState(false);
  const [showAudioVisualizer, setShowAudioVisualizer] = useState(false);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [savedSessions, setSavedSessions] = useState<ConversationSession[]>([]);
  const [currentAudioSource, setCurrentAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // v1.6.0 Feature states
  const [showAdvancedExport, setShowAdvancedExport] = useState(false);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [showConversationReplay, setShowConversationReplay] = useState(false);
  const [customCharacters, setCustomCharacters] = useState<CustomCharacter[]>([]);
  const [replaySession, setReplaySession] = useState<ConversationSession | null>(null);
  const [showVoiceControlHelp, setShowVoiceControlHelp] = useState(false);

  // v1.8.0 Feature states
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem('sbaitso_onboarding_completed') !== 'true';
    } catch (e) {
      return false;
    }
  });
  const [showInsights, setShowInsights] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dos-blue');

  // Voice Control (v1.6.0)
  const voiceControl = useVoiceControl({
    enabled: true,
    wakeWordEnabled: true,
    handsFreeModeEnabled: false,
    confirmDestructiveCommands: true,
    onClear: () => {
      setMessages([]);
      setUserInput('');
    },
    onExport: () => setShowAdvancedExport(true),
    onSwitchCharacter: (characterId) => {
      // Character switching logic would go here
      console.log('Switch to character:', characterId);
      announce(`Switching to ${characterId}`);
    },
    onToggleMute: () => {
      // Toggle mute logic
      console.log('Toggle mute');
    },
    onToggleSettings: () => {
      // Toggle settings
      console.log('Toggle settings');
    },
    onToggleStats: () => setShowConversationSearch(true),
    onStopAudio: () => {
      if (currentAudioSource) {
        currentAudioSource.stop();
        setCurrentAudioSource(null);
        setIsAudioPlaying(false);
      }
    },
    onCycleTheme: () => {
      // Cycle theme logic
      console.log('Cycle theme');
    },
    onCycleAudioQuality: () => {
      const modes = AUDIO_MODES.map(m => m.id);
      const currentIndex = modes.indexOf(audioMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setAudioMode(modes[nextIndex] as typeof audioMode);
      announce(`Audio mode changed to ${AUDIO_MODES[nextIndex].name}`);
    },
    onOpenAccessibility: () => setShowAccessibilityPanel(true),
    onOpenSearch: () => setShowConversationSearch(true),
    onOpenVisualizer: () => setShowAudioVisualizer(!showAudioVisualizer),
    onHelp: () => {
      setShowVoiceControlHelp(true);
      const helpText = voiceControl.showHelp();
      console.log(helpText);
    },
    onCommandExecuted: (command, match) => {
      announce(`Command executed: ${command.name}`);
      console.log('Voice command executed:', command.name, 'confidence:', match.confidence);
    },
    onWakeWordDetected: () => {
      announce('Listening for command');
      console.log('Wake word detected');
    },
    onError: (error) => {
      announce(`Voice control error: ${error}`);
      console.error('Voice control error:', error);
    },
  });

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const playingGreetingIndexRef = useRef<number>(-1);

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        // Initialize AudioWorklet module on first AudioContext creation
        if (audioContextRef.current && 'audioWorklet' in audioContextRef.current) {
          try {
            await audioContextRef.current.audioWorklet.addModule('/audio-processor.worklet.js');
            console.log('AudioWorklet initialized successfully');
          } catch (error) {
            console.warn('AudioWorklet initialization failed, will use ScriptProcessorNode fallback:', error);
          }
        }
      } catch (e) {
        console.error("Could not create AudioContext:", e);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, messages.length > 0 && messages[messages.length-1].text]);

  // Load custom characters from localStorage on mount (v1.6.0)
  useEffect(() => {
    const stored = localStorage.getItem('customCharacters');
    if (stored) {
      try {
        const chars = JSON.parse(stored) as CustomCharacter[];
        setCustomCharacters(chars);
      } catch (error) {
        console.error('Failed to load custom characters:', error);
      }
    }
  }, []);

  useEffect(() => {
    // When the name screen is visible and not loading, focus the name input.
    if (!userName && !isPreparingGreeting) {
      // Using a timeout helps ensure the focus command runs after the browser has
      // finished rendering, making it more reliable.
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } 
    // When the chat is ready for user input, focus the chat input.
    else if (userName && !isLoading && !isGreeting) {
      inputRef.current?.focus();
    }
  }, [userName, isLoading, isGreeting, isPreparingGreeting]);
  
  const playAndProgress = useCallback(async (base64Audio: string, onFinished: () => void) => {
    if (audioContextRef.current && base64Audio) {
      try {
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1, audioMode);
        await playAudio(audioBuffer, audioContextRef.current);
      } catch (error) {
        console.error("Audio playback failed:", error);
      } finally {
        onFinished();
      }
    } else {
      setTimeout(onFinished, 100);
    }
  }, [audioMode]);

  const handleNameSubmit = async () => {
    ensureAudioContext();
    if (nameInput.trim() && !isPreparingGreeting) {
      setIsPreparingGreeting(true);
      setNameError(null); // Clear previous errors
      const name = nameInput.trim().toUpperCase();

      const lines = [
        `HELLO ${name}, MY NAME IS DOCTOR SBAITSO.`,
        "I AM HERE TO HELP YOU.",
        "SAY WHATEVER IS IN YOUR MIND FREELY,",
        "OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.",
        "MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE.",
        "",
        "SO, TELL ME ABOUT YOUR PROBLEMS.",
      ];

      try {
        // Combine all greeting text into one TTS call to avoid rate limits
        const combinedGreeting = lines.filter(line => line.trim()).join('. ');
        const audioData = await synthesizeSpeech(combinedGreeting, 'sbaitso');

        // Still display lines separately for visual effect
        setGreetingAudio([audioData]); // Single audio file
        setGreetingLines(lines);
        setUserName(name);
        setIsGreeting(true);
      } catch (error: any) {
        console.error("Failed to prepare greeting audio:", error);

        // Check if it's a rate limit error (429)
        const isRateLimit = error?.message?.includes('429') ||
                           error?.message?.includes('quota') ||
                           error?.message?.includes('RESOURCE_EXHAUSTED');

        if (isRateLimit) {
          // Continue without audio - graceful degradation
          console.warn("Rate limit hit - continuing in text-only mode");
          setGreetingAudio([]); // No audio
          setGreetingLines(lines);
          setUserName(name);
          setIsGreeting(true);
        } else {
          // For other errors, show error message
          setNameError("SYSTEM ERROR: FAILED TO INITIALIZE. PLEASE REFRESH.");
        }
      } finally {
        setIsPreparingGreeting(false);
      }
    }
  };
  
  useEffect(() => {
    if (isGreeting && greetingIndex < greetingLines.length && playingGreetingIndexRef.current !== greetingIndex) {
      playingGreetingIndexRef.current = greetingIndex; // Prevents double-playback in StrictMode
      const line = greetingLines[greetingIndex];

      setMessages(prev => [...prev, { author: 'dr', text: line }]);

      // Play audio only on first line (combined greeting audio)
      if (greetingIndex === 0 && greetingAudio.length > 0) {
        playAndProgress(greetingAudio[0], () => {
          // Audio finished, but continue displaying lines
          setGreetingIndex(prev => prev + 1);
        });
      } else {
        // For subsequent lines, just display with typewriter delay
        setTimeout(() => {
          setGreetingIndex(prev => prev + 1);
        }, 800); // Delay between lines for visual effect
      }
    } else if (isGreeting && greetingIndex >= greetingLines.length) {
      setIsGreeting(false);
      setIsLoading(false);
    }
  }, [isGreeting, greetingIndex, greetingLines, greetingAudio, playAndProgress]);

  const handleUserInput = async () => {
    ensureAudioContext();
    const trimmedInput = userInput.trim();

    if (!trimmedInput || isLoading) {
      return;
    }
    
    const userMessage: Message = { author: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const drResponseText = await getDrSbaitsoResponse(trimmedInput);
      
      // Check for glitch phrases and play sound effect
      const glitchPhrases = ['PARITY CHECKING', 'IRQ CONFLICT'];
      if (glitchPhrases.some(phrase => drResponseText.includes(phrase))) {
        if (audioContextRef.current) {
            playGlitchSound(audioContextRef.current);
        }
      }

      const audioPromise = synthesizeSpeech(drResponseText, 'sbaitso').catch(err => {
        // Gracefully handle TTS errors - continue without audio
        console.warn("TTS failed, continuing text-only:", err);
        return ""; // Return empty string if TTS fails
      });
      setMessages(prev => [...prev, { author: 'dr', text: '' }]);

      const typingSpeed = 40;
      for (let i = 0; i < drResponseText.length; i++) {
          await new Promise(resolve => setTimeout(resolve, typingSpeed));
          setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].text += drResponseText[i];
              return newMessages;
          });
      }

      const base64Audio = await audioPromise;
      if (audioContextRef.current && base64Audio) {
          const audioBytes = decode(base64Audio);
          const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1, audioMode);
          await playAudio(audioBuffer, audioContextRef.current);
      }

      // Announce to screen readers if enabled (v1.4.0)
      if (accessibilitySettings.screenReaderOptimized && accessibilitySettings.announceMessages) {
        announce(`Dr. Sbaitso says: ${drResponseText}`);
      }
    } catch (error) {
      console.error("An error occurred during response generation:", error);
      
      if (audioContextRef.current) {
        playErrorBeep(audioContextRef.current);
      }

      const errorMessages = [
          'UNEXPECTED DATA STREAM CORRUPTION. PLEASE REBOOT.',
          'INTERNAL PROCESSOR FAULT. PLEASE TRY AGAIN.',
          'MEMORY ADDRESS CONFLICT. PLEASE RESTATE YOUR PROBLEM.',
          'IRQ CONFLICT AT ADDRESS 220H. SESSION TERMINATED.'
      ];
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      
      setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          // If the last message was the empty one for the typewriter, remove it.
          if (lastMessage && lastMessage.author === 'dr') {
               return prev.slice(0, -1);
          }
          return prev;
      });
      setMessages(prev => [...prev, { author: 'dr', text: randomError }]);

    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleUserInput();
    }
  };

  // Global keyboard shortcuts (v1.3.0 + v1.4.0 + v1.8.0)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A: Open Accessibility Panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        setShowAccessibilityPanel(true);
      }

      // Ctrl/Cmd + Shift + V: Cycle audio modes
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        const currentIndex = AUDIO_MODES.findIndex(m => m.id === audioMode);
        const nextIndex = (currentIndex + 1) % AUDIO_MODES.length;
        setAudioMode(AUDIO_MODES[nextIndex].id);
        if (accessibilitySettings.screenReaderOptimized) {
          announce(`Audio mode changed to ${AUDIO_MODES[nextIndex].name}`);
        }
      }

      // Ctrl/Cmd + I: Toggle conversation insights (v1.8.0)
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && !e.shiftKey) {
        e.preventDefault();
        setShowInsights(prev => !prev);
      }

      // Ctrl/Cmd + ?: Toggle onboarding tutorial (v1.8.0)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowOnboarding(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [audioMode, accessibilitySettings.screenReaderOptimized, announce]);

  if (!userName) {
    return (
      <>
        <SkipNav />
        <main
          id="main-content"
          className="bg-blue-800 text-white font-mono w-screen h-screen flex flex-col items-center justify-center p-4"
          role="main"
          aria-label="Dr. Sbaitso name entry screen"
        >
          <div className="w-full max-w-md text-center">
            {nameError && (
              <p
                className="text-red-500 text-lg mb-4"
                role="alert"
                aria-live="assertive"
              >
                {nameError}
              </p>
            )}
            {isPreparingGreeting ? (
              <p
                className="text-xl mb-4 animate-pulse"
                role="status"
                aria-live="polite"
              >
                PREPARING SESSION...
              </p>
            ) : (
              <>
                <label htmlFor="name-input" className="text-xl mb-4 block">
                  PLEASE ENTER YOUR NAME:
                </label>
                <div className="flex items-center justify-center">
                  <span className="text-yellow-300 mr-2" aria-hidden="true">{'>'}</span>
                  <input
                    id="name-input"
                    ref={nameInputRef}
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleNameSubmit();
                      }
                    }}
                    className="bg-transparent border-none text-yellow-300 w-3/4 focus:outline-none placeholder-gray-500 text-center"
                    placeholder="TYPE NAME AND PRESS ENTER"
                    disabled={isPreparingGreeting}
                    aria-label="Enter your name"
                    aria-describedby="name-input-help"
                  />
                </div>
                <span id="name-input-help" className="sr-only">
                  Type your name and press Enter to begin your session with Dr. Sbaitso
                </span>
              </>
            )}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SkipNav />

      <main
        className="bg-blue-800 text-white font-mono w-screen h-screen flex flex-col p-2 sm:p-4 overflow-hidden"
        role="main"
      >
        <div className="w-full max-w-4xl mx-auto flex flex-col flex-grow border-2 border-gray-400 p-4 min-h-0">
          {/* Header with settings (v1.3.0 + v1.4.0) */}
          <div className="flex-shrink-0 flex justify-between items-center mb-4 pb-2 border-b-2 border-gray-400">
            {/* Audio Mode Selector */}
            <div className="flex items-center gap-2" data-tour-id="audio-settings">
              <label htmlFor="audio-mode-select" className="text-sm font-bold">
                AUDIO MODE:
              </label>
              <select
                id="audio-mode-select"
                value={audioMode}
                onChange={(e) => setAudioMode(e.target.value as typeof audioMode)}
                className="bg-blue-900 border-2 border-gray-400 text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                aria-label="Select audio quality mode"
                title={AUDIO_MODES.find(m => m.id === audioMode)?.description || ''}
              >
                {AUDIO_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name}
                  </option>
                ))}
              </select>
            </div>

            {/* v1.5.0 & v1.6.0 Feature Buttons */}
            <div className="flex gap-2" data-tour-id="settings-panel">
              <button
                onClick={() => setShowThemeCustomizer(true)}
                className="px-3 py-1 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
                aria-label="Open theme customizer"
                title="Theme Customizer"
                data-tour-id="theme-button"
              >
                🎨
              </button>
              <button
                onClick={() => setShowConversationSearch(true)}
                className="px-3 py-1 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
                aria-label="Search conversations"
                title="Search & Analytics"
                data-tour-id="session-panel"
              >
                🔍
              </button>
              <button
                onClick={() => setShowAudioVisualizer(!showAudioVisualizer)}
                className="px-3 py-1 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
                aria-label="Toggle audio visualizer"
                title="Audio Visualizer"
              >
                📊
              </button>
              <button
                onClick={() => setShowAdvancedExport(true)}
                className="px-3 py-1 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
                aria-label="Advanced export options"
                title="Advanced Export"
                data-tour-id="export-button"
              >
                📦
              </button>
              <button
                onClick={() => setShowCharacterCreator(true)}
                className="px-3 py-1 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
                aria-label="Character creator"
                title="Character Creator"
                data-tour-id="character-selection"
              >
                🎭
              </button>
              <button
                onClick={() => setShowAccessibilityPanel(true)}
                className="px-3 py-1 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
                aria-label="Open accessibility settings (Ctrl+A)"
                title="Accessibility Settings (Ctrl+A)"
                data-tour-id="shortcuts-help"
              >
                <span aria-hidden="true">♿</span>
                <span className="ml-1">A11Y</span>
              </button>
              <button
                onClick={() => voiceControl.toggleHandsFreeMode()}
                className={`px-3 py-1 border-2 ${
                  voiceControl.isHandsFreeMode ? 'border-green-400 bg-green-900' : 'border-gray-400'
                } hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm`}
                aria-label={`Voice control: ${voiceControl.isHandsFreeMode ? 'ON' : 'OFF'}`}
                title={`Voice Control (Hands-Free Mode)\n${voiceControl.isHandsFreeMode ? 'Click to disable' : 'Click to enable'}\nSay "Hey Doctor" followed by a command`}
                disabled={!voiceControl.isSupported}
              >
                <span aria-hidden="true">🎤</span>
                {voiceControl.isHandsFreeMode && <span className="ml-1 text-green-300">ON</span>}
              </button>
            </div>
          </div>

          {/* Voice Control Indicator (v1.6.0) */}
          {voiceControl.isHandsFreeMode && (
            <div className="mt-2 p-2 border-2 border-green-400 bg-green-900 bg-opacity-30">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`${voiceControl.isListeningForWakeWord ? 'animate-pulse' : ''}`}>
                    {voiceControl.isListeningForWakeWord && '🎤 Listening for "Hey Doctor"...'}
                    {voiceControl.isListeningForCommand && '🎯 Listening for command...'}
                    {!voiceControl.isListeningForWakeWord && !voiceControl.isListeningForCommand && '⏸ Standby'}
                  </span>
                  {voiceControl.suggestions.length > 0 && (
                    <span className="text-yellow-300">
                      Suggestions: {voiceControl.suggestions.map(s => s.name).join(', ')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowVoiceControlHelp(true)}
                  className="px-2 py-1 border border-gray-400 hover:border-yellow-300 text-xs"
                  title="View voice commands"
                >
                  Help
                </button>
              </div>
              {voiceControl.error && (
                <div className="mt-1 text-red-400 text-xs">
                  ⚠ {voiceControl.error}
                </div>
              )}
              {voiceControl.pendingConfirmation && (
                <div className="mt-2 p-2 bg-yellow-900 bg-opacity-50 border border-yellow-400">
                  <div className="text-yellow-300 text-xs mb-2">
                    Confirm: {voiceControl.pendingConfirmation.name}?
                  </div>
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
          )}

          {/* Messages area */}
          <div
            id="main-content"
            className="flex-grow overflow-y-auto pr-2 min-h-0"
            role="log"
            aria-live="polite"
            aria-label="Conversation messages"
          >
            {messages.map((msg, index) => (
              <p
                key={index}
                className={msg.author === 'dr' ? 'text-white' : 'text-yellow-300'}
                role="article"
                aria-label={`Message from ${msg.author === 'dr' ? 'Dr. Sbaitso' : 'you'}`}
              >
                {msg.author === 'user' && <span aria-hidden="true">{'> '}</span>}
                {msg.text}
                {isLoading && !isGreeting && msg.author === 'dr' && index === messages.length - 1 && (
                  <span className="animate-pulse" aria-hidden="true">_</span>
                )}
              </p>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="flex-shrink-0 flex items-center mt-4" data-tour-id="chat-input">
            <span className="text-yellow-300 mr-2" aria-hidden="true">{'>'}</span>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="bg-transparent border-none text-yellow-300 w-full focus:outline-none placeholder-gray-500"
              placeholder={isLoading ? '' : 'TYPE HERE AND PRESS ENTER...'}
              aria-label="Enter your message"
              aria-describedby="chat-input-help"
            />
            <span id="chat-input-help" className="sr-only">
              Type your message and press Enter to send to Dr. Sbaitso
            </span>
          </div>

          {/* Audio mode indicator */}
          <div className="flex-shrink-0 mt-2 text-xs opacity-50 text-center">
            <span aria-live="polite" aria-atomic="true">
              {AUDIO_MODES.find(m => m.id === audioMode)?.name} | Ctrl+Shift+V to cycle | Ctrl+A for accessibility
            </span>
          </div>
        </div>
      </main>

      {/* Accessibility Panel (v1.4.0) */}
      {showAccessibilityPanel && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AccessibilityPanel
            isOpen={showAccessibilityPanel}
            settings={accessibilitySettings}
            onClose={() => setShowAccessibilityPanel(false)}
            onUpdateSetting={updateSetting}
            onResetSettings={resetSettings}
          />
        </Suspense>
      )}

      {/* Theme Customizer (v1.5.0) */}
      {showThemeCustomizer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <ThemeCustomizer
            isOpen={showThemeCustomizer}
            onClose={() => setShowThemeCustomizer(false)}
            onSave={(theme) => {
              setCustomThemes([...customThemes, theme]);
              console.log('Custom theme saved:', theme);
              setShowThemeCustomizer(false);
            }}
          />
        </Suspense>
      )}

      {/* Conversation Search (v1.5.0) */}
      {showConversationSearch && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <ConversationSearch
            isOpen={showConversationSearch}
            onClose={() => setShowConversationSearch(false)}
            sessions={savedSessions}
            onOpenSession={(sessionId) => {
              console.log('Opening session:', sessionId);
              // Find the session and trigger replay
              const session = savedSessions.find(s => s.id === sessionId);
              if (session) {
                setReplaySession(session);
                setShowConversationReplay(true);
                setShowConversationSearch(false);
              }
            }}
          />
        </Suspense>
      )}

      {/* Audio Visualizer (v1.5.0) */}
      {showAudioVisualizer && (
        <Suspense fallback={<div className="fixed bottom-4 right-4 z-40 text-white">Loading...</div>}>
          <div className="fixed bottom-4 right-4 z-40">
            <AudioVisualizer
              audioContext={audioContextRef.current}
              audioSource={currentAudioSource}
              isPlaying={isAudioPlaying}
            />
          </div>
        </Suspense>
      )}

      {/* Advanced Exporter (v1.6.0) */}
      {showAdvancedExport && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AdvancedExporter
            isOpen={showAdvancedExport}
            onClose={() => setShowAdvancedExport(false)}
            sessions={savedSessions}
            themes={customThemes}
            currentSession={savedSessions[0]} // Use most recent session as current
          />
        </Suspense>
      )}

      {/* Character Creator (v1.6.0) */}
      {showCharacterCreator && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <CharacterCreator
            isOpen={showCharacterCreator}
            onClose={() => setShowCharacterCreator(false)}
            onSave={(character) => {
              const updatedCharacters = [...customCharacters, character];
              setCustomCharacters(updatedCharacters);
              localStorage.setItem('customCharacters', JSON.stringify(updatedCharacters));
            }}
            onDelete={(characterId) => {
              const updatedCharacters = customCharacters.filter(c => c.id !== characterId);
              setCustomCharacters(updatedCharacters);
              localStorage.setItem('customCharacters', JSON.stringify(updatedCharacters));
            }}
            existingCharacters={customCharacters}
          />
        </Suspense>
      )}

      {/* Conversation Replay (v1.6.0) */}
      {showConversationReplay && replaySession && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <ConversationReplay
            isOpen={showConversationReplay}
            onClose={() => {
              setShowConversationReplay(false);
              setReplaySession(null);
            }}
            session={replaySession}
          />
        </Suspense>
      )}

      {/* Onboarding Tutorial (v1.8.0) */}
      {showOnboarding && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading tutorial...</div></div>}>
          <OnboardingTutorial
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}

      {/* Conversation Insights (v1.8.0) */}
      {showInsights && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white">Loading insights...</div></div>}>
          <ConversationInsights
            onClose={() => setShowInsights(false)}
            currentTheme={currentTheme}
          />
        </Suspense>
      )}

      {/* Voice Control Help Modal (v1.6.0) */}
      {showVoiceControlHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-blue-900 border-4 border-gray-400 p-6 max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">VOICE CONTROL COMMANDS</h2>
              <button
                onClick={() => setShowVoiceControlHelp(false)}
                className="text-white hover:text-yellow-300 text-2xl"
                aria-label="Close help"
              >
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

              {voiceControl.commands.length > 0 && (
                <>
                  {['conversation', 'character', 'audio', 'navigation', 'settings'].map(category => {
                    const categoryCommands = voiceControl.commands.filter(c => c.category === category);
                    if (categoryCommands.length === 0) return null;

                    return (
                      <div key={category}>
                        <h3 className="text-yellow-300 font-bold mb-2">{category.toUpperCase()}:</h3>
                        <ul className="space-y-2">
                          {categoryCommands.map(cmd => (
                            <li key={cmd.id} className="text-white">
                              <span className="text-green-400">"{ cmd.phrases[0]}"</span>
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
                  Say any of these to activate voice control: "Hey Doctor", "Hey Sbaitso", "Doctor Sbaitso", "Okay Doctor", "Listen Doctor"
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
                onClick={() => setShowVoiceControlHelp(false)}
                className="px-4 py-2 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}