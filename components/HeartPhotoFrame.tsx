import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';

interface HeartPhotoFrameProps {
  position?: [number, number, number];
  imageUrl?: string;
  onPhotoClick?: () => void;
  currentIndex?: number;
  totalImages?: number;
}

const HeartPhotoFrame: React.FC<HeartPhotoFrameProps> = ({ 
  position = [3, 1, -2], 
  imageUrl,
  onPhotoClick,
  currentIndex = 0,
  totalImages = 5
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [heartbeat, setHeartbeat] = useState(false);
  const [imageChanging, setImageChanging] = useState(false);
  const prevImageUrlRef = useRef<string | undefined>(imageUrl);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      // Gentle rotation
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      
      // Heartbeat effect when clicked
      if (clicked && frameRef.current) {
        const beat = Math.sin(state.clock.elapsedTime * 8) * 0.1;
        frameRef.current.scale.setScalar(1 + beat);
      }
    }
  });

  // Detect image change for animation
  useEffect(() => {
    if (imageUrl && imageUrl !== prevImageUrlRef.current) {
      setImageChanging(true);
      setTimeout(() => {
        setImageChanging(false);
      }, 500);
      prevImageUrlRef.current = imageUrl;
    }
  }, [imageUrl]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setClicked(true);
    setHeartbeat(true);
    setImageChanging(true);
    setTimeout(() => {
      setClicked(false);
      setHeartbeat(false);
    }, 2000);
    setTimeout(() => {
      setImageChanging(false);
    }, 500);
    if (onPhotoClick) onPhotoClick();
  };

  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={0.2}>
      <group 
        ref={groupRef} 
        position={position}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Heart frame - Outer border with enhanced glow */}
        <mesh ref={frameRef} position={[0, 0, 0]}>
          <boxGeometry args={[1.4, 1.4, 0.1]} />
          <meshStandardMaterial 
            color={clicked ? "#ff0000" : hovered ? "#ef4444" : "#dc2626"} 
            metalness={0.8} 
            roughness={0.2}
            emissive={clicked ? "#ff0000" : hovered ? "#ef4444" : "#dc2626"}
            emissiveIntensity={clicked ? 2 : hovered ? 1 : 0.3}
          />
        </mesh>
        
        {/* Glow rings when clicked */}
        {clicked && (
          <>
            <mesh position={[0, 0, 0.05]}>
              <ringGeometry args={[0.8, 1.0, 32]} />
              <meshBasicMaterial color="#ff0000" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <ringGeometry args={[1.0, 1.2, 32]} />
              <meshBasicMaterial color="#ff69b4" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
          </>
        )}

        {/* Heart decoration on top */}
        <mesh position={[0, 0.7, 0.06]} scale={[0.3, 0.3, 0.1]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#ff69b4" />
        </mesh>

        {/* Photo inside - Using Html for better image rendering */}
        {imageUrl && (
          <mesh position={[0, 0, 0.1]}>
            <planeGeometry args={[1.5, 1.5, 32, 32]} />
            <meshBasicMaterial transparent opacity={1} />
            <Html
              transform
              occlude={false}
              position={[0, 0, 0.05]}
              style={{ pointerEvents: 'none' }}
              center
              distanceFactor={1.5}
            >
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg overflow-hidden shadow-lg border-2 border-white/50 bg-white/10 backdrop-blur-sm relative group" style={{ zIndex: 1000 }}>
                <img 
                  src={imageUrl} 
                  alt="Love memory" 
                  className={`w-full h-full object-cover transition-all duration-500 will-change-transform ${
                    imageChanging ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  style={{
                    imageRendering: '-webkit-optimize-contrast' as any
                  }}
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1512474932049-78ea796b5f4d?q=80&w=400&auto=format&fit=crop";
                  }}
                />
                {/* Hint text khi hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <p className="text-white text-xs text-center px-2 font-vibes">
                    Click để đổi ảnh
                  </p>
                </div>
                {/* Indicator dots - hiển thị ảnh nào đang active */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-60">
                  {[...Array(totalImages)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full transition-all duration-300 ${
                        i === currentIndex ? 'bg-amber-400 w-2' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </Html>
          </mesh>
        )}

        {/* Enhanced sparkles and glow */}
        {(hovered || clicked) && (
          <pointLight 
            position={[0, 0, 0]} 
            intensity={clicked ? 3 : 1.5} 
            color={clicked ? "#ff0000" : "#ef4444"} 
            distance={clicked ? 3 : 2} 
            decay={2} 
          />
        )}
        
        {/* Particle burst on click */}
        {clicked && (
          <group>
            {[...Array(8)].map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos((i / 8) * Math.PI * 2) * 0.5,
                  Math.sin((i / 8) * Math.PI * 2) * 0.5,
                  0.1
                ]}
              >
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial 
                  color="#ff69b4" 
                  emissive="#ff69b4" 
                  emissiveIntensity={2}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Decorative hearts floating */}
        {[...Array(3)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(i * Math.PI * 2 / 3) * 0.8,
              Math.sin(i * Math.PI * 2 / 3) * 0.8,
              0.1
            ]}
            scale={hovered ? 1.2 : 1}
          >
            <planeGeometry args={[0.1, 0.1]} />
            <meshBasicMaterial color="#ff69b4" transparent opacity={0.6} />
            <Html center>
              <div className="text-xl">💖</div>
            </Html>
          </mesh>
        ))}
      </group>
    </Float>
  );
};

export default HeartPhotoFrame;

