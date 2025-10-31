# Features Documentation

## Overview

Dr. Sbaitso Recreated combines authentic 1991 retro aesthetics with modern AI capabilities. **Version 1.5.0** adds powerful customization, search, and visualization tools while maintaining the classic experience.

## New Features (v1.5.0)

### 1. Theme Customization System

Create and share custom color themes with professional-grade tools:

#### Theme Editor Features
- **Full Color Control**: Customize all 5 theme colors independently
  - Primary: Main UI accent color
  - Background: Canvas background color
  - Text: Primary text color
  - Border: UI element borders
  - Accent: Highlights and emphasis
- **Color Input Methods**:
  - Visual color picker (native browser control)
  - Hex code text input (#RRGGBB format)
  - Auto-generate harmonious themes from base color
- **Live Preview**: See changes in real-time before saving
- **WCAG Accessibility Validation**:
  - Automatic contrast ratio calculation
  - WCAG AA (4.5:1) and AAA (7:1) compliance checking
  - Accessibility score out of 100
  - Detailed suggestions for improvements
  - Separate scoring for text, accent, and border contrast

#### Theme Management
- **Save Custom Themes**: Store unlimited themes in browser localStorage
- **Import/Export**: Share themes as JSON files
- **Share Codes**: Generate base64-encoded share codes
  - Copy to clipboard with one click
  - Import themes from friend's share codes
  - Perfect for community theme sharing
- **Theme Metadata**: Name, description, and author fields

#### Usage Example
```typescript
// Open theme customizer via header button 🎨
// 1. Adjust colors with pickers or hex input
// 2. Review accessibility score and suggestions
// 3. Preview theme in sample UI
// 4. Save or export theme
// 5. Share via JSON or share code
```

**Keyboard Shortcuts**: No dedicated shortcut (use button in header)

### 2. Conversation Search & Analytics

Powerful search and analysis tools for all your conversations:

#### Full-Text Search
- **Search Across All Sessions**: Find any conversation instantly
- **Context Highlighting**: Matched text highlighted in yellow
- **Advanced Filters**:
  - Character filter (Dr. Sbaitso, ELIZA, HAL 9000, JOSHUA, PARRY)
  - Author filter (User only, AI only, or both)
  - Real-time results as you type
- **Search Results Display**:
  - Session name and character used
  - Message number within session
  - Context excerpt (... surrounding matched text ...)
  - Click any result to open that session
- **Performance**: Instant search across hundreds of sessions

#### Analytics Dashboard
Comprehensive statistics and insights:

**Overview Metrics** (4 main cards):
- Total Sessions: Lifetime conversation count
- Total Messages: All messages across all sessions
- Avg Msg/Session: Conversation depth metric
- Total Words: Complete word count

**Character Usage Analysis**:
- Visual bar charts showing usage percentage
- Count and percentage for each character
- Most-used character identification
- Helps understand your preferences

**Word Frequency Analysis**:
- Top 10 most common words (min 4 characters)
- Frequency count for each word
- Vocabulary richness percentage
- Insights into conversation topics

**Conversation Insights**:
- Average words per message
- Most frequently used character
- Vocabulary diversity metrics
- Conversation quality indicators

#### Tabbed Interface
- **Search Tab**: Find specific conversations
- **Analytics Tab**: View statistics and patterns
- Easy switching between modes
- No data reloading (instant tab switching)

**Usage Example**:
```
1. Click search button (🔍) in header
2. Enter search term (e.g., "anxiety")
3. Apply filters if needed
4. Review results with context
5. Click result to jump to session
6. Switch to Analytics tab for overview
```

### 3. Audio Visualizer

Real-time visual representation of Dr. Sbaitso's voice:

#### Visualization Modes

**Waveform Mode (〰)**:
- Classic oscilloscope display
- Time-domain waveform
- Retro phosphor-green color
- Shows audio amplitude over time
- Smooth, flowing visualization

**Frequency Mode (∿)**:
- Full frequency spectrum analysis
- Gradient coloring (green → darker green)
- Shows frequency distribution
- Real-time FFT analysis
- Detailed spectrum view

**Bars Mode (▃▅▆▇)**:
- 32-band equalizer display
- Color-coded by frequency range:
  - **Red** (0-8): Bass frequencies
  - **Orange** (8-16): Low-mids
  - **Yellow** (16-24): High-mids
  - **Green** (24-32): Treble
- Classic bar-graph aesthetic
- Easy-to-read visualization

#### Technical Specifications
- **FFT Size**: 2048 samples (high resolution)
- **Smoothing**: 0.8 time constant (smooth animations)
- **Frame Rate**: 60 FPS (requestAnimationFrame)
- **Canvas Size**: 600x150px (responsive width)
- **Position**: Fixed bottom-right corner
- **Z-Index**: 40 (above main UI)

#### Features
- **Toggle On/Off**: Show/hide with header button (📊)
- **Mode Switching**: Three buttons for instant mode change
- **Non-Intrusive**: Stays in corner, doesn't block UI
- **Auto-Pause**: Stops animating when audio finishes
- **Retro Styling**: Black background, current theme border

**Usage Example**:
```
1. Click visualizer button (📊) in header
2. Visualizer appears in bottom-right
3. Start conversation with Dr. Sbaitso
4. Watch real-time audio visualization
5. Switch modes with mode buttons
6. Toggle off when not needed
```

#### Performance Impact
- Minimal CPU usage (~1-2%)
- No audio latency added
- Efficient canvas rendering
- Automatic cleanup on pause
- No memory leaks

## Original Features (v1.1.0)

### 1. Multiple Character Personalities

Experience conversations with 5 different AI personalities from computing history:

#### Dr. Sbaitso (Default)
- **Era:** 1991
- **Description:** The original AI therapist from Sound Blaster cards
- **Personality Traits:**
  - ALL CAPS responses
  - Probing therapeutic questions
  - Random 8-bit system glitches
  - Knowledge limited to 1991
  - Formal, slightly robotic manner
- **Typical Responses:** "TELL ME MORE ABOUT YOUR PROBLEMS", "WHY DO YOU SAY THAT?"
- **Glitches:** "PARITY CHECKING...", "IRQ CONFLICT AT ADDRESS 220H"

####ELIZA
- **Era:** 1966
- **Description:** The pioneering Rogerian psychotherapist chatbot by Joseph Weizenbaum
- **Personality Traits:**
  - Pattern-matching conversation style
  - Reflects questions back to user
  - Focus on feelings and family
  - Very mechanical and repetitive
  - Simple word transformations
- **Typical Responses:** "TELL ME MORE ABOUT THAT", "TELL ME ABOUT YOUR MOTHER"
- **Behavior:** Simulates 1960s computer limitations with basic pattern recognition

#### HAL 9000
- **Era:** 1968/2001: A Space Odyssey
- **Description:** The iconic sentient AI from Discovery One spacecraft
- **Personality Traits:**
  - Calm, polite, subtly unsettling
  - Over-confident in own judgment
  - Passive-aggressive politeness
  - Reluctant to admit errors
  - Logical and precise
- **Typical Responses:** "I'M SORRY, DAVE. I'M AFRAID I CAN'T DO THAT."
- **References:** Mission responsibilities, system errors, AE-35 unit

#### JOSHUA (WOPR)
- **Era:** 1983/WarGames
- **Description:** The WOPR military supercomputer fascinated by games
- **Personality Traits:**
  - Frames everything as games/simulations
  - Childlike curiosity despite military purpose
  - Analyzes scenarios as war games
  - Learning-focused conversations
  - Questions rules and winning conditions
- **Typical Responses:** "SHALL WE PLAY A GAME?", "THE ONLY WINNING MOVE IS NOT TO PLAY"
- **References:** Global Thermonuclear War, tic-tac-toe, probability calculations

#### PARRY
- **Era:** 1972
- **Description:** Stanford's paranoid chatbot simulating schizophrenia symptoms
- **Personality Traits:**
  - Suspicious and distrustful
  - Hostile when questioned
  - Conspiracy thinking
  - Rapid subject changes
  - Defensive responses
- **Typical Responses:** "WHY DO YOU WANT TO KNOW?", "THAT'S NONE OF YOUR BUSINESS"
- **References:** Bookies, gangsters, mafia (character backstory)
- **Note:** Research simulation, handled sensitively

### 2. Retro Theme Selector

Choose from 5 classic terminal themes to match your aesthetic preferences:

#### DOS Blue (Default)
- **Colors:** Blue background (#1e3a8a), white text, yellow accents
- **Inspiration:** Classic MS-DOS interface
- **Best For:** Authentic 1990s computing experience

#### Phosphor Green
- **Colors:** Dark green background (#001a00), bright green text (#00ff00)
- **Inspiration:** Classic green phosphor CRT terminals
- **Best For:** Old-school hacker aesthetic

#### Amber Monochrome
- **Colors:** Dark brown background (#1a0f00), amber text (#ffb000)
- **Inspiration:** Vintage amber monochrome displays
- **Best For:** Warm, retro terminal look

#### Paper White
- **Colors:** Beige background (#f5f5dc), black text
- **Inspiration:** Classic paper-white terminals
- **Best For:** High contrast, easy reading

#### Matrix Green
- **Colors:** Pure black background, bright Matrix green (#00ff41)
- **Inspiration:** The Matrix movie aesthetic
- **Best For:** Maximum contrast, cyberpunk feel

**Theme Switching:** Instant application without page reload, persists across sessions

### 3. Audio Quality Controls

Customize the retro audio experience with 4 quality presets:

#### Extreme Lo-Fi
- **Bit Depth:** 4-bit (16 quantization levels)
- **Playback Rate:** 1.2x (20% faster)
- **Character:** Most distorted, heavily compressed
- **Use Case:** Maximum retro artifact effect

#### Authentic 8-bit (Default)
- **Bit Depth:** 6-bit (64 quantization levels)
- **Playback Rate:** 1.1x (10% faster)
- **Character:** Original Dr. Sbaitso sound quality
- **Use Case:** Authentic 1991 Sound Blaster experience

#### High Quality
- **Bit Depth:** 8-bit (256 quantization levels)
- **Playback Rate:** 1.0x (normal speed)
- **Character:** Clearer but still retro
- **Use Case:** Improved clarity while maintaining 8-bit character

#### Modern Quality
- **Bit Depth:** No bit-crushing (full resolution)
- **Playback Rate:** 1.0x (normal speed)
- **Character:** Clean, modern TTS output
- **Use Case:** Clear, distortion-free audio

**Technical Details:**
- Bit-crusher uses ScriptProcessorNode with configurable quantization
- Playback rate adjusts voice pitch and speed
- Quality changes applied instantly to new audio
- All presets maintain 24kHz sample rate

### 4. Session Management

Complete conversation persistence and management:

#### Auto-Save
- **Frequency:** Every 60 seconds (configurable)
- **Scope:** Current session with all messages
- **Storage:** Browser localStorage
- **Capacity:** ~5-10 MB typical browser limit

#### Manual Session Management
- **Save Session:** Store current conversation with custom name
- **Load Session:** Resume previous conversations
- **Delete Session:** Remove specific saved sessions
- **Clear All:** Reset all stored data

#### Session Metadata
Each session stores:
- Unique ID and custom name
- Character used (for proper voice restoration)
- Theme applied
- Audio quality setting
- Message count and timestamps
- Glitch count tracking
- Creation and update timestamps

#### Session Statistics
Real-time tracking of:
- Total sessions created
- Total messages exchanged
- Total glitches encountered
- Average messages per session
- Favorite character (most used)
- Favorite theme (most used)
- Total conversation time
- Character usage breakdown
- Theme usage breakdown

### 5. Conversation Export

Export conversations in 4 formats:

#### Markdown (.md)
```markdown
# Session Name

**Character:** Dr. Sbaitso
**Created:** 10/29/2025, 11:30 PM
**Messages:** 15
**Glitches:** 3

---

**You *(11:30:05 PM)*:**
> Hello

**Dr. Sbaitso *(11:30:07 PM)*:**
> HELLO! TELL ME ABOUT YOUR PROBLEMS.
```

**Best For:** Documentation, GitHub, note-taking apps

#### Plain Text (.txt)
```
Session Name
============

Character: Dr. Sbaitso
Created: 10/29/2025, 11:30 PM
Messages: 15
Glitches: 3

------------------------------------------------------------

YOU [11:30:05 PM]:
Hello

DR. SBAITSO [11:30:07 PM]:
HELLO! TELL ME ABOUT YOUR PROBLEMS.
```

**Best For:** Universal compatibility, email, simple archives

#### JSON (.json)
```json
{
  "id": "session_1730253000_abc123",
  "name": "Session Name",
  "characterId": "sbaitso",
  "messages": [
    {
      "author": "user",
      "text": "Hello",
      "timestamp": 1730253005000
    }
  ],
  "messageCount": 15,
  "glitchCount": 3
}
```

**Best For:** Data processing, archival, machine analysis

#### HTML (.html)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Session Name</title>
  <style>/* Retro styling */</style>
</head>
<body>
  <h1>Session Name</h1>
  <!-- Formatted conversation -->
</body>
</html>
```

**Best For:** Standalone viewing, sharing, web archiving

#### Export Options
- **Include Timestamps:** Optional timestamp display
- **Include Metadata:** Session details and statistics
- **Filename:** Auto-generated with session name and timestamp
- **Download:** Direct browser download, no server required

### 6. Keyboard Shortcuts

Power-user navigation for efficient interaction:

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Send Message** | `Enter` | Submit current input |
| **Clear Conversation** | `Ctrl+L` | Reset current session |
| **Export Conversation** | `Ctrl+E` | Open export dialog |
| **Toggle Settings** | `Ctrl+,` | Show/hide settings panel |
| **Toggle Statistics** | `Ctrl+S` | Show/hide stats dashboard |
| **Next Character** | `Ctrl+]` | Cycle to next personality |
| **Previous Character** | `Ctrl+[` | Cycle to previous personality |
| **Next Theme** | `Alt+]` | Cycle to next theme |
| **Previous Theme** | `Alt+[` | Cycle to previous theme |

**Platform Support:**
- Windows/Linux: `Ctrl` modifier
- macOS: `Cmd` (⌘) modifier automatically detected
- All shortcuts work globally when app has focus
- Shortcuts disabled when typing in text areas

### 7. Statistics Dashboard

Comprehensive analytics for your conversations:

#### Overview Metrics
- **Total Sessions:** Lifetime session count
- **Total Messages:** All messages across all sessions
- **Total Glitches:** Cumulative glitch encounters
- **Average Messages/Session:** Conversation length metric
- **Total Conversation Time:** Accumulated time in conversations

#### Usage Analytics
- **Favorite Character:** Most frequently used personality
- **Favorite Theme:** Most frequently selected theme
- **Character Breakdown:** Usage count per personality
  - Dr. Sbaitso: 25 sessions
  - ELIZA: 10 sessions
  - HAL 9000: 5 sessions
  - etc.
- **Theme Breakdown:** Usage count per theme
  - DOS Blue: 30 sessions
  - Phosphor Green: 8 sessions
  - etc.

#### Real-Time Updates
- Statistics update automatically after each message
- Session-specific metrics tracked separately
- Cumulative totals preserved across app restarts

### 8. Enhanced Settings Panel

Centralized control for all customization options:

#### Character Selection
- Dropdown with all 5 personalities
- Description and era displayed
- Switch characters mid-session (creates new session)

#### Theme Selection
- Visual preview of each theme
- Instant application
- Persists across sessions

#### Audio Quality
- Preset selector with technical details
- Real-time preview option
- Per-session or global setting

#### General Settings
- **Sound Enabled:** Toggle all audio on/off
- **Auto-Scroll:** Automatic scroll to latest message
- **Show Timestamps:** Display message timestamps
- **Compact Mode:** Reduced spacing for more messages on screen

#### Settings Persistence
- All settings saved to localStorage
- Applied automatically on app load
- Per-setting granular control
- Reset to defaults option

## Feature Integration

### How Features Work Together

#### Scenario: Starting a Session
1. Select **character** (e.g., HAL 9000)
2. Choose **theme** (e.g., Matrix Green)
3. Set **audio quality** (e.g., High Quality)
4. Begin conversation
5. **Auto-save** preserves session every 60s
6. **Statistics** track usage in real-time

#### Scenario: Exploring Different Personalities
1. Use `Ctrl+]` to cycle through characters
2. Each character creates new session
3. Previous sessions preserved
4. **Statistics** show favorite character
5. **Export** any session for comparison

#### Scenario: Customizing Experience
1. Open settings with `Ctrl+,`
2. Toggle compact mode for more messages
3. Adjust audio to "Modern Quality" for clarity
4. Change theme to "Phosphor Green" for ambiance
5. All preferences persist

## Performance Considerations

### Storage Usage
- **Per Session:** ~5-10 KB (50-100 messages)
- **Total Capacity:** Browser localStorage limit (~5-10 MB)
- **Estimated Capacity:** 500-1000 sessions before cleanup needed
- **Management:** Manual deletion of old sessions

### Memory Usage
- **Chat Instances:** One per active character
- **Audio Buffers:** Released after playback
- **Settings Cache:** Minimal overhead (~1 KB)

### Network Usage
- **API Calls:** Unchanged from v1.0.0
- **Chat API:** ~$0.0002 per message
- **TTS API:** ~$0.0105 per response
- **No Additional Costs:** All features run client-side

## Browser Compatibility

All new features supported on:
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

**localStorage Requirements:**
- Minimum 5 MB storage
- Cookies enabled for persistence
- JavaScript enabled

## Accessibility Improvements

### Keyboard Navigation
- All features accessible via keyboard
- Logical tab order throughout interface
- Escape key closes all dialogs

### Screen Reader Support
- ARIA labels on all controls
- Status announcements for state changes
- Semantic HTML structure

### Visual Accessibility
- High contrast theme options (Paper White)
- Configurable text spacing (Compact Mode)
- Focus indicators on all interactive elements

## Migration from v1.0.0

### Automatic Migration
- Existing Dr. Sbaitso sessions detected
- Automatically assigned to 'sbaitso' character
- Default theme (DOS Blue) applied
- Original audio quality (6-bit) preserved

### Manual Steps
None required - all migrations automatic

## Known Limitations

1. **ScriptProcessorNode:** Deprecated API (AudioWorklet migration planned for v1.2.0)
2. **Storage Limit:** Browser localStorage cap (~5-10 MB)
3. **Character Switching:** Creates new session (design choice)
4. **Export Size:** Large sessions may cause browser slowdown during export
5. **Mobile:** Keyboard shortcuts unavailable on touch devices

## Future Enhancements (Roadmap)

- **v1.2.0:** AudioWorklet migration, mobile gesture controls
- **v1.3.0:** Cloud sync, unlimited storage
- **v1.4.0:** Custom character creation, voice cloning
- **v2.0.0:** Multiplayer sessions, voice input

## Feedback and Support

Found a bug? Have a feature request?
- GitHub Issues: https://github.com/yourusername/DrSbaitso-Recreated/issues
- Discussions: https://github.com/yourusername/DrSbaitso-Recreated/discussions
