import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClassicApp, { greetingLines, validateName } from '@/components/classic/ClassicApp';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

const screenText = () => document.querySelector('[data-dos-screen]')!.textContent ?? '';

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

  it('greets with the original v2.20 wording and spacing, then shows the > prompt', async () => {
    const user = userEvent.setup();
    render(<ClassicApp />);
    await user.type(screen.getByLabelText('Please enter your name'), 'bob{Enter}');
    await waitFor(() => expect(screen.getByLabelText('Talk to Doctor Sbaitso')).not.toBeDisabled(), { timeout: 15_000 });
    const text = screenText();
    expect(text).toContain('Please enter your name ...bob');
    expect(text).toContain(' HELLO BOB,  MY NAME IS DOCTOR SBAITSO.');
    expect(text).toContain(' MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,');
    expect(text).toContain(' SO, TELL ME ABOUT YOUR PROBLEMS.');
  }, 30_000);

  it('rejects names with non-letters like the original', async () => {
    const user = userEvent.setup();
    render(<ClassicApp />);
    await user.type(screen.getByLabelText('Please enter your name'), 'r2d2{Enter}');
    expect(screenText()).toContain('Enter alphabets only');
    expect(screen.getByLabelText('Please enter your name')).toBeInTheDocument();
  });

  it('echoes the line after a yellow > and prints the reply indented', async () => {
    const user = userEvent.setup();
    render(<ClassicApp />);
    await user.type(screen.getByLabelText('Please enter your name'), 'bob{Enter}');
    const input = await waitFor(
      () => {
        const el = screen.getByLabelText('Talk to Doctor Sbaitso');
        expect(el).not.toBeDisabled();
        return el;
      },
      { timeout: 15_000 },
    );
    await user.type(input, 'i am sad{Enter}');
    await waitFor(() => expect(screenText()).toContain(' WHY DO YOU FEEL THAT WAY?'), { timeout: 10_000 });
    expect(screenText()).toContain('>i am sad');
    const prompt = [...document.querySelectorAll('[data-dos-screen] span')].find((s) => s.textContent === '>');
    expect((prompt as HTMLElement).style.color).toBe('rgb(255, 255, 85)');
  }, 40_000);
});

describe('greeting and name rules', () => {
  it('formats the greeting like v2.20 (two spaces after the comma, MEMORY line ends with a comma)', () => {
    const lines = greetingLines('ANN');
    expect(lines[0]).toBe('HELLO ANN,  MY NAME IS DOCTOR SBAITSO.');
    expect(lines[1]).toBe('');
    expect(lines[5]).toMatch(/LEAVE,$/);
  });

  it('accepts letters and spaces only, uppercases, and limits length', () => {
    expect(validateName('  mary  jane ')).toEqual({ ok: true, name: 'MARY JANE' });
    expect(validateName('x'.repeat(31))).toEqual({ ok: false, message: '(name too long)' });
  });
});
