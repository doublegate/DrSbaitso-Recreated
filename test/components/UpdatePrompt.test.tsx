import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pwaStub } from '../stubs/pwa-register-react';
import UpdatePrompt from '@/components/UpdatePrompt';

describe('UpdatePrompt', () => {
  beforeEach(() => {
    pwaStub.needRefresh = false;
    pwaStub.updateServiceWorker.mockClear();
  });

  it('renders nothing when no update is waiting', () => {
    const { container } = render(<UpdatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('only reloads when the user chooses to', async () => {
    pwaStub.needRefresh = true;
    const user = userEvent.setup();
    render(<UpdatePrompt />);
    expect(screen.getByRole('status')).toHaveTextContent(/NEW VERSION/);
    expect(pwaStub.updateServiceWorker).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /reload/i }));
    expect(pwaStub.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('can be dismissed until the next visit', async () => {
    pwaStub.needRefresh = true;
    const user = userEvent.setup();
    render(<UpdatePrompt />);
    await user.click(screen.getByRole('button', { name: /later/i }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(pwaStub.updateServiceWorker).not.toHaveBeenCalled();
  });
});
