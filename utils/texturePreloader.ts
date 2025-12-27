/**
 * Texture Preloader for Three.js
 * Preload textures để tránh giật khi chuyển scene
 */

import * as THREE from 'three';

export interface TexturePreloadOptions {
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Preload multiple textures
 */
export async function preloadTextures(
  textureUrls: string[],
  options: TexturePreloadOptions = {}
): Promise<Map<string, THREE.Texture>> {
  const { onProgress, onComplete, onError } = options;
  const textures = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();
  
  let loaded = 0;
  const total = textureUrls.length;
  
  const loadPromises = textureUrls.map((url, index) => {
    return new Promise<void>((resolve, reject) => {
      loader.load(
        url,
        (texture) => {
          texture.name = url;
          textures.set(url, texture);
          loaded++;
          
          if (onProgress) {
            onProgress(loaded, total);
          }
          
          if (loaded === total && onComplete) {
            onComplete();
          }
          
          resolve();
        },
        undefined,
        (error) => {
          if (onError) {
            onError(error);
          }
          reject(error);
        }
      );
    });
  });
  
  await Promise.all(loadPromises);
  return textures;
}

/**
 * Preload images for HTML/CSS use
 */
export async function preloadImages(
  imageUrls: string[],
  options: { onProgress?: (loaded: number, total: number) => void } = {}
): Promise<HTMLImageElement[]> {
  const { onProgress } = options;
  const images: HTMLImageElement[] = [];
  let loaded = 0;
  const total = imageUrls.length;
  
  const loadPromises = imageUrls.map((url) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        loaded++;
        if (onProgress) {
          onProgress(loaded, total);
        }
        resolve(img);
      };
      
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });
  
  const results = await Promise.all(loadPromises);
  images.push(...results);
  return images;
}

/**
 * Create texture from image with caching
 */
const textureCache = new Map<string, THREE.Texture>();

export function getCachedTexture(
  url: string,
  loader: THREE.TextureLoader
): THREE.Texture {
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }
  
  const texture = loader.load(url);
  textureCache.set(url, texture);
  return texture;
}

