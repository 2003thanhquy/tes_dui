import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowGlobeProps {
  children: React.ReactNode;
  position?: [number, number, number];
}

const SnowGlobe: React.FC<SnowGlobeProps> = ({ children, position = [0, 0, 0] }) => {
  const glassRef = useRef<THREE.Mesh>(null);
  const baseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glassRef.current) {
      // Gentle rotation
      glassRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Glass sphere - Outer - More transparent to see content */}
      <mesh ref={glassRef} position={[0, 0, 0]}>
        <sphereGeometry args={[6, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          roughness={0.1}
          metalness={0.1}
          transmission={0.95}
          thickness={0.3}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Glass sphere - Inner (for double layer effect) - Even more transparent */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[5.9, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.02}
          roughness={0.05}
          metalness={0.05}
          transmission={0.98}
          thickness={0.2}
          ior={1.5}
        />
      </mesh>

      {/* Base/Stand */}
      <mesh ref={baseRef} position={[0, -6.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.5, 3, 0.5, 32]} />
        <meshStandardMaterial color="#8b4513" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wooden base detail */}
      <mesh position={[0, -6.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3.2, 3.5, 0.3, 32]} />
        <meshStandardMaterial color="#654321" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Content inside globe */}
      <group position={[0, -1, 0]}>
        {children}
      </group>

      {/* Snow on base */}
      <mesh position={[0, -5.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.4, 2.4, 0.1, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
    </group>
  );
};

export default SnowGlobe;

