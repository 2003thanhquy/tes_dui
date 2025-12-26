import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface ReindeerProps {
  position?: [number, number, number];
  radius?: number;
  speed?: number;
}

const Reindeer: React.FC<ReindeerProps> = ({ 
  position = [0, 0, 0], 
  radius = 8, 
  speed = 0.3 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      angleRef.current += delta * speed;
      
      // Circular motion
      const x = Math.cos(angleRef.current) * radius;
      const z = Math.sin(angleRef.current) * radius;
      const y = 3 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      
      groupRef.current.position.set(
        position[0] + x,
        position[1] + y,
        position[2] + z
      );
      
      // Face direction of movement
      groupRef.current.rotation.y = angleRef.current + Math.PI / 2;
      
      // Gentle bobbing
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Body */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.6]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 0.1, 0.35]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        
        {/* Antlers */}
        <mesh position={[-0.1, 0.3, 0.35]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.02, 0.15, 4]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        <mesh position={[0.1, 0.3, 0.35]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.02, 0.15, 4]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
        
        {/* Legs */}
        {[-0.15, 0.15].map((x, i) => (
          <React.Fragment key={i}>
            <mesh position={[x, -0.5, -0.2]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.3]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[x, -0.5, 0.2]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.3]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          </React.Fragment>
        ))}
        
        {/* Tail */}
        <mesh position={[0, -0.1, -0.35]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        
        {/* Nose - Red */}
        <mesh position={[0, 0.05, 0.5]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Glow trail */}
        <pointLight position={[0, 0, 0]} intensity={0.3} color="#fbbf24" distance={2} decay={2} />
      </group>
    </Float>
  );
};

export default Reindeer;

