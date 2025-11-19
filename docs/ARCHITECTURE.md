# Architecture Documentation

## Overview

Dr. Sbaitso Recreated is a production-ready single-page React application that recreates the 1991 AI therapist program with modern enhancements. The architecture is built around ten core systems: UI/State Management, AI Integration, Audio Processing, Session Management, Export System, Keyboard Navigation, Voice Input, Emotion Analysis, Topic Visualization, and Template Management.

**Version 1.11.0** introduces production-ready architectural enhancements:
- **Voice Input UI**: Web Speech API integration for real-time transcription
- **Emotion Visualizer**: Sentiment analysis with canvas-based trend graphs
- **Topic Flow Diagram**: D3.js force-directed graph visualization
- **Conversation Templates**: Template management system with 10+ pre-defined prompts
- **Performance Profiler**: Core Web Vitals tracking and memory monitoring
- **Service Worker**: Offline support with cache strategies
- **Error Boundaries**: React error boundaries for graceful degradation
- **Testing Infrastructure**: 491 tests (50 component + 39 E2E with Playwright)
- **Enhanced PWA**: Full Progressive Web App capabilities

**Previous Versions:**
- v1.1.0: Multi-character personalities, theme engine, configurable audio, session management
- v1.2.0: AudioWorklet migration, mobile responsive design
- v1.10.0: Advanced analytics, music generation, custom sound packs

## System Architecture (v1.1.0)

```
┌─────────────────────────────────────────────────────────────┐
│                           App.tsx                           │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Name   │→ │ Character │→ │ Greeting │→ │Conversation│  │
│  │  Entry   │  │ Selection │  │ Sequence │  │   Phase    │  │
│  └──────────┘  └───────────┘  └──────────┘  └────────────┘  │
└─────┬──────────┬───────────┬───────────┬───────────────┬────┘
      │          │           │           │               │
┌─────▼──────┐ ┌─▼────────┐ ┌▼────────┐ ┌▼────────────┐ ┌▼─────────┐
│ constants  │ │ gemini   │ │ audio   │ │ session     │ │ keyboard │
│  5 chars   │ │ Service  │ │ utils   │ │ Manager     │ │shortcuts │
│  5 themes  │ │Multi-ch  │ │Config   │ │localStorage │ │30+ keys  │
│  4 presets │ │ Chat     │ │Quality  │ │Auto-save    │ │Ctrl/Cmd  │
└────────────┘ │ Map      │ │Presets  │ │Stats        │ └──────────┘
               └──────────┘ └─────────┘ └────┬────────┘
                                             │
                                        ┌────▼─────┐
                                        │  Export  │
                                        │ 4 Formats│
                                        │MD/TXT/   │
                                        │JSON/HTML │
                                        └──────────┘
```

## Component Structure

### App.tsx - Main Application (ENHANCED v1.1.0)

The main component managing the entire application lifecycle, now with multi-character support, themes, and session management.

**State Variables (v1.1.0 Extended):**
- `userName` - User's name (null until provided)
- `nameInput` - Controlled input for name entry
- `currentCharacter` - Selected AI personality (id from CHARACTERS)
- `currentTheme` - Active theme (id from THEMES)
- `audioQuality` - Current audio preset (id from AUDIO_QUALITY_PRESETS)
- `messages` - Array of Message objects with timestamps and characterId
- `userInput` - Controlled input for chat
- `isLoading` - Blocks input during processing
- `isGreeting` - True during greeting sequence
- `greetingIndex` - Current greeting line index
- `greetingLines` - Character-specific greeting text array
- `isPreparingGreeting` - True while generating greeting audio
- `greetingAudio` - Pre-generated base64 audio array
- `nameError` - Error message for name submission failures
- `currentSession` - Active ConversationSession object
- `showSettings` - Settings panel visibility toggle
- `showStatistics` - Statistics dashboard visibility toggle
- `showExport` - Export dialog visibility toggle

**Refs:**
- `audioContextRef` - Singleton AudioContext instance
- `messagesEndRef` - Auto-scroll target
- `nameInputRef` - Name input focus control
- `inputRef` - Chat input focus control
- `playingGreetingIndexRef` - StrictMode double-render guard

**Key Methods:**

#### ensureAudioContext()
Lazy initialization of AudioContext with webkit fallback. Required before any audio operation.

#### handleNameSubmit()
1. Validates name input
2. Sets `isPreparingGreeting` to true
3. Generates 7 greeting lines with user's name
4. Calls `synthesizeSpeech()` in parallel for all lines
5. Stores audio in state
6. Transitions to greeting phase

#### playAndProgress(base64Audio, onFinished)
Generic audio player with callback:
1. Decodes base64 audio
2. Converts to AudioBuffer
3. Plays audio with effects
4. Calls `onFinished()` on completion or error

#### handleUserInput()
Main conversation handler:
1. Adds user message to state
2. Calls `getDrSbaitsoResponse()` API
3. Checks for glitch phrases, plays glitch sound if found
4. Starts typewriter effect (40ms per character)
5. Simultaneously requests TTS audio
6. Plays audio when both typing and API complete
7. Error handling with retro error messages

### services/geminiService.ts

**Exports:**
- `getDrSbaitsoResponse(message: string): Promise<string>`
- `synthesizeSpeech(text: string): Promise<string>`

**Chat Configuration:**
- Model: `gemini-2.5-flash`
- Persistent Chat object (maintains conversation history)
- System instruction defines Dr. Sbaitso personality:
  - ALL CAPS responses only
  - 1991 knowledge cutoff
  - Robotic, probing questions
  - Random glitches with 8-bit diagnostics
  - No modern slang or concepts

**TTS Configuration:**
- Model: `gemini-2.5-flash-preview-tts`
- Voice: 'Charon' (deep, monotone)
- Prompt: "Say in a very deep, extremely monotone, continuous, 8-bit computer voice from 1991"
- Phonetic override: "SBAITSO" → "SUH-BAIT-SO"
- Returns: Base64-encoded PCM audio

### utils/audio.ts

**Audio Processing Pipeline:**

```
Base64 String
    ↓ decode()
Uint8Array
    ↓ decodeAudioData()
AudioBuffer (24kHz, Float32)
    ↓ playAudio()
┌─────────────────────────────┐
│   Audio Effects Chain       │
│  ┌──────────────────────┐   │
│  │ BufferSource         │   │
│  │ (playbackRate: 1.1)  │   │
│  └──────────┬───────────┘   │
│             ↓               │
│  ┌──────────────────────┐   │
│  │ ScriptProcessorNode  │   │
│  │ (6-bit bit-crusher)  │   │
│  │ (64 quantization     │   │
│  │  levels)             │   │
│  └──────────┬───────────┘   │
│             ↓               │
│  ┌──────────────────────┐   │
│  │  AudioDestination    │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
    ↓
Speaker Output (8-bit retro sound)
```

**Key Functions:**

- `decode()` - Base64 to Uint8Array using atob()
- `decodeAudioData()` - Int16 PCM to Float32 AudioBuffer conversion
- `playAudio()` - Applies bit-crusher and playback rate effects
- `playGlitchSound()` - 200ms white noise with exponential fade-out
- `playErrorBeep()` - 300ms square wave at 300Hz

**Bit-Crusher Algorithm (v1.1.0 Enhanced):**
```javascript
// Configurable quality presets
numLevels = bitDepth  // 16, 64, 256, or 0 (disabled)
step = 2.0 / (numLevels - 1)
output[i] = Math.round(input[i] / step) * step
```

This quantizes float samples from [-1.0, 1.0] to configurable discrete levels (16, 64, or 256), creating adjustable 8-bit audio artifacts. When `bitDepth` is 0, bit-crushing is disabled for modern quality output.

### constants.ts (NEW v1.1.0)

Central configuration file containing all customization data.

**CHARACTERS Array (5 personalities):**
```typescript
interface CharacterPersonality {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;  // Complete AI personality definition
  voicePrompt: string;         // TTS voice instruction
}
```

- Dr. Sbaitso, ELIZA, HAL 9000, JOSHUA, PARRY
- Each ~1-2KB system instruction defining personality, era, constraints
- Unique voice prompts for TTS characterization

**THEMES Array (5 retro themes):**
```typescript
interface Theme {
  id: string;
  name: string;
  colors: {
    primary, background, text, accent, border, shadow
  };
}
```

- DOS Blue, Phosphor Green, Amber Monochrome, Paper White, Matrix Green
- CSS color values for instant theme switching via CSS variables

**AUDIO_QUALITY_PRESETS Array (4 presets):**
```typescript
interface AudioQualityPreset {
  id: string;
  name: string;
  bitDepth: number;      // 16, 64, 256, or 0
  playbackRate: number;  // 1.0, 1.1, or 1.2
  description: string;
}
```

- Extreme Lo-Fi, Authentic 8-bit, High Quality, Modern
- Maps directly to audio.ts `playAudio()` parameters

**KEYBOARD_SHORTCUTS Object:**
- Key definitions for all shortcuts
- Used by useKeyboardShortcuts hook

### utils/sessionManager.ts (NEW v1.1.0)

Static class managing localStorage-based session persistence.

**Key Methods:**

`createSession(characterId, themeId, audioQualityId): ConversationSession`
- Generates unique session ID with timestamp and random string
- Initializes metadata (name, timestamps, counts)
- Returns new session object

`saveSession(session: ConversationSession): void`
- Serializes session to JSON
- Stores in localStorage under `sbaitso_sessions` key
- Updates existing or appends new
- ~5-10 KB per 50-100 message session

`getCurrentSession(): ConversationSession | null`
- Retrieves `sbaitso_current_session` from localStorage
- Returns null if not found or invalid

`getAllSessions(): ConversationSession[]`
- Retrieves all sessions array
- Returns empty array if none exist

`deleteSession(id: string): void`
- Removes session by ID from array
- Updates localStorage

`clearAllSessions(): void`
- Removes all session data from localStorage

**Settings Management:**

`getSettings(): AppSettings`
- Returns saved settings or defaults
- Settings include: soundEnabled, autoScroll, showTimestamps

`saveSettings(settings: AppSettings): void`
- Persists settings to localStorage under `sbaitso_settings` key

**Statistics Tracking:**

`updateStats(session: ConversationSession): void`
- Increments totalSessions, totalMessages, totalGlitches
- Updates charactersUsed and themesUsed counts
- Recalculates averageMessagesPerSession
- Determines favoriteCharacter and favoriteTheme

`getStats(): SessionStats`
- Returns aggregated statistics object

`resetStats(): void`
- Clears all statistics

**Auto-Save Integration:**
- App.tsx calls `saveSession()` every 60 seconds via setInterval
- Triggered on every message send
- No network requests, all client-side

### utils/exportConversation.ts (NEW v1.1.0)

Static class for multi-format conversation export.

**Main Method:**

`exportSession(session: ConversationSession, options: ExportFormat): string`
- Dispatcher routing to format-specific methods
- Returns formatted string ready for download

**Format Methods:**

`toMarkdown(session, options): string`
- Formats with `# Session Name` header
- Metadata block with character, date, counts
- Messages as blockquotes: `> Text here`
- Timestamps in italic if `includeTimestamps: true`

`toText(session, options): string`
- Plain text with ASCII separators
- `=` underline for title, `-` separator for metadata
- ALL CAPS author labels
- Human-readable timestamps

`toJSON(session, options): string`
- Pretty-printed JSON with 2-space indentation
- Full session object or messages-only based on `includeMetadata`
- Machine-readable, parseable format

`toHTML(session, options): string`
- Standalone HTML document with embedded CSS
- Retro styling matching DOS Blue theme
- Monospace font, blue background, styled messages
- Viewable directly in browser

**Helper Methods:**

`download(content: string, filename: string, mimeType: string): void`
- Creates Blob from content string
- Generates object URL
- Triggers browser download via temporary `<a>` element
- Cleanup: removes element and revokes URL

`getFilename(session, format): string`
- Generates timestamped filename: `session-name_2025-10-29T23-45-30.md`

`getMimeType(format): string`
- Returns correct MIME type for each format

**Usage Pattern:**
```typescript
const content = ConversationExporter.exportSession(session, {
  format: 'markdown',
  includeTimestamps: true,
  includeMetadata: true
});
const filename = ConversationExporter.getFilename(session, 'md');
const mimeType = ConversationExporter.getMimeType('markdown');
ConversationExporter.download(content, filename, mimeType);
```

### hooks/useKeyboardShortcuts.ts (NEW v1.1.0)

Custom React hook providing keyboard shortcut functionality.

**Features:**
- Platform detection (macOS vs Windows/Linux)
- Single global event listener via event delegation
- Context-awareness (disables when typing in text inputs)
- 30+ shortcuts covering all major actions

**Platform Detection:**
```typescript
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modKey = isMac ? 'Meta' : 'Control';
```

**Shortcut Categories:**

**Core Actions:**
- `Enter` - Send message
- `${modKey}+L` - Clear conversation
- `${modKey}+E` - Export
- `${modKey}+,` - Settings
- `${modKey}+S` - Statistics

**Character Selection:**
- `${modKey}+]` / `${modKey}+[` - Cycle characters
- `${modKey}+1-5` - Direct character selection

**Theme Selection:**
- `Alt+]` / `Alt+[` - Cycle themes
- `Alt+1-5` - Direct theme selection

**Audio Controls:**
- `${modKey}+M` - Toggle mute
- `${modKey}+Shift+Q` - Cycle audio quality
- `${modKey}+0` - Stop audio

**Event Handler Pattern:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if typing in input/textarea
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Check modifiers and key combination
    if (e.key === 'l' && e[modKey + 'Key'] && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      onClearConversation();
    }
    // ... etc for all shortcuts
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [dependencies]);
```

**Benefits:**
- No library dependencies
- Minimal performance overhead (<1ms response)
- Prevents browser default behaviors where appropriate
- Respects user context (doesn't interfere with typing)

## Data Flow

### Greeting Sequence Flow

```
User enters name → handleNameSubmit()
                         ↓
    Promise.all([synthesizeSpeech(line1),
                 synthesizeSpeech(line2),
                 ...
                 synthesizeSpeech(line7)])
                         ↓
              Store in greetingAudio[]
                         ↓
              setIsGreeting(true)
                         ↓
         useEffect triggers on greetingIndex
                         ↓
    Display message → Play audio → Increment index
                         ↓
              (Repeat for all 7 lines)
                         ↓
         greetingIndex >= greetingLines.length
                         ↓
    setIsGreeting(false), setIsLoading(false)
```

### Conversation Flow

```
User submits input → handleUserInput()
                          ↓
            Add user message to messages[]
                          ↓
      ┌──────────────────┴───────────────────┐
      ↓                                      ↓
getDrSbaitsoResponse()              Add empty dr message
      ↓                                      ↓
Response text received              Typewriter effect
      ↓                              (40ms/char)
Check for glitch phrases                     ↓
      ↓                              Update message text
Play glitch sound (if match)                 ↓
      ↓                              Typing complete
synthesizeSpeech(response)                   ↓
      ↓                              Wait for audio
Audio generated ─────────────────────────────┤
                                             ↓
                                  Play audio with effects
                                             ↓
                                    setIsLoading(false)
```

## State Transitions

```
┌────────────────┐
│     INIT       │
│ userName=null  │
│ isLoading=true │
└──────┬─────────┘
       │ User enters name
       ↓
┌──────────────────────────┐
│    PREPARING_GREETING    │
│ isPreparingGreeting=true │
└──────┬───────────────────┘
       │ Audio generated
       ↓
┌──────────────────┐
│  GREETING        │
│ isGreeting=true  │
│ greetingIndex++  │
└──────┬───────────┘
       │ All lines played
       ↓
┌─────────────────┐
│    READY        │
│ isLoading=false │
└──────┬──────────┘
       │ User submits input
       ↓
┌────────────────┐
│   PROCESSING   │
│ isLoading=true │
└──────┬─────────┘
       │ Response complete
       ↓
┌────────────────┐
│  READY         │
└────────────────┘
```

---

## v1.11.0 Components and Systems

### components/VoiceInput.tsx - Voice Input UI Component

Real-time speech-to-text transcription using Web Speech API.

**Props:**
- `onTranscript: (text: string) => void` - Callback with final transcript
- `isDisabled?: boolean` - Disable voice input
- `theme?: ThemeColors` - Theme customization

**State:**
- `isListening: boolean` - Current listening status
- `interimTranscript: string` - Real-time partial transcript
- `finalTranscript: string` - Complete recognized text
- `isSupported: boolean` - Browser compatibility flag
- `error: string | null` - Error message if any

**Key Methods:**

#### startListening()
1. Checks `SpeechRecognition` API availability
2. Requests microphone permission
3. Initializes SpeechRecognition instance
4. Sets `continuous: true` for ongoing recognition
5. Attaches event listeners (result, error, end)
6. Calls `recognition.start()`

#### stopListening()
1. Calls `recognition.stop()`
2. Finalizes transcript
3. Calls `onTranscript` callback
4. Resets state

**Event Handlers:**
- `onresult`: Updates interim/final transcripts
- `onerror`: Handles permission denied, network errors
- `onend`: Auto-restart or finalize based on state

**Browser Support:**
- Chrome/Edge: Full support (WebKit Speech)
- Safari: Experimental support
- Firefox: Limited support
- Fallback: UI displays unsupported message

**Test Coverage**: 29 component tests, 7 E2E tests

---

### components/EmotionVisualizer.tsx - Emotion Analysis and Visualization

Analyzes and visualizes emotional content of conversations.

**Props:**
- `messages: Message[]` - Conversation messages to analyze
- `theme?: ThemeColors` - Theme customization

**State:**
- `emotionHistory: EmotionAnalysis[]` - Historical emotion data (max 50)
- `currentEmotion: EmotionType | null` - Dominant emotion
- `confidenceScore: number` - 0-100% confidence

**Key Methods:**

#### analyzeMessage(text: string): EmotionAnalysis
1. Calls `utils/emotionDetection.ts` for keyword analysis
2. Returns { dominant, confidence, scores: { joy, sadness, anger, fear, surprise } }
3. Updates `emotionHistory` array

#### renderTrendGraph()
1. Uses Canvas 2D API for chart rendering
2. Draws emotion lines over time (X: messages, Y: intensity)
3. Color-codes each emotion
4. Smooth interpolation between data points
5. Theme-aware colors

**Sub-Components:**
- `EmotionBadge`: Inline emotion indicator with emoji and label
- `EmotionTrendGraph`: Canvas-based line chart
- `EmotionStatistics`: Summary panel with progress bars

**Technical Details:**
- Canvas size: Responsive to container
- Update frequency: On every new message
- Max history: 50 messages (circular buffer)
- Render performance: <10ms per update

**Test Coverage**: 21 component tests, 9 E2E tests

---

### components/TopicFlowDiagram.tsx - D3.js Topic Visualization

Interactive force-directed graph showing conversation topics and transitions.

**Props:**
- `messages: Message[]` - Conversation messages
- `theme?: ThemeColors` - Theme customization

**State:**
- `topics: TopicNode[]` - Extracted topics with frequency
- `transitions: TopicTransition[]` - Topic flow connections
- `simulation: d3.ForceSimulation` - D3 physics simulation

**Key Methods:**

#### extractTopics(messages: Message[]): TopicNode[]
1. Calls `utils/topicAnalysis.ts` for NLP-style extraction
2. Identifies keywords and themes
3. Calculates frequency and sentiment
4. Returns array of TopicNode objects

#### renderForceGraph()
1. Creates SVG container with `d3.select()`
2. Defines force simulation:
   - `forceLink()`: Attracts connected nodes
   - `forceManyBody()`: Repels all nodes
   - `forceCenter()`: Centers graph
   - `forceCollide()`: Prevents overlap
3. Renders nodes (circles) and links (lines)
4. Attaches drag behavior
5. Starts simulation loop

**D3.js Integration:**
- Version: 7.9.0
- Forces: link, charge, center, collision
- Simulation ticks: 300 iterations
- Node radius: Based on frequency (10-50px)
- Link thickness: Based on transition count (1-5px)

**Interactivity:**
- Hover: Shows tooltip with topic details
- Drag: Repositions nodes
- Click: Highlights connections
- Pan/Zoom: SVG transform

**Performance:**
- Optimized for 100+ topics
- Lazy loading (code-split chunk: 64.63 KB)
- Update throttling: 60 FPS max
- SVG optimization: `shape-rendering="optimizeSpeed"`

**Test Coverage**: Component tests, 10 E2E tests

---

### components/ConversationTemplates.tsx - Template Management UI

Browse, search, and use conversation templates.

**Props:**
- `onTemplateSelect: (template: Template) => void` - Template selection callback
- `onClose: () => void` - Modal close callback

**State:**
- `templates: Template[]` - All available templates
- `filteredTemplates: Template[]` - Search results
- `searchQuery: string` - User search input
- `selectedCategory: string` - Category filter
- `selectedTemplate: Template | null` - Preview template
- `customValues: Record<string, string>` - Placeholder values

**Key Methods:**

#### loadTemplates()
1. Calls `utils/templateManager.ts` for default templates
2. Loads custom templates from localStorage
3. Merges and sorts by usage count

#### filterTemplates(query: string, category: string)
1. Filters by search query (name, tags, description)
2. Filters by category if selected
3. Updates `filteredTemplates` state

#### useTemplate(template: Template)
1. Replaces placeholders with custom values (e.g., {topic} → "anxiety")
2. Increments usage count
3. Calls `onTemplateSelect` callback
4. Closes modal

**Template Structure:**
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: 'therapy' | 'casual' | 'technical' | 'creative' | 'educational' | 'custom';
  tags: string[];
  prompts: string[]; // Multi-turn conversation
  placeholders: string[]; // e.g., ['topic', 'name']
  usageCount: number;
  created: number;
  updated: number;
}
```

**UI Components:**
- `TemplateGrid`: Card grid with hover effects
- `TemplatePreview`: Full template display with placeholder inputs
- `SearchBar`: Real-time filtering
- `CategoryFilter`: Toggle buttons for categories

**Test Coverage**: Component tests, 13 E2E tests

---

### utils/emotionDetection.ts - Emotion Analysis Engine

Keyword-based emotion detection with confidence scoring.

**Exports:**
- `detectEmotions(text: string): EmotionAnalysis`
- `getEmotionColor(emotion: EmotionType, theme: ThemeColors): string`

**Emotion Keywords:**
```typescript
const EMOTION_KEYWORDS = {
  joy: ['happy', 'excited', 'great', 'wonderful', 'love', 'amazing', ...],
  sadness: ['sad', 'depressed', 'hopeless', 'lonely', 'miserable', ...],
  anger: ['angry', 'furious', 'annoyed', 'frustrated', 'hate', ...],
  fear: ['afraid', 'scared', 'anxious', 'worried', 'terrified', ...],
  surprise: ['surprised', 'shocked', 'amazed', 'astonished', ...]
};
```

**Algorithm:**
1. Tokenize text (lowercase, split by words)
2. For each emotion, count matching keywords
3. Apply weighting (2x for exclamation marks, 1.5x for capitalization)
4. Calculate confidence: `(matches / totalWords) * 100`
5. Identify dominant emotion (highest score)
6. Return EmotionAnalysis object

**Enhancements:**
- Emoji detection: Converts emojis to emotion scores
- Intensity analysis: Punctuation and capitalization affect confidence
- Context awareness: Negations reduce scores (e.g., "not happy")

**Performance**: <10ms per message

**Test Coverage**: Unit tests for all emotion types, edge cases

---

### utils/topicAnalysis.ts - Topic Extraction and Analysis

NLP-style topic identification and relationship tracking.

**Exports:**
- `analyzeTopics(messages: Message[]): ConversationAnalysis`
- `getTopicColor(sentiment: number, theme: ThemeColors): string`
- `formatTopicName(topic: string): string`

**Topic Extraction Algorithm:**
1. Tokenize all messages
2. Remove stop words (the, a, is, etc.)
3. Identify noun phrases and keywords
4. Calculate term frequency (TF)
5. Weight by inverse document frequency (IDF-like)
6. Extract top N topics (typically 10-20)

**Transition Detection:**
1. For each message pair, identify topics mentioned
2. Create directed edge from topic A to topic B
3. Increment transition count for edge
4. Build adjacency list of topic relationships

**Sentiment Analysis:**
1. For each topic occurrence, analyze surrounding words
2. Apply sentiment scores (positive/negative keywords)
3. Average sentiment across all occurrences
4. Map to color: green (positive), yellow (neutral), red (negative)

**Output:**
```typescript
interface ConversationAnalysis {
  topics: Array<{
    name: string;
    frequency: number;
    sentiment: number; // -1 to 1
  }>;
  transitions: Array<{
    from: string;
    to: string;
    count: number;
  }>;
  dominant: string;
}
```

**Performance**: <100ms for 100 messages

**Test Coverage**: Unit tests for extraction, transitions, sentiment

---

### utils/templateManager.ts - Template Data Management

Manages conversation templates with persistence and search.

**Exports:**
- `TemplateManager.getDefaultTemplates(): Template[]`
- `TemplateManager.searchTemplates(query: string): Template[]`
- `TemplateManager.getTemplatesByCategory(category: string): Template[]`
- `TemplateManager.incrementUsage(templateId: string): void`
- `TemplateManager.saveCustomTemplate(template: Template): void`

**Default Templates** (10+ included):
1. **Anxiety Relief** (Therapy): "I'm feeling anxious about {topic}..."
2. **Daily Reflection** (Casual): "I want to reflect on my day..."
3. **Debug Session** (Technical): "I'm stuck on a {language} problem..."
4. **Story Brainstorm** (Creative): "Help me brainstorm a story about {character}..."
5. **Learning Path** (Educational): "I want to learn about {subject}..."
6. [Additional templates in constants]

**LocalStorage Schema:**
```json
{
  "customTemplates": [...],
  "templateUsage": {
    "template-id": 42
  }
}
```

**Search Implementation:**
1. Fuzzy matching on name, description, tags
2. Weighted scoring (name: 3x, tags: 2x, description: 1x)
3. Sort by relevance score
4. Return top N results

**Test Coverage**: Unit tests for CRUD operations, search, usage tracking

---

### utils/performanceProfiler.ts - Performance Monitoring

Tracks Core Web Vitals, memory usage, and custom metrics.

**Exports:**
- `PerformanceProfiler.start(label: string): void`
- `PerformanceProfiler.end(label: string): void`
- `PerformanceProfiler.mark(name: string): void`
- `PerformanceProfiler.measure(name: string, startMark: string, endMark: string): void`
- `PerformanceProfiler.measureFn<T>(label: string, fn: () => T): T`
- `PerformanceProfiler.measureAsyncFn<T>(label: string, fn: () => Promise<T>): Promise<T>`
- `PerformanceProfiler.generateReport(): PerformanceReport`

**Tracked Metrics:**
- **Core Web Vitals**:
  - FCP (First Contentful Paint): Target <1.8s
  - LCP (Largest Contentful Paint): Target <2.5s
  - TTFB (Time to First Byte): Target <600ms
  - CLS (Cumulative Layout Shift): Target <0.1
  - FID (First Input Delay): Target <100ms
- **Memory**:
  - Heap size (used, total, limit)
  - Allocation rate
  - GC frequency
- **Custom Timings**:
  - Component render time
  - API call duration
  - Audio processing time

**Usage Example:**
```typescript
// Sync function profiling
PerformanceProfiler.start('render-chart');
renderEmotionChart();
PerformanceProfiler.end('render-chart');

// Async function profiling
const data = await PerformanceProfiler.measureAsyncFn('fetch-data', async () => {
  return await fetch('/api/data');
});

// Generate report
const report = PerformanceProfiler.generateReport();
console.log(report);
```

**Report Format:**
```typescript
interface PerformanceReport {
  coreWebVitals: {
    fcp: number;
    lcp: number;
    ttfb: number;
    cls: number;
    fid: number;
  };
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  customMetrics: Array<{
    label: string;
    duration: number;
    count: number;
    average: number;
    min: number;
    max: number;
  }>;
}
```

**Test Coverage**: Unit tests for all profiling methods

---

### components/ErrorBoundary.tsx - React Error Boundary

Catches React component errors and displays fallback UI.

**Props:**
- `children: React.ReactNode` - Components to wrap
- `fallback?: React.ReactNode` - Custom error UI

**State:**
- `hasError: boolean` - Error occurred flag
- `error: Error | null` - Caught error object
- `errorInfo: React.ErrorInfo | null` - Component stack trace

**Lifecycle:**

#### componentDidCatch(error, errorInfo)
1. Logs error to console (production: send to error tracking service)
2. Updates state with error details
3. Renders fallback UI

#### resetError()
1. Clears error state
2. Attempts to re-render children
3. User can manually reset via UI button

**Fallback UI:**
- Retro-themed error screen matching app design
- Error message display
- Component stack trace (development only)
- "Reset" button to attempt recovery
- "Report Issue" link to GitHub

**Error Logging:**
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Development: Console logging
  console.error('Error caught by boundary:', error, errorInfo);

  // Production: Send to error tracking (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    // logErrorToService(error, errorInfo);
  }

  this.setState({ hasError: true, error, errorInfo });
}
```

**Test Coverage**: Component tests for error catching, reset functionality

---

### public/sw.js - Service Worker

Provides offline support and asset caching.

**Cache Strategies:**

1. **Static Assets** (HTML, CSS, JS, Images):
   - Strategy: Cache-First
   - TTL: 1 week
   - Update: On service worker update

2. **API Responses**:
   - Strategy: Network-First with Cache Fallback
   - TTL: 5 minutes
   - Fallback: Cached response if offline

3. **Runtime Cache**:
   - Strategy: Stale-While-Revalidate
   - Max Entries: 50
   - Max Age: 1 day

**Cache Versioning:**
```javascript
const CACHE_VERSION = 'v1.11.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
```

**Lifecycle:**

#### install event
1. Opens static cache
2. Pre-caches critical assets (index.html, CSS, JS bundles)
3. Calls `self.skipWaiting()` to activate immediately

#### activate event
1. Deletes old cache versions
2. Calls `self.clients.claim()` to take control immediately

#### fetch event
1. Checks cache strategy for request type
2. Serves from cache or network based on strategy
3. Updates cache with network response (background)

**Offline Support:**
- Offline page: `offline.html` (cached during install)
- API fallback: Returns cached data or offline message
- Asset fallback: Serves from cache if available

**Browser Support:**
- Chrome 40+, Firefox 44+, Safari 11.1+, Edge 17+
- Graceful degradation: App works without service worker

**Test Coverage**: E2E tests for offline functionality

---

## Updated System Architecture (v1.11.0)

```
┌───────────────────────────────────────────────────────────────────────┐
│                            App.tsx (Enhanced)                         │
│  ┌────────────┬──────────────┬──────────────┬───────────────────────┐│
│  │ Name Entry │ Char Select  │  Greeting    │   Conversation        ││
│  │            │ + Theme      │  Sequence    │   + Voice Input       ││
│  │            │              │              │   + Emotion Viz       ││
│  │            │              │              │   + Topic Diagram     ││
│  │            │              │              │   + Templates         ││
│  └────────────┴──────────────┴──────────────┴───────────────────────┘│
└─────┬────────┬─────────┬─────────┬──────────┬───────────┬────────────┘
      │        │         │         │          │           │
┌─────▼───┐ ┌─▼───────┐┌▼───────┐┌▼────────┐┌▼─────────┐┌▼──────────┐
│constants│ │ gemini  ││ audio  ││session  ││keyboard  ││NEW v1.11.0│
│5 chars  │ │ Service ││ utils  ││Manager  ││shortcuts ││components │
│5 themes │ │Multi-ch ││Config  ││Storage  ││30+ keys  ││           │
│4 presets│ │Chat Map ││Quality ││Stats    ││Ctrl/Cmd  ││VoiceInput │
└─────────┘ └─────────┘│Presets │└───┬─────┘└──────────┘│EmotionViz │
                       └────────┘    │                   │TopicFlow  │
                                 ┌───▼────┐              │Templates  │
                                 │ Export │              │ErrorBound │
                                 │4 Format│              └───────────┘
                                 │MD/TXT/ │
                                 │JSON/   │         ┌────────────────┐
                                 │HTML    │         │ NEW v1.11.0    │
                                 └────────┘         │ Utils          │
                                                    │                │
                                                    │emotionDetection│
                                                    │topicAnalysis   │
                                                    │templateManager │
                                                    │performProfiler │
                                                    └────────────────┘

                                              ┌──────────────────────┐
                                              │ Service Worker       │
                                              │ (public/sw.js)       │
                                              │                      │
                                              │ Cache Strategies:    │
                                              │ - Static: Cache-First│
                                              │ - API: Network-First │
                                              │ - Runtime: SWR       │
                                              └──────────────────────┘
```

---

```

## Performance Considerations

### Concurrent Operations

1. **Greeting Audio Pre-generation**: All 7 greeting audio chunks generated in parallel before greeting starts
2. **Response Processing**: Typewriter effect runs concurrently with TTS API call
3. **Audio Streaming**: Audio plays immediately after generation without blocking UI

### Memory Management

- AudioContext: Singleton instance, never recreated
- Audio nodes: Disconnected after playback completes (garbage collection)
- ScriptProcessorNode: Legacy API, potential memory leak on long sessions

### React StrictMode Guards

`playingGreetingIndexRef` prevents double audio playback during development:
```javascript
if (playingGreetingIndexRef.current !== greetingIndex) {
  playingGreetingIndexRef.current = greetingIndex;
  // Play audio
}
```

## Browser Compatibility

### Required APIs
- Web Audio API (AudioContext, ScriptProcessorNode)
- AudioContext.resume() for autoplay policy compliance
- atob() for base64 decoding
- ES2022 features (async/await, optional chaining)

### Known Limitations
- ScriptProcessorNode deprecated (future: migrate to AudioWorklet)
- Autoplay policy requires user interaction before audio plays
- Safari requires webkitAudioContext fallback
- Mobile browsers may have different sample rate support

## Type System

```typescript
// types.ts
interface Message {
  author: 'user' | 'dr';
  text: string;
}
```

Simple message model supports bi-directional conversation display.

## Future Architecture Improvements

1. **AudioWorklet Migration**: Replace ScriptProcessorNode for better performance
2. **State Management**: Extract to Context API or Zustand for better separation
3. **Message Streaming**: Add real-time streaming for longer responses
4. **Audio Caching**: Cache common phrases to reduce TTS API calls
5. **Error Recovery**: Implement retry logic for failed API calls
6. **Accessibility**: Add ARIA labels and keyboard navigation
