/**
 * Scene Transition Manager
 * Quản lý crossfade và chuyển scene mượt mà
 */

import * as THREE from 'three';

export interface SceneTransitionOptions {
  duration?: number; // milliseconds
  easing?: (t: number) => number;
  onStart?: () => void;
  onComplete?: () => void;
}

/**
 * Crossfade between two scenes
 */
export function crossfadeScenes(
  scene1: THREE.Scene,
  scene2: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  options: SceneTransitionOptions = {}
): Promise<void> {
  const {
    duration = 1000,
    easing = (t: number) => t * (2 - t), // ease-out
    onStart,
    onComplete
  } = options;

  return new Promise((resolve) => {
    if (onStart) onStart();
    
    const startTime = Date.now();
    const fadeOutMaterial = new THREE.MeshBasicMaterial({ transparent: true });
    const fadeInMaterial = new THREE.MeshBasicMaterial({ transparent: true });
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easing(progress);
      
      // Fade out scene1
      scene1.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => {
              if (mat instanceof THREE.MeshBasicMaterial || mat instanceof THREE.MeshStandardMaterial) {
                mat.opacity = 1 - eased;
                mat.transparent = true;
              }
            });
          } else {
            const mat = object.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
            mat.opacity = 1 - eased;
            mat.transparent = true;
          }
        }
      });
      
      // Fade in scene2
      scene2.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => {
              if (mat instanceof THREE.MeshBasicMaterial || mat instanceof THREE.MeshStandardMaterial) {
                mat.opacity = eased;
                mat.transparent = true;
              }
            });
          } else {
            const mat = object.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
            mat.opacity = eased;
            mat.transparent = true;
          }
        }
      });
      
      // Render both scenes
      renderer.autoClear = false;
      renderer.clear();
      renderer.render(scene1, camera);
      renderer.render(scene2, camera);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        renderer.autoClear = true;
        if (onComplete) onComplete();
        resolve();
      }
    };
    
    animate();
  });
}

/**
 * Smooth scene update loop (60fps = 16.67ms per frame)
 */
export class SmoothSceneLoop {
  private animationId: number | null = null;
  private lastTime: number = 0;
  private targetFPS: number = 60;
  private frameTime: number = 1000 / this.targetFPS; // ~16.67ms
  
  constructor(
    private updateCallback: (delta: number) => void,
    private renderCallback: () => void
  ) {}
  
  start() {
    this.lastTime = performance.now();
    this.animate();
  }
  
  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  private animate = () => {
    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;
    
    // Throttle to target FPS
    if (delta >= this.frameTime) {
      this.updateCallback(delta);
      this.renderCallback();
      this.lastTime = currentTime - (delta % this.frameTime);
    }
    
    this.animationId = requestAnimationFrame(this.animate);
  };
  
  setTargetFPS(fps: number) {
    this.targetFPS = fps;
    this.frameTime = 1000 / fps;
  }
}

/**
 * Scene frame manager - manages scene display timing
 */
export class SceneFrameManager {
  private currentSceneIndex = 0;
  private sceneDisplayTime = 3000; // 3 seconds per scene
  private lastUpdateTime = Date.now();
  
  constructor(
    private scenes: THREE.Scene[],
    private onSceneChange: (index: number) => void
  ) {}
  
  update() {
    const now = Date.now();
    const elapsed = now - this.lastUpdateTime;
    
    if (elapsed >= this.sceneDisplayTime) {
      this.currentSceneIndex = (this.currentSceneIndex + 1) % this.scenes.length;
      this.onSceneChange(this.currentSceneIndex);
      this.lastUpdateTime = now;
    }
  }
  
  setDisplayTime(ms: number) {
    this.sceneDisplayTime = ms;
  }
  
  getCurrentSceneIndex(): number {
    return this.currentSceneIndex;
  }
}

