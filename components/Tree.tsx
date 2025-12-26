import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent, extend } from '@react-three/fiber';
import { Sparkles, Html, Float, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Memory } from '../types';
import LightParticles from './LightParticles';
import { playBellSound, playSparkleSound } from '../utils/soundEffects';

// --- Custom Magical Tree Material ---
const MagicalTreeMaterial = shaderMaterial(
  {
    time: 0,
    colorStart: new THREE.Color('#059669'), 
    colorEnd: new THREE.Color('#10b981'),   
    glowColor: new THREE.Color('#34d399'), 
  },
  `
    varying vec2 vUv;
    varying float vHeight;
    void main() {
      vUv = uv;
      vHeight = position.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 colorStart;
    uniform vec3 colorEnd;
    uniform vec3 glowColor;
    varying vec2 vUv;
    varying float vHeight;

    void main() {
      vec3 baseColor = mix(colorStart, colorEnd, vHeight * 0.5 + 0.5);
      float pulse = sin(vHeight * 4.0 - time * 2.0) * 0.5 + 0.5;
      vec3 finalColor = mix(baseColor, glowColor, pulse * 0.3);
      float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
      if (noise > 0.95 && pulse > 0.5) {
        finalColor += vec3(0.5); 
      }
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ MagicalTreeMaterial });

// --- Heart Burst Particle Effect ---
const HeartBurst: React.FC<{ active: boolean }> = ({ active }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (active && ref.current) {
            ref.current.children.forEach((child: any) => {
                child.position.y += delta * 2;
                child.material.opacity -= delta * 0.5;
                if (child.material.opacity <= 0) {
                    child.position.set(0,0,0);
                    child.material.opacity = 1;
                }
            });
        }
    });

    if (!active) return null;

    return (
        <group ref={ref} position={[0, 1, 0]}>
            {Array.from({ length: 15 }).map((_, i) => (
                <mesh key={i} position={[
                    (Math.random() - 0.5) * 2,
                    Math.random() * 2,
                    (Math.random() - 0.5) * 2
                ]}>
                    <planeGeometry args={[0.2, 0.2]} />
                    <meshBasicMaterial color="#ec4899" transparent side={THREE.DoubleSide}>
                    </meshBasicMaterial>
                    <Html center pointerEvents="none">
                         <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 5px white)' }}>❤️</div>
                    </Html>
                </mesh>
            ))}
        </group>
    );
};

const TreeLayer: React.FC<{ position: [number, number, number]; scale: number; rotationOffset: number }> = ({ position, scale, rotationOffset }) => {
  const materialRef = useRef<any>(null);
  useFrame((state) => {
    if (materialRef.current) materialRef.current.time = state.clock.elapsedTime;
  });

  return (
    <mesh position={position} castShadow rotation={[0, rotationOffset, 0]}>
      <coneGeometry args={[1.6 * scale, 2.2 * scale, 128, 4]} /> 
      {/* @ts-ignore */}
      <magicalTreeMaterial ref={materialRef} transparent={false} />
    </mesh>
  );
};

// --- Tree Lights System ---
const TreeLights: React.FC<{ colorIndex: number }> = ({ colorIndex }) => {
    const lightColors = ['#ef4444', '#facc15', '#ec4899', '#3b82f6', '#8b5cf6'];
    const currentColor = lightColors[colorIndex % lightColors.length];

    const lights = useMemo(() => {
        const arr = [];
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const y = -1 + Math.random() * 4;
            const r = (1 - (y + 1) / 5) * 1.5 + 0.5;
            arr.push({ pos: [Math.cos(angle) * r, y, Math.sin(angle) * r] as [number, number, number] });
        }
        return arr;
    }, []);

    return (
        <group>
            {lights.map((l, i) => (
                <mesh key={i} position={l.pos}>
                    <sphereGeometry args={[0.04, 8, 8]} />
                    <meshStandardMaterial 
                        color={currentColor} 
                        emissive={currentColor} 
                        emissiveIntensity={2} 
                        toneMapped={false} 
                    />
                    <pointLight distance={0.5} intensity={0.5} color={currentColor} decay={2} />
                </mesh>
            ))}
        </group>
    );
};

// --- Glowing Spiral Tinsel ---
const Tinsel: React.FC = () => {
    const points = useMemo(() => {
        const p = [];
        for (let i = 0; i < 100; i++) {
            const t = i / 100;
            const angle = t * Math.PI * 12; 
            const radius = (1 - t) * 2.5 + 0.2;
            const y = t * 6 - 2.5;
            p.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
        }
        return p;
    }, []);

    return (
        <mesh>
            <tubeGeometry args={[new THREE.CatmullRomCurve3(points), 64, 0.04, 8, false]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} roughness={0.2} metalness={1} />
        </mesh>
    );
};

interface OrnamentProps {
  position: [number, number, number];
  color: string;
  type?: 'sphere' | 'photo';
  memoryData?: Memory;
  onPhotoClick?: (m: Memory) => void;
}

const Ornament: React.FC<OrnamentProps> = ({ position, color: initialColor, type = 'sphere', memoryData, onPhotoClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  const { rotation, blinkSpeed, phase } = useMemo(() => ({
    rotation: [Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5] as [number, number, number],
    blinkSpeed: 0.5 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2
  }), []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      playSparkleSound(); // Sound effect for ornament click
      setClicked(true);
      setTimeout(() => setClicked(false), 400); // Increased duration for better visual

      if (type === 'photo' && onPhotoClick && memoryData) {
          setTimeout(() => onPhotoClick(memoryData), 300);
      } else if (onPhotoClick) {
          // Call callback for any ornament click (even sphere ornaments)
          setTimeout(() => {
              // Create a dummy memory object to trigger the callback
              const dummyMemory = { id: Date.now(), url: '', message: '' };
              onPhotoClick(dummyMemory);
          }, 300);
      }
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Heartbeat & Hover Animation
    if (meshRef.current) {
        let targetScale = hovered ? 1.3 : 1;
        
        // Spring bounce on click
        if (clicked) {
             targetScale = 1.5 + Math.sin(t * 40) * 0.2; // Aggressive wobble
        } else if (type === 'photo') {
             // Subtle heartbeat for photos normally
             targetScale += Math.sin(t * 2) * 0.05; 
        }

        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

        if (type === 'photo') {
            meshRef.current.rotation.y += 0.01;
            // Tilt slightly when hovered
            if (hovered) {
                meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, Math.sin(t*5)*0.1, 0.1);
            }
        }
    }

    if (type === 'sphere' && materialRef.current) {
        let intensity = 0.8 + (Math.sin(t * blinkSpeed + phase) * 0.5 + 0.5);
        if (clicked) intensity = 5; 
        if (hovered) intensity = 3;
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(materialRef.current.emissiveIntensity, intensity, 0.1);
    }
  });

  if (type === 'photo' && memoryData) {
    return (
        <Float speed={3} rotationIntensity={0.8} floatIntensity={0.8} floatingRange={[-0.05, 0.05]}>
          <group 
            ref={meshRef} 
            position={position} 
            onClick={handleClick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'crosshair'; }}
          >
             {/* Particles floating up when clicked */}
             {clicked && (
                 <Sparkles count={15} scale={2.5} size={8} speed={3} color="#ec4899" position={[0,0.5,0]} />
             )}

             <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 1]} />
                <meshBasicMaterial color="#fbbf24" />
             </mesh>
            <mesh rotation={rotation}>
                <boxGeometry args={[0.85, 0.85, 0.08]} />
                <meshStandardMaterial 
                    color="#ffd700" 
                    roughness={0.1} 
                    metalness={1} 
                    emissive={clicked ? "#fbbf24" : "#b45309"}
                    emissiveIntensity={clicked ? 1 : 0.2}
                />
                <mesh position={[0, 0, 0.045]}>
                    <planeGeometry args={[0.7, 0.7]} />
                    <meshBasicMaterial color="#fff" />
                     <Html transform position={[0, 0, 0.01]} style={{ pointerEvents: 'none' }}>
                         <div className={`w-24 h-24 md:w-28 md:h-28 bg-white p-1 shadow-[0_0_15px_rgba(255,215,0,0.6)] transition-all duration-300 border border-yellow-500 rounded-sm overflow-hidden ${clicked ? 'brightness-125 sepia' : ''}`}>
                             <img 
                                src={memoryData.url} 
                                alt="Memory" 
                                className="w-full h-full object-cover"
                                style={{
                                  imageRendering: '-webkit-optimize-contrast' as any
                                }}
                                loading="eager"
                                decoding="async"
                                onError={(e) => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1512474932049-78ea796b5f4d?q=80&w=400&auto=format&fit=crop";
                                }}
                             />
                         </div>
                     </Html>
                </mesh>
            </mesh>
          </group>
        </Float>
    );
  }

  return (
    <group ref={meshRef} position={position}>
        <mesh castShadow onClick={handleClick} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial 
                ref={materialRef}
                color={initialColor} 
                emissive={initialColor}
                emissiveIntensity={1}
                metalness={0.8} 
                roughness={0.1} 
            />
            {clicked && <pointLight distance={2} intensity={5} color="#ffffff" decay={2} />}
        </mesh>
    </group>
  );
};

interface ChristmasTreeProps {
    memories: Memory[];
    onOrnamentClick: (m: Memory) => void;
    onDoubleClick?: () => void;
}

const ChristmasTree: React.FC<ChristmasTreeProps> = ({ memories, onOrnamentClick, onDoubleClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [lightColorIndex, setLightColorIndex] = useState(0);
  const [scaleSpring, setScaleSpring] = useState(1);
  const [showBurst, setShowBurst] = useState(false);
  const [showLightParticles, setShowLightParticles] = useState(false);
  const [treeBounce, setTreeBounce] = useState(false);

  // Tree Click Interaction - Enhanced with sound
  const handleTreeClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      playBellSound(); // Sound effect
      setLightColorIndex(prev => prev + 1);
      // Enhanced bounce effect
      setTreeBounce(true);
      setScaleSpring(1.15);
      setTimeout(() => {
        setScaleSpring(1.05);
        setTimeout(() => setScaleSpring(1), 200);
      }, 150);
      // Light particles
      setShowLightParticles(true);
      setTimeout(() => setShowLightParticles(false), 1000);
  };

  const handleTreeDoubleClick = (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 2000);
      // Pop effect
      setScaleSpring(1.2);
      setTimeout(() => setScaleSpring(1), 300);
      // Trigger fireworks
      if (onDoubleClick) {
          onDoubleClick();
      }
  };

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
      // Enhanced spring elastic interpolation with bounce
      let targetScale = scaleSpring;
      if (treeBounce) {
        const bounceTime = state.clock.elapsedTime * 15;
        targetScale += Math.sin(bounceTime) * 0.08;
        // Stop bounce after animation
        if (bounceTime > Math.PI * 2) {
          setTreeBounce(false);
        }
      }
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  const ornaments: OrnamentProps[] = useMemo(() => {
      const items: OrnamentProps[] = [];
      const total = 60; 
      let photoCounter = 0;
      for (let i = 0; i < total; i++) {
        const p = i / total;
        const angle = p * Math.PI * 18 + i; 
        const y = -2.2 + p * 6; 
        const radius = 2.4 - p * 2.4; 
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const isPhoto = i % 10 === 5; 
        const colors = ['#ff0055', '#00ccff', '#ffcc00', '#cc00ff', '#00ff99', '#ff3300'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        if (radius > 0.25) {
            let memoryData: Memory | undefined;
            if (isPhoto) {
                memoryData = memories[photoCounter % memories.length];
                photoCounter++;
            }
            items.push({
                position: [x, y, z],
                color: isPhoto ? '#fff' : color,
                type: isPhoto ? 'photo' : 'sphere',
                memoryData: memoryData
            });
        }
      }
      return items;
  }, [memories]); 

  const layers = [
      { scale: 1.4, y: 0 },
      { scale: 1.25, y: 1.0 },
      { scale: 1.1, y: 1.9 },
      { scale: 0.95, y: 2.7 },
      { scale: 0.8, y: 3.4 },
      { scale: 0.6, y: 4.0 },
  ];

  return (
    <group 
        ref={groupRef} 
        position={[0, -1.5, 0]} 
        onClick={handleTreeClick}
        onDoubleClick={handleTreeDoubleClick}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'crosshair'; }}
    >
      {/* Heart Burst Effect */}
      <HeartBurst active={showBurst} />

      {/* Light Particles - Fly up on click */}
      <LightParticles 
        active={showLightParticles} 
        position={[0, 2, 0]} 
        color={['#ef4444', '#facc15', '#ec4899', '#3b82f6', '#8b5cf6'][lightColorIndex % 5]}
      />

      {/* Dynamic Lights */}
      <TreeLights colorIndex={lightColorIndex} />

      {/* Dynamic Magical Layers */}
      {layers.map((layer, idx) => (
          <TreeLayer 
            key={idx}
            position={[0, layer.y, 0]} 
            scale={layer.scale} 
            rotationOffset={idx * 0.5} 
          />
      ))}

      <Tinsel />

      {/* Trunk */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 2]} />
        <meshStandardMaterial color="#3f2e26" roughness={0.8} />
      </mesh>

      {/* Star */}
      <mesh position={[0, 4.8, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#fff" emissive="#fbbf24" emissiveIntensity={5} />
        <pointLight intensity={20} distance={15} color="#fbbf24" decay={2} />
        <Sparkles count={50} scale={3} size={10} speed={2} color="#fbbf24" />
      </mesh>

      {ornaments.map((o, i) => (
        <Ornament key={i} {...o} onPhotoClick={onOrnamentClick} />
      ))}
      
      <Sparkles count={300} scale={12} size={5} speed={0.5} opacity={0.6} color="#ffe4e6" noise={1} />
    </group>
  );
};

export default ChristmasTree;