import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore } from '../src/core/store';
import { TexturePipelineManager } from '../src/sync/texture.pipeline';

describe('2D <-> 3D Synchronization & Texture Pipeline', () => {
  let pipeline: TexturePipelineManager;

  beforeEach(() => {
    pipeline = new TexturePipelineManager('medium');
    useStore.getState().resetConfiguration();
  });

  it('marks section dirty in the store when background color changes', () => {
    const store = useStore.getState();

    // Verify initial clean state for right peak
    store.markSectionClean('canopy-right');
    expect(useStore.getState().dirtySectionIds['canopy-right']).toBeUndefined();

    // Change background color of right peak
    store.setSectionBackgroundColor('canopy-right', '#FF9900');

    // ONLY canopy-right should be marked dirty
    const dirty = useStore.getState().dirtySectionIds;
    expect(dirty['canopy-right']).toBe(true);
  });

  it('invalidates texture only for the specific modified section', async () => {
    const updatedSections: string[] = [];
    pipeline.onTextureUpdated((secId) => {
      updatedSections.push(secId);
    });

    pipeline.getOrCreateSectionCanvas('canopy-front', {
      width: 1024,
      height: 768,
      aspectRatio: 1.333,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      bleed: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    // Mark canopy-front dirty in pipeline
    pipeline.markDirty('canopy-front');

    // Flush dirty queue
    await pipeline.flushDirtyQueue();

    // Only canopy-front should have been processed
    expect(updatedSections).toContain('canopy-front');
    expect(updatedSections).not.toContain('canopy-back');
    expect(updatedSections).not.toContain('valance-front');
  });

  it('debounces rapid sequential layer updates into a single render tick', async () => {
    const updateSpy = vi.fn();
    pipeline.onTextureUpdated(updateSpy);

    pipeline.getOrCreateSectionCanvas('canopy-front', {
      width: 1024,
      height: 768,
      aspectRatio: 1.333,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      bleed: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    // Simulate rapid drag/rotate/scale movements (10 consecutive updates)
    for (let i = 0; i < 10; i++) {
      pipeline.markDirty('canopy-front');
    }

    // Flush batch
    await pipeline.flushDirtyQueue();

    // Because queue is a Set, only one update is issued per dirty section
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith('canopy-front');
  });
});
