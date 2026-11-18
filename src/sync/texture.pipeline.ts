import * as THREE from 'three';
import { SectionConfig, UVTemplate, Layer, TextLayer, ImageLayer } from '../core/schema';

export interface TextureQualitySettings {
  resolution: number; // e.g. 2048 for high, 1024 for medium, 512 for low
  anisotropy: number;
}

export const QUALITY_PRESETS: Record<'high' | 'medium' | 'low', TextureQualitySettings> = {
  high: { resolution: 2048, anisotropy: 8 },
  medium: { resolution: 1024, anisotropy: 4 },
  low: { resolution: 512, anisotropy: 1 },
};

// Quadrant mapping on the 2048x2048 atlas
export interface AtlasQuadrant {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const CANOPY_ATLAS_LAYOUT: Record<string, AtlasQuadrant> = {
  'canopy-front': { x: 0, y: 0.5, w: 1, h: 0.5 },
  'canopy-back': { x: 0, y: 0, w: 1, h: 0.5 },
  'canopy-right': { x: 0.5, y: 0.25, w: 0.5, h: 0.5 },
  'canopy-left': { x: 0, y: 0.25, w: 0.5, h: 0.5 },
  'valance-front': { x: 0, y: 0.85, w: 1, h: 0.15 },
  'valance-back': { x: 0, y: 0, w: 1, h: 0.15 },
  'valance-right': { x: 0.5, y: 0.7, w: 0.5, h: 0.15 },
  'valance-left': { x: 0, y: 0.7, w: 0.5, h: 0.15 },
};

class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private promises = new Map<string, Promise<HTMLImageElement>>();

  async getImage(url: string): Promise<HTMLImageElement> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    if (this.promises.has(url)) {
      return this.promises.get(url)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.cache.set(url, img);
        this.promises.delete(url);
        resolve(img);
      };
      img.onerror = (e) => {
        this.promises.delete(url);
        reject(e);
      };
      img.src = url;
    });

    this.promises.set(url, promise);
    return promise;
  }
}

export const imageCache = new ImageCache();

/**
 * Pure 2D canvas layer renderer.
 * Renders normalized UV layers onto a target HTMLCanvasElement.
 */
export async function renderSectionToCanvas(
  sectionId: string,
  config: SectionConfig,
  uvTemplate: UVTemplate,
  canvas: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Clear & Render Background Color
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = config.backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Render Layers in zIndex Order
  const sortedLayers = [...config.layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    if (!layer.visible) continue;

    ctx.save();

    // Calculate layer pixel coordinates from normalized UV coordinates
    const layerX = layer.x * width;
    const layerY = layer.y * height;
    const layerW = layer.width * width;
    const layerH = layer.height * height;

    // Apply rotation around center of layer
    ctx.translate(layerX, layerY);
    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }
    if (layer.scale && layer.scale !== 1) {
      ctx.scale(layer.scale, layer.scale);
    }

    if (layer.type === 'colorFill') {
      ctx.globalAlpha = layer.opacity ?? 1;
      ctx.fillStyle = layer.fill;
      ctx.fillRect(-layerW / 2, -layerH / 2, layerW, layerH);
    } else if (layer.type === 'text') {
      renderTextLayer(ctx, layer, layerW, layerH);
    } else if (layer.type === 'image') {
      await renderImageLayer(ctx, layer, layerW, layerH);
    }

    ctx.restore();
  }
}

function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  width: number,
  height: number
) {
  ctx.fillStyle = layer.fill || '#000000';
  ctx.textAlign = layer.align || 'center';
  ctx.textBaseline = 'middle';

  const fontSize = layer.fontSize || 32;
  const fontFamily = layer.fontFamily || 'Inter, sans-serif';
  ctx.font = `bold ${fontSize}px ${fontFamily}`;

  // Draw text centered at (0, 0) relative to translated position
  ctx.fillText(layer.content || '', 0, 0);
}

async function renderImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer,
  width: number,
  height: number
) {
  if (!layer.assetUrl) return;

  try {
    const img = await imageCache.getImage(layer.assetUrl);
    ctx.globalAlpha = layer.opacity ?? 1;

    // Draw image centered at (0, 0)
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
  } catch (err) {
    console.warn(`Failed to render image layer ${layer.id}:`, err);
  }
}

/**
 * TexturePipelineManager coordinates the lifecycle of Three.js textures,
 * invalidation debouncing via requestAnimationFrame, and offscreen canvas caching.
 */
export class TexturePipelineManager {
  private sectionCanvases = new Map<string, HTMLCanvasElement>();
  private masterCanvases = new Map<string, HTMLCanvasElement>(); // 'fabric' | 'back-wall'
  private textures = new Map<string, THREE.CanvasTexture>();
  private dirtyQueue = new Set<string>();
  private rafId: number | null = null;
  private quality: QualityTier = 'medium';
  private onTextureUpdatedCallbacks: Array<(sectionId: string) => void> = [];

  constructor(quality: QualityTier = 'medium') {
    this.quality = quality;
  }

  public setQuality(quality: QualityTier) {
    if (this.quality === quality) return;
    this.quality = quality;
    // Mark all sections dirty to re-rasterize at new resolution
    this.sectionCanvases.forEach((_, secId) => this.dirtyQueue.add(secId));
    this.scheduleFlush();
  }

  public getOrCreateSectionCanvas(sectionId: string, uvTemplate: UVTemplate): HTMLCanvasElement {
    if (this.sectionCanvases.has(sectionId)) {
      return this.sectionCanvases.get(sectionId)!;
    }

    const canvas = document.createElement('canvas');
    const scale = this.quality === 'high' ? 1 : this.quality === 'medium' ? 0.75 : 0.5;
    canvas.width = Math.round(uvTemplate.width * scale);
    canvas.height = Math.round(uvTemplate.height * scale);
    this.sectionCanvases.set(sectionId, canvas);
    return canvas;
  }

  public getOrCreateMasterTexture(
    type: 'fabric' | 'back-wall',
    initialResolution: number = 2048
  ): THREE.CanvasTexture {
    if (this.textures.has(type)) {
      return this.textures.get(type)!;
    }

    const canvas = document.createElement('canvas');
    const res = QUALITY_PRESETS[this.quality].resolution;
    canvas.width = res;
    canvas.height = res;

    // Initial white base fill
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, res, res);
    }

    this.masterCanvases.set(type, canvas);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.anisotropy = QUALITY_PRESETS[this.quality].anisotropy;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    this.textures.set(type, texture);
    return texture;
  }

  public markDirty(sectionId: string) {
    this.dirtyQueue.add(sectionId);
    this.scheduleFlush();
  }

  public onTextureUpdated(cb: (sectionId: string) => void): () => void {
    this.onTextureUpdatedCallbacks.push(cb);
    return () => {
      this.onTextureUpdatedCallbacks = this.onTextureUpdatedCallbacks.filter((c) => c !== cb);
    };
  }

  private scheduleFlush() {
    if (this.rafId !== null) return;
    const requestRaf =
      typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number;

    this.rafId = requestRaf(() => {
      this.rafId = null;
      this.flushDirtyQueue();
    });
  }

  public async flushDirtyQueue() {
    if (this.dirtyQueue.size === 0) return;

    const sectionsToUpdate = Array.from(this.dirtyQueue);
    this.dirtyQueue.clear();

    const masterFabricCanvas = this.masterCanvases.get('fabric');
    const masterWallCanvas = this.masterCanvases.get('back-wall');
    const fabricCtx = masterFabricCanvas?.getContext('2d');
    const wallCtx = masterWallCanvas?.getContext('2d');

    for (const sectionId of sectionsToUpdate) {
      let sectionCanvas = this.sectionCanvases.get(sectionId);
      if (!sectionCanvas) {
        sectionCanvas = this.getOrCreateSectionCanvas(sectionId, {
          width: 1024,
          height: 768,
          aspectRatio: 1.333,
          safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
          bleed: { top: 0, right: 0, bottom: 0, left: 0 },
        });
      }

      if (sectionId === 'back-wall' && masterWallCanvas && wallCtx) {
        // Direct blit to wall texture
        wallCtx.clearRect(0, 0, masterWallCanvas.width, masterWallCanvas.height);
        wallCtx.drawImage(sectionCanvas, 0, 0, masterWallCanvas.width, masterWallCanvas.height);
        const wallTex = this.textures.get('back-wall');
        if (wallTex) wallTex.needsUpdate = true;
      } else if (masterFabricCanvas && fabricCtx) {
        // Composite onto fabric atlas
        const quad = CANOPY_ATLAS_LAYOUT[sectionId] || { x: 0, y: 0, w: 1, h: 1 };
        const destX = quad.x * masterFabricCanvas.width;
        const destY = quad.y * masterFabricCanvas.height;
        const destW = quad.w * masterFabricCanvas.width;
        const destH = quad.h * masterFabricCanvas.height;

        fabricCtx.drawImage(sectionCanvas, destX, destY, destW, destH);
        const fabricTex = this.textures.get('fabric');
        if (fabricTex) fabricTex.needsUpdate = true;
      }

      this.onTextureUpdatedCallbacks.forEach((cb) => cb(sectionId));
    }
  }

  public dispose() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.textures.forEach((tex) => tex.dispose());
    this.textures.clear();
    this.sectionCanvases.clear();
    this.masterCanvases.clear();
    this.dirtyQueue.clear();
  }
}

export const texturePipelineManager = new TexturePipelineManager();
