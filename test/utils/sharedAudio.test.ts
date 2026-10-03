import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSharedAudioContext, ensureAudioReady, __resetSharedAudioForTests } from '@/utils/sharedAudio';

describe('sharedAudio', () => {
  beforeEach(() => __resetSharedAudioForTests());

  it('creates exactly one AudioContext for the page', () => {
    const spy = vi.spyOn(globalThis, 'AudioContext');
    const a = getSharedAudioContext();
    const b = getSharedAudioContext();
    expect(a).toBe(b);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('resumes a suspended context and registers the worklet only once', async () => {
    const ctx = getSharedAudioContext()!;
    (ctx as any).state = 'suspended';
    const resume = vi.spyOn(ctx, 'resume');
    const addModule = vi.fn().mockResolvedValue(undefined);
    (ctx as any).audioWorklet = { addModule };

    await Promise.all([ensureAudioReady(), ensureAudioReady()]);
    await ensureAudioReady();

    expect(resume).toHaveBeenCalled();
    expect(addModule).toHaveBeenCalledTimes(1);
    expect(addModule).toHaveBeenCalledWith('/audio-processor.worklet.js');
  });

  it('still resolves when the worklet cannot be loaded (ScriptProcessor fallback)', async () => {
    const ctx = getSharedAudioContext()!;
    (ctx as any).audioWorklet = { addModule: vi.fn().mockRejectedValue(new Error('blocked')) };
    await expect(ensureAudioReady()).resolves.toBe(ctx);
  });
});
