# Keyboard Shortcuts Reference

## Overview

Dr. Sbaitso Recreated v1.1.0 introduces comprehensive keyboard shortcuts for power users. All shortcuts are context-aware and automatically adapt to your operating system (Ctrl for Windows/Linux, Cmd for macOS).

## Platform Detection

The application automatically detects your platform and uses the appropriate modifier key:

- **Windows/Linux:** `Ctrl` key
- **macOS:** `Cmd` (⌘) key

Throughout this document, `Ctrl/Cmd` indicates the platform-appropriate modifier.

## Global Shortcuts

These shortcuts work anywhere in the application when it has focus:

### Core Actions

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | **Send Message** | Submit the current input message to the AI |
| `Esc` | **Close Dialog** | Close any open dialog or modal |
| `Ctrl/Cmd + L` | **Clear Conversation** | Clear current session messages (confirmation required) |
| `Ctrl/Cmd + E` | **Export Conversation** | Open the export dialog with format options |
| `Ctrl/Cmd + ,` | **Toggle Settings** | Show or hide the settings panel |
| `Ctrl/Cmd + S` | **Toggle Statistics** | Show or hide the statistics dashboard |

### Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Tab` | **Next Element** | Move focus to next interactive element |
| `Shift + Tab` | **Previous Element** | Move focus to previous interactive element |
| `Ctrl/Cmd + Home` | **Scroll to Top** | Jump to the beginning of conversation |
| `Ctrl/Cmd + End` | **Scroll to Bottom** | Jump to the latest message |

### Character Selection

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + ]` | **Next Character** | Cycle to the next AI personality |
| `Ctrl/Cmd + [` | **Previous Character** | Cycle to the previous AI personality |
| `Ctrl/Cmd + 1` | **Select Dr. Sbaitso** | Switch directly to Dr. Sbaitso |
| `Ctrl/Cmd + 2` | **Select ELIZA** | Switch directly to ELIZA |
| `Ctrl/Cmd + 3` | **Select HAL 9000** | Switch directly to HAL 9000 |
| `Ctrl/Cmd + 4` | **Select JOSHUA** | Switch directly to JOSHUA |
| `Ctrl/Cmd + 5` | **Select PARRY** | Switch directly to PARRY |

### Theme Selection

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt + ]` | **Next Theme** | Cycle to the next visual theme |
| `Alt + [` | **Previous Theme** | Cycle to the previous visual theme |
| `Alt + 1` | **DOS Blue Theme** | Switch directly to DOS Blue |
| `Alt + 2` | **Phosphor Green Theme** | Switch directly to Phosphor Green |
| `Alt + 3` | **Amber Monochrome Theme** | Switch directly to Amber Monochrome |
| `Alt + 4` | **Paper White Theme** | Switch directly to Paper White |
| `Alt + 5` | **Matrix Green Theme** | Switch directly to Matrix Green |

### Audio Controls

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + M` | **Toggle Sound** | Enable or disable all audio output |
| `Ctrl/Cmd + Shift + Q` | **Cycle Audio Quality** | Rotate through quality presets |
| `Ctrl/Cmd + 0` | **Stop Audio** | Stop currently playing audio |

### Session Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + N` | **New Session** | Start a fresh conversation |
| `Ctrl/Cmd + O` | **Open Session** | Load a previously saved session |
| `Ctrl/Cmd + Shift + S` | **Save Session As** | Save current session with custom name |
| `Ctrl/Cmd + W` | **Close Session** | Close current session (auto-saves first) |

### Advanced Actions

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + R` | **Regenerate Response** | Request new response to last message |
| `Ctrl/Cmd + D` | **Duplicate Session** | Copy current session to new session |
| `Ctrl/Cmd + F` | **Search Conversation** | Open search dialog (planned feature) |
| `Ctrl/Cmd + /` | **Show Shortcuts** | Display this keyboard shortcuts reference |

## Context-Specific Shortcuts

### Input Field Active

When the text input field has focus:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Enter` | **Send Message** | Submit message |
| `Shift + Enter` | **New Line** | Insert line break (multi-line input) |
| `Ctrl/Cmd + A` | **Select All** | Select all input text |
| `Ctrl/Cmd + Z` | **Undo** | Undo last edit |
| `Ctrl/Cmd + Shift + Z` | **Redo** | Redo last undone edit |

### Settings Panel Open

When the settings panel is visible:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Esc` | **Close Settings** | Hide settings panel |
| `Tab` | **Next Setting** | Navigate through settings |
| `Enter` | **Toggle/Activate** | Toggle switches or activate buttons |
| `Space` | **Toggle Switch** | Toggle boolean settings |

### Export Dialog Open

When the export dialog is visible:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Esc` | **Cancel Export** | Close export dialog |
| `Ctrl/Cmd + 1` | **Markdown Format** | Select Markdown export |
| `Ctrl/Cmd + 2` | **Text Format** | Select plain text export |
| `Ctrl/Cmd + 3` | **JSON Format** | Select JSON export |
| `Ctrl/Cmd + 4` | **HTML Format** | Select HTML export |
| `Enter` | **Confirm Export** | Download selected format |

### Statistics Dashboard Open

When statistics are visible:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Esc` | **Close Statistics** | Hide statistics dashboard |
| `Ctrl/Cmd + R` | **Refresh Stats** | Recalculate all statistics |
| `Ctrl/Cmd + X` | **Reset Stats** | Clear all statistics (confirmation required) |

## Shortcut Sequences

### Character + Theme Quick Change

Rapidly customize your experience:

```
Ctrl/Cmd + 3       # Switch to HAL 9000
Alt + 5            # Apply Matrix Green theme
Ctrl/Cmd + Shift + Q  # Cycle to High Quality audio
```

Result: HAL 9000 with Matrix theme and clear audio

### Export Workflow

Complete export in seconds:

```
Ctrl/Cmd + E       # Open export dialog
Ctrl/Cmd + 1       # Select Markdown
Enter              # Download file
```

### New Session Workflow

Start fresh conversation:

```
Ctrl/Cmd + N       # Create new session
Ctrl/Cmd + 1       # Select Dr. Sbaitso
Alt + 1            # Apply DOS Blue theme
```

## Customization

### Disabling Shortcuts

To disable specific shortcuts (useful for accessibility or conflicts):

1. Open Settings (`Ctrl/Cmd + ,`)
2. Navigate to "Keyboard Shortcuts" section
3. Uncheck shortcuts to disable
4. Changes save automatically

### Custom Shortcuts (Planned)

Version 1.2.0 will support custom key bindings:
- Rebind any action to your preferred keys
- Import/export shortcut profiles
- Per-character shortcut sets

## Conflict Resolution

### Browser Default Shortcuts

Some shortcuts may conflict with browser defaults:

| Conflict | Browser Action | Solution |
|----------|---------------|----------|
| `Ctrl/Cmd + S` | Save Page | Overridden by app (Statistics) |
| `Ctrl/Cmd + L` | Address Bar | Overridden by app (Clear) |
| `Ctrl/Cmd + W` | Close Tab | NOT overridden (browser wins) |
| `Ctrl/Cmd + R` | Reload Page | Overridden by app (Regenerate) |

**Note:** Critical browser shortcuts like `Ctrl/Cmd + W` (close tab) are not overridden for safety.

### Operating System Shortcuts

Some OS-level shortcuts take precedence:

- **Windows:** `Alt + F4` (close window) - not overridden
- **macOS:** `Cmd + Q` (quit application) - not overridden
- **Linux:** Depends on window manager

## Accessibility Features

### Screen Reader Announcements

When using keyboard shortcuts, screen readers will announce:
- Action being performed
- Success/failure status
- New focus location
- State changes (theme applied, character switched)

### Focus Indicators

All keyboard-navigable elements display clear focus indicators:
- High contrast outline
- Visible in all themes
- Respects `prefers-reduced-motion`

### Alternative Input Methods

For users unable to use keyboard shortcuts:
- All features accessible via mouse/touch
- Voice control compatible (browser dependent)
- Switch control support (browser dependent)

## Shortcuts Cheat Sheet

### Quick Reference Card

Print-friendly single-page reference:

```
CORE ACTIONS              NAVIGATION
Enter     Send Message    Ctrl+]    Next Character
Ctrl+L    Clear           Ctrl+[    Previous Character
Ctrl+E    Export          Alt+]     Next Theme
Ctrl+,    Settings        Alt+[     Previous Theme
Ctrl+S    Statistics

SESSIONS                  AUDIO
Ctrl+N    New Session     Ctrl+M    Toggle Sound
Ctrl+O    Open Session    Ctrl+0    Stop Audio
Ctrl+W    Close Session

CHARACTERS (Ctrl+1-5)     THEMES (Alt+1-5)
1  Dr. Sbaitso            1  DOS Blue
2  ELIZA                  2  Phosphor Green
3  HAL 9000               3  Amber Monochrome
4  JOSHUA                 4  Paper White
5  PARRY                  5  Matrix Green
```

## Training Tips

### Learning Shortcuts

**Day 1:** Master core actions
- `Enter` (send message)
- `Ctrl/Cmd + L` (clear)
- `Ctrl/Cmd + E` (export)

**Day 2:** Add navigation
- `Ctrl/Cmd + ]` / `[` (cycle characters)
- `Alt + ]` / `[` (cycle themes)

**Day 3:** Advanced workflows
- `Ctrl/Cmd + N` (new session)
- `Ctrl/Cmd + S` (statistics)
- Direct selection (`Ctrl/Cmd + 1-5`)

### Practice Exercises

**Exercise 1: Theme Tour**
```
Alt+]  (5 times to see all themes)
Alt+1  (return to DOS Blue)
```

**Exercise 2: Character Conversation**
```
Ctrl+1  (Dr. Sbaitso)
[Type message, Enter]
Ctrl+2  (Switch to ELIZA)
[Type message, Enter]
Ctrl+3  (Switch to HAL 9000)
```

**Exercise 3: Export Workflow**
```
Ctrl+E  (Export)
Ctrl+1  (Markdown)
Enter   (Download)
```

## Troubleshooting

### Shortcuts Not Working

**Problem:** Keyboard shortcuts don't respond

**Solutions:**
1. Ensure app window has focus
2. Check if text input has focus (some shortcuts disabled)
3. Verify JavaScript enabled in browser
4. Check browser console for errors
5. Try refreshing page (`F5` or `Ctrl/Cmd + R`)

### Platform Detection Issues

**Problem:** Wrong modifier key (Ctrl instead of Cmd on Mac)

**Solutions:**
1. Check browser user agent detection
2. Try both Ctrl and Cmd to identify which works
3. Report issue with browser and OS details

### Conflicting Extensions

**Problem:** Browser extension intercepts shortcuts

**Solutions:**
1. Identify conflicting extension
2. Disable extension temporarily
3. Configure extension to exclude this app
4. Use alternative shortcuts

## Performance Impact

### Minimal Overhead

Keyboard shortcuts add negligible performance overhead:
- Event listener: <1ms response time
- Memory footprint: <50 KB
- No impact on chat or audio performance

### Event Handling

Shortcuts use efficient event delegation:
- Single global listener
- Captures at document level
- Prevents unnecessary bubbling

## Developer Notes

### Implementation

Keyboard shortcuts implemented in `utils/keyboardShortcuts.ts`:

```typescript
export const KEYBOARD_SHORTCUTS = {
  NEW_MESSAGE: 'Enter',
  CLEAR_CONVERSATION: 'Ctrl+L',
  EXPORT_CONVERSATION: 'Ctrl+E',
  // ... etc
};
```

### Adding Custom Shortcuts

To add new shortcuts:

1. Define in `constants.ts`
2. Add handler in App.tsx
3. Update this documentation
4. Add to shortcuts help overlay

### Testing

All shortcuts tested on:
- Chrome 88+ (Windows, macOS, Linux)
- Firefox 85+ (Windows, macOS, Linux)
- Safari 14+ (macOS)
- Edge 88+ (Windows)

## Version History

### v1.1.0 (Current)
- Initial keyboard shortcuts implementation
- 30+ shortcuts added
- Platform detection (Ctrl/Cmd)
- Context-aware behavior

### Planned (v1.2.0)
- Custom key bindings
- Shortcut profiles
- Import/export shortcuts
- Visual shortcut editor

## Support

Questions about keyboard shortcuts?
- Documentation: This file
- GitHub Issues: https://github.com/yourusername/DrSbaitso-Recreated/issues
- Discussions: https://github.com/yourusername/DrSbaitso-Recreated/discussions
