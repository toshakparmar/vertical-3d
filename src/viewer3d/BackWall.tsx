import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../core/store';
import { texturePipelineManager } from '../sync/texture.pipeline';

export const BackWall: React.FC = () => {
  const backWallSelection = useStore((s) => s.config.selections.backWall);
  const selectedSectionId = useStore((s) => s.selectedSectionId);
  const setSelectedSection = useStore((s) => s.setSelectedSection);
  const setHoveredSection = useStore((s) => s.setHoveredSection);

  const isVisible = backWallSelection && backWallSelection !== 'none';
  const isSelected = selectedSectionId === 'back-wall';

  // Get master back-wall canvas texture from pipeline
  const texture = useMemo(() => {
    return texturePipelineManager.getOrCreateMasterTexture('back-wall', 1024);
  }, []);

  if (!isVisible) return null;

  return (
    <group position={[0, 0.95, -1.21]}>
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSection('back-wall', '3d');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredSection('back-wall', '3d');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHoveredSection(null, '3d');
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={[2.42, 1.88]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.7}
          metalness={0.05}
          side={THREE.DoubleSide}
          emissive={isSelected ? new THREE.Color('#3b82f6') : new THREE.Color('#000000')}
          emissiveIntensity={isSelected ? 0.15 : 0}
        />
      </mesh>
    </group>
  );
};

