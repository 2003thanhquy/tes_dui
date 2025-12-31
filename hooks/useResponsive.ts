import { useState, useEffect } from 'react';

export interface ResponsiveConfig {
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isSmallMobile: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

/**
 * Hook to detect responsive breakpoints and device info
 */
export const useResponsive = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    return {
      isDesktop: width >= 1024,
      isTablet: width >= 768 && width < 1024,
      isMobile: width < 768,
      isSmallMobile: width < 375,
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait'
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setConfig({
        isDesktop: width >= 1024,
        isTablet: width >= 768 && width < 1024,
        isMobile: width < 768,
        isSmallMobile: width < 375,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    // Throttle resize events for better performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', throttledResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', throttledResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return config;
};

