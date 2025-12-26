import React, { useState, useEffect, useRef } from 'react';
import { WishState, MusicState, ClickEffect, LoveMessage, CountdownTime, OrnamentClickEffect, Gift } from '../types';

interface GalleryImage {
  id: number;
  url: string;
  title: string;
  message: string;
}

interface OverlayProps {
  wishState: WishState;
  onGenerateWish: () => void;
  musicState: MusicState;
  onToggleMusic: () => void;
  onVolumeChange: (val: number) => void;
  loveMessages: LoveMessage[];
  onAddLoveMessage: (text: string) => void;
  onDeleteLoveMessage: (id: number) => void;
  clickEffects: ClickEffect[];
  ornamentEffects: OrnamentClickEffect[];
  ornamentLoveMessage: string | null;
  onCloseOrnamentMessage: () => void;
  galleryImages: GalleryImage[];
  selectedGalleryImage: GalleryImage | null;
  onSelectGalleryImage: (image: GalleryImage) => void;
  onCloseGalleryImage: () => void;
  gifts: Gift[];
  onGiftClick: (gift: Gift) => void;
  selectedGiftMessage: string | null;
  onCloseGiftMessage: () => void;
  secretUnlocked: boolean;
  clickCount: number;
  giftMessages: string[];
  secretDiscoveryPopup?: boolean;
  randomAnimationType?: 'orb' | 'confetti' | 'gift' | null;
  showSecretMessage?: boolean;
  onCloseSecretMessage?: () => void;
  showWelcomePopup?: boolean;
  onCloseWelcomePopup?: () => void;
  onHotspotClick?: (hotspotId: number) => void;
}

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 40); 
    return () => clearInterval(timer);
  }, [text]);
  return <span className="drop-shadow-md">{displayedText}</span>;
};


const Overlay: React.FC<OverlayProps> = ({ 
  wishState, 
  onGenerateWish, 
  musicState, 
  onToggleMusic, 
  onVolumeChange,
  loveMessages,
  onAddLoveMessage,
  onDeleteLoveMessage,
  clickEffects,
  ornamentEffects,
  ornamentLoveMessage,
  onCloseOrnamentMessage,
  galleryImages,
  selectedGalleryImage,
  onSelectGalleryImage,
  onCloseGalleryImage,
  gifts,
  onGiftClick,
  selectedGiftMessage,
  onCloseGiftMessage,
  secretUnlocked,
  clickCount,
  giftMessages,
  secretDiscoveryPopup = false,
  randomAnimationType = null,
  showSecretMessage = false,
  onCloseSecretMessage,
  showWelcomePopup = false,
  onCloseWelcomePopup,
  onHotspotClick
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [surpriseImage, setSurpriseImage] = useState<GalleryImage | null>(null);
  const [hotspotClicked, setHotspotClicked] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, [galleryImages.length]);

  // Check if tutorial has been shown before
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      // Show tutorial after 2 seconds
      setTimeout(() => {
        setShowTutorial(true);
      }, 2000);
    }
  }, []);

  // Auto-close surprise popup sau 10 giây
  useEffect(() => {
    if (surpriseImage) {
      // Clear timer cũ nếu có
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      // Set timer mới
      autoCloseTimerRef.current = setTimeout(() => {
        setSurpriseImage(null);
        setHotspotClicked(false);
      }, 10000); // 10 giây
    } else {
      // Clear timer khi popup đóng
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    }
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [surpriseImage]);

  const handleTutorialNext = () => {
    if (tutorialStep < 2) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
      localStorage.setItem('hasSeenTutorial', 'true');
    }
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <>
    {/* Floating Elements Layer */}
    <div className="absolute inset-0 z-10 flex flex-col pointer-events-none text-white overflow-hidden">
      
      {/* Click Effects */}
      {clickEffects.map(effect => (
          <div 
            key={effect.id}
            className="absolute pointer-events-none font-vibes text-3xl font-bold animate-float-up z-50"
            style={{ 
                left: effect.x, 
                top: effect.y, 
                color: effect.color,
                transform: `rotate(${effect.rotation}deg)`,
                textShadow: '0 0 10px rgba(255,255,255,0.8)'
            }}
          >
            {effect.content}
          </div>
      ))}

      {/* Ornament Click Effects - Halo & Text */}
      {ornamentEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute pointer-events-none z-[70]"
          style={{
            left: effect.x,
            top: effect.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Halo Effect */}
          {effect.halo && (
            <>
              <div className="absolute inset-0 animate-ping">
                <div className="w-32 h-32 rounded-full border-4 border-red-600/50" style={{
                  boxShadow: '0 0 40px rgba(220, 38, 38, 0.6), 0 0 80px rgba(220, 38, 38, 0.4)'
                }}></div>
              </div>
              <div className="absolute inset-0 animate-pulse">
                <div className="w-40 h-40 rounded-full border-2 border-yellow-400/30" style={{
                  boxShadow: '0 0 60px rgba(251, 191, 36, 0.4)'
                }}></div>
              </div>
            </>
          )}
          
          {/* Text Effect */}
          <div 
            className="font-vibes text-5xl font-bold text-red-400 animate-float-up relative z-10"
            style={{
              textShadow: '0 0 20px rgba(220, 38, 38, 0.8), 0 0 40px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.4)',
              animation: 'floatUp 2s ease-out forwards'
            }}
          >
            {effect.text}
          </div>
        </div>
      ))}

      {/* Floating Gifts - Ẩn đi, không còn spawn tự động */}
      {false && gifts.map((gift) => (
        <div
          key={gift.id}
          onClick={() => onGiftClick(gift)}
          className="fixed z-[80] cursor-pointer pointer-events-auto animate-[giftFloat_3s_ease-in-out_infinite]"
          style={{
            left: gift.x,
            top: gift.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-20 h-20 rounded-full border-4 border-yellow-400/50" style={{
              boxShadow: '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.5)'
            }}></div>
          </div>
          
          {/* Gift emoji */}
          <div className="relative text-6xl animate-bounce hover:scale-125 transition-transform duration-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">
            {gift.emoji}
          </div>
          
          {/* Hint text */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black/60 px-2 py-1 rounded-full whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
            Click để mở! 💖
          </div>
        </div>
      ))}

      {/* Secret Discovery Popup - Sau 5-7 clicks */}
      {secretDiscoveryPopup && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] animate-[popIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
               <div className="bg-gradient-to-r from-amber-400 via-red-600 to-red-700 p-8 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.9)] border-4 border-white flex flex-col items-center">
                   <span className="text-7xl animate-bounce mb-4">🎉</span>
                   <span className="text-white font-vibes text-2xl md:text-3xl font-bold whitespace-nowrap drop-shadow-lg mb-2">
                       Bạn tìm ra bí mật!
                   </span>
                   <span className="text-white/90 text-sm italic">
                       Tiếp tục khám phá để tìm thêm điều bất ngờ...
                   </span>
               </div>
          </div>
      )}


      {/* Random Animation Effects - Khi click cây */}
      {randomAnimationType === 'orb' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[55] pointer-events-none">
              {[...Array(8)].map((_, i) => (
                  <div
                      key={i}
                      className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-amber-400 animate-ping"
                      style={{
                          left: `${Math.cos((i / 8) * Math.PI * 2) * 100}px`,
                          top: `${Math.sin((i / 8) * Math.PI * 2) * 100}px`,
                          animationDelay: `${i * 0.1}s`,
                          boxShadow: '0 0 20px rgba(236, 72, 153, 0.8)'
                      }}
                  ></div>
              ))}
          </div>
      )}

      {randomAnimationType === 'confetti' && (
          <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden">
              {[...Array(30)].map((_, i) => (
                  <div
                      key={i}
                      className="absolute w-3 h-3 rounded-sm animate-[confettiFall_2s_ease-out_forwards]"
                      style={{
                          left: `${Math.random() * 100}%`,
                          top: '-10px',
                          backgroundColor: ['#fbbf24', '#ec4899', '#ef4444', '#8b5cf6', '#3b82f6'][Math.floor(Math.random() * 5)],
                          animationDelay: `${Math.random() * 0.5}s`,
                          transform: `rotate(${Math.random() * 360}deg)`
                      }}
                  ></div>
              ))}
          </div>
      )}

      {randomAnimationType === 'gift' && (
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-[55] pointer-events-none">
              {[...Array(5)].map((_, i) => (
                  <div
                      key={i}
                      className="absolute text-4xl animate-[giftDrop_1.5s_ease-in_forwards]"
                      style={{
                          left: `${(i - 2) * 60}px`,
                          animationDelay: `${i * 0.1}s`
                      }}
                  >
                      🎁
                  </div>
              ))}
          </div>
      )}

      {/* Header - Compact, không che hero */}
      <header className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto w-full max-w-4xl px-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-vibes text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-400 to-red-600 animate-shimmer drop-shadow-[0_2px_10px_rgba(220,38,38,0.4)] cursor-default text-center">
          Merry Christmas My Love ❤️
        </h1>
      </header>

      {/* Gallery Button - Compact, ở góc */}
      {!showPanel && !surpriseImage && (
        <button
          onClick={() => setShowPanel(true)}
          className="fixed top-16 md:top-20 right-3 md:right-6 z-30 pointer-events-auto bg-gradient-to-r from-red-600/90 to-amber-600/90 hover:from-red-500 hover:to-amber-500 active:from-red-700 active:to-amber-700 text-white font-vibes text-sm md:text-base px-3 md:px-5 py-1.5 md:py-2 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-1.5 border border-white/20 touch-manipulation backdrop-blur-sm"
          aria-label="Mở Gallery và AI Wish Generator"
        >
          <span className="text-lg md:text-xl">📷</span>
          <span className="hidden sm:inline">Gallery</span>
        </button>
      )}

      {/* Hidden Hotspots - Click anywhere to discover */}
      {!surpriseImage && !showPanel && (
        <>
          {/* Hotspot 1 - Top Left */}
          <div
            onClick={() => {
              if (onHotspotClick) onHotspotClick(1);
              const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
              setSurpriseImage(randomImage);
              setHotspotClicked(true);
            }}
            className="fixed top-16 left-4 md:top-20 md:left-10 w-14 h-14 md:w-20 md:h-20 rounded-full bg-red-600/0 active:bg-red-600/20 cursor-pointer transition-all duration-300 group z-30 pointer-events-auto active:scale-110 md:hover:scale-125 md:hover:rotate-12 touch-manipulation"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.6))'
            }}
            aria-label="Khám phá kỷ niệm bất ngờ"
            role="button"
            tabIndex={0}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl md:text-4xl opacity-30 md:opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 animate-pulse transition-opacity group-active:scale-125 md:group-hover:scale-125">💝</div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-red-600/30 group-hover:border-red-600/60 animate-ping group-hover:shadow-[0_0_30px_rgba(220,38,38,0.8)]"></div>
          </div>

          {/* Hotspot 2 - Top Right */}
          <div
            onClick={() => {
              if (onHotspotClick) onHotspotClick(2);
              const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
              setSurpriseImage(randomImage);
              setHotspotClicked(true);
            }}
            className="fixed top-24 right-4 md:top-32 md:right-16 w-12 h-12 md:w-16 md:h-16 rounded-full bg-amber-500/0 active:bg-amber-500/20 cursor-pointer transition-all duration-300 group z-30 pointer-events-auto active:scale-110 md:hover:scale-125 md:hover:-rotate-12 touch-manipulation"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))'
            }}
            aria-label="Khám phá kỷ niệm bất ngờ"
            role="button"
            tabIndex={0}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xl md:text-3xl opacity-30 md:opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 animate-pulse transition-opacity group-active:scale-125 md:group-hover:scale-125">✨</div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 group-hover:border-amber-500/60 animate-ping group-hover:shadow-[0_0_30px_rgba(245,158,11,0.8)]"></div>
          </div>

          {/* Hotspot 3 - Bottom Left */}
          <div
            onClick={() => {
              if (onHotspotClick) onHotspotClick(3);
              const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
              setSurpriseImage(randomImage);
              setHotspotClicked(true);
            }}
            className="fixed bottom-24 left-4 md:bottom-32 md:left-20 w-16 h-16 md:w-24 md:h-24 rounded-full bg-red-500/0 active:bg-red-500/20 cursor-pointer transition-all duration-300 group z-30 pointer-events-auto active:scale-110 md:hover:scale-125 md:hover:rotate-12 touch-manipulation"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.6))'
            }}
            aria-label="Khám phá kỷ niệm bất ngờ"
            role="button"
            tabIndex={0}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl md:text-5xl opacity-30 md:opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 animate-pulse transition-opacity group-active:scale-125 md:group-hover:scale-125">❤️</div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-red-500/30 group-hover:border-red-500/60 animate-ping group-hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]"></div>
          </div>

          {/* Hotspot 4 - Center (subtle hint) - Ẩn trên mobile */}
          <div
            onClick={() => {
              if (onHotspotClick) onHotspotClick(4);
              const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
              setSurpriseImage(randomImage);
              setHotspotClicked(true);
            }}
            className="hidden md:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-yellow-500/0 hover:bg-yellow-500/5 cursor-pointer transition-all duration-300 group z-30 pointer-events-auto hover:scale-125 hover:rotate-12"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))'
            }}
            aria-label="Khám phá kỷ niệm bất ngờ"
            role="button"
            tabIndex={0}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-20 group-hover:opacity-60 animate-pulse transition-opacity group-hover:scale-125">🎁</div>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-yellow-500/20 group-hover:border-yellow-500/40 animate-ping group-hover:shadow-[0_0_30px_rgba(251,191,36,0.8)]"></div>
          </div>
        </>
      )}

      {/* Surprise Image Modal - Bất ngờ hiển thị */}
      {surpriseImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out] cursor-pointer"
          onClick={(e) => {
            // Chỉ đóng khi click vào backdrop, không phải vào modal content
            if (e.target === e.currentTarget) {
              setSurpriseImage(null);
              setHotspotClicked(false);
            }
          }}
        >
          <div 
            className="relative bg-gradient-to-br from-red-800/95 via-red-700/95 to-amber-900/95 backdrop-blur-xl p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_0_100px_rgba(185,28,28,0.8)] max-w-2xl w-full mx-2 border-2 md:border-4 border-red-500/50 animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative elements - Đặt sau close button để không che */}
            <div className="absolute -top-2 md:-top-4 left-1/2 transform -translate-x-1/2 text-4xl md:text-6xl animate-bounce pointer-events-none z-0">🎉</div>
            <div className="absolute top-2 md:top-4 right-2 md:right-4 text-2xl md:text-3xl animate-pulse pointer-events-none z-0">✨</div>
            <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-2xl md:text-3xl animate-pulse pointer-events-none z-0">💖</div>
            
            {/* Close button - Z-index cao nhất và pointer-events */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSurpriseImage(null);
                setHotspotClicked(false);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute top-2 md:top-4 right-2 md:right-4 text-white/90 hover:text-white active:text-white text-3xl md:text-4xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-600 active:bg-red-700 border-2 border-white/50 shadow-lg transition-all duration-300 active:scale-90 z-[100] cursor-pointer touch-manipulation"
              style={{ pointerEvents: 'auto' }}
            >
              ×
            </button>
            
            {/* Surprise Text */}
            <div className="text-center mb-3 md:mb-4 pt-8 md:pt-0">
              <div className="font-vibes text-2xl md:text-3xl lg:text-4xl text-white mb-2 animate-pulse">
                Bất ngờ! 🎁
              </div>
              <div className="text-amber-200 text-xs md:text-sm italic mb-2">
                Bạn đã tìm thấy một kỷ niệm đặc biệt!
              </div>
              {/* Auto-close indicator */}
              <div className="text-amber-300/70 text-[10px] md:text-xs animate-pulse">
                Tự động đóng sau 10 giây
              </div>
            </div>
            
            {/* Image */}
            <div className="flex items-center justify-center overflow-hidden rounded-xl md:rounded-2xl mb-4 md:mb-6 bg-black/30 p-2 md:p-4">
              <img
                src={surpriseImage.url}
                alt={surpriseImage.title}
                className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain rounded-lg md:rounded-xl shadow-2xl animate-[popIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  imageRendering: '-webkit-optimize-contrast' as any
                }}
                loading="eager"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1512474932049-78ea796b5f4d?q=80&w=1200&auto=format&fit=crop";
                }}
              />
            </div>
            
            {/* Content */}
            <div className="text-center px-2 md:px-4 pb-2">
              <h3 className="text-lg md:text-2xl font-vibes text-white mb-2 md:mb-3 drop-shadow-lg">
                {surpriseImage.title}
              </h3>
              <div className="font-vibes text-lg md:text-xl text-amber-200 mb-4 leading-relaxed">
                <TypewriterText text={surpriseImage.message} />
              </div>
              <div className="w-32 h-1 bg-amber-400/50 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
        {/* Left Spacer */}
        <div className="hidden md:flex flex-1 items-end p-8">
            <div className="text-white/40 text-sm font-light italic animate-pulse">
             * Click cây thông để bật đèn, click đúp để xem pháo hoa rực rỡ! 🎆
             <br/>
             * Di chuột để đổi hướng gió.
             <br/>
             * Click vào các biểu tượng ẩn để khám phá kỷ niệm bất ngờ.
             <br/>
             * Click vào hộp quà 3D để mở quà đặc biệt! 🎁
            </div>
        </div>

        {/* Backdrop */}
        {showPanel && (
          <div
            onClick={() => setShowPanel(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 animate-[fadeIn_0.3s_ease-out]"
          />
        )}

        {/* Right Editor - Slide Panel */}
        <div 
          className={`fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 pointer-events-auto z-30 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            showPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto pr-2 custom-scrollbar bg-gradient-to-b from-black/95 via-red-950/90 to-amber-950/90 backdrop-blur-xl border-l-2 border-red-600/30 shadow-[0_0_50px_rgba(185,28,28,0.5)]">
            {/* Decorative Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-800/50 to-amber-800/50 backdrop-blur-md border-b border-red-600/30 p-3 md:p-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl animate-pulse">✨</span>
                  <h2 className="text-base md:text-xl font-vibes text-white">Kỷ niệm yêu thương</h2>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-red-500/80 hover:bg-red-500 active:bg-red-600 text-white text-xl md:text-lg flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 touch-manipulation"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-3 md:p-4">
                {/* AI Wish - Cải thiện hiển thị */}
                <div className="mb-4 md:mb-6 bg-gradient-to-r from-red-950/50 to-amber-950/50 rounded-lg md:rounded-xl p-4 md:p-6 border-2 border-red-600/30 group hover:border-red-500/60 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl md:text-3xl animate-pulse">✨</span>
                          <span className="text-amber-200 font-vibes text-lg md:text-2xl group-hover:text-amber-100 transition-colors">Gợi ý lời chúc từ AI</span>
                        </div>
                        <button 
                            onClick={onGenerateWish} 
                            disabled={wishState.loading} 
                            className="w-full md:w-auto bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 active:from-red-700 active:to-amber-700 text-white font-vibes text-sm md:text-base px-4 md:px-6 py-2 md:py-2.5 rounded-full shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed touch-manipulation border-2 border-white/20"
                            aria-label={wishState.loading ? 'Đang tạo lời chúc...' : 'Tạo lời chúc mới từ AI'}
                        >
                            {wishState.loading ? '⏳ Đang tạo...' : '🎁 Tạo lời chúc mới'}
                        </button>
                     </div>
                     <div className="bg-black/30 rounded-lg p-3 md:p-4 min-h-[60px] md:min-h-[80px] flex items-center">
                       <p className="text-sm md:text-base text-white leading-relaxed transition-all duration-300 group-hover:text-amber-100">
                         {wishState.text || (
                           <span className="text-gray-400 italic">
                             💡 Bấm nút "Tạo lời chúc mới" để AI tạo lời chúc Giáng sinh đặc biệt cho bạn!
                           </span>
                         )}
                       </p>
                     </div>
                </div>

                {/* Elegant Photo Carousel */}
                <div className="mb-4">
                    <h2 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                        📷 Kỷ niệm yêu thương
                    </h2>
                    <div className="relative">
                        <div className="overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-red-950/30 to-amber-950/30 border border-red-600/20">
                            <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
                                {galleryImages.map((image, index) => (
                                    <div
                                        key={image.id}
                                        onClick={() => onSelectGalleryImage(image)}
                                        className="absolute inset-0 cursor-pointer group transition-all duration-700 ease-in-out"
                                        style={{
                                            opacity: index === currentImageIndex ? 1 : 0,
                                            transform: `translateX(${(index - currentImageIndex) * 100}%)`,
                                            zIndex: index === currentImageIndex ? 10 : 0,
                                            pointerEvents: index === currentImageIndex ? 'auto' : 'none'
                                        }}
                                    >
                                        {/* Image with parallax effect */}
                                        <div className="relative w-full h-full overflow-hidden">
                                            <img
                                                src={image.url}
                                                alt={image.title}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                style={{
                                                  imageRendering: '-webkit-optimize-contrast' as any
                                                }}
                                                loading={index === currentImageIndex ? "eager" : "lazy"}
                                                decoding="async"
                                                onError={(e) => {
                                                    e.currentTarget.src = "https://images.unsplash.com/photo-1512474932049-78ea796b5f4d?q=80&w=1200&auto=format&fit=crop";
                                                }}
                                            />
                                            
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                            
                                            {/* Content overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 text-white">
                                                <div className="font-vibes text-lg md:text-2xl lg:text-3xl mb-1 md:mb-2 drop-shadow-lg">
                                                    {image.title}
                                                </div>
                                                <div className="text-xs md:text-sm lg:text-base text-amber-200 line-clamp-2">
                                                    {image.message}
                                                </div>
                                            </div>
                                            
                                            {/* Decorative elements */}
                                            <div className="absolute top-2 md:top-4 right-2 md:right-4 text-2xl md:text-3xl opacity-80 animate-pulse">💖</div>
                                            <div className="absolute top-2 md:top-4 left-2 md:left-4 text-xl md:text-2xl opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Navigation Dots */}
                            <div className="flex justify-center gap-1.5 md:gap-2 p-2 md:p-4 bg-black/20">
                                {galleryImages.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`h-1.5 md:h-2 rounded-full transition-all duration-300 touch-manipulation ${
                                            index === currentImageIndex 
                                                ? 'w-6 md:w-8 bg-red-600' 
                                                : 'w-1.5 md:w-2 bg-white/30 hover:bg-white/50 active:bg-white/70'
                                        }`}
                                        onClick={() => goToImage(index)}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        {/* Navigation Arrows */}
                        <button
                            className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg md:text-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg touch-manipulation"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                        >
                            ‹
                        </button>
                        <button
                            className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg md:text-xl transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg touch-manipulation"
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Music Player with Visualizer */}
      <footer className="w-full bg-gradient-to-t from-black via-black/80 to-transparent p-2 md:p-4 pointer-events-auto z-20">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 md:gap-4 bg-white/5 backdrop-blur-md rounded-full px-3 md:px-4 py-2 border border-white/10 shadow-lg hover:bg-white/10 transition-colors duration-300">
            
            <button 
                onClick={onToggleMusic} 
                className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 touch-manipulation ${musicState.playing ? 'bg-red-600 scale-110 shadow-[0_0_20px_#dc2626]' : 'bg-gray-700 hover:bg-gray-600 hover:scale-110'}`}
            >
              {musicState.playing ? (
                  <div className="flex items-end gap-[2px] h-4">
                      <div className="w-1 bg-white animate-[bounce_0.5s_infinite] h-2"></div>
                      <div className="w-1 bg-white animate-[bounce_0.7s_infinite] h-4"></div>
                      <div className="w-1 bg-white animate-[bounce_0.6s_infinite] h-3"></div>
                  </div>
              ) : <span className="text-sm md:text-base">▶</span>}
            </button>
            
            <div className="flex-1 text-center group cursor-default min-w-0">
                <p className={`text-[10px] md:text-xs text-amber-200 transition-all duration-300 truncate ${musicState.playing ? 'animate-pulse scale-105' : 'group-hover:text-amber-100'}`}>
                    Wednesday (Bloody Mary) - Kyrix Remix
                </p>
            </div>
            
            <input 
               type="range" min="0" max="1" step="0.05" 
               value={musicState.volume}
               onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
               className="w-16 md:w-20 h-1 md:h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer hover:bg-white/40 accent-red-600 transition-all active:scale-y-125 touch-manipulation"
             />
        </div>
      </footer>
    </div>

    {/* Gallery Lightbox Modal - Chỉ hiển thị khi không có gift modal */}
    {selectedGalleryImage && !selectedGiftMessage && (
        <div 
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out] cursor-pointer"
            onClick={(e) => {
                // Chỉ đóng khi click vào backdrop, không phải vào modal content
                if (e.target === e.currentTarget) {
                    onCloseGalleryImage();
                }
            }}
        >
            <div 
                className="relative bg-gradient-to-br from-red-950/90 via-red-900/90 to-amber-950/90 backdrop-blur-lg p-4 md:p-6 rounded-xl md:rounded-2xl shadow-[0_0_80px_rgba(185,28,28,0.6)] max-w-4xl w-full mx-2 max-h-[90vh] overflow-y-auto border-2 border-red-600/30 animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative elements */}
                <div className="absolute -top-2 md:-top-3 left-1/2 transform -translate-x-1/2 text-3xl md:text-4xl animate-bounce">💖</div>
                <div className="absolute top-2 right-2 text-xl md:text-2xl animate-pulse">✨</div>
                <div className="absolute bottom-2 left-2 text-xl md:text-2xl animate-pulse">⭐</div>
                
                {/* Close button - Larger for mobile */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onCloseGalleryImage();
                    }} 
                    className="absolute top-2 md:top-4 right-2 md:right-4 text-white/80 hover:text-white text-2xl md:text-3xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-300 hover:scale-110 active:scale-90 z-50 cursor-pointer touch-manipulation shadow-lg"
                >
                    &times;
                </button>
                
                {/* Image */}
                <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg md:rounded-xl mb-3 md:mb-4 bg-black/20 p-2 md:p-0">
                    <img
                        src={selectedGalleryImage.url}
                        alt={selectedGalleryImage.title}
                        className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg shadow-2xl"
                        style={{
                          imageRendering: '-webkit-optimize-contrast' as any
                        }}
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1512474932049-78ea796b5f4d?q=80&w=1200&auto=format&fit=crop";
                        }}
                    />
                </div>
                
                {/* Content */}
                <div className="text-center px-2 md:px-4 pb-2">
                    <h3 className="text-lg md:text-2xl font-vibes text-white mb-2 md:mb-3 drop-shadow-lg">
                        {selectedGalleryImage.title}
                    </h3>
                    <div className="font-vibes text-sm md:text-lg lg:text-xl text-amber-200 mb-2 md:mb-3 leading-relaxed">
                        <TypewriterText text={selectedGalleryImage.message} />
                    </div>
                    <div className="w-20 md:w-24 h-0.5 md:h-1 bg-amber-400/50 mx-auto rounded-full"></div>
                </div>
            </div>
        </div>
    )}

    {/* Gift Message Modal - Click vào món quà - SẮC NÉT & ĐẸP với Confetti */}
    {selectedGiftMessage && (
        <div 
            className="fixed inset-0 z-[180] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out] cursor-pointer"
            onClick={(e) => {
                // Chỉ đóng khi click vào backdrop, không phải vào modal content
                if (e.target === e.currentTarget) {
                    onCloseGiftMessage();
                    // Đảm bảo đóng cả gallery image nếu đang mở
                    if (selectedGalleryImage) {
                        onCloseGalleryImage();
                    }
                }
            }}
        >
            {/* Outer glow rings - Responsive */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full border-2 md:border-4 border-yellow-400/20 animate-ping"></div>
                <div className="absolute w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full border-2 border-red-600/30 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            </div>

            <div 
                className="relative bg-gradient-to-br from-amber-400 via-red-600 to-red-700 backdrop-blur-2xl p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-3xl shadow-[0_0_150px_rgba(245,158,11,1),0_0_300px_rgba(220,38,38,0.8),inset_0_0_100px_rgba(255,255,255,0.1)] max-w-2xl w-full mx-2 max-h-[90vh] overflow-y-auto border-2 md:border-4 border-white/60 animate-[giftModalPop_0.6s_cubic-bezier(0.34,1.56,0.64,1)]"
                onClick={(e) => e.stopPropagation()}
                style={{
                    boxShadow: '0 0 150px rgba(245,158,11,1), 0 0 300px rgba(220,38,38,0.8), inset 0 0 100px rgba(255,255,255,0.1)'
                }}
            >
                {/* Confetti effect when modal opens */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-xl md:text-2xl animate-[confettiFall_2s_ease-out_forwards]"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10px',
                                animationDelay: `${Math.random() * 0.5}s`,
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        >
                            {['🎉', '✨', '💖', '⭐', '🎁'][Math.floor(Math.random() * 5)]}
                        </div>
                    ))}
                </div>

                {/* Floating hearts */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-xl md:text-2xl animate-[heartFloat_3s_ease-in-out_infinite]"
                            style={{
                                left: `${15 + (i * 10)}%`,
                                top: `${20 + (i % 2) * 60}%`,
                                animationDelay: `${i * 0.4}s`
                            }}
                        >
                            ❤️
                        </div>
                    ))}
                </div>
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-r from-amber-500 via-red-600 to-red-700 opacity-50 blur-xl animate-pulse"></div>
                
                {/* Decorative elements - Responsive */}
                <div className="absolute -top-4 md:-top-8 left-1/2 transform -translate-x-1/2 text-5xl md:text-8xl animate-bounce drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]">🎁</div>
                <div className="absolute top-3 md:top-6 right-3 md:right-6 text-3xl md:text-5xl animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">✨</div>
                <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 text-3xl md:text-5xl animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">💖</div>
                <div className="absolute top-3 md:top-6 left-3 md:left-6 text-2xl md:text-4xl animate-pulse drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" style={{ animationDelay: '0.5s' }}>⭐</div>
                <div className="absolute bottom-3 md:bottom-6 right-3 md:right-6 text-2xl md:text-4xl animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]" style={{ animationDelay: '0.7s' }}>💝</div>
                
                {/* Close button - Responsive */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onCloseGiftMessage();
                        // Đảm bảo đóng cả gallery image nếu đang mở
                        if (selectedGalleryImage) {
                            onCloseGalleryImage();
                        }
                    }} 
                    className="absolute top-3 md:top-6 right-3 md:right-6 text-white text-2xl md:text-4xl w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-500 active:bg-red-600 border-2 border-white/50 shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 z-50 cursor-pointer touch-manipulation"
                >
                    ×
                </button>
                
                {/* Content - Responsive */}
                <div className="text-center pt-12 md:pt-16 relative z-10">
                    {/* Title */}
                    <div className="font-vibes text-2xl md:text-4xl lg:text-5xl text-white mb-4 md:mb-6 leading-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] animate-pulse px-2">
                        💝 Món Quà Đặc Biệt 💝
                    </div>
                    
                    {/* Image - Hiển thị hình ảnh random với hiệu ứng sống động */}
                    {selectedGalleryImage && (
                        <div className="mb-6 flex items-center justify-center relative">
                            {/* Sparkles particles xung quanh ảnh */}
                            <div className="absolute inset-0 pointer-events-none">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                                        style={{
                                            left: `${20 + (i * 7)}%`,
                                            top: `${10 + (i % 3) * 30}%`,
                                            animationDelay: `${i * 0.1}s`,
                                            animationDuration: `${1.5 + (i % 3) * 0.5}s`
                                        }}
                                    ></div>
                                ))}
                            </div>
                            
                            {/* Ripple effect */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 rounded-2xl border-4 border-red-600/50 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                                <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400/40 animate-ping" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            
                            {/* Main image container */}
                            <div className="relative rounded-2xl overflow-hidden border-4 border-white/50 shadow-[0_0_50px_rgba(255,255,255,0.5)] animate-[imageReveal_0.8s_cubic-bezier(0.34,1.56,0.64,1)] group">
                                {/* Glow background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-amber-400/20 to-red-700/20 blur-2xl animate-pulse"></div>
                                
                                {/* Image với zoom effect */}
                                <img
                                    src={selectedGalleryImage.url}
                                    alt={selectedGalleryImage.title}
                                    className="relative max-w-full max-h-[50vh] md:max-h-[60vh] object-contain rounded-xl transform transition-transform duration-700 group-hover:scale-110 z-10"
                                    style={{
                                      imageRendering: '-webkit-optimize-contrast' as any
                                    }}
                                    loading="eager"
                                    decoding="async"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1512474932049-78ea796b5f4d?q=80&w=1200&auto=format&fit=crop";
                                    }}
                                />
                                
                                {/* Gradient overlay với animation */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-20"></div>
                                
                                {/* Corner sparkles */}
                                <div className="absolute top-2 left-2 text-2xl animate-pulse z-30">✨</div>
                                <div className="absolute top-2 right-2 text-2xl animate-pulse z-30" style={{ animationDelay: '0.3s' }}>⭐</div>
                                <div className="absolute bottom-2 left-2 text-2xl animate-pulse z-30" style={{ animationDelay: '0.6s' }}>💖</div>
                                <div className="absolute bottom-2 right-2 text-2xl animate-pulse z-30" style={{ animationDelay: '0.9s' }}>💝</div>
                            </div>
                            
                            {/* Floating hearts */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute text-2xl animate-[heartFloat_3s_ease-in-out_infinite]"
                                        style={{
                                            left: `${15 + (i * 15)}%`,
                                            top: `${20 + (i % 2) * 60}%`,
                                            animationDelay: `${i * 0.5}s`
                                        }}
                                    >
                                        ❤️
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Message - Responsive */}
                    <div className="font-vibes text-lg md:text-2xl lg:text-3xl text-white mb-4 md:mb-6 leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)] px-2 md:px-4">
                        <TypewriterText text={selectedGiftMessage} />
                    </div>
                    
                    {/* Image title if exists */}
                    {selectedGalleryImage && (
                        <div className="text-white/90 text-sm md:text-lg mb-3 md:mb-4 font-semibold drop-shadow-md">
                            {selectedGalleryImage.title}
                        </div>
                    )}
                    
                    {/* Decorative line */}
                    <div className="w-32 md:w-40 h-1 md:h-1.5 bg-white/70 mx-auto rounded-full mt-4 md:mt-6 mb-3 md:mb-4 shadow-lg"></div>
                    
                    {/* Hint */}
                    <p className="text-white/95 text-xs md:text-base italic font-semibold drop-shadow-md">
                        Click để đóng
                    </p>
                </div>
            </div>
        </div>
    )}

    {/* Ornament Love Message Modal */}
    {ornamentLoveMessage && (
        <div 
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 animate-[fadeIn_0.3s_ease-out] cursor-pointer"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onCloseOrnamentMessage();
                }
            }}
        >
            <div 
                className="relative bg-gradient-to-br from-red-700/90 via-red-600/90 to-amber-800/90 backdrop-blur-md p-5 md:p-8 rounded-xl md:rounded-2xl shadow-[0_0_60px_rgba(185,28,28,0.8)] max-w-md w-full mx-2 border-2 border-red-500/50 animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative elements */}
                <div className="absolute -top-2 md:-top-4 left-1/2 transform -translate-x-1/2 text-4xl md:text-5xl animate-bounce">💝</div>
                <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 text-2xl md:text-3xl animate-pulse">✨</div>
                <div className="absolute -bottom-1 md:-bottom-2 -left-1 md:-left-2 text-2xl md:text-3xl animate-pulse">⭐</div>
                
                <div className="text-center pt-8 md:pt-6">
                    <div className="font-vibes text-xl md:text-3xl lg:text-4xl text-white mb-3 md:mb-4 leading-relaxed drop-shadow-lg px-2">
                        <TypewriterText text={ornamentLoveMessage} />
                    </div>
                    
                    <div className="w-20 md:w-24 h-0.5 md:h-1 bg-white/50 mx-auto rounded-full mt-4 md:mt-6 mb-3 md:mb-4"></div>
                    
                    <p className="text-white/80 text-xs md:text-sm italic">
                        Click để đóng
                    </p>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onCloseOrnamentMessage();
                    }} 
                    className="absolute top-2 md:top-3 right-2 md:right-3 text-white/80 hover:text-white active:text-white text-xl md:text-2xl w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-300 active:scale-90 z-50 cursor-pointer touch-manipulation"
                >
                    &times;
                </button>
            </div>
        </div>
    )}

    {/* Tutorial Modal - Hướng dẫn lần đầu */}
    {showTutorial && (
      <div 
        className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]"
      >
        <div 
          className="relative bg-gradient-to-br from-red-800/95 via-red-700/95 to-amber-900/95 backdrop-blur-xl p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[0_0_100px_rgba(185,28,28,0.8)] max-w-lg w-full mx-2 border-2 md:border-4 border-red-500/50 animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]"
        >
          {/* Decorative elements */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-5xl md:text-6xl animate-bounce pointer-events-none">🎄</div>
          <div className="absolute top-4 right-4 text-2xl md:text-3xl animate-pulse pointer-events-none">✨</div>
          
          {/* Close button */}
          <button 
            onClick={handleTutorialSkip}
            className="absolute top-3 md:top-4 right-3 md:right-4 text-white/90 hover:text-white text-2xl md:text-3xl w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-600 border-2 border-white/50 shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 z-50 cursor-pointer touch-manipulation"
            aria-label="Bỏ qua hướng dẫn"
          >
            ×
          </button>
          
          {/* Content */}
          <div className="text-center pt-8 md:pt-12">
            <h2 className="font-vibes text-2xl md:text-3xl lg:text-4xl text-white mb-4 md:mb-6 drop-shadow-lg">
              {tutorialStep === 0 && "🎁 Chào mừng đến với Noel Yêu Thương!"}
              {tutorialStep === 1 && "📷 Khám phá Gallery & AI"}
              {tutorialStep === 2 && "✨ Tính năng đặc biệt"}
            </h2>
            
            <div className="text-white/90 text-sm md:text-base leading-relaxed mb-6 md:mb-8 space-y-3">
              {tutorialStep === 0 && (
                <>
                  <p>Đây là một website Giáng sinh 3D đặc biệt với nhiều tính năng tương tác thú vị!</p>
                  <p className="text-amber-200">Hãy khám phá và tận hưởng những điều bất ngờ... 💖</p>
                </>
              )}
              {tutorialStep === 1 && (
                <>
                  <p>📷 <strong>Nút "Gallery & AI"</strong> ở góc trên bên phải:</p>
                  <p className="text-amber-200">• Xem album kỷ niệm yêu thương</p>
                  <p className="text-amber-200">• Tạo lời chúc Giáng sinh từ AI</p>
                  <p className="text-xs md:text-sm text-white/70 mt-3">💡 Click vào nút để mở panel!</p>
                </>
              )}
              {tutorialStep === 2 && (
                <>
                  <p>✨ <strong>Các tính năng đặc biệt:</strong></p>
                  <p className="text-amber-200">• Click cây thông → Bật đèn</p>
                  <p className="text-amber-200">• Click đúp cây → Pháo hoa rực rỡ! 🎆</p>
                  <p className="text-amber-200">• Click vào các biểu tượng ẩn → Kỷ niệm bất ngờ</p>
                  <p className="text-amber-200">• Click vào quả cầu trên cây → Lời yêu thương</p>
                  <p className="text-amber-200">• Click vào hộp quà 3D → Mở quà đặc biệt</p>
                  <p className="text-amber-200">• Xem Ông Già Noel và tuần lộc bay quanh scene</p>
                  <p className="text-amber-200">• Ngắm hiệu ứng Aurora (Northern Lights) trên trời</p>
                  <p className="text-xs md:text-sm text-white/70 mt-3">🎄 Chúc bạn có một Giáng sinh ấm áp!</p>
                </>
              )}
            </div>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    step === tutorialStep ? 'bg-amber-400 w-8' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-center gap-3">
              {tutorialStep > 0 && (
                <button
                  onClick={() => setTutorialStep(tutorialStep - 1)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
                >
                  ← Trước
                </button>
              )}
              <button
                onClick={handleTutorialNext}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-vibes text-sm md:text-base rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation border-2 border-white/20"
              >
                {tutorialStep < 2 ? 'Tiếp theo →' : 'Bắt đầu khám phá! 🎉'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    </>
  );
};

export default Overlay;