import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundPackPlayer, toTriggerEvent, type SoundPackEvent } from '@/utils/soundPackPlayer';
import { bytesToBase64, type SoundPack } from '@/utils/soundPackFormat';

function makeContext() {
  const started: AudioBuffer[] = [];
  const ctx = {
    state: 'running',
    destination: {},
    resume: vi.fn(async () => {}),
    createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => {
      const data = new Float32Array(length);
      return { numberOfChannels: channels, length, sampleRate, getChannelData: () => data } as unknown as AudioBuffer;
    }),
    decodeAudioData: vi.fn(async () => ({ length: 10, sampleRate: 44100 }) as unknown as AudioBuffer),
    createBufferSource: vi.fn(() => {
      const node = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: vi.fn(() => {
          if (node.buffer) started.push(node.buffer);
        }),
      };
      return node;
    }),
    createGain: vi.fn(() => ({ gain: { value: 1 }, connect: vi.fn() })),
  };
  return { ctx: ctx as unknown as AudioContext & typeof ctx, started };
}

const pcmSound = (id: string, bytes: Uint8Array, sampleRate?: number) => ({
  id,
  name: id,
  description: '',
  audioData: bytesToBase64(bytes),
  duration: 10,
  volume: 100,
  ...(sampleRate ? { sampleRate } : {}),
});

const makePack = (sounds: SoundPack['sounds'], triggers: SoundPack['triggers']): SoundPack => ({
  metadata: { name: 'P', author: 'A', version: '1.0.0', description: '', created: 1, updated: 1, tags: [] },
  sounds,
  triggers,
});

describe('SoundPackPlayer', () => {
  let player: SoundPackPlayer;
  beforeEach(() => {
    player = new SoundPackPlayer();
  });

  it('builds PCM16 buffers directly at the stored sample rate', async () => {
    const { ctx } = makeContext();
    // Three samples: 0x4000 = 0.5, then -0.5, plus a stray odd byte.
    const bytes = new Uint8Array([0x00, 0x40, 0x00, 0xc0, 0x7f]);
    await player.loadPack(makePack([pcmSound('a', bytes, 22050)], []), ctx);

    expect(ctx.createBuffer).toHaveBeenCalledWith(1, 2, 22050);
    expect(ctx.decodeAudioData).not.toHaveBeenCalled();
    expect(player.getLoadedSoundCount()).toBe(1);
  });

  it('defaults to the pack sample rate when none is stored', async () => {
    const { ctx } = makeContext();
    await player.loadPack(makePack([pcmSound('a', new Uint8Array([0, 0, 0, 0]))], []), ctx);
    expect(ctx.createBuffer).toHaveBeenCalledWith(1, 2, 24000);
  });

  it('decodes legacy packs that stored the uploaded WAV file verbatim', async () => {
    const { ctx } = makeContext();
    const wav = Uint8Array.from('RIFF\0\0\0\0WAVEfmt ', (c) => c.charCodeAt(0));
    await player.loadPack(makePack([pcmSound('a', wav)], []), ctx);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(player.getLoadedSoundCount()).toBe(1);
  });

  it('plays every trigger mapped from an app event', async () => {
    const { ctx, started } = makeContext();
    const pack = makePack(
      [pcmSound('send', new Uint8Array([0, 0])), pcmSound('glitch', new Uint8Array([0, 0]))],
      [
        { event: 'message_sent', soundId: 'send', probability: 100 },
        { event: 'glitch', soundId: 'glitch', probability: 100 },
        { event: 'error', soundId: 'glitch', probability: 0 },
      ],
    );
    await player.loadPack(pack, ctx);

    await player.triggerEvent(toTriggerEvent('message-send'));
    expect(started).toHaveLength(1);
    await player.triggerEvent(toTriggerEvent('glitch'));
    expect(started).toHaveLength(2);
    await player.triggerEvent(toTriggerEvent('error'));
    expect(started).toHaveLength(2);
  });

  it('maps every public event name', () => {
    const events: SoundPackEvent[] = ['message-send', 'message-receive', 'error', 'glitch', 'startup'];
    expect(events.map(toTriggerEvent)).toEqual(['message_sent', 'message_received', 'error', 'glitch', 'startup']);
  });

  it('does nothing when disabled', async () => {
    const { ctx, started } = makeContext();
    await player.loadPack(
      makePack([pcmSound('s', new Uint8Array([0, 0]))], [{ event: 'startup', soundId: 's', probability: 100 }]),
      ctx,
    );
    player.setEnabled(false);
    await player.triggerEvent('startup');
    expect(started).toHaveLength(0);
  });
});

describe('playSoundPackEvent', () => {
  it('never throws when no pack is active', async () => {
    const { playSoundPackEvent } = await import('@/utils/soundPackPlayer');
    await expect(playSoundPackEvent('message-receive')).resolves.toBeUndefined();
  });
});
