/** Enhanced mode speaks each persona through its own playback route. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/EnhancedApp';

const speak = vi.fn((_audio: string, _text?: string, _options?: { processing?: string }) => Promise.resolve());
vi.mock('@/hooks/useSpeechPlayer', () => ({ useSpeechPlayer: () => ({ speak, stop: vi.fn() }) }));
vi.mock('@/utils/soundPackPlayer', () => ({ playSoundPackEvent: vi.fn(() => Promise.resolve()) }));

const json = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }));

describe('persona voice routes', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('sbaitso_onboarding_completed', 'true');
    speak.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        url === '/api/tts' ? json({ audio: 'AAAAAA==' }) : json({ text: 'All systems are functioning.' }),
      ),
    );
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('greets on the Sbaitso route and answers HAL on the HAL route', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER'), 'DAVE{Enter}');
    const input = await waitFor(
      () => {
        const el = document.getElementById('chat-input') as HTMLInputElement | null;
        expect(el && !el.disabled).toBe(true);
        return el!;
      },
      { timeout: 15_000 },
    );
    expect(speak.mock.calls[0][2]).toEqual({ processing: 'sbaitso' });

    await user.selectOptions(screen.getByLabelText('PERSONA:'), 'hal9000');
    await user.type(input, 'how is the mission going{Enter}');
    await screen.findByText('All systems are functioning.', { selector: 'p' }, { timeout: 10_000 });
    await waitFor(() => expect(speak.mock.calls.at(-1)?.[2]).toEqual({ processing: 'hal' }));
  }, 40_000);
});
