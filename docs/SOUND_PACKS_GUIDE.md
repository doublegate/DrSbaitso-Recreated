# Sound Packs Guide

## Overview

Custom Sound Packs allow you to create, install, and share personalized sound effects for Dr. Sbaitso. Replace default system sounds with your own recordings, creating unique audio experiences that match your style.

## Features

- **Audio Recording**: Record directly from microphone
- **Event Triggers**: Map sounds to 5 conversation events
- **Pack Management**: Install, load, and unload multiple packs
- **Share System**: Generate codes to share packs with friends
- **Storage**: localStorage persistence (~5MB capacity)
- **Validation**: Automatic format and quality checks

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a Sound Pack](#creating-a-sound-pack)
3. [Managing Sound Packs](#managing-sound-packs)
4. [Sharing Sound Packs](#sharing-sound-packs)
5. [Sound Pack Format](#sound-pack-format)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing Sound Pack Tools

1. **Start a Conversation**: Enter your name and begin chatting
2. **Open Sound Pack Manager**: Click the 🎼 button in toolbar (or press `Ctrl+Shift+P`)
3. **Choose Action**:
   - **Create New Pack**: Click "➕ Create New Pack"
   - **Browse Installed**: View your existing packs
   - **Install from Code**: Click "📥 Install from Share Code"

### System Requirements

- **Browser**: Chrome 90+, Edge 90+, Firefox 88+, Safari 14+
- **Microphone**: Required for recording sounds
- **Storage**: ~100KB - 2MB per sound pack
- **Permissions**: Microphone access (will prompt on first use)

---

## Creating a Sound Pack

### Step 1: Open Sound Pack Creator

From the Sound Pack Manager, click "➕ Create New Pack" button.

### Step 2: Pack Metadata

Fill in the required information:

- **Pack Name** (required): Unique identifier (e.g., "Retro Arcade Sounds")
- **Author**: Your name or alias
- **Version**: Semantic versioning (e.g., "1.0.0")
- **Description**: Brief description of your pack
- **Tags**: Keywords for categorization (comma-separated)

**Example**:
```
Name: Sci-Fi Terminal
Author: RetroEnthusiast
Version: 1.0.0
Description: Futuristic computer sounds inspired by 80s sci-fi movies
Tags: sci-fi, terminal, futuristic, beep, computer
```

### Step 3: Recording Sounds

#### Starting a Recording
1. Click "🎤 Record New Sound" button
2. **Grant Microphone Permission** (browser will prompt)
3. Recording automatically starts (max 2 seconds)
4. **Waveform** displays live audio input
5. Recording stops automatically after 2 seconds

#### During Recording
- Speak clearly into microphone
- Keep consistent distance (6-12 inches)
- Avoid background noise
- Watch waveform for clipping (red indicators)

#### After Recording
1. **Preview**: Click ▶ to hear your recording
2. **Accept**: If satisfied, fill in sound details:
   - **Sound Name**: Descriptive name (e.g., "Laser Beep")
   - **Volume**: 0-100% (default: 70%)
3. **Add to Pack**: Sound appears in "Recorded Sounds" list

#### Re-recording
- Don't like the sound? Simply record again
- Previous recording is discarded
- No limit on attempts

### Step 4: Event Triggers

Map sounds to conversation events:

#### Available Events

1. **message-send** 📤
   - Triggered when user sends a message
   - Best for: Click sounds, confirmation beeps

2. **message-receive** 📥
   - Triggered when Dr. Sbaitso responds
   - Best for: Notification sounds, alert beeps

3. **error** ⚠️
   - Triggered on system errors
   - Best for: Harsh buzzes, warning sounds

4. **glitch** ⚡
   - Triggered for Dr. Sbaitso glitch messages
   - Best for: Static, distortion, digital noise

5. **keypress** ⌨️
   - Triggered on every keystroke (optional, disabled by default)
   - Best for: Mechanical keyboard clicks, typing sounds

#### Adding a Trigger

1. Select sound from dropdown (sounds you've recorded)
2. Choose event type
3. Set probability (0-100%)
   - 100% = Plays every time
   - 50% = Plays half the time (randomized)
   - 25% = Occasional variation
4. Click "Add Trigger"

**Example Trigger Setup**:
```
Sound: "Laser Beep" → Event: message-send → Probability: 100%
Sound: "Computer Blip" → Event: message-receive → Probability: 80%
Sound: "Error Buzz" → Event: error → Probability: 100%
Sound: "Digital Glitch" → Event: glitch → Probability: 100%
Sound: "Key Click" → Event: keypress → Probability: 20%
```

**Tip**: Use lower probabilities (20-50%) for keypress to avoid overwhelming repetition.

### Step 5: Save Sound Pack

1. Review all sounds and triggers
2. Check pack size (displayed at top: "~XXX KB")
3. Click "💾 Save Sound Pack"
4. Pack is saved to localStorage
5. Creator closes automatically

**Maximum Recommended Size**: 2MB per pack (to stay within localStorage limits)

---

## Managing Sound Packs

### Viewing Installed Packs

The Sound Pack Manager shows all installed packs in a grid:

- **Pack Card** displays:
  - Name and author
  - Version and sound/trigger counts
  - Description
  - Tags
- **Currently Active Pack** highlighted with green indicator

### Loading a Pack

1. Click on any pack card to select it
2. Click "▶ Load" button in the card
3. Pack loads immediately (sounds cached)
4. Active indicator appears
5. Sounds now trigger during conversations

**Only one pack can be active at a time.**

### Viewing Pack Details

Selected pack shows detailed information:
- Pack metadata (name, author, version, size, dates)
- Complete sound list (name, duration, volume)
- All configured triggers

### Unloading Current Pack

1. Click "⏹️ Unload Current Pack" button (top of manager)
2. Active pack is deactivated
3. Default system sounds resume
4. Pack remains installed

### Uninstalling a Pack

1. Select the pack you want to remove
2. Click "🗑️" (trash) button in pack card
3. Confirm deletion
4. Pack is permanently removed from storage

**Note**: Cannot undo uninstall. Re-install from share code if needed.

---

## Sharing Sound Packs

### Generating a Share Code

1. Open Sound Pack Manager
2. Select the pack you want to share
3. Scroll down to "Pack Details" section
4. Click "🔗 Generate Share Code"
5. Base64 code appears in text box
6. Click "📋 Copy" to copy to clipboard

**Share code includes**:
- All sound audio data (base64 encoded)
- All triggers and metadata
- Complete pack configuration

### Sharing Methods

#### Method 1: Direct Copy-Paste
1. Generate share code
2. Copy to clipboard
3. Paste in Discord, Slack, email, etc.
4. Recipient copies code and installs

#### Method 2: Text File
1. Generate share code
2. Save to .txt file
3. Share file via cloud storage, email attachment
4. Recipient opens file and copies code

#### Method 3: Pastebin/Gist
1. Generate share code
2. Create pastebin.com or GitHub Gist
3. Share URL
4. Recipient copies code from URL

**Security Note**: Share codes can be large (50KB-2MB). Use file sharing for large packs.

### Installing from Share Code

1. Open Sound Pack Manager
2. Click "📥 Install from Share Code"
3. Browser prompts for share code
4. Paste complete share code
5. Click OK
6. Validation occurs:
   - Format check
   - Sound quality check
   - Size verification
7. If valid: Pack installs successfully
8. If invalid: Error message with details

#### Handling Duplicate Names

If a pack with the same name exists:
- Browser confirms: "Replace existing pack?"
- **Replace**: Overwrites old pack with new version
- **Cancel**: Keeps old pack, discards new

**Tip**: Use semantic versioning to track pack updates.

---

## Sound Pack Format

### JSON Structure

```typescript
{
  "version": "1.0.0",                    // Format version
  "metadata": {
    "name": "Retro Arcade",              // Pack name
    "author": "RetroEnthusiast",         // Creator name
    "description": "80s arcade sounds",  // Brief description
    "version": "1.0.0",                  // Pack version
    "tags": ["arcade", "retro", "8bit"], // Keywords
    "created": 1700000000000,            // Unix timestamp
    "updated": 1700000000000             // Unix timestamp
  },
  "sounds": [
    {
      "id": "sound-1234567890",          // Unique ID
      "name": "Laser Beep",              // Display name
      "audioData": "data:audio/wav;base64,...", // Audio data
      "duration": 500,                   // Milliseconds
      "volume": 70                       // 0-100%
    }
  ],
  "triggers": [
    {
      "event": "message-send",           // Event type
      "soundId": "sound-1234567890",     // References sound
      "probability": 100                 // 0-100%
    }
  ]
}
```

### Audio Format Specifications

- **Sample Rate**: 24000 Hz (24 kHz)
- **Channels**: Mono (1 channel)
- **Bit Depth**: 16-bit PCM
- **Encoding**: Base64 (data URI)
- **Max Duration**: 2000ms per sound
- **Format**: WAV (PCM)

### Validation Rules

1. **Pack Name**: 1-50 characters, required
2. **Version**: Semantic versioning format (X.Y.Z)
3. **Sounds**: At least 1 sound required
4. **Sound Duration**: Max 2000ms
5. **Triggers**: Sound ID must reference existing sound
6. **Events**: Must be one of the 5 valid event types
7. **Probability**: 0-100 integer
8. **Total Size**: Recommended <2MB (hard limit: 5MB)

---

## Best Practices

### Recording Quality

1. **Environment**:
   - Record in quiet room
   - Close windows (avoid traffic noise)
   - Turn off fans, AC, buzzing electronics

2. **Microphone Technique**:
   - Position 6-12 inches from mouth
   - Maintain consistent distance
   - Avoid plosives (p, t, k sounds) - use pop filter or angle mic

3. **Audio Levels**:
   - Aim for 50-80% waveform height
   - Avoid clipping (waveform hitting top/bottom)
   - Adjust system mic volume if needed

4. **Content**:
   - Keep sounds short and punchy (<1 second ideal)
   - Clear start and end (no trailing silence)
   - Single sound per recording (not sequences)

### Trigger Configuration

1. **Essential Events**:
   - Always map: message-send, message-receive, error
   - Optional: glitch (for Dr. Sbaitso mode)
   - Rarely needed: keypress (can be annoying)

2. **Probability Guidelines**:
   - Critical feedback: 100% (errors, confirmations)
   - Regular events: 80-100% (message send/receive)
   - Variations: 30-70% (multiple sounds for same event)
   - Ambient: 10-30% (subtle background sounds)

3. **Volume Balance**:
   - Message sounds: 50-70% (clear but not overwhelming)
   - Error sounds: 70-90% (attention-grabbing)
   - Keypress: 20-40% (subtle, background)

### Pack Organization

1. **Naming Conventions**:
   - Descriptive pack names ("Sci-Fi Terminal", not "MyPack")
   - Clear sound names ("Laser Beep", not "Sound 1")
   - Use tags for discoverability

2. **Versioning**:
   - 1.0.0: Initial release
   - 1.1.0: Add new sounds (minor update)
   - 2.0.0: Major changes or complete redesign

3. **Size Management**:
   - Aim for 500KB-1MB per pack
   - 5-10 sounds is typical
   - More sounds = larger share codes

### Sharing Etiquette

1. **Credits**:
   - Credit original sources if using samples
   - Don't share copyrighted material
   - Include your name/alias as author

2. **Documentation**:
   - Write clear descriptions
   - List what events are mapped
   - Mention special features

3. **Testing**:
   - Test pack thoroughly before sharing
   - Verify all triggers work
   - Check for audio glitches

---

## Troubleshooting

### Microphone Not Working

**Problem**: "Microphone permission denied" or no waveform
**Solutions**:
1. Check browser permissions (Settings → Privacy → Microphone)
2. Allow microphone access for the site
3. Try different browser
4. Check system microphone settings
5. Verify microphone is plugged in and selected

### Recording Sounds Distorted

**Problem**: Audio has crackling, clipping, or distortion
**Solutions**:
1. Lower system microphone volume
2. Move farther from microphone
3. Speak at normal volume (not shouting)
4. Check for electrical interference
5. Try different microphone

### Pack Won't Save

**Problem**: "Failed to save sound pack" error
**Solutions**:
1. Check pack size (<2MB recommended)
2. Ensure pack name is filled in
3. Add at least one sound
4. Clear browser cache
5. Try incognito/private mode to test localStorage

### Share Code Too Large

**Problem**: Share code is massive (>2MB) or won't copy
**Solutions**:
1. Reduce number of sounds
2. Shorten sound durations
3. Split into multiple packs
4. Use file sharing instead of copy-paste
5. Compress sounds before recording (lower mic gain)

### Sounds Not Playing

**Problem**: Loaded pack but sounds don't trigger
**Solutions**:
1. Verify pack is loaded (green indicator)
2. Check trigger probability (100% for testing)
3. Ensure event is actually occurring
4. Check browser audio permissions
5. Reload page and reactivate pack

### "Invalid Sound Pack" Error

**Problem**: Can't install from share code
**Solutions**:
1. Verify complete code copied (no truncation)
2. Check for extra spaces or line breaks
3. Try re-generating share code
4. Validate JSON format if manually editing
5. Check sound data is valid base64

---

## Advanced Topics

### Manual Pack Creation

Developers can create packs programmatically:

```typescript
import { validateSoundPack, generateShareCode } from '@/utils/soundPackFormat';

const customPack = {
  version: '1.0.0',
  metadata: { /* ... */ },
  sounds: [ /* ... */ ],
  triggers: [ /* ... */ ]
};

const validation = validateSoundPack(customPack);
if (validation.valid) {
  const shareCode = generateShareCode(customPack);
  console.log(shareCode);
}
```

### Storage Management

Packs stored in localStorage under key: `dr_sbaitso_sound_packs`

```javascript
// View all packs
const packs = JSON.parse(localStorage.getItem('dr_sbaitso_sound_packs'));

// Clear all packs (use carefully!)
localStorage.removeItem('dr_sbaitso_sound_packs');
```

### Audio Processing

For advanced users: process audio before encoding:

```javascript
// Apply effects using Web Audio API
const audioContext = new AudioContext();
const source = audioContext.createBufferSource();
const gainNode = audioContext.createGain();
const filter = audioContext.createBiquadFilter();

// Chain: source → filter → gain → destination
source.connect(filter);
filter.connect(gainNode);
gainNode.connect(audioContext.destination);
```

---

## Examples

### Example 1: Minimal Sound Pack

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "Simple Beeps",
    "author": "User",
    "version": "1.0.0",
    "description": "Basic beep sounds",
    "tags": ["simple", "beep"],
    "created": 1700000000000,
    "updated": 1700000000000
  },
  "sounds": [
    {
      "id": "beep1",
      "name": "High Beep",
      "audioData": "data:audio/wav;base64,...",
      "duration": 200,
      "volume": 70
    }
  ],
  "triggers": [
    {
      "event": "message-send",
      "soundId": "beep1",
      "probability": 100
    }
  ]
}
```

### Example 2: Complete Sound Pack

See the Share Codes section for community-created packs.

---

## Community & Resources

### Sharing Platform
- GitHub Discussions: Share your packs
- Reddit r/DrSbaitso: Community creations
- Discord: Real-time sharing and feedback

### Sound Resources
- **Free Sound Effects**:
  - Freesound.org (CC licenses)
  - Zapsplat.com (free tier)
  - BBC Sound Effects Archive
- **Recording Software**:
  - Audacity (free, open-source)
  - Ocenaudio (simple, free)
  - System recorders (built-in)

### Tutorials
- Video: "Creating Your First Sound Pack"
- Guide: "Advanced Trigger Strategies"
- Tips: "Recording Studio-Quality Sounds at Home"

---

## Feedback & Support

Found a bug? Have a feature request?
- GitHub Issues: https://github.com/doublegate/DrSbaitso-Recreated/issues
- Discussions: https://github.com/doublegate/DrSbaitso-Recreated/discussions

---

**Version**: 1.10.0
**Last Updated**: November 2025
**Related**: [Features Overview](./FEATURES.md), [Music Mode Guide](./MUSIC_MODE.md)
