import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SoundPackCreator from '@/components/SoundPackCreator';
import { THEMES } from '@/constants';
import { createEmptySoundPack, validateSoundPack } from '@/utils/soundPackFormat';

function validPack() {
  const pack = createEmptySoundPack('Tester');
  pack.metadata.name = 'Test pack';
  // 2 silent PCM16 samples.
  pack.sounds.push({ id: 'beep', name: 'Beep', description: '', audioData: 'AAAAAA==', duration: 1, volume: 80 });
  expect(validateSoundPack(pack).errors).toEqual([]);
  return pack;
}

describe('SoundPackCreator save', () => {
  it('closes only after the save has succeeded', async () => {
    let finish!: () => void;
    const onSave = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onClose = vi.fn();
    render(<SoundPackCreator theme={THEMES[0]} onClose={onClose} onSave={onSave} initialPack={validPack()} />);
    await userEvent.click(screen.getByRole('button', { name: /Save Pack/ }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    finish();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('stays open and shows the reason when the save fails', async () => {
    const onSave = vi.fn(() => Promise.reject(new Error('Storage is full')));
    const onClose = vi.fn();
    render(<SoundPackCreator theme={THEMES[0]} onClose={onClose} onSave={onSave} initialPack={validPack()} />);
    await userEvent.click(screen.getByRole('button', { name: /Save Pack/ }));
    expect(await screen.findByText(/Storage is full/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
