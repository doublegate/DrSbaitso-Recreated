# Music Mode Guide

## Overview

Music Mode adds procedurally-generated chiptune background music to your Dr. Sbaitso conversations. The music engine creates authentic retro soundtracks that adapt to different moods and tempos, enhancing the nostalgic 1991 experience.

## Features

- **Procedural Generation**: Unique music compositions created in real-time
- **Mood-Based Composition**: 5 distinct mood presets
- **Tempo Control**: Adjustable BPM (60-180)
- **Volume Control**: Independent music volume
- **Persistent Player**: Always accessible during conversations
- **Zero External Dependencies**: Pure Web Audio API synthesis

## Getting Started

### Activating Music Mode

1. **Start a Conversation**: Enter your name and begin chatting with Dr. Sbaitso
2. **Open Music Player**: Click the 🎵 button in the top toolbar (or press `Ctrl+M`)
3. **Start Playing**: Click the ▶ Play button in the music player widget
4. **Adjust Settings**: Choose mood and tempo to your liking

### Music Player Location

The Music Player appears as a compact widget in the **bottom-left corner** of the screen when enabled. It remains visible throughout your conversation and can be toggled on/off without stopping the music.

## Mood Presets

### 1. Happy 😊
- **Scale**: Major (bright, uplifting)
- **Tempo**: Moderate to fast (100-140 BPM)
- **Characteristics**: Upbeat melodies, bouncy rhythms
- **Best For**: Light-hearted conversations, positive moods

### 2. Calm 🌊
- **Scale**: Major/Lydian (peaceful, ambient)
- **Tempo**: Slow (60-90 BPM)
- **Characteristics**: Gentle harmonies, relaxed pace
- **Best For**: Reflective conversations, meditation, focus

### 3. Energetic ⚡
- **Scale**: Major/Mixolydian (driving, powerful)
- **Tempo**: Fast (120-180 BPM)
- **Characteristics**: Strong basslines, intense rhythms
- **Best For**: Active discussions, brainstorming, motivation

### 4. Melancholic 😔
- **Scale**: Minor (somber, introspective)
- **Tempo**: Slow to moderate (70-100 BPM)
- **Characteristics**: Emotional melodies, contemplative harmonies
- **Best For**: Serious conversations, emotional support

### 5. Mysterious 🔮
- **Scale**: Diminished/Phrygian (eerie, experimental)
- **Tempo**: Variable (80-120 BPM)
- **Characteristics**: Unexpected progressions, dark tones
- **Best For**: Creative discussions, exploration, mystery themes

## Controls

### Play/Pause
- **Button**: ▶/⏸ in music player
- **Behavior**: Toggle music playback
- **State Persistence**: Settings saved when paused

### Mood Selector
- **Options**: 5 mood presets (see above)
- **Change Behavior**: Instantly updates composition
- **Live Switching**: Change mood while playing

### Tempo Control
- **Range**: 60-180 BPM
- **Default**: 120 BPM (varies by mood)
- **Increment**: 10 BPM per step
- **Live Adjustment**: Updates immediately

### Volume Control
- **Range**: 0-100%
- **Default**: 50%
- **Independence**: Separate from Dr. Sbaitso's voice volume
- **Slider**: Smooth adjustment

### Toggle Visibility
- **Keyboard**: `Ctrl+M`
- **Button**: 🎵 in toolbar
- **Behavior**: Shows/hides player (music continues if playing)

## Technical Details

### Audio Engine
- **Technology**: Web Audio API (native browser support)
- **Synthesis**: Oscillator-based (square, sawtooth, triangle waves)
- **Polyphony**: 3 voices (melody, bass, harmony)
- **Pattern Length**: 16-beat sequences (4/4 time)
- **Key**: C major/minor (root note)

### Composition Algorithm
1. **Chord Progression**: Generated based on mood scale
2. **Melody Generation**: Probabilistic note selection within scale
3. **Bass Line**: Root/fifth patterns following chord changes
4. **Harmony**: Tertian harmonies supporting melody
5. **Rhythm**: Dynamic patterns based on tempo

### Performance
- **CPU Usage**: <5% on modern devices
- **Memory**: ~2MB for audio context
- **Latency**: <10ms note triggering
- **Compatibility**: All modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

## Use Cases

### 1. Ambient Background
Set to **Calm** mood at low volume (20-30%) for a subtle retro atmosphere during deep conversations.

### 2. Focus Enhancement
Use **Energetic** mood at moderate tempo (120 BPM) to maintain engagement during long sessions.

### 3. Mood Matching
Switch moods to match conversation tone:
- Discussing achievements? **Happy**
- Working through problems? **Melancholic**
- Brainstorming ideas? **Mysterious**

### 4. Retro Gaming Experience
**Energetic** mood at high BPM (160+) recreates classic video game soundtracks from the early 90s.

## Tips & Best Practices

### Volume Balancing
- Keep music 30-50% volume for conversations
- Dr. Sbaitso's voice should remain primary focus
- Adjust based on personal preference and environment

### Mood Selection
- Start with **Happy** or **Calm** for general use
- **Melancholic** works well for serious topics
- **Mysterious** is great for creative or unusual conversations

### Browser Optimization
- Use headphones for best audio quality
- Close other audio-heavy tabs to reduce CPU load
- Latest browser versions have best Web Audio support

### Accessibility
- Music player fully keyboard accessible (Tab navigation)
- All controls have ARIA labels for screen readers
- Visual focus indicators on all buttons

## Troubleshooting

### No Sound Playing
1. Check browser audio permissions
2. Verify system volume is not muted
3. Ensure music player volume slider is >0%
4. Try clicking Play button again (audio context may need activation)

### Choppy/Stuttering Audio
1. Close other tabs using audio
2. Reduce tempo (lower BPM = less CPU usage)
3. Check system CPU usage (close background apps)
4. Try a different browser (Chrome has best Web Audio performance)

### Player Not Appearing
1. Ensure you've started a conversation (entered name)
2. Check if player is visible (toggle with Ctrl+M)
3. Verify JavaScript is enabled
4. Clear browser cache and reload

### Music Keeps Playing After Closing Player
- **This is intentional!** Music continues when you hide the player
- To stop music: Click Pause (⏸) before closing player
- Or: Reopen player (Ctrl+M) and click Pause

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+M` | Toggle Music Player visibility |
| `Tab` | Navigate controls (when player focused) |
| `Enter` | Activate focused button |
| `Space` | Activate focused button (Play/Pause) |

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Safari iOS | 14+ | ✅ Full |
| Chrome Android | 90+ | ✅ Full |

**Note**: Older browsers may not support Web Audio API features. Update to latest version for best experience.

## Advanced Usage

### Creating Custom Moods
While you can't currently add custom moods via UI, developers can extend the music engine by modifying `utils/musicEngine.ts`:

```typescript
// Example: Add a "Jazz" mood
{
  scales: [0, 2, 4, 5, 7, 9, 11], // Major scale
  chords: [
    [0, 4, 7, 11], // Cmaj7
    [5, 9, 0, 4],  // Fmaj7
    // ... more complex jazz chords
  ],
  bassTempo: 100,
  notePattern: [1, 0, 0.7, 0, 0.5, 0, 0.3, 0] // Swing rhythm
}
```

### Exporting Music
Currently, music is generated in real-time and not saved. Future versions may support:
- Recording to audio file (.wav, .mp3)
- Exporting MIDI sequences
- Sharing composition patterns

## Feedback & Requests

Have ideas for new moods? Want different musical styles? Open an issue on GitHub:
- https://github.com/doublegate/DrSbaitso-Recreated/issues

## Credits

Music Mode was inspired by:
- Classic Sound Blaster MIDI compositions
- Chiptune artists like Disasterpeace and Chipzel
- Early 90s video game soundtracks
- Procedural music systems in roguelike games

---

**Version**: 1.10.0
**Last Updated**: November 2025
**Related**: [Features Overview](./FEATURES.md), [Sound Packs Guide](./SOUND_PACKS_GUIDE.md)
