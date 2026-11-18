import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { useStore } from '../core/store';
import { getProductDefinition } from '../products';

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const selectedSectionId = useStore((s) => s.selectedSectionId);
  const productId = useStore((s) => s.config.productId);

  // Target camera state for smooth lerping
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 2.0, 4.2));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.4, 0));
  const isTransitioning = useRef<boolean>(false);

  useEffect(() => {
    const product = getProductDefinition(productId);
    const section = product.sections.find((s) => s.id === selectedSectionId);

    if (section && section.camera) {
      const [px, py, pz] = section.camera.position;
      const [tx, ty, tz] = section.camera.target;
      targetPos.current.set(px, py, pz);
      targetLookAt.current.set(tx, ty, tz);
      isTransitioning.current = true;
    }
  }, [selectedSectionId, productId]);

  useFrame((_, delta) => {
    if (!isTransitioning.current) return;

    // Damped exponential lerp (60fps smooth tween)
    const factor = Math.min(1, delta * 4.5);
    camera.position.lerp(targetPos.current, factor);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, factor);
      controlsRef.current.update();
    }

    // Check if arrived within threshold
    if (camera.position.distanceTo(targetPos.current) < 0.02) {
      camera.position.copy(targetPos.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookAt.current);
      }
      isTransitioning.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={1.8}
      maxDistance={8.5}
      maxPolarAngle={Math.PI / 2 + 0.05} // don't go too far below ground
      target={[0, 1.4, 0]}
    />
  );
};
