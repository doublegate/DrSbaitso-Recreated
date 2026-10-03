/** Panels fed by saved history explain how to get data when there is none. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConversationInsights from '@/components/ConversationInsights';
import { ConversationSearch } from '@/components/ConversationSearch';

describe('history-backed panels with no saved conversations', () => {
  beforeEach(() => localStorage.clear());

  it('Insights points to SAVE HISTORY', async () => {
    render(<ConversationInsights onClose={vi.fn()} currentTheme="dos-blue" />);
    expect(await screen.findByText(/SAVE HISTORY/)).toBeInTheDocument();
  });

  it('Search points to SAVE HISTORY', () => {
    render(<ConversationSearch isOpen onClose={vi.fn()} sessions={[]} onOpenSession={vi.fn()} />);
    expect(screen.getByText(/SAVE HISTORY/)).toBeInTheDocument();
  });
});
