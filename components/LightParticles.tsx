import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LightParticlesProps {
  active: boolean;
  position: [number, number, number];
  color: string;
}

const LightParticles: React.FC<LightParticlesProps> = ({ active, position, color }) => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => {
    const arr: Array<{
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      life: number;
    }> = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const elevation = Math.random() * Math.PI;
      const speed = 0.3 + Math.random() * 0.5;
      arr.push({
        position: new THREE.Vector3(position[0], position[1], position[2]),
        velocity: new THREE.Vector3(
          Math.sin(elevation) * Math.cos(angle) * speed,
          Math.cos(elevation) * speed + 0.2,
          Math.sin(elevation) * Math.sin(angle) * speed
        ),
        life: 1.0
      });
    }
    return arr;
  }, [position]);

  const dummy = new THREE.Object3D();

  useFrame((state, delta) => {
    if (!active || !particlesRef.current) return;

    particles.forEach((particle, i) => {
      if (particle.life > 0) {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 5));
        particle.velocity.y -= delta * 2; // Gravity
        particle.life -= delta * 1.5;
        
        dummy.position.copy(particle.position);
        const scale = particle.life * 0.15;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
      } else {
        // Reset
        particle.position.set(position[0], position[1], position[2]);
        const angle = (i / 20) * Math.PI * 2;
        const elevation = Math.random() * Math.PI;
        const speed = 0.3 + Math.random() * 0.5;
        particle.velocity.set(
          Math.sin(elevation) * Math.cos(angle) * speed,
          Math.cos(elevation) * speed + 0.2,
          Math.sin(elevation) * Math.sin(angle) * speed
        );
        particle.life = 1.0;
      }
    });
    
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, 20]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={3}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
};

export default LightParticles;

