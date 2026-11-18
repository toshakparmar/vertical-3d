import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ConfigurationState, Layer, SectionConfig } from '../schema';
import { eventBus } from '../events';

export type QualityTier = 'high' | 'medium' | 'low';

export interface HistoryState {
  past: ConfigurationState[];
  future: ConfigurationState[];
}

export interface StoreState {
  // 1. Single Source of Truth
  config: ConfigurationState;

  // 2. Selection & Navigation
  selectedSectionId: string;
  hoveredSectionId: string | null;
  selectedLayerId: string | null;
  activeStep: 'options' | 'design' | 'walls' | 'review';
  activeTab: 'design' | 'options' | 'preview';

  // 3. 2D <-> 3D Synchronization Texture Pipeline
  dirtySectionIds: Record<string, boolean>;
  qualityTier: QualityTier;

  // 4. History (Undo / Redo)
  history: HistoryState;

  // 5. UI Modals & Drawers
  isCartOpen: boolean;
  isExportingPdf: boolean;
  previewScreenshots: Record<string, string>;

  // Actions
  setSelectedSection: (sectionId: string, origin?: '2d' | '3d' | 'ui') => void;
  setHoveredSection: (sectionId: string | null, origin?: '2d' | '3d' | 'ui') => void;
  setSelectedLayer: (layerId: string | null) => void;
  setActiveStep: (step: 'options' | 'design' | 'walls' | 'review') => void;
  setActiveTab: (tab: 'design' | 'options' | 'preview') => void;
  setQualityTier: (tier: QualityTier) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsExportingPdf: (generating: boolean) => void;
  setPreviewScreenshot: (angle: string, dataUrl: string) => void;

  // Configuration Actions
  setVariantId: (variantId: string) => void;
  setOptionValue: (optionId: string, valueId: string) => void;
  setQuantity: (quantity: number) => void;

  // Section & Layer Editing Actions
  setSectionBackgroundColor: (sectionId: string, color: string) => void;
  addLayer: (sectionId: string, layer: Layer) => void;
  updateLayer: (sectionId: string, layerId: string, updates: Partial<Layer>) => void;
  removeLayer: (sectionId: string, layerId: string) => void;
  reorderLayers: (sectionId: string, sourceIndex: number, targetIndex: number) => void;
  resetSection: (sectionId: string) => void;

  // Bulk State Operations
  loadConfiguration: (newState: ConfigurationState) => void;
  resetConfiguration: () => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  // Texture Dirtiness Management
  markSectionDirty: (sectionId: string) => void;
  markSectionClean: (sectionId: string) => void;
}

const DEFAULT_SECTIONS: Record<string, SectionConfig> = {
  'canopy-front': { backgroundColor: '#FFFFFF', layers: [] },
  'canopy-right': { backgroundColor: '#FFFFFF', layers: [] },
  'canopy-back': { backgroundColor: '#FFFFFF', layers: [] },
  'canopy-left': { backgroundColor: '#FFFFFF', layers: [] },
  'valance-front': { backgroundColor: '#FFFFFF', layers: [] },
  'valance-right': { backgroundColor: '#FFFFFF', layers: [] },
  'valance-back': { backgroundColor: '#FFFFFF', layers: [] },
  'valance-left': { backgroundColor: '#FFFFFF', layers: [] },
  'back-wall': { backgroundColor: '#FFFFFF', layers: [] },
};

const DEFAULT_CONFIG: ConfigurationState = {
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
  sections: DEFAULT_SECTIONS,
  quantity: 1,
  meta: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    previewUrls: {},
  },
};

const MAX_HISTORY = 30;

export const useStore = create<StoreState>()(
  immer((set, get) => {
    // Helper to push snapshot onto history before modifying config
    const pushHistory = (state: StoreState) => {
      state.history.past.push(JSON.parse(JSON.stringify(state.config)));
      if (state.history.past.length > MAX_HISTORY) {
        state.history.past.shift();
      }
      state.history.future = []; // clear redo on new modification
    };

    return {
      config: DEFAULT_CONFIG,
      selectedSectionId: 'canopy-front',
      hoveredSectionId: null,
      selectedLayerId: null,
      activeStep: 'design',
      activeTab: 'design',
      dirtySectionIds: { 'canopy-front': true },
      qualityTier: 'medium',
      history: {
        past: [],
        future: [],
      },
      isCartOpen: false,
      isExportingPdf: false,
      previewScreenshots: {},

      setSelectedSection: (sectionId, origin = 'ui') => {
        set((state) => {
          state.selectedSectionId = sectionId;
          state.selectedLayerId = null;
        });
        eventBus.emit('section:selected', { sectionId, origin });
      },

      setHoveredSection: (sectionId, origin = 'ui') => {
        set((state) => {
          state.hoveredSectionId = sectionId;
        });
        eventBus.emit('section:hovered', { sectionId, origin });
      },

      setSelectedLayer: (layerId) =>
        set((state) => {
          state.selectedLayerId = layerId;
        }),

      setActiveStep: (step) =>
        set((state) => {
          state.activeStep = step;
        }),

      setActiveTab: (tab) =>
        set((state) => {
          state.activeTab = tab;
        }),

      setQualityTier: (tier) =>
        set((state) => {
          state.qualityTier = tier;
        }),

      setIsCartOpen: (open) =>
        set((state) => {
          state.isCartOpen = open;
        }),

      setIsExportingPdf: (generating) =>
        set((state) => {
          state.isExportingPdf = generating;
        }),

      setPreviewScreenshot: (angle, dataUrl) =>
        set((state) => {
          state.previewScreenshots[angle] = dataUrl;
          state.config.meta.previewUrls[angle] = dataUrl;
        }),

      setVariantId: (variantId) => {
        set((state) => {
          pushHistory(state);
          state.config.variantId = variantId;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('config:changed', { state: get().config });
      },

      setOptionValue: (optionId, valueId) => {
        set((state) => {
          pushHistory(state);
          state.config.selections[optionId] = valueId;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('config:changed', { state: get().config });
      },

      setQuantity: (quantity) => {
        set((state) => {
          pushHistory(state);
          state.config.quantity = Math.max(1, quantity);
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('config:changed', { state: get().config });
      },

      setSectionBackgroundColor: (sectionId, color) => {
        set((state) => {
          pushHistory(state);
          if (!state.config.sections[sectionId]) {
            state.config.sections[sectionId] = { backgroundColor: color, layers: [] };
          } else {
            state.config.sections[sectionId].backgroundColor = color;
          }
          state.dirtySectionIds[sectionId] = true;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('texture:dirty', { sectionId });
        eventBus.emit('config:changed', { state: get().config });
      },

      addLayer: (sectionId, layer) => {
        set((state) => {
          pushHistory(state);
          if (!state.config.sections[sectionId]) {
            state.config.sections[sectionId] = { backgroundColor: '#FFFFFF', layers: [] };
          }
          state.config.sections[sectionId].layers.push(layer);
          state.selectedLayerId = layer.id;
          state.dirtySectionIds[sectionId] = true;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('texture:dirty', { sectionId });
        eventBus.emit('config:changed', { state: get().config });
      },

      updateLayer: (sectionId, layerId, updates) => {
        set((state) => {
          const section = state.config.sections[sectionId];
          if (!section) return;
          const idx = section.layers.findIndex((l) => l.id === layerId);
          if (idx === -1) return;

          pushHistory(state);
          section.layers[idx] = { ...section.layers[idx], ...updates } as Layer;
          state.dirtySectionIds[sectionId] = true;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('texture:dirty', { sectionId });
        eventBus.emit('config:changed', { state: get().config });
      },

      removeLayer: (sectionId, layerId) => {
        set((state) => {
          const section = state.config.sections[sectionId];
          if (!section) return;
          pushHistory(state);
          section.layers = section.layers.filter((l) => l.id !== layerId);
          if (state.selectedLayerId === layerId) {
            state.selectedLayerId = null;
          }
          state.dirtySectionIds[sectionId] = true;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('texture:dirty', { sectionId });
        eventBus.emit('config:changed', { state: get().config });
      },

      reorderLayers: (sectionId, sourceIndex, targetIndex) => {
        set((state) => {
          const section = state.config.sections[sectionId];
          if (!section) return;
          pushHistory(state);
          const [moved] = section.layers.splice(sourceIndex, 1);
          section.layers.splice(targetIndex, 0, moved);
          // update zIndexes
          section.layers.forEach((l, i) => {
            l.zIndex = i;
          });
          state.dirtySectionIds[sectionId] = true;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('texture:dirty', { sectionId });
        eventBus.emit('config:changed', { state: get().config });
      },

      resetSection: (sectionId) => {
        set((state) => {
          pushHistory(state);
          state.config.sections[sectionId] = { backgroundColor: '#FFFFFF', layers: [] };
          state.dirtySectionIds[sectionId] = true;
          state.selectedLayerId = null;
          state.config.meta.updatedAt = new Date().toISOString();
        });
        eventBus.emit('texture:dirty', { sectionId });
        eventBus.emit('config:changed', { state: get().config });
      },

      loadConfiguration: (newState) => {
        set((state) => {
          pushHistory(state);
          state.config = newState;
          // mark all sections dirty so textures refresh
          Object.keys(newState.sections).forEach((secId) => {
            state.dirtySectionIds[secId] = true;
          });
        });
        Object.keys(newState.sections).forEach((secId) => {
          eventBus.emit('texture:dirty', { sectionId: secId });
        });
        eventBus.emit('config:changed', { state: newState });
      },

      resetConfiguration: () => {
        set((state) => {
          pushHistory(state);
          state.config = DEFAULT_CONFIG;
          Object.keys(DEFAULT_SECTIONS).forEach((secId) => {
            state.dirtySectionIds[secId] = true;
          });
        });
        Object.keys(DEFAULT_SECTIONS).forEach((secId) => {
          eventBus.emit('texture:dirty', { sectionId: secId });
        });
        eventBus.emit('config:changed', { state: DEFAULT_CONFIG });
      },

      undo: () => {
        set((state) => {
          if (state.history.past.length === 0) return;
          const previous = state.history.past.pop()!;
          state.history.future.push(JSON.parse(JSON.stringify(state.config)));
          state.config = previous;
          Object.keys(previous.sections).forEach((secId) => {
            state.dirtySectionIds[secId] = true;
          });
        });
        eventBus.emit('config:changed', { state: get().config });
      },

      redo: () => {
        set((state) => {
          if (state.history.future.length === 0) return;
          const next = state.history.future.pop()!;
          state.history.past.push(JSON.parse(JSON.stringify(state.config)));
          state.config = next;
          Object.keys(next.sections).forEach((secId) => {
            state.dirtySectionIds[secId] = true;
          });
        });
        eventBus.emit('config:changed', { state: get().config });
      },

      markSectionDirty: (sectionId) =>
        set((state) => {
          state.dirtySectionIds[sectionId] = true;
        }),

      markSectionClean: (sectionId) =>
        set((state) => {
          delete state.dirtySectionIds[sectionId];
        }),
    };
  })
);
