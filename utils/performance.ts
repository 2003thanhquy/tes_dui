// Performance utilities for adaptive quality
export const getPerformanceLevel = (): 'high' | 'medium' | 'low' => {
  // Check device capabilities
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 4 || 
                   (navigator.deviceMemory && navigator.deviceMemory <= 4);
  
  // Check screen size (smaller = more likely low-end)
  const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 600;
  
  // Mobile detection - more aggressive
  if (isMobile) {
    // High-end mobile (iPhone 12+, flagship Android)
    const isHighEndMobile = 
      (navigator.deviceMemory && navigator.deviceMemory >= 6) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 6);
    
    if (isHighEndMobile && !isSmallScreen) {
      return 'medium'; // Allow medium quality on high-end mobile
    }
    return 'low'; // Most mobile = low
  }
  
  if (isLowEnd || isSmallScreen) {
    return 'low';
  }
  
  // Check GPU
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return 'low';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (renderer.includes('Intel') || renderer.includes('Mali') || renderer.includes('Adreno')) {
      return 'medium';
    }
  }
  
  return 'high';
};

export const getPerformanceConfig = () => {
  const level = getPerformanceLevel();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 600;
  
  // More aggressive optimization for mobile
  const isLowEndMobile = isMobile && (
    navigator.hardwareConcurrency <= 4 ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    isSmallScreen
  );
  
  return {
    snow: {
      high: 600,
      medium: 250,
      low: isLowEndMobile ? 60 : 100  // Even fewer particles on low-end mobile
    }[level],
    stars: {
      high: 5000,
      medium: 1500,
      low: isLowEndMobile ? 300 : 500  // Fewer stars on low-end mobile
    }[level],
    fireworks: {
      high: 200,
      medium: 80,
      low: isLowEndMobile ? 20 : 30  // Fewer fireworks on low-end mobile
    }[level],
    sparkles: {
      high: 300,
      medium: 100,
      low: isLowEndMobile ? 25 : 40  // Fewer sparkles on low-end mobile
    }[level],
    enableBloom: level === 'high' && !isMobile,  // Never on mobile
    enableShadows: level === 'high' && !isMobile,  // Never on mobile
    enableAurora: level === 'high' && !isMobile,  // Never on mobile
    enableContactShadows: level === 'high' && !isMobile,  // Never on mobile
    // Frame rate limiting - more aggressive on mobile
    targetFPS: {
      high: 60,
      medium: isMobile ? 30 : 45,  // Mobile medium = 30fps
      low: isLowEndMobile ? 24 : 30  // Low-end mobile = 24fps
    }[level],
    // 3D quality - more aggressive on mobile
    pixelRatio: {
      high: Math.min(window.devicePixelRatio, 2),
      medium: isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5),  // Mobile medium = 1x
      low: isLowEndMobile ? 0.75 : 1  // Low-end mobile = 0.75x
    }[level],
    // Carousel settings
    carouselImages: {
      high: 0,  // All
      medium: isMobile ? 3 : 7,  // Mobile medium = 3 images
      low: isLowEndMobile ? 2 : 4  // Low-end mobile = 2 images
    }[level],
    // Canvas performance
    performance: {
      high: 0.75,
      medium: isMobile ? 0.5 : 0.65,  // Mobile medium = lower performance target
      low: isLowEndMobile ? 0.4 : 0.5  // Low-end mobile = even lower
    }[level]
  };
};

