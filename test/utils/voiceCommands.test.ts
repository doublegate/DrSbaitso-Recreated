import { describe, it, expect, vi } from 'vitest';
import { createVoiceCommands, matchCommand } from '@/utils/voiceCommands';

describe('createVoiceCommands', () => {
  it('only includes commands whose handler is provided', () => {
    const ids = createVoiceCommands({ onClear: () => {} }).map((c) => c.id);
    expect(ids).toEqual(['clear']);
  });

  it.each([
    ['onToggleMusic', 'toggle_music', 'play some music'],
    ['onOpenSoundPacks', 'open_sound_packs', 'open sound packs'],
  ] as const)('%s registers a matchable command', (handler, id, phrase) => {
    const action = vi.fn();
    const commands = createVoiceCommands({ [handler]: action });
    expect(commands.map((c) => c.id)).toEqual([id]);

    const match = matchCommand(phrase, commands, 0.7);
    expect(match?.command.id).toBe(id);
    match!.command.action();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('routes character switching to the right persona', () => {
    const onSwitchCharacter = vi.fn();
    const commands = createVoiceCommands({ onSwitchCharacter });
    matchCommand('talk to eliza', commands, 0.7)?.command.action();
    expect(onSwitchCharacter).toHaveBeenCalledWith('eliza');
  });
});
