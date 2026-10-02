# Background Music

Enhanced mode has an optional chiptune loop generated with the Web Audio API. It is
not part of the original program, which had no music, and the classic screen never
plays it.

## Using it

Open the player from the SOUND menu > Music player, **Alt+Shift+M**, or the voice
command "play music". It appears in the bottom-left corner.

| Control | Options |
|---|---|
| ON / OFF | Starts or stops the loop. Mood, tempo and volume are disabled while it is off. |
| Volume | 0-100% (default 50%). The music is scaled to at most 30% of full level, so it stays under the speech. |
| Mood | Auto, Happy, Neutral, Sad, Tense |
| Tempo | Slow (100 BPM), Normal (120 BPM), Fast (150 BPM) |

Closing the player does not stop the music; reopening it shows the real state. Settings
last for the page session only and are not saved.

## What it plays

A 16-beat loop (four bars of four beats) on three voices:

| Voice | Waveform | Octave | Pattern |
|---|---|---|---|
| Bass | square | C3 | beats 1 and 3: root, root, fifth, root over the four bars |
| Lead | square | C5 | every beat, a fixed four-note figure per bar |
| Arpeggio | triangle | C4 | off-beats, cycling scale steps 1-3-5 |

The mood chooses the scale: Happy, Neutral and Auto use the major pentatonic; Sad and
Tense use the natural minor. Auto does not yet follow the conversation; it is the
major pentatonic.

## Implementation

- `src/utils/musicEngine.ts`: the `musicEngine` singleton. It plays on the page's shared
  AudioContext (`src/utils/sharedAudio.ts`) and schedules beats with `setInterval`.
- `src/components/MusicPlayer.tsx`: the panel, loaded lazily from
  `src/components/enhanced/EnhancedPanels.tsx`.

## Known limitations

- Changing the tempo while the music plays has no effect until it is turned off and on
  again: the beat interval is set when playback starts.
- Sad and Tense sound the same, as do Happy, Neutral and Auto.
- `setInterval` timing drifts when the tab is in the background.
