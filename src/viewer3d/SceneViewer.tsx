import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress, Html } from '@react-three/drei';
import { CameraController } from './CameraController';
import { StudioEnvironment } from './StudioEnvironment';
import { CanopyModel } from './CanopyModel';
import { BackWall } from './BackWall';
import { useStore } from '../core/store';
import { getProductDefinition } from '../products';
import {
  Camera,
  Maximize2,
  Minimize2,
  Eye,
} from 'lucide-react';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-2xl text-white min-w-[220px]">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wide text-slate-200">
          Loading 3D Tent...
        </span>
        <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden mt-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 mt-2 font-mono">
          {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4">
            <Eye className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-2">3D Graphics Unavailable</h3>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            Hardware acceleration or WebGL could not be initialized. You can still customize
            artwork and review quotes using the 2D canvas editor.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold"
          >
            Retry 3D Viewer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const SceneViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const selectedSectionId = useStore((s) => s.selectedSectionId);
  const hoveredSectionId = useStore((s) => s.hoveredSectionId);
  const setSelectedSection = useStore((s) => s.setSelectedSection);
  const productId = useStore((s) => s.config.productId);
  const setPreviewScreenshot = useStore((s) => s.setPreviewScreenshot);

  const product = getProductDefinition(productId);
  const activeSection = product.sections.find((s) => s.id === selectedSectionId);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const captureScreenshots = () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewScreenshot('perspective', dataUrl);
      console.log('Captured 3D perspective screenshot');
    } catch (err) {
      console.warn('Screenshot capture failed:', err);
    }
  };

  return (
    <WebGLErrorBoundary>
      <div
        ref={containerRef}
        className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 overflow-hidden select-none flex flex-col"
      >
        {/* Floating Top Badge with Current Section and Hover Indicator */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-200">
              {activeSection?.label || 'Custom Canopy'}
            </span>
            {hoveredSectionId && hoveredSectionId !== selectedSectionId && (
              <span className="text-xs text-blue-400 border-l border-slate-700 pl-2">
                Hover: {product.sections.find((s) => s.id === hoveredSectionId)?.label}
              </span>
            )}
          </div>
        </div>

        {/* Floating Top-Right View Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <button
            onClick={captureScreenshots}
            title="Capture Screenshot"
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/60 backdrop-blur shadow-md transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/60 backdrop-blur shadow-md transition-all active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Floating Bottom Quick Camera Angles */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-xl">
          {[
            { id: 'canopy-front', label: 'Front' },
            { id: 'canopy-right', label: 'Right' },
            { id: 'canopy-back', label: 'Back' },
            { id: 'canopy-left', label: 'Left' },
            { id: 'back-wall', label: 'Wall' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedSection(item.id, '3d')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                selectedSectionId === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Three.js Canvas */}
        <Canvas
          shadows
          camera={{ position: [0, 2.2, 4.4], fov: 42 }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
          }}
          dpr={[1, 2]}
          className="w-full h-full"
        >
          <Suspense fallback={<Loader />}>
            <StudioEnvironment />
            <CanopyModel />
            <BackWall />
            <CameraController />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
