import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface LanternProps {
    position: [number, number, number];
    color?: string;
    scale?: number;
    floatSpeed?: number;
    onClick?: () => void;
}

const Lantern: React.FC<LanternProps> = ({
    position,
    color = '#dc2626',
    scale = 1,
    floatSpeed = 1,
    onClick
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle swaying
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * floatSpeed) * 0.1;
        }
    });

    return (
        <Float
            speed={floatSpeed}
            rotationIntensity={0.3}
            floatIntensity={0.8}
            position={position}
        >
            <group
                ref={groupRef}
                scale={scale}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                {/* Lantern body - main cylinder */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.3, 0.4, 0.8, 12]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={hovered ? 1.5 : 0.8}
                        transparent
                        opacity={0.9}
                    />
                </mesh>

                {/* Top cap */}
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[0.15, 0.3, 0.2, 12]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>

                {/* Bottom cap */}
                <mesh position={[0, -0.5, 0]}>
                    <cylinderGeometry args={[0.35, 0.2, 0.15, 12]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>

                {/* Hanging rope */}
                <mesh position={[0, 0.7, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>

                {/* String loop at top */}
                <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.05, 0.015, 8, 12]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>

                {/* Inner glow light */}
                <pointLight
                    color={color}
                    intensity={hovered ? 3 : 1.5}
                    distance={3}
                    position={[0, 0, 0]}
                />

                {/* Decorative pattern - horizontal lines */}
                {[-0.2, 0, 0.2].map((y, i) => (
                    <mesh key={i} position={[0, y, 0]}>
                        <torusGeometry args={[0.35, 0.01, 8, 24]} />
                        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
                    </mesh>
                ))}
            </group>
        </Float>
    );
};

interface LanternFloatProps {
    count?: number;
    onLanternClick?: (message: string) => void;
}

const LANTERN_MESSAGES = [
    "Chúc năm mới an khang thịnh vượng! 🧧",
    "Yêu em mãi mãi ❤️",
    "Năm mới, tình yêu mới thăng hoa 💕",
    "Chúc em một năm đầy may mắn 🍀",
    "Mãi bên em qua mọi mùa xuân 🌸",
    "Hạnh phúc như ánh đèn lồng sáng 🏮"
];

const LanternFloat: React.FC<LanternFloatProps> = ({ count = 6, onLanternClick }) => {
    const lanternPositions: Array<{ pos: [number, number, number]; color: string; scale: number; speed: number }> = [
        { pos: [-5, 4, -3], color: '#dc2626', scale: 0.8, speed: 1.2 },
        { pos: [5, 5, -4], color: '#f59e0b', scale: 1, speed: 0.8 },
        { pos: [-3, 6, -5], color: '#dc2626', scale: 0.9, speed: 1 },
        { pos: [4, 3, -2], color: '#f59e0b', scale: 0.7, speed: 1.3 },
        { pos: [-6, 5, -6], color: '#dc2626', scale: 1.1, speed: 0.9 },
        { pos: [6, 6, -5], color: '#f59e0b', scale: 0.85, speed: 1.1 },
    ];

    const handleClick = () => {
        if (onLanternClick) {
            const randomMessage = LANTERN_MESSAGES[Math.floor(Math.random() * LANTERN_MESSAGES.length)];
            onLanternClick(randomMessage);
        }
    };

    return (
        <group>
            {lanternPositions.slice(0, count).map((lantern, i) => (
                <Lantern
                    key={i}
                    position={lantern.pos}
                    color={lantern.color}
                    scale={lantern.scale}
                    floatSpeed={lantern.speed}
                    onClick={handleClick}
                />
            ))}
        </group>
    );
};

export default LanternFloat;
