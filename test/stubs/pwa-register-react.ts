/**
 * Test stand-in for vite-plugin-pwa's `virtual:pwa-register/react` (virtual
 * modules only exist when the plugin runs). Tests drive it via `pwaStub`.
 */
import { useState } from 'react';
import { vi } from 'vitest';

export const pwaStub = {
  needRefresh: false,
  offlineReady: false,
  updateServiceWorker: vi.fn(async (_reload?: boolean) => {}),
};

export function useRegisterSW() {
  const needRefresh = useState(pwaStub.needRefresh);
  const offlineReady = useState(pwaStub.offlineReady);
  return { needRefresh, offlineReady, updateServiceWorker: pwaStub.updateServiceWorker };
}
