/**
 * Enhanced-mode App regression tests for the user path that was broken in
 * production: enter a name, hear the greeting, reach the chat prompt.
 */
import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/EnhancedApp';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 4 bytes = 2 silent PCM16 samples.
const SILENT_AUDIO = 'AAAAAA==';

function json(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );
}

describe('App', () => {
  const fetchMock = vi.fn();
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    // Skip the first-run tutorial so the name screen is reachable.
    localStorage.setItem('sbaitso_onboarding_completed', 'true');
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts'
        ? json({ audio: SILENT_AUDIO, sampleRate: 24000, mimeType: 'audio/L16;rate=24000' })
        : json({ text: 'TELL ME MORE ABOUT YOUR PROBLEMS.' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    // jsdom does not implement scrolling.
    Element.prototype.scrollIntoView = vi.fn();
    consoleError = vi.spyOn(console, 'error');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    consoleError.mockRestore();
  });

  function renderApp() {
    return render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
  }

  it('goes from name entry to the chat prompt without crashing', async () => {
    const user = userEvent.setup();
    renderApp();

    const nameInput = await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER');
    await user.type(nameInput, 'ALICE{Enter}');

    await waitFor(() => expect(document.getElementById('chat-input')).not.toBeNull(), { timeout: 10_000 });
    // Let lazily imported panels (e.g. the install prompt) load and render.
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(screen.queryByText('SYSTEM ERROR')).toBeNull();
    expect(document.getElementById('chat-input')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/tts', expect.objectContaining({ method: 'POST' }));
  });

  it('types the reply exactly once under StrictMode (no doubled characters)', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
    await user.type(await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER'), 'BOB{Enter}');
    const input = await waitFor(
      () => {
        const el = document.getElementById('chat-input') as HTMLInputElement | null;
        expect(el && !el.disabled).toBe(true);
        return el!;
      },
      { timeout: 15_000 },
    );
    await user.type(input, 'I feel sad{Enter}');
    await screen.findByText('TELL ME MORE ABOUT YOUR PROBLEMS.', undefined, { timeout: 10_000 });
    expect(screen.queryByText(/TTEELLLL/)).toBeNull();
  }, 30_000);

  async function reachChat(user: ReturnType<typeof userEvent.setup>) {
    renderApp();
    await user.type(await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER'), 'ALICE{Enter}');
    return waitFor(
      () => {
        const el = document.getElementById('chat-input') as HTMLInputElement | null;
        expect(el && !el.disabled).toBe(true);
        return el!;
      },
      { timeout: 15_000 },
    );
  }

  it('starts the session in text-only mode when speech synthesis fails for any reason', async () => {
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts'
        ? json({ code: 'UPSTREAM_ERROR', error: 'down' }, 502)
        : json({ text: 'TELL ME MORE ABOUT YOUR PROBLEMS.' }),
    );
    const user = userEvent.setup();
    await reachChat(user);
    expect(screen.queryByText(/FAILED TO INITIALIZE/)).toBeNull();
    expect(screen.getByText(/MY NAME IS DOCTOR SBAITSO/)).toBeInTheDocument();
  }, 30_000);

  it('keeps the typed reply when its audio cannot be played', async () => {
    const user = userEvent.setup();
    const input = await reachChat(user);
    // From here on, chat works but the audio is unreadable (decode throws).
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts' ? json({ audio: '!!!not-base64!!!' }) : json({ text: 'WHY DO YOU FEEL SAD?' }),
    );
    await user.type(input, 'I feel sad{Enter}');
    await screen.findByText('WHY DO YOU FEEL SAD?', undefined, { timeout: 10_000 });
    await act(() => new Promise((r) => setTimeout(r, 300)));
    expect(screen.getByText('WHY DO YOU FEEL SAD?')).toBeInTheDocument();
  }, 30_000);

  it('tells the user to wait when the model is rate limited', async () => {
    const user = userEvent.setup();
    const input = await reachChat(user);
    fetchMock.mockImplementation((url: string) =>
      url === '/api/chat' ? json({ code: 'RATE_LIMITED', error: 'slow' }, 429) : json({ audio: SILENT_AUDIO }),
    );
    await user.type(input, 'hello{Enter}');
    expect(await screen.findByText(/PLEASE WAIT A MOMENT/, undefined, { timeout: 10_000 })).toBeInTheDocument();
  }, 30_000);

  it('announces each completed reply once, without live-announcing the typing', async () => {
    const user = userEvent.setup();
    const input = await reachChat(user);
    const log = screen.getByRole('log');
    expect(log.getAttribute('aria-live')).toBe('off');

    await user.type(input, 'I feel sad{Enter}');
    await screen.findByText(/TELL ME MORE ABOUT YOUR PROBLEMS\./, { selector: 'p' }, { timeout: 10_000 });
    await waitFor(() =>
      expect(document.getElementById('a11y-announcer')?.textContent).toContain('TELL ME MORE ABOUT YOUR PROBLEMS.'),
    );
  }, 30_000);

  it('marks the keyboard user once Tab is pressed (focus outlines)', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER');
    await user.keyboard('{Tab}');
    expect(document.body.classList.contains('user-is-tabbing')).toBe(true);
  });

  it('does not re-render in a loop while idle', async () => {
    renderApp();
    await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER');
    await act(() => new Promise((r) => setTimeout(r, 200)));

    const loopWarnings = consoleError.mock.calls.filter((args: unknown[]) =>
      String(args[0]).includes('Maximum update depth'),
    );
    expect(loopWarnings).toEqual([]);
  });
});

describe('Enhanced mode personas', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('sbaitso_onboarding_completed', 'true');
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) =>
      url === '/api/tts' ? json({ audio: SILENT_AUDIO }) : json({ text: 'I AM AFRAID I CANNOT DO THAT.' }),
    );
    vi.stubGlobal('fetch', fetchMock);
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends replies to the persona chosen in the selector', async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
    await user.type(await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER'), 'DAVE{Enter}');
    const input = await waitFor(
      () => {
        const el = document.getElementById('chat-input') as HTMLInputElement | null;
        expect(el && !el.disabled).toBe(true);
        return el!;
      },
      { timeout: 15_000 },
    );
    await user.selectOptions(screen.getByLabelText('PERSONA:'), 'hal9000');
    expect(screen.getByText('--- NOW TALKING TO HAL 9000 ---')).toBeInTheDocument();
    await user.type(input, 'open the doors{Enter}');
    await screen.findByText('I AM AFRAID I CANNOT DO THAT.', { selector: 'p' }, { timeout: 10_000 });
    const chatCall = fetchMock.mock.calls.find(([url, init]) => url === '/api/chat' && init.body.includes('open the doors'));
    expect(JSON.parse(chatCall![1].body).characterId).toBe('hal9000');
  }, 40_000);
});
