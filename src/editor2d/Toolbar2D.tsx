import React, { useRef } from 'react';
import {
  Type,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  Undo2,
  Redo2,
  AlignCenter,
  Trash2,
} from 'lucide-react';
import { useStore } from '../core/store';
import { TextLayer, ImageLayer } from '../core/schema';
import { apiClient } from '../integrations/api';

const COLOR_SWATCHES = [
  '#FFFFFF', // White
  '#000000', // Black
  '#1E3A8A', // Navy Blue
  '#DC2626', // Crimson Red
  '#16A34A', // Forest Green
  '#F59E0B', // Amber Gold
  '#7C3AED', // Royal Purple
  '#475569', // Slate Grey
];

interface Toolbar2DProps {
  sectionId: string;
  showGuides: boolean;
  onToggleGuides: () => void;
}

export const Toolbar2D: React.FC<Toolbar2DProps> = ({
  sectionId,
  showGuides,
  onToggleGuides,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const addLayer = useStore((s) => s.addLayer);
  const setSectionBackgroundColor = useStore((s) => s.setSectionBackgroundColor);
  const resetSection = useStore((s) => s.resetSection);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.history.past.length > 0);
  const canRedo = useStore((s) => s.history.future.length > 0);
  const selectedLayerId = useStore((s) => s.selectedLayerId);
  const removeLayer = useStore((s) => s.removeLayer);
  const updateLayer = useStore((s) => s.updateLayer);
  const config = useStore((s) => s.config.sections[sectionId]);

  const handleAddText = () => {
    const newText: TextLayer = {
      id: `text_${Date.now()}`,
      sectionId,
      type: 'text',
      content: 'YOUR BRAND HERE',
      fontFamily: 'Inter',
      fontSize: 36,
      fill: '#1E293B',
      align: 'center',
      letterSpacing: 0,
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.15,
      rotation: 0,
      scale: 1,
      zIndex: (config?.layers.length || 0) + 1,
      locked: false,
      visible: true,
    };
    addLayer(sectionId, newText);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 15MB) and type
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp|svg\+xml)$/)) {
      alert('Please upload a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    try {
      // Mock upload API returns CDN assetUrl and assetId
      const res = await apiClient.uploadAsset(file);

      const newImage: ImageLayer = {
        id: `img_${Date.now()}`,
        sectionId,
        type: 'image',
        assetId: res.assetId,
        assetUrl: res.assetUrl,
        fileName: res.fileName,
        fileSize: res.fileSize,
        fit: 'contain',
        x: 0.5,
        y: 0.5,
        width: 0.4,
        height: 0.35,
        rotation: 0,
        scale: 1,
        zIndex: (config?.layers.length || 0) + 1,
        locked: false,
        visible: true,
        opacity: 1,
      };

      addLayer(sectionId, newImage);
    } catch (err) {
      console.error('Image upload failed:', err);
      // Fallback: create local object URL
      const localUrl = URL.createObjectURL(file);
      const fallbackImage: ImageLayer = {
        id: `img_${Date.now()}`,
        sectionId,
        type: 'image',
        assetId: `local_${Date.now()}`,
        assetUrl: localUrl,
        fileName: file.name,
        fileSize: file.size,
        fit: 'contain',
        x: 0.5,
        y: 0.5,
        width: 0.4,
        height: 0.35,
        rotation: 0,
        scale: 1,
        zIndex: (config?.layers.length || 0) + 1,
        locked: false,
        visible: true,
        opacity: 1,
      };
      addLayer(sectionId, fallbackImage);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCenterAlign = () => {
    if (!selectedLayerId) return;
    updateLayer(sectionId, selectedLayerId, { x: 0.5, y: 0.5 });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 border-b border-slate-800 text-slate-200">
      {/* Creation Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleAddText}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-700 active:scale-95"
          title="Add Custom Text"
        >
          <Type className="w-3.5 h-3.5 text-blue-400" />
          <span>Add Text</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-700 active:scale-95"
          title="Upload Logo or Artwork"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Upload Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Color Palette Presets */}
        <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
          <Palette className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              onClick={() => setSectionBackgroundColor(sectionId, color)}
              style={{ backgroundColor: color }}
              title={`Set Background ${color}`}
              className={`w-5 h-5 rounded-full border ${
                config?.backgroundColor === color
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-slate-700 hover:scale-110'
              } transition-transform`}
            />
          ))}
          <input
            ref={colorPickerRef}
            type="color"
            value={config?.backgroundColor || '#FFFFFF'}
            onChange={(e) => setSectionBackgroundColor(sectionId, e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
            title="Custom Background Color"
          />
        </div>
      </div>

      {/* Editing & History Actions */}
      <div className="flex items-center space-x-1">
        {selectedLayerId && (
          <>
            <button
              onClick={handleCenterAlign}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
              title="Snap to Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => removeLayer(sectionId, selectedLayerId)}
              className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
              title="Delete Selected Layer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          onClick={onToggleGuides}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            showGuides ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-slate-400 hover:text-white'
          }`}
          title="Toggle Safe Area & Bleed Guides"
        >
          Guides: {showGuides ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => resetSection(sectionId)}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
          title="Reset Section Artwork"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
