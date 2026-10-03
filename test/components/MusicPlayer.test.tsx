import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MusicPlayer from '@/components/MusicPlayer';
import { musicEngine } from '@/utils/musicEngine';

const theme = { colors: { background: '#000', text: '#fff', accent: '#ff0', border: '#888' } };

describe('MusicPlayer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the engine state when reopened while music is playing', () => {
    vi.spyOn(musicEngine, 'init').mockImplementation(() => {});
    vi.spyOn(musicEngine, 'getSettings').mockReturnValue({
      enabled: true,
      volume: 30,
      mood: 'tense',
      tempo: 'fast',
    });
    render(<MusicPlayer theme={theme} />);
    expect(screen.getByText('ON')).toBeInTheDocument();
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('30');
  });
});
