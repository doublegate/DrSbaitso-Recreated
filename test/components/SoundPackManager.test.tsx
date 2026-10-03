import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import SoundPackManager from '@/components/SoundPackManager';
import { THEMES } from '@/constants';
import { LEGACY_SOUND_PACKS_KEY, resetSoundPackStoreForTests, listSoundPacks } from '@/utils/soundPackStore';
import { generateShareCode, type SoundPack } from '@/utils/soundPackFormat';

const pack = (name: string): SoundPack => ({
  metadata: { name, author: 'A', version: '1.0.0', description: 'x', created: 1, updated: 1, tags: [] },
  sounds: [{ id: 's', name: 'S', description: '', audioData: 'AAAA', duration: 5, volume: 80 }],
  triggers: [{ event: 'message_sent', soundId: 's', probability: 100 }],
});

const renderManager = () => render(<SoundPackManager theme={THEMES[0]} onClose={() => {}} onCreateNew={() => {}} />);

describe('SoundPackManager', () => {
  beforeEach(() => {
    resetSoundPackStoreForTests();
    globalThis.indexedDB = new IDBFactory();
  });
  afterEach(() => vi.restoreAllMocks());

  it('lists packs migrated from localStorage', async () => {
    localStorage.setItem(LEGACY_SOUND_PACKS_KEY, JSON.stringify([pack('Legacy Pack')]));
    renderManager();
    expect(await screen.findByText('Legacy Pack')).toBeInTheDocument();
  });

  it('installs a pack from a pasted share code', async () => {
    renderManager();
    fireEvent.click(screen.getByText(/Install from Share Code/));
    fireEvent.change(screen.getByLabelText('Share code'), { target: { value: generateShareCode(pack('Shared')) } });
    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(await screen.findByText('Shared')).toBeInTheDocument();
    expect((await listSoundPacks()).map((p) => p.metadata.name)).toEqual(['Shared']);
  });

  it('reports a malformed share code instead of installing it', async () => {
    renderManager();
    fireEvent.click(screen.getByText(/Install from Share Code/));
    fireEvent.change(screen.getByLabelText('Share code'), { target: { value: btoa('{"metadata":{}}') } });
    fireEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Failed to install from share code/);
  });

  it('copies the share code with the Clipboard API and degrades gracefully', async () => {
    localStorage.setItem(LEGACY_SOUND_PACKS_KEY, JSON.stringify([pack('Copyable')]));
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const execCommand = vi.fn();
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    renderManager();
    fireEvent.click(await screen.findByText('Copyable'));
    fireEvent.click(screen.getByText(/Generate Share Code/));
    fireEvent.click(screen.getByRole('button', { name: /Copy$/ }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/copy it manually/));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(execCommand).not.toHaveBeenCalled();
  });
});
