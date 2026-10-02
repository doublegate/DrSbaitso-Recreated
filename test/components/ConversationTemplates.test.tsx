import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationTemplates } from '@/components/ConversationTemplates';

describe('ConversationTemplates', () => {
  beforeEach(() => localStorage.clear());

  it('lets a keyboard user pick a template and apply it', async () => {
    const onSelectTemplate = vi.fn();
    const user = userEvent.setup();
    render(<ConversationTemplates isOpen onClose={vi.fn()} onSelectTemplate={onSelectTemplate} />);

    const cards = screen.getAllByRole('button', { pressed: false });
    expect(cards.length).toBeGreaterThan(0);
    cards[0].focus();
    await user.keyboard('{Enter}');
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Apply Template/ }));
    expect(onSelectTemplate).toHaveBeenCalledTimes(1);
    expect(onSelectTemplate.mock.calls[0][0].length).toBeGreaterThan(0);
  });

  it('selects with Space as well', async () => {
    const user = userEvent.setup();
    render(<ConversationTemplates isOpen onClose={vi.fn()} onSelectTemplate={vi.fn()} />);
    const card = screen.getAllByRole('button', { pressed: false })[0];
    card.focus();
    await user.keyboard(' ');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});
