import React from 'react';
import { useStore } from '../core/store';
import { TextLayer, ImageLayer } from '../core/schema';
import { AlignLeft, AlignCenter, AlignRight, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

const FONT_FAMILIES = [
  'Inter',
  'Montserrat',
  'Oswald',
  'Roboto',
  'Playfair Display',
  'Arial',
];

interface LayerPropertiesPanelProps {
  sectionId: string;
}

export const LayerPropertiesPanel: React.FC<LayerPropertiesPanelProps> = ({ sectionId }) => {
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const updateLayer = useStore((s) => s.updateLayer);
  const config = useStore((s) => s.config.sections[sectionId]);

  if (!selectedLayerId || !config) return null;

  const layer = config.layers.find((l) => l.id === selectedLayerId);
  if (!layer) return null;

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-3 text-slate-200 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Type-Specific Properties */}
        {layer.type === 'text' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Content Input */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Text:</span>
              <input
                type="text"
                value={(layer as TextLayer).content}
                onChange={(e) => updateLayer(sectionId, layer.id, { content: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-44"
              />
            </div>

            {/* Font Family */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Font:</span>
              <select
                value={(layer as TextLayer).fontFamily}
                onChange={(e) => updateLayer(sectionId, layer.id, { fontFamily: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Size:</span>
              <input
                type="number"
                min={12}
                max={120}
                value={(layer as TextLayer).fontSize}
                onChange={(e) =>
                  updateLayer(sectionId, layer.id, { fontSize: Number(e.target.value) })
                }
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white w-16"
              />
            </div>

            {/* Color */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Color:</span>
              <input
                type="color"
                value={(layer as TextLayer).fill}
                onChange={(e) => updateLayer(sectionId, layer.id, { fill: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
              />
            </div>

            {/* Alignment */}
            <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                onClick={() => updateLayer(sectionId, layer.id, { align: 'left' })}
                className={`p-1 rounded ${(layer as TextLayer).align === 'left' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateLayer(sectionId, layer.id, { align: 'center' })}
                className={`p-1 rounded ${(layer as TextLayer).align === 'center' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateLayer(sectionId, layer.id, { align: 'right' })}
                className={`p-1 rounded ${(layer as TextLayer).align === 'right' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {layer.type === 'image' && (
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Image Fit:</span>
            <select
              value={(layer as ImageLayer).fit}
              onChange={(e) =>
                updateLayer(sectionId, layer.id, { fit: e.target.value as 'contain' | 'cover' | 'fill' })
              }
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
            </select>

            <span className="text-slate-400">Opacity:</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={(layer as ImageLayer).opacity ?? 1}
              onChange={(e) =>
                updateLayer(sectionId, layer.id, { opacity: parseFloat(e.target.value) })
              }
              className="w-20 accent-blue-500"
            />
          </div>
        )}

        {/* Global Transform & State Attributes */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
          <div className="flex items-center space-x-1">
            <span className="text-slate-500">Rot:</span>
            <input
              type="number"
              min={-360}
              max={360}
              value={layer.rotation}
              onChange={(e) => updateLayer(sectionId, layer.id, { rotation: Number(e.target.value) })}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white w-14"
            />
            <span className="text-slate-500">°</span>
          </div>

          <button
            onClick={() => updateLayer(sectionId, layer.id, { locked: !layer.locked })}
            className={`p-1.5 rounded ${layer.locked ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white'}`}
            title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
          >
            {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => updateLayer(sectionId, layer.id, { visible: !layer.visible })}
            className={`p-1.5 rounded ${!layer.visible ? 'text-red-400' : 'text-slate-400 hover:text-white'}`}
            title={layer.visible ? 'Hide Layer' : 'Show Layer'}
          >
            {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

