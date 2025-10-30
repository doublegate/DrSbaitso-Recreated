import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from './types';
import { getDrSbaitsoResponse, synthesizeSpeech } from './services/geminiService';
import { decode, decodeAudioData, playAudio, playGlitchSound, playErrorBeep } from './utils/audio';
import { AUDIO_MODES } from './constants';
import { useAccessibility } from './hooks/useAccessibility';
import { useScreenReader } from './hooks/useScreenReader';
import SkipNav from './components/SkipNav';
import AccessibilityPanel from './components/AccessibilityPanel';

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
        const audioData = await Promise.all(lines.map(line => synthesizeSpeech(line)));
        setGreetingAudio(audioData);
        setGreetingLines(lines);
        setUserName(name);
        setIsGreeting(true);
      } catch (error) {
        console.error("Failed to prepare greeting audio:", error);
        setNameError("SYSTEM ERROR: FAILED TO INITIALIZE. PLEASE REFRESH.");
      } finally {
        setIsPreparingGreeting(false);
      }
    }
  };
  
  useEffect(() => {
    if (isGreeting && greetingIndex < greetingLines.length && playingGreetingIndexRef.current !== greetingIndex) {
      playingGreetingIndexRef.current = greetingIndex; // Prevents double-playback in StrictMode
      const line = greetingLines[greetingIndex];
      const audio = greetingAudio[greetingIndex];
      
      setMessages(prev => [...prev, { author: 'dr', text: line }]);
      
      playAndProgress(audio, () => {
        setGreetingIndex(prev => prev + 1);
      });
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

      const audioPromise = synthesizeSpeech(drResponseText);
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

  // Global keyboard shortcuts (v1.3.0 + v1.4.0)
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
            <div className="flex items-center gap-2">
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

            {/* Accessibility Panel Toggle */}
            <button
              onClick={() => setShowAccessibilityPanel(true)}
              className="px-3 py-1 border-2 border-gray-400 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
              aria-label="Open accessibility settings (Ctrl+A)"
              title="Accessibility Settings (Ctrl+A)"
            >
              <span aria-hidden="true">♿</span>
              <span className="ml-1">A11Y</span>
            </button>
          </div>

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
          <div className="flex-shrink-0 flex items-center mt-4">
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
        <AccessibilityPanel
          isOpen={showAccessibilityPanel}
          settings={accessibilitySettings}
          onClose={() => setShowAccessibilityPanel(false)}
          onUpdateSetting={updateSetting}
          onResetSettings={resetSettings}
        />
      )}
    </>
  );
}