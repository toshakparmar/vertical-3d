import { ConfigurationState } from '../../core/schema';
import { Quote } from '../../core/pricing/pricing.types';

export interface CartItemProperties {
  // Hidden properties (prefixed with _)
  _configuration_id: string;
  _quote_id: string;
  _config_json_url: string;
  _preview_url?: string;
  _pdf_url?: string;
  _config_hash: string;

  // Human-readable properties visible to customer & production team
  'Frame Option'?: string;
  'Size'?: string;
  'Wall Add-ons'?: string;
  'Accessories'?: string;
  'Turnaround'?: string;
  'Custom Artwork'?: string;
  [key: string]: string | undefined;
}

export interface AddToCartPayload {
  variantId: string;
  quantity: number;
  properties: CartItemProperties;
  quoteId: string;
  config: ConfigurationState;
  quote: Quote;
}

export interface CartLineItem {
  id: string;
  variantId: string;
  title: string;
  quantity: number;
  price: number; // Stored price
  finalPrice: number; // Custom authorized price from quote
  properties: CartItemProperties;
  featuredImage: string;
}

export interface CartState {
  id: string;
  lines: CartLineItem[];
  subtotal: number;
  total: number;
  currency: string;
}

export interface ShopifyAdapter {
  getProduct(handle: string): Promise<any>;
  getVariants(): Promise<any[]>;
  addToCart(payload: AddToCartPayload): Promise<CartState>;
  getCart(): Promise<CartState>;
  getCheckoutUrl(): Promise<string>;
  prepareCustomPrice(payload: AddToCartPayload): Promise<{ token: string; price: number }>;
}

/**
 * MockShopifyAdapter operates entirely in-memory and mimics
 * Shopify Storefront / AJAX Cart API with Line Item Properties
 * and custom price token validation.
 */
export class MockShopifyAdapter implements ShopifyAdapter {
  private cart: CartState = {
    id: 'cart_mock_8892',
    lines: [],
    subtotal: 0,
    total: 0,
    currency: 'USD',
  };

  async getProduct(handle: string): Promise<any> {
    return {
      id: 'prod_canopy_10x10',
      handle,
      title: 'Custom 10x10 Commercial Canopy Tent',
      vendor: 'MVP Visuals',
    };
  }

  async getVariants(): Promise<any[]> {
    return [
      { id: 'var_10x10_steel', title: '10x10 / Steel Frame', price: 499.0 },
      { id: 'var_10x10_alu40', title: '10x10 / Hex Aluminum 40mm', price: 619.0 },
      { id: 'var_10x10_alu50', title: '10x10 / Heavy Hex Aluminum 50mm', price: 749.0 },
    ];
  }

  /**
   * Mock of server-side price authority:
   * Calls mock /api/cart/prepare to generate a tamper-proof line item price token.
   */
  async prepareCustomPrice(payload: AddToCartPayload): Promise<{ token: string; price: number }> {
    // In production, this contacts backend endpoint to validate configHash and lock price
    const token = `tok_${Date.now()}_${payload.quote.configHash.slice(0, 8)}`;
    return {
      token,
      price: payload.quote.total,
    };
  }

  async addToCart(payload: AddToCartPayload): Promise<CartState> {
    const { token } = await this.prepareCustomPrice(payload);

    const properties: CartItemProperties = {
      ...payload.properties,
      _price_token: token,
      _quote_id: payload.quoteId,
      _configuration_id: `cfg_${Date.now()}`,
      _config_hash: payload.quote.configHash,
    };

    const newItem: CartLineItem = {
      id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      variantId: payload.variantId,
      title: `Custom Canopy Tent (${payload.properties['Size'] || '10x10'})`,
      quantity: payload.quantity,
      price: payload.quote.unitPrice,
      finalPrice: payload.quote.total,
      properties,
      featuredImage:
        payload.properties._preview_url ||
        'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=200&auto=format&fit=crop&q=60',
    };

    this.cart.lines.push(newItem);
    this.recalculateTotals();

    // Persist cart to localStorage for smooth page refreshes
    try {
      localStorage.setItem('shopify_mock_cart', JSON.stringify(this.cart));
    } catch (_) {}

    return this.cart;
  }

  async getCart(): Promise<CartState> {
    try {
      const stored = localStorage.getItem('shopify_mock_cart');
      if (stored) {
        this.cart = JSON.parse(stored);
      }
    } catch (_) {}
    return this.cart;
  }

  async getCheckoutUrl(): Promise<string> {
    return `https://checkout.shopify.com/mock-checkout?cart=${this.cart.id}&total=${this.cart.total}`;
  }

  private recalculateTotals(): void {
    const total = this.cart.lines.reduce((sum, line) => sum + line.finalPrice, 0);
    this.cart.subtotal = total;
    this.cart.total = total;
  }
}

/**
 * ShopifyAjaxCartAdapter connects directly to standard Shopify themes via `/cart/add.js`.
 */
export class ShopifyAjaxCartAdapter implements ShopifyAdapter {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getProduct(handle: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/products/${handle}.js`);
    return res.json();
  }

  async getVariants(): Promise<any[]> {
    return [];
  }

  async prepareCustomPrice(payload: AddToCartPayload): Promise<{ token: string; price: number }> {
    // In Shopify Functions / Cart Transform, this calls custom app endpoint
    const res = await fetch(`${this.baseUrl}/api/cart/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: payload.variantId,
        quantity: payload.quantity,
        quoteId: payload.quoteId,
        configHash: payload.quote.configHash,
      }),
    });
    return res.json();
  }

  async addToCart(payload: AddToCartPayload): Promise<CartState> {
    const body = {
      items: [
        {
          id: payload.variantId,
          quantity: payload.quantity,
          properties: payload.properties,
        },
      ],
    };

    const res = await fetch(`${this.baseUrl}/cart/add.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Shopify cart/add.js returned status ${res.status}`);
    }

    const cartRes = await fetch(`${this.baseUrl}/cart.js`);
    const cartData = await cartRes.json();

    return {
      id: cartData.token,
      lines: cartData.items,
      subtotal: cartData.total_price / 100,
      total: cartData.total_price / 100,
      currency: cartData.currency,
    };
  }

  async getCart(): Promise<CartState> {
    const res = await fetch(`${this.baseUrl}/cart.js`);
    const cartData = await res.json();
    return {
      id: cartData.token,
      lines: cartData.items,
      subtotal: cartData.total_price / 100,
      total: cartData.total_price / 100,
      currency: cartData.currency,
    };
  }

  async getCheckoutUrl(): Promise<string> {
    return `${this.baseUrl}/checkout`;
  }
}

// Export default singleton adapter
export const shopifyAdapter: ShopifyAdapter = new MockShopifyAdapter();
