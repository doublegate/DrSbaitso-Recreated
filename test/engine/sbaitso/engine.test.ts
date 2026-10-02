import { describe, it, expect } from 'vitest';
import {
  createSbaitsoState,
  processInput,
  recordReply,
  parityFlood,
  PARITY_FLOOD_LENGTH,
  PARITY_RECOVERED,
  isParityText,
  PARITY_TRIGGER_LINES,
  DEFAULT_SETTINGS,
  HELP_40_COLUMNS,
  helpPages,
  type EngineResult,
  type SbaitsoState,
} from '@/engine/sbaitso';

/** Feed several inputs in order; return the final state and every result. */
function run(inputs: string[], state: SbaitsoState = createSbaitsoState('john')) {
  const results: EngineResult[] = [];
  for (const input of inputs) {
    const step = processInput(state, input);
    state = step.state;
    results.push(step.result);
  }
  return { state, results, last: results[results.length - 1] };
}

const linesOf = (result: EngineResult): string[] => ('lines' in result ? result.lines : []);

describe('createSbaitsoState', () => {
  it('upper-cases the name and starts from the original defaults', () => {
    const state = createSbaitsoState('jane doe');
    expect(state.name).toBe('JANE DOE');
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toMatchObject({ tone: 0, volume: 5, pitch: 5, speed: 5, width: 80, background: 1 });
  });

  it('never mutates the state it is given', () => {
    const state = createSbaitsoState('john');
    const snapshot = JSON.stringify(state);
    processInput(state, '');
    processInput(state, '.PITCH 9');
    processInput(state, 'damn');
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('open conversation', () => {
  it('sends ordinary sentences to the model unchanged', () => {
    const { last } = run(['I am worried about my exams.']);
    expect(last).toEqual({ kind: 'model', message: 'I am worried about my exams.' });
  });

  it('sends short keyword input to the model rather than the short-input pool', () => {
    expect(run(['hi']).last.kind).toBe('model');
    expect(run(['why?']).last.kind).toBe('model');
    expect(run(['money']).last.kind).toBe('model');
  });

  it('sends WHAT IS without arithmetic to the model', () => {
    expect(run(['what is love?']).last).toEqual({ kind: 'model', message: 'what is love?' });
  });
});

describe('HELP', () => {
  it('pages through three help screens with M', () => {
    const { results, state } = run(['help', 'm', 'M']);
    expect(results.map((r) => r.kind)).toEqual(['help', 'help', 'help']);
    expect(results.map((r) => (r.kind === 'help' ? r.page : 0))).toEqual([1, 2, 3]);
    expect(results.map((r) => (r.kind === 'help' ? r.more : null))).toEqual([true, true, false]);
    expect(linesOf(results[0])).toEqual(helpPages()[0]);
    expect(state.pending.kind).toBe('none');
  });

  it('leaves help on any other input and handles it normally', () => {
    const { last } = run(['HELP', 'I feel sad today']);
    expect(last.kind).toBe('model');
  });

  it('treats M with no help showing as short input', () => {
    expect(run(['M']).last.kind).toBe('reply');
  });

  it('dismisses help quietly on Enter', () => {
    const { last, state } = run(['HELP', '']);
    expect(last.kind).toBe('noop');
    expect(state.emptyCount).toBe(0);
  });

  it('refuses in 40-column mode', () => {
    const { last } = run(['.WIDTH 40', 'HELP']);
    expect(last).toMatchObject({ kind: 'reply', lines: [HELP_40_COLUMNS] });
  });
});

describe('R (repeat last response)', () => {
  it('returns the last local reply', () => {
    const { last } = run(['AUTHOR', 'R']);
    expect(last).toEqual({ kind: 'repeat', lines: ['MY AUTHOR IS W H SIM OF CREATIVE LABS, INC.'] });
  });

  it('returns a model reply once the caller records it', () => {
    let state = createSbaitsoState('john');
    state = processInput(state, 'I hate my job').state;
    state = recordReply(state, 'WHY DO YOU FEEL THAT WAY?\nTELL ME MORE.');
    expect(processInput(state, 'r').result).toEqual({
      kind: 'repeat',
      lines: ['WHY DO YOU FEEL THAT WAY?', 'TELL ME MORE.'],
    });
  });

  it('is empty before anything was said', () => {
    expect(run(['R']).last).toEqual({ kind: 'repeat', lines: [] });
  });

  it('is never treated as a repeated input', () => {
    expect(run(['AUTHOR', 'R', 'R']).last.kind).toBe('repeat');
  });
});

describe('SAY', () => {
  it('speaks text verbatim', () => {
    expect(run(['say Hello there']).last).toEqual({ kind: 'say', text: 'Hello there' });
  });

  it('makes R repeat the said text', () => {
    expect(run(['SAY testing', 'R']).last).toEqual({ kind: 'repeat', lines: ['testing'] });
  });

  it('SAY PARITY triggers the parity flood', () => {
    const { last } = run(['say parity.']);
    expect(last.kind).toBe('parity');
    expect(linesOf(last)).toEqual(['PARITY']);
  });

  it('treats a bare SAY as ordinary (too short) input', () => {
    expect(linesOf(run(['say']).last)).toEqual(["THAT'S TOO BRIEF"]);
  });
});

describe('CALC and WHAT IS arithmetic', () => {
  it('evaluates CALC locally', () => {
    expect(run(['calc 6/3']).last).toEqual({
      kind: 'reply',
      lines: ['Computer: 6 divided by 3 equals to 2'],
      speak: ['6 divided by 3 equals to 2'],
    });
  });

  it('evaluates WHAT IS with arithmetic', () => {
    expect(linesOf(run(['What is 2 plus 2?']).last)).toEqual(['Computer: 2 plus 2 equals to 4']);
  });

  it('reports a bug for CALC without an expression', () => {
    expect(linesOf(run(['CALC']).last)[0]).toMatch(/bug in your equation/);
  });
});

describe('AUTHOR and SHUT UP', () => {
  it('credits W H SIM', () => {
    expect(linesOf(run(['author']).last)).toEqual(['MY AUTHOR IS W H SIM OF CREATIVE LABS, INC.']);
  });

  it('answers SHUT UP from the original pool and asks the caller to stop speaking', () => {
    const { results } = run(['shut up', 'SHUT UP!']);
    expect(results[0]).toMatchObject({ kind: 'reply', lines: ['I AM NOT THROUGH YET'], stopSpeech: true });
    expect(results[1]).toMatchObject({ kind: 'reply', lines: ['YOU CAN TURN OFF MY POWER ANYTIME'] });
  });
});

describe('BYE / QUIT / GOODBYE', () => {
  it('cycles through the original goodbyes and ends the session with the menu', () => {
    const { results } = run(['bye', 'goodbye', 'GOOD BYE', 'bye']);
    // The reply is the only line: the C/N/Q menu follows on the very next row.
    expect(results[0]).toEqual({ kind: 'exit', lines: ['GOOD BYE JOHN, AND HAVE A NICE DAY'] });
    expect(results[1]).toEqual({ kind: 'exit', lines: ['GOOD BYE, SO LONG!'] });
    expect(results[2]).toEqual({ kind: 'exit', lines: ['JOHN, IT IS SO NICE TALKING TO YOU, BYE!'] });
    // The fourth reply refuses to let the patient go.
    expect(results[3]).toMatchObject({ kind: 'reply', lines: ["I'M NOT THROUGH WITH YOU YET"] });
  });

  it('accepts BYE addressed to the doctor', () => {
    expect(run(['bye bye doctor']).last.kind).toBe('exit');
    expect(run(['Bye, Dr. Sbaitso!']).last.kind).toBe('exit');
  });

  it('does not end the session when BYE is only part of a sentence', () => {
    expect(run(['my wife said bye to me']).last.kind).toBe('model');
  });

  it('shows the menu at once on a bare QUIT, with no goodbye line', () => {
    expect(run(['quit']).last).toEqual({ kind: 'exit', lines: [] });
  });

  it('treats a bare EXIT as short input, not a command', () => {
    expect(run(['EXIT']).last).toMatchObject({ kind: 'reply', lines: ["THAT'S TOO BRIEF"] });
  });

  it('says GOOD BYE <NAME> on .QUIT and then shows the menu', () => {
    expect(run(['.QUIT']).last).toEqual({ kind: 'exit', lines: ['GOOD BYE JOHN'] });
  });
});

describe('dot commands', () => {
  it('sets speech parameters within range', () => {
    const { state, results } = run(['.TONE 1', '.VOLUME 9', '.PITCH 0', '.SPEED 7']);
    expect(results.every((r) => r.kind === 'setting')).toBe(true);
    expect(results[2]).toEqual({ kind: 'setting', lines: [], settings: { pitch: 0 } });
    expect(state.settings).toMatchObject({ tone: 1, volume: 9, pitch: 0, speed: 7 });
  });

  it('is case-insensitive and allows no space before the value', () => {
    expect(run(['.pitch3']).state.settings.pitch).toBe(3);
  });

  it('rejects out-of-range values with the original error text', () => {
    const { last, state } = run(['.PITCH 12']);
    expect(last).toEqual({ kind: 'setting', lines: ['Pitch number must be between 0 - 9'], settings: {} });
    expect(state.settings.pitch).toBe(5);
    expect(linesOf(run(['.TONE 2']).last)).toEqual(['Tone number must be between 0 - 1']);
    expect(linesOf(run(['.VOLUME x']).last)).toEqual(['Volume number must be between 0 - 9']);
    expect(linesOf(run(['.MASTER 16']).last)).toEqual(['Master volume number must be between 0 - 15']);
  });

  it('prompts for a missing value and applies the answer', () => {
    const { results, state } = run(['.PITCH', '8']);
    expect(results[0]).toEqual({ kind: 'setting', lines: ['Enter pitch number (0-9)'], settings: {} });
    expect(results[1]).toEqual({ kind: 'setting', lines: [], settings: { pitch: 8 } });
    expect(state.settings.pitch).toBe(8);
    expect(state.pending.kind).toBe('none');
  });

  it('leaves the value unchanged when the prompt is answered with Enter', () => {
    const { last, state } = run(['.SPEED', '']);
    expect(last.kind).toBe('noop');
    expect(state.settings.speed).toBe(5);
  });

  it('sets the master volume 0-15', () => {
    expect(run(['.MASTER 12']).state.settings.master).toBe(12);
  });

  describe('.PARAM', () => {
    it('sets all four parameters from tvps', () => {
      const { last, state } = run(['.PARAM 1234']);
      expect(last).toEqual({ kind: 'setting', lines: [], settings: { tone: 1, volume: 2, pitch: 3, speed: 4 } });
      expect(state.settings).toMatchObject({ tone: 1, volume: 2, pitch: 3, speed: 4 });
    });

    it('restores the defaults with D', () => {
      const { state } = run(['.PARAM 1999', '.PARAM d']);
      expect(state.settings).toMatchObject({ tone: 0, volume: 5, pitch: 5, speed: 5 });
    });

    it('complains about anything but four digits, keeping the original spelling', () => {
      expect(linesOf(run(['.PARAM 12']).last)).toEqual(['Need to enter 4 digits, try agian.']);
      expect(linesOf(run(['.PARAM 2555']).last)).toEqual(['Tone number must be between 0 - 1']);
    });

    it('shows the current settings and asks when given no argument', () => {
      const { results, state } = run(['.PARAM', '0999']);
      expect(linesOf(results[0])[0]).toBe('Current Speech Parameters settings are : 0555');
      expect(state.settings).toMatchObject({ volume: 9, pitch: 9, speed: 9 });
    });

    it('keeps the settings when the prompt is answered with Enter', () => {
      const { last, state } = run(['.PARAM', '']);
      expect(last.kind).toBe('noop');
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  it('toggles .ECHO and .PROMPT', () => {
    const { state } = run(['.ECHO ON', '.PROMPT on']);
    expect(state.settings).toMatchObject({ echo: true, prompt: true });
    expect(run(['.ECHO ON', '.ECHO OFF']).state.settings.echo).toBe(false);
    expect(linesOf(run(['.ECHO maybe']).last)).toEqual(['Use .ECHO ON or .ECHO OFF']);
    expect(linesOf(run(['.PROMPT']).last)).toEqual(['Use .PROMPT ON or .PROMPT OFF']);
  });

  it('switches .WIDTH between 40 and 80 only', () => {
    expect(run(['.WIDTH 40']).state.settings.width).toBe(40);
    expect(linesOf(run(['.WIDTH 60']).last)).toEqual(['Width must be 40 or 80']);
    expect(run(['.WIDTH', '40']).state.settings.width).toBe(40);
  });

  it('sets .COLOR background, with an optional foreground', () => {
    expect(run(['.COLOR 0']).last).toEqual({ kind: 'setting', lines: [], settings: { background: 0 } });
    expect(run(['.COLOR 4E']).state.settings).toMatchObject({ background: 4, foreground: 14 });
    expect(run(['.COLOR 2 15']).state.settings).toMatchObject({ background: 2, foreground: 15 });
    expect(linesOf(run(['.COLOR 9']).last)).toEqual(['Color number must be between 0 - 7']);
    expect(linesOf(run(['.COLOR 1 99']).last)).toEqual(['Foreground color number must be between 0 - 15']);
  });

  it('answers .READ with the original errors', () => {
    expect(linesOf(run(['.READ']).last)).toEqual(['Must supply a filename to read.']);
    expect(linesOf(run(['.READ AUTOEXEC.BAT']).last)).toEqual(['File not Found']);
  });

  it('rejects unknown dot commands', () => {
    expect(run(['.FOO']).last).toEqual({ kind: 'setting', lines: ['Invalid Dot Command, type HELP for the list.'], settings: {} });
  });

  it('requires the dot in the first column', () => {
    expect(linesOf(run(['  .PITCH 3']).last)).toEqual(['Dot Commands are preceeded with a dot on the first column']);
    expect(run(['  .PITCH 3']).state.settings.pitch).toBe(5);
  });
});

describe('empty Enter', () => {
  const EMPTY_GROUP = [
    "DON'T BE SHY, TALK TO ME",
    "DON'T JUST PRESS ENTER, TALK TO ME",
    'PLEASE TYPE SOMETHING',
    'HAY, TYPE SOMETHING SENSIBLE, WILL YOU?',
    'ENTER',
  ];

  it('answers from the empty-input group, including the literal ENTER, without escalating', () => {
    const { results, state } = run(Array.from({ length: 60 }, () => ''));
    const lines = results.map((r) => linesOf(r)[0]);
    for (const line of lines) expect(EMPTY_GROUP).toContain(line);
    // Random, not a fixed escalation: every reply turns up, and none of them ends the session.
    expect(new Set(lines)).toEqual(new Set(EMPTY_GROUP));
    expect(results.every((r) => r.kind === 'reply')).toBe(true);
    expect(state.pending.kind).toBe('none');
  });

  it('is deterministic for a given seed and differs between seeds', () => {
    const presses = Array.from({ length: 12 }, () => '');
    const a = run(presses, createSbaitsoState('john', 7)).results.map((r) => linesOf(r)[0]);
    const b = run(presses, createSbaitsoState('john', 7)).results.map((r) => linesOf(r)[0]);
    const c = run(presses, createSbaitsoState('john', 8)).results.map((r) => linesOf(r)[0]);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('speaks ENTER as the word it prints', () => {
    let state = createSbaitsoState('john', 1);
    for (let i = 0; i < 50; i++) {
      const step = processInput(state, '');
      state = step.state;
      if (step.result.kind === 'reply' && step.result.lines[0] === 'ENTER') {
        expect(step.result.speak).toEqual(['ENTER']);
        return;
      }
    }
    throw new Error('ENTER never came up in 50 presses');
  });

  it('treats whitespace as empty', () => {
    expect(EMPTY_GROUP).toContain(linesOf(run(['   ']).last)[0]);
  });
});

describe('short and garbage input', () => {
  it('answers very short input from the SHT7CHR pool', () => {
    const { results } = run(['ok', 'hmm', 'fine', 'lol']);
    expect(results.map((r) => linesOf(r)[0])).toEqual([
      "THAT'S TOO BRIEF",
      'WHAT ARE YOU MUMBLING ABOUT?',
      "I DON'T UNDERSTAND SHORT HAND",
      'I NEED MORE DATA',
    ]);
  });

  it('switches to 40 columns or changes colour on the coded lines', () => {
    const { results, state } = run(['ok', 'hmm', 'fine', 'lol', 'meh', 'pfft']);
    expect(results[4]).toMatchObject({ kind: 'reply', lines: ['TOO LITTLE DATA, SO I MAKE BIG'], settings: { width: 40 } });
    expect(results[5]).toMatchObject({ kind: 'reply', lines: ["I AM CONFUSED, LET'S CHANGE COLOR"], settings: { background: 2 } });
    expect(state.settings).toMatchObject({ width: 40, background: 2 });
  });

  it('answers keyboard mashing from the GRBGE pool', () => {
    const { results } = run(['asdfghjkl qwrtzp', '%%%% #### !!!!', 'zzzzzzzz', 'xkcdqwvbn']);
    expect(results.map((r) => linesOf(r)[0])).toEqual([
      'WHAT GIBBERISH ARE YOU TELLING ME?',
      "DON'T PRACTICE TYPING WITH ME",
      'WHAT LANGUAGE IS THIS?',
      "I WON'T PROCESS THIS GARBAGE",
    ]);
  });

  it('does not mistake real long words for garbage', () => {
    expect(run(['strengths and rhythms']).last.kind).toBe('model');
  });
});

describe('repeated input', () => {
  it('answers tier 1 on the first repeat and tier 2 after that', () => {
    const { results } = run(['I hate Mondays', 'i hate mondays!', 'I HATE MONDAYS', 'I hate Mondays']);
    expect(results[0].kind).toBe('model');
    expect(linesOf(results[1])).toEqual(["PLEASE DON'T REPEAT"]);
    expect(linesOf(results[2])).toEqual(['THIS IS STALE STUFF']);
    expect(linesOf(results[3])).toEqual(["I DON'T LIKE PEOPLE REPEATING"]);
  });

  it('starts over after a different input', () => {
    const { results } = run(['I hate Mondays', 'I hate Mondays', 'I love Fridays', 'I love Fridays']);
    expect(linesOf(results[3])).toEqual(['AGAIN?']);
  });
});

describe('profanity', () => {
  it('follows the order observed in DOSBox, ending in the garbled warning and then the parity flood', () => {
    const swears = Array.from({ length: 9 }, () => 'damn');
    const { results } = run(swears);
    expect(linesOf(results[0])).toEqual(['YOU MUST NOT TALK IN THIS WAY, HOW OLD ARE YOU?']);
    // Swearing again instead of giving an age gets an age reply, not the next warning.
    expect(linesOf(results[1])).toEqual(['SO YOU THINK YOU ARE BIG ENOUGH, PROOF IT']);
    expect(linesOf(results[2])).toEqual(["DON'T GET FRESH"]);
    expect(linesOf(results[3])).toEqual(['SHAME ON YOU']);
    expect(linesOf(results[4])).toEqual(['I REFUSE TO COMPUTE THIS FILTH']);
    expect(linesOf(results[5])).toEqual(['I WILL GET PARITY ERROR IF YOU KEEP TALKING IN THIS FZA!$[{? WAY.']);
    expect(results[6]).toMatchObject({ kind: 'parity', lines: ['PARITY'] });
    // Afterwards the group carries on.
    expect(linesOf(results[7])).toEqual(['GIVE ME YOUR AGE?']);
    expect(linesOf(results[8])).toEqual(['NO NONSENSE, DEAR']);
  });

  it('prints the garbage characters of the warning but does not speak them', () => {
    const { results } = run(['damn', 'damn', 'damn', 'damn', 'damn', 'damn']);
    const warning = results[5];
    expect(warning.kind).toBe('reply');
    expect((warning as Extract<EngineResult, { kind: 'reply' }>).speak).toEqual([
      'I WILL GET PARITY ERROR IF YOU KEEP TALKING IN THIS WAY.',
    ]);
  });

  it('still takes a real age after the profanity age question', () => {
    const { results } = run(['damn', '12']);
    expect(linesOf(results[1])).toEqual(['WAIT A FEW MORE YEARS, KID']);
  });

  it('does not flag innocent words that contain a bad one', () => {
    expect(run(['I passed my class assessment']).last.kind).toBe('model');
    expect(run(['Scunthorpe is a town in England']).last.kind).toBe('model');
  });
});

describe('sexual words and the age prompt', () => {
  it('lectures, asks the age, then reacts to it', () => {
    const { results } = run(['tell me about sex', '12']);
    expect(linesOf(results[0])).toEqual(['THIS IS NOT AN ANATOMY CLASS', 'HOW OLD ARE YOU?']);
    expect(linesOf(results[1])).toEqual(['WAIT A FEW MORE YEARS, KID']);
  });

  it('teases an adult', () => {
    const { results } = run(['sexy', 'I am 40', 'naked', '35']);
    expect(linesOf(results[1])).toEqual(['I THINK YOU ARE TOO OLD FOR THIS']);
    expect(linesOf(results[2])).toEqual(['GO TO A BIOLOGY CLASS', 'HOW OLD ARE YOU?']);
    expect(linesOf(results[3])).toEqual(['I PREFER SOMEONE YOUNGER']);
  });

  it('drops the age question when the answer is not a number', () => {
    const { last, state } = run(['sex', 'never mind that, I feel lonely']);
    expect(last.kind).toBe('model');
    expect(state.pending.kind).toBe('none');
  });
});

describe('CRAZY', () => {
  it('laughs, then cracks the 1 + 1 = 3 joke into a parity error', () => {
    const { results } = run(['you are crazy', 'you are so crazy', 'crazy']);
    expect(results[0].kind).toBe('reply');
    expect(results[1].kind).toBe('reply');
    expect(results[2].kind).toBe('parity');
    const joke = results[2] as Extract<EngineResult, { kind: 'parity' }>;
    expect(joke.lead).toEqual(['1 + 1 = 3 JOHN, PARITY .. CHECKSUM ERR? ..']);
    expect(joke.flood.at(-1)).toBe(PARITY_RECOVERED);
    expect(joke.lines).toEqual(['PARITY']);
  });

  it('leaves CRAZY about something else to the model', () => {
    expect(run(['I am crazy about my girlfriend']).last.kind).toBe('model');
  });
});

describe('parity flood', () => {
  const parityOf = (result: EngineResult) => {
    expect(result.kind).toBe('parity');
    return result as Extract<EngineResult, { kind: 'parity' }>;
  };

  it('floods PARITY ERR lines with random numbers, then ??? lines, then RECOVERED', () => {
    const { flood } = parityOf(run(['say parity']).last);
    expect(flood).toHaveLength(PARITY_FLOOD_LENGTH);
    expect(PARITY_FLOOD_LENGTH).toBeGreaterThanOrEqual(200);
    expect(flood.at(-1)).toBe('PARITY ERR ... RECOVERED');
    const body = flood.slice(0, -1);
    for (const line of body) expect(line).toMatch(/^PARITY ERR \.\.\.  \d{1,5}(  \?\?\?)?$/);
    // The ??? lines are one unbroken run that starts part-way through.
    const firstQ = body.findIndex((line) => line.endsWith('???'));
    expect(firstQ).toBeGreaterThan(body.length * 0.2);
    expect(firstQ).toBeLessThan(body.length * 0.9);
    expect(body.slice(firstQ).every((line) => line.endsWith('  ???'))).toBe(true);
    expect(new Set(body.map((line) => line.split(/\s+/)[3])).size).toBeGreaterThan(100);
  });

  it('ends with the literal PARITY reply, spoken, and never the PHEW or YOU ARE BAD lines', () => {
    const result = parityOf(run(['say parity']).last);
    expect(result.lead).toEqual([]);
    expect(result.lines).toEqual(['PARITY']);
    expect(result.speak).toEqual(['PARITY']);
    const all = [...result.flood, ...result.lines].join('\n');
    expect(all).not.toMatch(/PHEW|YOU ARE BAD/);
  });

  it('is deterministic for a seed, and differs between seeds and between floods', () => {
    const a = parityOf(processInput(createSbaitsoState('john', 3), 'say parity').result).flood;
    const b = parityOf(processInput(createSbaitsoState('john', 3), 'say parity').result).flood;
    const c = parityOf(processInput(createSbaitsoState('john', 4), 'say parity').result).flood;
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    const twice = run(['say parity', 'say parity']).results.map((r) => parityOf(r).flood);
    expect(twice[0]).not.toEqual(twice[1]);
    expect(parityFlood(3)).toEqual(parityFlood(3));
  });

  it('makes R repeat PARITY', () => {
    expect(run(['say parity', 'R']).last).toEqual({ kind: 'repeat', lines: ['PARITY'] });
  });

  it('recognises parity text and nothing invented', () => {
    for (const line of parityFlood(1).slice(0, 5)) expect(isParityText(line)).toBe(true);
    expect(isParityText(PARITY_RECOVERED)).toBe(true);
    expect(isParityText('PARITY CHECKING...')).toBe(false);
    expect(isParityText('IRQ CONFLICT AT ADDRESS 220H')).toBe(false);
    expect(isParityText('I WILL GET PARITY ERROR IF YOU KEEP TALKING')).toBe(false);
    expect(PARITY_TRIGGER_LINES.length).toBeGreaterThan(0);
  });
});

describe('robustness', () => {
  it('never throws and always returns a known kind for arbitrary input', () => {
    const kinds = new Set(['reply', 'model', 'parity', 'help', 'setting', 'repeat', 'say', 'exit', 'noop']);
    const alphabet = 'abcXYZ019 .,!?()+-*/~$[{\'"\n\t.';
    let seed = 12345;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed;
    };
    let state = createSbaitsoState('john');
    for (let i = 0; i < 2000; i++) {
      const length = next() % 24;
      let input = '';
      for (let j = 0; j < length; j++) input += alphabet[next() % alphabet.length];
      const step = processInput(state, input);
      expect(kinds.has(step.result.kind)).toBe(true);
      state = step.state;
    }
  });
});

describe('local replies', () => {
  it('are upper case except CALC output and dot-command messages', () => {
    const inputs = ['', 'ok', 'asdfghjkl qwrtzp', 'damn', 'sex', 'bye', 'AUTHOR', 'SHUT UP', 'you are crazy'];
    for (const input of inputs) {
      for (const line of linesOf(run([input]).last)) expect(line).toBe(line.toUpperCase());
    }
  });
});
