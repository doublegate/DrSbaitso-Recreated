/** Voice commands open the panels their names promise. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/EnhancedApp';
import type { VoiceControlOptions } from '@/hooks/useVoiceControl';

let handlers: VoiceControlOptions = {};
vi.mock('@/hooks/useVoiceControl', () => ({
  useVoiceControl: (options: VoiceControlOptions) => {
    handlers = options;
    const state = { isHandsFreeMode: false, isListening: false, isSupported: false, commands: [] };
    return new Proxy(state, { get: (t, k) => (k in t ? t[k as keyof typeof t] : vi.fn()) });
  },
}));
vi.mock('@/utils/soundPackPlayer', () => ({ playSoundPackEvent: vi.fn(() => Promise.resolve()) }));

const json = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }));

describe('voice commands', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('sbaitso_onboarding_completed', 'true');
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => (url === '/api/tts' ? json({ audio: 'AAAAAA==' }) : json({ text: 'OK.' }))),
    );
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('"show statistics" opens the insights dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(await screen.findByPlaceholderText('TYPE NAME AND PRESS ENTER'), 'ALICE{Enter}');
    await waitFor(() => expect(document.getElementById('chat-input')).not.toBeNull(), { timeout: 15_000 });
    act(() => handlers.onToggleStats?.());
    expect(await screen.findByText('No Data Available', undefined, { timeout: 5_000 })).toBeInTheDocument();
  }, 30_000);
});
