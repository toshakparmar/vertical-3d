import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../core/store';
import { getProductDefinition } from '../products';
import { apiClient } from '../integrations/api';
import { shopifyAdapter } from '../integrations/shopify';
import { generateProductionPdf } from '../pdf/pdf.generator';
import { encodeConfigToUrl, serializeConfiguration } from '../core/serialization';
import {
  ShoppingCart,
  FileDown,
  Share2,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const OptionsPanel: React.FC = () => {
  const config = useStore((s) => s.config);
  const setVariantId = useStore((s) => s.setVariantId);
  const setOptionValue = useStore((s) => s.setOptionValue);
  const setQuantity = useStore((s) => s.setQuantity);
  const setIsCartOpen = useStore((s) => s.setIsCartOpen);
  const setIsExportingPdf = useStore((s) => s.setIsExportingPdf);
  const previewScreenshots = useStore((s) => s.previewScreenshots);

  const [copiedShare, setCopiedShare] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const product = getProductDefinition(config.productId);

  // 1. TanStack Query for Dynamic Pricing (Debounced via config state dependency)
  const { data: quote, isLoading: isPricingLoading } = useQuery({
    queryKey: ['quote', config],
    queryFn: () => apiClient.fetchQuote(config),
    staleTime: 1000 * 60, // 1 min cache
  });

  const handleAddToCart = async () => {
    if (!quote) return;
    setIsAddingToCart(true);

    try {
      // 1. Generate client-side PDF proof
      await generateProductionPdf(config, quote, previewScreenshots.perspective);

      // 2. Add to Shopify Cart with hidden properties & server-authorized price
      await shopifyAdapter.addToCart({
        variantId: config.variantId,
        quantity: config.quantity,
        quoteId: quote.quoteId,
        config,
        quote,
        properties: {
          _configuration_id: `cfg_${Date.now()}`,
          _quote_id: quote.quoteId,
          _config_hash: quote.configHash,
          _config_json_url: `data:application/json;base64,${btoa(encodeURIComponent(serializeConfiguration(config)))}`,
          _preview_url: previewScreenshots.perspective,
          Size: product.baseVariants.find((v) => v.id === config.variantId)?.dimensions,
          'Frame Option': config.selections.frameGrade,
          Package: config.selections.package,
          'Back Wall': config.selections.backWall,
          Turnaround: config.selections.turnaround,
        },
      });

      // 3. Open cart drawer
      setIsCartOpen(true);
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Could not add to cart. Please check your network connection.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quote) return;
    setIsExportingPdf(true);
    try {
      const pdfBlob = await generateProductionPdf(config, quote, previewScreenshots.perspective);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canopy-tent-proof-${quote.quoteId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareLink = () => {
    const encoded = encodeConfigToUrl(config);
    const shareUrl = `${window.location.origin}${window.location.pathname}#config=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 select-none overflow-y-auto">
      {/* Product Title & Badge */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            MVP Visuals Commercial
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" /> Lifetime Frame Warranty
          </span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">{product.name}</h2>
        <p className="text-xs text-slate-400 mt-1">
          Full-color dye-sublimated 600D polyester with heavy-duty commercial framework.
        </p>
      </div>

      {/* Options Hierarchy */}
      <div className="p-4 space-y-5 flex-1">
        {/* 1. Size / Dimension Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            1. Tent Footprint / Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            {product.baseVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setVariantId(variant.id)}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                  config.variantId === variant.id
                    ? 'border-blue-500 bg-blue-600/15 ring-2 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold text-white">{variant.dimensions}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">${variant.basePrice} base</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Global Options from Definition */}
        {product.globalOptions.map((opt) => (
          <div key={opt.id}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {opt.label}
              </label>
              {opt.category === 'hardware' && (
                <span className="text-[10px] text-slate-500">Commercial grade</span>
              )}
            </div>

            <div className="space-y-1.5">
              {opt.values.map((val) => {
                const isSelected = config.selections[opt.id] === val.id;
                return (
                  <button
                    key={val.id}
                    onClick={() => setOptionValue(opt.id, val.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/10 text-white font-medium'
                        : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{val.label}</span>
                    </div>
                    {val.priceModifier !== 0 && (
                      <span
                        className={`font-mono text-[11px] ${
                          val.priceModifier > 0 ? 'text-blue-400' : 'text-emerald-400'
                        }`}
                      >
                        {val.priceModifier > 0
                          ? `+$${val.priceModifier}`
                          : `-$${Math.abs(val.priceModifier)}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* 3. Quantity Counter with Tiered Discount Hint */}
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white">Order Quantity</span>
              <p className="text-[11px] text-slate-400">Save 5% at 3+ units, 15% at 10+ units</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setQuantity(config.quantity - 1)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center text-sm disabled:opacity-40"
                disabled={config.quantity <= 1}
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-bold font-mono text-white">
                {config.quantity}
              </span>
              <button
                onClick={() => setQuantity(config.quantity + 1)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 4. Live Pricing Breakdown Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Price Breakdown
            </span>
            {isPricingLoading && (
              <span className="text-[10px] text-blue-400 animate-pulse">Calculating...</span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-400">
            {quote?.lineItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <span className="truncate pr-2">{item.label}</span>
                <span
                  className={`font-mono ${
                    item.amount < 0
                      ? 'text-emerald-400 font-semibold'
                      : item.type === 'base'
                        ? 'text-slate-200 font-semibold'
                        : 'text-slate-300'
                  }`}
                >
                  {item.amount < 0
                    ? `-$${Math.abs(item.amount).toFixed(2)}`
                    : `$${item.amount.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-baseline justify-between">
            <span className="text-sm font-bold text-white">Authorized Total</span>
            <div className="text-right">
              <span className="text-xl font-extrabold text-blue-400 font-mono">
                ${quote ? quote.total.toFixed(2) : '---'}
              </span>
              {config.quantity > 1 && (
                <div className="text-[10px] text-slate-500 font-mono">
                  (${quote ? quote.unitPrice.toFixed(2) : '---'} / unit)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-2">
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || !quote}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isAddingToCart ? 'Authorizing Price...' : 'Add to Shopify Cart'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center justify-center space-x-1.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF Proof</span>
          </button>

          <button
            onClick={handleShareLink}
            className="flex items-center justify-center space-x-1.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Share Config</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
