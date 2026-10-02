import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const playAudio = vi.fn();
const decodeAudioData = vi.fn(async (..._args: unknown[]) => ({ duration: 1 }) as unknown as AudioBuffer);

vi.mock('@/utils/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/audio')>();
  return { ...actual, playAudio: (...args: unknown[]) => playAudio(...args), decodeAudioData: (...a: unknown[]) => decodeAudioData(...a) };
});

const { useSpeechPlayer } = await import('@/hooks/useSpeechPlayer');

describe('useSpeechPlayer', () => {
  beforeEach(() => {
    playAudio.mockReset();
    decodeAudioData.mockClear();
  });

  it('plays with the settings of the current audio mode', async () => {
    playAudio.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSpeechPlayer('modern'));
    await act(() => result.current.speak('AAAA'));
    const [, , bitDepth, playbackRate] = playAudio.mock.calls[0];
    expect(bitDepth).toBe(0);
    expect(playbackRate).toBe(1);
    expect(decodeAudioData.mock.calls[0][4]).toBe('modern');
  });

  it('passes the spoken text\'s end punctuation to the decoder', async () => {
    playAudio.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSpeechPlayer('authentic'));
    await act(() => result.current.speak('AAAA', 'WHY DO YOU SAY THAT?'));
    await act(() => result.current.speak('AAAA'));
    expect(decodeAudioData.mock.calls[0][5]).toBe('?');
    expect(decodeAudioData.mock.calls[1][5]).toBeNull();
  });

  it('uses the Sbaitso processing route unless told otherwise', async () => {
    playAudio.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSpeechPlayer('authentic'));
    await act(() => result.current.speak('AAAA', 'HELLO.'));
    expect(decodeAudioData.mock.calls[0][6]).toEqual({ processing: 'sbaitso', text: 'HELLO.' });
  });

  it('passes a persona processing route and the text to the decoder', async () => {
    playAudio.mockResolvedValue(undefined);
    const { result } = renderHook(() => useSpeechPlayer('authentic'));
    await act(() => result.current.speak('AAAA', 'SHALL WE PLAY A GAME?', { processing: 'wopr' }));
    expect(decodeAudioData.mock.calls[0][4]).toBe('authentic');
    expect(decodeAudioData.mock.calls[0][6]).toEqual({ processing: 'wopr', text: 'SHALL WE PLAY A GAME?' });
  });

  it('does nothing for empty audio', async () => {
    const { result } = renderHook(() => useSpeechPlayer('authentic'));
    await act(() => result.current.speak(''));
    expect(playAudio).not.toHaveBeenCalled();
  });

  it('exposes the playing source and stop() ends it', async () => {
    const source = { stop: vi.fn() };
    let finish!: () => void;
    playAudio.mockImplementation((_b, _c, _d, _r, _w, onStart) => {
      onStart(source);
      return new Promise<void>((r) => (finish = r));
    });
    const { result } = renderHook(() => useSpeechPlayer('authentic'));

    let done!: Promise<void>;
    act(() => {
      done = result.current.speak('AAAA');
    });
    await vi.waitFor(() => expect(result.current.currentSource).toBe(source));
    expect(result.current.isPlaying).toBe(true);

    act(() => result.current.stop());
    expect(source.stop).toHaveBeenCalled();

    finish();
    await act(() => done);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentSource).toBeNull();
  });

  it('stops playback when unmounted', async () => {
    const source = { stop: vi.fn() };
    playAudio.mockImplementation((_b, _c, _d, _r, _w, onStart) => {
      onStart(source);
      return new Promise<void>(() => {});
    });
    const { result, unmount } = renderHook(() => useSpeechPlayer('authentic'));
    act(() => {
      void result.current.speak('AAAA');
    });
    await vi.waitFor(() => expect(result.current.currentSource).toBe(source));
    unmount();
    expect(source.stop).toHaveBeenCalled();
  });
});
