/**
 * The Enhanced-mode panels, dialogs and floating tools. Each is lazy-loaded
 * and mounted only while open (state: hooks/usePanels). Rendered only once
 * the session has started, after the main screen, in a fixed order.
 */
import { lazy, Suspense, type RefObject } from 'react';
import type { Message } from '../../types';
import type { Panels } from '../../hooks/usePanels';
import type { usePersona } from '../../hooks/usePersona';
import type { useAccessibility } from '../../hooks/useAccessibility';
import type { useThemeChoice } from '../../hooks/useThemeChoice';
import type { useSessionHistory } from '../../hooks/useSessionHistory';
import type { useSpeechPlayer } from '../../hooks/useSpeechPlayer';
import type { useInstallPrompt } from '../../hooks/useInstallPrompt';
import type { VoiceCommand } from '../../utils/voiceCommands';
import { getSharedAudioContext } from '../../utils/sharedAudio';
import { saveSoundPack } from '../../utils/soundPackStore';
import VoiceHelpDialog from './VoiceHelpDialog';

// Lazy-loaded components (only load when needed)
const AccessibilityPanel = lazy(() => import('../AccessibilityPanel'));
const ThemeCustomizer = lazy(() => import('../ThemeCustomizer').then(module => ({ default: module.ThemeCustomizer })));
const ConversationSearch = lazy(() => import('../ConversationSearch').then(module => ({ default: module.ConversationSearch })));
const AudioVisualizer = lazy(() => import('../AudioVisualizer').then(module => ({ default: module.AudioVisualizer })));
// v1.6.0 Components (lazy-loaded)
const AdvancedExporter = lazy(() => import('../AdvancedExporter').then(module => ({ default: module.AdvancedExporter })));
const CharacterCreator = lazy(() => import('../CharacterCreator').then(module => ({ default: module.CharacterCreator })));
const ConversationReplay = lazy(() => import('../ConversationReplay').then(module => ({ default: module.ConversationReplay })));
// v1.8.0 Components (lazy-loaded)
const OnboardingTutorial = lazy(() => import('../OnboardingTutorial'));
const ConversationInsights = lazy(() => import('../ConversationInsights'));
// v1.9.0 Components (lazy-loaded)
const SoundSettingsPanel = lazy(() => import('../SoundSettingsPanel'));
// v1.10.0 Components (lazy-loaded)
const MusicPlayer = lazy(() => import('../MusicPlayer'));
const InstallPrompt = lazy(() => import('../InstallPrompt'));
const SoundPackManager = lazy(() => import('../SoundPackManager'));
const SoundPackCreator = lazy(() => import('../SoundPackCreator'));
const CloudSyncPanel = lazy(() => import('../CloudSyncPanel'));
// v1.11.0 Components (lazy-loaded - Option C)
const VoiceInput = lazy(() => import('../VoiceInput'));
const EmotionVisualizer = lazy(() => import('../EmotionVisualizer'));
const TopicFlowDiagram = lazy(() => import('../TopicFlowDiagram'));
const ConversationTemplates = lazy(() => import('../ConversationTemplates'));

/** Full-screen loading overlay shown while a modal panel's code loads. */
function ModalFallback({ label }: { label: string }) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">{label}</div></div>;
}

type PersonaState = ReturnType<typeof usePersona>;
type SessionHistory = ReturnType<typeof useSessionHistory>;

export interface EnhancedPanelsProps {
  panels: Panels;
  accessibility: Pick<ReturnType<typeof useAccessibility>, 'settings' | 'updateSetting' | 'resetSettings'>;
  themeChoice: Pick<ReturnType<typeof useThemeChoice>, 'theme' | 'customThemes' | 'addCustomTheme'>;
  history: Pick<SessionHistory, 'savedSessions' | 'currentSession' | 'mergeSessions'>;
  personaState: Pick<PersonaState, 'customCharacters' | 'saveCustomCharacter' | 'deleteCustomCharacter'>;
  speech: Pick<ReturnType<typeof useSpeechPlayer>, 'currentSource' | 'isPlaying'>;
  installPrompt: ReturnType<typeof useInstallPrompt>;
  voiceCommands: VoiceCommand[];
  /** Focus-trap container for the voice help dialog (useFocusTrap). */
  voiceHelpRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  announce: (message: string) => void;
  onVoiceTranscript: (transcript: string) => void;
  onSelectTemplate: (prompts: string[]) => void;
}

export default function EnhancedPanels({
  panels,
  accessibility,
  themeChoice,
  history,
  personaState,
  speech,
  installPrompt,
  voiceCommands,
  voiceHelpRef,
  messages,
  announce,
  onVoiceTranscript,
  onSelectTemplate,
}: EnhancedPanelsProps) {
  const { open: panelOpen, setPanel } = panels;
  const { savedSessions, currentSession, mergeSessions } = history;
  const activeTheme = themeChoice.theme;
  const currentTheme = activeTheme.id;

  return (
    <>
      {/* Accessibility Panel (v1.4.0) */}
      {panelOpen.accessibility && (
        <Suspense fallback={<ModalFallback label="Loading..." />}>
          <AccessibilityPanel
            isOpen={panelOpen.accessibility}
            settings={accessibility.settings}
            onClose={() => setPanel('accessibility', false)}
            onUpdateSetting={accessibility.updateSetting}
            onResetSettings={accessibility.resetSettings}
          />
        </Suspense>
      )}

      {/* Theme Customizer (v1.5.0) */}
      {panelOpen.themeCustomizer && (
        <Suspense fallback={<ModalFallback label="Loading..." />}>
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
        <Suspense fallback={<ModalFallback label="Loading..." />}>
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
        <Suspense fallback={<ModalFallback label="Loading..." />}>
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
        <Suspense fallback={<ModalFallback label="Loading..." />}>
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
        <Suspense fallback={<ModalFallback label="Loading..." />}>
          <ConversationReplay
            isOpen={panelOpen.conversationReplay}
            onClose={panels.closeReplay}
            session={panels.replaySession}
          />
        </Suspense>
      )}

      {/* Onboarding Tutorial (v1.8.0) */}
      {panelOpen.onboarding && (
        <Suspense fallback={<ModalFallback label="Loading tutorial..." />}>
          <OnboardingTutorial
            onComplete={() => setPanel('onboarding', false)}
            onSkip={() => setPanel('onboarding', false)}
          />
        </Suspense>
      )}

      {/* Conversation Insights (v1.8.0) */}
      {panelOpen.insights && (
        <Suspense fallback={<ModalFallback label="Loading insights..." />}>
          <ConversationInsights
            onClose={() => setPanel('insights', false)}
            currentTheme={currentTheme}
          />
        </Suspense>
      )}

      {/* Sound Settings Panel (v1.9.0) */}
      {panelOpen.soundSettings && (
        <Suspense fallback={<ModalFallback label="Loading sound settings..." />}>
          <SoundSettingsPanel
            isOpen={panelOpen.soundSettings}
            onClose={() => setPanel('soundSettings', false)}
          />
        </Suspense>
      )}

      {/* Music Player (v1.10.0) */}
      {panelOpen.musicPlayer && (
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
        <Suspense fallback={<ModalFallback label="Loading sound pack manager..." />}>
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
        <Suspense fallback={<ModalFallback label="Loading sound pack creator..." />}>
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
        <Suspense fallback={<ModalFallback label="Loading cloud sync..." />}>
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
        <VoiceHelpDialog
          commands={voiceCommands}
          containerRef={voiceHelpRef}
          onClose={() => setPanel('voiceControlHelp', false)}
        />
      )}

      {/* Voice Input Panel (v1.11.0 - Option C1) */}
      {panelOpen.voiceInput && (
        <Suspense fallback={<div className="fixed bottom-20 left-4 z-40 text-white text-sm">Loading voice input...</div>}>
          <div className="fixed bottom-20 left-4 z-40 max-w-md">
            <VoiceInput
              onTranscript={onVoiceTranscript}
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
      {panelOpen.emotionViz && (
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
      {panelOpen.topicDiagram && (
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
        <Suspense fallback={<ModalFallback label="Loading templates..." />}>
          <ConversationTemplates
            isOpen={panelOpen.templates}
            onClose={() => setPanel('templates', false)}
            onSelectTemplate={onSelectTemplate}
            theme={activeTheme}
          />
        </Suspense>
      )}
    </>
  );
}
