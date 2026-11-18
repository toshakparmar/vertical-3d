import { ConfigurationState, ConfigurationStateSchema } from '../schema';

export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Serializes configuration state to a clean JSON string.
 */
export function serializeConfiguration(state: ConfigurationState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Parses and validates raw configuration JSON, migrating older versions if necessary.
 */
export function deserializeConfiguration(rawJson: string): ConfigurationState {
  try {
    const parsed = JSON.parse(rawJson);

    // Schema version check and migration hook
    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return migrateConfiguration(parsed);
    }

    return ConfigurationStateSchema.parse(parsed);
  } catch (err) {
    throw new Error(`Failed to parse configuration: ${(err as Error).message}`);
  }
}

/**
 * Handles backwards-compatible schema upgrades.
 */
export function migrateConfiguration(raw: Record<string, any>): ConfigurationState {
  const version = raw.schemaVersion || '0.9.0';
  console.log(`Migrating configuration from v${version} to v${CURRENT_SCHEMA_VERSION}`);

  // Set default schemaVersion
  const migrated = {
    ...raw,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      createdAt: raw.meta?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      previewUrls: raw.meta?.previewUrls || {},
      notes: raw.meta?.notes,
    },
    quantity: raw.quantity || 1,
    selections: raw.selections || {},
    sections: raw.sections || {},
  };

  return ConfigurationStateSchema.parse(migrated);
}

/**
 * Encodes the configuration state into a compressed URL hash.
 */
export function encodeConfigToUrl(state: ConfigurationState): string {
  try {
    const compactState = {
      v: state.schemaVersion,
      p: state.productId,
      var: state.variantId,
      sel: state.selections,
      sec: state.sections,
      q: state.quantity,
    };
    const json = JSON.stringify(compactState);
    const base64 = btoa(encodeURIComponent(json));
    return base64;
  } catch (err) {
    console.error('Failed to encode config to URL:', err);
    return '';
  }
}

/**
 * Decodes a configuration state from a URL hash string.
 */
export function decodeConfigFromUrl(encoded: string): ConfigurationState | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const compact = JSON.parse(json);

    const fullState: ConfigurationState = {
      schemaVersion: compact.v || '1.0.0',
      productId: compact.p || 'canopy-tent',
      variantId: compact.var || 'canopy-10x10',
      selections: compact.sel || {},
      sections: compact.sec || {},
      quantity: compact.q || 1,
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        previewUrls: {},
      },
    };

    return ConfigurationStateSchema.parse(fullState);
  } catch (err) {
    console.error('Failed to decode config from URL:', err);
    return null;
  }
}
