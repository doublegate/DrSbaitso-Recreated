import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClassicApp from '@/components/classic/ClassicApp';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const screenText = () => document.querySelector('[data-dos-screen]')!.textContent ?? '';
const chatCalls = (fetchMock: ReturnType<typeof vi.fn>) => fetchMock.mock.calls.filter(([url]) => url === '/api/chat');

async function startSession(user: ReturnType<typeof userEvent.setup>, name = 'bob') {
  render(<ClassicApp />);
  await user.type(screen.getByLabelText('Please enter your name'), `${name}{Enter}`);
  return waitForPrompt();
}

function waitForPrompt() {
  return waitFor(
    () => {
      const el = screen.getByLabelText('Talk to Doctor Sbaitso');
      expect(el).not.toBeDisabled();
      return el;
    },
    { timeout: 20_000 },
  );
}

describe('ClassicApp', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts' ? json({ audio: 'AAAAAA==' }) : json({ text: 'WHY DO YOU FEEL THAT WAY?' }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts on the banner and the inline name prompt', () => {
    render(<ClassicApp />);
    expect(screenText()).toContain('D R   S B A I T S O');
    expect(screenText()).toContain('Please enter your name ...');
    expect(screen.getByLabelText('Please enter your name')).toHaveFocus();
  });

  it('greets with the original v2.20 wording and spacing', async () => {
    const user = userEvent.setup();
    await startSession(user);
    const text = screenText();
    expect(text).toContain('Please enter your name ...bob');
    expect(text).toContain(' HELLO BOB,  MY NAME IS DOCTOR SBAITSO.');
    expect(text).toContain(' MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,');
  }, 40_000);

  it('rejects names with non-letters like the original', async () => {
    const user = userEvent.setup();
    render(<ClassicApp />);
    await user.type(screen.getByLabelText('Please enter your name'), 'r2d2{Enter}');
    expect(screenText()).toContain('Enter alphabets only');
    expect(screen.getByLabelText('Please enter your name')).toBeInTheDocument();
  });

  it('sends open conversation to the model and prints the reply indented after a yellow >', async () => {
    const user = userEvent.setup();
    const input = await startSession(user);
    await user.type(input, 'my brother never calls me{Enter}');
    await waitFor(() => expect(screenText()).toContain(' WHY DO YOU FEEL THAT WAY?'), { timeout: 15_000 });
    expect(screenText()).toContain('>my brother never calls me');
    const prompt = [...document.querySelectorAll('[data-dos-screen] span')].find((s) => s.textContent === '>');
    expect((prompt as HTMLElement).style.color).toBe('rgb(255, 255, 85)');
  }, 40_000);

  it('answers HELP locally, without calling the model', async () => {
    const user = userEvent.setup();
    const input = await startSession(user);
    const before = chatCalls(fetchMock).length;
    await user.type(input, 'help{Enter}');
    await waitForPrompt();
    expect(screenText()).toMatch(/Dot Commands|HELP/i);
    expect(chatCalls(fetchMock).length).toBe(before);
  }, 40_000);

  it('handles CALC locally', async () => {
    const user = userEvent.setup();
    const input = await startSession(user);
    await user.type(input, 'calc 6/3{Enter}');
    await waitFor(() => expect(screenText()).toMatch(/EQUALS TO 2|equals to 2/i), { timeout: 15_000 });
    expect(chatCalls(fetchMock)).toHaveLength(0);
  }, 40_000);

  it('BYE leads to the Continue / New patient / Quit menu; C continues', async () => {
    const user = userEvent.setup();
    const input = await startSession(user);
    await user.type(input, 'bye{Enter}');
    await waitFor(() => expect(screenText()).toContain('<C>ontinue  <N>ew patient  <Q>uit'), { timeout: 15_000 });
    const menu = screen.getByLabelText(/Press C to continue/);
    await user.type(menu, 'c');
    expect(await waitForPrompt()).toBeInTheDocument();
  }, 40_000);

  it('Q at the menu quits to a DOS prompt; Enter runs the program again', async () => {
    const user = userEvent.setup();
    const input = await startSession(user);
    await user.type(input, 'bye{Enter}');
    await waitFor(() => expect(screenText()).toContain('<Q>uit'), { timeout: 15_000 });
    await user.type(screen.getByLabelText(/Press C to continue/), 'q');
    await waitFor(() => expect(screenText()).toContain('C:\\SB>'));
    await user.type(screen.getByLabelText('Press Enter to run Doctor Sbaitso again'), '{Enter}');
    expect(await screen.findByLabelText('Please enter your name')).toBeInTheDocument();
    expect(screenText()).toContain('D R   S B A I T S O');
  }, 40_000);

  it('.WIDTH 40 switches to a 40-column screen', async () => {
    const user = userEvent.setup();
    const input = await startSession(user);
    await user.type(input, '.width 40{Enter}');
    await waitFor(() => {
      const row = document.querySelector('[data-dos-row]')!.textContent!;
      expect(row.length).toBe(40);
    });
  }, 40_000);
});
