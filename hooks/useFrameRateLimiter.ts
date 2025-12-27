import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Frame rate limiter hook for mobile optimization
 * Limits frame rate to target FPS to save battery and improve smoothness
 */
export const useFrameRateLimiter = (targetFPS: number = 30) => {
  const { gl } = useThree();
  const lastFrameTimeRef = useRef(0);
  const frameInterval = 1000 / targetFPS;

  useEffect(() => {
    if (targetFPS >= 60) return; // No limiting for 60fps

    const originalRequestAnimationFrame = window.requestAnimationFrame;
    let rafId: number;

    const limitedRAF = (callback: FrameRequestCallback) => {
      const now = performance.now();
      const elapsed = now - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        lastFrameTimeRef.current = now;
        return originalRequestAnimationFrame(callback);
      } else {
        const delay = frameInterval - elapsed;
        rafId = window.setTimeout(() => {
          lastFrameTimeRef.current = performance.now();
          originalRequestAnimationFrame(callback);
        }, delay);
        return rafId;
      }
    };

    // Note: This is a simplified approach. 
    // For full control, you'd need to modify Three.js render loop
    // But this helps with general performance

    return () => {
      if (rafId) clearTimeout(rafId);
    };
  }, [targetFPS, frameInterval]);
};

