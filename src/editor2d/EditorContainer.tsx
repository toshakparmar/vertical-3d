import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../core/store';
import { getProductDefinition } from '../products';
import { CanvasStage } from './CanvasStage';
import { Toolbar2D } from './Toolbar2D';
import { LayerPropertiesPanel } from './LayerPropertiesPanel';
import { ZoomIn, ZoomOut } from 'lucide-react';

export const EditorContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedSectionId = useStore((s) => s.selectedSectionId);
  const setSelectedSection = useStore((s) => s.setSelectedSection);
  const productId = useStore((s) => s.config.productId);
  const config = useStore((s) => s.config);

  const [showGuides, setShowGuides] = useState(true);
  const [scale, setScale] = useState(0.48);

  const product = getProductDefinition(productId);
  const activeSection =
    product.sections.find((s) => s.id === selectedSectionId) || product.sections[0];
  const sectionConfig = config.sections[activeSection.id] || {
    backgroundColor: '#FFFFFF',
    layers: [],
  };

  // Auto-fit canvas scale to viewport container
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const targetW = activeSection.uvTemplate.width;
      const targetH = activeSection.uvTemplate.height;

      // Reserve padding
      const maxW = clientWidth - 48;
      const maxH = clientHeight - 48;

      const scaleW = maxW / targetW;
      const scaleH = maxH / targetH;
      const fittedScale = Math.min(scaleW, scaleH, 0.75);
      setScale(Math.max(0.2, fittedScale));
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [activeSection]);

  // Group sections by category (Peaks, Valances, Walls)
  const canopySections = product.sections.filter((s) => s.group === 'canopy');
  const valanceSections = product.sections.filter((s) => s.group === 'valance');
  const wallSections = product.sections.filter((s) => s.group === 'walls');

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 select-none">
      {/* 1. Section Navigation Stepper / Tabs */}
      <div className="flex items-center space-x-1 p-2 bg-slate-900 border-b border-slate-800 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Canopy:
        </span>
        {canopySections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setSelectedSection(sec.id, '2d')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
              selectedSectionId === sec.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {sec.label.replace(' (Roof)', '')}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
          Valance:
        </span>
        {valanceSections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setSelectedSection(sec.id, '2d')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
              selectedSectionId === sec.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {sec.label.replace(' (Skirt)', '')}
          </button>
        ))}

        {wallSections.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            {wallSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id, '2d')}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                  selectedSectionId === sec.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* 2. 2D Editing Toolbar */}
      <Toolbar2D
        sectionId={activeSection.id}
        showGuides={showGuides}
        onToggleGuides={() => setShowGuides(!showGuides)}
      />

      {/* 3. Main Stage Viewport with Auto-Centering */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center p-4 overflow-hidden bg-slate-950/70"
      >
        <CanvasStage
          sectionId={activeSection.id}
          config={sectionConfig}
          uvTemplate={activeSection.uvTemplate}
          showGuides={showGuides}
          scale={scale}
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-lg border border-slate-800 text-slate-300">
          <button
            onClick={() => setScale((s) => Math.max(0.15, s - 0.05))}
            className="p-1 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(1.2, s + 0.05))}
            className="p-1 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Active Layer Properties Panel */}
      <LayerPropertiesPanel sectionId={activeSection.id} />
    </div>
  );
};
