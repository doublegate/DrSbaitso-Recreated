/**
 * The page's single AudioContext.
 *
 * Speech, sound effects and music previously each created their own
 * context (up to four). Browsers limit how many may exist, each one holds an
 * audio thread, and none of them were ever closed. Everything now shares
 * this one, created lazily on first use.
 */

const WORKLET_URL = '/audio-processor.worklet.js';

let context: AudioContext | null = null;
let workletReady: Promise<void> | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (!context) {
    const Ctor: typeof AudioContext | undefined =
      typeof window === 'undefined'
        ? undefined
        : window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch (error) {
      console.error('[audio] Could not create AudioContext:', error);
      return null;
    }
  }
  return context;
}

/**
 * Resumes the context (browsers start it suspended until a user gesture) and
 * waits for the bit-crusher worklet. Resolves even if the worklet cannot be
 * loaded; playAudio then falls back to a ScriptProcessorNode.
 */
export async function ensureAudioReady(): Promise<AudioContext | null> {
  const ctx = getSharedAudioContext();
  if (!ctx) return null;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Not yet allowed (no user gesture); a later call will retry.
    }
  }

  if (!workletReady) {
    workletReady =
      'audioWorklet' in ctx && ctx.audioWorklet
        ? ctx.audioWorklet.addModule(WORKLET_URL).catch((error: unknown) => {
            console.warn('[audio] AudioWorklet unavailable, using ScriptProcessor fallback:', error);
          })
        : Promise.resolve();
  }
  await workletReady;
  return ctx;
}

/** Test-only: forget the shared context. */
export function __resetSharedAudioForTests(): void {
  context = null;
  workletReady = null;
}
