import rules from './pricing-rules.json';
import { ConfigurationState } from '../schema';
import { Quote, PricingLineItem } from './pricing.types';

/**
 * Computes a deterministic hash of the configuration to tie quotes to exact states.
 */
export function generateConfigHash(config: ConfigurationState): string {
  // Sort keys for deterministic JSON stringification
  const canonicalString = JSON.stringify({
    productId: config.productId,
    variantId: config.variantId,
    selections: config.selections,
    sections: Object.keys(config.sections)
      .sort()
      .reduce((acc, key) => {
        acc[key] = {
          backgroundColor: config.sections[key].backgroundColor,
          layers: config.sections[key].layers.map((l) => ({
            id: l.id,
            type: l.type,
            x: Number(l.x.toFixed(4)),
            y: Number(l.y.toFixed(4)),
            width: Number(l.width.toFixed(4)),
            height: Number(l.height.toFixed(4)),
            rotation: Number(l.rotation.toFixed(2)),
            scale: Number(l.scale.toFixed(4)),
            visible: l.visible,
            ...(l.type === 'text'
              ? { content: l.content, fill: l.fill, fontSize: l.fontSize }
              : {}),
            ...(l.type === 'image' ? { assetId: l.assetId } : {}),
            ...(l.type === 'colorFill' ? { fill: l.fill } : {}),
          })),
        };
        return acc;
      }, {} as Record<string, unknown>),
    quantity: config.quantity,
  });

  // FNV-1a 32-bit hash converted to hex
  let hash = 2166136261;
  for (let i = 0; i < canonicalString.length; i++) {
    hash ^= canonicalString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `cfg_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Pure pricing engine calculation logic.
 * Contains no React dependencies, fully deterministic and testable.
 */
export function calculateQuote(config: ConfigurationState): Quote {
  const lineItems: PricingLineItem[] = [];

  // 1. Base Variant Price
  const variantRule =
    rules.baseVariants[config.variantId as keyof typeof rules.baseVariants] ||
    rules.baseVariants['canopy-10x10'];
  const basePrice = variantRule ? variantRule.basePrice : 499.0;

  lineItems.push({
    id: `base-${config.variantId}`,
    label: variantRule ? variantRule.label : 'Base Canopy Tent',
    type: 'base',
    amount: basePrice,
  });

  let unitSubtotal = basePrice;

  // 2. Option Modifiers (Package, Frame Grade, Walls, Accessories, Turnaround)
  const optionModifiers = rules.optionModifiers as Record<
    string,
    Record<string, { label: string; price: number }>
  >;

  for (const [optionId, valueId] of Object.entries(config.selections)) {
    const group = optionModifiers[optionId];
    if (group && group[valueId]) {
      const modifier = group[valueId];
      if (modifier.price !== 0) {
        lineItems.push({
          id: `opt-${optionId}-${valueId}`,
          label: modifier.label,
          type: 'option',
          amount: modifier.price,
        });
        unitSubtotal += modifier.price;
      }
    }
  }

  // 3. Customization Surcharges (Images, Text Layers, Wall Prints)
  let totalImages = 0;
  let totalTexts = 0;
  let hasBackWallArtwork = false;

  for (const [sectionId, section] of Object.entries(config.sections)) {
    for (const layer of section.layers) {
      if (!layer.visible) continue;
      if (layer.type === 'image') totalImages++;
      if (layer.type === 'text') totalTexts++;
    }

    if (
      sectionId.includes('wall') &&
      (section.layers.length > 0 || section.backgroundColor !== '#FFFFFF')
    ) {
      hasBackWallArtwork = true;
    }
  }

  const {
    freeIncludedImages,
    perAdditionalImagePrice,
    freeIncludedTextLayers,
    perAdditionalTextPrice,
    backWallPrintSurcharge,
  } = rules.customizationSurcharges;

  if (totalImages > freeIncludedImages) {
    const billableImages = totalImages - freeIncludedImages;
    const imgCost = billableImages * perAdditionalImagePrice;
    lineItems.push({
      id: 'custom-extra-images',
      label: `Additional Logo/Image Uploads (${billableImages} × $${perAdditionalImagePrice.toFixed(2)})`,
      type: 'customization',
      amount: imgCost,
    });
    unitSubtotal += imgCost;
  }

  if (totalTexts > freeIncludedTextLayers) {
    const billableTexts = totalTexts - freeIncludedTextLayers;
    const textCost = billableTexts * perAdditionalTextPrice;
    lineItems.push({
      id: 'custom-extra-text',
      label: `Additional Text Graphics (${billableTexts} × $${perAdditionalTextPrice.toFixed(2)})`,
      type: 'customization',
      amount: textCost,
    });
    unitSubtotal += textCost;
  }

  if (hasBackWallArtwork && config.selections.backWall && config.selections.backWall !== 'none') {
    lineItems.push({
      id: 'custom-backwall-print',
      label: 'Full-Coverage Wall Sublimation Print Surcharge',
      type: 'customization',
      amount: backWallPrintSurcharge,
    });
    unitSubtotal += backWallPrintSurcharge;
  }

  // 4. Quantity & Tier Discounts
  const quantity = Math.max(1, config.quantity || 1);
  const grossSubtotal = unitSubtotal * quantity;

  let discountPercent = 0;
  let discountLabel = '';
  for (const tier of rules.quantityDiscounts) {
    if (quantity >= tier.minQty && quantity <= tier.maxQty) {
      discountPercent = tier.discountPercent;
      discountLabel = tier.label;
      break;
    }
  }

  let totalDiscount = 0;
  if (discountPercent > 0) {
    totalDiscount = Number(((grossSubtotal * discountPercent) / 100).toFixed(2));
    lineItems.push({
      id: 'discount-quantity',
      label: `${discountLabel} (-${discountPercent}%)`,
      type: 'quantityDiscount',
      amount: -totalDiscount,
    });
  }

  const finalTotal = Math.max(0, Number((grossSubtotal - totalDiscount).toFixed(2)));
  const finalUnitPrice = Number((finalTotal / quantity).toFixed(2));

  const validUntilDate = new Date();
  validUntilDate.setMinutes(
    validUntilDate.getMinutes() + rules.quoteValidityMinutes
  );

  return {
    quoteId: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    currency: rules.currency,
    lineItems,
    subtotal: Number(grossSubtotal.toFixed(2)),
    total: finalTotal,
    unitPrice: finalUnitPrice,
    quantity,
    validUntil: validUntilDate.toISOString(),
    configHash: generateConfigHash(config),
  };
}
