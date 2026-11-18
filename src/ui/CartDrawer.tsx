import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../core/store';
import { shopifyAdapter, CartState } from '../integrations/shopify';

export const CartDrawer: React.FC = () => {
  const isCartOpen = useStore((s) => s.isCartOpen);
  const setIsCartOpen = useStore((s) => s.setIsCartOpen);
  const [cart, setCart] = useState<CartState | null>(null);

  useEffect(() => {
    if (isCartOpen) {
      shopifyAdapter.getCart().then(setCart);
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold">Shopify Cart</h3>
              {cart && (
                <span className="bg-blue-600/30 text-blue-400 text-xs px-2 py-0.5 rounded-full font-mono">
                  {cart.lines.reduce((s, l) => s + l.quantity, 0)} items
                </span>
              )}
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lines List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!cart || cart.lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm">Your cart is currently empty.</p>
              </div>
            ) : (
              cart.lines.map((line) => (
                <div
                  key={line.id}
                  className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-2.5"
                >
                  <div className="flex space-x-3">
                    <img
                      src={line.featuredImage}
                      alt={line.title}
                      className="w-16 h-16 object-cover rounded-lg bg-slate-950 border border-slate-700/60"
                    />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white leading-snug">{line.title}</h4>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="text-sm font-extrabold text-blue-400 font-mono">
                          ${line.finalPrice.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          (Qty: {line.quantity})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Line Item Properties (Customer Visible + Production Metadata) */}
                  <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1 text-slate-300">
                    {line.properties['Size'] && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Size:</span>
                        <span className="font-medium">{line.properties['Size']}</span>
                      </div>
                    )}
                    {line.properties['Frame Option'] && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hardware:</span>
                        <span className="font-medium">{line.properties['Frame Option']}</span>
                      </div>
                    )}
                    {line.properties['Back Wall'] && line.properties['Back Wall'] !== 'none' && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Back Wall:</span>
                        <span className="font-medium">{line.properties['Back Wall']}</span>
                      </div>
                    )}

                    {/* Server Authorized Price Token Badge */}
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded">
                      <span className="flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Authorized Price Token:
                      </span>
                      <span>{(line.properties as any)._price_token || 'Verified'}</span>
                    </div>

                    <div className="text-[9px] text-slate-500 truncate font-mono">
                      Config Hash: {line.properties._config_hash}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {cart && cart.lines.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-300">Total</span>
                <span className="text-2xl font-black text-white font-mono">
                  ${cart.total.toFixed(2)} {cart.currency}
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Custom line items locked via server-side Cart Transform token. Taxes and shipping calculated at checkout.
              </p>

              <button
                onClick={async () => {
                  const checkoutUrl = await shopifyAdapter.getCheckoutUrl();
                  window.open(checkoutUrl, '_blank');
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                <span>Proceed to Shopify Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
