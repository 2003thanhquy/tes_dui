import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireworksProps {
  active: boolean;
  position: [number, number, number];
}

const Fireworks: React.FC<FireworksProps> = ({ active, position }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const launchRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);

  // Params - SLOW REALISTIC FIREWORKS (Adaptive for mobile)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const particleCount = isMobile ? 40 : 60; // Fewer particles on mobile
  const trailCount = isMobile ? 80 : 120; // Fewer trails on mobile
  const gravity = 0.6; // Slower gravity for slower fall
  const friction = 0.99; // More friction for slower movement
  const launchDuration = 4.0; // Slower launch - more time to see rocket
  const explosionDuration = 8.0; // Longer explosion - particles move slower
  const delayBetweenShots = 3.0; // Delay between each firework shot
  const totalCycle = launchDuration + explosionDuration + delayBetweenShots;

  // Local state to track cycle - Stagger fireworks so they don't all fire at once
  const [cycleOffset] = useState(() => Math.random() * (delayBetweenShots * 2));

  // Initial particle data - REALISTIC FIREWORK PATTERN
  const particleData = useMemo(() => {
    const data = [];
    // FESTIVE COLORS
    const colors = ['#ff0000', '#fbbf24', '#f472b6', '#22c55e', '#a855f7', '#06b6d4'];
    const baseColorIndex = Math.floor(Math.random() * colors.length);
    const baseColor = new THREE.Color(colors[baseColorIndex]);
    const secondaryColor = new THREE.Color(colors[(baseColorIndex + 1) % colors.length]);

    // Create realistic firework pattern: rays spreading out
    const rayCount = 12; // Number of main rays
    const particlesPerRay = Math.floor(particleCount / rayCount);
    
    for (let ray = 0; ray < rayCount; ray++) {
      const rayAngle = (ray / rayCount) * Math.PI * 2;
      const rayElevation = Math.PI / 2; // Horizontal spread
      
      for (let i = 0; i < particlesPerRay; i++) {
        // Spread along the ray
        const spreadFactor = 0.3 + (i / particlesPerRay) * 0.7;
        const speed = 3.0 + Math.random() * 2.0; // Faster initial speed
        
        // Main ray direction - Slower speed for more visible effect
        const speedMultiplier = 0.7; // Reduce speed by 30%
        const vx = speed * Math.cos(rayAngle) * spreadFactor * speedMultiplier;
        const vy = speed * Math.sin(rayAngle) * spreadFactor * speedMultiplier;
        const vz = (Math.random() - 0.5) * 0.5; // Slight vertical variation
        
        // Color variation along ray
        const colorMix = Math.random();
        const particleColor = baseColor.clone();
        particleColor.lerp(secondaryColor, colorMix * 0.5);

        data.push({
          vx,
          vy,
          vz,
          color: particleColor,
          rayIndex: ray
        });
      }
    }
    
    return { data, baseColor: baseColor };
  }, []);

  const dummy = new THREE.Object3D();
  const targetPos = new THREE.Vector3(...position);
  const startPos = new THREE.Vector3(targetPos.x, targetPos.y - 12, targetPos.z); // Start from ground (approx)

  // Initialize colors for all particles when component mounts or becomes active
  useEffect(() => {
    if (meshRef.current && active) {
      particleData.data.forEach((p, i) => {
        meshRef.current!.setColorAt(i, p.color);
      });
      
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [particleData, active]);

  // Trail particles for rocket
  const trailParticles = useRef<Array<{
    position: THREE.Vector3;
    life: number;
    maxLife: number;
  }>>([]);

  useFrame((state) => {
    if (!active || !meshRef.current || !launchRef.current) return;

    const time = state.clock.getElapsedTime() + cycleOffset;
    const cycleTime = time % totalCycle;

    // PHASE 0: DELAY - Wait before launching
    if (cycleTime < delayBetweenShots) {
      meshRef.current.visible = false;
      launchRef.current.visible = false;
      if (trailRef.current) trailRef.current.visible = false;
      return;
    }
    
    const adjustedCycleTime = cycleTime - delayBetweenShots;
    
    // PHASE 1: LAUNCH with trail
    if (adjustedCycleTime < launchDuration) {
      // Particles invisible
      meshRef.current.visible = false;
      launchRef.current.visible = true;
      if (trailRef.current) trailRef.current.visible = true;

      const t = adjustedCycleTime / launchDuration;
      const ease = 1 - (1 - t) * (1 - t);

      const currentPos = new THREE.Vector3().lerpVectors(startPos, targetPos, t);
      launchRef.current.position.copy(currentPos);
      launchRef.current.scale.set(0.08, 0.3 + ease * 0.2, 0.08); // Smaller rocket
      launchRef.current.lookAt(targetPos);

      // Set launch color
      (launchRef.current.material as THREE.MeshBasicMaterial).color = particleData.baseColor;
      (launchRef.current.material as THREE.MeshBasicMaterial).opacity = 1;

      // Update trail particles
      if (trailRef.current) {
        // Add new trail particle
        if (Math.random() > 0.7) {
          trailParticles.current.push({
            position: currentPos.clone(),
            life: 1.0,
            maxLife: 0.5
          });
        }

        // Update existing trails
        trailParticles.current = trailParticles.current.filter(trail => {
          trail.life -= state.delta * 2;
          return trail.life > 0;
        });

        // Update trail instances
        trailParticles.current.forEach((trail, i) => {
          if (i < trailCount) {
            const alpha = trail.life / trail.maxLife;
            dummy.position.copy(trail.position);
            dummy.scale.setScalar(0.03 * alpha);
            dummy.updateMatrix();
            trailRef.current!.setMatrixAt(i, dummy.matrix);
            const trailColor = particleData.baseColor.clone();
            trailColor.multiplyScalar(alpha);
            trailRef.current!.setColorAt(i, trailColor);
          }
        });

        if (trailRef.current.instanceMatrix) trailRef.current.instanceMatrix.needsUpdate = true;
        if (trailRef.current.instanceColor) trailRef.current.instanceColor.needsUpdate = true;
      }
    }
    // PHASE 2: EXPLODE - Realistic firework burst
    else {
      meshRef.current.visible = true;
      launchRef.current.visible = false;
      if (trailRef.current) trailRef.current.visible = false;

      const explosionTime = adjustedCycleTime - launchDuration;
      const progress = explosionTime / explosionDuration;

      if (progress >= 1) {
        meshRef.current.visible = false;
        trailParticles.current = []; // Clear trails
        return;
      }

      // Update particles - realistic firework pattern (SLOWER)
      particleData.data.forEach((p, i) => {
        // Realistic physics with friction - slower decay
        const effectiveSpeed = Math.pow(friction, explosionTime * 40); // Slower decay
        
        // Initial burst (slower) then slow down gradually
        const burstPhase = Math.min(explosionTime * 1.5, 0.5); // First 0.33 seconds (slower)
        const normalPhase = Math.max(0, explosionTime - 0.33);
        
        // Slower movement multiplier
        const movementMultiplier = 0.8; // Reduce overall speed
        const x = p.vx * (burstPhase * 1.5 + normalPhase * effectiveSpeed) * movementMultiplier;
        const y = p.vy * (burstPhase * 1.5 + normalPhase * effectiveSpeed) * movementMultiplier - (0.5 * gravity * explosionTime * explosionTime);
        const z = p.vz * (burstPhase * 1.5 + normalPhase * effectiveSpeed) * movementMultiplier;

        dummy.position.set(
          targetPos.x + x,
          targetPos.y + y,
          targetPos.z + z
        );

        // Smaller particles, fade out gradually
        const fadeStart = 0.6;
        const scaleProgress = progress < fadeStart 
          ? 1.0 
          : 1.0 - ((progress - fadeStart) / (1 - fadeStart));
        const scale = scaleProgress * 0.15; // Much smaller particles (realistic size)
        dummy.scale.setScalar(scale);

        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        
        // Fade color as particle dies
        const particleColor = p.color.clone();
        particleColor.multiplyScalar(scaleProgress);
        meshRef.current!.setColorAt(i, particleColor);
      });

      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* The Rocket (Launch phase) - Smaller */}
      <mesh ref={launchRef}>
        <cylinderGeometry args={[0.03, 0.06, 0.4, 8]} />
        <meshBasicMaterial color="#ffffff" transparent />
      </mesh>

      {/* Trail particles for rocket */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, trailCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial 
          toneMapped={false} 
          transparent 
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* The Explosion (Particles) - Smaller, realistic */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial 
          toneMapped={false} 
          transparent 
          opacity={1.0}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
};

export default Fireworks;
