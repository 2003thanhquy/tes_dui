import React from 'react';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  progress = 0, 
  message = "Đang tải scene 3D..." 
}) => {
  return (
    <div className="fixed inset-0 z-[300] bg-gradient-to-b from-[#0a0a1a] via-[#1a0a2e] to-[#2d1b4e] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Christmas Tree */}
        <div className="mb-8 relative">
          <div className="text-6xl md:text-8xl animate-bounce">🎄</div>
          <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
          <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
        </div>
        
        {/* Loading Text */}
        <h2 className="font-vibes text-2xl md:text-4xl text-white mb-4 animate-pulse">
          {message}
        </h2>
        
        {/* Progress Bar */}
        <div className="w-64 md:w-80 h-2 bg-white/20 rounded-full overflow-hidden mx-auto mb-4">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-red-600 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
        
        {/* Progress Percentage */}
        <p className="text-white/70 text-sm md:text-base">
          {Math.round(progress)}%
        </p>
        
        {/* Loading Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

