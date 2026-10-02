# Sound Packs

A sound pack is a set of your own short sounds bound to app events: a sound when you
send a message, another when a reply arrives, and so on. Sound packs are an
Enhanced-mode feature; the classic screen plays only the original's sounds.

Sound packs are separate from **Sound settings** (SOUND menu, Alt+Shift+S), which
control the built-in procedural interface sounds (key clicks, beeps, boot sounds,
ambience).

## Events

| Event | When it plays |
|---|---|
| Startup | The greeting begins after name entry |
| Message Sent | You send a message |
| Message Received | A reply has finished |
| Error | A reply failed |
| Glitch | A reply contains the original's `PARITY ERR` text |
| Character Switch | You switch persona |
| Theme Change | You change the colour theme |

Each trigger has a probability (0-100%), rolled independently each time its event
fires; several triggers on one event can therefore play together, or none. A sound plays at its own volume times a fixed 70% master level.

## Managing packs

Open **SOUND > Sound packs** (Alt+Shift+P, or say "open sound packs").

- **Load**: makes a pack active. The active pack is remembered across reloads.
- **Unload Current Pack**: no pack plays.
- **Uninstall**: deletes a pack (asks to confirm).
- Select a pack to see its details and sounds, and **Generate Share Code** to copy it as
  text.
- **Install from Share Code**: paste a code to install a pack. Installing a pack whose
  name already exists asks before replacing it.
- **Create New Pack** opens the creator.

## Creating a pack

1. **Metadata**: name (the pack's identity), author, version, description.
2. **Sounds**: **+ Add Sound**, select it, give it a name and volume (0-100), then
   **Import Audio File**. Any format the browser can decode works (WAV, MP3, OGG, ...).
   The file is decoded and stored as 24 kHz mono PCM16. There is no microphone
   recording.
3. **Triggers**: **+ Add Trigger**, then choose the event, the sound and the probability.
4. **Validate** checks the pack; **Save Pack** validates and saves it. If saving fails,
   the creator stays open and shows the reason.

**Export** downloads the pack as `<name>.soundpack.json`; **Import** loads such a file
into the creator.

## Limits

| Limit | Value |
|---|---|
| Audio file accepted for decoding | 20 MB |
| One decoded sound | 500 KB (about 10 s at 24 kHz) |
| Whole pack | 5 MB |
| Sounds per pack | 50 |
| Triggers per pack | 200 |
| Imported JSON or share code | 8 MB of JSON |

Imported files and share codes are schema-checked before use; anything malformed is
rejected with a message.

## Storage

Packs are stored in this browser's IndexedDB (database `DrSbaitsoSoundPacks`, store
`packs`, keyed by pack name). They are not uploaded anywhere, including by cloud sync.
Packs saved by older versions under the localStorage key `dr_sbaitso_sound_packs` are
moved into IndexedDB automatically. The active pack's name is kept in localStorage
(`dr_sbaitso_active_sound_pack`).

## File format

A pack is JSON:

```json
{
  "metadata": {
    "name": "My Pack", "author": "Me", "version": "1.0.0", "description": "",
    "created": 1730000000000, "updated": 1730000000000, "tags": []
  },
  "sounds": [
    { "id": "beep", "name": "Beep", "description": "", "audioData": "<base64 PCM16>",
      "duration": 250, "volume": 80, "sampleRate": 24000 }
  ],
  "triggers": [
    { "event": "message_sent", "soundId": "beep", "probability": 100 }
  ]
}
```

- `audioData`: base64 of little-endian PCM16 mono at `sampleRate` (24000 when absent).
  Packs from older versions that hold raw WAV/MP3/OGG bytes are recognised and decoded
  as files.
- `event`: one of `message_sent`, `message_received`, `error`, `glitch`, `startup`,
  `character_switch`, `theme_change`.
- A share code is `btoa(encodeURIComponent(json))`.

## Implementation

| File | Role |
|---|---|
| `src/utils/soundPackFormat.ts` | Types, validation, limits, decoding, import/export, share codes |
| `src/utils/soundPackStore.ts` | IndexedDB persistence and the localStorage migration |
| `src/utils/soundPackPlayer.ts` | Decodes the active pack on the shared AudioContext; `playSoundPackEvent()` never throws |
| `src/components/SoundPackManager.tsx`, `SoundPackCreator.tsx` | The two panels |
