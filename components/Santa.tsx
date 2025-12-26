import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface SantaProps {
  position?: [number, number, number];
}

const Santa: React.FC<SantaProps> = ({ position = [5, 2, -5] }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef} position={position}>
        {/* Body - Red suit */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#fdbcb4" />
        </mesh>
        
        {/* Hat */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        
        {/* Beard */}
        <mesh position={[0, 0.15, 0.1]}>
          <coneGeometry args={[0.15, 0.2, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        {/* Arms */}
        <mesh position={[-0.3, -0.2, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.3]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0.3, -0.2, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.3]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        
        {/* Legs */}
        <mesh position={[-0.15, -0.7, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0.15, -0.7, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        
        {/* Belt */}
        <mesh position={[0, -0.3, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.4, 0.05, 8, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.08, 0.35, 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.08, 0.35, 0.2]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Glow effect */}
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#dc2626" distance={2} decay={2} />
      </group>
    </Float>
  );
};

export default Santa;

