import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MusicEngine } from '@/utils/musicEngine';

function fakeContext() {
  const node = () => ({
    connect: vi.fn(),
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  });
  return {
    currentTime: 0,
    state: 'running',
    destination: {},
    createGain: vi.fn(node),
    createOscillator: vi.fn(() => ({
      ...node(),
      type: '',
      frequency: { value: 0, setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
    })),
    close: vi.fn(),
  } as unknown as AudioContext;
}

/** The scale the engine would play now (private; read for the test). */
const scale = (engine: MusicEngine) => (engine as unknown as { getScale(): number[] }).getScale();

describe('MusicEngine', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('applies a tempo change while playing', () => {
    const engine = new MusicEngine();
    engine.init(fakeContext());
    const interval = vi.spyOn(window, 'setInterval');
    engine.updateSettings({ enabled: true, tempo: 'normal' });
    expect(interval).toHaveBeenLastCalledWith(expect.any(Function), 500); // 120 BPM
    engine.updateSettings({ tempo: 'fast' });
    expect(interval).toHaveBeenLastCalledWith(expect.any(Function), 400); // 150 BPM
    engine.stop();
  });

  it('gives sad and tense their own scales', () => {
    const engine = new MusicEngine();
    engine.updateSettings({ mood: 'sad' });
    const sad = scale(engine);
    engine.updateSettings({ mood: 'tense' });
    expect(scale(engine)).not.toEqual(sad);
  });

  it('auto mood follows the conversation sentiment', () => {
    const engine = new MusicEngine();
    engine.updateSettings({ mood: 'auto' });
    engine.setSentiment(0.6);
    const positive = scale(engine);
    engine.setSentiment(-0.6);
    const negative = scale(engine);
    expect(negative).not.toEqual(positive);
    engine.updateSettings({ mood: 'happy' });
    expect(positive).toEqual(scale(engine));
  });

  it('never closes the shared audio context it was given', () => {
    const ctx = fakeContext();
    const engine = new MusicEngine();
    engine.init(ctx);
    engine.destroy();
    expect(ctx.close).not.toHaveBeenCalled();
  });
});
