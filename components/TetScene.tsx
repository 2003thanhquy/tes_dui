import React, { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, ContactShadows, Float, Text, Center } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Fireworks from './Fireworks';
import Aurora from './Aurora';
import LanternFloat from './LanternFloat';
import PetalFall from './PetalFall';
import PhotoCarousel from './PhotoCarousel';
import HeartPhotoFrame from './HeartPhotoFrame';
import CameraController from './CameraController';
import { getPerformanceConfig } from '../utils/performance';
import { GalleryImage } from '../utils/imageLoader';

interface TetSceneProps {
    isDesktop: boolean;
    showFireworks?: boolean;
    windDirection: [number, number];
    onLanternClick?: (message: string) => void;
    heartPhotoUrl?: string;
    onHeartPhotoClick?: () => void;
    currentHeartPhotoIndex?: number;
    carouselImages?: GalleryImage[];
    onCarouselPhotoClick?: (image: GalleryImage) => void;
    carouselRadius?: number;
}

// Lucky Red Envelope 3D (Lì xì)
const LuckyEnvelope: React.FC<{
    position: [number, number, number];
    onOpen?: () => void;
}> = ({ position, onOpen }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
            <group
                position={position}
                onClick={onOpen}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                scale={hovered ? 1.2 : 1}
            >
                {/* Envelope body */}
                <mesh>
                    <boxGeometry args={[1.2, 1.8, 0.1]} />
                    <meshStandardMaterial
                        color="#dc2626"
                        emissive="#7f1d1d"
                        emissiveIntensity={hovered ? 1 : 0.3}
                    />
                </mesh>

                {/* Gold border */}
                <mesh position={[0, 0, 0.051]}>
                    <planeGeometry args={[1.1, 1.7]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        emissive="#f59e0b"
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.3}
                    />
                </mesh>

                {/* Gold decoration - "Phúc" character pattern */}
                <mesh position={[0, 0.2, 0.06]}>
                    <circleGeometry args={[0.35, 32]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        emissive="#f59e0b"
                        emissiveIntensity={0.8}
                    />
                </mesh>

                {/* Inner circle */}
                <mesh position={[0, 0.2, 0.065]}>
                    <ringGeometry args={[0.2, 0.25, 32]} />
                    <meshStandardMaterial
                        color="#dc2626"
                        emissive="#7f1d1d"
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* Glow effect */}
                <pointLight
                    color="#fbbf24"
                    intensity={hovered ? 2 : 0.5}
                    distance={3}
                />
            </group>
        </Float>
    );
};

// Bánh chưng decoration
const BanhChung: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <group position={position}>
                {/* Main body - cube */}
                <mesh>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshStandardMaterial color="#22c55e" />
                </mesh>

                {/* Banana leaf wrapping - lines */}
                {[-0.1, 0.1].map((offset, i) => (
                    <mesh key={i} position={[0, offset, 0.251]}>
                        <planeGeometry args={[0.5, 0.05]} />
                        <meshStandardMaterial color="#166534" />
                    </mesh>
                ))}

                {/* String */}
                <mesh position={[0, 0, 0.26]} rotation={[0, 0, Math.PI / 4]}>
                    <planeGeometry args={[0.7, 0.02]} />
                    <meshStandardMaterial color="#a16207" />
                </mesh>
                <mesh position={[0, 0, 0.26]} rotation={[0, 0, -Math.PI / 4]}>
                    <planeGeometry args={[0.7, 0.02]} />
                    <meshStandardMaterial color="#a16207" />
                </mesh>
            </group>
        </Float>
    );
};

// 3D Text "TRÂN" with special effects using drei Text

const TranText3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.8}>
            <group
                position={position}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                scale={hovered ? 1.1 : 1}
            >
                {/* Background glow sphere */}
                <mesh>
                    <sphereGeometry args={[2.2, 32, 32]} />
                    <meshStandardMaterial
                        color="#dc2626"
                        emissive="#991b1b"
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.15}
                    />
                </mesh>

                {/* 3D Text TRÂN - LARGER */}
                <Center>
                    <Text
                        fontSize={2.5}
                        color="#fbbf24"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.1}
                        outlineColor="#dc2626"
                        letterSpacing={0.1}
                    >
                        TRÂN
                        <meshStandardMaterial
                            color="#fbbf24"
                            emissive="#f59e0b"
                            emissiveIntensity={hovered ? 4 : 2}
                            metalness={0.9}
                            roughness={0.1}
                        />
                    </Text>
                </Center>

                {/* Heart symbols around */}
                <Center position={[0, -1.8, 0]}>
                    <Text fontSize={0.8} anchorX="center" anchorY="middle">
                        ❤️ YÊU EM ❤️
                        <meshStandardMaterial color="#f472b6" emissive="#ec4899" emissiveIntensity={1.5} />
                    </Text>
                </Center>

                {/* Decorative glowing ring around text */}
                <mesh rotation={[0, 0, 0]}>
                    <torusGeometry args={[2.5, 0.05, 16, 100]} />
                    <meshStandardMaterial
                        color="#f472b6"
                        emissive="#ec4899"
                        emissiveIntensity={2}
                        transparent
                        opacity={0.8}
                    />
                </mesh>

                {/* Orbiting particles */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i / 12) * Math.PI * 2;
                    const radius = 2.8;
                    return (
                        <Float key={i} speed={3} floatIntensity={0.3}>
                            <mesh position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}>
                                <sphereGeometry args={[0.08, 8, 8]} />
                                <meshStandardMaterial
                                    color={i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f472b6" : "#dc2626"}
                                    emissive={i % 3 === 0 ? "#f59e0b" : i % 3 === 1 ? "#ec4899" : "#991b1b"}
                                    emissiveIntensity={2}
                                />
                            </mesh>
                        </Float>
                    );
                })}

                {/* Glow lights */}
                <pointLight
                    color="#fbbf24"
                    intensity={hovered ? 8 : 4}
                    distance={10}
                />
                <pointLight
                    color="#f472b6"
                    intensity={hovered ? 4 : 2}
                    distance={6}
                    position={[0, 0, 2]}
                />
            </group>
        </Float>
    );
};

const TetScene: React.FC<TetSceneProps> = ({
    isDesktop,
    showFireworks = false,
    windDirection,
    onLanternClick,
    heartPhotoUrl,
    onHeartPhotoClick,
    currentHeartPhotoIndex = 0,
    carouselImages = [],
    onCarouselPhotoClick,
    carouselRadius = 4.5
}) => {
    const [fireworksPositions] = useState<Array<[number, number, number]>>([
        [0, 4, 0],
        [-3, 5, -2],
        [3, 5, 2],
        [-2, 6, 1],
        [2, 6, -1]
    ]);

    const perfConfig = useMemo(() => getPerformanceConfig(), []);

    return (
        <div className="w-full h-full absolute inset-0 z-0 bg-gradient-to-b from-[#1a0505] via-[#2d0a0a] to-[#3d1010]">
            <Canvas
                shadows={perfConfig.enableShadows}
                camera={{ position: isDesktop ? [0, 0, 12] : [0, 0, 16], fov: isDesktop ? 50 : 65 }} // Mobile: xa hơn, góc rộng hơn
                dpr={perfConfig.pixelRatio}
                frameloop="always"
                performance={{ min: 0.75 }}
            >
                <color attach="background" args={['#1a0505']} />
                <fog attach="fog" args={['#1a0505', 8, 25]} />

                <CameraController isDesktop={isDesktop} />

                {/* Warm Tet Lighting */}
                <ambientLight intensity={0.4} color="#fef3c7" />
                <spotLight position={[0, 8, 5]} angle={0.4} penumbra={1} intensity={12} castShadow color="#fbbf24" />
                <pointLight position={[-5, 3, -5]} intensity={6} color="#f87171" />
                <pointLight position={[5, 3, -5]} intensity={6} color="#fbbf24" />
                <pointLight position={[0, -3, 3]} intensity={4} color="#ef4444" />
                <directionalLight position={[0, 10, 5]} intensity={0.4} color="#fef3c7" />

                <Suspense fallback={null}>
                    {/* Aurora with warm colors */}
                    {perfConfig.enableAurora && <Aurora intensity={0.6} />}

                    {/* Floating Lanterns */}
                    <LanternFloat count={isDesktop ? 6 : 4} onLanternClick={onLanternClick} />

                    {/* Lucky Envelopes (Lì xì) - Scaled down for mobile */}
                    <group scale={isDesktop ? 1 : 0.7}>
                        <LuckyEnvelope
                            position={isDesktop ? [-3, -0.5, 2] : [-2.5, -2, 1]}
                            onOpen={() => onLanternClick?.("Chúc mừng năm mới! 🧧💰")}
                        />
                    </group>

                    {/* Bánh chưng decorations - Adjusted for mobile */}
                    <group scale={isDesktop ? 1 : 0.8}>
                        <BanhChung position={isDesktop ? [3, -1, 1.5] : [2.5, -2.5, 1]} />
                        <BanhChung position={isDesktop ? [-4, -1.2, 0.5] : [-3.5, -3, 0]} />
                    </group>

                    {/* TRÂN - Special text effect - Mobile: Higher to avoid overlap */}
                    <group scale={isDesktop ? 1 : 0.8}>
                        <TranText3D position={isDesktop ? [0, 3.5, 3] : [0, 4, 1]} />
                    </group>

                    {/* Heart Photo Frame */}
                    {heartPhotoUrl && (
                        <group scale={isDesktop ? 1 : 0.8}>
                            <HeartPhotoFrame
                                position={isDesktop ? [3, 1.5, -2] : [2.5, 2.5, -2]}
                                imageUrl={heartPhotoUrl}
                                onPhotoClick={onHeartPhotoClick}
                                currentIndex={currentHeartPhotoIndex}
                                totalImages={5}
                            />
                        </group>
                    )}

                    {/* Photo Carousel - Mobile: Smaller radius, pushed back */}
                    {carouselImages.length > 0 && onCarouselPhotoClick && (
                        <PhotoCarousel
                            images={perfConfig.carouselImages > 0 ? carouselImages.slice(0, perfConfig.carouselImages) : carouselImages}
                            onPhotoClick={onCarouselPhotoClick}
                            radius={isDesktop ? carouselRadius : 3.5} // Mobile radius smaller
                            height={isDesktop ? 2 : 1.2}
                            speed={0.3}
                            enableRotation={true}
                            position={isDesktop ? [0, 2, -3] : [0, 1, -4]} // Pushed back on mobile
                            enableFloating={true}
                        />
                    )}

                    {/* Fireworks */}
                    {showFireworks && fireworksPositions.map((pos, i) => (
                        <Fireworks key={i} active={showFireworks} position={pos} />
                    ))}

                    {/* Petal Fall (thay thế Snow) */}
                    <PetalFall count={perfConfig.snow} wind={windDirection} />

                    {/* Stars */}
                    <Stars
                        radius={100}
                        depth={50}
                        count={perfConfig.stars}
                        factor={isDesktop ? 6 : 5}
                        saturation={1.5}
                        fade
                        speed={1.5}
                    />

                    {/* Decorative floating orbs */}
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                        <mesh position={[4, 3, -5]}>
                            <sphereGeometry args={[0.3, 16, 16]} />
                            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} />
                        </mesh>
                    </Float>
                    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
                        <mesh position={[-4, 4, -4]}>
                            <sphereGeometry args={[0.25, 16, 16]} />
                            <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={2} />
                        </mesh>
                    </Float>

                    <Environment preset="sunset" />
                    {perfConfig.enableContactShadows && (
                        <ContactShadows position={[0, -4, 0]} opacity={0.6} scale={20} blur={3} far={4} color="#1a0505" />
                    )}
                </Suspense>

                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={7}
                    maxDistance={15}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.8}
                    autoRotate
                    autoRotateSpeed={0.3}
                    enableDamping={true}
                    dampingFactor={0.05}
                />

                {perfConfig.enableBloom && (
                    <EffectComposer>
                        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.8} radius={0.7} />
                        <Vignette eskil={false} offset={0.1} darkness={1.2} />
                    </EffectComposer>
                )}
            </Canvas>
        </div>
    );
};

export default TetScene;
