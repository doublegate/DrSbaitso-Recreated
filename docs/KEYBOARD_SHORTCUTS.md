# Keyboard Shortcuts

Global shortcuts all use **Alt+Shift+&lt;key&gt;** (on macOS, **Option+Shift+&lt;key&gt;**).
They are matched on the physical key, so the characters macOS produces for
Option+Shift combinations do not interfere. Ctrl/Cmd combinations are left to the
browser (select all, paste as plain text, DevTools, and so on).

The source of truth is [`src/utils/shortcuts.ts`](../src/utils/shortcuts.ts). The toolbar
buttons show their shortcut in their tooltip and accessible label.

## Global

| Shortcut | Action |
|---|---|
| Alt+Shift+A | Accessibility settings |
| Alt+Shift+Q | Cycle audio quality mode (Modern, Subtle, Authentic, Ultra) |
| Alt+Shift+I | Conversation insights |
| Alt+Shift+H | Show the tutorial |
| Alt+Shift+S | Sound settings |
| Alt+Shift+M | Music player |
| Alt+Shift+P | Sound pack manager |
| Alt+Shift+V | Voice input |
| Alt+Shift+E | Emotion visualizer |
| Alt+Shift+T | Topic diagram |
| Alt+Shift+L | Conversation templates |

## Conversation

| Key | Action |
|---|---|
| Enter | Send the message (or submit your name on the first screen) |
| Tab / Shift+Tab | Move between controls |

## Panels

| Key | Where | Action |
|---|---|---|
| Escape | Most dialogs | Close |
| Space | Conversation replay | Play / pause |
| Left / Right | Conversation replay | Previous / next message |
| Home / End | Conversation replay | Jump to start / end |
| `[` / `]` | Conversation replay | Slower / faster |
| L | Conversation replay | Toggle loop |
| Enter | Tutorial | Next step |
| Escape | Tutorial | Skip (asks to confirm) |

## Voice commands

With voice control on, say "Hey Doctor" or "Hey Sbaitso" and then a command, for example
"clear conversation", "export", "talk to ELIZA", "stop audio", "play music", "open
sound packs" or "help". Say "help" for the full list, which
`src/utils/voiceCommands.ts` defines.
