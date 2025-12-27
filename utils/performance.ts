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
  
  return {
    snow: {
      high: 600,
      medium: 250,
      low: 100  // Giảm từ 150 xuống 100 cho mobile mượt hơn
    }[level],
    stars: {
      high: 5000,
      medium: 1500,
      low: 500  // Giảm từ 800 xuống 500
    }[level],
    fireworks: {
      high: 200,
      medium: 80,
      low: 30  // Giảm từ 50 xuống 30
    }[level],
    sparkles: {
      high: 300,
      medium: 100,
      low: 40  // Giảm từ 75 xuống 40
    }[level],
    enableBloom: level === 'high',  // Chỉ bật trên desktop high-end
    enableShadows: level === 'high',
    enableAurora: level === 'high',  // Tắt trên mobile để mượt hơn
    enableContactShadows: level === 'high',
    // Frame rate limiting
    targetFPS: {
      high: 60,
      medium: 45,
      low: 30  // Giới hạn 30fps cho mobile
    }[level],
    // 3D quality
    pixelRatio: {
      high: Math.min(window.devicePixelRatio, 2),  // Max 2x
      medium: Math.min(window.devicePixelRatio, 1.5),  // Max 1.5x
      low: 1  // 1x cho mobile
    }[level],
    // Carousel settings
    carouselImages: {
      high: 0,  // All
      medium: 7,
      low: 4  // Chỉ 4 ảnh trên mobile
    }[level]
  };
};

