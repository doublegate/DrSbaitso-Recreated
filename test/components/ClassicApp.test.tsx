import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClassicApp from '@/components/classic/ClassicApp';
import { __resetSharedAudioForTests, getSharedAudioContext } from '@/utils/sharedAudio';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const screenText = () => document.querySelector('[data-dos-screen]')!.textContent ?? '';
/** Visible rows, trailing spaces removed. */
const rows = () => [...document.querySelectorAll('[data-dos-row]')].map((r) => (r.textContent ?? '').trimEnd());
const rowIndex = (text: string) => rows().findIndex((r) => r === text);
const phase = () => document.querySelector('main')!.getAttribute('data-phase');
const chatCalls = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.filter(([url]) => url === '/api/chat');
const ttsCalls = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.filter(([url]) => url === '/api/tts');
const input = () => document.getElementById('classic-input') as HTMLInputElement;

async function startSession(user: ReturnType<typeof userEvent.setup>, name = 'bob') {
  render(<ClassicApp seed={1} floodMs={40} />);
  await user.type(screen.getByLabelText('Please enter your name'), `${name}{Enter}`);
  return waitForPrompt();
}

async function waitForPrompt() {
  await waitFor(() => expect(phase()).toBe('chat'), { timeout: 20_000 });
  return screen.getByLabelText('Talk to Doctor Sbaitso');
}

/** Types a line and waits until the doctor is waiting at the prompt again. */
async function say(user: ReturnType<typeof userEvent.setup>, line: string) {
  await user.type(input(), `${line}{Enter}`);
  return waitForPrompt();
}

describe('ClassicApp', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    __resetSharedAudioForTests();
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts' ? json({ audio: 'AAAAAA==' }) : json({ text: 'WHY DO YOU FEEL THAT WAY?' }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('puts shared text on the first > prompt without sending it', async () => {
    const user = userEvent.setup();
    render(<ClassicApp seed={1} floodMs={40} initialInput="I feel sad" />);
    await user.type(screen.getByLabelText('Please enter your name'), 'bob{Enter}');
    await waitForPrompt();
    expect(input().value).toBe('I feel sad');
    expect(rows()).toContain('>I feel sad');
    expect(chatCalls(fetchMock)).toHaveLength(0);
  }, 40_000);

  it('starts on the banner and the inline name prompt', () => {
    render(<ClassicApp seed={1} />);
    expect(screenText()).toContain('D R   S B A I T S O');
    expect(screenText()).toContain('Please enter your name ...');
    expect(screen.getByLabelText('Please enter your name')).toHaveFocus();
  });

  it('hides the cursor while the name is typed and shows it at the > prompt', async () => {
    const user = userEvent.setup();
    render(<ClassicApp seed={1} />);
    expect(document.querySelector('[data-dos-cursor]')).toBeNull();
    await user.type(screen.getByLabelText('Please enter your name'), 'bob{Enter}');
    await waitForPrompt();
    expect(document.querySelector('[data-dos-cursor]')).not.toBeNull();
  }, 40_000);

  it('greets with the original v2.20 wording and spacing', async () => {
    const user = userEvent.setup();
    await startSession(user);
    const text = screenText();
    expect(text).toContain('Please enter your name ...bob');
    expect(text).toContain(' HELLO BOB,  MY NAME IS DOCTOR SBAITSO.');
    expect(text).toContain(' MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,');
    // One TTS request for the whole greeting, then a blank row and the prompt.
    expect(ttsCalls(fetchMock)).toHaveLength(1);
    const prompt = rows().lastIndexOf('>');
    expect(rows()[prompt - 1]).toBe('');
    expect(rows()[prompt - 2]).toBe(' SO, TELL ME ABOUT YOUR PROBLEMS.');
  }, 40_000);

  it('prints whole lines and holds the next one until the speech for the current one has played', async () => {
    let releaseTts!: () => void;
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts'
        ? new Promise<Response>(
            (resolve) => (releaseTts = () => resolve(new Response(JSON.stringify({ audio: 'AAAAAA==' })))),
          )
        : json({ text: 'WHY DO YOU FEEL THAT WAY?' }),
    );
    const user = userEvent.setup();
    render(<ClassicApp seed={1} />);
    await user.type(screen.getByLabelText('Please enter your name'), 'bob{Enter}');
    await waitFor(() => expect(screenText()).toContain(' HELLO BOB,  MY NAME IS DOCTOR SBAITSO.'));
    expect(screenText()).not.toContain('I AM HERE TO HELP YOU.');
    releaseTts();
    await waitForPrompt();
    expect(screenText()).toContain(' SO, TELL ME ABOUT YOUR PROBLEMS.');
  }, 40_000);

  it('a keypress during speech cuts it short: the rest prints unspoken and the key is typed ahead', async () => {
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts' ? new Promise<Response>(() => {}) : json({ text: 'WHY DO YOU FEEL THAT WAY?' }),
    );
    const user = userEvent.setup();
    render(<ClassicApp seed={1} />);
    await user.type(screen.getByLabelText('Please enter your name'), 'bob{Enter}');
    await waitFor(() => expect(screenText()).toContain(' HELLO BOB,'));
    expect(screenText()).not.toContain('SO, TELL ME ABOUT YOUR PROBLEMS.');
    await user.type(input(), 'a');
    await waitForPrompt();
    expect(screenText()).toContain(' SO, TELL ME ABOUT YOUR PROBLEMS.');
    expect(rows()).toContain('>a');
  }, 40_000);

  it('rejects names with non-letters like the original', async () => {
    const user = userEvent.setup();
    render(<ClassicApp seed={1} />);
    await user.type(screen.getByLabelText('Please enter your name'), 'r2d2{Enter}');
    expect(screenText()).toContain('Enter alphabets only');
    expect(screen.getByLabelText('Please enter your name')).toBeInTheDocument();
  });

  it('sends open conversation to the model and lays the turn out like the original', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, 'my brother never calls me');
    const r = rows();
    const echo = r.indexOf('>my brother never calls me');
    expect(echo).toBeGreaterThan(5);
    // Reply at column 0 on the next row, one blank row, then the prompt.
    expect(r[echo + 1]).toBe('WHY DO YOU FEEL THAT WAY?');
    expect(r[echo + 2]).toBe('');
    expect(r[echo + 3]).toBe('>');
    // The whole input line is yellow, the reply white.
    const spans = [...document.querySelectorAll('[data-dos-screen] span')] as HTMLElement[];
    expect(spans.find((s) => s.textContent === '>')!.style.color).toBe('rgb(255, 255, 85)');
    expect(spans.find((s) => s.textContent === 'my brother never calls me')!.style.color).toBe('rgb(255, 255, 85)');
    expect(spans.find((s) => s.textContent?.startsWith('WHY DO YOU'))!.style.color).toBe('rgb(255, 255, 255)');
    expect(chatCalls(fetchMock)).toHaveLength(1);
  }, 40_000);

  it('after R prints nothing and puts the new prompt on the very next row', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, 'author');
    await say(user, 'r');
    const r = rows();
    expect(r[r.lastIndexOf('>') - 1]).toBe('>r');
  }, 40_000);

  it('dot commands print nothing: a blank row, then the prompt', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, '.pitch 9');
    const r = rows();
    const echo = r.indexOf('>.pitch 9');
    expect(r[echo + 1]).toBe('');
    expect(r[echo + 2]).toBe('>');
  }, 40_000);

  it('labels input and replies only after .PROMPT ON', async () => {
    const user = userEvent.setup();
    await startSession(user);
    expect(screenText()).not.toContain('User>');
    await say(user, '.prompt on');
    expect(rows()).toContain('>.prompt on');
    await say(user, 'author');
    expect(rows()).toContain('User> author');
    expect(rows()).toContain('Computer: MY AUTHOR IS W H SIM OF CREATIVE LABS, INC.');
  }, 40_000);

  it('answers HELP locally, without calling the model', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, 'help');
    expect(screenText()).toMatch(/Dot Commands|HELP/i);
    expect(chatCalls(fetchMock)).toHaveLength(0);
  }, 40_000);

  it('handles CALC locally in the original format', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, 'calc 2+3');
    expect(rows()).toContain(' =  5');
    await say(user, 'what is 12*4');
    expect(rows()).toContain('12*4 =  48');
    expect(screenText()).not.toContain('Computer:');
    expect(chatCalls(fetchMock)).toHaveLength(0);
  }, 40_000);

  it('prints SAY text in upper case as the reply', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, 'say hello there');
    expect(rows()).toContain('HELLO THERE');
  }, 40_000);

  it('runs the parity flood under the pinned banner and ends with PARITY', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, 'say parity');
    const r = rows();
    expect(r[1]).toContain('D R   S B A I T S O');
    const parity = r.lastIndexOf('PARITY');
    expect(r[parity - 1]).toBe('PARITY ERR ... RECOVERED');
    expect(r[parity - 2]).toMatch(/^PARITY ERR \.\.\. {2}\d{1,5} {2}\?\?\?$/);
    expect(r[parity + 1]).toBe('');
    expect(r[parity + 2]).toBe('>');
    expect(screenText()).not.toMatch(/PHEW|YOU ARE BAD/);
    // Rows 5-23 scroll; row 24 is never written.
    expect(r[24]).toBe('');
  }, 40_000);

  it('BYE shows the menu on the very next row, with no prompt or cursor; C continues after one blank row', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await user.type(input(), 'bye{Enter}');
    await waitFor(() => expect(phase()).toBe('menu'), { timeout: 15_000 });
    const r = rows();
    const menu = r.indexOf('<C>ontinue  <N>ew patient  <Q>uit  .....');
    expect(r[menu - 1]).toBe('GOOD BYE BOB, AND HAVE A NICE DAY');
    expect(r[menu + 1]).toBe('');
    expect(document.querySelector('[data-dos-cursor]')).toBeNull();
    await user.type(screen.getByLabelText(/Press C to continue/), 'c');
    await waitForPrompt();
    const after = rows();
    expect(after[menu + 1]).toBe('');
    expect(after[menu + 2]).toBe('>');
    expect(after).not.toContain('C');
  }, 40_000);

  it('.QUIT says GOOD BYE <NAME> and shows the menu instead of quitting', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await user.type(input(), '.quit{Enter}');
    await waitFor(() => expect(phase()).toBe('menu'), { timeout: 15_000 });
    const r = rows();
    expect(r[r.indexOf('GOOD BYE BOB') + 1]).toBe('<C>ontinue  <N>ew patient  <Q>uit  .....');
  }, 40_000);

  it('a bare QUIT shows the menu at once', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await user.type(input(), 'quit{Enter}');
    await waitFor(() => expect(phase()).toBe('menu'), { timeout: 15_000 });
    const r = rows();
    expect(r[r.indexOf('>quit') + 1]).toBe('<C>ontinue  <N>ew patient  <Q>uit  .....');
  }, 40_000);

  it('N clears below the banner and asks for a new name without the intro', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await say(user, 'author');
    await user.type(input(), 'bye{Enter}');
    await waitFor(() => expect(phase()).toBe('menu'), { timeout: 15_000 });
    const before = ttsCalls(fetchMock).length;
    await user.type(screen.getByLabelText(/Press C to continue/), 'n');
    await waitFor(() => expect(phase()).toBe('name'));
    expect(rowIndex('Please enter your name ...')).toBe(6);
    expect(screenText()).not.toContain('AUTHOR');
    expect(rows()[1]).toContain('D R   S B A I T S O');
    // The prompt is spoken (one request), the "Doctor Sbaitso, by Creative Labs" intro is not.
    await waitFor(() => expect(ttsCalls(fetchMock).length).toBe(before + 1));
    const spoken = JSON.parse(ttsCalls(fetchMock).at(-1)![1].body as string).text as string;
    expect(spoken).toMatch(/PLEASE ENTER YOUR NAME/i);
    expect(spoken).not.toMatch(/CREATIVE LABS/i);
    await user.type(screen.getByLabelText('Please enter your name'), 'ann{Enter}');
    await waitForPrompt();
    expect(screenText()).toContain(' HELLO ANN,  MY NAME IS DOCTOR SBAITSO.');
  }, 40_000);

  it('Q quits to a DOS prompt below the banner; Enter runs the program again', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await user.type(input(), 'bye{Enter}');
    await waitFor(() => expect(phase()).toBe('menu'), { timeout: 15_000 });
    await user.type(screen.getByLabelText(/Press C to continue/), 'q');
    await waitFor(() => expect(screenText()).toContain('C:\\SB>'));
    const r = rows();
    expect(r[1]).toContain('D R   S B A I T S O');
    expect(r[5]).toBe('C:\\SB>');
    const rowEls = document.querySelectorAll('[data-dos-row]');
    expect((rowEls[10] as HTMLElement).style.backgroundColor).toBe('rgb(0, 0, 0)');
    await user.type(screen.getByLabelText('Press Enter to run Doctor Sbaitso again'), '{Enter}');
    expect(await screen.findByLabelText('Please enter your name', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screenText()).toContain('D R   S B A I T S O');
  }, 40_000);

  it('once audio is unlocked, starts by saying "Doctor Sbaitso, by Creative Labs" and the name prompt in one request', async () => {
    getSharedAudioContext();
    render(<ClassicApp seed={1} />);
    await waitFor(() => expect(phase()).toBe('name'));
    const tts = ttsCalls(fetchMock);
    expect(tts).toHaveLength(1);
    const spoken = JSON.parse(tts[0][1].body as string).text as string;
    expect(spoken).toMatch(/DOCTOR SBAITSO.*BY CREATIVE LABS.*PLEASE ENTER YOUR NAME/i);
    expect(screenText()).toContain('Please enter your name ...');
  });

  it('.WIDTH 40 switches to a 40-column screen', async () => {
    const user = userEvent.setup();
    await startSession(user);
    await user.type(input(), '.width 40{Enter}');
    await waitFor(() => {
      const row = document.querySelector('[data-dos-row]')!.textContent!;
      expect(row.length).toBe(40);
    });
  }, 40_000);

  describe('screen clears measured in DOSBox (ref-docs/04)', () => {
    const banner = () => rows().some((r) => r.includes('╔'));

    it('HELP page 1 clears the whole screen, banner included; M brings the banner back', async () => {
      const user = userEvent.setup();
      await startSession(user);
      await say(user, 'help');
      expect(banner()).toBe(false);
      expect(screenText()).not.toContain('TELL ME ABOUT YOUR PROBLEMS');
      await say(user, 'm');
      expect(banner()).toBe(true);
      expect(screenText()).not.toContain('TELL ME ABOUT YOUR PROBLEMS');
    }, 40_000);

    it('.COLOR clears below the banner and starts again at the top', async () => {
      const user = userEvent.setup();
      await startSession(user);
      await say(user, '.color 4');
      expect(banner()).toBe(true);
      expect(screenText()).not.toContain('TELL ME ABOUT YOUR PROBLEMS');
      expect(rows()[6]).toBe('>');
    }, 40_000);

    it('.WIDTH clears below the banner too', async () => {
      const user = userEvent.setup();
      await startSession(user);
      await say(user, '.width 40');
      expect(screenText()).not.toContain('TELL ME ABOUT YOUR PROBLEMS');
    }, 40_000);
  });

  it('takes an Enter pressed while the doctor speaks as an input, once the prompt returns', async () => {
    const user = userEvent.setup();
    await startSession(user);
    let releaseTts!: () => void;
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts'
        ? new Promise((resolve) => (releaseTts = () => resolve(json({ audio: 'AAAAAA==' }))))
        : json({ text: 'WHY DO YOU FEEL THAT WAY?' }),
    );
    const userLines = () =>
      [...document.querySelectorAll('[role="log"] p')].filter((p) => p.textContent?.startsWith('You:')).length;
    await user.type(input(), 'i feel sad{Enter}');
    await waitFor(() => expect(chatCalls(fetchMock)).toHaveLength(1));
    expect(phase()).toBe('busy');
    await user.keyboard('{Enter}');
    releaseTts();
    // The typed-ahead Enter is consumed as an (empty) input (CONFIRMED (DOSBox), run K).
    await waitFor(() => expect(userLines()).toBe(2), { timeout: 20_000 });
    await waitForPrompt();
  }, 40_000);
});
