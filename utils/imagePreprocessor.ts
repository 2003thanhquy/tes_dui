/**
 * Image Preprocessor for TensorFlow.js
 * Chuẩn bị ảnh cho training/inference với TensorFlow.js
 */

export interface ImagePreprocessOptions {
  targetSize?: number; // 64, 128, 224, etc.
  maintainAspectRatio?: boolean;
  normalize?: boolean; // Normalize pixel values to [0, 1]
  grayscale?: boolean;
}

/**
 * Resize image to target size for TensorFlow.js
 */
export async function preprocessImage(
  imageUrl: string,
  options: ImagePreprocessOptions = {}
): Promise<ImageData> {
  const {
    targetSize = 224,
    maintainAspectRatio = true,
    normalize = true,
    grayscale = false
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate dimensions
        let width = targetSize;
        let height = targetSize;
        
        if (maintainAspectRatio) {
          const aspectRatio = img.width / img.height;
          if (aspectRatio > 1) {
            height = Math.round(targetSize / aspectRatio);
          } else {
            width = Math.round(targetSize * aspectRatio);
          }
        }

        canvas.width = targetSize;
        canvas.height = targetSize;
        
        // Fill with black background (or white if needed)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetSize, targetSize);
        
        // Center and draw image
        const x = (targetSize - width) / 2;
        const y = (targetSize - height) / 2;
        ctx.drawImage(img, x, y, width, height);
        
        // Convert to grayscale if needed
        if (grayscale) {
          const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
            // Alpha stays the same
          }
          ctx.putImageData(imageData, 0, 0);
        }
        
        const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
        resolve(imageData);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Convert ImageData to TensorFlow.js tensor
 */
export function imageDataToTensor(
  imageData: ImageData,
  normalize: boolean = true
): any {
  // This requires TensorFlow.js to be loaded
  if (typeof window === 'undefined' || !(window as any).tf) {
    throw new Error('TensorFlow.js is not loaded');
  }

  const tf = (window as any).tf;
  const { data, width, height } = imageData;
  
  // Convert to array
  const pixels = new Float32Array(width * height * 3);
  
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (normalize) {
      pixels[pixelIndex * 3] = r / 255.0;
      pixels[pixelIndex * 3 + 1] = g / 255.0;
      pixels[pixelIndex * 3 + 2] = b / 255.0;
    } else {
      pixels[pixelIndex * 3] = r;
      pixels[pixelIndex * 3 + 1] = g;
      pixels[pixelIndex * 3 + 2] = b;
    }
  }
  
  // Reshape to [1, height, width, 3] for TensorFlow.js
  return tf.tensor4d(pixels, [1, height, width, 3]);
}

/**
 * Batch preprocess multiple images
 */
export async function preprocessImageBatch(
  imageUrls: string[],
  options: ImagePreprocessOptions = {}
): Promise<ImageData[]> {
  const results = await Promise.all(
    imageUrls.map(url => preprocessImage(url, options))
  );
  return results;
}

/**
 * Create sprite sheet from multiple images
 */
export async function createSpriteSheet(
  imageUrls: string[],
  spriteSize: number = 224,
  columns: number = 4
): Promise<string> {
  const canvas = document.createElement('canvas');
  const rows = Math.ceil(imageUrls.length / columns);
  canvas.width = columns * spriteSize;
  canvas.height = rows * spriteSize;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Fill with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Load and draw each image
  const imagePromises = imageUrls.map((url, index) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = col * spriteSize;
        const y = row * spriteSize;
        
        // Center and draw image
        const scale = Math.min(spriteSize / img.width, spriteSize / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (spriteSize - scaledWidth) / 2;
        const offsetY = (spriteSize - scaledHeight) / 2;
        
        ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
        resolve();
      };
      
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });
  
  await Promise.all(imagePromises);
  
  // Return as data URL
  return canvas.toDataURL('image/png');
}

/**
 * Extract sprite from sprite sheet
 */
export function extractSprite(
  spriteSheet: HTMLImageElement | HTMLCanvasElement,
  spriteIndex: number,
  spriteSize: number,
  columns: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = spriteSize;
  canvas.height = spriteSize;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  const col = spriteIndex % columns;
  const row = Math.floor(spriteIndex / columns);
  const x = col * spriteSize;
  const y = row * spriteSize;
  
  ctx.drawImage(
    spriteSheet,
    x, y, spriteSize, spriteSize,
    0, 0, spriteSize, spriteSize
  );
  
  return ctx.getImageData(0, 0, spriteSize, spriteSize);
}

