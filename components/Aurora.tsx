import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

const AuroraMaterial = shaderMaterial(
  {
    time: 0,
    color1: new THREE.Color('#00ff88'),
    color2: new THREE.Color('#0088ff'),
    color3: new THREE.Color('#ff0088'),
  },
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      float wave1 = sin(vPosition.x * 0.1 + time * 0.5) * 0.5 + 0.5;
      float wave2 = sin(vPosition.x * 0.15 + time * 0.3 + 1.0) * 0.5 + 0.5;
      float wave3 = sin(vPosition.x * 0.2 + time * 0.4 + 2.0) * 0.5 + 0.5;
      
      vec3 color = mix(color1, color2, wave1);
      color = mix(color, color3, wave2 * 0.5);
      
      float alpha = wave3 * 0.3;
      alpha *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
      
      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ AuroraMaterial });

interface AuroraProps {
  intensity?: number;
}

const Aurora: React.FC<AuroraProps> = ({ intensity = 1 }) => {
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 8, -10]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 20, 50, 20]} />
      {/* @ts-ignore */}
      <auroraMaterial ref={materialRef} transparent side={THREE.DoubleSide} />
    </mesh>
  );
};

export default Aurora;

