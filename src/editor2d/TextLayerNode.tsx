import React from 'react';
import { Text } from 'react-konva';
import Konva from 'konva';
import { TextLayer } from '../core/schema';

interface TextLayerNodeProps {
  layer: TextLayer;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<TextLayer>) => void;
}

export const TextLayerNode: React.FC<TextLayerNodeProps> = ({
  layer,
  canvasWidth,
  canvasHeight,
  onSelect,
  onChange,
}) => {
  const shapeRef = React.useRef<Konva.Text>(null);

  const x = layer.x * canvasWidth;
  const y = layer.y * canvasHeight;
  const width = layer.width * canvasWidth;

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
    <Text
      ref={shapeRef}
      id={layer.id}
      text={layer.content}
      x={x}
      y={y}
      width={width}
      fontSize={layer.fontSize}
      fontFamily={layer.fontFamily}
      fill={layer.fill}
      align={layer.align}
      rotation={layer.rotation}
      offsetX={width / 2}
      offsetY={layer.fontSize / 2}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );
};
