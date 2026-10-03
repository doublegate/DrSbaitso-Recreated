import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const authUnsubscribe = vi.hoisted(() => vi.fn());

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), deleteApp: vi.fn(async () => {}) }));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(() => authUnsubscribe),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
}));

import CloudSyncPanel from '@/components/CloudSyncPanel';
import { CloudSync } from '@/utils/cloudSync';

const snippet = `{
  apiKey: "AIzaSyA-1234567890abcdefghijklmnopqrstu",
  authDomain: "my-app.firebaseapp.com",
  projectId: "my-app",
  appId: "1:123456789012:web:abc123def456"
}`;

const renderPanel = () =>
  render(<CloudSyncPanel onClose={() => {}} getLocalData={() => ({ sessions: [] })} onRemoteData={() => {}} />);

describe('CloudSyncPanel', () => {
  beforeEach(async () => {
    await CloudSync.resetForTests();
  });

  it('describes itself as a backup for this browser, not cross-device sync', () => {
    renderPanel();
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/across devices|any device/i);
    expect(text).toMatch(/backup/i);
    expect(text).toMatch(/does not sync between devices/i);
  });

  it('asks for a Firebase config first and explains invalid input', async () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Firebase web config:'), { target: { value: '{ apiKey: "x" }' } });
    fireEvent.click(screen.getByRole('button', { name: 'CONNECT' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/authDomain is required/);
    expect(screen.queryByText('SIGN IN ANONYMOUSLY')).toBeNull();
  });

  it('connects with a valid config and offers sign-in', async () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Firebase web config:'), { target: { value: snippet } });
    fireEvent.click(screen.getByRole('button', { name: 'CONNECT' }));
    expect(await screen.findByText('SIGN IN ANONYMOUSLY')).toBeInTheDocument();
  });

  it('releases the auth listener when closed', async () => {
    const { unmount } = renderPanel();
    fireEvent.change(screen.getByLabelText('Firebase web config:'), { target: { value: snippet } });
    fireEvent.click(screen.getByRole('button', { name: 'CONNECT' }));
    await screen.findByText('SIGN IN ANONYMOUSLY');
    unmount();
    expect(authUnsubscribe).toHaveBeenCalled();
  });
});
