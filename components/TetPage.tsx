import React, { useState, useEffect, useRef, useCallback } from 'react';
import TetScene from './TetScene';
import TetOverlay from './TetOverlay';
import LoadingScreen from './LoadingScreen';
import { WishState, MusicState, ClickEffect } from '../types';
import { generateRomanticWish } from '../services/geminiService';
import { playPopSound, playSuccessSound } from '../utils/soundEffects';
import { loadGalleryImages, preloadImages, GalleryImage } from '../utils/imageLoader';
import { useResponsive } from '../hooks/useResponsive';

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

// SIMULATION MODE: Set to false for production
const IS_SIMULATION_MODE = false;

// Countdown Display Component
const CountdownDisplay: React.FC<{ onFinish?: () => void; onNearEnd?: () => void }> = ({ onFinish, onNearEnd }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const targetDateRef = useRef<Date>(new Date('2026-01-01T00:00:00+07:00'));
    const hasTriggeredNearEndRef = useRef(false);

    useEffect(() => {
        // Real countdown to Tet 2026 - Giao thừa (Midnight Jan 1, 2026 Vietnam time)
        // Target: 2026-01-01T00:00:00+07:00 (Vietnam timezone)
        targetDateRef.current = new Date('2026-01-01T00:00:00+07:00');
    }, []);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const diff = targetDateRef.current.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                if (onFinish) onFinish();
                return;
            }

            // Auto trigger music at 20s remaining
            if (diff <= 20000 && !hasTriggeredNearEndRef.current) {
                hasTriggeredNearEndRef.current = true;
                if (onNearEnd) onNearEnd();
            }

            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [onFinish, onNearEnd]);

    return (
        <div className="flex justify-center gap-2 md:gap-4 mb-8">
            {[
                { value: timeLeft.days, label: 'Ngày' },
                { value: timeLeft.hours, label: 'Giờ' },
                { value: timeLeft.minutes, label: 'Phút' },
                { value: timeLeft.seconds, label: 'Giây' }
            ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                    <div className={`w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-amber-400/50 shadow-lg ${item.value <= 20 && timeLeft.minutes === 0 && timeLeft.hours === 0 ? 'animate-[pulse_0.5s_infinite]' : 'animate-[pulse_1s_infinite]'}`}>
                        <span className="font-bold text-xl md:text-3xl text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {String(item.value).padStart(2, '0')}
                        </span>
                    </div>
                    <span className="text-[10px] md:text-xs text-amber-200 mt-1">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const TetPage: React.FC<TetPageProps> = ({ galleryImages: externalGalleryImages }) => {
    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Flow: Countdown (Default) -> Main Content
    // Logic: 
    // 1. Show Countdown immediately.
    // 2. Click ANYWHERE to start Music.
    // 3. Auto-enter party when countdown finishes (Simulation Mode) OR user clicks "Vào Tiệc".
    const [showCountdown, setShowCountdown] = useState(true);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);

    // Gallery images
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(externalGalleryImages || []);
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);
    const [currentHeartPhotoIndex, setCurrentHeartPhotoIndex] = useState(0);

    // Wish state
    const [wishState, setWishState] = useState<WishState>({ text: "", loading: false, error: null });

    // Music state
    const [musicState, setMusicState] = useState<MusicState>({ playing: false, volume: 0.5 });
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

    // Layout - Use responsive hook
    const { isDesktop, isMobile, isSmallMobile } = useResponsive();
    const [carouselRadius, setCarouselRadius] = useState(4.5);

    // Time-based surprise effects
    const [surpriseMessage, setSurpriseMessage] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [autoFireworksCount, setAutoFireworksCount] = useState(0);
    const [fireworksIntensity, setFireworksIntensity] = useState<'normal' | 'high'>('normal');

    // Enter Party -> Hide Countdown + Unlock Audio
    const handleEnterParty = useCallback(() => {
        if (!showCountdown) return; // Prevent double trigger
        setShowCountdown(false);
        // Autoplay music
        const audio = audioRef.current;
        audio.play().then(() => {
            setMusicState(prev => ({ ...prev, playing: true }));
            setAutoplayBlocked(false);
        }).catch(e => {
            console.warn("Audio play failed:", e);
            setAutoplayBlocked(true);
        });
        // Trigger celebration effects - GRAND OPENING MODE
        playSuccessSound();
        setShowFireworks(true);
        setFireworksIntensity('high'); // Bắn liên tục, dồn dập

        // Sau 20s giảm nhiệt
        setTimeout(() => setFireworksIntensity('normal'), 20000);

        // Sau 25s tắt pháo hoa (để user tập trung nội dung khác)
        setTimeout(() => setShowFireworks(false), 25000);
    }, [showCountdown]);

    // Handle generic interaction on Countdown to play music without entering
    // This allows user to tap screen at 20s mark to let browser know "I'm here", allowing audio to play
    const handleCountdownInteraction = () => {
        if (!musicState.playing) {
            const audio = audioRef.current;
            audio.play().then(() => {
                setMusicState(prev => ({ ...prev, playing: true }));
                setAutoplayBlocked(false);
            }).catch(e => {
                console.warn("Audio play failed:", e);
                setAutoplayBlocked(true);
            });
        }
    };

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
        try {
            const audio = audioRef.current;
            audio.loop = true;
            audio.volume = musicState.volume;
            // Clean up old listeners if any
            return () => { audio.pause(); };
        } catch (e) {
            console.error("Audio init error", e);
        }
    }, []);

    // Handle Play/Pause
    useEffect(() => {
        try {
            audioRef.current.volume = musicState.volume;
            if (musicState.playing) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.warn("Autoplay blocked:", e));
                }
            } else {
                audioRef.current.pause();
            }
        } catch (e) {
            console.error("Audio control error", e);
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
        // Resize handling is now done by useResponsive hook
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

    const handleCloseEnvelope = () => {
        setShowEnvelope(false);
    };

    const handleZoom = useCallback((zoomDelta: number) => {
        setCarouselRadius(prev => Math.max(2.5, Math.min(7, prev + zoomDelta)));
    }, []);

    return (
        <div className="w-full h-screen relative bg-gradient-to-b from-[#1a0505] to-[#3d1010] overflow-hidden select-none font-sans">
            {/* Loading Screen */}
            {isLoading && (
                <LoadingScreen progress={loadingProgress} message="Đang chuẩn bị..." />
            )}

            {/* COUNTDOWN SCREEN (DEFAULT) - Shows immediately */}
            {showCountdown && !isLoading && (
                <div
                    className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-gradient-to-b from-red-950 via-red-900 to-black cursor-pointer"
                    onClick={handleCountdownInteraction} // Click anywhere to play music
                >
                    <div className="text-center px-4 animate-[fadeIn_0.5s_ease-out]">
                        <div className="text-4xl md:text-5xl mb-4">🧧</div>
                        <h1 className="font-vibes text-2xl md:text-3xl text-amber-400 mb-2">
                            Gửi TRÂN Yêu Thương
                        </h1>
                        <p className="text-amber-200/80 text-sm md:text-base mb-6">
                            Đếm ngược đến Giao thừa 2026
                        </p>

                        {/* Live countdown */}
                        <CountdownDisplay
                            onFinish={handleEnterParty}
                            onNearEnd={handleCountdownInteraction} // Auto play music at 20s
                        />

                        {/* Enter Party button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Avoid double trigger
                                handleEnterParty();
                            }}
                            className="mt-8 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-8 py-3 md:px-10 md:py-4 rounded-full text-base md:text-lg shadow-[0_0_20px_rgba(251,191,36,0.6)] transition-all hover:scale-105 active:scale-95 animate-bounce"
                        >
                            Vào Tiệc Ngay 🎉
                        </button>

                        {!musicState.playing && !autoplayBlocked && (
                            <p className="mt-4 text-xs text-amber-200/50 animate-pulse">(Chạm vào màn hình để bật nhạc)</p>
                        )}

                        {/* Autoplay Blocked Fallback Info */}
                        {autoplayBlocked && (
                            <div className="absolute inset-0 z-[310] flex items-center justify-center bg-red-950/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCountdownInteraction();
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xl px-8 py-6 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-[ping_1s_ease-in-out_infinite] border-4 border-amber-400"
                                >
                                    🎵 BẬT NHẠC
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content - Optimized for mobile */}
            <div className={isLoading || showCountdown ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-500'}>
                <TetScene
                    isDesktop={isDesktop}
                    showFireworks={showFireworks}
                    fireworksIntensity={fireworksIntensity}
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
                    onCloseEnvelope={handleCloseEnvelope}
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
