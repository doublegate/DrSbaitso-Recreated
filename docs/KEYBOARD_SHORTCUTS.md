# Keyboard Shortcuts

Global shortcuts all use **Alt+Shift+&lt;key&gt;** (on macOS, **Option+Shift+&lt;key&gt;**).
They are matched on the physical key (`KeyboardEvent.code`), so the characters macOS
produces for Option+Shift combinations do not interfere. Ctrl/Cmd combinations are left
to the browser (select all, paste as plain text, DevTools, and so on).

The source of truth is [`src/utils/shortcuts.ts`](../src/utils/shortcuts.ts). In Enhanced
mode, each menu item shows its shortcut next to its label.

## Global

Alt+Shift+X works on both screens. The others act in Enhanced mode only.

| Shortcut | Action |
|---|---|
| Alt+Shift+X | Switch between the classic screen and Enhanced mode |
| Alt+Shift+A | Accessibility settings |
| Alt+Shift+Q | Cycle the audio mode (Modern, Subtle, Authentic, Ultra) |
| Alt+Shift+I | Conversation insights (toggle) |
| Alt+Shift+H | Show the tutorial |
| Alt+Shift+S | Sound settings |
| Alt+Shift+M | Music player (toggle) |
| Alt+Shift+P | Sound pack manager |
| Alt+Shift+V | Voice input (toggle) |
| Alt+Shift+E | Emotion visualizer (toggle) |
| Alt+Shift+T | Topic diagram (toggle) |
| Alt+Shift+L | Conversation templates |

## Classic screen

The classic screen behaves like the original program; there are no other shortcuts.

| Key | Where | Action |
|---|---|---|
| Enter | Name prompt, `>` prompt | Submit the name or the line. An Enter pressed while the doctor is speaking is kept and taken as the next input. |
| Any key | While the doctor speaks | Cuts the speech short; the remaining lines print silently |
| `R` then Enter | `>` prompt | Repeat the doctor's last reply |
| `M` then Enter | After a HELP page | Show the next HELP page (three pages) |
| C / N / Q | Exit menu after `BYE`, `QUIT` or `.QUIT` | Continue, new patient, quit to the DOS prompt (a single key, not echoed) |
| Enter | DOS prompt after Q | Run the program again |
| Tab | Anywhere | Reveals the "Switch to the enhanced interface" link |

## Enhanced mode

| Key | Where | Action |
|---|---|---|
| Enter | Name screen, input line | Submit the name or send the message |
| Tab / Shift+Tab | Anywhere | Move between controls |
| Enter / Space | Menu button | Open the menu |
| Up / Down | Open menu | Move between items |
| Escape | Open menu | Close it and return focus to its button |
| Escape | Most dialogs | Close |
| Enter / Space | Template card | Choose the template |

## Panels

| Key | Where | Action |
|---|---|---|
| Space | Conversation replay | Play / pause |
| Left / Right | Conversation replay | Previous / next message |
| Home / End | Conversation replay | Jump to start / end |
| `[` / `]` | Conversation replay | Slower / faster |
| L | Conversation replay | Toggle loop |
| Enter | Tutorial | Next step |
| Escape | Tutorial | Skip (asks to confirm) |

## Voice commands

With hands-free voice control on (SOUND menu), say "Hey Doctor" or "Hey Sbaitso" and then
a command, for example "clear conversation", "export", "talk to ELIZA", "stop audio",
"play music", "open sound packs" or "help". See [VOICE_CONTROL.md](VOICE_CONTROL.md);
`src/utils/voiceCommands.ts` defines the list.
