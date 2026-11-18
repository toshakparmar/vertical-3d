import React from 'react';
import { ContactShadows } from '@react-three/drei';

export const StudioEnvironment: React.FC = () => {
  return (
    <>
      {/* Neutral Studio Key & Fill Lighting */}
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[5, 8, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-6, 5, -5]} intensity={0.5} />
      <directionalLight position={[0, -2, 5]} intensity={0.2} />

      {/* Realistic Soft Contact Shadow on Ground */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.65}
        scale={10}
        blur={1.8}
        far={3.5}
        resolution={1024}
        color="#1e293b"
      />
    </>
  );
};
