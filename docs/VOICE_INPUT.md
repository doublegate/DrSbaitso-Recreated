# Voice Input

Voice input turns speech into text on the input line, so you can talk instead of typing.
It is an Enhanced-mode feature; the classic screen takes keyboard input only, like the
original. For spoken commands ("Hey Doctor, clear conversation"), see
[VOICE_CONTROL.md](VOICE_CONTROL.md).

## Using it

1. Open the voice input panel: the microphone button next to the input line, the
   SOUND menu > Voice input, or **Alt+Shift+V**.
2. Press **Start Voice Input** and allow the microphone when the browser asks.
3. Speak. Interim words show in grey in the panel; each finished phrase is appended to
   the input line.
4. Edit the text if needed and press Enter or SEND. Voice input never sends on its own.

The panel stops after one phrase (recognition is not continuous); press Start again for
more. **Clear** empties the panel's transcript, not the input line. Each recognised
phrase is announced to screen readers.

## Browser support

Voice input uses the Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`).

| Browser | Support |
|---|---|
| Chrome, Edge (desktop and Android) | Yes |
| Safari (macOS, iOS) | Yes |
| Firefox | No; the panel says so |

Chrome and Edge send the audio to the browser vendor's speech service, so recognition
needs a network connection. The page itself never receives or stores audio. Recognition
language is fixed to US English (`en-US`).

## Errors

| Message | Cause |
|---|---|
| No speech detected | Nothing was heard before the browser timed out; try again |
| No microphone found | No input device, or the device is in use elsewhere |
| Microphone permission denied | Allow the microphone in the site settings (padlock icon) |
| Network error | The browser's speech service could not be reached |
| Speech recognition service not allowed | The browser or a policy blocks the service |

The site's `Permissions-Policy` header allows the microphone for the site itself only
(`vercel.json`).

## Implementation

- `src/components/VoiceInput.tsx`: the panel. It owns one recogniser
  (`interimResults: true`, `continuous: false`, `lang: 'en-US'`) and reports each final
  result through `onTranscript`.
- `src/components/enhanced/EnhancedPanels.tsx` loads the panel lazily and passes
  `handleVoiceTranscript` from `src/hooks/useChatPipeline.ts`, which appends the text to
  the input line.
- `src/components/enhanced/InputBar.tsx`: the microphone toggle
  (`aria-pressed` reflects whether the panel is open).
- `src/hooks/useVoiceRecognition.ts` is the recogniser hook used by hands-free voice
  control, not by this panel.
