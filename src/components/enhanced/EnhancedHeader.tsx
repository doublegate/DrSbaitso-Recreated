/** Enhanced-mode header: the persona picker, the tool menus and the CLASSIC switch. */
import MenuGroup from './MenuGroup';
import { shortcutLabel } from '../../utils/shortcuts';
import type { Persona } from '../../hooks/usePersona';
import type { Panels } from '../../hooks/usePanels';

export interface EnhancedHeaderProps {
  persona: Persona;
  personas: Persona[];
  /** True when at least one custom character exists ("Your characters" group). */
  hasCustomCharacters: boolean;
  onSwitchPersona: (id: string) => void;
  /** The persona cannot change while a turn is in progress. */
  personaDisabled: boolean;
  panels: Pick<Panels, 'open' | 'setPanel'>;
  muted: boolean;
  onToggleMute: () => void;
  onClearConversation: () => void;
  handsFree: { active: boolean; supported: boolean; toggle: () => void };
  onSwitchMode?: () => void;
}

export default function EnhancedHeader({
  persona,
  personas,
  hasCustomCharacters,
  onSwitchPersona,
  personaDisabled,
  panels,
  muted,
  onToggleMute,
  onClearConversation,
  handsFree,
  onSwitchMode,
}: EnhancedHeaderProps) {
  const { open: panelOpen, setPanel } = panels;

  return (
    // z-50: the menus stay above the floating panels (z-40), which they toggle.
    <header className="relative z-50 shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 pb-2 border-b-2 border-(--color-border)">
      <div className="flex items-center gap-2 min-w-0" data-tour-id="character-selection">
        <label htmlFor="persona-select" className="text-sm font-bold">
          PERSONA:
        </label>
        <select
          id="persona-select"
          value={persona.id}
          onChange={(e) => onSwitchPersona(e.target.value)}
          disabled={personaDisabled}
          className="enh-select font-bold"
          title={persona.description}
        >
          <optgroup label="Classic programs">
            {personas
              .filter((p) => !p.isCustom)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </optgroup>
          {hasCustomCharacters && (
            <optgroup label="Your characters">
              {personas
                .filter((p) => p.isCustom)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </optgroup>
          )}
        </select>
        <span className="hidden md:inline text-xs opacity-75 truncate max-w-xs" title={persona.description}>
          {persona.description}
        </span>
      </div>

      <nav
        id="tools"
        tabIndex={-1}
        aria-label="Tools"
        className="flex flex-wrap items-center gap-2 ml-auto"
        data-tour-id="settings-panel"
      >
        <span data-tour-id="session-panel">
          <MenuGroup
            label="CONVERSATION"
            items={[
              {
                id: 'search',
                icon: '🔍',
                label: 'Search and replay',
                onSelect: () => setPanel('conversationSearch', true),
              },
              { id: 'export', icon: '📦', label: 'Export', onSelect: () => setPanel('advancedExport', true) },
              {
                id: 'templates',
                icon: '📝',
                label: 'Templates',
                shortcut: shortcutLabel('templates'),
                onSelect: () => setPanel('templates', true),
              },
              {
                id: 'insights',
                icon: '📈',
                label: 'Insights',
                shortcut: shortcutLabel('insights'),
                onSelect: () => setPanel('insights', true),
              },
              { id: 'clear', icon: '🧹', label: 'Clear conversation', onSelect: onClearConversation },
            ]}
          />
        </span>
        <MenuGroup
          label="VISUALS"
          items={[
            {
              id: 'emotions',
              icon: '😊',
              label: 'Emotion visualizer',
              shortcut: shortcutLabel('emotionViz'),
              active: panelOpen.emotionViz,
              onSelect: () => setPanel('emotionViz', (v) => !v),
            },
            {
              id: 'topics',
              icon: '🔀',
              label: 'Topic diagram',
              shortcut: shortcutLabel('topicDiagram'),
              active: panelOpen.topicDiagram,
              onSelect: () => setPanel('topicDiagram', (v) => !v),
            },
            {
              id: 'audioviz',
              icon: '📊',
              label: 'Audio visualizer',
              active: panelOpen.audioVisualizer,
              onSelect: () => setPanel('audioVisualizer', (v) => !v),
            },
          ]}
        />
        <MenuGroup
          label="SOUND"
          items={[
            {
              id: 'voice-input',
              icon: '🗣️',
              label: 'Voice input',
              shortcut: shortcutLabel('voiceInput'),
              active: panelOpen.voiceInput,
              onSelect: () => setPanel('voiceInput', (v) => !v),
            },
            {
              id: 'hands-free',
              icon: '🎤',
              label: 'Hands-free voice control',
              active: handsFree.active,
              disabled: !handsFree.supported,
              onSelect: () => handsFree.toggle(),
            },
            {
              id: 'mute',
              icon: muted ? '🔇' : '🔈',
              label: muted ? 'Unmute speech' : 'Mute speech',
              active: muted,
              onSelect: onToggleMute,
            },
            {
              id: 'music',
              icon: '🎵',
              label: 'Music player',
              shortcut: shortcutLabel('musicPlayer'),
              active: panelOpen.musicPlayer,
              onSelect: () => setPanel('musicPlayer', (v) => !v),
            },
            {
              id: 'packs',
              icon: '🎼',
              label: 'Sound packs',
              shortcut: shortcutLabel('soundPacks'),
              onSelect: () => setPanel('soundPackManager', true),
            },
            {
              id: 'sound-settings',
              icon: '🔊',
              label: 'Sound settings',
              shortcut: shortcutLabel('soundSettings'),
              onSelect: () => setPanel('soundSettings', true),
            },
          ]}
        />
        <span data-tour-id="theme-button">
          <MenuGroup
            label="SETTINGS"
            items={[
              { id: 'theme', icon: '🎨', label: 'Theme customizer', onSelect: () => setPanel('themeCustomizer', true) },
              {
                id: 'characters',
                icon: '🎭',
                label: 'Character creator',
                onSelect: () => setPanel('characterCreator', true),
              },
              {
                id: 'a11y',
                icon: '♿',
                label: 'Accessibility',
                shortcut: shortcutLabel('accessibility'),
                onSelect: () => setPanel('accessibility', true),
              },
              {
                id: 'voice-help',
                icon: '❔',
                label: 'Voice commands',
                onSelect: () => setPanel('voiceControlHelp', true),
              },
              { id: 'cloud-sync', icon: '☁️', label: 'Cloud sync', onSelect: () => setPanel('cloudSync', true) },
              {
                id: 'tutorial',
                icon: '🎓',
                label: 'Tutorial',
                shortcut: shortcutLabel('tutorial'),
                onSelect: () => setPanel('onboarding', true),
              },
            ]}
          />
        </span>
        {onSwitchMode && (
          <button
            type="button"
            onClick={onSwitchMode}
            className="enh-menu-trigger"
            data-keyboard-hint={shortcutLabel('switchMode')}
            title={`Switch to the classic screen (${shortcutLabel('switchMode')})`}
          >
            CLASSIC
          </button>
        )}
      </nav>
    </header>
  );
}
