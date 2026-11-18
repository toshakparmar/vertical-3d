import { ConfigurationState } from '../../core/schema';
import { Quote } from '../../core/pricing/pricing.types';

export interface OutboundEvents {
  'configurator:ready': { version: string };
  'configurator:changed': { state: ConfigurationState };
  'configurator:priceUpdated': { quote: Quote };
  'configurator:addToCart': {
    variantId: string;
    quantity: number;
    quoteId: string;
    properties: Record<string, string>;
  };
  'configurator:resized': { width: number; height: number };
  'configurator:previewReady': { previewUrls: Record<string, string> };
}

export interface InboundCommands {
  'configurator:setVariant': { variantId: string };
  'configurator:loadConfig': { state: ConfigurationState };
  'configurator:requestPreview': Record<string, never>;
}

export class IframeBridge {
  private allowedOrigins: string[];
  private isEmbedded: boolean;

  constructor(allowedOrigins: string[] = ['*']) {
    this.allowedOrigins = allowedOrigins;
    this.isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
  }

  public init(handlers: {
    onSetVariant?: (variantId: string) => void;
    onLoadConfig?: (state: ConfigurationState) => void;
    onRequestPreview?: () => void;
  }): () => void {
    if (typeof window === 'undefined') return () => {};

    const messageHandler = (event: MessageEvent) => {
      if (!this.isOriginAllowed(event.origin)) {
        console.warn(`Blocked untrusted postMessage from origin: ${event.origin}`);
        return;
      }

      const data = event.data;
      if (!data || typeof data.type !== 'string' || !data.type.startsWith('configurator:')) {
        return;
      }

      switch (data.type) {
        case 'configurator:setVariant':
          if (handlers.onSetVariant && data.payload?.variantId) {
            handlers.onSetVariant(data.payload.variantId);
          }
          break;
        case 'configurator:loadConfig':
          if (handlers.onLoadConfig && data.payload?.state) {
            handlers.onLoadConfig(data.payload.state);
          }
          break;
        case 'configurator:requestPreview':
          if (handlers.onRequestPreview) {
            handlers.onRequestPreview();
          }
          break;
      }
    };

    window.addEventListener('message', messageHandler);

    // Notify host that configurator is ready
    this.send('configurator:ready', { version: '1.0.0' });

    // Setup auto-resize observer if embedded
    let resizeObserver: ResizeObserver | null = null;
    if (this.isEmbedded && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.send('configurator:resized', { width, height });
        }
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener('message', messageHandler);
      resizeObserver?.disconnect();
    };
  }

  public send<K extends keyof OutboundEvents>(type: K, payload: OutboundEvents[K]): void {
    if (typeof window === 'undefined' || !this.isEmbedded) return;

    window.parent.postMessage(
      {
        type,
        payload,
      },
      '*'
    );
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.allowedOrigins.includes('*')) return true;
    return this.allowedOrigins.includes(origin);
  }
}

export const iframeBridge = new IframeBridge();

