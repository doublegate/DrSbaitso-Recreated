/**
 * App-level regression tests for the user path that was broken in
 * production: enter a name, hear the greeting, reach the chat prompt.
 */
import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
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

  it('does not re-render in a loop while idle', async () => {
    renderApp();
    await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER');
    await act(() => new Promise((r) => setTimeout(r, 200)));

    const loopWarnings = consoleError.mock.calls.filter((args) =>
      String(args[0]).includes('Maximum update depth'),
    );
    expect(loopWarnings).toEqual([]);
  });
});
