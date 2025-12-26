import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import ChristmasTree from './Tree';
import { Memory } from '../types';

// --- Snow with Wind & Repulsion & Easter Egg ---
const Snow: React.FC<{ count: number, wind: [number, number], repelPoint: THREE.Vector3 | null }> = ({ count, wind, repelPoint }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const particles = useRef<Array<{ position: THREE.Vector3, velocity: THREE.Vector3, factor: number, isEasterEgg: boolean }>>([]);
  const dummy = new THREE.Object3D();

  if (particles.current.length === 0) {
    for (let i = 0; i < count; i++) {
      // 2-3 bông tuyết màu vàng/hồng (easter egg)
      const isEasterEgg = i < 3 && Math.random() > 0.5;
      particles.current.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20 + 5,
          (Math.random() - 0.5) * 20
        ),
        velocity: new THREE.Vector3(0, -0.02 - Math.random() * 0.05, 0),
        factor: 0.5 + Math.random() * 0.5,
        isEasterEgg: isEasterEgg
      });
    }
  }

  useFrame(() => {
    if (!mesh.current) return;
    
    particles.current.forEach((particle, i) => {
      // Apply wind
      particle.position.x += wind[0] * 0.05;
      particle.position.z += wind[1] * 0.05;
      particle.position.y += particle.velocity.y;

      // Natural swirl
      particle.position.x += Math.sin(particle.position.y * particle.factor) * 0.005;

      // Repulsion logic
      if (repelPoint) {
          const dx = particle.position.x - repelPoint.x;
          const dy = particle.position.y - repelPoint.y;
          const dz = particle.position.z - repelPoint.z;
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          if (dist < 3) {
              const force = (3 - dist) * 0.05;
              particle.position.x += dx * force;
              particle.position.y += dy * force;
              particle.position.z += dz * force;
          }
      }

      // Reset if out of bounds
      if (particle.position.y < -5) {
        particle.position.y = 10;
        particle.position.x = (Math.random() - 0.5) * 20;
        particle.position.z = (Math.random() - 0.5) * 20;
      }

      dummy.position.copy(particle.position);
      dummy.scale.setScalar(particle.isEasterEgg ? 0.08 : 0.05); // Easter egg lớn hơn
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial 
        color={particles.current[0]?.isEasterEgg ? "#fbbf24" : "#ffffff"} 
        transparent 
        opacity={0.9}
        // Note: This will color all particles the same, but we can enhance this later
      />
    </instancedMesh>
  );
};

// --- Ripple Ring Effect ---
const Ripple: React.FC<{ position: THREE.Vector3, active: boolean }> = ({ position, active }) => {
    const mesh = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (active && mesh.current) {
            mesh.current.scale.x += delta * 10;
            mesh.current.scale.y += delta * 10;
            (mesh.current.material as THREE.MeshBasicMaterial).opacity -= delta * 1.5;
            if ((mesh.current.material as THREE.MeshBasicMaterial).opacity <= 0) {
                 mesh.current.scale.set(0,0,0);
            }
        }
    });

    if (!active) return null;

    return (
        <mesh ref={mesh} position={[position.x, position.y + 0.1, position.z]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.5, 0.6, 32]} />
            <meshBasicMaterial color="#a5f3fc" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
    );
};

interface SceneProps {
  isDesktop: boolean;
  memories: Memory[];
  onMemoryClick: (m: Memory) => void;
  windDirection: [number, number];
  treeShake?: boolean;
}

const Scene: React.FC<SceneProps> = ({ isDesktop, memories, onMemoryClick, windDirection, treeShake = false }) => {
  const treePosition: [number, number, number] = isDesktop ? [-2, -1.5, 0] : [0, -2, 0];
  const [repelPoint, setRepelPoint] = useState<THREE.Vector3 | null>(null);
  const [ripplePos, setRipplePos] = useState<THREE.Vector3>(new THREE.Vector3(0,0,0));
  const [rippleActive, setRippleActive] = useState(false);

  const handleBackgroundClick = (e: ThreeEvent<MouseEvent>) => {
      const point = e.point;
      setRepelPoint(point);
      setRipplePos(point);
      setRippleActive(true);
      
      // Reset ripple logic
      setTimeout(() => {
          setRepelPoint(null);
          setRippleActive(false);
      }, 1000);
  };

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-gradient-to-b from-[#020617] via-[#1e1b4b] to-[#4c1d95]">
      <Canvas shadows camera={{ position: [0, 2, 9], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 5, 30]} />
        
        {/* Lights */}
        <ambientLight intensity={0.2} color="#4c1d95" />
        <spotLight position={[5, 5, 5]} angle={0.25} penumbra={1} intensity={10} castShadow color="#f0abfc" />
        <pointLight position={[-5, 2, -5]} intensity={5} color="#38bdf8" />
        <pointLight position={[0, -2, 3]} intensity={3} color="#facc15" />

        <Suspense fallback={null}>
            <group position={treePosition} className={treeShake ? 'animate-[treeShake_0.2s_ease-in-out]' : ''}>
                <ChristmasTree memories={memories} onOrnamentClick={onMemoryClick} />
            </group>
            
            {/* Clickable Background Plane for Interactions */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]} receiveShadow onPointerDown={handleBackgroundClick}>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#0f172a" transparent opacity={0} />
            </mesh>

            <Ripple position={ripplePos} active={rippleActive} />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
               <mesh position={[4, 3, -5]}>
                  <torusGeometry args={[0.5, 0.2, 16, 100]} />
                  <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={2} />
               </mesh>
            </Float>

            <Snow count={400} wind={windDirection} repelPoint={repelPoint} />
            <Stars radius={100} depth={50} count={3000} factor={6} saturation={1} fade speed={1.5} />
            <Environment preset="city" />
            <ContactShadows position={[0, -4, 0]} opacity={0.6} scale={20} blur={2.5} far={4} color="#000" />
        </Suspense>

        <OrbitControls 
            enablePan={false} 
            enableZoom={false}
            minPolarAngle={Math.PI / 3} 
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={true}
            autoRotateSpeed={0.5}
        />

        <EffectComposer>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Scene;