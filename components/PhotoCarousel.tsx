import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';

type FrameShape = 'circle' | 'square' | 'rectangle' | 'triangle' | 'diamond' | 'hexagon' | 'star';

interface PhotoCarouselProps {
  images: Array<{ id: number; url: string; title: string; message: string }>;
  onPhotoClick: (image: { id: number; url: string; title: string; message: string }) => void;
  radius?: number;
  height?: number;
  speed?: number;
  frameShape?: FrameShape;
  autoChangeShape?: boolean; // Tự động đổi hình dạng
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ 
  images, 
  onPhotoClick,
  radius = 4.5,
  height = 1.5,
  speed = 0.3,
  frameShape = 'circle',
  autoChangeShape = true
}) => {
  const [currentShape, setCurrentShape] = useState<FrameShape>(frameShape);
  const shapes: FrameShape[] = ['circle', 'square', 'rectangle', 'triangle', 'diamond', 'hexagon'];
  
  // Auto change shape every 8 seconds
  useEffect(() => {
    if (!autoChangeShape) return;
    
    const interval = setInterval(() => {
      setCurrentShape((prev) => {
        const currentIndex = shapes.indexOf(prev);
        const nextIndex = (currentIndex + 1) % shapes.length;
        return shapes[nextIndex];
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, [autoChangeShape, shapes]);
  
  // Update shape when prop changes
  useEffect(() => {
    setCurrentShape(frameShape);
  }, [frameShape]);
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const entranceProgressRef = useRef(0);
  const entranceStartTimeRef = useRef<number | null>(null);
  const photoEntranceTimesRef = useRef<Map<number, number>>(new Map());
  const { camera } = useThree();

  // Staggered entrance: Ảnh xuất hiện lần lượt
  useEffect(() => {
    const startTime = Date.now();
    entranceStartTimeRef.current = startTime;
    photoEntranceTimesRef.current.clear();
    
    const timer = setTimeout(() => {
      images.forEach((_, index) => {
        const delay = index * 150;
        photoEntranceTimesRef.current.set(index, startTime + 500 + delay);
        setTimeout(() => {
          setVisibleIndices(prev => new Set([...prev, index]));
        }, delay);
      });
    }, 500); // Bắt đầu sau 500ms
    return () => clearTimeout(timer);
  }, [images.length]);

  // Smooth rotation with variable speed based on focus
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth acceleration/deceleration
      entranceProgressRef.current = Math.min(1, entranceProgressRef.current + delta * 0.5);
      
      // Variable speed: chậm hơn khi có ảnh được hover
      const currentSpeed = hoveredIndex !== null ? speed * 0.3 : speed;
      groupRef.current.rotation.y += delta * currentSpeed * entranceProgressRef.current;
    }
  });

  // Calculate position for each photo with spiral entrance
  const getPhotoPosition = (index: number, total: number, progress: number = 1): [number, number, number] => {
    const baseAngle = (index / total) * Math.PI * 2;
    const currentAngle = baseAngle + (groupRef.current?.rotation.y || 0);
    
    // Spiral entrance: ảnh bay vào từ xa
    const entranceRadius = radius * (0.3 + progress * 0.7);
    const entranceHeight = height + (1 - progress) * 2; // Bay từ trên xuống
    
    const x = Math.cos(currentAngle) * entranceRadius;
    const z = Math.sin(currentAngle) * entranceRadius;
    return [x, entranceHeight, z];
  };

  // Calculate distance from camera for depth of field effect
  const getDistanceFromCamera = (position: [number, number, number]): number => {
    const cameraPos = camera.position;
    return Math.sqrt(
      Math.pow(position[0] - cameraPos.x, 2) +
      Math.pow(position[1] - cameraPos.y, 2) +
      Math.pow(position[2] - cameraPos.z, 2)
    );
  };

  // Calculate if photo is in focus (facing camera)
  const isInFocus = (index: number, total: number): boolean => {
    if (!groupRef.current) return false;
    const baseAngle = (index / total) * Math.PI * 2;
    const currentAngle = (baseAngle + groupRef.current.rotation.y) % (Math.PI * 2);
    // Ảnh ở phía trước camera (góc 0 đến PI/2 hoặc 3PI/2 đến 2PI)
    return currentAngle < Math.PI / 2 || currentAngle > 3 * Math.PI / 2;
  };

  const handlePhotoClick = (e: ThreeEvent<MouseEvent>, image: typeof images[0], index: number) => {
    e.stopPropagation();
    setClickedIndex(index);
    // Reset after animation
    setTimeout(() => setClickedIndex(null), 500);
    onPhotoClick(image);
  };

  // Calculate entrance progress for each photo
  const getEntranceProgress = (index: number): number => {
    if (!entranceStartTimeRef.current || !photoEntranceTimesRef.current.has(index)) {
      return visibleIndices.has(index) ? 1 : 0;
    }
    const startTime = photoEntranceTimesRef.current.get(index)!;
    const elapsed = Date.now() - startTime;
    return Math.min(1, Math.max(0, elapsed / 800)); // 800ms để fade in hoàn toàn
  };

  return (
    <group ref={groupRef}>
      {images.map((image, index) => {
        // Use useFrame to get real-time values
        return <PhotoItem
          key={image.id}
          image={image}
          index={index}
          total={images.length}
          groupRef={groupRef}
          visibleIndices={visibleIndices}
          entranceProgress={getEntranceProgress(index)}
          hoveredIndex={hoveredIndex}
          clickedIndex={clickedIndex}
          onHover={setHoveredIndex}
          onClick={handlePhotoClick}
          camera={camera}
          radius={radius}
          height={height}
          frameShape={currentShape}
        />;
      })}
    </group>
  );
};

// Separate component for each photo to use useFrame for real-time calculations
const PhotoItem: React.FC<{
  image: { id: number; url: string; title: string; message: string };
  index: number;
  total: number;
  groupRef: React.RefObject<THREE.Group>;
  visibleIndices: Set<number>;
  entranceProgress: number;
  hoveredIndex: number | null;
  clickedIndex: number | null;
  onHover: (index: number | null) => void;
  onClick: (e: ThreeEvent<MouseEvent>, image: any, index: number) => void;
  camera: THREE.Camera;
  radius: number;
  height: number;
  frameShape: FrameShape;
}> = ({ image, index, total, groupRef, visibleIndices, entranceProgress, hoveredIndex, clickedIndex, onHover, onClick, camera, radius, height, frameShape }) => {
  const itemRef = useRef<THREE.Group>(null);
  const [inFocus, setInFocus] = useState(false);
  const [distance, setDistance] = useState(0);
  
  // Real-time focus and distance calculation
  useFrame(() => {
    if (!groupRef.current || !itemRef.current) return;
    
    const baseAngle = (index / total) * Math.PI * 2;
    const currentAngle = ((baseAngle + groupRef.current.rotation.y) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const normalizedAngle = currentAngle < Math.PI ? currentAngle : currentAngle - Math.PI * 2;
    const focus = Math.abs(normalizedAngle) < Math.PI / 3;
    setInFocus(focus);
    
    const pos = itemRef.current.position;
    const cameraPos = camera.position;
    const dist = Math.sqrt(
      Math.pow(pos.x - cameraPos.x, 2) +
      Math.pow(pos.y - cameraPos.y, 2) +
      Math.pow(pos.z - cameraPos.z, 2)
    );
    setDistance(dist);
  });

  // Smooth radius interpolation for zoom
  const smoothRadiusRef = useRef(radius);
  
  useFrame((state, delta) => {
    // Lerp radius smoothly when it changes
    const diff = radius - smoothRadiusRef.current;
    if (Math.abs(diff) > 0.01) {
      smoothRadiusRef.current += diff * Math.min(delta * 8, 1); // Smooth interpolation
    } else {
      smoothRadiusRef.current = radius;
    }
  });

  const getPhotoPosition = (progress: number = 1): [number, number, number] => {
    if (!groupRef.current) return [0, 0, 0];
    const baseAngle = (index / total) * Math.PI * 2;
    const currentAngle = baseAngle + groupRef.current.rotation.y;
    
    // Sử dụng smoothRadius thay vì radius trực tiếp
    const entranceRadius = smoothRadiusRef.current * (0.3 + progress * 0.7);
    const entranceHeight = height + (1 - progress) * 2;
    
    const x = Math.cos(currentAngle) * entranceRadius;
    const z = Math.sin(currentAngle) * entranceRadius;
    return [x, entranceHeight, z];
  };

  const [x, y, z] = getPhotoPosition(entranceProgress);
  const isHovered = hoveredIndex === index;
  const isClicked = clickedIndex === index;
  
  // Scale based on focus and distance
  const focusScale = inFocus ? 1.15 : 0.85;
  const distanceScale = Math.max(0.7, 1 - (distance - 3) * 0.1);
  const finalScale = entranceProgress * focusScale * distanceScale;
  
  // Opacity based on distance (depth of field)
  const opacity = Math.max(0.4, Math.min(1, 1 - (distance - 4) * 0.15));
  
  if (!visibleIndices.has(index) && entranceProgress === 0) return null;
  
  return (
    <Float
      speed={1.5}
      rotationIntensity={0.3}
      floatIntensity={0.5}
    >
      <group 
        ref={itemRef}
        position={[x, y, z]}
        scale={finalScale}
        onPointerEnter={() => onHover(index)}
        onPointerLeave={() => onHover(null)}
        onClick={(e) => onClick(e, image, index)}
      >
              {/* Photo Frame with fade-in animation - Dynamic shape */}
              <mesh>
                {frameShape === 'circle' ? (
                  <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
                ) : frameShape === 'square' ? (
                  <boxGeometry args={[1.2, 1.2, 0.1]} />
                ) : frameShape === 'rectangle' ? (
                  <boxGeometry args={[1.4, 1.0, 0.1]} />
                ) : frameShape === 'diamond' ? (
                  <octahedronGeometry args={[0.85, 0]} />
                ) : frameShape === 'hexagon' ? (
                  <cylinderGeometry args={[0.6, 0.6, 0.1, 6]} />
                ) : (
                  <boxGeometry args={[1.2, 1.2, 0.1]} />
                )}
                <meshStandardMaterial 
                  color={isHovered ? "#fbbf24" : inFocus ? "#ffffff" : "#aaaaaa"}
                  emissive={isHovered ? "#fbbf24" : inFocus ? "#ffffff" : "#000000"}
                  emissiveIntensity={isHovered ? 0.8 : inFocus ? 0.3 : 0.1}
                  metalness={0.8}
                  roughness={0.2}
                  transparent
                  opacity={opacity * entranceProgress}
                />
              </mesh>
              
              {/* Photo Image with fade-in - Dynamic shape */}
              <mesh position={[0, 0, 0.06]}>
                {frameShape === 'rectangle' ? (
                  <planeGeometry args={[1.3, 0.9, 32, 32]} />
                ) : (
                  <planeGeometry args={[1, 1, 32, 32]} />
                )}
                <meshBasicMaterial 
                  transparent 
                  opacity={opacity * entranceProgress * (isClicked ? 0.7 : 1)}
                />
                <Html
                  transform
                  center
                  position={[0, 0, 0.01]}
                  distanceFactor={1.2}
                  style={{ pointerEvents: 'none' }}
                >
                  <div 
                    className={`overflow-hidden shadow-2xl border-2 transition-all duration-700 ${
                      frameShape === 'circle' ? 'w-32 h-32 md:w-40 md:h-40 rounded-full' :
                      frameShape === 'square' ? 'w-32 h-32 md:w-40 md:h-40 rounded-none' :
                      frameShape === 'rectangle' ? 'w-40 h-28 md:w-48 md:h-36 rounded-lg' :
                      frameShape === 'triangle' ? 'w-32 h-32 md:w-40 md:h-40' :
                      frameShape === 'diamond' ? 'w-32 h-32 md:w-40 md:h-40' :
                      frameShape === 'hexagon' ? 'w-32 h-32 md:w-40 md:h-40' :
                      'w-32 h-32 md:w-40 md:h-40 rounded-lg'
                    } ${
                      isHovered 
                        ? 'border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,1)] scale-110 brightness-110' 
                        : inFocus
                        ? 'border-white/70 shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-105 brightness-105'
                        : 'border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.2)] scale-100 brightness-90'
                    } ${isClicked ? 'scale-95' : ''}`}
                    style={{
                      cursor: 'pointer',
                      imageRendering: '-webkit-optimize-contrast' as any,
                      opacity: entranceProgress,
                      transform: `scale(${entranceProgress})`,
                      transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      // Dynamic clip-path for shapes
                      clipPath: frameShape === 'triangle' 
                        ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                        : frameShape === 'diamond'
                        ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                        : frameShape === 'hexagon'
                        ? 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                        : frameShape === 'star'
                        ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                        : 'none'
                    }}
                  >
                    <img 
                      src={image.url} 
                      alt={image.title}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1512474932049-78ea796b5f4d?q=80&w=400&auto=format&fit=crop";
                      }}
                    />
                  </div>
                </Html>
              </mesh>

              {/* Glow effect when hovered or in focus */}
              {(isHovered || inFocus) && (
                <mesh position={[0, 0, 0.05]}>
                  <ringGeometry args={[0.6, 0.8, 32]} />
                  <meshBasicMaterial 
                    color={isHovered ? "#fbbf24" : "#ffffff"} 
                    transparent 
                    opacity={isHovered ? 0.8 : 0.3 * opacity}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
              
              {/* Depth of field blur effect for distant photos */}
              {!inFocus && distance > 5 && (
                <mesh position={[0, 0, 0.04]}>
                  <planeGeometry args={[1.1, 1.1]} />
                  <meshBasicMaterial 
                    color="#000000" 
                    transparent 
                    opacity={0.2}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}

              {/* Enhanced sparkle particles when clicked */}
              {isClicked && (
                <>
                  {[...Array(12)].map((_, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const distance = 0.8 + Math.random() * 0.3;
                    return (
                      <mesh
                        key={i}
                        position={[
                          Math.cos(angle) * distance,
                          Math.sin(angle) * distance + Math.random() * 0.5,
                          0.1
                        ]}
                      >
                        <sphereGeometry args={[0.06, 8, 8]} />
                        <meshBasicMaterial 
                          color={["#fbbf24", "#f87171", "#60a5fa", "#ffffff"][i % 4]} 
                          transparent 
                          opacity={0.9}
                        />
                      </mesh>
                    );
                  })}
                  {/* Heart particles */}
                  {[...Array(6)].map((_, i) => {
                    const angle = (i / 6) * Math.PI * 2;
                    const distance = 0.6;
                    return (
                      <mesh
                        key={`heart-${i}`}
                        position={[
                          Math.cos(angle) * distance,
                          Math.sin(angle) * distance + 0.3,
                          0.15
                        ]}
                      >
                        <planeGeometry args={[0.15, 0.15]} />
                        <meshBasicMaterial 
                          color="#ec4899" 
                          transparent 
                          opacity={0.8}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    );
                  })}
                  {/* Glow ring burst */}
                  <mesh position={[0, 0, 0.05]}>
                    <ringGeometry args={[0.5, 1.2, 32]} />
                    <meshBasicMaterial 
                      color="#fbbf24" 
                      transparent 
                      opacity={0.4}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </>
              )}

              {/* Hint text on hover */}
              {isHovered && (
                <Html
                  position={[0, -0.8, 0]}
                  center
                  distanceFactor={1.5}
                >
                  <div className="bg-black/70 text-white text-xs md:text-sm px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm border border-yellow-400/50">
                    Click để xem kỷ niệm ✨
                  </div>
                </Html>
              )}
            </group>
          </Float>
  );
};

export default PhotoCarousel;

