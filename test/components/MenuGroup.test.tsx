import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuGroup from '@/components/enhanced/MenuGroup';

function setup() {
  const onSearch = vi.fn();
  const onReplay = vi.fn();
  render(
    <>
      <MenuGroup
        label="CONVERSATION"
        items={[
          { id: 'search', label: 'Search', shortcut: 'Alt+Shift+F', onSelect: onSearch },
          { id: 'replay', label: 'Replay', onSelect: onReplay, active: true },
        ]}
      />
      <button>outside</button>
    </>,
  );
  return { onSearch, onReplay, user: userEvent.setup() };
}

describe('MenuGroup', () => {
  it('is a collapsed disclosure button until opened', () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'CONVERSATION' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /Search/ })).toBeNull();
  });

  it('opens, shows labelled items with shortcuts, and moves focus to the first item', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'CONVERSATION' }));
    expect(screen.getByRole('button', { name: 'CONVERSATION' })).toHaveAttribute('aria-expanded', 'true');
    const search = screen.getByRole('button', { name: /Search/ });
    expect(search).toHaveTextContent('Alt+Shift+F');
    expect(search).toHaveFocus();
    expect(screen.getByRole('button', { name: /Replay/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('runs the item and closes', async () => {
    const { user, onSearch } = setup();
    await user.click(screen.getByRole('button', { name: 'CONVERSATION' }));
    await user.click(screen.getByRole('button', { name: /Search/ }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Search/ })).toBeNull();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const { user } = setup();
    const trigger = screen.getByRole('button', { name: 'CONVERSATION' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('closes when clicking elsewhere', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'CONVERSATION' }));
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('button', { name: /Search/ })).toBeNull();
  });

  it('supports arrow-key navigation between items', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'CONVERSATION' }));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /Replay/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /Search/ })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: /Replay/ })).toHaveFocus();
  });
});
