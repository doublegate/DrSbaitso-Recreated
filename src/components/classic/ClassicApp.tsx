/**
 * Classic mode: the faithful Dr. Sbaitso session on an 80x25 DOS screen.
 *
 * Every line the user types goes to the local engine first
 * (src/engine/sbaitso): the original's commands (HELP, R, SAY, CALC, dot
 * commands), the deterministic cases (empty, short, repeated, garbage input,
 * profanity and the parity flood) and the exit menu are answered locally;
 * only open conversation is sent to Gemini (the "hybrid" design).
 *
 * Screen behaviour follows the DOSBox-X run of the original
 * (ref-docs/04-dosbox-verification.md):
 * - Doctor lines appear whole, one at a time. Each is printed, then spoken,
 *   and the next one prints when that speech ends. A reply is synthesised in
 *   one request and each line is shown at its estimated place in the clip
 *   (utils/speechCues). A keypress cuts the speech; the rest prints unspoken.
 * - Replies start at column 0 (only the greeting is indented). A turn is the
 *   yellow input line, the reply, one blank row and the next `>`.
 * - The banner is pinned; rows 5-23 scroll and row 24 stays blank.
 * - The cursor shows only while waiting at `>`.
 * - BYE / QUIT / .QUIT lead to the C/N/Q menu on the next row.
 * - Each letter typed at the name prompt is spoken about 0.06 s after its
 *   echo, from a browser-side cache of the alphabet (utils/letterVoice).
 */
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import DosScreen from './DosScreen';
import { createScreen, print, visibleRows, DOS, type Row, type Screen } from '../../utils/dosScreen';
import { getAIResponse, resetChat, synthesizeSpeech } from '../../services/geminiService';
import { useSpeechPlayer } from '../../hooks/useSpeechPlayer';
import { useScreenReader } from '../../hooks/useScreenReader';
import { ensureAudioReady, getSharedAudioContext, peekSharedAudioContext } from '../../utils/sharedAudio';
import { playParityTone } from '../../utils/audio';
import { cueOffsets } from '../../utils/speechCues';
import { retroErrorMessage } from '../../utils/retroErrors';
import { isSpokenLetter, playLetter, warmLetterCache } from '../../utils/letterVoice';
import {
  CALC_LABEL,
  DEFAULT_SETTINGS,
  MAX_NAME_LENGTH,
  NAME_ERROR_TEXT,
  NAME_PROMPT,
  createSbaitsoState,
  exitMenuText,
  greetingLines,
  isNameCharAllowed,
  processInput,
  recordReply,
  resolveExitChoice,
  validateName,
  type SbaitsoSettings,
  type SbaitsoState,
} from '../../engine/sbaitso';

/** Gap between lines printed without speech (after a keypress, or when TTS is unavailable). */
const LINE_GAP_MS = 70;
/** The parity flood: about 250 lines in about 3.5 s (ref-docs/04 section 4). */
const FLOOD_MS = 3500;
/** Flood lines are printed in batches this often. */
const FLOOD_TICK_MS = 40;
const DOS_PROMPT = 'C:\\SB>';
/** DOS's default light grey on black, used below the banner after Q. */
const DOS_GREY = 7;
const DOS_BLACK = 0;
/** What the original says before the name prompt (CONFIRMED (DOSBox)). */
const INTRO_SPEECH = ['DOCTOR SBAITSO.', 'BY CREATIVE LABS.'];
const NAME_PROMPT_SPEECH = 'PLEASE ENTER YOUR NAME.';
/** A typed name letter is spoken this long after its echo (ref-docs/04 section 1). */
const LETTER_DELAY_MS = 60;

type Phase = 'intro' | 'name' | 'busy' | 'chat' | 'menu' | 'dos';

/** One printed line (or event) and what is said for it. */
interface Cue {
  row?: Row;
  show?: () => void;
  spoken: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const randomSeed = () => Math.floor(Math.random() * 0x100000000);

/** Longest input line, as the hidden input enforces it. */
const MAX_LINE_LENGTH = 160;

interface ClassicAppProps {
  onSwitchMode?: () => void;
  /** Seed for the engine's random replies; random per session when omitted. */
  seed?: number;
  /** Duration of the parity flood, in ms (tests shorten it). */
  floodMs?: number;
  /** Text shared to the app (Web Share Target): typed, unsent, at the first > prompt. */
  initialInput?: string;
}

export default function ClassicApp({ onSwitchMode, seed, floodMs = FLOOD_MS, initialInput }: ClassicAppProps) {
  const [screen, setScreen] = useState<Screen>(() => createScreen());
  const [phase, setPhase] = useState<Phase>('intro');
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState<SbaitsoSettings>(DEFAULT_SETTINGS);
  const [transcript, setTranscript] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Used once, at the first prompt after the greeting.
  const pendingInput = useRef((initialInput ?? '').slice(0, MAX_LINE_LENGTH));
  const engine = useRef<SbaitsoState>(createSbaitsoState('', seed ?? randomSeed()));
  const unmounted = useRef(false);
  const started = useRef(false);
  /** Cuts the speech of the cues being played; set while they play. */
  const cutSpeech = useRef<(() => void) | null>(null);
  const speech = useSpeechPlayer('authentic');
  // A second player for the name letters, so cutting a letter never cuts the doctor.
  const letterSpeech = useSpeechPlayer('authentic');
  const letterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { announce } = useScreenReader();

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      if (letterTimer.current) clearTimeout(letterTimer.current);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [phase]);

  const fg = settings.foreground;
  const text = (t: string): Row => [{ text: t, fg }];
  const printRows = (...rows: Row[]) => setScreen((s) => print(s, ...rows));
  const log = (line: string) => setTranscript((t) => [...t.slice(-200), line]);
  /** A reply line: column 0, labelled `Computer: ` under .PROMPT ON. */
  const replyRow = (line: string): Row => text(settings.prompt && line !== '' ? CALC_LABEL + line : line);

  const applySettings = (changes: Partial<SbaitsoSettings>) => {
    if (Object.keys(changes).length === 0) return;
    setSettings((prev) => {
      const next = { ...prev, ...changes };
      if (next.width !== prev.width || next.background !== prev.background) {
        // .WIDTH and .COLOR redraw the banner and clear the rows below it
        // (CONFIRMED (DOSBox), ref-docs/04 section 6).
        setScreen(createScreen({ cols: next.width }));
      }
      return next;
    });
  };

  /**
   * Shows the cues in order and speaks them with one TTS request. The first
   * cue appears at once; each later one when the speech reaches it. If the
   * speech is cut (a keypress) or unavailable, the rest appear unspoken.
   */
  const playCues = async (cues: Cue[]) => {
    if (cues.length === 0 || unmounted.current) return;
    const spokenParts = cues.map((c) => c.spoken.trim());
    const spoken = spokenParts.filter(Boolean).join(' ');
    let shown = 0;
    const showUpTo = (index: number) => {
      while (shown <= index && shown < cues.length && !unmounted.current) {
        const cue = cues[shown++];
        if (cue.row) printRows(cue.row);
        cue.show?.();
      }
    };

    let cut = false;
    const cutPromise = new Promise<''>((resolve) => {
      cutSpeech.current = () => {
        cut = true;
        speech.stop();
        resolve('');
      };
    });

    showUpTo(0);
    if (spoken) {
      announce(spoken);
      const audio = await Promise.race([synthesizeSpeech(spoken, 'sbaitso').catch(() => ''), cutPromise]);
      if (audio && !cut && !unmounted.current) {
        const offsets = cueOffsets(spokenParts);
        const timers: ReturnType<typeof setTimeout>[] = [];
        try {
          await speech.speak(audio, spoken, {
            onStart: (seconds) => {
              for (let i = shown; i < cues.length; i++) {
                timers.push(setTimeout(() => showUpTo(i), offsets[i] * seconds * 1000));
              }
            },
          });
        } catch (error) {
          console.warn('Speech unavailable; text kept:', error);
        }
        timers.forEach(clearTimeout);
      }
    }
    cutSpeech.current = null;
    // Whatever the speech did not reach prints unspoken, a line at a time.
    while (shown < cues.length && !unmounted.current) {
      await sleep(LINE_GAP_MS);
      showUpTo(shown);
    }
  };

  /** Prints reply lines at column 0 and speaks them. */
  const printAndSpeak = (lines: string[], spokenLines: string[] = lines) => {
    lines.forEach((l) => l.trim() && log(`Doctor Sbaitso: ${l.trim()}`));
    return playCues(lines.map((line, i) => ({ row: replyRow(line), spoken: spokenLines[i] ?? '' })));
  };

  /** Speaks without printing (R, .ECHO). */
  const speakOnly = (spoken: string) => playCues([{ spoken }]);

  /** Cuts the name letter that is playing or about to play. */
  const cutLetter = () => {
    if (letterTimer.current) clearTimeout(letterTimer.current);
    letterTimer.current = null;
    letterSpeech.stop();
  };

  /**
   * A change to the name: a letter A-Z that was typed is spoken shortly after
   * its echo, if the alphabet is cached; anything else is silent. Typing is
   * never held up, and each change cuts the letter before it.
   */
  const changeName = (next: string) => {
    const typed = insertedChar(input, next);
    setInput(next);
    cutLetter();
    // A key press is a user gesture, so audio can be created here; the
    // alphabet is fetched in the background only where it can be played.
    if (getSharedAudioContext()) void warmLetterCache();
    if (typed === null || !isSpokenLetter(typed) || !isNameCharAllowed(typed)) return;
    letterTimer.current = setTimeout(() => {
      letterTimer.current = null;
      if (!unmounted.current) playLetter(typed, letterSpeech);
    }, LETTER_DELAY_MS);
  };

  /** The name prompt, printed and spoken; with `intro`, preceded by the spoken title. */
  const askName = async (intro: boolean) => {
    const prompt: Cue = { show: () => setPhase('name'), spoken: NAME_PROMPT_SPEECH };
    const ctx = peekSharedAudioContext();
    // Browsers keep audio locked until a user gesture, so a first visit starts silently.
    if (!ctx || ctx.state !== 'running') {
      setPhase('name');
      return;
    }
    void warmLetterCache();
    setPhase(intro ? 'intro' : 'name');
    await playCues(intro ? [...INTRO_SPEECH.map((spoken) => ({ spoken })), prompt] : [prompt]);
  };

  /** Runs the program from the start: banner, intro, name prompt. */
  const startProgram = () => {
    engine.current = createSbaitsoState('', seed ?? randomSeed());
    setSettings(DEFAULT_SETTINGS);
    setScreen(createScreen());
    void askName(true);
  };

  const onMount = useEffectEvent(() => {
    if (started.current) return;
    started.current = true;
    void askName(true);
  });
  useEffect(() => onMount(), []);

  /** N at the menu: clear below the banner and ask for a new name, without the intro. */
  const newPatient = () => {
    setScreen((s) => ({ ...s, lines: [[]] }));
    void askName(false);
  };

  const submitName = async () => {
    cutLetter();
    const result = validateName(input);
    const typed = input;
    setInput('');
    printRows(text(NAME_PROMPT + typed));
    if (!result.ok) {
      if (result.reason !== 'empty') {
        printRows(text(NAME_ERROR_TEXT[result.reason]));
        log(NAME_ERROR_TEXT[result.reason]);
      }
      return;
    }
    void ensureAudioReady();
    // A new patient keeps the screen settings (colour, width); the engine starts afresh.
    engine.current = { ...createSbaitsoState(result.name, seed ?? randomSeed()), settings };
    resetChat('sbaitso');
    setPhase('busy');
    const greeting = greetingLines(result.name);
    greeting.forEach((l) => l.trim() && log(`Doctor Sbaitso: ${l.trim()}`));
    await playCues(greeting.map((line) => ({ row: text(line), spoken: line.trim() })));
    if (!unmounted.current) {
      printRows([]);
      setPhase('chat');
      if (pendingInput.current) {
        setInput(pendingInput.current);
        pendingInput.current = '';
      }
    }
  };

  /** The parity routine: lead lines, the flood with its tone, then PARITY. */
  const parityFlood = async (flood: string[]) => {
    const ctx = getSharedAudioContext();
    if (ctx) playParityTone(ctx, floodMs / 1000 + 0.5);
    log(`Doctor Sbaitso: ${flood[0] ?? ''} ... ${flood[flood.length - 1] ?? ''}`);
    const ticks = Math.max(1, Math.round(floodMs / FLOOD_TICK_MS));
    const perTick = Math.max(1, Math.ceil(flood.length / ticks));
    for (let i = 0; i < flood.length; i += perTick) {
      if (unmounted.current) return;
      printRows(...flood.slice(i, i + perTick).map((l) => text(l)));
      await sleep(floodMs / ticks);
    }
  };

  /** Handles one line through the engine; returns the next phase and whether a blank row precedes the prompt. */
  const handleLine = async (line: string): Promise<{ next: Phase; blank: boolean }> => {
    const step = processInput(engine.current, line);
    engine.current = step.state;
    const result = step.result;
    const chat = { next: 'chat' as const, blank: true };

    switch (result.kind) {
      case 'model': {
        try {
          const reply = (await getAIResponse(result.message, 'sbaitso'))
            .split('\n')
            .map((l) => l.trim().toUpperCase())
            .filter((l, i, all) => l !== '' || (i > 0 && all[i - 1] !== ''));
          engine.current = recordReply(engine.current, reply);
          await printAndSpeak(reply);
        } catch (error) {
          await printAndSpeak([retroErrorMessage(error)]);
        }
        return chat;
      }
      case 'reply':
        if (result.stopSpeech) speech.stop();
        if (result.settings) applySettings(result.settings);
        await printAndSpeak(result.lines, result.speak);
        // After an age question the next prompt follows with no blank row (CONFIRMED (DOSBox)).
        return { next: 'chat', blank: engine.current.pending.kind !== 'age' };
      case 'parity':
        await printAndSpeak(result.lead, result.leadSpeak);
        await parityFlood(result.flood);
        await printAndSpeak(result.lines, result.speak);
        return chat;
      case 'help': {
        // Each page replaces the screen; page 1 removes the banner too and
        // later pages redraw it (CONFIRMED (DOSBox), ref-docs/04 section 6).
        const pageRows = result.lines.map((l) => text(l));
        setScreen((s) =>
          result.page === 1
            ? { ...createScreen({ cols: s.cols }), banner: [], lines: pageRows }
            : print(createScreen({ cols: s.cols }), ...pageRows),
        );
        result.lines.forEach((l) => log(l));
        return chat;
      }
      case 'setting': {
        const promptOff = result.settings.prompt === false && settings.prompt;
        const redraw =
          (result.settings.width !== undefined && result.settings.width !== settings.width) ||
          (result.settings.background !== undefined && result.settings.background !== settings.background);
        applySettings(result.settings);
        for (const msg of result.lines) printRows(text(msg));
        result.lines.forEach((l) => log(l));
        // .PROMPT OFF prints an empty "Computer:" line and the prompt follows directly.
        if (promptOff) printRows(text(CALC_LABEL.trimEnd()));
        // After a redraw the prompt starts on row 6, right below the blank row 5.
        return { next: 'chat', blank: !promptOff && !redraw };
      }
      case 'repeat':
        // R re-speaks the last reply; nothing is printed and the prompt follows on the next row.
        await speakOnly(result.lines.join(' '));
        return { next: 'chat', blank: false };
      case 'say':
        await printAndSpeak([result.text.toUpperCase()], [result.text]);
        return chat;
      case 'exit':
        await printAndSpeak(result.lines);
        // The menu follows on the very next row; it is not spoken.
        printRows(text(exitMenuText()));
        log(exitMenuText());
        return { next: 'menu', blank: false };
      case 'noop':
      default:
        return chat;
    }
  };

  const quitToDos = (): Phase => {
    speech.stop();
    // The banner stays; the rows below become a DOS screen (CONFIRMED (DOSBox)).
    setScreen((s) => ({ ...s, lines: [] }));
    log('Program ended. Press Enter to run Doctor Sbaitso again.');
    return 'dos';
  };

  const submitLine = async () => {
    const line = input;
    setInput('');
    const promptLabel = settings.prompt ? 'User> ' : '>';
    // The whole input line is yellow (CONFIRMED (DOSBox)).
    printRows([
      { text: promptLabel, fg: DOS.yellow },
      { text: line, fg: DOS.yellow },
    ]);
    log(`You: ${line}`);
    setPhase('busy');
    if (settings.echo && line.trim()) await speakOnly(line);
    const { next, blank } = await handleLine(line);
    if (unmounted.current) return;
    if (next === 'chat' && blank) printRows([]);
    setPhase(next);
  };

  // An Enter pressed while the doctor is busy is kept and taken as the next
  // input once the prompt returns (CONFIRMED (DOSBox), ref-docs/04 run K).
  const enterQueued = useRef(false);
  const takeQueuedEnter = useEffectEvent(() => {
    if (!enterQueued.current) return;
    enterQueued.current = false;
    void submitLine();
  });
  useEffect(() => {
    if (phase === 'chat') takeQueuedEnter();
  }, [phase]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Any key cuts the doctor's speech; queued lines then print unspoken.
    if (cutSpeech.current && !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) cutSpeech.current();
    if (phase === 'menu') {
      // The exit menu reacts to a single key, like the original, and does not echo it.
      const choice = resolveExitChoice(e.key);
      if (!choice) return;
      e.preventDefault();
      if (choice === 'continue') {
        printRows([]);
        setPhase('chat');
      } else if (choice === 'new') {
        newPatient();
      } else {
        setPhase(quitToDos());
      }
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (phase === 'busy') {
      enterQueued.current = true;
      return;
    }
    if (phase === 'intro') return;
    if (phase === 'dos') {
      setInput('');
      startProgram();
    } else if (phase === 'name') {
      void submitName();
    } else {
      void submitLine();
    }
  };

  // The live input row is drawn on top of what has been printed.
  const promptRow: Row =
    phase === 'name'
      ? text(NAME_PROMPT + input)
      : phase === 'chat'
        ? [
            { text: settings.prompt ? 'User> ' : '>', fg: DOS.yellow },
            { text: input, fg: DOS.yellow },
          ]
        : phase === 'dos'
          ? [{ text: DOS_PROMPT + input, fg: DOS_GREY }]
          : [];
  const view = promptRow.length ? print(screen, promptRow) : screen;
  const rows = visibleRows(view);
  const lastText = promptRow.map((s) => s.text).join('');
  // The cursor shows only while waiting at a prompt: hidden for the name, while speaking and at the menu.
  const cursor =
    phase === 'chat' || phase === 'dos'
      ? { row: rows.length - 1 - trailingBlank(rows), col: Math.min(lastText.length % screen.cols, screen.cols - 1) }
      : null;

  const label =
    phase === 'name'
      ? 'Please enter your name'
      : phase === 'menu'
        ? 'Press C to continue, N for a new patient, or Q to quit'
        : phase === 'dos'
          ? 'Press Enter to run Doctor Sbaitso again'
          : phase === 'intro'
            ? 'Doctor Sbaitso is starting'
            : 'Talk to Doctor Sbaitso';

  return (
    <main onClick={() => inputRef.current?.focus()} aria-label="Doctor Sbaitso" data-phase={phase}>
      <DosScreen
        rows={rows}
        cols={screen.cols}
        cursor={cursor}
        background={settings.background}
        regionBackground={phase === 'dos' ? DOS_BLACK : undefined}
      />
      <div className="sr-only" role="log" aria-live="off" aria-label="Conversation">
        {transcript.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <label htmlFor="classic-input" className="sr-only">
        {label}
      </label>
      <input
        id="classic-input"
        ref={inputRef}
        className="dos-hidden-input"
        value={input}
        maxLength={phase === 'name' ? MAX_NAME_LENGTH + 10 : MAX_LINE_LENGTH}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-busy={phase === 'busy' || phase === 'intro'}
        onChange={(e) => {
          if (phase === 'name') changeName(e.target.value);
          else if (phase !== 'menu' && phase !== 'intro') setInput(e.target.value);
        }}
        onKeyDown={onKeyDown}
      />
      {onSwitchMode && (
        <button type="button" className="sr-only focus:not-sr-only dos-mode-link" onClick={onSwitchMode}>
          Switch to the enhanced interface (Alt+Shift+X)
        </button>
      )}
    </main>
  );
}

/** The one character typed to turn `prev` into `next`, or null for any other edit. */
function insertedChar(prev: string, next: string): string | null {
  if (next.length !== prev.length + 1) return null;
  let i = 0;
  while (i < prev.length && prev[i] === next[i]) i++;
  return next.slice(0, i) + next.slice(i + 1) === prev ? next[i] : null;
}

/** Rows at the bottom that are entirely blank (padding below the cursor line). */
function trailingBlank(rows: Row[]): number {
  let n = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].every((s) => s.text.trim() === '')) n++;
    else break;
  }
  return n;
}
