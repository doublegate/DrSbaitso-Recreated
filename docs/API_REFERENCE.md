# Dr. Sbaitso Recreated - API Reference

**Version**: 1.9.0
**Last Updated**: November 2025

---

## Table of Contents

1. [Gemini AI Integration](#gemini-ai-integration)
2. [Utility Functions](#utility-functions)
3. [Custom Hooks](#custom-hooks)
4. [Component APIs](#component-apis)
5. [Type Definitions](#type-definitions)

---

## Gemini AI Integration

### `getDrSbaitsoResponse(message: string): Promise<string>`

**Location**: `services/geminiService.ts`

Sends a user message to Google Gemini AI and returns Dr. Sbaitso's response.

**Parameters:**
- `message` (string): The user's input message

**Returns:**
- `Promise<string>`: Dr. Sbaitso's response text (ALL CAPS)

**Throws:**
- `Error`: If API call fails or rate limit exceeded

**Example:**
```typescript
try {
  const response = await getDrSbaitsoResponse('Hello Doctor');
  console.log(response); // "HELLO. HOW MAY I HELP YOU TODAY?"
} catch (error) {
  console.error('Failed to get response:', error);
}
```

---

### `synthesizeSpeech(text: string, characterId: string): Promise<string>`

**Location**: `services/geminiService.ts`

Converts text to speech using Gemini 2.5 Flash TTS with character-specific voice prompts.

**Parameters:**
- `text` (string): Text to synthesize
- `characterId` (string): Character ID for voice customization ('sbaitso', 'eliza', 'hal9000', etc.)

**Returns:**
- `Promise<string>`: Base64-encoded PCM audio data (24kHz, mono)

**Throws:**
- `Error`: If TTS API fails

**Example:**
```typescript
const audioData = await synthesizeSpeech('HELLO USER', 'sbaitso');
// Returns: "base64_encoded_audio_data..."
```

**Character Voice Prompts:**
- `sbaitso`: "Very deep, extremely monotone, continuous, 8-bit computer voice from 1991"
- `eliza`: "Flat, mechanical, artificial 1960s computer voice"
- `hal9000`: "Calm, measured, unsettling monotone like HAL 9000"
- `joshua`: "Computerized, analytical, curious 1980s AI voice"
- `parry`: "Anxious, defensive, suspicious tone"

---

## Utility Functions

### Audio Processing

#### `decode(base64: string): Uint8Array`

**Location**: `utils/audio.ts`

Decodes base64 string to Uint8Array.

**Parameters:**
- `base64` (string): Base64-encoded data

**Returns:**
- `Uint8Array`: Decoded binary data

---

#### `decodeAudioData(audioBytes: Uint8Array, ctx: AudioContext, sampleRate: number, channels: number, mode: AudioMode): Promise<AudioBuffer>`

**Location**: `utils/audio.ts`

Converts raw PCM audio bytes to AudioBuffer with vintage processing.

**Parameters:**
- `audioBytes` (Uint8Array): Int16 PCM audio data
- `ctx` (AudioContext): Web Audio API context
- `sampleRate` (number): Sample rate (24000 Hz)
- `channels` (number): Channel count (1 for mono)
- `mode` (AudioMode): Vintage processing level ('modern' | 'subtle' | 'authentic' | 'ultra')

**Returns:**
- `Promise<AudioBuffer>`: Processed audio buffer ready for playback

**Example:**
```typescript
const buffer = await decodeAudioData(audioBytes, audioContext, 24000, 1, 'authentic');
```

---

#### `playAudio(buffer: AudioBuffer, ctx: AudioContext): Promise<void>`

**Location**: `utils/audio.ts`

Plays an audio buffer through Web Audio API.

**Parameters:**
- `buffer` (AudioBuffer): Audio data to play
- `ctx` (AudioContext): Audio context

**Returns:**
- `Promise<void>`: Resolves when playback completes

---

### Session Management

#### `SessionManager.createSession(characterId: string, themeId: string, audioQualityId: string): ConversationSession`

**Location**: `utils/sessionManager.ts`

Creates a new conversation session.

**Parameters:**
- `characterId` (string): Active AI character
- `themeId` (string): Active theme
- `audioQualityId` (string): Audio quality preset

**Returns:**
- `ConversationSession`: New session object

---

#### `SessionManager.saveSession(session: ConversationSession): void`

**Location**: `utils/sessionManager.ts`

Persists session to localStorage.

**Parameters:**
- `session` (ConversationSession): Session to save

---

#### `SessionManager.getAllSessions(): ConversationSession[]`

**Location**: `utils/sessionManager.ts`

Retrieves all saved sessions.

**Returns:**
- `ConversationSession[]`: Array of sessions sorted by updatedAt (newest first)

---

### Sentiment Analysis

#### `analyzeSentiment(messages: Message[]): SentimentAnalysis`

**Location**: `utils/sentimentAnalysis.ts`

Analyzes sentiment of messages using keyword matching.

**Parameters:**
- `messages` (Message[]): Messages to analyze

**Returns:**
- `SentimentAnalysis`: Sentiment scores and statistics

**Example:**
```typescript
const sentiment = analyzeSentiment(userMessages);
console.log(sentiment);
// {
//   score: 15,           // -100 to +100
//   positiveCount: 5,
//   negativeCount: 2,
//   neutralCount: 3,
//   totalWords: 100
// }
```

---

### Conversation Pattern Detection (v1.9.0)

#### `generateInsightSummary(sessions: ConversationSession[]): InsightSummary`

**Location**: `utils/insightEngine.ts`

Generates comprehensive conversation insights including health score, topic clusters, and pattern detection.

**Parameters:**
- `sessions` (ConversationSession[]): Sessions to analyze

**Returns:**
- `InsightSummary`: Complete insight analysis

**Example:**
```typescript
const insights = generateInsightSummary(allSessions);
console.log(insights.health.score);          // 78 (out of 100)
console.log(insights.topTopics.length);      // 15 topics
console.log(insights.sentimentTrend.trend);  // 'improving'
```

---

#### `calculateConversationHealth(sessions: ConversationSession[]): ConversationHealth`

**Location**: `utils/insightEngine.ts`

Calculates conversation health score (0-100) with breakdown.

**Returns:**
```typescript
{
  score: 78,
  breakdown: {
    sentimentBalance: 65,   // Sentiment distribution
    topicDiversity: 80,     // Variety of topics
    engagementLevel: 85,    // Message count/length
    responsiveness: 82      // Session continuation rate
  },
  recommendation: "Good conversation patterns...",
  concerns: ["Low sentiment scores detected"]
}
```

---

#### `clusterTopics(sessions: ConversationSession[]): TopicCluster[]`

**Location**: `utils/insightEngine.ts`

Identifies and clusters conversation topics using TF-IDF-inspired algorithm.

**Returns:**
```typescript
[
  {
    topic: 'work',
    keywords: ['work', 'job', 'boss', 'office'],
    frequency: 45,
    sentiment: -12,        // Average sentiment when discussing this topic
    sessions: ['session-id-1', 'session-id-2'],
    firstSeen: 1699999999000,
    lastSeen: 1700099999000
  },
  // ... more topics
]
```

---

### Sound Effects (v1.9.0)

#### `SoundEffectsManager.playSound(eventType: SoundEventType, volume?: number): Promise<void>`

**Location**: `utils/soundEffects.ts`

Plays a retro sound effect.

**Parameters:**
- `eventType` (SoundEventType): Type of sound to play
- `volume` (number, optional): Volume multiplier (0-1, default 1)

**Event Types:**
- `'keypress'`: Keyboard click sound
- `'message-send'`: Success beep
- `'message-receive'`: Notification beep
- `'error'`: Error buzz
- `'success'`: Success chirp
- `'boot-start'`: Boot sequence start
- `'boot-complete'`: Boot sequence complete
- `'disk-access'`: Disk activity sound

**Example:**
```typescript
import { getSoundManager } from '../utils/soundEffects';

const soundManager = getSoundManager();
await soundManager.playSound('keypress', 0.8);
```

---

#### `SoundEffectsManager.startAmbience(): Promise<void>`

**Location**: `utils/soundEffects.ts`

Starts looping background ambience (computer room atmosphere).

---

#### `SoundEffectsManager.updateSettings(settings: Partial<SoundSettings>): void`

**Location**: `utils/soundEffects.ts`

Updates sound settings.

**Example:**
```typescript
soundManager.updateSettings({
  uiVolume: 0.5,
  ambienceVolume: 0.3,
  keyboardClicksEnabled: true
});
```

---

## Custom Hooks

### `useSoundEffects()`

**Location**: `hooks/useSoundEffects.ts`

React hook for managing retro sound effects.

**Returns:**
```typescript
{
  playSound: (eventType: SoundEventType, volume?: number) => Promise<void>;
  startAmbience: () => Promise<void>;
  stopAmbience: () => void;
  updateSettings: (settings: Partial<SoundSettings>) => void;
  getSettings: () => SoundSettings;
  initialized: boolean;
}
```

**Example:**
```typescript
function MyComponent() {
  const { playSound, updateSettings } = useSoundEffects();

  const handleClick = () => {
    playSound('notification');
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

---

### `useAccessibility()`

**Location**: `hooks/useAccessibility.ts`

Manages accessibility settings.

**Returns:**
```typescript
{
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: any) => void;
  resetSettings: () => void;
}
```

---

### `useScreenReader()`

**Location**: `hooks/useScreenReader.ts`

Provides screen reader announcement functionality.

**Returns:**
```typescript
{
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}
```

**Example:**
```typescript
const { announce } = useScreenReader();

announce('Message sent successfully', 'polite');
announce('Error occurred', 'assertive');
```

---

### `useVoiceControl()`

**Location**: `hooks/useVoiceControl.ts`

Manages voice command functionality.

**Parameters:**
```typescript
{
  enabled: boolean;
  wakeWordEnabled: boolean;
  handsFreeModeEnabled: boolean;
  confirmDestructiveCommands: boolean;
  onClear: () => void;
  onExport: () => void;
  onSwitchCharacter: (characterId: string) => void;
  // ... other callbacks
}
```

**Returns:**
```typescript
{
  isListeningForWakeWord: boolean;
  isListeningForCommand: boolean;
  isHandsFreeMode: boolean;
  toggleHandsFreeMode: () => void;
  showHelp: () => string;
  // ... other methods
}
```

---

## Component APIs

### SoundSettingsPanel

**Location**: `components/SoundSettingsPanel.tsx`

Modal dialog for configuring sound effects.

**Props:**
```typescript
interface SoundSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Example:**
```typescript
<SoundSettingsPanel
  isOpen={showSoundSettings}
  onClose={() => setShowSoundSettings(false)}
/>
```

---

### ConversationInsights (Enhanced v1.9.0)

**Location**: `components/ConversationInsights.tsx`

Analytics dashboard with advanced pattern detection.

**Props:**
```typescript
interface ConversationInsightsProps {
  onClose: () => void;
  currentTheme: string;
}
```

**Features (v1.9.0):**
- Conversation health score gauge
- Topic cluster bubble chart
- Sentiment trajectory graph
- Character effectiveness matrix
- Conversation loop detector
- Engagement timeline

---

## Type Definitions

### Message

```typescript
interface Message {
  author: 'user' | 'dr';
  text: string;
  timestamp?: number;
  characterId?: string;
}
```

---

### ConversationSession

```typescript
interface ConversationSession {
  id: string;
  name: string;
  characterId: string;
  themeId: string;
  audioQualityId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  glitchCount: number;
  startedAt?: number;
  endedAt?: number;
}
```

---

### SoundSettings (v1.9.0)

```typescript
interface SoundSettings {
  uiSoundsEnabled: boolean;
  ambienceEnabled: boolean;
  uiVolume: number;             // 0-1
  ambienceVolume: number;        // 0-1
  selectedSoundPack: SoundPackId;
  keyboardClicksEnabled: boolean;
  systemBeepsEnabled: boolean;
  bootSoundsEnabled: boolean;
}
```

---

### InsightSummary (v1.9.0)

```typescript
interface InsightSummary {
  health: ConversationHealth;
  topTopics: TopicCluster[];
  sentimentTrend: SentimentTrajectory;
  characterPerformance: CharacterEffectiveness[];
  detectedLoops: ConversationLoop[];
  engagement: EngagementMetrics;
  generatedAt: number;
}
```

---

**End of API Reference** - v1.9.0
*For implementation examples, see docs/DEVELOPMENT_GUIDE.md*
