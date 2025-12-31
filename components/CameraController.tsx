import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  isDesktop: boolean;
}

const CameraController: React.FC<CameraControllerProps> = ({ isDesktop }) => {
  const { camera } = useThree();
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    
    const startPosition = isDesktop 
      ? new THREE.Vector3(0, 0, 12) // Far away, like closed card
      : new THREE.Vector3(0, 2, 18); // Mobile: xa hơn và cao hơn để thấy toàn bộ scene ngay từ đầu
    const endPosition = isDesktop
      ? new THREE.Vector3(0, 2, 9) // Final position
      : new THREE.Vector3(0, 2.5, 15); // Mobile: giữ vị trí xa để luôn thấy toàn bộ scene
    
    const startRotation = new THREE.Euler(0, 0, 0);
    const endRotation = new THREE.Euler(0, 0, 0);

    // Set initial position (far away, like card is closed)
    camera.position.copy(startPosition);
    camera.rotation.copy(startRotation);
    camera.lookAt(0, 0, 0);

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 2000; // 2 seconds
      const progress = Math.min(elapsed, 1);
      
      // Easing function (ease-out cubic)
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const eased = easeOutCubic(progress);

      // Interpolate position
      camera.position.lerpVectors(startPosition, endPosition, eased);
      
      // Slight rotation for card opening effect
      const currentRotation = new THREE.Euler(
        THREE.MathUtils.lerp(startRotation.x, endRotation.x, eased),
        THREE.MathUtils.lerp(startRotation.y, endRotation.y, eased),
        THREE.MathUtils.lerp(startRotation.z, endRotation.z, eased)
      );
      camera.rotation.copy(currentRotation);
      camera.lookAt(0, 0, 0);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        hasAnimatedRef.current = true;
      }
    };

    // Start animation after a brief delay
    setTimeout(() => {
      animate();
    }, 300);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera, isDesktop]);

  return null;
};

export default CameraController;

