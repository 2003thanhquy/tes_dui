import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface GiftBoxProps {
  position?: [number, number, number];
  onOpen?: () => void;
}

const GiftBox: React.FC<GiftBoxProps> = ({ position = [-4, -1, 3], onOpen }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      if (onOpen) onOpen();
    }
  };

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    
    if (lidRef.current && isOpen) {
      // Open lid animation
      lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, -Math.PI / 2, 0.1);
    }
  });

  const boxColor = hovered ? '#ef4444' : '#dc2626';
  const ribbonColor = '#fbbf24';

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.3}>
      <group 
        ref={groupRef} 
        position={position}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Box base */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color={boxColor} />
        </mesh>
        
        {/* Lid */}
        <mesh 
          ref={lidRef} 
          position={[0, 0.4, 0]} 
          rotation={[0, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.6, 0.1, 0.6]} />
          <meshStandardMaterial color={boxColor} />
        </mesh>
        
        {/* Ribbon - Horizontal */}
        <mesh position={[0, 0, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.05]} />
          <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={0.5} />
        </mesh>
        
        {/* Ribbon - Vertical */}
        <mesh position={[0.31, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.05]} />
          <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={0.5} />
        </mesh>
        
        {/* Bow on top */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.15, 0.1, 0.15]} />
          <meshStandardMaterial color={ribbonColor} emissive={ribbonColor} emissiveIntensity={1} />
        </mesh>
        
        {/* Sparkles when open */}
        {isOpen && (
          <pointLight position={[0, 0.2, 0]} intensity={2} color="#fbbf24" distance={1} decay={2} />
        )}
        
        {/* Glow effect */}
        {hovered && (
          <pointLight position={[0, 0, 0]} intensity={1} color="#ef4444" distance={1.5} decay={2} />
        )}
      </group>
    </Float>
  );
};

export default GiftBox;

