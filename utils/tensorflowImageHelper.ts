/**
 * TensorFlow.js Image Helper
 * Utilities để làm việc với ảnh và TensorFlow.js trong context của Noel Yêu Thương 3D
 */

import * as THREE from 'three';

/**
 * Standard image sizes for TensorFlow.js models
 */
export const TENSOR_SIZES = {
  SMALL: 64,
  MEDIUM: 128,
  LARGE: 224,
  XLARGE: 512
} as const;

/**
 * Preprocess image for gesture recognition model
 * Đảm bảo ảnh có cùng format với training data
 */
export async function preprocessForGestureModel(
  imageUrl: string,
  targetSize: number = TENSOR_SIZES.MEDIUM
): Promise<ImageData> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Fill with consistent background (similar to training data)
      ctx.fillStyle = '#1a1a2e'; // Dark background similar to scene
      ctx.fillRect(0, 0, targetSize, targetSize);
      
      // Center and scale image maintaining aspect ratio
      const scale = Math.min(
        targetSize / img.width,
        targetSize / img.height
      ) * 0.9; // Slightly smaller to add padding
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (targetSize - scaledWidth) / 2;
      const y = (targetSize - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      resolve(ctx.getImageData(0, 0, targetSize, targetSize));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Capture current 3D scene view for training
 * Đảm bảo góc nhìn và scale tương đối giống training data
 */
export function captureSceneView(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  targetSize: number = TENSOR_SIZES.MEDIUM
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Render to temporary canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = renderer.domElement.width;
  tempCanvas.height = renderer.domElement.height;
  
  // Get current render
  const imageData = renderer.domElement.getContext('2d')?.getImageData(
    0, 0,
    renderer.domElement.width,
    renderer.domElement.height
  );
  
  if (!imageData) {
    throw new Error('Could not capture scene');
  }
  
  // Draw to temp canvas
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0);
    
    // Resize to target size
    ctx.drawImage(tempCanvas, 0, 0, targetSize, targetSize);
  }
  
  return ctx.getImageData(0, 0, targetSize, targetSize);
}

/**
 * Normalize camera position and angle for consistent training data
 */
export function normalizeCameraForTraining(
  camera: THREE.Camera,
  targetDistance: number = 10,
  targetAngle: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): void {
  // Set consistent distance
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.position.set(
      targetDistance * Math.sin(targetAngle.y) * Math.cos(targetAngle.x),
      targetDistance * Math.sin(targetAngle.x),
      targetDistance * Math.cos(targetAngle.y) * Math.cos(targetAngle.x)
    );
    camera.lookAt(0, 0, 0);
  }
}

/**
 * Create dataset from scene frames
 * Gom nhiều ảnh thành dataset để training
 */
export async function createDatasetFromFrames(
  frameUrls: string[],
  targetSize: number = TENSOR_SIZES.MEDIUM
): Promise<ImageData[]> {
  const preprocessed = await Promise.all(
    frameUrls.map(url => preprocessForGestureModel(url, targetSize))
  );
  return preprocessed;
}

