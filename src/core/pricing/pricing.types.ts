import { z } from 'zod';
import { ConfigurationState } from '../schema';

export const PricingLineItemTypeSchema = z.enum([
  'base',
  'variant',
  'option',
  'customization',
  'quantityDiscount',
]);
export type PricingLineItemType = z.infer<typeof PricingLineItemTypeSchema>;

export const PricingLineItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: PricingLineItemTypeSchema,
  amount: z.number(), // Amount in currency units (e.g. USD)
  description: z.string().optional(),
});
export type PricingLineItem = z.infer<typeof PricingLineItemSchema>;

export const QuoteSchema = z.object({
  quoteId: z.string(),
  currency: z.string().default('USD'),
  lineItems: z.array(PricingLineItemSchema),
  subtotal: z.number(),
  total: z.number(),
  unitPrice: z.number(),
  quantity: z.number(),
  validUntil: z.string(),
  configHash: z.string(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export interface PricingService {
  quote(config: ConfigurationState): Promise<Quote>;
}

