import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireworksProps {
  active: boolean;
  position?: [number, number, number];
}

const Fireworks: React.FC<FireworksProps> = ({ active, position = [0, 0, 0] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const arr: Array<{
      velocity: THREE.Vector3;
      position: THREE.Vector3;
      color: THREE.Color;
      life: number;
      decay: number;
    }> = [];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ffffff'];
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI;
      const speed = 0.5 + Math.random() * 1.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      arr.push({
        velocity: new THREE.Vector3(
          Math.sin(elevation) * Math.cos(angle) * speed,
          Math.cos(elevation) * speed,
          Math.sin(elevation) * Math.sin(angle) * speed
        ),
        position: new THREE.Vector3(position[0], position[1], position[2]),
        color: new THREE.Color(color),
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02
      });
    }
    return arr;
  }, [position]);

  const dummy = new THREE.Object3D();

  useFrame((state, delta) => {
    if (!active || !particlesRef.current || !groupRef.current) return;

    particles.forEach((particle, i) => {
      if (particle.life > 0) {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 10));
        particle.velocity.y -= delta * 5; // Gravity
        particle.life -= particle.decay;
        
        dummy.position.copy(particle.position);
        const scale = particle.life;
        dummy.scale.setScalar(scale * 0.1);
        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
      } else {
        // Reset particle
        particle.position.set(position[0], position[1], position[2]);
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI;
        const speed = 0.5 + Math.random() * 1.5;
        particle.velocity.set(
          Math.sin(elevation) * Math.cos(angle) * speed,
          Math.cos(elevation) * speed,
          Math.sin(elevation) * Math.sin(angle) * speed
        );
        particle.life = 1.0;
      }
    });
    
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      <instancedMesh ref={particlesRef} args={[undefined, undefined, 200]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </instancedMesh>
    </group>
  );
};

export default Fireworks;

