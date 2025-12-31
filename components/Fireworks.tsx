import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireworksProps {
  active: boolean;
  position: [number, number, number];
}

const Fireworks: React.FC<FireworksProps> = ({ active, position }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const launchRef = useRef<THREE.Mesh>(null);

  // Params - TUNED FOR USER REQUEST (5-7 seconds total)
  const particleCount = 120; // Slightly increased for better volume
  const gravity = 1.0; // Reduced gravity for "floaty" feel (was 3.0)
  const friction = 0.98; // Less friction for wider expansion
  const launchDuration = 1.5; // Longer ascent (was 1.0)
  const explosionDuration = 5.0; // Much longer drift (was 2.0)
  const totalCycle = launchDuration + explosionDuration + Math.random() * 2;

  // Local state to track cycle
  const [cycleOffset] = useState(() => Math.random() * totalCycle);

  // Initial particle data (directions)
  const particleData = useMemo(() => {
    const data = [];
    // FESTIVE TET COLORS only
    const colors = ['#ff0000', '#fbbf24', '#f472b6', '#22c55e', '#a855f7', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const color = new THREE.Color(randomColor);

    for (let i = 0; i < particleCount; i++) {
      // Random sphere direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 2.0 + Math.random() * 3.5; // Stronger explosion force

      data.push({
        vx: speed * Math.sin(phi) * Math.cos(theta),
        vy: speed * Math.sin(phi) * Math.sin(theta),
        vz: speed * Math.cos(phi),
        color: color
      });
    }
    return { data, baseColor: color };
  }, []);

  const dummy = new THREE.Object3D();
  const targetPos = new THREE.Vector3(...position);
  const startPos = new THREE.Vector3(targetPos.x, targetPos.y - 12, targetPos.z); // Start from ground (approx)

  useFrame((state) => {
    if (!active || !meshRef.current || !launchRef.current) return;

    const time = state.clock.getElapsedTime() + cycleOffset;
    const cycleTime = time % totalCycle;

    // PHASE 1: LAUNCH
    if (cycleTime < launchDuration) {
      // Particles invisible
      meshRef.current.visible = false;
      launchRef.current.visible = true;

      const t = cycleTime / launchDuration;
      // Ease out quad for launch: starts fast, slows at top
      const ease = 1 - (1 - t) * (1 - t);

      launchRef.current.position.lerpVectors(startPos, targetPos, t);
      // Squish stretching effect
      launchRef.current.scale.set(0.1, 0.5 + ease * 0.5, 0.1);
      launchRef.current.lookAt(targetPos);

      // Set launch color
      (launchRef.current.material as THREE.MeshBasicMaterial).color = particleData.baseColor;
      (launchRef.current.material as THREE.MeshBasicMaterial).opacity = 1;

    }
    // PHASE 2: EXPLODE
    else {
      meshRef.current.visible = true;
      launchRef.current.visible = false;

      const explosionTime = cycleTime - launchDuration;
      const progress = explosionTime / explosionDuration; // 0 to 1

      if (progress >= 1) {
        meshRef.current.visible = false;
        return;
      }

      // Update particles
      particleData.data.forEach((p, i) => {
        // Physics: x = x0 + v*t + 0.5*a*t^2 (approximately)
        // Simple integration per frame is cleaner but formula is deterministic

        // Position relative to center (Explosion Origin)
        // Apply friction to velocity decay simulation
        const effectiveSpeed = Math.pow(friction, explosionTime * 60);

        const x = p.vx * explosionTime * effectiveSpeed * 2;
        const y = p.vy * explosionTime * effectiveSpeed * 2 - (0.5 * gravity * explosionTime * explosionTime);
        const z = p.vz * explosionTime * effectiveSpeed * 2;

        dummy.position.set(
          targetPos.x + x,
          targetPos.y + y,
          targetPos.z + z
        );

        // Scale down as they die
        const scale = (1 - progress) * 0.4;
        dummy.scale.setScalar(scale);

        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        meshRef.current!.setColorAt(i, p.color);
      });

      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* The Rocket (Launch phase) */}
      <mesh ref={launchRef}>
        <cylinderGeometry args={[0.05, 0.1, 0.5, 8]} />
        <meshBasicMaterial color="#ffffff" transparent />
      </mesh>

      {/* The Explosion (Particles) */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} vertexColors transparent />
      </instancedMesh>
    </group>
  );
};

export default Fireworks;
