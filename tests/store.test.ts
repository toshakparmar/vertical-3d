import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../src/core/store';
import { Layer } from '../src/core/schema';

describe('Zustand Configuration Store', () => {
  beforeEach(() => {
    useStore.getState().resetConfiguration();
  });

  it('initializes with default canopy tent configuration', () => {
    const state = useStore.getState();
    expect(state.config.productId).toBe('canopy-tent');
    expect(state.config.variantId).toBe('canopy-10x10');
    expect(state.selectedSectionId).toBe('canopy-front');
    expect(state.config.quantity).toBe(1);
    expect(state.config.sections['canopy-front']).toBeDefined();
  });

  it('selects sections and switches active view', () => {
    const store = useStore.getState();
    store.setSelectedSection('canopy-back', 'ui');

    expect(useStore.getState().selectedSectionId).toBe('canopy-back');
  });

  it('updates section background color and marks section dirty for texture refresh', () => {
    const store = useStore.getState();
    store.setSectionBackgroundColor('canopy-front', '#0055FF');

    const updated = useStore.getState();
    expect(updated.config.sections['canopy-front'].backgroundColor).toBe('#0055FF');
    expect(updated.dirtySectionIds['canopy-front']).toBe(true);
  });

  it('adds, updates, and deletes layers with dirty tracking and undo/redo support', () => {
    const store = useStore.getState();

    const textLayer: Layer = {
      id: 'layer-1',
      sectionId: 'canopy-front',
      type: 'text',
      content: 'Acme Corp',
      fontFamily: 'Inter',
      fontSize: 32,
      fill: '#FFFFFF',
      align: 'center',
      letterSpacing: 0,
      x: 0.5,
      y: 0.5,
      width: 0.4,
      height: 0.15,
      rotation: 0,
      scale: 1,
      zIndex: 0,
      locked: false,
      visible: true,
    };

    // Add Layer
    store.addLayer('canopy-front', textLayer);
    expect(useStore.getState().config.sections['canopy-front'].layers).toHaveLength(1);
    expect(useStore.getState().selectedLayerId).toBe('layer-1');

    // Update Layer
    store.updateLayer('canopy-front', 'layer-1', { content: 'Updated Brand' });
    const currentLayer = useStore.getState().config.sections['canopy-front'].layers[0];
    if (currentLayer.type === 'text') {
      expect(currentLayer.content).toBe('Updated Brand');
    }

    // Undo should restore previous content
    store.undo();
    const undoneLayer = useStore.getState().config.sections['canopy-front'].layers[0];
    if (undoneLayer.type === 'text') {
      expect(undoneLayer.content).toBe('Acme Corp');
    }

    // Redo should re-apply the update
    store.redo();
    const redoneLayer = useStore.getState().config.sections['canopy-front'].layers[0];
    if (redoneLayer.type === 'text') {
      expect(redoneLayer.content).toBe('Updated Brand');
    }

    // Remove layer
    store.removeLayer('canopy-front', 'layer-1');
    expect(useStore.getState().config.sections['canopy-front'].layers).toHaveLength(0);
    expect(useStore.getState().selectedLayerId).toBeNull();
  });

  it('manages dirty section invalidation cycle', () => {
    const store = useStore.getState();
    store.markSectionClean('canopy-front');
    expect(useStore.getState().dirtySectionIds['canopy-front']).toBeUndefined();

    store.markSectionDirty('canopy-front');
    expect(useStore.getState().dirtySectionIds['canopy-front']).toBe(true);
  });
});
