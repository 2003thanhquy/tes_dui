import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PetalFallProps {
    count?: number;
    wind?: [number, number];
}

const PetalFall: React.FC<PetalFallProps> = ({ count = 100, wind = [0, 0] }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const particles = useRef<Array<{
        position: THREE.Vector3;
        velocity: THREE.Vector3;
        rotation: number;
        rotationSpeed: number;
        isGolden: boolean;
    }>>([]);
    const dummy = new THREE.Object3D();

    // Initialize particles
    if (particles.current.length === 0) {
        for (let i = 0; i < count; i++) {
            // 2-3 cánh hoa vàng (may mắn - easter egg)
            const isGolden = i < 3 && Math.random() > 0.5;
            particles.current.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 15 + 8,
                    (Math.random() - 0.5) * 20
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    -0.02 - Math.random() * 0.03,
                    (Math.random() - 0.5) * 0.02
                ),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1,
                isGolden
            });
        }
    }

    useFrame((state) => {
        if (!mesh.current) return;

        particles.current.forEach((particle, i) => {
            // Apply wind
            particle.position.x += wind[0] * 0.03;
            particle.position.z += wind[1] * 0.03;

            // Natural movement
            particle.position.add(particle.velocity);

            // Swaying motion (like real petals)
            particle.position.x += Math.sin(state.clock.elapsedTime * 2 + i) * 0.01;
            particle.position.z += Math.cos(state.clock.elapsedTime * 1.5 + i * 0.5) * 0.008;

            // Rotation
            particle.rotation += particle.rotationSpeed;

            // Reset if out of bounds
            if (particle.position.y < -5) {
                particle.position.y = 10 + Math.random() * 5;
                particle.position.x = (Math.random() - 0.5) * 20;
                particle.position.z = (Math.random() - 0.5) * 20;
            }

            dummy.position.copy(particle.position);
            dummy.rotation.set(
                particle.rotation,
                particle.rotation * 0.5,
                Math.sin(state.clock.elapsedTime + i) * 0.3
            );
            dummy.scale.setScalar(particle.isGolden ? 0.12 : 0.08);
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });

        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            {/* Petal shape - flat ellipse */}
            <circleGeometry args={[1, 6]} />
            <meshBasicMaterial
                color="#fecdd3" // Pink petal color
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    );
};

export default PetalFall;
