/** Insights shows the all-time totals recorded per conversation. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConversationInsights from '@/components/ConversationInsights';
import { SessionManager } from '@/utils/sessionManager';
import type { ConversationSession } from '@/types';

describe('ConversationInsights all-time totals', () => {
  beforeEach(() => localStorage.clear());

  it('lists conversations, messages and the favourite persona', async () => {
    const now = Date.now();
    const session: ConversationSession = {
      ...SessionManager.createSession('hal9000', 'dos-blue', 'authentic'),
      messages: [
        { author: 'user', text: 'Hello', timestamp: now - 60_000 },
        { author: 'dr', text: 'Good afternoon.', timestamp: now },
      ],
      messageCount: 2,
    };
    SessionManager.saveSession(session);
    SessionManager.updateStats(session);

    render(<ConversationInsights onClose={vi.fn()} currentTheme="dos-blue" />);
    expect(await screen.findByText('All-time totals')).toBeInTheDocument();
    expect(screen.getByText(/Conversations: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Messages: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Most used persona: HAL 9000/)).toBeInTheDocument();
  });
});
