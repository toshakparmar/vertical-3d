import { ProductDefinition } from '../core/schema';
import { canopy10x10Definition } from './canopy-10x10/product.definition';

export const productRegistry: Record<string, ProductDefinition> = {
  'canopy-tent': canopy10x10Definition,
};

export function getProductDefinition(productId: string): ProductDefinition {
  const prod = productRegistry[productId];
  if (!prod) {
    console.warn(`Product ${productId} not found in registry, falling back to canopy-tent`);
    return canopy10x10Definition;
  }
  return prod;
}
