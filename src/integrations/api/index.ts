import { ConfigurationState } from '../../core/schema';
import { Quote } from '../../core/pricing/pricing.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface UploadAssetResponse {
  assetId: string;
  assetUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface CartPrepareResponse {
  token: string;
  authorized: boolean;
  quoteId: string;
  expiresAt: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchQuote(config: ConfigurationState): Promise<Quote> {
    const res = await fetch(`${this.baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      throw new Error(`Pricing API returned error HTTP ${res.status}`);
    }

    return res.json();
  }

  async uploadAsset(file: File): Promise<UploadAssetResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${this.baseUrl}/assets`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Asset upload failed with HTTP ${res.status}`);
    }

    return res.json();
  }

  async prepareCartPrice(payload: {
    variantId: string;
    quantity: number;
    quoteId: string;
    configHash: string;
  }): Promise<CartPrepareResponse> {
    const res = await fetch(`${this.baseUrl}/cart/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Cart preparation failed with HTTP ${res.status}`);
    }

    return res.json();
  }

  async attachOrderPdf(pdfBlob: Blob, orderId: string, configHash: string): Promise<any> {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'production-summary.pdf');
    formData.append('orderId', orderId);
    formData.append('configHash', configHash);

    const res = await fetch(`${this.baseUrl}/orders/attachments`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Order PDF attachment failed HTTP ${res.status}`);
    }

    return res.json();
  }
}

export const apiClient = new ApiClient();
