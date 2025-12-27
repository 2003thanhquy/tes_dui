import React, { useState, useEffect, useRef, useCallback } from 'react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import LoadingScreen from './components/LoadingScreen';
import GestureController, { GestureType } from './components/GestureController';
import { generateRomanticWish } from './services/geminiService';
import { WishState, MusicState, ClickEffect, LoveMessage, CountdownTime, OrnamentClickEffect, Gift } from './types';
import { playPopSound, playSuccessSound } from './utils/soundEffects';
import { loadGalleryImages, preloadImages, getRecommendedImageCount, GalleryImage } from './utils/imageLoader';

// --- SPECIAL GIFT MESSAGES --- (Dài hơn, cảm động hơn)
const GIFT_MESSAGES = [
  { emoji: "💝", message: "Anh yêu em nhiều hơn em tưởng! Mỗi ngày bên em đều là một món quà quý giá. ❤️" },
  { emoji: "🎁", message: "Món quà tuyệt nhất là được yêu em mỗi ngày! Anh cảm ơn em vì đã đến bên anh. 💕" },
  { emoji: "💌", message: "Em là điều ước Giáng sinh của anh! Anh muốn cùng em đi qua mọi mùa đông ấm áp. ✨" },
  { emoji: "🌹", message: "Anh muốn cùng em đi qua mọi mùa! Tình yêu của chúng ta đẹp hơn cả hoa hồng. 🌸" },
  { emoji: "⭐", message: "Em là ngôi sao sáng nhất của anh! Em làm cho cuộc đời anh trở nên rực rỡ. 🌟" },
  { emoji: "🎄", message: "Mãi mãi bên em! Giáng sinh này và mọi Giáng sinh sau, anh đều muốn ở bên em. 🎅" },
  { emoji: "💖", message: "Mỗi khoảnh khắc bên em đều là món quà! Anh trân trọng từng giây phút chúng ta có nhau. 🙏" },
  { emoji: "🎀", message: "Em là người đặc biệt nhất! Anh yêu em từ tận đáy lòng và sẽ mãi mãi như vậy. 💝" }
];

// --- GALLERY IMAGES ---
// Load images professionally with lazy loading and performance optimization
const MAX_IMAGES_TO_DISPLAY = getRecommendedImageCount(); // 0 = all, 5 = mobile, etc.
const USE_RANDOM_SELECTION = false; // Set to true to randomize images

// Initialize gallery images
let GALLERY_IMAGES: GalleryImage[] = loadGalleryImages(MAX_IMAGES_TO_DISPLAY, USE_RANDOM_SELECTION);

// --- LOVE MESSAGES FOR ORNAMENTS ---
const ORNAMENT_LOVE_MESSAGES = [
  "Mùa đông này ấm áp vì có em bên cạnh ❤️",
  "Nụ cười của em toả sáng hơn cả đèn cây thông ✨",
  "Giáng sinh an lành, tình yêu của anh 🎄",
  "Cùng nhau già đi, cùng nhau đón Noel nhé 🎁",
  "Món quà tuyệt nhất năm nay chính là Em 💝",
  "Em là ánh sáng trong cuộc đời anh 🌟",
  "Mỗi khoảnh khắc bên em đều là món quà 🎀",
  "Anh yêu em nhiều hơn cả những vì sao trên trời ⭐",
  "Giáng sinh này và mọi Giáng sinh sau, anh đều muốn ở bên em 🎄❤️",
  "Em làm cho mùa đông trở nên ấm áp hơn bao giờ hết 🔥",
  "Tình yêu của chúng ta đẹp hơn cả cây thông Noel 🌲",
  "Anh cảm ơn em vì đã đến bên anh trong mùa Giáng sinh này 🙏",
  "Em là điều ước Giáng sinh của anh đã thành hiện thực ✨",
  "Mỗi ngày bên em đều là ngày lễ tình yêu 💕",
  "Anh muốn nắm tay em đi qua mọi mùa Giáng sinh 🎅"
];

const AUDIO_URL = "/Wednesday (Bloody Mary) (Kyrix Remix) - compressed.mp3";

const SURPRISE_TEXTS = ["Love", "Joy", "Hope", "Peace", "❤️", "Forever", "Smile", "❄️", "Magic", "You"];
const SURPRISE_COLORS = ["#f472b6", "#fbbf24", "#60a5fa", "#ffffff", "#f87171"];

const App: React.FC = () => {
  // --- Wish State (AI Gen) ---
  const [wishState, setWishState] = useState<WishState>({
    text: "",
    loading: false,
    error: null,
  });

  // --- Love Messages State ---
  const [loveMessages, setLoveMessages] = useState<LoveMessage[]>([]);
  
  // --- Ornament Click Effects ---
  const [ornamentEffects, setOrnamentEffects] = useState<OrnamentClickEffect[]>([]);
  const ornamentEffectIdRef = useRef(0);
  
  // --- Ornament Love Message State ---
  const [ornamentLoveMessage, setOrnamentLoveMessage] = useState<string | null>(null);
  
  // --- Gallery State ---
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);

  // --- Audio State ---
  const [musicState, setMusicState] = useState<MusicState>({
    playing: false,
    volume: 0.5
  });
  const audioRef = useRef<HTMLAudioElement>(new Audio(AUDIO_URL));
  const hasInteractedRef = useRef(false);

  // --- Interaction & Game State ---
  const [clickCount, setClickCount] = useState(0); // Tracking clicks for secret message
  const [windDirection, setWindDirection] = useState<[number, number]>([0, 0]);
  const [treeShake, setTreeShake] = useState(false);
  const [randomAnimationType, setRandomAnimationType] = useState<'orb' | 'confetti' | 'gift' | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [discoveredHotspots, setDiscoveredHotspots] = useState<Set<number>>(new Set());
  const [showSecretMessage, setShowSecretMessage] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  
  // --- Gifts State ---
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGiftMessage, setSelectedGiftMessage] = useState<string | null>(null);
  const giftIdRef = useRef(0);

  // --- Visual Effects State ---
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
  const effectIdRef = useRef(0);

  // --- Layout State ---
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  // --- Loading State ---
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // --- Gallery Images State ---
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(GALLERY_IMAGES);
  
  // --- Heart Photo Frame State ---
  const [currentHeartPhotoIndex, setCurrentHeartPhotoIndex] = useState(0);
  
  // --- Carousel Zoom State ---
  const [carouselRadius, setCarouselRadius] = useState(4.5); // Default radius

  // Preload images for better performance
  useEffect(() => {
    if (galleryImages.length === 0) return;
    
    console.log(`📸 Loading ${galleryImages.length} images...`);
    preloadImages(galleryImages, (loaded, total) => {
      const progress = Math.min(90, (loaded / total) * 85); // Reserve 15% for 3D scene
      setLoadingProgress(progress);
      console.log(`📸 Images loaded: ${loaded}/${total} (${Math.round(progress)}%)`);
    }).then(() => {
      console.log('✅ All images preloaded');
      setLoadingProgress(90); // Set to 90% when all images loaded
    });
  }, [galleryImages]);

  // Loading simulation - Track 3D scene loading
  useEffect(() => {
    let progress = loadingProgress;
    const interval = setInterval(() => {
      progress += Math.random() * 3;
      if (progress >= 100) {
        progress = 100;
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        clearInterval(interval);
      } else {
        setLoadingProgress(progress);
      }
    }, 200);
    
    return () => clearInterval(interval);
  }, [loadingProgress]);
  
  // Initialize Audio
  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;
    audio.volume = musicState.volume;
    return () => { audio.pause(); };
  }, []);

  // Handle Play/Pause
  useEffect(() => {
    audioRef.current.volume = musicState.volume;
    if (musicState.playing) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.warn("Autoplay blocked:", e));
      }
    } else {
      audioRef.current.pause();
    }
  }, [musicState.playing, musicState.volume]);

  // Global Interaction Logic
  useEffect(() => {
    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      // 1. Audio Unlock
      if (!hasInteractedRef.current) {
        hasInteractedRef.current = true;
        if (!musicState.playing) {
           setMusicState(prev => ({ ...prev, playing: true }));
        }
      }

      // Get click position first
      let clientX, clientY;
      if (e instanceof MouseEvent) {
          clientX = e.clientX;
          clientY = e.clientY;
      } else {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      }

      // 2. Click Counting (ẩn - không hiển thị gì, chỉ để tracking nếu cần)
      setClickCount(prev => prev + 1);
      
      // Tree Shake Animation
      setTreeShake(true);
      setTimeout(() => setTreeShake(false), 200);
      
      // Random Animation Type (3 loại: orb, confetti, gift)
      const animationTypes: ('orb' | 'confetti' | 'gift')[] = ['orb', 'confetti', 'gift'];
      const randomType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
      setRandomAnimationType(randomType);
      setTimeout(() => setRandomAnimationType(null), 2000);

      // 3. Spawn Visual Effect

      const text = SURPRISE_TEXTS[Math.floor(Math.random() * SURPRISE_TEXTS.length)];
      const color = SURPRISE_COLORS[Math.floor(Math.random() * SURPRISE_COLORS.length)];
      const newEffect: ClickEffect = {
          id: effectIdRef.current++,
          x: clientX,
          y: clientY,
          content: text,
          color: color,
          rotation: (Math.random() - 0.5) * 45 // Random tilt
      };

      setClickEffects(prev => [...prev, newEffect]);
      setTimeout(() => {
          setClickEffects(prev => prev.filter(ef => ef.id !== newEffect.id));
      }, 1500);
    };

    // Wind Logic (Mouse Move)
    const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        // Gentle wind influence
        setWindDirection([x * 0.5, 0]); 
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('mousedown', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [musicState.playing]);

  // Resize Listener
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Handlers
  const toggleMusic = () => setMusicState(prev => ({ ...prev, playing: !prev.playing }));
  const changeVolume = (val: number) => setMusicState(prev => ({ ...prev, volume: val }));
  
  const handleAddLoveMessage = (text: string) => {
    const newMessage: LoveMessage = {
      id: Date.now(),
      text,
      timestamp: new Date()
    };
    setLoveMessages(prev => [newMessage, ...prev]);
  };

  const handleDeleteLoveMessage = (id: number) => {
    setLoveMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleOrnamentClick = () => {
    // Get random love message
    const randomMessage = ORNAMENT_LOVE_MESSAGES[Math.floor(Math.random() * ORNAMENT_LOVE_MESSAGES.length)];
    setOrnamentLoveMessage(randomMessage);
    
    // Create halo and text effect
    const text = "Love";
    const newEffect: OrnamentClickEffect = {
      id: ornamentEffectIdRef.current++,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      text: text,
      halo: true
    };
    
    setOrnamentEffects(prev => [...prev, newEffect]);
    setTimeout(() => {
      setOrnamentEffects(prev => prev.filter(ef => ef.id !== newEffect.id));
    }, 2000);
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setOrnamentLoveMessage(null);
    }, 5000);
  };

  const handleGenerateWish = async () => {
    setWishState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const wish = await generateRomanticWish();
      setWishState({ text: wish, loading: false, error: null });
    } catch (error) {
      setWishState({ text: 'Chúc em một mùa Giáng sinh an lành!', loading: false, error: 'Error' });
    }
  };

  const handleTreeDoubleClick = () => {
    setShowFireworks(true);
    setTimeout(() => setShowFireworks(false), 5000); // Fireworks last 5 seconds
  };

  const handleGiftBoxOpen = () => {
    playSuccessSound(); // Sound effect
    // Random gift message when gift box is opened
    const randomMessage = GIFT_MESSAGES[Math.floor(Math.random() * GIFT_MESSAGES.length)];
    const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
    setSelectedGiftMessage(randomMessage.message);
    setSelectedGalleryImage(randomImage);
  };

  const handleHotspotClick = (hotspotId: number) => {
    playPopSound();
    setDiscoveredHotspots(prev => new Set([...prev, hotspotId]));
  };

  const handleHeartPhotoClick = () => {
    // Đổi sang ảnh tiếp theo trong gallery
    setCurrentHeartPhotoIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handleCarouselPhotoClick = (image: GalleryImage) => {
    playPopSound(); // Sound effect khi click ảnh
    setSelectedGalleryImage(image); // Hiển thị popup với thông tin ảnh
  };

  // Smooth zoom with lerp interpolation
  const targetRadiusRef = useRef(4.5);
  const currentRadiusRef = useRef(4.5);
  const zoomAnimationRef = useRef<number | null>(null);

  // Zoom handler for continuous zoom control with smooth interpolation
  const handleZoom = useCallback((zoomDelta: number) => {
    // Update target radius
    targetRadiusRef.current = Math.max(2.5, Math.min(7, targetRadiusRef.current + zoomDelta));
    
    // Cancel previous animation if exists
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current);
    }
    
    // Smooth lerp animation
    const animate = () => {
      const current = currentRadiusRef.current;
      const target = targetRadiusRef.current;
      const diff = target - current;
      
      // Lerp với tốc độ cao (0.15) để mượt và responsive
      if (Math.abs(diff) > 0.01) {
        currentRadiusRef.current = current + diff * 0.15;
        setCarouselRadius(currentRadiusRef.current);
        zoomAnimationRef.current = requestAnimationFrame(animate);
      } else {
        currentRadiusRef.current = target;
        setCarouselRadius(target);
        zoomAnimationRef.current = null;
      }
    };
    
    animate();
  }, []);

  // Gesture handlers
  const handleGesture = (gesture: GestureType) => {
    console.log('Gesture detected:', gesture);
    playPopSound();

    switch (gesture) {
      case 'wave':
        // Vẫy tay → Mở gallery panel
        const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
        setSelectedGalleryImage(randomImage);
        break;
      
      case 'point':
        // Chỉ tay → Tương tác với ảnh carousel (next image)
        setCurrentHeartPhotoIndex((prev) => (prev + 1) % galleryImages.length);
        break;
      
      case 'fist':
        // Nắm tay → Đóng popup
        setSelectedGalleryImage(null);
        setSelectedGiftMessage(null);
        break;
      
      case 'ok':
        // OK sign → Trigger fireworks
        handleTreeDoubleClick();
        break;
      
      case 'thumbs_up':
        // Thumbs up → Mở gift box
        handleGiftBoxOpen();
        break;
      
      case 'peace':
        // Peace sign → Toggle music
        toggleMusic();
        break;
      
      default:
        break;
    }
  };
  
  // Tự động đổi ảnh sau mỗi 8 giây
  useEffect(() => {
    if (!isLoading && galleryImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentHeartPhotoIndex((prev) => (prev + 1) % galleryImages.length);
      }, 8000); // Đổi ảnh mỗi 8 giây
      return () => clearInterval(interval);
    }
  }, [isLoading, galleryImages.length]);

  // Show welcome popup on first load
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && !isLoading) {
      setTimeout(() => {
        setShowWelcomePopup(true);
      }, 1500);
    }
  }, [isLoading]);

  // Check for secret message (all hotspots discovered)
  useEffect(() => {
    if (discoveredHotspots.size >= 4 && !showSecretMessage) {
      setTimeout(() => {
        setShowSecretMessage(true);
        playSuccessSound();
      }, 1000);
    }
  }, [discoveredHotspots, showSecretMessage]);

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden select-none font-sans cursor-crosshair">
      {/* Loading Screen */}
      {isLoading && (
        <LoadingScreen progress={loadingProgress} message="Đang tải scene 3D..." />
      )}
      
      {/* Main Content */}
      <div className={isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-500'}>
        <Scene 
          isDesktop={isDesktop} 
          memories={[]}
          onMemoryClick={handleOrnamentClick}
          windDirection={windDirection}
          treeShake={treeShake}
          showFireworks={showFireworks}
          onGiftOpen={handleGiftBoxOpen}
          onTreeDoubleClick={handleTreeDoubleClick}
          heartPhotoUrl={galleryImages[currentHeartPhotoIndex]?.url}
          onHeartPhotoClick={handleHeartPhotoClick}
          currentHeartPhotoIndex={currentHeartPhotoIndex}
          carouselImages={galleryImages}
          onCarouselPhotoClick={handleCarouselPhotoClick}
          carouselRadius={carouselRadius}
        />
        
        <Overlay 
        wishState={wishState} 
        onGenerateWish={handleGenerateWish}
        musicState={musicState}
        onToggleMusic={toggleMusic}
        onVolumeChange={changeVolume}
        loveMessages={loveMessages}
        onAddLoveMessage={handleAddLoveMessage}
        onDeleteLoveMessage={handleDeleteLoveMessage}
        clickEffects={clickEffects}
        ornamentEffects={ornamentEffects}
        ornamentLoveMessage={ornamentLoveMessage}
        onCloseOrnamentMessage={() => setOrnamentLoveMessage(null)}
        galleryImages={galleryImages}
        selectedGalleryImage={selectedGalleryImage}
        onSelectGalleryImage={setSelectedGalleryImage}
        onCloseGalleryImage={() => setSelectedGalleryImage(null)}
        gifts={gifts}
        onGiftClick={(gift) => {
          // Random message và image khi click vào gift
          const randomMessage = GIFT_MESSAGES[Math.floor(Math.random() * GIFT_MESSAGES.length)];
          const randomImage = galleryImages[Math.floor(Math.random() * galleryImages.length)];
          setSelectedGiftMessage(randomMessage.message);
          setSelectedGalleryImage(randomImage);
          setGifts(prev => prev.filter(g => g.id !== gift.id));
        }}
        selectedGiftMessage={selectedGiftMessage}
        onCloseGiftMessage={() => {
          setSelectedGiftMessage(null);
          setSelectedGalleryImage(null);
        }}
        secretUnlocked={false}
        clickCount={clickCount}
        giftMessages={GIFT_MESSAGES.map(g => g.message)}
        secretDiscoveryPopup={false}
        randomAnimationType={randomAnimationType}
        showSecretMessage={showSecretMessage}
        onCloseSecretMessage={() => setShowSecretMessage(false)}
        showWelcomePopup={showWelcomePopup}
        onCloseWelcomePopup={() => {
          setShowWelcomePopup(false);
          localStorage.setItem('hasSeenWelcome', 'true');
        }}
        onHotspotClick={handleHotspotClick}
      />
      
      {/* Gesture Controller - Camera-based gesture recognition */}
      <GestureController 
        onGesture={handleGesture}
        onZoom={handleZoom}
        enabled={isDesktop} // Chỉ bật trên desktop để tránh lag trên mobile
      />
      </div>
    </div>
  );
};

export default App;