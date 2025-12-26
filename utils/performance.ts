// Performance utilities for adaptive quality
export const getPerformanceLevel = (): 'high' | 'medium' | 'low' => {
  // Check device capabilities
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency <= 4 || 
                   (navigator.deviceMemory && navigator.deviceMemory <= 4);
  
  if (isMobile || isLowEnd) {
    return 'low';
  }
  
  // Check GPU
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return 'low';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (renderer.includes('Intel') || renderer.includes('Mali')) {
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
      medium: 300,
      low: 150
    }[level],
    stars: {
      high: 5000,
      medium: 2000,
      low: 800
    }[level],
    fireworks: {
      high: 200,
      medium: 100,
      low: 50
    }[level],
    sparkles: {
      high: 300,
      medium: 150,
      low: 75
    }[level],
    enableBloom: level !== 'low',
    enableShadows: level === 'high',
    enableAurora: level !== 'low'
  };
};

