/**
 * The Enhanced-mode conversation: name entry and greeting, the single turn
 * pipeline (local persona engines or the model, typewriter, speech while
 * typing, errors and glitches), templates, clearing and switching persona.
 *
 * Dependencies come in as arguments so the pipeline can be tested with
 * mocks. Handlers are plain functions recreated each render, exactly as
 * they were inline in EnhancedApp, so they always see the latest props.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { Message } from '../types';
import { getAIResponse, resetChat, synthesizeSpeech } from '../services/geminiService';
import { isParityText } from '../engine/sbaitso';
import { playGlitchSound, playErrorBeep } from '../utils/audio';
import { getSharedAudioContext, ensureAudioReady } from '../utils/sharedAudio';
import { retroErrorMessage } from '../utils/retroErrors';
import { playSoundPackEvent } from '../utils/soundPackPlayer';
import { hasStarted, personaOpening, personaTurn, resetPersona, type PersonaEngines } from '../engine/personaTurn';
import type { usePersona } from './usePersona';
import type { useSpeechPlayer } from './useSpeechPlayer';
import type { UseSoundEffectsReturn } from './useSoundEffects';

export const TYPING_DELAY_MS = 40;
/** Replies longer than this are printouts and type at FAST_TYPING_DELAY_MS. */
export const LONG_PRINTOUT_CHARS = 400;
export const FAST_TYPING_DELAY_MS = 4;
export const GREETING_LINE_DELAY_MS = 800;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Opening lines per persona. Dr. Sbaitso uses the original v2.20 greeting;
 * personas with a local engine use its opener (ELIZA's 1965 script greeting,
 * JOSHUA's LOGON prompt); the rest get a generic connection line.
 */
export function personaGreeting(personaId: string, personaName: string, userName: string): string[] {
  const opening = personaOpening(personaId);
  if (opening) return opening;
  switch (personaId) {
    case 'sbaitso':
      return [
        `HELLO ${userName},  MY NAME IS DOCTOR SBAITSO.`,
        '',
        'I AM HERE TO HELP YOU.',
        'SAY WHATEVER IS IN YOUR MIND FREELY,',
        'OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.',
        'MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,',
        '',
        'SO, TELL ME ABOUT YOUR PROBLEMS.',
      ];
    default:
      return [`HELLO ${userName}.`, `YOU ARE NOW CONNECTED TO ${personaName.toUpperCase()}.`];
  }
}

type PersonaState = ReturnType<typeof usePersona>;

export interface ChatPipelineDeps {
  /** Text shared to the app (Web Share Target): typed, unsent, once the greeting ends. */
  initialInput?: string | null;
  /** The active persona and its request options (hooks/usePersona). */
  personaState: Pick<
    PersonaState,
    'persona' | 'personas' | 'selectPersona' | 'chatOptions' | 'speechOptions' | 'formatReply' | 'voiceProcessing'
  >;
  /** Plays synthesised speech (hooks/useSpeechPlayer). */
  speech: Pick<ReturnType<typeof useSpeechPlayer>, 'speak'>;
  /** True while speech is muted: replies are shown but not synthesised. */
  mutedRef: RefObject<boolean>;
  soundEffects: Pick<UseSoundEffectsReturn, 'playSound'>;
  /** Screen-reader announcement (hooks/useScreenReader). */
  announce: (message: string) => void;
  /** Accessibility setting: announce each finished reply. */
  announceMessages: boolean;
}

export function useChatPipeline({
  initialInput,
  personaState,
  speech,
  mutedRef,
  soundEffects,
  announce,
  announceMessages,
}: ChatPipelineDeps) {
  const { persona, chatOptions, speechOptions, formatReply, voiceProcessing } = personaState;
  const characterId = persona.id;

  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  // Used once, after the greeting (see ChatPipelineDeps.initialInput).
  const pendingInputRef = useRef(initialInput ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [isGreeting, setIsGreeting] = useState(false);
  const [isPreparingGreeting, setIsPreparingGreeting] = useState(false);

  // Guards one conversational turn at a time across async callers (typed input,
  // templates, voice) without depending on render-time state.
  const busyRef = useRef(false);
  // Local engine state per persona (ELIZA, PARRY, HAL, JOSHUA); see engine/personaTurn.
  const enginesRef = useRef<PersonaEngines>({});
  const engineSeedRef = useRef(Date.now() >>> 0);
  // Lets in-flight async sequences (greeting, typewriter) stop after unmount.
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  const handleNameSubmit = async () => {
    const name = nameInput.trim().toUpperCase();
    if (!name || isPreparingGreeting) return;

    // The submit is a user gesture, so this is when audio may be unlocked.
    void ensureAudioReady();
    setIsPreparingGreeting(true);

    const lines = personaGreeting(persona.id, persona.name, name);

    // One TTS request for the whole greeting stays well inside rate limits.
    // Any failure degrades to a text-only session rather than blocking it.
    // JOSHUA's LOGON prompt is printed, never spoken.
    const spokenGreeting = characterId === 'joshua' ? '' : lines.filter((line) => line.trim()).join('. ');
    const audio = await (
      spokenGreeting ? synthesizeSpeech(spokenGreeting, characterId, speechOptions) : Promise.resolve('')
    ).catch((error) => {
      console.warn('Greeting speech unavailable; continuing text-only:', error);
      return '';
    });
    if (unmountedRef.current) return;

    setIsPreparingGreeting(false);
    setUserName(name);
    setIsGreeting(true);
    void playSoundPackEvent('startup');

    // Speak while the lines appear; input unlocks once both have finished.
    const spoken = speech
      .speak(audio, lines.filter((l) => l.trim()).join(' '), { processing: voiceProcessing })
      .catch((error) => console.warn('Greeting audio failed:', error));
    for (const line of lines) {
      if (unmountedRef.current) return;
      setMessages((prev) => [...prev, { author: 'dr', text: line, timestamp: Date.now(), characterId }]);
      await sleep(GREETING_LINE_DELAY_MS);
    }
    await spoken;
    if (unmountedRef.current) return;
    setIsGreeting(false);
    setIsLoading(false);
    if (pendingInputRef.current) {
      setUserInput(pendingInputRef.current);
      pendingInputRef.current = '';
    }
  };

  /**
   * One conversational turn: get the reply, type it out, then speak it.
   * Returns false if no reply was produced. A speech or playback failure never
   * removes a reply the user has already read.
   */
  const sendMessage = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed || busyRef.current) return false;
    busyRef.current = true;
    setIsLoading(true);
    void ensureAudioReady();

    soundEffects.playSound('message-send');
    void playSoundPackEvent('message-send');
    setMessages((prev) => [...prev, { author: 'user', text: trimmed, timestamp: Date.now(), characterId }]);

    // Personas with a local engine decide the turn first (engine/personaTurn).
    const turn = personaTurn(characterId, enginesRef.current, trimmed, {
      userName: userName ?? '',
      seed: engineSeedRef.current,
    });
    enginesRef.current = turn.engines;
    const plan = turn.plan;

    try {
      if (plan.kind === 'ignore') return false;
      let reply: string;
      try {
        if (plan.kind === 'local') {
          reply = plan.lines.join('\n');
        } else if (plan.kind === 'model') {
          const options = plan.customCharacter ? { customCharacter: plan.customCharacter } : {};
          reply = plan.finalize(
            await getAIResponse(plan.message, plan.historyKey, options).catch((error: unknown) => {
              if (plan.fallback) return plan.fallback;
              throw error;
            }),
          );
          if (plan.onReply) enginesRef.current = plan.onReply(enginesRef.current, reply);
        } else {
          reply = formatReply(await getAIResponse(trimmed, characterId, chatOptions));
        }
      } catch (error) {
        console.error('Reply failed:', error);
        soundEffects.playSound('error');
        void playSoundPackEvent('error');
        const ctx = getSharedAudioContext();
        if (ctx) playErrorBeep(ctx);
        setMessages((prev) => [
          ...prev,
          { author: 'dr', text: retroErrorMessage(error), timestamp: Date.now(), characterId },
        ]);
        return false;
      }

      // The original's parity text (the model is told never to emit it, but the
      // same check counts glitches in saved sessions).
      if (isParityText(reply)) {
        const ctx = getSharedAudioContext();
        if (ctx) playGlitchSound(ctx);
        void playSoundPackEvent('glitch');
      }

      // What is spoken can differ from what is shown (JOSHUA's boards and lists).
      const spokenText = plan.kind === 'local' ? plan.speak : reply;
      // Synthesis runs while the reply is typed out.
      const audioPromise = (
        mutedRef.current || !spokenText.trim()
          ? Promise.resolve('')
          : synthesizeSpeech(spokenText, characterId, speechOptions)
      ).catch((error) => {
        console.warn('Reply speech unavailable; continuing text-only:', error);
        return '';
      });

      // Speak-only turns (Dr. Sbaitso's R) add nothing to the log.
      const printsNothing = plan.kind === 'local' && plan.lines.length === 0;
      if (!printsNothing) {
        setMessages((prev) => [...prev, { author: 'dr', text: '', timestamp: Date.now(), characterId }]);
      }
      // Long printouts (JOSHUA's self-play lesson) scroll at terminal speed.
      const typingDelay = reply.length > LONG_PRINTOUT_CHARS ? FAST_TYPING_DELAY_MS : TYPING_DELAY_MS;
      for (let i = 0; i < reply.length; i++) {
        await sleep(typingDelay);
        if (unmountedRef.current) return true;
        // Set the visible prefix rather than appending: the updater must be
        // pure, because React StrictMode invokes it twice.
        const visible = reply.slice(0, i + 1);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, text: visible }];
        });
      }

      try {
        await speech.speak(await audioPromise, spokenText, { processing: voiceProcessing });
      } catch (error) {
        console.warn('Reply audio could not be played; the text is kept:', error);
      }

      soundEffects.playSound('message-receive');
      void playSoundPackEvent('message-receive');
      // The log itself is not a live region (it would re-announce every typed
      // character), so the finished reply is announced once here.
      if (announceMessages) {
        announce(`${persona.name} says: ${reply}`);
      }
      return true;
    } finally {
      busyRef.current = false;
      if (!unmountedRef.current) setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setUserInput('');
    resetChat(characterId); // the model forgets too, as the greeting promises
    if (characterId === 'parry') resetChat('parry-engine');
    enginesRef.current = resetPersona(enginesRef.current, characterId);
  };

  /**
   * Switches persona mid-conversation. Each persona keeps its own model
   * history (services/geminiService.ts); the log shows where the switch
   * happened.
   */
  const switchPersona = (id: string) => {
    const next = personaState.personas.find((p) => p.id === id);
    if (!next || next.id === persona.id) return;
    personaState.selectPersona(id);
    void playSoundPackEvent('character-switch');
    if (userName) {
      setMessages((prev) => [
        ...prev,
        {
          author: 'dr',
          text: `--- NOW TALKING TO ${next.name.toUpperCase()} ---`,
          timestamp: Date.now(),
          characterId: id,
        },
        // A persona with its own opener (JOSHUA's LOGON:) shows it on arrival.
        ...(hasStarted(enginesRef.current, id) ? [] : (personaOpening(id) ?? [])).map((text) => ({
          author: 'dr' as const,
          text,
          timestamp: Date.now(),
          characterId: id,
        })),
      ]);
    }
    announce(`Now talking to ${next.name}`);
  };

  const handleUserInput = () => {
    if (!userInput.trim() || busyRef.current) return;
    const text = userInput;
    setUserInput('');
    void sendMessage(text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Play keypress sound (v1.9.0)
    soundEffects.playSound('keypress');

    if (event.key === 'Enter') {
      handleUserInput();
    }
  };

  // Handle voice transcript (v1.11.0)
  const handleVoiceTranscript = useCallback(
    (transcript: string) => {
      if (transcript.trim()) {
        setUserInput((prev) => prev + (prev ? ' ' : '') + transcript.trim());
        announce(`Voice input: ${transcript}`);
      }
    },
    [announce],
  );

  // Handle template selection (v1.11.0): each prompt is a normal turn, with
  // typing, speech and the busy guard, instead of a parallel side channel.
  const handleSelectTemplate = async (prompts: string[]) => {
    if (prompts.length === 0 || !userName) return;
    announce('Applying conversation template');
    for (const prompt of prompts) {
      const ok = await sendMessage(prompt);
      if (!ok || unmountedRef.current) {
        announce('Template stopped');
        break;
      }
      await sleep(1000);
    }
  };

  return {
    userName,
    nameInput,
    setNameInput,
    messages,
    userInput,
    setUserInput,
    isLoading,
    isGreeting,
    isPreparingGreeting,
    handleNameSubmit,
    sendMessage,
    clearConversation,
    switchPersona,
    handleUserInput,
    handleKeyDown,
    handleVoiceTranscript,
    handleSelectTemplate,
  };
}

export type ChatPipeline = ReturnType<typeof useChatPipeline>;
