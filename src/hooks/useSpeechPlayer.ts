/**
 * Plays synthesised speech (base64 PCM16, 24 kHz) through the shared
 * AudioContext with the current audio mode, and exposes the playing source so
 * it can be stopped or visualised.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceProcessing } from '../constants';
import { decode, decodeAudioData, getPlaybackSettings, playAudio, type AudioModeId } from '../utils/audio';
import { endPunctuationOf } from '../utils/lpcMonotone';
import { ensureAudioReady } from '../utils/sharedAudio';

const TTS_SAMPLE_RATE = 24000;

export function useSpeechPlayer(mode: AudioModeId) {
  const [currentSource, setCurrentSource] = useState<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  /**
   * Resolves when playback ends or is stopped; rejects if audio is unreadable.
   * `text` is what the audio says: its final punctuation sets the end of the
   * pitch contour in the Authentic and Ultra modes (fall, or rise for "?"/"!"),
   * and the HAL and WOPR chains use its words. `processing` is the persona's
   * route (default 'sbaitso', the only route the audio mode applies to).
   */
  const speak = useCallback(async (base64Audio: string, text?: string, options: { processing?: VoiceProcessing } = {}) => {
    if (!base64Audio) return;
    const ctx = await ensureAudioReady();
    if (!ctx) return;

    const activeMode = modeRef.current;
    const buffer = await decodeAudioData(
      decode(base64Audio),
      ctx,
      TTS_SAMPLE_RATE,
      1,
      activeMode,
      text === undefined ? null : endPunctuationOf(text),
      { processing: options.processing ?? 'sbaitso', text },
    );
    const { bitDepth, playbackRate } = getPlaybackSettings(activeMode);
    try {
      await playAudio(buffer, ctx, bitDepth, playbackRate, true, (source) => {
        sourceRef.current = source;
        setCurrentSource(source);
        setIsPlaying(true);
      });
    } finally {
      sourceRef.current = null;
      setCurrentSource(null);
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      sourceRef.current?.stop();
    } catch {
      // Already stopped.
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { speak, stop, currentSource, isPlaying };
}
