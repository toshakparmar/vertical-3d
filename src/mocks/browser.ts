import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function initMocks() {
  // If a real backend URL is specified, don't start MSW
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log(`Configurator using real backend at: ${import.meta.env.VITE_API_BASE_URL}`);
    return;
  }

  // Otherwise activate MSW in the browser
  await worker.start({
    onUnhandledRequest: 'bypass',
  });
  console.log('[MSW] Mock Service Worker running for pricing, cart, and asset uploads');
}

