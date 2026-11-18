import { z } from 'zod';

// ==========================================
// 1. Layer Definitions (Normalized UV [0..1])
// ==========================================

export const BaseLayerSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  x: z.number().min(0).max(1), // Normalized X (0 = left, 1 = right)
  y: z.number().min(0).max(1), // Normalized Y (0 = top, 1 = bottom)
  width: z.number().positive().max(1), // Normalized Width
  height: z.number().positive().max(1), // Normalized Height
  rotation: z.number().default(0), // Degrees (0..360)
  scale: z.number().default(1),
  zIndex: z.number().int().default(0),
  locked: z.boolean().default(false),
  visible: z.boolean().default(true),
});

export const TextLayerSchema = BaseLayerSchema.extend({
  type: z.literal('text'),
  content: z.string(),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().positive().default(28), // In canvas pixel units relative to template
  fill: z.string().default('#000000'), // Hex color
  align: z.enum(['left', 'center', 'right']).default('center'),
  letterSpacing: z.number().default(0),
  curve: z.number().optional(), // Arc curvature if curved text
});

export const ImageLayerSchema = BaseLayerSchema.extend({
  type: z.literal('image'),
  assetId: z.string(),
  assetUrl: z.string(), // Local object URL or CDN URL
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  fit: z.enum(['contain', 'cover', 'fill']).default('contain'),
  crop: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  opacity: z.number().min(0).max(1).default(1),
});

export const ColorFillLayerSchema = BaseLayerSchema.extend({
  type: z.literal('colorFill'),
  fill: z.string(), // Hex color code
  opacity: z.number().min(0).max(1).default(1),
});

export const LayerSchema = z.discriminatedUnion('type', [
  TextLayerSchema,
  ImageLayerSchema,
  ColorFillLayerSchema,
]);

export type Layer = z.infer<typeof LayerSchema>;
export type TextLayer = z.infer<typeof TextLayerSchema>;
export type ImageLayer = z.infer<typeof ImageLayerSchema>;
export type ColorFillLayer = z.infer<typeof ColorFillLayerSchema>;

// ==========================================
// 2. Section & Camera Presets
// ==========================================

export const CameraPresetSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  target: z.tuple([z.number(), z.number(), z.number()]),
  fov: z.number().default(45),
});
export type CameraPreset = z.infer<typeof CameraPresetSchema>;

export const MarginBoxSchema = z.object({
  top: z.number().default(0),
  right: z.number().default(0),
  bottom: z.number().default(0),
  left: z.number().default(0),
});

export const UVTemplateSchema = z.object({
  width: z.number().int().positive(), // Target internal canvas resolution width (e.g. 1024)
  height: z.number().int().positive(), // Target internal canvas resolution height (e.g. 768)
  aspectRatio: z.number().positive(),
  safeArea: MarginBoxSchema, // Margin in px or normalized ratio
  bleed: MarginBoxSchema,
});
export type UVTemplate = z.infer<typeof UVTemplateSchema>;

// ==========================================
// 3. Option & Variant Definitions
// ==========================================

export const OptionValueSchema = z.object({
  id: z.string(),
  label: z.string(),
  colorHex: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  priceModifier: z.number().default(0), // Direct adjustment or pricing ref
  metadata: z.record(z.any()).optional(),
});
export type OptionValue = z.infer<typeof OptionValueSchema>;

export const OptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['select', 'color', 'toggle', 'quantity']),
  values: z.array(OptionValueSchema),
  defaultValue: z.string().optional(),
  affects: z.array(z.string()).default([]), // section IDs impacted by this option
  category: z.enum(['hardware', 'fabric', 'walls', 'accessories', 'turnaround']).default('hardware'),
});
export type Option = z.infer<typeof OptionSchema>;

export const BaseVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  dimensions: z.string(), // e.g. "10ft x 10ft"
  basePrice: z.number().positive(),
  modelPath: z.string(), // Path to GLB
  thumbnailUrl: z.string().optional(),
  defaultSelections: z.record(z.string()).default({}),
});
export type BaseVariant = z.infer<typeof BaseVariantSchema>;

// ==========================================
// 4. Section Definition
// ==========================================

export const SectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  meshTargets: z.array(z.string()), // Target mesh node names in the GLB
  materialTarget: z.string().optional(), // Material name if multiple primitives
  uvTemplate: UVTemplateSchema,
  allowedLayerTypes: z.array(z.enum(['text', 'image', 'colorFill'])),
  options: z.array(OptionSchema).default([]),
  camera: CameraPresetSchema,
  defaultBackgroundColor: z.string().default('#FFFFFF'),
  isPrintable: z.boolean().default(true),
  group: z.enum(['canopy', 'valance', 'walls', 'hardware']).default('canopy'),
});
export type Section = z.infer<typeof SectionSchema>;

// ==========================================
// 5. Product Definition
// ==========================================

export const ConstraintRuleSchema = z.object({
  id: z.string(),
  description: z.string(),
  when: z.record(z.string()), // e.g. { package: 'canopy-only' }
  disallow: z.record(z.array(z.string())), // e.g. { frameMaterial: ['aluminum-50mm'] }
});
export type ConstraintRule = z.infer<typeof ConstraintRuleSchema>;

export const ProductDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string().default('1.0.0'),
  description: z.string(),
  sections: z.array(SectionSchema),
  baseVariants: z.array(BaseVariantSchema),
  globalOptions: z.array(OptionSchema).default([]),
  constraints: z.array(ConstraintRuleSchema).default([]),
  pricingRef: z.string().default('canopy-default-rules'),
});
export type ProductDefinition = z.infer<typeof ProductDefinitionSchema>;

// ==========================================
// 6. Runtime Configuration State
// ==========================================

export const SectionConfigSchema = z.object({
  backgroundColor: z.string().default('#FFFFFF'),
  layers: z.array(LayerSchema).default([]),
});
export type SectionConfig = z.infer<typeof SectionConfigSchema>;

export const ConfigurationMetaSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  previewUrls: z.record(z.string()).default({}), // e.g. { perspective: '...', front: '...' }
  notes: z.string().optional(),
});

export const ConfigurationStateSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  productId: z.string(),
  variantId: z.string(),
  selections: z.record(z.string()), // optionId -> valueId
  sections: z.record(SectionConfigSchema), // sectionId -> SectionConfig
  quantity: z.number().int().min(1).default(1),
  meta: ConfigurationMetaSchema,
});
export type ConfigurationState = z.infer<typeof ConfigurationStateSchema>;

