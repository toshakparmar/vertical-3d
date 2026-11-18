import { http, HttpResponse } from 'msw';
import { calculateQuote } from '../core/pricing/pricing.engine';
import { ConfigurationState } from '../core/schema';

export const handlers = [
  // 1. Dynamic Pricing Quote Endpoint
  http.post('/api/pricing/quote', async ({ request }) => {
    try {
      const config = (await request.json()) as ConfigurationState;
      const quote = calculateQuote(config);
      // Simulate 120ms network latency for realism
      await new Promise((res) => setTimeout(res, 120));
      return HttpResponse.json(quote, { status: 200 });
    } catch (err) {
      return HttpResponse.json(
        { error: 'Invalid configuration payload', details: (err as Error).message },
        { status: 400 }
      );
    }
  }),

  // 2. Asset Upload Endpoint
  http.post('/api/assets', async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return HttpResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Convert to blob URL or base64 data URL for mock preview
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const assetUrl = `data:${file.type};base64,${base64}`;

      return HttpResponse.json(
        {
          assetId,
          assetUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
        { status: 201 }
      );
    } catch (err) {
      return HttpResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  }),

  // 3. Cart Price Authorization (Shopify Function / Cart Transform Mock)
  http.post('/api/cart/prepare', async ({ request }) => {
    const body = (await request.json()) as {
      variantId: string;
      quantity: number;
      quoteId: string;
      configHash: string;
    };

    const token = `tok_auth_${Date.now()}_${body.configHash.slice(0, 8)}`;
    return HttpResponse.json({
      token,
      authorized: true,
      quoteId: body.quoteId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  }),

  // 4. Order Attachments (PDF Production Summary)
  http.post('/api/orders/attachments', async () => {
    return HttpResponse.json({
      attachmentId: `att_${Date.now()}`,
      pdfUrl: 'https://cdn.example.com/proofs/proof-summary.pdf',
      status: 'attached',
    });
  }),
];
