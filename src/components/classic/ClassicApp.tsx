/**
 * Classic mode: the faithful Dr. Sbaitso session on an 80x25 DOS screen.
 *
 * Flow (ref-docs/01 and 03): banner, "Please enter your name ..." typed on the
 * same line, the v2.20 greeting, then a yellow ">" prompt. Doctor lines are
 * printed with a one-space indent, a whole line at a time, and spoken.
 *
 * `respond()` is the single seam between input and the conversation engine.
 */
import { useEffect, useRef, useState } from 'react';
import DosScreen from './DosScreen';
import { createScreen, print, visibleRows, DOS, type Row, type Screen } from '../../utils/dosScreen';
import { getAIResponse, resetChat, synthesizeSpeech } from '../../services/geminiService';
import { useSpeechPlayer } from '../../hooks/useSpeechPlayer';
import { useScreenReader } from '../../hooks/useScreenReader';
import { ensureAudioReady } from '../../utils/sharedAudio';
import { retroErrorMessage } from '../../utils/retroErrors';

const NAME_PROMPT = 'Please enter your name ...';
const MAX_NAME_LENGTH = 30;
const LINE_DELAY_MS = 600;

type Phase = 'name' | 'busy' | 'chat';

const white = (text: string): Row => [{ text, fg: DOS.white }];
const doctor = (text: string): Row => white(text === '' ? '' : ` ${text}`);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** The v2.20 greeting, formatted as in the original (ref-docs/03). */
export function greetingLines(name: string): string[] {
  return [
    `HELLO ${name},  MY NAME IS DOCTOR SBAITSO.`,
    '',
    'I AM HERE TO HELP YOU.',
    'SAY WHATEVER IS IN YOUR MIND FREELY,',
    'OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.',
    'MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,',
    '',
    'SO, TELL ME ABOUT YOUR PROBLEMS.',
  ];
}

export function validateName(raw: string): { ok: true; name: string } | { ok: false; message: string } {
  const name = raw.trim().replace(/\s+/g, ' ').toUpperCase();
  if (!name) return { ok: false, message: '' };
  if (!/^[A-Z ]+$/.test(name)) return { ok: false, message: 'Enter alphabets only' };
  if (name.length > MAX_NAME_LENGTH) return { ok: false, message: '(name too long)' };
  return { ok: true, name };
}

export default function ClassicApp({ onSwitchMode }: { onSwitchMode?: () => void }) {
  const [screen, setScreen] = useState<Screen>(() => createScreen());
  const [phase, setPhase] = useState<Phase>('name');
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef('');
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

  const printRows = (...rows: Row[]) => setScreen((s) => print(s, ...rows));
  const log = (line: string) => setTranscript((t) => [...t.slice(-200), line]);

  /** Prints doctor lines one at a time while their speech plays. */
  const say = async (lines: string[]) => {
    const spoken = lines.filter(Boolean).join(' ');
    const audio = synthesizeSpeech(spoken, 'sbaitso').catch(() => '');
    for (const line of lines) {
      if (unmounted.current) return;
      printRows(doctor(line));
      if (line) log(`Doctor Sbaitso: ${line}`);
      await sleep(LINE_DELAY_MS);
    }
    announce(spoken);
    try {
      await speech.speak(await audio);
    } catch (error) {
      console.warn('Speech could not be played; text kept:', error);
    }
  };

  /** Engine seam: local commands will be handled here before the model. */
  const respond = async (text: string): Promise<string[]> => {
    const reply = await getAIResponse(text, 'sbaitso');
    return reply.split('\n').map((l) => l.trim().toUpperCase());
  };

  const submitName = async () => {
    const result = validateName(input);
    if (!result.ok) {
      if (result.message) {
        printRows(white(NAME_PROMPT + input), white(result.message));
        log(result.message);
      }
      setInput('');
      return;
    }
    void ensureAudioReady();
    nameRef.current = result.name;
    printRows(white(NAME_PROMPT + input));
    setInput('');
    setPhase('busy');
    resetChat('sbaitso');
    await say(greetingLines(result.name));
    if (!unmounted.current) {
      printRows([]);
      setPhase('chat');
    }
  };

  const submitLine = async () => {
    const text = input;
    setInput('');
    printRows([{ text: '>', fg: DOS.yellow }, { text, fg: DOS.white }]);
    log(`You: ${text}`);
    if (!text.trim()) {
      printRows([]);
      return;
    }
    setPhase('busy');
    try {
      await say(await respond(text));
    } catch (error) {
      await say([retroErrorMessage(error)]);
    }
    if (!unmounted.current) {
      printRows([]);
      setPhase('chat');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || phase === 'busy') return;
    e.preventDefault();
    void (phase === 'name' ? submitName() : submitLine());
  };

  // The live input row is drawn on top of what has been printed.
  const promptRow: Row =
    phase === 'name'
      ? white(NAME_PROMPT + input)
      : phase === 'chat'
        ? [{ text: '>', fg: DOS.yellow }, { text: input, fg: DOS.white }]
        : [];
  const view = phase === 'busy' ? screen : print(screen, promptRow);
  const rows = visibleRows(view);
  const lastText = promptRow.map((s) => s.text).join('');
  const cursor =
    phase === 'busy'
      ? null
      : { row: rows.length - 1 - trailingBlank(rows), col: Math.min(lastText.length % screen.cols, screen.cols - 1) };

  return (
    <main onClick={() => inputRef.current?.focus()} aria-label="Doctor Sbaitso">
      <DosScreen rows={rows} cols={screen.cols} cursor={cursor} />
      <div className="sr-only" role="log" aria-live="off" aria-label="Conversation">
        {transcript.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <label htmlFor="classic-input" className="sr-only">
        {phase === 'name' ? 'Please enter your name' : 'Talk to Doctor Sbaitso'}
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
        onChange={(e) => setInput(e.target.value)}
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
