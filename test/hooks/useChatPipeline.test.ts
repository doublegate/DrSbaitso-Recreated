import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { KeyboardEvent } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useChatPipeline, personaGreeting, type ChatPipelineDeps } from '@/hooks/useChatPipeline';
import { getAIResponse, resetChat, synthesizeSpeech, GeminiServiceError } from '@/services/geminiService';
import { playSoundPackEvent } from '@/utils/soundPackPlayer';

vi.mock('@/services/geminiService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/geminiService')>()),
  getAIResponse: vi.fn(),
  synthesizeSpeech: vi.fn(),
  resetChat: vi.fn(),
}));
vi.mock('@/utils/soundPackPlayer', () => ({ playSoundPackEvent: vi.fn(() => Promise.resolve()) }));
vi.mock('@/utils/sharedAudio', () => ({
  ensureAudioReady: vi.fn(() => Promise.resolve(null)),
  getSharedAudioContext: vi.fn(() => null),
}));

const personas = [
  { id: 'sbaitso', name: 'Dr. Sbaitso', description: '', isCustom: false },
  { id: 'hal9000', name: 'HAL 9000', description: '', isCustom: false },
  { id: 'joshua', name: 'JOSHUA', description: '', isCustom: false },
];

function makeDeps(overrides: Partial<ChatPipelineDeps> = {}): ChatPipelineDeps {
  return {
    personaState: {
      persona: personas[0],
      personas,
      selectPersona: vi.fn(),
      chatOptions: {},
      speechOptions: {},
      formatReply: (text: string) => text,
      voiceProcessing: 'sbaitso',
    },
    speech: { speak: vi.fn(() => Promise.resolve()) },
    mutedRef: { current: false },
    soundEffects: { playSound: vi.fn(() => Promise.resolve()) },
    announce: vi.fn(),
    announceMessages: true,
    ...overrides,
  };
}

/** Runs pending timers (greeting lines, typewriter) until the promise settles. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  let result!: T;
  await act(async () => {
    const done = promise.then((value) => {
      result = value;
    });
    await vi.runAllTimersAsync();
    await done;
  });
  return result;
}

async function startSession(deps: ChatPipelineDeps, name = 'alice') {
  const hook = renderHook((props: ChatPipelineDeps) => useChatPipeline(props), { initialProps: deps });
  act(() => hook.result.current.setNameInput(name));
  await settle(hook.result.current.handleNameSubmit());
  return hook;
}

describe('personaGreeting', () => {
  it('uses the original v2.20 greeting for Dr. Sbaitso', () => {
    const lines = personaGreeting('sbaitso', 'Dr. Sbaitso', 'ALICE');
    expect(lines[0]).toBe('HELLO ALICE,  MY NAME IS DOCTOR SBAITSO.');
    expect(lines.at(-1)).toBe('SO, TELL ME ABOUT YOUR PROBLEMS.');
  });

  it("uses a persona engine's own opener", () => {
    expect(personaGreeting('joshua', 'JOSHUA', 'ALICE')).toEqual(['LOGON:']);
  });

  it('falls back to a generic connection line', () => {
    expect(personaGreeting('custom_1', 'Robo', 'ALICE')).toEqual(['HELLO ALICE.', 'YOU ARE NOW CONNECTED TO ROBO.']);
  });
});

describe('useChatPipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getAIResponse).mockReset().mockResolvedValue('TELL ME MORE.');
    vi.mocked(synthesizeSpeech).mockReset().mockResolvedValue('AAAA');
    vi.mocked(resetChat).mockReset();
    vi.mocked(playSoundPackEvent).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts on the name screen, loading', () => {
    const { result } = renderHook(() => useChatPipeline(makeDeps()));
    expect(result.current.userName).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.messages).toEqual([]);
  });

  it('greets in upper case, speaks the greeting on the persona route, then unlocks input', async () => {
    const deps = makeDeps();
    const { result } = await startSession(deps);
    expect(result.current.userName).toBe('ALICE');
    expect(result.current.messages.map((m) => m.text)).toEqual(personaGreeting('sbaitso', 'Dr. Sbaitso', 'ALICE'));
    expect(synthesizeSpeech).toHaveBeenCalledTimes(1);
    expect(deps.speech.speak).toHaveBeenCalledWith('AAAA', expect.any(String), { processing: 'sbaitso' });
    expect(playSoundPackEvent).toHaveBeenCalledWith('startup');
    expect(result.current.isGreeting).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('ignores an empty name', async () => {
    const { result } = renderHook(() => useChatPipeline(makeDeps()));
    act(() => result.current.setNameInput('   '));
    await settle(result.current.handleNameSubmit());
    expect(result.current.userName).toBeNull();
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it('starts text-only when greeting speech fails', async () => {
    vi.mocked(synthesizeSpeech).mockRejectedValue(new Error('down'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = makeDeps();
    const { result } = await startSession(deps);
    expect(result.current.userName).toBe('ALICE');
    expect(deps.speech.speak).toHaveBeenCalledWith('', expect.any(String), { processing: 'sbaitso' });
    expect(result.current.isLoading).toBe(false);
  });

  it('runs one turn: user line, typed reply, speech, sounds and one announcement', async () => {
    const deps = makeDeps({ personaState: { ...makeDeps().personaState, formatReply: (t: string) => `${t}!` } });
    const { result } = await startSession(deps);
    const ok = await settle(result.current.sendMessage('  I feel sad  '));
    expect(ok).toBe(true);
    const [user, reply] = result.current.messages.slice(-2);
    expect(user).toMatchObject({ author: 'user', text: 'I feel sad', characterId: 'sbaitso' });
    expect(reply).toMatchObject({ author: 'dr', text: 'TELL ME MORE.!' });
    expect(getAIResponse).toHaveBeenCalledWith('I feel sad', 'sbaitso', {});
    expect(deps.speech.speak).toHaveBeenLastCalledWith('AAAA', 'TELL ME MORE.!', { processing: 'sbaitso' });
    expect(deps.soundEffects.playSound).toHaveBeenCalledWith('message-send');
    expect(deps.soundEffects.playSound).toHaveBeenCalledWith('message-receive');
    expect(deps.announce).toHaveBeenCalledWith('Dr. Sbaitso says: TELL ME MORE.!');
    expect(result.current.isLoading).toBe(false);
  });

  it('does not announce replies when the setting is off', async () => {
    const deps = makeDeps({ announceMessages: false });
    const { result } = await startSession(deps);
    await settle(result.current.sendMessage('hello'));
    expect(deps.announce).not.toHaveBeenCalledWith(expect.stringContaining('says:'));
  });

  it('does not synthesise replies while muted', async () => {
    const deps = makeDeps({ mutedRef: { current: true } });
    const { result } = await startSession(deps);
    vi.mocked(synthesizeSpeech).mockClear();
    await settle(result.current.sendMessage('hello'));
    expect(synthesizeSpeech).not.toHaveBeenCalled();
    expect(deps.speech.speak).toHaveBeenLastCalledWith('', 'TELL ME MORE.', { processing: 'sbaitso' });
  });

  it('shows an in-character error and plays the error sound when the reply fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const deps = makeDeps();
    const { result } = await startSession(deps);
    vi.mocked(getAIResponse).mockRejectedValue(new GeminiServiceError('slow', 'RATE_LIMITED', 429));
    const ok = await settle(result.current.sendMessage('hello'));
    expect(ok).toBe(false);
    expect(result.current.messages.at(-1)?.text).toMatch(/PLEASE WAIT A MOMENT/);
    expect(deps.soundEffects.playSound).toHaveBeenCalledWith('error');
    expect(playSoundPackEvent).toHaveBeenCalledWith('error');
    expect(result.current.isLoading).toBe(false);
  });

  it('plays the glitch sound pack event for a glitch phrase', async () => {
    vi.mocked(getAIResponse).mockResolvedValue('IRQ CONFLICT');
    const { result } = await startSession(makeDeps());
    await settle(result.current.sendMessage('hello'));
    expect(playSoundPackEvent).toHaveBeenCalledWith('glitch');
  });

  it('keeps the reply when its audio cannot be played', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const deps = makeDeps();
    const { result } = await startSession(deps);
    vi.mocked(deps.speech.speak).mockRejectedValue(new Error('decode'));
    const ok = await settle(result.current.sendMessage('hello'));
    expect(ok).toBe(true);
    expect(result.current.messages.at(-1)?.text).toBe('TELL ME MORE.');
  });

  it('refuses a second turn while one is in flight', async () => {
    const { result } = await startSession(makeDeps());
    let second: boolean | undefined;
    await act(async () => {
      const first = result.current.sendMessage('one');
      second = await result.current.sendMessage('two');
      await vi.runAllTimersAsync();
      await first;
    });
    expect(second).toBe(false);
    expect(getAIResponse).toHaveBeenCalledTimes(1);
  });

  it('sends the typed input on Enter and clears the box', async () => {
    const deps = makeDeps();
    const { result } = await startSession(deps);
    act(() => result.current.setUserInput('hello there'));
    await act(async () => {
      result.current.handleKeyDown({ key: 'Enter' } as KeyboardEvent<HTMLInputElement>);
      await vi.runAllTimersAsync();
    });
    expect(deps.soundEffects.playSound).toHaveBeenCalledWith('keypress');
    expect(result.current.userInput).toBe('');
    expect(getAIResponse).toHaveBeenCalledWith('hello there', 'sbaitso', {});
  });

  it('appends voice transcripts to the input', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useChatPipeline(deps));
    act(() => result.current.handleVoiceTranscript(' hello '));
    act(() => result.current.handleVoiceTranscript('world'));
    act(() => result.current.handleVoiceTranscript('   '));
    expect(result.current.userInput).toBe('hello world');
    expect(deps.announce).toHaveBeenCalledWith('Voice input:  hello ');
  });

  it('clears the log, the input and the model history', async () => {
    const { result } = await startSession(makeDeps());
    act(() => result.current.setUserInput('draft'));
    act(() => result.current.clearConversation());
    expect(result.current.messages).toEqual([]);
    expect(result.current.userInput).toBe('');
    expect(resetChat).toHaveBeenCalledWith('sbaitso');
  });

  it('marks a persona switch in the log and shows an engine opener on arrival', async () => {
    const deps = makeDeps();
    const { result } = await startSession(deps);
    act(() => result.current.switchPersona('joshua'));
    expect(deps.personaState.selectPersona).toHaveBeenCalledWith('joshua');
    expect(result.current.messages.slice(-2).map((m) => m.text)).toEqual(['--- NOW TALKING TO JOSHUA ---', 'LOGON:']);
    expect(playSoundPackEvent).toHaveBeenCalledWith('character-switch');
    expect(deps.announce).toHaveBeenCalledWith('Now talking to JOSHUA');
  });

  it('ignores a switch to the current or an unknown persona', () => {
    const deps = makeDeps();
    const { result } = renderHook(() => useChatPipeline(deps));
    act(() => result.current.switchPersona('sbaitso'));
    act(() => result.current.switchPersona('nobody'));
    expect(deps.personaState.selectPersona).not.toHaveBeenCalled();
  });

  it('runs each template prompt as a normal turn', async () => {
    const deps = makeDeps();
    const { result } = await startSession(deps);
    await settle(result.current.handleSelectTemplate(['first', 'second']));
    expect(vi.mocked(getAIResponse).mock.calls.map(([m]) => m)).toEqual(['first', 'second']);
    expect(deps.announce).toHaveBeenCalledWith('Applying conversation template');
  });

  it('stops a template when a turn fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const deps = makeDeps();
    const { result } = await startSession(deps);
    vi.mocked(getAIResponse).mockRejectedValue(new Error('boom'));
    await settle(result.current.handleSelectTemplate(['first', 'second']));
    expect(getAIResponse).toHaveBeenCalledTimes(1);
    expect(deps.announce).toHaveBeenCalledWith('Template stopped');
  });
});
