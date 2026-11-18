import React, { useRef } from 'react';
import { Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { ImageLayer } from '../core/schema';

interface ImageLayerNodeProps {
  layer: ImageLayer;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<ImageLayer>) => void;
}

export const ImageLayerNode: React.FC<ImageLayerNodeProps> = ({
  layer,
  canvasWidth,
  canvasHeight,
  onSelect,
  onChange,
}) => {
  const shapeRef = useRef<Konva.Image>(null);
  const [image] = useImage(layer.assetUrl, 'anonymous');

  const x = layer.x * canvasWidth;
  const y = layer.y * canvasHeight;
  const width = layer.width * canvasWidth;
  const height = layer.height * canvasHeight;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const newNormX = Math.max(0, Math.min(1, node.x() / canvasWidth));
    const newNormY = Math.max(0, Math.min(1, node.y() / canvasHeight));

    onChange({
      x: Number(newNormX.toFixed(4)),
      y: Number(newNormY.toFixed(4)),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newNormW = Math.max(0.05, Math.min(1, (node.width() * scaleX) / canvasWidth));
    const newNormH = Math.max(0.05, Math.min(1, (node.height() * scaleY) / canvasHeight));
    const newNormX = Math.max(0, Math.min(1, node.x() / canvasWidth));
    const newNormY = Math.max(0, Math.min(1, node.y() / canvasHeight));

    onChange({
      x: Number(newNormX.toFixed(4)),
      y: Number(newNormY.toFixed(4)),
      width: Number(newNormW.toFixed(4)),
      height: Number(newNormH.toFixed(4)),
      rotation: Math.round(node.rotation()),
    });
  };

  if (!layer.visible) return null;

  return (
    <KonvaImage
      ref={shapeRef}
      id={layer.id}
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={layer.rotation}
      offsetX={width / 2}
      offsetY={height / 2}
      opacity={layer.opacity ?? 1}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
};
