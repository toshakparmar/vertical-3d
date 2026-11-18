import React, { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../core/store';
import { getProductDefinition } from '../products';
import { texturePipelineManager } from '../sync/texture.pipeline';

export const CanopyModel: React.FC = () => {
  const variantId = useStore((s) => s.config.variantId);
  const productId = useStore((s) => s.config.productId);
  const frameGrade = useStore((s) => s.config.selections.frameGrade);
  const setSelectedSection = useStore((s) => s.setSelectedSection);
  const setHoveredSection = useStore((s) => s.setHoveredSection);

  // 1. Resolve model file path from Product Definition
  const product = getProductDefinition(productId);
  const variant = product.baseVariants.find((v) => v.id === variantId) || product.baseVariants[0];
  const modelUrl = variant.modelPath;

  // 2. Load GLB via useGLTF
  const { scene } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Master canvas texture for fabric
  const fabricTexture = useMemo(() => {
    return texturePipelineManager.getOrCreateMasterTexture('fabric', 2048);
  }, []);

  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const frameMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Setup materials and assign synchronized textures
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => configureMaterial(mat));
        } else if (mesh.material) {
          configureMaterial(mesh.material);
        }
      }
    });

    function configureMaterial(mat: THREE.Material) {
      if (mat.name === 'fabric_Mat') {
        const stdMat = mat as THREE.MeshStandardMaterial;
        stdMat.map = fabricTexture;
        stdMat.roughness = 0.85;
        stdMat.metalness = 0.05;
        stdMat.needsUpdate = true;
        fabricMaterialRef.current = stdMat;
      } else if (mat.name === 'Metal_mat') {
        const stdMat = mat as THREE.MeshStandardMaterial;
        frameMaterialRef.current = stdMat;
        updateFrameAppearance(stdMat, frameGrade);
      }
    }

    return () => {
      // Clean up geometries and materials on unmount
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
        }
      });
    };
  }, [clonedScene, fabricTexture, frameGrade]);

  // Update hardware frame finish based on frame grade selection
  function updateFrameAppearance(mat: THREE.MeshStandardMaterial, grade: string) {
    if (grade === 'steel-32mm') {
      mat.color.set('#64748b'); // Industrial slate steel
      mat.roughness = 0.4;
      mat.metalness = 0.8;
    } else if (grade === 'aluminum-50mm') {
      mat.color.set('#f1f5f9'); // Heavy anodized bright aluminum
      mat.roughness = 0.2;
      mat.metalness = 0.95;
    } else {
      // Commercial 40mm hex aluminum
      mat.color.set('#cbd5e1');
      mat.roughness = 0.3;
      mat.metalness = 0.88;
    }
    mat.needsUpdate = true;
  }

  // 3. Raycast Disambiguation: Map 3D hit point & normal to section ID
  const resolveSectionFromIntersection = (event: ThreeEvent<MouseEvent>): string | null => {
    if (!event.point) return null;
    const { point, normal } = event;

    // Check if clicked frame/legs
    const objectName = event.object.name.toLowerCase();
    if (objectName.includes('leg') || objectName.includes('mechanism')) {
      return 'frame-legs';
    }

    // Y height determines whether it's the Valance (lower perimeter) or Canopy Peak (roof)
    // Valance vertical range roughly [1.2 .. 1.45], Peak is above 1.45
    const isValance = point.y < 1.45;

    // Use normal or horizontal displacement to determine face
    const nx = normal ? normal.x : point.x;
    const nz = normal ? normal.z : point.z;

    if (Math.abs(nz) > Math.abs(nx)) {
      if (nz > 0) return isValance ? 'valance-front' : 'canopy-front';
      return isValance ? 'valance-back' : 'canopy-back';
    } else {
      if (nx > 0) return isValance ? 'valance-right' : 'canopy-right';
      return isValance ? 'valance-left' : 'canopy-left';
    }
  };

  const handlePointerDown = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const sectionId = resolveSectionFromIntersection(e);
    if (sectionId) {
      setSelectedSection(sectionId, '3d');
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const sectionId = resolveSectionFromIntersection(e as unknown as ThreeEvent<MouseEvent>);
    if (sectionId) {
      setHoveredSection(sectionId, '3d');
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHoveredSection(null, '3d');
    document.body.style.cursor = 'default';
  };

  return (
    <primitive
      object={clonedScene}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  );
};
