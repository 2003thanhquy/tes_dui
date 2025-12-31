import React from 'react';

interface NavigationBarProps {
    currentPage: 'noel' | 'tet';
    onNavigate: (page: 'noel' | 'tet') => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ currentPage, onNavigate }) => {
    return (
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto safe-area-bottom nav-mobile">
            <div className="flex items-center gap-1 sm:gap-2 bg-black/50 backdrop-blur-xl rounded-full p-1 sm:p-1.5 border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                {/* Noel Button */}
                <button
                    onClick={() => onNavigate('noel')}
                    className={`
            relative flex items-center gap-2 px-4 py-2.5 rounded-full font-vibes text-sm md:text-base
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            touch-manipulation min-h-[44px]
            ${currentPage === 'noel'
                            ? 'bg-gradient-to-r from-green-600 to-red-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
          `}
                >
                    <span className="text-xl">🎄</span>
                    <span className="hidden sm:inline">Giáng Sinh</span>
                    {currentPage === 'noel' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                    )}
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-white/20" />

                {/* Tet Button */}
                <button
                    onClick={() => onNavigate('tet')}
                    className={`
            relative flex items-center gap-2 px-4 py-2.5 rounded-full font-vibes text-sm md:text-base
            transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            touch-manipulation min-h-[44px]
            ${currentPage === 'tet'
                            ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
          `}
                >
                    <span className="text-xl">🧧</span>
                    <span className="hidden sm:inline">Tết 2026</span>
                    {currentPage === 'tet' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
                    )}
                </button>
            </div>
        </nav>
    );
};

export default NavigationBar;
