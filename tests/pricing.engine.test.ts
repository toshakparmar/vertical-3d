import { describe, it, expect } from 'vitest';
import { calculateQuote, generateConfigHash } from '../src/core/pricing/pricing.engine';
import { ConfigurationState } from '../src/core/schema';

describe('Pricing Engine', () => {
  const baseConfig: ConfigurationState = {
    schemaVersion: '1.0.0',
    productId: 'canopy-tent',
    variantId: 'canopy-10x10',
    selections: {
      package: 'complete',
      frameGrade: 'aluminum-40mm',
      backWall: 'none',
      sideWalls: 'none',
      accessories: 'none',
      turnaround: 'standard',
    },
    sections: {
      'canopy-front': { backgroundColor: '#FFFFFF', layers: [] },
      'canopy-right': { backgroundColor: '#FFFFFF', layers: [] },
      'canopy-back': { backgroundColor: '#FFFFFF', layers: [] },
      'canopy-left': { backgroundColor: '#FFFFFF', layers: [] },
    },
    quantity: 1,
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      previewUrls: {},
    },
  };

  it('calculates standard 10x10 canopy base price with commercial frame correctly', () => {
    const quote = calculateQuote(baseConfig);
    // Base: 499, Aluminum-40mm: +120 => 619
    expect(quote.total).toBe(619.0);
    expect(quote.unitPrice).toBe(619.0);
    expect(quote.quantity).toBe(1);
    expect(quote.lineItems).toHaveLength(2);
    expect(quote.lineItems[0].type).toBe('base');
    expect(quote.lineItems[1].type).toBe('option');
  });

  it('applies variant and option modifiers accurately', () => {
    const configWithAddons: ConfigurationState = {
      ...baseConfig,
      variantId: 'canopy-8x8', // 429 base
      selections: {
        ...baseConfig.selections,
        frameGrade: 'aluminum-50mm', // +250
        backWall: 'single-sided', // +149
        accessories: 'roller-bag', // +49
        turnaround: 'rush-48h', // +95
      },
    };

    const quote = calculateQuote(configWithAddons);
    // 429 + 250 + 149 + 49 + 95 = 972
    expect(quote.total).toBe(972.0);
    expect(quote.lineItems.map((item) => item.amount)).toContain(429);
    expect(quote.lineItems.map((item) => item.amount)).toContain(250);
    expect(quote.lineItems.map((item) => item.amount)).toContain(149);
    expect(quote.lineItems.map((item) => item.amount)).toContain(49);
    expect(quote.lineItems.map((item) => item.amount)).toContain(95);
  });

  it('charges customization surcharges for layers exceeding free allowance', () => {
    const configWithLotsOfLayers: ConfigurationState = {
      ...baseConfig,
      sections: {
        'canopy-front': {
          backgroundColor: '#FF0000',
          layers: [
            // 4 image layers (2 free, 2 paid @ $15 = +$30)
            {
              id: 'img1',
              sectionId: 'canopy-front',
              type: 'image',
              assetId: 'a1',
              assetUrl: 'blob:1',
              x: 0.5,
              y: 0.5,
              width: 0.3,
              height: 0.3,
              rotation: 0,
              scale: 1,
              zIndex: 0,
              locked: false,
              visible: true,
              fit: 'contain',
              opacity: 1,
            },
            {
              id: 'img2',
              sectionId: 'canopy-front',
              type: 'image',
              assetId: 'a2',
              assetUrl: 'blob:2',
              x: 0.5,
              y: 0.5,
              width: 0.3,
              height: 0.3,
              rotation: 0,
              scale: 1,
              zIndex: 1,
              locked: false,
              visible: true,
              fit: 'contain',
              opacity: 1,
            },
            {
              id: 'img3',
              sectionId: 'canopy-front',
              type: 'image',
              assetId: 'a3',
              assetUrl: 'blob:3',
              x: 0.5,
              y: 0.5,
              width: 0.3,
              height: 0.3,
              rotation: 0,
              scale: 1,
              zIndex: 2,
              locked: false,
              visible: true,
              fit: 'contain',
              opacity: 1,
            },
            {
              id: 'img4',
              sectionId: 'canopy-front',
              type: 'image',
              assetId: 'a4',
              assetUrl: 'blob:4',
              x: 0.5,
              y: 0.5,
              width: 0.3,
              height: 0.3,
              rotation: 0,
              scale: 1,
              zIndex: 3,
              locked: false,
              visible: true,
              fit: 'contain',
              opacity: 1,
            },
            // 5 text layers (4 free, 1 paid @ $5 = +$5)
            ...Array.from({ length: 5 }, (_, i) => ({
              id: `txt${i}`,
              sectionId: 'canopy-front',
              type: 'text' as const,
              content: `Text ${i}`,
              fontFamily: 'Inter',
              fontSize: 24,
              fill: '#000000',
              align: 'center' as const,
              letterSpacing: 0,
              x: 0.5,
              y: 0.2 + i * 0.1,
              width: 0.4,
              height: 0.1,
              rotation: 0,
              scale: 1,
              zIndex: 10 + i,
              locked: false,
              visible: true,
            })),
          ],
        },
      },
    };

    const quote = calculateQuote(configWithLotsOfLayers);
    // Base 499 + Frame 120 + 2 extra images (30) + 1 extra text (5) = 654
    expect(quote.total).toBe(654.0);
    const customItems = quote.lineItems.filter((i) => i.type === 'customization');
    expect(customItems).toHaveLength(2);
    expect(customItems.find((i) => i.id === 'custom-extra-images')?.amount).toBe(30);
    expect(customItems.find((i) => i.id === 'custom-extra-text')?.amount).toBe(5);
  });

  it('calculates tiered volume discounts accurately', () => {
    // 5 units => 5% discount
    const config5Units: ConfigurationState = {
      ...baseConfig,
      quantity: 5,
    };
    const quote5 = calculateQuote(config5Units);
    // Unit price: 619 * 5 = 3095 gross
    // 5% discount = 154.75 => Total: 2940.25
    expect(quote5.subtotal).toBe(3095.0);
    expect(quote5.total).toBe(2940.25);
    expect(quote5.lineItems.find((i) => i.type === 'quantityDiscount')?.amount).toBe(-154.75);

    // 10 units => 15% corporate discount
    const config10Units: ConfigurationState = {
      ...baseConfig,
      quantity: 10,
    };
    const quote10 = calculateQuote(config10Units);
    // Unit price: 619 * 10 = 6190 gross
    // 15% discount = 928.50 => Total: 5261.50
    expect(quote10.subtotal).toBe(6190.0);
    expect(quote10.total).toBe(5261.5);
  });

  it('produces a deterministic configHash for identical configurations', () => {
    const hash1 = generateConfigHash(baseConfig);
    const hash2 = generateConfigHash({ ...baseConfig });
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^cfg_[0-9a-f]{8}$/);

    const modifiedConfig: ConfigurationState = {
      ...baseConfig,
      quantity: 2,
    };
    const hash3 = generateConfigHash(modifiedConfig);
    expect(hash3).not.toBe(hash1);
  });
});
