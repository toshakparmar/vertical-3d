import React, { useEffect, useState } from 'react';
import { useStore, QualityTier } from './core/store';
import { EditorContainer } from './editor2d/EditorContainer';
import { SceneViewer } from './viewer3d/SceneViewer';
import { OptionsPanel } from './ui/OptionsPanel';
import { CartDrawer } from './ui/CartDrawer';
import { iframeBridge } from './integrations/postmessage';
import { decodeConfigFromUrl } from './core/serialization';
import {
  Sparkles,
  ShoppingBag,
  Eye,
  SlidersHorizontal,
  PenTool,
  Settings,
} from 'lucide-react';

export const App: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const qualityTier = useStore((s) => s.qualityTier);
  const setQualityTier = useStore((s) => s.setQualityTier);
  const loadConfiguration = useStore((s) => s.loadConfiguration);
  const setIsCartOpen = useStore((s) => s.setIsCartOpen);

  const [isEmbedded, setIsEmbedded] = useState(false);

  // 1. Detect ?embed=1 and initialize iframe protocol
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1' || window.self !== window.top) {
      setIsEmbedded(true);
    }

    // Initialize postMessage bridge for parent iframe host
    const cleanup = iframeBridge.init({
      onSetVariant: (varId) => useStore.getState().setVariantId(varId),
      onLoadConfig: (state) => useStore.getState().loadConfiguration(state),
    });

    // 2. Check for URL hash configuration share link
    const hash = window.location.hash;
    if (hash.startsWith('#config=')) {
      const encoded = hash.replace('#config=', '');
      const sharedConfig = decodeConfigFromUrl(encoded);
      if (sharedConfig) {
        console.log('Restored configuration from URL hash');
        loadConfiguration(sharedConfig);
      }
    }

    return cleanup;
  }, [loadConfiguration]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar (Hidden in ?embed=1 mode to maximize canvas space) */}
      {!isEmbedded && (
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                <span>MVP Visuals — 3D Canopy Configurator</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                  v1.0.0
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Texture Resolution / Quality Tier Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 hidden sm:inline">Texture Tier:</span>
              <select
                value={qualityTier}
                onChange={(e) => setQualityTier(e.target.value as QualityTier)}
                className="bg-transparent border-0 text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="high" className="bg-slate-900">
                  High (2048px)
                </option>
                <option value="medium" className="bg-slate-900">
                  Balanced (1024px)
                </option>
                <option value="low" className="bg-slate-900">
                  Performance (512px)
                </option>
              </select>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Cart</span>
            </button>
          </div>
        </header>
      )}

      {/* Mobile Navigation Tabs (visible only on screens < 1024px) */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-1 z-10 shrink-0">
        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'design' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>2D Design</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>3D Preview</span>
        </button>
        <button
          onClick={() => setActiveTab('options')}
          className={`flex items-center space-x-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'options' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Specifications</span>
        </button>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Desktop Split Layout (>= 1024px) */}
        <div className="hidden lg:grid grid-cols-12 w-full h-full">
          {/* Left Column: 2D Canvas Editor (4 Cols) */}
          <div className="col-span-4 h-full overflow-hidden">
            <EditorContainer />
          </div>

          {/* Center Column: 3D Interactive Three.js Viewport (5 Cols) */}
          <div className="col-span-5 h-full overflow-hidden">
            <SceneViewer />
          </div>

          {/* Right Column: Specifications & Dynamic Pricing Panel (3 Cols) */}
          <div className="col-span-3 h-full overflow-hidden">
            <OptionsPanel />
          </div>
        </div>

        {/* Mobile Tab-Based View (< 1024px) */}
        <div className="lg:hidden w-full h-full">
          {activeTab === 'design' && <EditorContainer />}
          {activeTab === 'preview' && <SceneViewer />}
          {activeTab === 'options' && <OptionsPanel />}
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
};
