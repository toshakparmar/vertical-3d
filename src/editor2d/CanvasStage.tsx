import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Line } from 'react-konva';
import Konva from 'konva';
import { UVTemplate, SectionConfig } from '../core/schema';
import { TextLayerNode } from './TextLayerNode';
import { ImageLayerNode } from './ImageLayerNode';
import { useStore } from '../core/store';
import { texturePipelineManager, renderSectionToCanvas } from '../sync/texture.pipeline';

interface CanvasStageProps {
  sectionId: string;
  config: SectionConfig;
  uvTemplate: UVTemplate;
  showGuides: boolean;
  scale?: number;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  sectionId,
  config,
  uvTemplate,
  showGuides,
  scale = 1,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const setSelectedLayer = useStore((s) => s.setSelectedLayer);
  const updateLayer = useStore((s) => s.updateLayer);

  const canvasWidth = uvTemplate.width;
  const canvasHeight = uvTemplate.height;

  // Sync Konva Transformer to selected layer node
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    if (selectedLayerId) {
      const selectedNode = stageRef.current.findOne(`#${selectedLayerId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedLayerId, config.layers]);

  // Sync to 3D offscreen canvas whenever config changes
  useEffect(() => {
    const offscreenCanvas = texturePipelineManager.getOrCreateSectionCanvas(
      sectionId,
      uvTemplate
    );
    renderSectionToCanvas(sectionId, config, uvTemplate, offscreenCanvas).then(() => {
      texturePipelineManager.markDirty(sectionId);
    });
  }, [sectionId, config, uvTemplate]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === 'background-rect') {
      setSelectedLayer(null);
    }
  };

  const safe = uvTemplate.safeArea;
  const bleed = uvTemplate.bleed;

  return (
    <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
      <Stage
        ref={stageRef}
        width={canvasWidth * scale}
        height={canvasHeight * scale}
        scaleX={scale}
        scaleY={scale}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {/* Base Background Color */}
          <Rect
            name="background-rect"
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill={config.backgroundColor || '#FFFFFF'}
          />

          {/* Render All Layers */}
          {config.layers.map((layer) => {
            const isSelected = layer.id === selectedLayerId;

            if (layer.type === 'text') {
              return (
                <TextLayerNode
                  key={layer.id}
                  layer={layer}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  isSelected={isSelected}
                  onSelect={() => setSelectedLayer(layer.id)}
                  onChange={(updates) => updateLayer(sectionId, layer.id, updates)}
                />
              );
            } else if (layer.type === 'image') {
              return (
                <ImageLayerNode
                  key={layer.id}
                  layer={layer}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  isSelected={isSelected}
                  onSelect={() => setSelectedLayer(layer.id)}
                  onChange={(updates) => updateLayer(sectionId, layer.id, updates)}
                />
              );
            }
            return null;
          })}

          {/* Guides: Safe Area & Bleed Lines (when enabled) */}
          {showGuides && (
            <>
              {/* Bleed Margin (Red dashed) */}
              <Rect
                x={bleed.left}
                y={bleed.top}
                width={canvasWidth - bleed.left - bleed.right}
                height={canvasHeight - bleed.top - bleed.bottom}
                stroke="#ef4444"
                strokeWidth={1.5}
                dash={[6, 4]}
                listening={false}
              />
              {/* Safe Margin (Emerald dashed) */}
              <Rect
                x={safe.left}
                y={safe.top}
                width={canvasWidth - safe.left - safe.right}
                height={canvasHeight - safe.top - safe.bottom}
                stroke="#10b981"
                strokeWidth={1.5}
                dash={[8, 5]}
                listening={false}
              />
              {/* Center Snapping Guidelines */}
              <Line
                points={[canvasWidth / 2, 0, canvasWidth / 2, canvasHeight]}
                stroke="#3b82f6"
                strokeWidth={0.8}
                dash={[4, 4]}
                opacity={0.4}
                listening={false}
              />
              <Line
                points={[0, canvasHeight / 2, canvasWidth, canvasHeight / 2]}
                stroke="#3b82f6"
                strokeWidth={0.8}
                dash={[4, 4]}
                opacity={0.4}
                listening={false}
              />
            </>
          )}

          {/* Interactive Transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            keepRatio={false}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'middle-left',
              'middle-right',
              'top-center',
              'bottom-center',
            ]}
            anchorStroke="#3b82f6"
            anchorFill="#ffffff"
            anchorSize={9}
            borderStroke="#3b82f6"
            borderDash={[4, 3]}
          />
        </Layer>
      </Stage>
    </div>
  );
};
