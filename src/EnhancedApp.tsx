import React, { useState, useEffect, useEffectEvent, useRef, lazy, Suspense } from 'react';
import { getSharedAudioContext } from './utils/sharedAudio';
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
import { useSessionHistory } from './hooks/useSessionHistory';
import { useThemeChoice } from './hooks/useThemeChoice';
import { usePersona } from './hooks/usePersona';
import { matchShortcut, shortcutLabel, type ShortcutId } from './utils/shortcuts';
import { useSoundEffects } from './hooks/useSoundEffects';
import { usePanels } from './hooks/usePanels';
import { useChatPipeline } from './hooks/useChatPipeline';
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

/** The modern UI: toolbar, panels, personas and extras ("Enhanced" mode). */
export default function EnhancedApp({ onSwitchMode }: { onSwitchMode?: () => void } = {}) {
  // The active persona (built-in or custom), chosen in the toolbar.
  const personaState = usePersona();
  const { persona } = personaState;
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

  // Open/closed state of every panel and dialog (hooks/usePanels).
  const panels = usePanels();
  const { open: panelOpen, setPanel } = panels;
  // Selected colour theme (built-in or custom), persisted and applied.
  const themeChoice = useThemeChoice();
  const currentTheme = themeChoice.theme.id;
  const activeTheme = themeChoice.theme;

  // Sound Effects (v1.9.0)
  const soundEffects = useSoundEffects();

  // Name entry, greeting and the turn pipeline (hooks/useChatPipeline).
  const chat = useChatPipeline({
    personaState,
    speech,
    mutedRef,
    soundEffects,
    announce,
    announceMessages: accessibilitySettings.announceMessages,
  });
  const {
    userName,
    nameInput,
    setNameInput,
    messages,
    userInput,
    setUserInput,
    isLoading,
    isGreeting,
    isPreparingGreeting,
    handleNameSubmit,
    clearConversation,
    switchPersona,
    handleUserInput,
    handleKeyDown,
    handleVoiceTranscript,
    handleSelectTemplate,
  } = chat;

  // Conversation history is opt-in (the greeting promises memory is wiped).
  const { keepHistory, setKeepHistory, currentSession, savedSessions, mergeSessions } = useSessionHistory(messages, {
    characterId,
    themeId: currentTheme,
    audioQualityId: audioMode,
  });

  // Keeps keyboard focus inside the voice-help dialog while it is open.
  const voiceHelpRef = useFocusTrap(panelOpen.voiceControlHelp);

  // PWA install banner: only offered when the browser supports installing.
  const installPrompt = useInstallPrompt();

  // Voice Control (v1.6.0)
  const voiceControl = useVoiceControl({
    enabled: true,
    wakeWordEnabled: true,
    handsFreeModeEnabled: false,
    confirmDestructiveCommands: true,
    onClear: () => clearConversation(),
    onExport: () => setPanel('advancedExport', true),
    onSwitchCharacter: (id) => switchPersona(id),
    onToggleMute: () => toggleMute(),
    onToggleSettings: () => setPanel('soundSettings', prev => !prev),
    onToggleStats: () => setPanel('conversationSearch', true),
    onStopAudio: () => speech.stop(),
    onCycleTheme: () => themeChoice.cycleTheme(),
    onCycleAudioQuality: () => cycleAudioMode(),
    onOpenAccessibility: () => setPanel('accessibility', true),
    onOpenSearch: () => setPanel('conversationSearch', true),
    onOpenVisualizer: () => setPanel('audioVisualizer', !panelOpen.audioVisualizer),
    onToggleMusic: () => setPanel('musicPlayer', prev => !prev),
    onOpenSoundPacks: () => setPanel('soundPackManager', true),
    onHelp: () => {
      setPanel('voiceControlHelp', true);
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) speech.stop();
    announce(next ? 'Speech muted' : 'Speech unmuted');
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
      accessibility: () => setPanel('accessibility', true),
      cycleAudioMode,
      insights: () => setPanel('insights', prev => !prev),
      tutorial: () => setPanel('onboarding', true),
      soundSettings: () => setPanel('soundSettings', true),
      musicPlayer: () => setPanel('musicPlayer', prev => !prev),
      soundPacks: () => setPanel('soundPackManager', true),
      voiceInput: () => setPanel('voiceInput', prev => !prev),
      emotionViz: () => setPanel('emotionViz', prev => !prev),
      topicDiagram: () => setPanel('topicDiagram', prev => !prev),
      templates: () => setPanel('templates', true),
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
          {/* z-50: the menus stay above the floating panels (z-40), which they toggle. */}
          <header className="relative z-50 shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 pb-2 border-b-2 border-(--color-border)">
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
                    { id: 'search', icon: '🔍', label: 'Search and replay', onSelect: () => setPanel('conversationSearch', true) },
                    { id: 'export', icon: '📦', label: 'Export', onSelect: () => setPanel('advancedExport', true) },
                    { id: 'templates', icon: '📝', label: 'Templates', shortcut: shortcutLabel('templates'), onSelect: () => setPanel('templates', true) },
                    { id: 'insights', icon: '📈', label: 'Insights', shortcut: shortcutLabel('insights'), onSelect: () => setPanel('insights', true) },
                    { id: 'clear', icon: '🧹', label: 'Clear conversation', onSelect: clearConversation },
                  ]}
                />
              </span>
              <MenuGroup
                label="VISUALS"
                items={[
                  { id: 'emotions', icon: '😊', label: 'Emotion visualizer', shortcut: shortcutLabel('emotionViz'), active: panelOpen.emotionViz, onSelect: () => setPanel('emotionViz', v => !v) },
                  { id: 'topics', icon: '🔀', label: 'Topic diagram', shortcut: shortcutLabel('topicDiagram'), active: panelOpen.topicDiagram, onSelect: () => setPanel('topicDiagram', v => !v) },
                  { id: 'audioviz', icon: '📊', label: 'Audio visualizer', active: panelOpen.audioVisualizer, onSelect: () => setPanel('audioVisualizer', v => !v) },
                ]}
              />
              <MenuGroup
                label="SOUND"
                items={[
                  { id: 'voice-input', icon: '🗣️', label: 'Voice input', shortcut: shortcutLabel('voiceInput'), active: panelOpen.voiceInput, onSelect: () => setPanel('voiceInput', v => !v) },
                  { id: 'hands-free', icon: '🎤', label: 'Hands-free voice control', active: voiceControl.isHandsFreeMode, disabled: !voiceControl.isSupported, onSelect: () => voiceControl.toggleHandsFreeMode() },
                  { id: 'mute', icon: muted ? '🔇' : '🔈', label: muted ? 'Unmute speech' : 'Mute speech', active: muted, onSelect: toggleMute },
                  { id: 'music', icon: '🎵', label: 'Music player', shortcut: shortcutLabel('musicPlayer'), active: panelOpen.musicPlayer, onSelect: () => setPanel('musicPlayer', v => !v) },
                  { id: 'packs', icon: '🎼', label: 'Sound packs', shortcut: shortcutLabel('soundPacks'), onSelect: () => setPanel('soundPackManager', true) },
                  { id: 'sound-settings', icon: '🔊', label: 'Sound settings', shortcut: shortcutLabel('soundSettings'), onSelect: () => setPanel('soundSettings', true) },
                ]}
              />
              <span data-tour-id="theme-button">
                <MenuGroup
                  label="SETTINGS"
                  items={[
                    { id: 'theme', icon: '🎨', label: 'Theme customizer', onSelect: () => setPanel('themeCustomizer', true) },
                    { id: 'characters', icon: '🎭', label: 'Character creator', onSelect: () => setPanel('characterCreator', true) },
                    { id: 'a11y', icon: '♿', label: 'Accessibility', shortcut: shortcutLabel('accessibility'), onSelect: () => setPanel('accessibility', true) },
                    { id: 'voice-help', icon: '❔', label: 'Voice commands', onSelect: () => setPanel('voiceControlHelp', true) },
                    { id: 'cloud-sync', icon: '☁️', label: 'Cloud sync', onSelect: () => setPanel('cloudSync', true) },
                    { id: 'tutorial', icon: '🎓', label: 'Tutorial', shortcut: shortcutLabel('tutorial'), onSelect: () => setPanel('onboarding', true) },
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
                  onClick={() => setPanel('voiceControlHelp', true)}
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
              onClick={() => setPanel('voiceInput', v => !v)}
              className="enh-icon-button"
              data-tour-id="voice-input"
              aria-label="Speak instead of typing"
              aria-pressed={panelOpen.voiceInput}
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
      {panelOpen.accessibility && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AccessibilityPanel
            isOpen={panelOpen.accessibility}
            settings={accessibilitySettings}
            onClose={() => setPanel('accessibility', false)}
            onUpdateSetting={updateSetting}
            onResetSettings={resetSettings}
          />
        </Suspense>
      )}

      {/* Theme Customizer (v1.5.0) */}
      {panelOpen.themeCustomizer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <ThemeCustomizer
            isOpen={panelOpen.themeCustomizer}
            onClose={() => setPanel('themeCustomizer', false)}
            onSave={(theme) => {
              themeChoice.addCustomTheme(theme);
              setPanel('themeCustomizer', false);
            }}
          />
        </Suspense>
      )}

      {/* Conversation Search (v1.5.0) */}
      {panelOpen.conversationSearch && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <ConversationSearch
            isOpen={panelOpen.conversationSearch}
            onClose={() => setPanel('conversationSearch', false)}
            sessions={savedSessions}
            onOpenSession={(sessionId) => {
              console.log('Opening session:', sessionId);
              // Find the session and trigger replay
              const session = savedSessions.find(s => s.id === sessionId);
              if (session) panels.openReplay(session);
            }}
          />
        </Suspense>
      )}

      {/* Audio Visualizer (v1.5.0) */}
      {panelOpen.audioVisualizer && (
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
      {panelOpen.advancedExport && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AdvancedExporter
            isOpen={panelOpen.advancedExport}
            onClose={() => setPanel('advancedExport', false)}
            sessions={savedSessions}
            themes={themeChoice.customThemes}
            currentSession={currentSession ?? undefined}
          />
        </Suspense>
      )}

      {/* Character Creator (v1.6.0) */}
      {panelOpen.characterCreator && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <CharacterCreator
            isOpen={panelOpen.characterCreator}
            onClose={() => setPanel('characterCreator', false)}
            onSave={(character) => personaState.saveCustomCharacter(character)}
            onDelete={(id) => personaState.deleteCustomCharacter(id)}
            existingCharacters={personaState.customCharacters}
          />
        </Suspense>
      )}

      {/* Conversation Replay (v1.6.0) */}
      {panelOpen.conversationReplay && panels.replaySession && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <ConversationReplay
            isOpen={panelOpen.conversationReplay}
            onClose={panels.closeReplay}
            session={panels.replaySession}
          />
        </Suspense>
      )}

      {/* Onboarding Tutorial (v1.8.0) */}
      {panelOpen.onboarding && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading tutorial...</div></div>}>
          <OnboardingTutorial
            onComplete={() => setPanel('onboarding', false)}
            onSkip={() => setPanel('onboarding', false)}
          />
        </Suspense>
      )}

      {/* Conversation Insights (v1.8.0) */}
      {panelOpen.insights && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading insights...</div></div>}>
          <ConversationInsights
            onClose={() => setPanel('insights', false)}
            currentTheme={currentTheme}
          />
        </Suspense>
      )}

      {/* Sound Settings Panel (v1.9.0) */}
      {panelOpen.soundSettings && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading sound settings...</div></div>}>
          <SoundSettingsPanel
            isOpen={panelOpen.soundSettings}
            onClose={() => setPanel('soundSettings', false)}
          />
        </Suspense>
      )}

      {/* Music Player (v1.10.0) */}
      {panelOpen.musicPlayer && userName && (
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
      {panelOpen.soundPackManager && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading sound pack manager...</div></div>}>
          <SoundPackManager
            theme={activeTheme}
            onClose={() => setPanel('soundPackManager', false)}
            onCreateNew={() => {
              setPanel('soundPackManager', false);
              setPanel('soundPackCreator', true);
            }}
          />
        </Suspense>
      )}

      {/* Sound Pack Creator (v1.10.0) */}
      {panelOpen.soundPackCreator && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading sound pack creator...</div></div>}>
          <SoundPackCreator
            theme={activeTheme}
            onClose={() => setPanel('soundPackCreator', false)}
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
      {panelOpen.cloudSync && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading cloud sync...</div></div>}>
          <CloudSyncPanel
            onClose={() => setPanel('cloudSync', false)}
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
      {panelOpen.voiceControlHelp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div
            ref={voiceHelpRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-help-title"
            onKeyDown={(e) => e.key === 'Escape' && setPanel('voiceControlHelp', false)}
            className="bg-blue-900 border-4 border-gray-400 p-6 max-w-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id="voice-help-title" className="text-2xl font-bold text-white">VOICE CONTROL COMMANDS</h2>
              <button
                onClick={() => setPanel('voiceControlHelp', false)}
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
                onClick={() => setPanel('voiceControlHelp', false)}
                className="px-4 py-2 border-2 border-gray-400 hover:border-yellow-300 focus:outline-hidden focus:ring-2 focus:ring-yellow-300"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Input Panel (v1.11.0 - Option C1) */}
      {panelOpen.voiceInput && userName && (
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
      {panelOpen.emotionViz && userName && (
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
      {panelOpen.topicDiagram && userName && (
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
      {panelOpen.templates && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Loading templates...</div></div>}>
          <ConversationTemplates
            isOpen={panelOpen.templates}
            onClose={() => setPanel('templates', false)}
            onSelectTemplate={handleSelectTemplate}
            theme={activeTheme}
          />
        </Suspense>
      )}
    </>
  );
}