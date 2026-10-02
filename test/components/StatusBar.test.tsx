import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusBar, { type StatusBarProps } from '@/components/enhanced/StatusBar';

function props(overrides: Partial<StatusBarProps> = {}): StatusBarProps {
  return {
    audioMode: 'authentic',
    onAudioModeChange: vi.fn(),
    themeId: 'dos-blue',
    themes: [{ id: 'dos-blue', name: 'DOS Blue' }],
    onThemeChange: vi.fn(),
    keepHistory: false,
    onKeepHistoryChange: vi.fn(),
    muted: false,
    voiceProfile: 'classic',
    onVoiceProfileChange: vi.fn(),
    showVoiceProfile: true,
    ...overrides,
  };
}

describe('StatusBar voice profile', () => {
  it('offers the three voice profiles while Dr. Sbaitso is active', async () => {
    const onVoiceProfileChange = vi.fn();
    render(<StatusBar {...props({ onVoiceProfileChange })} />);
    const select = screen.getByLabelText('Voice profile');
    expect([...select.querySelectorAll('option')].map((o) => o.value)).toEqual(['classic', 'deep', 'glitchy']);
    await userEvent.selectOptions(select, 'deep');
    expect(onVoiceProfileChange).toHaveBeenCalledWith('deep');
  });

  it('is hidden for personas the profiles do not apply to', () => {
    render(<StatusBar {...props({ showVoiceProfile: false })} />);
    expect(screen.queryByLabelText('Voice profile')).toBeNull();
  });
});
