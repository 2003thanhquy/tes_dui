import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import ChristmasTree from './Tree';
import Fireworks from './Fireworks';
import Santa from './Santa';
import GiftBox from './GiftBox';
import Aurora from './Aurora';
import Reindeer from './Reindeer';
import SnowGlobe from './SnowGlobe';
import HeartPhotoFrame from './HeartPhotoFrame';
import CameraController from './CameraController';
import PhotoCarousel from './PhotoCarousel';
import { Memory } from '../types';
import { getPerformanceConfig } from '../utils/performance';

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
  showFireworks?: boolean;
  onGiftOpen?: () => void;
  onTreeDoubleClick?: () => void;
  heartPhotoUrl?: string;
  onHeartPhotoClick?: () => void;
  currentHeartPhotoIndex?: number;
  carouselImages?: Array<{ id: number; url: string; title: string; message: string }>;
  onCarouselPhotoClick?: (image: { id: number; url: string; title: string; message: string }) => void;
  carouselRadius?: number;
  carouselPosition?: [number, number, number] | null;
  cameraRotation?: [number, number]; // [yaw, pitch] - xoay camera bằng gesture
  carouselRotation?: number; // Góc xoay của carousel (điều khiển bằng gesture)
}

const Scene: React.FC<SceneProps> = ({ 
  isDesktop, 
  memories, 
  onMemoryClick, 
  windDirection, 
  treeShake = false,
  showFireworks = false,
  onGiftOpen,
  onTreeDoubleClick,
  heartPhotoUrl,
  onHeartPhotoClick,
  currentHeartPhotoIndex = 0,
  carouselImages = [],
  onCarouselPhotoClick,
  carouselRadius,
  carouselPosition,
  cameraRotation = [0, 0],
  carouselRotation = 0
}) => {
  const treePosition: [number, number, number] = isDesktop ? [-2, -1.5, 0] : [0, -2, 0];
  const [repelPoint, setRepelPoint] = useState<THREE.Vector3 | null>(null);
  const [ripplePos, setRipplePos] = useState<THREE.Vector3>(new THREE.Vector3(0,0,0));
  const [rippleActive, setRippleActive] = useState(false);
  const [fireworksPositions] = useState<Array<[number, number, number]>>(() => {
    // Multiple firework positions
    return [
      [0, 3, 0],
      [-2, 4, -1],
      [2, 4, 1],
      [-1, 5, 1],
      [1, 5, -1]
    ];
  });
  
  // Adaptive performance config
  const perfConfig = useMemo(() => getPerformanceConfig(), []);

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
    <div className="w-full h-full absolute inset-0 z-0 bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#2d1b4e]">
      <Canvas 
        shadows={perfConfig.enableShadows} 
        camera={{ position: [0, 0, 12], fov: isDesktop ? 50 : 55 }}
        dpr={perfConfig.pixelRatio}
        frameloop="always"
        performance={{ min: 0.75 }} // Tăng từ 0.5 lên 0.75 để mượt hơn (target 45fps thay vì 30fps)
      >
        <color attach="background" args={['#0a0a1a']} />
        <fog attach="fog" args={['#0a0a1a', 8, 25]} />
        
        {/* Camera Controller - Card opening animation */}
        <CameraController isDesktop={isDesktop} />
        
        {/* Enhanced Lights for Snow Globe */}
        <ambientLight intensity={0.3} color="#ffffff" />
        <spotLight position={[0, 8, 5]} angle={0.4} penumbra={1} intensity={15} castShadow color="#ffffff" />
        <pointLight position={[-5, 3, -5]} intensity={8} color="#f0abfc" />
        <pointLight position={[5, 3, -5]} intensity={8} color="#38bdf8" />
        <pointLight position={[0, -3, 3]} intensity={5} color="#facc15" />
        <directionalLight position={[0, 10, 5]} intensity={0.5} color="#ffffff" />

        <Suspense fallback={null}>
            {/* Snow Globe Container */}
            <SnowGlobe position={[0, 0, 0]}>
                {/* Aurora Northern Lights - Inside globe (adaptive) */}
                {perfConfig.enableAurora && <Aurora intensity={0.8} />}
                
                {/* Heart Photo Frame - Inside globe, closer to camera */}
                {heartPhotoUrl && (
                  <HeartPhotoFrame 
                    position={isDesktop ? [3, 1.5, -2] : [2.5, 1, -1.5]} 
                    imageUrl={heartPhotoUrl}
                    onPhotoClick={onHeartPhotoClick}
                    currentIndex={currentHeartPhotoIndex}
                    totalImages={5}
                  />
                )}
                
                {/* Photo Carousel - Trước cây thông, có thể điều khiển bằng gesture */}
                {carouselImages.length > 0 && onCarouselPhotoClick && (
                  <PhotoCarousel 
                    images={perfConfig.carouselImages > 0 ? carouselImages.slice(0, perfConfig.carouselImages) : carouselImages}
                    onPhotoClick={onCarouselPhotoClick}
                    radius={carouselRadius ?? (isDesktop ? 5 : 3.5)}
                    height={isDesktop ? 2 : 1.2}
                    speed={0.3} // Tốc độ xoay tự động
                    enableRotation={true} // Bật xoay quanh cây thông
                    rotationAngle={carouselRotation} // Góc xoay từ gesture
                    position={carouselPosition || (isDesktop ? [0, 2, -3] : [0, 1.5, -2.5])} // Trước cây thông
                    enableFloating={true} // Bật floating animation
                  />
                )}

                {/* Christmas Tree - Centered */}
                <group position={treePosition} className={treeShake ? 'animate-[treeShake_0.2s_ease-in-out]' : ''}>
                    <ChristmasTree memories={memories} onOrnamentClick={onMemoryClick} onDoubleClick={onTreeDoubleClick} />
                </group>
                
                {/* Gift Box - Inside globe */}
                <GiftBox position={isDesktop ? [-2, -0.5, 2] : [-1.5, -1, 1.5]} onOpen={onGiftOpen} />
                
                {/* Fireworks - Inside globe */}
                {showFireworks && fireworksPositions.map((pos, i) => (
                  <Fireworks key={i} active={showFireworks} position={pos} />
                ))}
            </SnowGlobe>
            
            {/* Elements outside globe */}
            {/* Reindeer flying around - Outside globe */}
            <Reindeer position={[0, 0, 0]} radius={10} speed={0.3} />
            <Reindeer position={[0, 0, 0]} radius={11} speed={0.25} />
            
            {/* Santa Claus - Outside globe */}
            <Santa position={isDesktop ? [7, 2, -6] : [6, 1.5, -5]} />
            
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

            {/* Snow - Adaptive count based on device */}
            <Snow count={perfConfig.snow} wind={windDirection} repelPoint={repelPoint} />
            <Stars 
              radius={100} 
              depth={50} 
              count={perfConfig.stars} 
              factor={isDesktop ? 8 : 6} 
              saturation={isDesktop ? 1.5 : 1.2} 
              fade 
              speed={isDesktop ? 2 : 1.5} 
            />
            <Environment preset="sunset" />
            {perfConfig.enableContactShadows && (
              <ContactShadows position={[0, -4, 0]} opacity={0.8} scale={20} blur={3} far={4} color="#000" />
            )}
        </Suspense>

        <OrbitControls 
            enablePan={false} 
            enableZoom={true}
            minDistance={7}
            maxDistance={15}
            minPolarAngle={Math.PI / 3} 
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={cameraRotation[0] === 0 && cameraRotation[1] === 0} // Tắt auto rotate khi có gesture rotation
            autoRotateSpeed={0.3}
            enableDamping={true}
            dampingFactor={0.05}
            target={[cameraRotation[0] * 2, cameraRotation[1] * 2, 0]} // Xoay camera dựa trên gesture
        />

        {perfConfig.enableBloom && (
          <EffectComposer>
            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};

export default Scene;