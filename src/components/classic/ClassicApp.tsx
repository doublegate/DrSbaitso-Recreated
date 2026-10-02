/**
 * Classic mode: the faithful Dr. Sbaitso session on an 80x25 DOS screen.
 *
 * Every line the user types goes to the local engine first
 * (src/engine/sbaitso): the original's commands (HELP, R, SAY, CALC, dot
 * commands), the deterministic cases (empty, short, repeated, garbage input,
 * profanity and the parity sequence) and the exit menu are answered locally;
 * only open conversation is sent to Gemini (the "hybrid" design).
 *
 * Layout and wording follow ref-docs/01 and 03: banner, "Please enter your
 * name ..." typed inline, the v2.20 greeting, a yellow ">" prompt, doctor
 * lines with a one-space indent, printed a line at a time and then spoken.
 */
import { useEffect, useRef, useState } from 'react';
import DosScreen from './DosScreen';
import { createScreen, print, visibleRows, DOS, type Row, type Screen } from '../../utils/dosScreen';
import { getAIResponse, resetChat, synthesizeSpeech } from '../../services/geminiService';
import { useSpeechPlayer } from '../../hooks/useSpeechPlayer';
import { useScreenReader } from '../../hooks/useScreenReader';
import { ensureAudioReady, getSharedAudioContext } from '../../utils/sharedAudio';
import { playGlitchSound } from '../../utils/audio';
import { retroErrorMessage } from '../../utils/retroErrors';
import {
  DEFAULT_SETTINGS,
  MAX_NAME_LENGTH,
  NAME_ERROR_TEXT,
  NAME_PROMPT,
  createSbaitsoState,
  exitMenuText,
  greetingLines,
  greetingSpeech,
  processInput,
  recordReply,
  resolveExitChoice,
  validateName,
  type SbaitsoSettings,
  type SbaitsoState,
} from '../../engine/sbaitso';

const LINE_DELAY_MS = 600;
const DOS_PROMPT = 'C:\\SB>';

type Phase = 'name' | 'busy' | 'chat' | 'menu' | 'dos';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Doctor lines carry a one-space indent, as in the original. */
const indent = (line: string) => (line === '' || line.startsWith(' ') ? line : ` ${line}`);

export default function ClassicApp({ onSwitchMode }: { onSwitchMode?: () => void }) {
  const [screen, setScreen] = useState<Screen>(() => createScreen());
  const [phase, setPhase] = useState<Phase>('name');
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState<SbaitsoSettings>(DEFAULT_SETTINGS);
  const [transcript, setTranscript] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const engine = useRef<SbaitsoState>(createSbaitsoState(''));
  const unmounted = useRef(false);
  const speech = useSpeechPlayer('authentic');
  const { announce } = useScreenReader();

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [phase]);

  const fg = settings.foreground;
  const text = (t: string): Row => [{ text: t, fg }];
  const printRows = (...rows: Row[]) => setScreen((s) => print(s, ...rows));
  const log = (line: string) => setTranscript((t) => [...t.slice(-200), line]);

  const applySettings = (changes: Partial<SbaitsoSettings>) => {
    if (Object.keys(changes).length === 0) return;
    setSettings((prev) => {
      const next = { ...prev, ...changes };
      if (next.width !== prev.width) {
        // .WIDTH redraws the screen at the new size, keeping the session.
        setScreen((s) => ({ ...createScreen({ cols: next.width }), lines: s.lines }));
      }
      return next;
    });
  };

  /** Speaks text (the doctor's voice); resolves when playback ends. */
  const speak = async (spoken: string) => {
    if (!spoken.trim()) return;
    try {
      await speech.speak(await synthesizeSpeech(spoken, 'sbaitso'), spoken);
    } catch (error) {
      console.warn('Speech unavailable; text kept:', error);
    }
  };

  /** Prints lines one at a time (speech is fetched meanwhile), then speaks them. */
  const printAndSpeak = async (lines: string[], spokenLines: string[] = lines) => {
    const spoken = spokenLines.map((l) => l.trim()).filter(Boolean).join(' ');
    const audio = spoken ? synthesizeSpeech(spoken, 'sbaitso').catch(() => '') : Promise.resolve('');
    const label = settings.prompt ? 'Computer: ' : '';
    for (const line of lines) {
      if (unmounted.current) return;
      // With .PROMPT ON doctor lines are labelled "Computer: " instead of indented.
      printRows(text(line === '' ? '' : label ? label + line.trim() : indent(line)));
      if (line.trim()) log(`Doctor Sbaitso: ${line.trim()}`);
      await sleep(LINE_DELAY_MS);
    }
    if (spoken) announce(spoken);
    try {
      await speech.speak(await audio, spoken);
    } catch (error) {
      console.warn('Speech unavailable; text kept:', error);
    }
  };

  const startSession = () => {
    engine.current = createSbaitsoState('');
    setSettings(DEFAULT_SETTINGS);
    setScreen(createScreen());
    setPhase('name');
  };

  const submitName = async () => {
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
    engine.current = createSbaitsoState(result.name);
    resetChat('sbaitso');
    setPhase('busy');
    await printAndSpeak(greetingLines(result.name), greetingSpeech(result.name));
    if (!unmounted.current) {
      printRows([]);
      setPhase('chat');
    }
  };

  /** Handles one line through the engine; returns the next phase. */
  const handleLine = async (line: string): Promise<Phase> => {
    const step = processInput(engine.current, line);
    engine.current = step.state;
    const result = step.result;

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
        return 'chat';
      }
      case 'reply':
        if (result.stopSpeech) speech.stop();
        if (result.settings) applySettings(result.settings);
        await printAndSpeak(result.lines, result.speak);
        return 'chat';
      case 'parity': {
        const ctx = getSharedAudioContext();
        if (ctx) playGlitchSound(ctx);
        await printAndSpeak(result.lines, result.speak);
        return 'chat';
      }
      case 'help':
        for (const helpLine of result.lines) printRows(text(helpLine));
        result.lines.forEach((l) => log(l));
        return 'chat';
      case 'setting':
        applySettings(result.settings);
        for (const msg of result.lines) printRows(text(msg));
        result.lines.forEach((l) => log(l));
        return 'chat';
      case 'repeat':
        await speak(result.lines.join(' '));
        return 'chat';
      case 'say':
        await speak(result.text);
        return 'chat';
      case 'exit':
        await printAndSpeak(result.lines);
        if (!result.showMenu) return quitToDos();
        printRows([], text(exitMenuText()));
        log(exitMenuText());
        return 'menu';
      case 'noop':
      default:
        return 'chat';
    }
  };

  const quitToDos = (): Phase => {
    speech.stop();
    setScreen((s) => print({ ...createScreen({ cols: s.cols }), banner: [], lines: [[]] }, text(DOS_PROMPT)));
    log('Program ended. Press Enter to run Doctor Sbaitso again.');
    return 'dos';
  };

  const submitLine = async () => {
    const line = input;
    setInput('');
    const promptLabel = settings.prompt ? 'User> ' : '>';
    printRows([
      { text: promptLabel, fg: DOS.yellow },
      { text: line, fg },
    ]);
    log(`You: ${line}`);
    setPhase('busy');
    if (settings.echo && line.trim()) await speak(line);
    const next = await handleLine(line);
    if (unmounted.current) return;
    if (next === 'chat') printRows([]);
    setPhase(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (phase === 'menu') {
      // The exit menu reacts to a single key, like the original.
      const choice = resolveExitChoice(e.key);
      if (!choice) return;
      e.preventDefault();
      printRows(text(e.key.toUpperCase()));
      if (choice === 'continue') {
        printRows([]);
        setPhase('chat');
      } else if (choice === 'new') {
        startSession();
      } else {
        setPhase(quitToDos());
      }
      return;
    }
    if (e.key !== 'Enter' || phase === 'busy') return;
    e.preventDefault();
    if (phase === 'dos') {
      startSession();
      setInput('');
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
            { text: input, fg },
          ]
        : phase === 'dos'
          ? text(DOS_PROMPT + input)
          : [];
  const view = promptRow.length ? print(screen, promptRow) : screen;
  const rows = visibleRows(view);
  const lastText = promptRow.map((s) => s.text).join('');
  const cursor =
    phase === 'busy' || phase === 'menu'
      ? null
      : { row: rows.length - 1 - trailingBlank(rows), col: Math.min(lastText.length % screen.cols, screen.cols - 1) };

  const label =
    phase === 'name'
      ? 'Please enter your name'
      : phase === 'menu'
        ? 'Press C to continue, N for a new patient, or Q to quit'
        : phase === 'dos'
          ? 'Press Enter to run Doctor Sbaitso again'
          : 'Talk to Doctor Sbaitso';

  return (
    <main onClick={() => inputRef.current?.focus()} aria-label="Doctor Sbaitso">
      <DosScreen rows={rows} cols={screen.cols} cursor={cursor} background={settings.background} />
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
        maxLength={phase === 'name' ? MAX_NAME_LENGTH + 10 : 160}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={phase === 'busy'}
        onChange={(e) => phase !== 'menu' && setInput(e.target.value)}
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

/** Rows at the bottom that are entirely blank (padding below the cursor line). */
function trailingBlank(rows: Row[]): number {
  let n = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].every((s) => s.text.trim() === '')) n++;
    else break;
  }
  return n;
}
