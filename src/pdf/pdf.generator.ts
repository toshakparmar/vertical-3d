import { jsPDF } from 'jspdf';
import { ConfigurationState } from '../core/schema';
import { Quote } from '../core/pricing/pricing.types';
import { getProductDefinition } from '../products';

export interface ProductionSummary {
  configId: string;
  configHash: string;
  createdAt: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  selections: Record<string, string>;
  lineItems: Array<{ label: string; amount: number; type: string }>;
  sections: Array<{
    id: string;
    label: string;
    backgroundColor: string;
    layersCount: number;
    textLayers: Array<{ content: string; font: string; size: number; color: string }>;
    imageLayers: Array<{ fileName?: string; width: string; height: string }>;
  }>;
}

export function buildProductionSummary(
  config: ConfigurationState,
  quote: Quote
): ProductionSummary {
  const product = getProductDefinition(config.productId);
  const variant =
    product.baseVariants.find((v) => v.id === config.variantId) || product.baseVariants[0];

  const sectionsSummary = Object.entries(config.sections).map(([secId, sec]) => {
    const secDef = product.sections.find((s) => s.id === secId);
    return {
      id: secId,
      label: secDef?.label || secId,
      backgroundColor: sec.backgroundColor,
      layersCount: sec.layers.length,
      textLayers: sec.layers
        .filter((l) => l.type === 'text')
        .map((l: any) => ({
          content: l.content,
          font: l.fontFamily,
          size: l.fontSize,
          color: l.fill,
        })),
      imageLayers: sec.layers
        .filter((l) => l.type === 'image')
        .map((l: any) => ({
          fileName: l.fileName || 'Uploaded Asset',
          width: `${Math.round(l.width * 100)}%`,
          height: `${Math.round(l.height * 100)}%`,
        })),
    };
  });

  return {
    configId: quote.quoteId,
    configHash: quote.configHash,
    createdAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    productName: product.name,
    variantName: variant.name,
    quantity: config.quantity,
    unitPrice: quote.unitPrice,
    totalPrice: quote.total,
    currency: quote.currency,
    selections: config.selections,
    lineItems: quote.lineItems,
    sections: sectionsSummary,
  };
}

export async function generateProductionPdf(
  config: ConfigurationState,
  quote: Quote,
  screenshotDataUrl?: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const summary = buildProductionSummary(config, quote);
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTION SPECIFICATION PROOF', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Order Proof ID: ${summary.configId}  |  Hash: ${summary.configHash}`, 14, 21);
  doc.text(`Date: ${summary.createdAt}`, pageWidth - 45, 21);

  // 2. Product & Configuration Summary Box
  let y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Product & Hardware Specifications', 14, y);

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Product: ${summary.productName}`, 18, y + 7);
  doc.text(`Size / Variant: ${summary.variantName}`, 18, y + 14);
  doc.text(`Quantity: ${summary.quantity} unit(s)`, 18, y + 21);

  doc.text(`Frame Hardware: ${summary.selections.frameGrade || 'Commercial Hex Aluminum'}`, 105, y + 7);
  doc.text(`Package: ${summary.selections.package || 'Complete Kit'}`, 105, y + 14);
  doc.text(`Turnaround: ${summary.selections.turnaround || 'Standard 5-Day'}`, 105, y + 21);

  // 3. 3D Perspective Preview Render
  y += 38;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3D Finished Product Render', 14, y);

  y += 4;
  if (screenshotDataUrl) {
    try {
      doc.addImage(screenshotDataUrl, 'JPEG', 14, y, 90, 65);
    } catch (_) {}
  } else {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 90, 65, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('[3D Finished Render Preview]', 35, y + 34);
  }

  // Selections & Itemized Pricing Box beside render
  const priceX = 110;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Itemized Pricing Breakdown', priceX, y + 6);

  let itemY = y + 14;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  summary.lineItems.forEach((item) => {
    doc.setTextColor(71, 85, 105);
    doc.text(item.label.substring(0, 32), priceX, itemY);
    const amountStr = item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`;
    doc.text(amountStr, pageWidth - 16, itemY, { align: 'right' });
    itemY += 6;
  });

  // Total Bar
  itemY += 2;
  doc.setDrawColor(203, 213, 225);
  doc.line(priceX, itemY, pageWidth - 14, itemY);
  itemY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Total Authorized Price:', priceX, itemY);
  doc.text(`$${summary.totalPrice.toFixed(2)} ${summary.currency}`, pageWidth - 16, itemY, { align: 'right' });

  // 4. Per-Section Artwork Breakdown
  y += 76;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Per-Section Print Artwork & Color Specifications', 14, y);

  y += 6;
  summary.sections.slice(0, 5).forEach((sec) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 14, 1.5, 1.5, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${sec.label}:`, 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Background Color: ${sec.backgroundColor}  |  Layers: ${sec.layersCount}`, 65, y + 6);

    const layerTexts = sec.textLayers.map((t) => `"${t.content}" (${t.font})`).join(', ');
    if (layerTexts) {
      doc.text(`Text: ${layerTexts.substring(0, 60)}`, 18, y + 11);
    } else {
      doc.text(`Text: None  |  Images: ${sec.imageLayers.length} file(s)`, 18, y + 11);
    }

    y += 17;
  });

  // Footer notes & QR verification
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Factory Production Note: Dye-sublimation 600D Polyester. Flame Retardant CPAI-84 certified. 100% CMYK fidelity verified.',
    14,
    pageHeight() - 10
  );

  function pageHeight() {
    return doc.internal.pageSize.getHeight();
  }

  return doc.output('blob');
}

