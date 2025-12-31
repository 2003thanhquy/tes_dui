import React, { useState, useEffect, useRef, useCallback } from 'react';
import TetScene from './TetScene';
import TetOverlay from './TetOverlay';
import LoadingScreen from './LoadingScreen';
import { WishState, MusicState, ClickEffect } from '../types';
import { generateRomanticWish } from '../services/geminiService';
import { playPopSound, playSuccessSound } from '../utils/soundEffects';
import { loadGalleryImages, preloadImages, GalleryImage } from '../utils/imageLoader';

// Tet-specific love messages for TRÂN
const TET_LOVE_MESSAGES = [
    "TRÂN ơi, năm mới tình yêu mới thăng hoa! Anh yêu em mãi mãi 💕",
    "Chúc TRÂN năm mới an khang thịnh vượng, luôn xinh đẹp trong mắt anh 🧧",
    "Mùa xuân này và mọi mùa xuân sau, anh đều muốn ở bên TRÂN 🌸",
    "TRÂN là may mắn lớn nhất của đời anh! Chúc mừng năm mới ❤️",
    "Năm Rắn chúc TRÂN luôn khỏe mạnh, hạnh phúc và được yêu thương 🐍💝",
    "Anh muốn cùng TRÂN đón Tết mãi mãi... Yêu em! 🎊",
];

const SURPRISE_TEXTS = ["TRÂN", "Phúc", "Lộc", "❤️", "Yêu TRÂN", "🧧", "✨", "💕"];
const SURPRISE_COLORS = ["#fbbf24", "#dc2626", "#f472b6", "#22c55e", "#ffffff"];

const TET_AUDIO_URL = "/tet-music.mp3"; // Happy New Year Remix - đã nén

interface TetPageProps {
    galleryImages?: GalleryImage[];
}

// Surprise messages - Unified icons (❤️🧧✨ only), personalized for TRÂN
const RANDOM_SURPRISE_MESSAGES = [
    "❤️ Anh yêu TRÂN!",
    "🧧 Chúc TRÂN phát tài!",
    "✨ TRÂN là ngôi sao!",
    "❤️ Mãi bên TRÂN!",
];

const TetPage: React.FC<TetPageProps> = ({ galleryImages: externalGalleryImages }) => {
    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Gallery images
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(externalGalleryImages || []);
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);
    const [currentHeartPhotoIndex, setCurrentHeartPhotoIndex] = useState(0);

    // Wish state
    const [wishState, setWishState] = useState<WishState>({
        text: "",
        loading: false,
        error: null,
    });

    // Music state
    const [musicState, setMusicState] = useState<MusicState>({
        playing: false,
        volume: 0.5
    });
    const audioRef = useRef<HTMLAudioElement>(new Audio(TET_AUDIO_URL));
    const hasInteractedRef = useRef(false);

    // Visual effects
    const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
    const effectIdRef = useRef(0);
    const [windDirection, setWindDirection] = useState<[number, number]>([0, 0]);
    const [showFireworks, setShowFireworks] = useState(false);

    // Lantern message
    const [lanternMessage, setLanternMessage] = useState<string | null>(null);

    // Envelope state
    const [showEnvelope, setShowEnvelope] = useState(true);
    const [envelopeMessage] = useState<string>(
        TET_LOVE_MESSAGES[Math.floor(Math.random() * TET_LOVE_MESSAGES.length)]
    );

    // Layout
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [carouselRadius, setCarouselRadius] = useState(4.5);

    // Time-based surprise effects
    const [surpriseMessage, setSurpriseMessage] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [autoFireworksCount, setAutoFireworksCount] = useState(0);

    // Load gallery images
    useEffect(() => {
        if (!externalGalleryImages) {
            const images = loadGalleryImages(10, false);
            setGalleryImages(images);
        }
    }, [externalGalleryImages]);

    // Preload images
    useEffect(() => {
        if (galleryImages.length === 0) {
            setLoadingProgress(100);
            setTimeout(() => setIsLoading(false), 500);
            return;
        }

        preloadImages(galleryImages, (loaded, total) => {
            const progress = Math.min(90, (loaded / total) * 85);
            setLoadingProgress(progress);
        }).then(() => {
            setLoadingProgress(90);
        });
    }, [galleryImages]);

    // Loading simulation
    useEffect(() => {
        let progress = loadingProgress;
        const interval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress >= 100) {
                progress = 100;
                setLoadingProgress(100);
                setTimeout(() => setIsLoading(false), 500);
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
            // Audio Unlock
            if (!hasInteractedRef.current) {
                hasInteractedRef.current = true;
                if (!musicState.playing) {
                    setMusicState(prev => ({ ...prev, playing: true }));
                }
            }

            // Get click position
            let clientX, clientY;
            if (e instanceof MouseEvent) {
                clientX = e.clientX;
                clientY = e.clientY;
            } else {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }

            // Spawn Visual Effect
            const text = SURPRISE_TEXTS[Math.floor(Math.random() * SURPRISE_TEXTS.length)];
            const color = SURPRISE_COLORS[Math.floor(Math.random() * SURPRISE_COLORS.length)];
            const newEffect: ClickEffect = {
                id: effectIdRef.current++,
                x: clientX,
                y: clientY,
                content: text,
                color: color,
                rotation: (Math.random() - 0.5) * 45
            };

            setClickEffects(prev => [...prev, newEffect]);
            setTimeout(() => {
                setClickEffects(prev => prev.filter(ef => ef.id !== newEffect.id));
            }, 1500);
        };

        // Wind Logic
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
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

    // Auto change heart photo
    useEffect(() => {
        if (!isLoading && galleryImages.length > 0) {
            const interval = setInterval(() => {
                setCurrentHeartPhotoIndex((prev) => (prev + 1) % galleryImages.length);
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [isLoading, galleryImages.length]);

    // ===== TIME-BASED EFFECTS (reduced frequency) =====

    // Auto fireworks every 10-15 seconds
    useEffect(() => {
        if (isLoading) return;

        const triggerAutoFireworks = () => {
            setShowFireworks(true);
            setAutoFireworksCount(prev => prev + 1);
            playSuccessSound();
            setTimeout(() => setShowFireworks(false), 4000);
        };

        // Initial fireworks after 5 seconds
        const initialTimer = setTimeout(triggerAutoFireworks, 5000);

        // Random fireworks every 10-15 seconds
        const interval = setInterval(() => {
            if (Math.random() > 0.3) {
                triggerAutoFireworks();
            }
        }, 10000 + Math.random() * 5000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isLoading]);

    // Surprise messages every 12-18 seconds
    useEffect(() => {
        if (isLoading) return;

        const showRandomMessage = () => {
            const message = RANDOM_SURPRISE_MESSAGES[Math.floor(Math.random() * RANDOM_SURPRISE_MESSAGES.length)];
            setSurpriseMessage(message);
            playPopSound();
            setTimeout(() => setSurpriseMessage(null), 3000);
        };

        // First message after 8 seconds
        const initialTimer = setTimeout(showRandomMessage, 8000);

        // Messages every 12-18 seconds
        const interval = setInterval(() => {
            if (Math.random() > 0.4) {
                showRandomMessage();
            }
        }, 12000 + Math.random() * 6000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isLoading]);

    // Confetti burst every 5-7 seconds
    useEffect(() => {
        if (isLoading) return;

        const triggerConfetti = () => {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
        };

        // First confetti after 4 seconds
        const initialTimer = setTimeout(triggerConfetti, 4000);

        // Random confetti every 5-7 seconds
        const interval = setInterval(() => {
            if (Math.random() > 0.4) { // 60% chance
                triggerConfetti();
            }
        }, 5000 + Math.random() * 2000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isLoading]);

    // Handlers
    const toggleMusic = () => setMusicState(prev => ({ ...prev, playing: !prev.playing }));
    const changeVolume = (val: number) => setMusicState(prev => ({ ...prev, volume: val }));

    const handleGenerateWish = async () => {
        setWishState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const wish = await generateRomanticWish();
            setWishState({ text: wish, loading: false, error: null });
        } catch (error) {
            // Fallback to Tet-specific message
            const fallbackMessage = TET_LOVE_MESSAGES[Math.floor(Math.random() * TET_LOVE_MESSAGES.length)];
            setWishState({ text: fallbackMessage, loading: false, error: null });
        }
    };

    const handleLanternClick = (message: string) => {
        playPopSound();
        setLanternMessage(message);
        // Trigger fireworks occasionally
        if (Math.random() > 0.5) {
            setShowFireworks(true);
            setTimeout(() => setShowFireworks(false), 5000);
        }
    };

    const handleHeartPhotoClick = () => {
        setCurrentHeartPhotoIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const handleCarouselPhotoClick = (image: GalleryImage) => {
        playPopSound();
        setSelectedGalleryImage(image);
    };

    const handleOpenEnvelope = () => {
        playSuccessSound();
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 5000);
    };

    const handleZoom = useCallback((zoomDelta: number) => {
        setCarouselRadius(prev => Math.max(2.5, Math.min(7, prev + zoomDelta)));
    }, []);

    return (
        <div className="w-full h-screen relative bg-gradient-to-b from-[#1a0505] to-[#3d1010] overflow-hidden select-none font-sans cursor-crosshair">
            {/* Loading Screen */}
            {isLoading && (
                <LoadingScreen progress={loadingProgress} message="Đang chuẩn bị Tết 2026..." />
            )}

            {/* Main Content */}
            <div className={isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-500'}>
                <TetScene
                    isDesktop={isDesktop}
                    showFireworks={showFireworks}
                    windDirection={windDirection}
                    onLanternClick={handleLanternClick}
                    heartPhotoUrl={galleryImages[currentHeartPhotoIndex]?.url}
                    onHeartPhotoClick={handleHeartPhotoClick}
                    currentHeartPhotoIndex={currentHeartPhotoIndex}
                    carouselImages={galleryImages}
                    onCarouselPhotoClick={handleCarouselPhotoClick}
                    carouselRadius={carouselRadius}
                />

                <TetOverlay
                    wishState={wishState}
                    onGenerateWish={handleGenerateWish}
                    musicState={musicState}
                    onToggleMusic={toggleMusic}
                    onVolumeChange={changeVolume}
                    clickEffects={clickEffects}
                    galleryImages={galleryImages}
                    selectedGalleryImage={selectedGalleryImage}
                    onSelectGalleryImage={setSelectedGalleryImage}
                    onCloseGalleryImage={() => setSelectedGalleryImage(null)}
                    lanternMessage={lanternMessage}
                    onCloseLanternMessage={() => setLanternMessage(null)}
                    showEnvelope={showEnvelope}
                    onOpenEnvelope={handleOpenEnvelope}
                    envelopeMessage={envelopeMessage}
                    surpriseMessage={surpriseMessage}
                    onCloseSurpriseMessage={() => setSurpriseMessage(null)}
                    showConfetti={showConfetti}
                />
            </div>
        </div>
    );
};

export default TetPage;
