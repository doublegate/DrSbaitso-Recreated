import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useState, useEffect, useRef } from 'react';
import { useSpeechPlayer } from './hooks/useSpeechPlayer';
import { AUDIO_MODES } from './constants';
import { useAccessibility } from './hooks/useAccessibility';
import { useScreenReader } from './hooks/useScreenReader';
import { useVoiceControl } from './hooks/useVoiceControl';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useFocusTrap } from './hooks/useFocusTrap';
import { playSoundPackEvent } from './utils/soundPackPlayer';
import { useSessionHistory } from './hooks/useSessionHistory';
import { useThemeChoice } from './hooks/useThemeChoice';
import { usePersona } from './hooks/usePersona';
import { useSoundEffects } from './hooks/useSoundEffects';
import { usePanels } from './hooks/usePanels';
import { useChatPipeline } from './hooks/useChatPipeline';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import SkipNav from './components/SkipNav';
import NameEntry from './components/enhanced/NameEntry';
import EnhancedHeader from './components/enhanced/EnhancedHeader';
import VoiceControlIndicator from './components/enhanced/VoiceControlIndicator';
import ChatLog from './components/enhanced/ChatLog';
import InputBar from './components/enhanced/InputBar';
import StatusBar from './components/enhanced/StatusBar';
import EnhancedPanels from './components/enhanced/EnhancedPanels';

/** The modern UI: toolbar, panels, personas and extras ("Enhanced" mode). */
export default function EnhancedApp({
  onSwitchMode,
  initialInput,
}: { onSwitchMode?: () => void; initialInput?: string | null } = {}) {
  // The active persona (built-in or custom), chosen in the toolbar.
  const online = useOnlineStatus();
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

  // Sound Effects (v1.9.0)
  const soundEffects = useSoundEffects();

  // Name entry, greeting and the turn pipeline (hooks/useChatPipeline).
  const chat = useChatPipeline({
    initialInput,
    personaState,
    speech,
    mutedRef,
    soundEffects,
    announce,
    announceMessages: accessibilitySettings.announceMessages,
  });
  const { userName, messages, isLoading, isGreeting, isPreparingGreeting } = chat;

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
    onClear: () => chat.clearConversation(),
    onExport: () => setPanel('advancedExport', true),
    onSwitchCharacter: (id) => chat.switchPersona(id),
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

  // Focus targets: the name input, then the chat input.
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Theme switches play the sound pack's theme-change sound (not on first render).
  const lastThemeRef = useRef(currentTheme);
  useEffect(() => {
    if (lastThemeRef.current === currentTheme) return;
    lastThemeRef.current = currentTheme;
    void playSoundPackEvent('theme-change');
  }, [currentTheme]);

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
  useGlobalShortcuts({
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
  });

  if (!userName) {
    return (
      <>
        <SkipNav />
        <NameEntry
          value={chat.nameInput}
          onChange={chat.setNameInput}
          onSubmit={chat.handleNameSubmit}
          isPreparing={isPreparingGreeting}
          inputRef={nameInputRef}
        />
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
          <EnhancedHeader
            persona={persona}
            personas={personaState.personas}
            hasCustomCharacters={personaState.customCharacters.length > 0}
            onSwitchPersona={chat.switchPersona}
            personaDisabled={isLoading && !!userName}
            panels={panels}
            muted={muted}
            onToggleMute={toggleMute}
            onClearConversation={chat.clearConversation}
            handsFree={{
              active: voiceControl.isHandsFreeMode,
              supported: voiceControl.isSupported,
              toggle: () => voiceControl.toggleHandsFreeMode(),
            }}
            onSwitchMode={onSwitchMode}
          />

          {voiceControl.isHandsFreeMode && (
            <VoiceControlIndicator voiceControl={voiceControl} onShowHelp={() => setPanel('voiceControlHelp', true)} />
          )}

          <ChatLog messages={messages} personas={personaState.personas} persona={persona} typing={isLoading && !isGreeting} />

          <InputBar
            value={chat.userInput}
            onChange={chat.setUserInput}
            onKeyDown={chat.handleKeyDown}
            onSend={chat.handleUserInput}
            isLoading={isLoading}
            personaName={persona.name}
            voiceInputOpen={panelOpen.voiceInput}
            onToggleVoiceInput={() => setPanel('voiceInput', v => !v)}
            inputRef={inputRef}
          />

          <StatusBar
            audioMode={audioMode}
            onAudioModeChange={setAudioMode}
            themeId={currentTheme}
            themes={themeChoice.themes}
            onThemeChange={themeChoice.selectTheme}
            keepHistory={keepHistory}
            onKeepHistoryChange={setKeepHistory}
            muted={muted}
            voiceProfile={personaState.voiceProfile}
            onVoiceProfileChange={personaState.setVoiceProfile}
            showVoiceProfile={personaState.voiceProfileApplies}
            offline={!online}
          />
        </div>
      </main>

      <EnhancedPanels
        panels={panels}
        accessibility={{ settings: accessibilitySettings, updateSetting, resetSettings }}
        themeChoice={themeChoice}
        history={{ savedSessions, currentSession, mergeSessions }}
        personaState={personaState}
        speech={speech}
        installPrompt={installPrompt}
        voiceCommands={voiceControl.commands}
        voiceHelpRef={voiceHelpRef}
        messages={messages}
        announce={announce}
        onVoiceTranscript={chat.handleVoiceTranscript}
        onSelectTemplate={chat.handleSelectTemplate}
      />
    </>
  );
}