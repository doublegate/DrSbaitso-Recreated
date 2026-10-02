# Voice Control

Hands-free voice control lets you operate Enhanced mode by speaking: say a wake word,
then a command. It controls the app (clear, export, switch persona, open panels); to
dictate a message instead, use [voice input](VOICE_INPUT.md). The classic screen has
no voice control.

## Using it

1. Open the **SOUND** menu and choose **Hands-free voice control**. The item is
   disabled when the browser has no Web Speech API (Firefox).
2. Allow the microphone. A green bar under the header shows the state:
   *Listening for "Hey Doctor"*, *Listening for command* or *Standby*.
3. Say a wake word, then a command, in one breath ("Hey Doctor, clear conversation")
   or with a pause after the wake word.
4. After each command the app goes back to listening for the wake word. Choose the
   menu item again to turn hands-free mode off.

The **Help** button in the bar, and SETTINGS > Voice commands, open the list of
commands (also by saying "help").

## Wake words

"Hey Doctor", "Hey Sbaitso", "Doctor Sbaitso", "Okay Doctor", "Listen Doctor".

A wake word is recognised when it appears anywhere in the phrase, or when the whole
phrase is at least 80% similar to one (Levenshtein distance). Anything said after the
wake word is taken as the command.

## Commands

Each command has several phrases. A phrase contained in what you said matches at once;
otherwise the closest phrase wins if it is at least 70% similar. Partial matches
appear as suggestions while you speak.

| Category | Command | Phrases (examples) | What it does |
|---|---|---|---|
| Conversation | Clear conversation | "clear conversation", "clear chat", "start over", "new conversation" | Clears the log and the persona's memory (asks to confirm) |
| Conversation | Export | "export conversation", "save conversation", "download conversation" | Opens the export dialog |
| Character | Switch persona | "talk to doctor sbaitso", "talk to eliza", "talk to hal", "talk to joshua", "talk to parry" (also "switch to ...", "change to ...") | Switches persona |
| Audio | Mute | "mute", "unmute", "toggle sound" | Mutes or unmutes speech |
| Audio | Stop audio | "stop", "stop talking", "be quiet", "silence" | Stops the speech that is playing |
| Audio | Audio mode | "change audio quality", "switch audio mode" | Cycles the audio mode |
| Audio | Music | "play music", "stop music", "music player" | Shows or hides the music player |
| Audio | Sound packs | "open sound packs", "sound packs" | Opens the sound pack manager |
| Navigation | Theme | "change theme", "next theme" | Cycles the colour theme |
| Navigation | Search | "search", "search conversations", "find" | Opens search and replay |
| Navigation | Visualizer | "show visualizer", "hide visualizer" | Toggles the audio visualizer |
| Navigation | Help | "help", "show commands", "what can I say" | Opens the voice command list |
| Settings | Settings | "open settings", "settings" | Toggles the sound settings panel |
| Settings | Statistics | "show statistics", "show stats" | Opens search and replay |
| Settings | Accessibility | "open accessibility", "accessibility" | Opens accessibility settings |

The complete phrase lists are in `src/utils/voiceCommands.ts` (`createVoiceCommands`).

### Confirmation

Clear conversation asks "Confirm: Clear Conversation?" with **Yes** and **No** buttons in
the voice bar. It is cancelled automatically after 10 seconds. Confirmation is by button
only, not by voice.

### Feedback

Each executed command, wake-word detection and error is announced to screen readers. An
unrecognised command shows "Command not recognized. Say "help" for available
commands." and the app returns to listening for the wake word.

## Browser support

| Browser | Support |
|---|---|
| Chrome, Edge | Yes |
| Safari | Yes |
| Firefox | No (menu item disabled) |

Chrome and Edge recognise speech on the vendor's servers, so a network connection is
needed. Browsers stop continuous recognition after a stretch of silence; in hands-free
mode the app restarts listening automatically.

## Implementation

| File | Role |
|---|---|
| `src/utils/voiceCommands.ts` | Wake words, command registry, fuzzy matching, suggestions, help text |
| `src/hooks/useVoiceControl.ts` | Two recognisers (continuous for the wake word, single-shot for the command), confirmation, hands-free restart |
| `src/hooks/useVoiceRecognition.ts` | Web Speech API wrapper (`en-US`) |
| `src/components/enhanced/VoiceControlIndicator.tsx` | The status bar with suggestions, errors and the confirmation buttons |
| `src/components/enhanced/VoiceHelpDialog.tsx` | The command list dialog (focus trap, Escape closes) |
| `src/EnhancedApp.tsx` | Passes the handlers for each command |

Handlers are read through a ref, so `EnhancedApp` can pass inline functions without
rebuilding the recognisers each render (that once caused an endless render loop).

## Troubleshooting

| Symptom | Check |
|---|---|
| Menu item greyed out | The browser has no Web Speech API; use Chrome, Edge or Safari |
| Nothing happens after the wake word | Microphone permission (padlock icon), and that no other tab holds the microphone |
| Commands are misheard | Use the exact phrases above; reduce background noise |
| "network" error | The browser's speech service is unreachable |
