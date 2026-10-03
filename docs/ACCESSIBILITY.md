# Accessibility

The app aims at WCAG 2.1 AA. Both screens can be used with a keyboard alone and with a
screen reader; the settings panel and most aids below belong to Enhanced mode. This page
describes what is implemented; it is not an audit result.

## Classic screen

The classic screen is a picture of an 80x25 text display, so it carries its own
accessibility layer (`src/components/classic/ClassicApp.tsx`):

- The visual grid is `aria-hidden`. A visually hidden transcript (`role="log"`,
  `aria-live="off"`) mirrors what is printed, and each spoken reply is announced once
  through a polite live region.
- Typing goes to a real, labelled `<input>` whose label follows the state: "Please enter
  your name", "Talk to Doctor Sbaitso", "Press C to continue, N for a new patient, or Q to
  quit", "Press Enter to run Doctor Sbaitso again". It is `aria-busy` while the doctor
  speaks.
- Clicking anywhere refocuses the input.
- A "Switch to the enhanced interface (Alt+Shift+X)" link appears when it receives
  keyboard focus.
- Colours, font and blink rate are the original's and are not adjustable here. The
  cursor stops blinking when reduced motion is on (see below), but the classic screen
  does not yet read the system `prefers-reduced-motion` setting itself.

## Enhanced mode

### Settings panel

Open with **Alt+Shift+A**, SETTINGS > Accessibility, or the voice command
"accessibility". Settings are saved in localStorage
(`dr-sbaitso-accessibility-settings`). Without saved settings, reduced motion and high
contrast follow the system preferences (`prefers-reduced-motion`, `prefers-contrast`).

| Setting | Default | Effect |
|---|---|---|
| High contrast | system | Black background, white text and borders, yellow accent; overrides the colour theme; 3 px borders on controls |
| Reduced motion | system | Animations and transitions reduced to a single near-instant frame; no smooth scrolling |
| Font size | Medium | Small 12 px, Medium 16 px, Large 20 px, Extra large 24 px (root font size) |
| Focus indicator | Default | 3 px yellow outline, 5 px outline, or a 4 px underline; shown once you navigate with Tab |
| Announce messages | On | Each finished reply is announced once ("<persona> says: ...") |
| Screen reader optimized | Off | Sets a class on the page; nothing uses it yet |
| Keyboard navigation hints | On | Shows hints only on elements with a `data-keyboard-hint` attribute, which none currently have |

### Structure and semantics

- Skip links at the top of the page: "Skip to main content" (the conversation log),
  "Skip to chat input" and "Skip to settings" (which has no target yet; see Known gaps).
- The header holds a labelled persona `<select>` and a `<nav aria-label="Tools">` with
  four menu buttons (CONVERSATION, VISUALS, SOUND, SETTINGS). Menu buttons use
  `aria-expanded`; toggle items use `aria-pressed`; each item shows its shortcut. Up/Down
  move between items, Escape closes the menu and returns focus to its button, and
  clicking elsewhere closes it.
- The conversation log is `role="log"` with `aria-live="off"`, so the typewriter does
  not announce every character; finished replies are announced separately (above).
- The chat input and the microphone button are labelled; the microphone button reports
  `aria-pressed`.
- Status bar controls (audio mode, voice profile, theme, SAVE HISTORY) are labelled
  form controls. OFFLINE is a `role="status"` message.
- Dialogs (accessibility, sound settings, theme customizer, search, cloud sync, voice
  commands) use `role="dialog"`, `aria-modal` and a label; the voice-command dialog
  traps focus and closes on Escape.
- Template cards are buttons that respond to Enter and Space.
- The page allows zooming and text selection (no `user-scalable=no`, no
  `user-select: none` on the conversation).

### Announcements

`useScreenReader` (`src/hooks/useScreenReader.ts`) writes to one polite live region,
fixed off-screen so it does not affect layout. Besides replies, it announces persona
switches, audio mode changes, mute and unmute, voice input transcripts, voice commands
and their errors, template progress, and conversations restored by cloud sync.

### Keyboard

All features are reachable with Tab, Enter, Space and Escape. Global shortcuts are
Alt+Shift+&lt;key&gt; so they do not collide with browser or screen-reader keys; see
[KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md).

### Voice

Voice input dictates into the input line, and hands-free voice control operates the app
by spoken commands. See [VOICE_INPUT.md](VOICE_INPUT.md) and
[VOICE_CONTROL.md](VOICE_CONTROL.md).

### Tutorial

The first-run tutorial (Alt+Shift+H to reopen) is keyboard-operable: Enter advances,
Escape asks to skip. Its steps point at the real controls through `data-tour-id`
attributes and fall back to a centred card when a control is absent.

## Implementation

| File | Role |
|---|---|
| `src/hooks/useAccessibility.ts` | Loads, saves and applies settings (classes and data attributes on `<html>`); starts the Tab detector |
| `src/utils/accessibilityManager.ts` | Defaults, system-preference detection, the live-region announcer, focus and keyboard helpers, WCAG contrast calculations |
| `src/components/AccessibilityPanel.tsx` | The settings dialog |
| `src/components/SkipNav.tsx` | Skip links |
| `src/hooks/useFocusTrap.ts` | Focus trap used by the voice-command dialog |
| `src/index.css` | `.high-contrast`, `.reduce-motion`, `data-font-size`, `data-focus-style`, `.user-is-tabbing` |

## Testing

- Lint: oxlint runs its accessibility (jsx-a11y) rules in `npm run lint`.
- Unit: `test/utils/accessibilityManager.test.ts` and the component tests.
- End to end: the specs locate elements by role and accessible name, so missing labels
  fail them; the classic spec drives the screen through its labelled input
  (`e2e/classic.spec.ts`).
- Manual: check with a screen reader (NVDA or VoiceOver) and with keyboard only before a
  release.

## Known gaps

- "Skip to settings" in `src/components/SkipNav.tsx` points at `#settings`, which no
  element has, and the skip links have no targets on the name screen.
- The screen-reader-optimized and keyboard-hint settings have no visible effect yet (see
  the table).
- The classic screen ignores the system reduced-motion preference unless Enhanced mode
  has applied the setting earlier in the same page.
