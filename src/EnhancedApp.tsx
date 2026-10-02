import React, { useState, useEffect, useEffectEvent, useRef, useCallback, lazy, Suspense } from 'react';
import { Message, ConversationSession } from './types';
import { getAIResponse, resetChat, synthesizeSpeech } from './services/geminiService';
import { playGlitchSound, playErrorBeep } from './utils/audio';
import { getSharedAudioContext, ensureAudioReady } from './utils/sharedAudio';
import { retroErrorMessage } from './utils/retroErrors';
import { useSpeechPlayer } from './hooks/useSpeechPlayer';
import { AUDIO_MODES } from './constants';
import { useAccessibility } from './hooks/useAccessibility';
import { useScreenReader } from './hooks/useScreenReader';
import { useVoiceControl } from './hooks/useVoiceControl';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useFocusTrap } from './hooks/useFocusTrap';
import MenuGroup from './components/enhanced/MenuGroup';
import { playSoundPackEvent } from './utils/soundPackPlayer';
import { saveSoundPack } from './utils/soundPackStore';
import { hasStarted, personaOpening, personaTurn, resetPersona, type PersonaEngines } from './engine/personaTurn';
import { useSessionHistory } from './hooks/useSessionHistory';
import { useThemeChoice } from './hooks/useThemeChoice';
import { usePersona } from './hooks/usePersona';
import { matchShortcut, shortcutLabel, type ShortcutId } from './utils/shortcuts';
import { useSoundEffects } from './hooks/useSoundEffects';
import SkipNav from './components/SkipNav';

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
// v1.9.0 Components (lazy-loaded)
const SoundSettingsPanel = lazy(() => import('./components/SoundSettingsPanel'));
// v1.10.0 Components (lazy-loaded)
const MusicPlayer = lazy(() => import('./components/MusicPlayer'));
const InstallPrompt = lazy(() => import('./components/InstallPrompt'));
const SoundPackManager = lazy(() => import('./components/SoundPackManager'));
const SoundPackCreator = lazy(() => import('./components/SoundPackCreator'));
const CloudSyncPanel = lazy(() => import('./components/CloudSyncPanel'));
// v1.11.0 Components (lazy-loaded - Option C)
const VoiceInput = lazy(() => import('./components/VoiceInput'));
const EmotionVisualizer = lazy(() => import('./components/EmotionVisualizer'));
const TopicFlowDiagram = lazy(() => import('./components/TopicFlowDiagram'));
const ConversationTemplates = lazy(() => import('./components/ConversationTemplates'));

const TYPING_DELAY_MS = 40;
/** Replies longer than this are printouts and type at FAST_TYPING_DELAY_MS. */
const LONG_PRINTOUT_CHARS = 400;
const FAST_TYPING_DELAY_MS = 4;
const GREETING_LINE_DELAY_MS = 800;
const GLITCH_PHRASES = ['PARITY CHECKING', 'IRQ CONFLICT'];
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Opening lines per persona. Dr. Sbaitso uses the original v2.20 greeting;
 * personas with a local engine use its opener (ELIZA's 1965 script greeting,
 * JOSHUA's LOGON prompt); the rest get a generic connection line.
 */
function personaGreeting(personaId: string, personaName: string, userName: string): string[] {
  const opening = personaOpening(personaId);
  if (opening) return opening;
  switch (personaId) {
    case 'sbaitso':
      return [
        `HELLO ${userName},  MY NAME IS DOCTOR SBAITSO.`,
        '',
        'I AM HERE TO HELP YOU.',
        'SAY WHATEVER IS IN YOUR MIND FREELY,',
        'OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.',
        'MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,',
        '',
        'SO, TELL ME ABOUT YOUR PROBLEMS.',
      ];
    default:
      return [`HELLO ${userName}.`, `YOU ARE NOW CONNECTED TO ${personaName.toUpperCase()}.`];
  }
}

/** The modern UI: toolbar, panels, personas and extras ("Enhanced" mode). */
export default function EnhancedApp({ onSwitchMode }: { onSwitchMode?: () => void } = {}) {
  // Core state
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGreeting, setIsGreeting] = useState(false);
  const [isPreparingGreeting, setIsPreparingGreeting] = useState(false);
  // The active persona (built-in or custom), chosen in the toolbar.
  const personaState = usePersona();
  const { persona, chatOptions, speechOptions, formatReply, voiceProcessing } = personaState;
  const characterId = persona.id;

  // Audio mode state (v1.3.0)
  const [audioMode, setAudioMode] = useState<'modern' | 'subtle' | 'authentic' | 'ultra'>('authentic');
  const speech = useSpeechPlayer(audioMode);
  // Muted: replies are shown but not synthesised (also saves TTS quota).
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  // Accessibility state (v1.4.0)
  const { settings: accessibilitySettings, updateSetting, resetSettings } = useAccessibility();
  const { announce } = useScreenReader();
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);

  // v1.5.0 Feature states
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showConversationSearch, setShowConversationSearch] = useState(false);
  const [showAudioVisualizer, setShowAudioVisualizer] = useState(false);

  // v1.6.0 Feature states
  const [showAdvancedExport, setShowAdvancedExport] = useState(false);
  const [showCharacterCreator, setShowCharacterCreator] = useState(false);
  const [showConversationReplay, setShowConversationReplay] = useState(false);
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
  // Selected colour theme (built-in or custom), persisted and applied.
  const themeChoice = useThemeChoice();
  const currentTheme = themeChoice.theme.id;
  const activeTheme = themeChoice.theme;

  // Conversation history is opt-in (the greeting promises memory is wiped).
  const { keepHistory, setKeepHistory, currentSession, savedSessions, mergeSessions } = useSessionHistory(messages, {
    characterId,
    themeId: currentTheme,
    audioQualityId: audioMode,
  });


  // v1.9.0 Feature states
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  // v1.10.0 Feature states
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [showSoundPackManager, setShowSoundPackManager] = useState(false);
  const [showSoundPackCreator, setShowSoundPackCreator] = useState(false);
  const [showCloudSync, setShowCloudSync] = useState(false);

  // v1.11.0 Feature states (Option C)
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showEmotionViz, setShowEmotionViz] = useState(false);
  const [showTopicDiagram, setShowTopicDiagram] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Keeps keyboard focus inside the voice-help dialog while it is open.
  const voiceHelpRef = useFocusTrap(showVoiceControlHelp);

  // PWA install banner: only offered when the browser supports installing.
  const installPrompt = useInstallPrompt();

  // Voice Control (v1.6.0)
  const voiceControl = useVoiceControl({
    enabled: true,
    wakeWordEnabled: true,
    handsFreeModeEnabled: false,
    confirmDestructiveCommands: true,
    onClear: () => clearConversation(),
    onExport: () => setShowAdvancedExport(true),
    onSwitchCharacter: (id) => switchPersona(id),
    onToggleMute: () => toggleMute(),
    onToggleSettings: () => setShowSoundSettings(prev => !prev),
    onToggleStats: () => setShowConversationSearch(true),
    onStopAudio: () => speech.stop(),
    onCycleTheme: () => themeChoice.cycleTheme(),
    onCycleAudioQuality: () => cycleAudioMode(),
    onOpenAccessibility: () => setShowAccessibilityPanel(true),
    onOpenSearch: () => setShowConversationSearch(true),
    onOpenVisualizer: () => setShowAudioVisualizer(!showAudioVisualizer),
    onToggleMusic: () => setShowMusicPlayer(prev => !prev),
    onOpenSoundPacks: () => setShowSoundPackManager(true),
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

  // Sound Effects (v1.9.0)
  const soundEffects = useSoundEffects();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Guards one conversational turn at a time across async callers (typed input,
  // templates, voice) without depending on render-time state.
  const busyRef = useRef(false);
  // Local engine state per persona (ELIZA, PARRY, HAL, JOSHUA); see engine/personaTurn.
  const enginesRef = useRef<PersonaEngines>({});
  const engineSeedRef = useRef(Date.now() >>> 0);
  // Lets in-flight async sequences (greeting, typewriter) stop after unmount.
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // Theme switches play the sound pack's theme-change sound (not on first render).
  const lastThemeRef = useRef(currentTheme);
  useEffect(() => {
    if (lastThemeRef.current === currentTheme) return;
    lastThemeRef.current = currentTheme;
    void playSoundPackEvent('theme-change');
  }, [currentTheme]);

  // Keep the newest line in view (messages changes on every typed character).
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  
  const handleNameSubmit = async () => {
    const name = nameInput.trim().toUpperCase();
    if (!name || isPreparingGreeting) return;

    // The submit is a user gesture, so this is when audio may be unlocked.
    void ensureAudioReady();
    setIsPreparingGreeting(true);

    const lines = personaGreeting(persona.id, persona.name, name);

    // One TTS request for the whole greeting stays well inside rate limits.
    // Any failure degrades to a text-only session rather than blocking it.
    // JOSHUA's LOGON prompt is printed, never spoken.
    const spokenGreeting = characterId === 'joshua' ? '' : lines.filter((line) => line.trim()).join('. ');
    const audio = await (spokenGreeting ? synthesizeSpeech(spokenGreeting, characterId, speechOptions) : Promise.resolve('')).catch(
      (error) => {
        console.warn('Greeting speech unavailable; continuing text-only:', error);
        return '';
      },
    );
    if (unmountedRef.current) return;

    setIsPreparingGreeting(false);
    setUserName(name);
    setIsGreeting(true);
    void playSoundPackEvent('startup');

    // Speak while the lines appear; input unlocks once both have finished.
    const spoken = speech.speak(audio, lines.filter((l) => l.trim()).join(' '), { processing: voiceProcessing }).catch((error) => console.warn('Greeting audio failed:', error));
    for (const line of lines) {
      if (unmountedRef.current) return;
      setMessages((prev) => [...prev, { author: 'dr', text: line, timestamp: Date.now(), characterId }]);
      await sleep(GREETING_LINE_DELAY_MS);
    }
    await spoken;
    if (unmountedRef.current) return;
    setIsGreeting(false);
    setIsLoading(false);
  };

  /**
   * One conversational turn: get the reply, type it out, then speak it.
   * Returns false if no reply was produced. A speech or playback failure never
   * removes a reply the user has already read.
   */
  const sendMessage = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed || busyRef.current) return false;
    busyRef.current = true;
    setIsLoading(true);
    void ensureAudioReady();

    soundEffects.playSound('message-send');
    void playSoundPackEvent('message-send');
    setMessages((prev) => [...prev, { author: 'user', text: trimmed, timestamp: Date.now(), characterId }]);

    // Personas with a local engine decide the turn first (engine/personaTurn).
    const turn = personaTurn(characterId, enginesRef.current, trimmed, {
      userName: userName ?? '',
      seed: engineSeedRef.current,
    });
    enginesRef.current = turn.engines;
    const plan = turn.plan;

    try {
      if (plan.kind === 'ignore') return false;
      let reply: string;
      try {
        if (plan.kind === 'local') {
          reply = plan.lines.join('\n');
        } else if (plan.kind === 'model') {
          const options = plan.customCharacter ? { customCharacter: plan.customCharacter } : {};
          reply = plan.finalize(await getAIResponse(plan.message, plan.historyKey, options).catch((error: unknown) => {
            if (plan.fallback) return plan.fallback;
            throw error;
          }));
        } else {
          reply = formatReply(await getAIResponse(trimmed, characterId, chatOptions));
        }
      } catch (error) {
        console.error('Reply failed:', error);
        soundEffects.playSound('error');
        void playSoundPackEvent('error');
        const ctx = getSharedAudioContext();
        if (ctx) playErrorBeep(ctx);
        setMessages((prev) => [
          ...prev,
          { author: 'dr', text: retroErrorMessage(error), timestamp: Date.now(), characterId },
        ]);
        return false;
      }

      if (GLITCH_PHRASES.some((phrase) => reply.includes(phrase))) {
        const ctx = getSharedAudioContext();
        if (ctx) playGlitchSound(ctx);
        void playSoundPackEvent('glitch');
      }

      // What is spoken can differ from what is shown (JOSHUA's boards and lists).
      const spokenText = plan.kind === 'local' ? plan.speak : reply;
      // Synthesis runs while the reply is typed out.
      const audioPromise = (mutedRef.current || !spokenText.trim() ? Promise.resolve('') : synthesizeSpeech(spokenText, characterId, speechOptions)).catch((error) => {
        console.warn('Reply speech unavailable; continuing text-only:', error);
        return '';
      });

      setMessages((prev) => [...prev, { author: 'dr', text: '', timestamp: Date.now(), characterId }]);
      // Long printouts (JOSHUA's self-play lesson) scroll at terminal speed.
      const typingDelay = reply.length > LONG_PRINTOUT_CHARS ? FAST_TYPING_DELAY_MS : TYPING_DELAY_MS;
      for (let i = 0; i < reply.length; i++) {
        await sleep(typingDelay);
        if (unmountedRef.current) return true;
        // Set the visible prefix rather than appending: the updater must be
        // pure, because React StrictMode invokes it twice.
        const visible = reply.slice(0, i + 1);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: visible }];
        });
      }

      try {
        await speech.speak(await audioPromise, spokenText, { processing: voiceProcessing });
      } catch (error) {
        console.warn('Reply audio could not be played; the text is kept:', error);
      }

      soundEffects.playSound('message-receive');
      void playSoundPackEvent('message-receive');
      // The log itself is not a live region (it would re-announce every typed
      // character), so the finished reply is announced once here.
      if (accessibilitySettings.announceMessages) {
        announce(`${persona.name} says: ${reply}`);
      }
      return true;
    } finally {
      busyRef.current = false;
      if (!unmountedRef.current) setIsLoading(false);
    }
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) speech.stop();
    announce(next ? 'Speech muted' : 'Speech unmuted');
  };

  const clearConversation = () => {
    setMessages([]);
    setUserInput('');
    resetChat(characterId); // the model forgets too, as the greeting promises
    if (characterId === 'parry') resetChat('parry-engine');
    enginesRef.current = resetPersona(enginesRef.current, characterId);
  };

  /**
   * Switches persona mid-conversation. Each persona keeps its own model
   * history (services/geminiService.ts); the log shows where the switch
   * happened.
   */
  const switchPersona = (id: string) => {
    const next = personaState.personas.find((p) => p.id === id);
    if (!next || next.id === persona.id) return;
    personaState.selectPersona(id);
    void playSoundPackEvent('character-switch');
    if (userName) {
      setMessages((prev) => [
        ...prev,
        { author: 'dr', text: `--- NOW TALKING TO ${next.name.toUpperCase()} ---`, timestamp: Date.now(), characterId: id },
        // A persona with its own opener (JOSHUA's LOGON:) shows it on arrival.
        ...(hasStarted(enginesRef.current, id) ? [] : (personaOpening(id) ?? [])).map((text) => ({ author: 'dr' as const, text, timestamp: Date.now(), characterId: id })),
      ]);
    }
    announce(`Now talking to ${next.name}`);
  };

  const handleUserInput = () => {
    if (!userInput.trim() || busyRef.current) return;
    const text = userInput;
    setUserInput('');
    void sendMessage(text);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Play keypress sound (v1.9.0)
    soundEffects.playSound('keypress');

    if (event.key === 'Enter') {
      handleUserInput();
    }
  };

  // Handle voice transcript (v1.11.0)
  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (transcript.trim()) {
      setUserInput(prev => prev + (prev ? ' ' : '') + transcript.trim());
      announce(`Voice input: ${transcript}`);
    }
  }, [announce]);

  // Handle template selection (v1.11.0): each prompt is a normal turn, with
  // typing, speech and the busy guard, instead of a parallel side channel.
  const handleSelectTemplate = async (prompts: string[]) => {
    if (prompts.length === 0 || !userName) return;
    announce('Applying conversation template');
    for (const prompt of prompts) {
      const ok = await sendMessage(prompt);
      if (!ok || unmountedRef.current) {
        announce('Template stopped');
        break;
      }
      await sleep(1000);
    }
  };

  const cycleAudioMode = () => {
    const currentIndex = AUDIO_MODES.findIndex(m => m.id === audioMode);
    const next = AUDIO_MODES[(currentIndex + 1) % AUDIO_MODES.length];
    setAudioMode(next.id);
    announce(`Audio mode changed to ${next.name}`);
  };

  // Global keyboard shortcuts: Alt+Shift+<key>, defined in utils/shortcuts.ts.
  const onShortcut = useEffectEvent((e: KeyboardEvent) => {
    const id = matchShortcut(e);
    if (!id) return;
    e.preventDefault();
    const actions: Record<ShortcutId, () => void> = {
      accessibility: () => setShowAccessibilityPanel(true),
      cycleAudioMode,
      insights: () => setShowInsights(prev => !prev),
      tutorial: () => setShowOnboarding(true),
      soundSettings: () => setShowSoundSettings(true),
      musicPlayer: () => setShowMusicPlayer(prev => !prev),
      soundPacks: () => setShowSoundPackManager(true),
      voiceInput: () => setShowVoiceInput(prev => !prev),
      emotionViz: () => setShowEmotionViz(prev => !prev),
      topicDiagram: () => setShowTopicDiagram(prev => !prev),
      templates: () => setShowTemplates(true),
      switchMode: () => {}, // handled by App
    };
    actions[id]();
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => onShortcut(e);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (!userName) {
    return (
      <>
        <SkipNav />
        <main
          id="main-content"
          className="bg-(--color-background) text-(--color-text) font-mono w-full h-dvh flex flex-col items-center justify-center p-4"
          role="main"
          aria-label="Dr. Sbaitso name entry screen"
        >
          <div className="w-full max-w-md text-center">
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
                    className="bg-transparent border-none text-yellow-300 w-3/4 focus:outline-hidden placeholder-gray-500 text-center"
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
        className="bg-(--color-background) text-(--color-text) font-mono w-full h-dvh flex flex-col p-2 sm:p-4 overflow-hidden"
        role="main"
      >
        <div className="w-full max-w-4xl mx-auto flex flex-col grow border-2 border-(--color-border) p-4 min-h-0">
          {/* Header: persona and tool menus */}
          <header className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 pb-2 border-b-2 border-(--color-border)">
            <div className="flex items-center gap-2 min-w-0" data-tour-id="character-selection">
              <label htmlFor="persona-select" className="text-sm font-bold">
                PERSONA:
              </label>
              <select
                id="persona-select"
                value={persona.id}
                onChange={(e) => switchPersona(e.target.value)}
                disabled={isLoading && !!userName}
                className="enh-select font-bold"
                title={persona.description}
              >
                <optgroup label="Classic programs">
                  {personaState.personas.filter((p) => !p.isCustom).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                {personaState.customCharacters.length > 0 && (
                  <optgroup label="Your characters">
                    {personaState.personas.filter((p) => p.isCustom).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <span className="hidden md:inline text-xs opacity-75 truncate max-w-xs" title={persona.description}>
                {persona.description}
              </span>
            </div>

            <nav aria-label="Tools" className="flex flex-wrap items-center gap-2 ml-auto" data-tour-id="settings-panel">
              <span data-tour-id="session-panel">
                <MenuGroup
                  label="CONVERSATION"
                  items={[
                    { id: 'search', icon: '🔍', label: 'Search and replay', onSelect: () => setShowConversationSearch(true) },
                    { id: 'export', icon: '📦', label: 'Export', onSelect: () => setShowAdvancedExport(true) },
                    { id: 'templates', icon: '📝', label: 'Templates', shortcut: shortcutLabel('templates'), onSelect: () => setShowTemplates(true) },
                    { id: 'insights', icon: '📈', label: 'Insights', shortcut: shortcutLabel('insights'), onSelect: () => setShowInsights(true) },
                    { id: 'clear', icon: '🧹', label: 'Clear conversation', onSelect: clearConversation },
                  ]}
                />
              </span>
              <MenuGroup
                label="VISUALS"
                items={[
                  { id: 'emotions', icon: '😊', label: 'Emotion visualizer', shortcut: shortcutLabel('emotionViz'), active: showEmotionViz, onSelect: () => setShowEmotionViz(v => !v) },
                  { id: 'topics', icon: '🔀', label: 'Topic diagram', shortcut: shortcutLabel('topicDiagram'), active: showTopicDiagram, onSelect: () => setShowTopicDiagram(v => !v) },
                  { id: 'audioviz', icon: '📊', label: 'Audio visualizer', active: showAudioVisualizer, onSelect: () => setShowAudioVisualizer(v => !v) },
                ]}
              />
              <MenuGroup
                label="SOUND"
                items={[
                  { id: 'voice-input', icon: '🗣️', label: 'Voice input', shortcut: shortcutLabel('voiceInput'), active: showVoiceInput, onSelect: () => setShowVoiceInput(v => !v) },
                  { id: 'hands-free', icon: '🎤', label: 'Hands-free voice control', active: voiceControl.isHandsFreeMode, disabled: !voiceControl.isSupported, onSelect: () => voiceControl.toggleHandsFreeMode() },
                  { id: 'mute', icon: muted ? '🔇' : '🔈', label: muted ? 'Unmute speech' : 'Mute speech', active: muted, onSelect: toggleMute },
                  { id: 'music', icon: '🎵', label: 'Music player', shortcut: shortcutLabel('musicPlayer'), active: showMusicPlayer, onSelect: () => setShowMusicPlayer(v => !v) },
                  { id: 'packs', icon: '🎼', label: 'Sound packs', shortcut: shortcutLabel('soundPacks'), onSelect: () => setShowSoundPackManager(true) },
                  { id: 'sound-settings', icon: '🔊', label: 'Sound settings', shortcut: shortcutLabel('soundSettings'), onSelect: () => setShowSoundSettings(true) },
                ]}
              />
              <span data-tour-id="theme-button">
                <MenuGroup
                  label="SETTINGS"
                  items={[
                    { id: 'theme', icon: '🎨', label: 'Theme customizer', onSelect: () => setShowThemeCustomizer(true) },
                    { id: 'characters', icon: '🎭', label: 'Character creator', onSelect: () => setShowCharacterCreator(true) },
                    { id: 'a11y', icon: '♿', label: 'Accessibility', shortcut: shortcutLabel('accessibility'), onSelect: () => setShowAccessibilityPanel(true) },
                    { id: 'voice-help', icon: '❔', label: 'Voice commands', onSelect: () => setShowVoiceControlHelp(true) },
                    { id: 'cloud-sync', icon: '☁️', label: 'Cloud sync', onSelect: () => setShowCloudSync(true) },
                    { id: 'tutorial', icon: '🎓', label: 'Tutorial', shortcut: shortcutLabel('tutorial'), onSelect: () => setShowOnboarding(true) },
                  ]}
                />
              </span>
              {onSwitchMode && (
                <button
                  type="button"
                  onClick={onSwitchMode}
                  className="enh-menu-trigger"
                  title={`Switch to the classic screen (${shortcutLabel('switchMode')})`}
                >
                  CLASSIC
                </button>
              )}
            </nav>
          </header>

          {/* Voice Control Indicator (v1.6.0) */}
          {voiceControl.isHandsFreeMode && (
            <div className="mt-2 p-2 border-2 border-green-400 bg-green-900/30">
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
                <div className="mt-2 p-2 bg-yellow-900/50 border border-yellow-400">
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
                    ? `${personaState.personas.find((p) => p.id === msg.characterId)?.name ?? persona.name}: `
                    : 'You: '}
                </span>
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
          <div className="shrink-0 flex items-center gap-2 mt-3 border-t-2 border-(--color-border) pt-3" data-tour-id="chat-input">
            <span className="text-(--color-accent)" aria-hidden="true">{'>'}</span>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="bg-transparent border-none text-(--color-accent) w-full focus:outline-hidden placeholder-gray-500"
              placeholder={isLoading ? '' : 'TYPE HERE AND PRESS ENTER...'}
              aria-label="Enter your message"
              aria-describedby="chat-input-help"
            />
            <span id="chat-input-help" className="sr-only">
              Type your message and press Enter to send it to {persona.name}
            </span>
            <button
              type="button"
              onClick={() => setShowVoiceInput(v => !v)}
              className="enh-icon-button"
              data-tour-id="voice-input"
              aria-label="Speak instead of typing"
              aria-pressed={showVoiceInput}
              title={`Voice input (${shortcutLabel('voiceInput')})`}
            >
              <span aria-hidden="true">🎤</span>
            </button>
            <button
              type="button"
              onClick={handleUserInput}
              disabled={isLoading || !userInput.trim()}
              className="enh-send-button"
            >
              SEND
            </button>
          </div>

          {/* Status bar: persistent display and privacy settings */}
          <footer className="shrink-0 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" data-tour-id="audio-settings">
            <label className="flex items-center gap-1">
              AUDIO
              <select
                id="audio-mode-select"
                value={audioMode}
                onChange={(e) => setAudioMode(e.target.value as typeof audioMode)}
                className="enh-select"
                aria-label="Audio quality mode"
                title={AUDIO_MODES.find(m => m.id === audioMode)?.description || ''}
              >
                {AUDIO_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>{mode.name}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1">
              THEME
              <select
                id="theme-select"
                value={currentTheme}
                onChange={(e) => themeChoice.selectTheme(e.target.value)}
                className="enh-select"
                aria-label="Colour theme"
              >
                {themeChoice.themes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label
              className="flex items-center gap-1"
              title="Off by default: memory contents are wiped when you leave. Turn on to keep sessions in this browser for search, replay and insights."
            >
              <input
                type="checkbox"
                checked={keepHistory}
                onChange={(e) => setKeepHistory(e.target.checked)}
                className="accent-(--color-accent)"
              />
              SAVE HISTORY
            </label>
            {muted && <span aria-live="polite">SPEECH MUTED</span>}
            <span className="ml-auto opacity-60 hidden sm:inline">
              {shortcutLabel('switchMode')} classic screen
            </span>
          </footer>
        </div>
      </main>

      {/* Accessibility Panel (v1.4.0) */}
      {showAccessibilityPanel && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
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
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <ThemeCustomizer
            isOpen={showThemeCustomizer}
            onClose={() => setShowThemeCustomizer(false)}
            onSave={(theme) => {
              themeChoice.addCustomTheme(theme);
              setShowThemeCustomizer(false);
            }}
          />
        </Suspense>
      )}

      {/* Conversation Search (v1.5.0) */}
      {showConversationSearch && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
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
              audioContext={getSharedAudioContext()}
              audioSource={speech.currentSource}
              isPlaying={speech.isPlaying}
            />
          </div>
        </Suspense>
      )}

      {/* Advanced Exporter (v1.6.0) */}
      {showAdvancedExport && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AdvancedExporter
            isOpen={showAdvancedExport}
            onClose={() => setShowAdvancedExport(false)}
            sessions={savedSessions}
            themes={themeChoice.customThemes}
            currentSession={currentSession ?? undefined}
          />
        </Suspense>
      )}

      {/* Character Creator (v1.6.0) */}
      {showCharacterCreator && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <CharacterCreator
            isOpen={showCharacterCreator}
            onClose={() => setShowCharacterCreator(false)}
            onSave={(character) => personaState.saveCustomCharacter(character)}
            onDelete={(id) => personaState.deleteCustomCharacter(id)}
            existingCharacters={personaState.customCharacters}
          />
        </Suspense>
      )}

      {/* Conversation Replay (v1.6.0) */}
      {showConversationReplay && replaySession && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
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
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading tutorial...</div></div>}>
          <OnboardingTutorial
            onComplete={() => setShowOnboarding(false)}
            onSkip={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}

      {/* Conversation Insights (v1.8.0) */}
      {showInsights && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading insights...</div></div>}>
          <ConversationInsights
            onClose={() => setShowInsights(false)}
            currentTheme={currentTheme}
          />
        </Suspense>
      )}

      {/* Sound Settings Panel (v1.9.0) */}
      {showSoundSettings && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading sound settings...</div></div>}>
          <SoundSettingsPanel
            isOpen={showSoundSettings}
            onClose={() => setShowSoundSettings(false)}
          />
        </Suspense>
      )}

      {/* Music Player (v1.10.0) */}
      {showMusicPlayer && userName && (
        <Suspense fallback={<div className="fixed bottom-4 left-4 z-40 text-white text-sm">Loading music player...</div>}>
          <div className="fixed bottom-4 left-4 z-40">
            <MusicPlayer
              theme={activeTheme}
              audioContext={getSharedAudioContext()}
            />
          </div>
        </Suspense>
      )}

      {/* PWA Install Prompt (v1.10.0) */}
      {installPrompt.canInstall && (
        <Suspense fallback={null}>
          <InstallPrompt
            onInstall={installPrompt.install}
            onDismiss={installPrompt.dismiss}
            theme={activeTheme}
          />
        </Suspense>
      )}

      {/* Sound Pack Manager (v1.10.0) */}
      {showSoundPackManager && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading sound pack manager...</div></div>}>
          <SoundPackManager
            theme={activeTheme}
            onClose={() => setShowSoundPackManager(false)}
            onCreateNew={() => {
              setShowSoundPackManager(false);
              setShowSoundPackCreator(true);
            }}
          />
        </Suspense>
      )}

      {/* Sound Pack Creator (v1.10.0) */}
      {showSoundPackCreator && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading sound pack creator...</div></div>}>
          <SoundPackCreator
            theme={activeTheme}
            onClose={() => setShowSoundPackCreator(false)}
            onSave={async (pack) => {
              // Packs live in IndexedDB (decoded audio can exceed localStorage
              // quota). A failure propagates: the creator shows it and stays open.
              await saveSoundPack(pack);
              announce(`Sound pack "${pack.metadata.name}" created successfully`);
            }}
          />
        </Suspense>
      )}

      {/* Cloud sync: uploads only saved history, so nothing leaves the browser while SAVE HISTORY is off. */}
      {showCloudSync && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading cloud sync...</div></div>}>
          <CloudSyncPanel
            onClose={() => setShowCloudSync(false)}
            getLocalData={() => ({
              sessions: savedSessions,
              updatedAt: savedSessions.reduce((latest, s) => Math.max(latest, s.updatedAt), 0),
            })}
            onRemoteData={(data) => {
              const merged = mergeSessions(data.sessions ?? []);
              if (merged > 0) announce(`${merged} conversation${merged === 1 ? '' : 's'} restored from the cloud`);
            }}
          />
        </Suspense>
      )}

      {/* Voice Control Help Modal (v1.6.0) */}
      {showVoiceControlHelp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div
            ref={voiceHelpRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-help-title"
            onKeyDown={(e) => e.key === 'Escape' && setShowVoiceControlHelp(false)}
            className="bg-blue-900 border-4 border-gray-400 p-6 max-w-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id="voice-help-title" className="text-2xl font-bold text-white">VOICE CONTROL COMMANDS</h2>
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
                className="px-4 py-2 border-2 border-gray-400 hover:border-yellow-300 focus:outline-hidden focus:ring-2 focus:ring-yellow-300"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Input Panel (v1.11.0 - Option C1) */}
      {showVoiceInput && userName && (
        <Suspense fallback={<div className="fixed bottom-20 left-4 z-40 text-white text-sm">Loading voice input...</div>}>
          <div className="fixed bottom-20 left-4 z-40 max-w-md">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onError={(error) => {
                console.error('[VoiceInput Error]', error);
                announce(`Voice input error: ${error}`);
              }}
              isEnabled={true}
              language="en-US"
              continuous={false}
            />
          </div>
        </Suspense>
      )}

      {/* Emotion Visualizer (v1.11.0 - Option C2) */}
      {showEmotionViz && userName && (
        <Suspense fallback={<div className="fixed bottom-20 right-4 z-40 text-white text-sm">Loading emotion visualizer...</div>}>
          <div className="fixed bottom-20 right-4 z-40 max-w-sm">
            <EmotionVisualizer
              messages={messages}
              theme={activeTheme}
              maxHistory={10}
            />
          </div>
        </Suspense>
      )}

      {/* Topic Flow Diagram (v1.11.0 - Option C3) */}
      {showTopicDiagram && userName && (
        <Suspense fallback={<div className="fixed top-20 left-4 z-40 text-white text-sm">Loading topic diagram...</div>}>
          <div className="fixed top-20 left-4 z-40 max-w-2xl">
            <TopicFlowDiagram
              messages={messages}
              theme={activeTheme}
            />
          </div>
        </Suspense>
      )}

      {/* Conversation Templates (v1.11.0 - Option C4) */}
      {showTemplates && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading templates...</div></div>}>
          <ConversationTemplates
            isOpen={showTemplates}
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={handleSelectTemplate}
            theme={activeTheme}
          />
        </Suspense>
      )}
    </>
  );
}