# Voice Input Documentation

Complete guide to using voice input features in Dr. Sbaitso Recreated.

## Overview

Version 1.2.0 introduces voice input support using the Web Speech API. Speak your problems directly to Dr. Sbaitso and receive audio responses, creating a fully conversational experience.

## Features

### Voice-to-Text Conversion

- **Real-time transcription**: See your words appear as you speak
- **Interim results**: Partial transcripts before final recognition
- **Auto-formatting**: Converts to uppercase retro style
- **Smart filtering**: Removes noise and invalid input

### Operating Modes

**Push-to-Talk (Default):**
- Tap microphone button to start recording
- Speak your message
- Tap again to stop and submit
- Best for: Short messages, noisy environments

**Continuous Listening:**
- Toggle continuous mode in settings
- Automatically detects when you stop speaking
- Hands-free operation
- Best for: Long conversations, accessibility needs

### Language Support

Supports 12 languages with automatic detection:

| Language | Code | Accuracy | Notes |
|----------|------|----------|-------|
| English (US) | en-US | Excellent | Default language |
| English (UK) | en-GB | Excellent | British accent optimized |
| Spanish (Spain) | es-ES | Very Good | European Spanish |
| Spanish (Mexico) | es-MX | Very Good | Latin American Spanish |
| French | fr-FR | Very Good | |
| German | de-DE | Very Good | |
| Italian | it-IT | Good | |
| Portuguese (Brazil) | pt-BR | Very Good | |
| Russian | ru-RU | Good | |
| Chinese (Simplified) | zh-CN | Good | Mandarin |
| Japanese | ja-JP | Good | |
| Korean | ko-KR | Good | |

## Browser Support

### Desktop Browsers

| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| Chrome | 25+ | ✅ Excellent | Best support, fastest recognition |
| Edge | 79+ | ✅ Excellent | Chromium-based, same as Chrome |
| Safari | 14.1+ | ✅ Good | webkit prefix, slightly slower |
| Firefox | Any | ❌ Not Supported | Web Speech API not implemented |
| Opera | 62+ | ✅ Good | Chromium-based |

### Mobile Browsers

| Browser | Platform | Support Level | Notes |
|---------|----------|---------------|-------|
| Safari | iOS 14.1+ | ✅ Good | Requires webkit prefix |
| Chrome | Android 88+ | ✅ Excellent | Best mobile support |
| Samsung Internet | Android | ⚠️ Limited | Varies by device |
| Firefox | Any | ❌ Not Supported | No Web Speech API |

## Setup and Permissions

### First-Time Setup

1. **Grant Microphone Permission:**
   - Click microphone button
   - Browser prompts for permission
   - Click "Allow" to grant access
   - Permission is remembered for future visits

2. **Test Your Microphone:**
   - Speak a test phrase
   - Verify transcript appears
   - Check accuracy and adjust if needed

3. **Select Language (Optional):**
   - Go to settings
   - Choose your preferred language
   - Default is browser language

### Permission Management

**Check Permission Status:**
```typescript
import { getMicrophonePermissionStatus } from '@/utils/speechRecognition';

const status = await getMicrophonePermissionStatus();
// Returns: 'granted' | 'denied' | 'prompt'
```

**Request Permission:**
```typescript
import { requestMicrophonePermission } from '@/utils/speechRecognition';

const granted = await requestMicrophonePermission();
if (granted) {
  // Start voice input
} else {
  // Show error message
}
```

**Check Microphone Availability:**
```typescript
import { checkMicrophoneAvailability } from '@/utils/speechRecognition';

const available = await checkMicrophoneAvailability();
if (!available) {
  console.log('No microphone found');
}
```

## Using Voice Input

### Basic Usage

1. **Start Recording:**
   - Click microphone button (🎤)
   - Button turns red when listening
   - Speak clearly into microphone

2. **View Transcript:**
   - Real-time transcript appears as you speak
   - Partial results show in gray
   - Final results show in yellow

3. **Submit Message:**
   - In push-to-talk mode: Click button again to stop
   - In continuous mode: Pause for 2 seconds to auto-submit
   - Transcript automatically submits to Dr. Sbaitso

### Advanced Features

**Interim Results:**
- See partial transcripts while speaking
- Helps verify recognition accuracy
- Updates in real-time

**Auto-Formatting:**
- Automatically converts to uppercase
- Removes extra whitespace
- Capitalizes first letter
- Filters out noise and artifacts

**Error Recovery:**
- Automatic retry on network errors
- User-friendly error messages
- Graceful degradation on failures

## Implementation Guide

### Using the Voice Recognition Hook

```typescript
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

const MyComponent = () => {
  const {
    // State
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,

    // Controls
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    clearError,
  } = useVoiceRecognition({
    lang: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
    onResult: (text, isFinal) => {
      if (isFinal) {
        console.log('Final transcript:', text);
      } else {
        console.log('Interim transcript:', text);
      }
    },
    onError: (errorMessage) => {
      console.error('Voice error:', errorMessage);
    },
    onStart: () => {
      console.log('Voice recording started');
    },
    onEnd: () => {
      console.log('Voice recording ended');
    },
  });

  return (
    <div>
      {isSupported ? (
        <button onClick={toggleListening}>
          {isListening ? 'Stop' : 'Start'} Recording
        </button>
      ) : (
        <p>Voice input not supported</p>
      )}
      <p>Transcript: {transcript}</p>
      {interimTranscript && (
        <p>Partial: {interimTranscript}</p>
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
};
```

### Formatting Voice Input

```typescript
import {
  formatTranscript,
  toRetroFormat,
  isValidTranscript,
  removeArtifacts,
} from '@/utils/speechRecognition';

// Clean and format transcript
const cleaned = formatTranscript(rawTranscript);

// Convert to uppercase retro style
const retro = toRetroFormat(rawTranscript);

// Validate transcript
if (isValidTranscript(transcript)) {
  // Process valid transcript
}

// Remove artifacts
const clean = removeArtifacts(transcript);
```

### Language Selection

```typescript
import {
  getSupportedLanguages,
  getBrowserLanguage,
} from '@/utils/speechRecognition';

// Get supported languages
const languages = getSupportedLanguages();
// Returns: [{ code: 'en-US', name: 'English (US)' }, ...]

// Get browser language
const browserLang = getBrowserLanguage();
// Returns: 'en-US' or browser's default language
```

## Error Handling

### Common Errors and Solutions

**"No speech detected"**
- Cause: Microphone didn't pick up audio
- Solution: Speak louder, check microphone position
- Code: `error === 'no-speech'`

**"Microphone access denied"**
- Cause: User denied permission or revoked it
- Solution: Guide user to browser settings to re-enable
- Code: `error === 'not-allowed'`

**"No microphone found"**
- Cause: No audio input device connected
- Solution: Connect microphone or headset
- Code: `error === 'audio-capture'`

**"Network error"**
- Cause: Internet connection lost
- Solution: Check connection, try again
- Code: `error === 'network'`

**"Voice recognition aborted"**
- Cause: Recognition stopped unexpectedly
- Solution: Restart voice input
- Code: `error === 'aborted'`

### Error Message Customization

```typescript
const getErrorMessage = (error: string): string => {
  const messages: Record<string, string> = {
    'no-speech': 'PLEASE SPEAK LOUDER. NO SPEECH DETECTED.',
    'not-allowed': 'MICROPHONE ACCESS DENIED. CHECK PERMISSIONS.',
    'audio-capture': 'NO MICROPHONE FOUND. PLEASE CONNECT DEVICE.',
    'network': 'NETWORK ERROR. CHECK YOUR CONNECTION.',
    'aborted': 'VOICE RECOGNITION ABORTED. PLEASE TRY AGAIN.',
  };
  return messages[error] || `UNKNOWN ERROR: ${error}`;
};
```

## Best Practices

### For Optimal Recognition

1. **Environment:**
   - Use in quiet environment
   - Minimize background noise
   - Close windows to reduce wind noise
   - Turn off fans or AC if possible

2. **Microphone:**
   - Position 6-12 inches from mouth
   - Use external mic for better quality
   - Test with different input devices
   - Check audio levels in system settings

3. **Speaking:**
   - Speak clearly and at normal pace
   - Avoid mumbling or rushing
   - Pause between sentences
   - Enunciate words properly

4. **Technical:**
   - Use Chrome for best results
   - Ensure stable internet connection
   - Close unnecessary browser tabs
   - Disable browser extensions that may interfere

### For Developers

1. **User Experience:**
   - Show clear visual feedback when listening
   - Display interim results for confidence
   - Provide helpful error messages
   - Allow easy cancellation

2. **Performance:**
   - Clean up recognition instance on unmount
   - Handle errors gracefully
   - Implement debouncing for rapid starts/stops
   - Cache permission status

3. **Accessibility:**
   - Provide keyboard shortcuts
   - Support screen readers
   - Offer text input alternative
   - Show transcription visually

4. **Privacy:**
   - Inform users that audio is processed remotely
   - Don't store audio data
   - Respect user's privacy settings
   - Clear transcripts on exit

## Privacy and Security

### Data Handling

**Audio Processing:**
- Audio is streamed to browser's speech recognition service
- Google/Apple/Microsoft process audio (depending on browser)
- No audio data is stored by Dr. Sbaitso
- Transcripts are only in browser memory

**Permission Management:**
- Microphone permission is browser-level
- Revoke anytime in browser settings
- Permission persists across sessions
- Cannot access camera or other inputs

### Privacy Considerations

- Voice data processed by third-party services
- Transcripts not sent to any backend
- All processing happens in browser
- No voice recordings stored
- No analytics on voice usage

## Troubleshooting

### Voice Input Not Working

**Check Browser Support:**
```typescript
import { checkSpeechRecognitionSupport } from '@/hooks/useVoiceRecognition';

if (!checkSpeechRecognitionSupport()) {
  console.log('Web Speech API not supported');
}
```

**Check Permission:**
```typescript
import { getMicrophonePermissionStatus } from '@/utils/speechRecognition';

const status = await getMicrophonePermissionStatus();
if (status === 'denied') {
  console.log('Microphone permission denied');
}
```

**Check Microphone:**
```typescript
import { checkMicrophoneAvailability } from '@/utils/speechRecognition';

const available = await checkMicrophoneAvailability();
if (!available) {
  console.log('No microphone available');
}
```

### Poor Recognition Accuracy

**Improve Accuracy:**
1. Select correct language in settings
2. Speak more slowly and clearly
3. Use external microphone
4. Reduce background noise
5. Check microphone input levels
6. Test with voice recorder first

**Browser-Specific Issues:**
- Safari: Requires webkit prefix, slightly lower accuracy
- Chrome Android: May have latency on older devices
- Firefox: Not supported, use Chrome instead

### Mobile-Specific Issues

**iOS Safari:**
- Requires user interaction before starting
- May have stricter permissions
- Battery usage higher during continuous listening
- Works best with latest iOS version

**Chrome Android:**
- Excellent support
- May request Google app permissions
- Works well with Bluetooth headsets
- Battery impact moderate

## Advanced Topics

### Custom Language Models

Future feature (v1.3.0):
- Train custom vocabulary
- Domain-specific recognition
- Improve accuracy for specific terms

### Voice Commands

Future feature (v1.3.0):
- "Clear conversation" voice command
- "Change character" voice command
- "Stop audio" voice command
- Full voice navigation

### Offline Recognition

Not currently supported:
- Web Speech API requires internet
- Browser-based recognition is cloud-dependent
- Offline mode planned for v2.0.0

## Resources

### Documentation

- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition Interface](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Browser Compatibility](https://caniuse.com/speech-recognition)

### Tutorials

- [Google Web Speech API Guide](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api/)
- [Web Speech API Tutorial](https://www.twilio.com/blog/speech-recognition-browser-web-speech-api)

### Tools

- [Microphone Test](https://www.onlinemictest.com/)
- [Browser Permissions Check](https://permission.site/)

---

**Last Updated**: v1.2.0 (2025-10-30)
