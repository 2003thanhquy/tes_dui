import React, { useState, useEffect, useRef } from 'react';
import { WishState, MusicState, ClickEffect, LoveMessage, Gift } from '../types';
import { GalleryImage } from '../utils/imageLoader';

interface TetOverlayProps {
    wishState: WishState;
    onGenerateWish: () => void;
    musicState: MusicState;
    onToggleMusic: () => void;
    onVolumeChange: (val: number) => void;
    clickEffects: ClickEffect[];
    galleryImages: GalleryImage[];
    selectedGalleryImage: GalleryImage | null;
    onSelectGalleryImage: (image: GalleryImage) => void;
    onCloseGalleryImage: () => void;
    lanternMessage: string | null;
    onCloseLanternMessage: () => void;
    showEnvelope: boolean;
    onOpenEnvelope: () => void;
    envelopeMessage: string;
    // New time-based effects
    surpriseMessage?: string | null;
    onCloseSurpriseMessage?: () => void;
    showConfetti?: boolean;
}

// Typewriter effect component
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
        }, 50);
        return () => clearInterval(timer);
    }, [text]);
    return <span className="drop-shadow-md">{displayedText}</span>;
};

// Countdown Screen - Hiện trước khi vào nội dung chính
const TetCountdownOverlay: React.FC<{ onSkip?: () => void }> = ({ onSkip }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isPast, setIsPast] = useState(false);
    const [isVisible, setIsVisible] = useState(false); // Restore visibility state

    useEffect(() => {
        const tetDate = new Date('2026-01-01T00:00:00+07:00');

        const updateCountdown = () => {
            const now = new Date();
            const diff = tetDate.getTime() - now.getTime();

            if (diff <= 0) {
                setIsPast(true);
                setIsVisible(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            // Chỉ hiện khi còn < 5 phút để đếm ngược về đích
            const FIVE_MINUTES = 5 * 60 * 1000;
            setIsVisible(diff <= FIVE_MINUTES);

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
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-red-950 via-red-900 to-black">
            {isPast ? (
                // ĐÃ GIAO THỪA
                <div className="text-center animate-[popIn_0.5s_ease-out] px-4">
                    <div className="text-5xl md:text-7xl mb-4">🎆🧧🎆</div>
                    <h1 className="font-vibes text-3xl md:text-5xl text-amber-400 mb-4">
                        CHÚC MỪNG NĂM MỚI 2026!
                    </h1>
                    <p className="text-lg md:text-xl text-amber-100 mb-6">
                        ❤️ Chúc TRÂN năm mới hạnh phúc! ❤️
                    </p>
                    {onSkip && (
                        <button onClick={onSkip} className="bg-amber-500 hover:bg-amber-400 text-red-900 font-bold px-6 py-3 rounded-full text-lg">
                            Xem nội dung →
                        </button>
                    )}
                </div>
            ) : (
                // COUNTDOWN
                <div className="text-center px-4">
                    <div className="text-4xl md:text-5xl mb-4">🧧</div>
                    <h1 className="font-vibes text-2xl md:text-3xl text-amber-400 mb-2">
                        Gửi TRÂN Yêu Thương
                    </h1>
                    <p className="text-amber-200/80 text-sm md:text-base mb-6">Đếm ngược đến Giao thừa 2026</p>

                    {/* Countdown boxes */}
                    <div className="flex justify-center gap-2 md:gap-4 mb-8">
                        {[
                            { value: timeLeft.days, label: 'Ngày' },
                            { value: timeLeft.hours, label: 'Giờ' },
                            { value: timeLeft.minutes, label: 'Phút' },
                            { value: timeLeft.seconds, label: 'Giây' }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-amber-400/50 shadow-lg">
                                    <span className="font-bold text-xl md:text-3xl text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                        {String(item.value).padStart(2, '0')}
                                    </span>
                                </div>
                                <span className="text-[10px] md:text-xs text-amber-200 mt-1">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Skip button */}
                    {onSkip && (
                        <button
                            onClick={onSkip}
                            className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-6 py-3 rounded-full text-sm md:text-base shadow-lg transition-all hover:scale-105"
                        >
                            Xem nội dung ngay →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// Love Envelope Component
const LoveEnvelope: React.FC<{
    isOpen: boolean;
    onOpen: () => void;
    message: string;
}> = ({ isOpen, onOpen, message }) => {
    return (
        <div className="relative flex flex-col items-center">
            {!isOpen ? (
                // Closed envelope
                <div
                    onClick={onOpen}
                    className="cursor-pointer group transition-all duration-500 hover:scale-110"
                >
                    <div className="relative">
                        {/* Envelope body */}
                        <div className="w-40 h-28 md:w-56 md:h-40 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.5)] border-2 border-amber-400/50 flex items-center justify-center">
                            {/* Gold seal */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                <span className="text-2xl md:text-3xl">💕</span>
                            </div>

                            {/* Decorative corners */}
                            <div className="absolute top-2 left-2 text-amber-400 text-lg">✿</div>
                            <div className="absolute top-2 right-2 text-amber-400 text-lg">✿</div>
                            <div className="absolute bottom-2 left-2 text-amber-400 text-lg">✿</div>
                            <div className="absolute bottom-2 right-2 text-amber-400 text-lg">✿</div>
                        </div>

                        {/* Envelope flap */}
                        <div className="absolute -top-1 left-0 w-full">
                            <div
                                className="w-0 h-0 mx-auto border-l-[80px] md:border-l-[112px] border-l-transparent border-r-[80px] md:border-r-[112px] border-r-transparent border-b-[60px] md:border-b-[80px] border-b-red-800"
                                style={{ filter: 'drop-shadow(0 -2px 4px rgba(0,0,0,0.3))' }}
                            />
                        </div>
                    </div>

                    {/* Hint text */}
                    <div className="mt-4 text-amber-200 text-sm md:text-base font-vibes animate-bounce">
                        📩 Nhấn để mở thư tình
                    </div>
                </div>
            ) : (
                // Open envelope with message
                <div className="animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
                    {/* Confetti animation */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 rounded-sm animate-[confettiFall_2s_ease-out_forwards]"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: '-10px',
                                    backgroundColor: ['#fbbf24', '#dc2626', '#f472b6', '#22c55e'][i % 4],
                                    animationDelay: `${Math.random() * 0.5}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Message card */}
                    <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 p-6 md:p-8 rounded-2xl shadow-[0_0_40px_rgba(251,191,36,0.5)] border-4 border-amber-400 max-w-sm">
                        {/* Decorative header */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-1 rounded-full border-2 border-amber-400">
                            <span className="text-white font-vibes text-sm">💌 Thư tình</span>
                        </div>

                        {/* Heart decorations */}
                        <div className="absolute top-2 right-2 text-2xl animate-pulse">❤️</div>
                        <div className="absolute bottom-2 left-2 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>💕</div>

                        {/* Message content */}
                        <div className="text-center pt-4">
                            <div className="font-vibes text-xl md:text-2xl text-red-700 leading-relaxed">
                                <TypewriterText text={message} />
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="mt-6 text-right font-vibes text-red-600 text-lg">
                            - Người yêu em 💝
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Interactive Lucky Cards - Unified icons (❤️🧧✨ only)
const LUCKY_CARD_MESSAGES = [
    { icon: "🧧", title: "Lì xì", message: "TRÂN ơi, chúc em phát tài!", color: "from-red-500 to-red-700" },
    { icon: "❤️", title: "Yêu thương", message: "Anh yêu TRÂN mãi mãi!", color: "from-pink-500 to-rose-600" },
    { icon: "✨", title: "May mắn", message: "Chúc TRÂN năm mới tỏa sáng!", color: "from-amber-400 to-yellow-600" },
];

const InteractiveLuckyCards: React.FC<{ onReveal: (msg: string) => void }> = ({ onReveal }) => {
    const [revealed, setRevealed] = useState<Set<number>>(new Set());
    const [popup, setPopup] = useState<{ title: string; message: string } | null>(null);

    const handleClick = (i: number) => {
        if (revealed.has(i)) return;
        const card = LUCKY_CARD_MESSAGES[i];
        setRevealed(prev => new Set([...prev, i]));
        setPopup({ title: card.title, message: card.message });
        onReveal(card.message);
        setTimeout(() => setPopup(null), 2500);
    };

    return (
        <div className="relative">
            <div className="flex gap-2 md:gap-3 justify-center">
                {LUCKY_CARD_MESSAGES.map((card, i) => (
                    <div
                        key={i}
                        onClick={() => handleClick(i)}
                        className={`cursor-pointer transition-all duration-300 ${revealed.has(i) ? 'scale-90 opacity-50' : 'hover:scale-110 active:scale-95'}`}
                    >
                        <div className={`w-12 h-14 md:w-14 md:h-18 rounded-lg bg-gradient-to-br ${card.color} 
                            shadow-lg border border-white/30 flex flex-col items-center justify-center`}>
                            <span className="text-xl md:text-2xl">{card.icon}</span>
                            {!revealed.has(i) && <span className="text-[7px] md:text-[9px] text-white/80 mt-0.5">Nhấn</span>}
                            {revealed.has(i) && <span className="text-white text-sm">✓</span>}
                        </div>
                    </div>
                ))}
            </div>

            {popup && (
                <div className="absolute -top-12 md:-top-14 left-1/2 -translate-x-1/2 z-50 animate-[popIn_0.3s_ease-out]">
                    <div className="bg-white px-3 py-2 md:px-4 md:py-2 rounded-lg shadow-xl border-2 border-amber-400 min-w-[140px]">
                        <div className="font-bold text-red-600 text-xs md:text-sm text-center">{popup.title}</div>
                        <div className="text-red-700 text-[10px] md:text-xs text-center mt-0.5">{popup.message}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TetOverlay: React.FC<TetOverlayProps> = ({
    wishState,
    onGenerateWish,
    musicState,
    onToggleMusic,
    onVolumeChange,
    clickEffects,
    galleryImages,
    selectedGalleryImage,
    onSelectGalleryImage,
    onCloseGalleryImage,
    lanternMessage,
    onCloseLanternMessage,
    showEnvelope,
    onOpenEnvelope,
    envelopeMessage,
    // New props
    surpriseMessage,
    onCloseSurpriseMessage,
    showConfetti = false
}) => {
    const [showPanel, setShowPanel] = useState(false);
    const [envelopeOpen, setEnvelopeOpen] = useState(false);

    // Auto-close lantern message
    useEffect(() => {
        if (lanternMessage) {
            const timer = setTimeout(onCloseLanternMessage, 5000);
            return () => clearTimeout(timer);
        }
    }, [lanternMessage, onCloseLanternMessage]);

    const handleEnvelopeOpen = () => {
        setEnvelopeOpen(true);
        onOpenEnvelope();
    };

    return (
        <>
            {/* ===== CONFETTI BURST EFFECT ===== */}
            {showConfetti && (
                <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-3 h-3 rounded-sm animate-[confettiFall_3s_ease-out_forwards]"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-20px',
                                backgroundColor: ['#fbbf24', '#dc2626', '#f472b6', '#22c55e', '#60a5fa', '#a855f7'][i % 6],
                                animationDelay: `${Math.random() * 1}s`,
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ===== SURPRISE MESSAGE POPUP ===== */}
            {surpriseMessage && (
                <div
                    className="fixed top-1/4 left-1/2 transform -translate-x-1/2 z-[90] animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)] pointer-events-auto"
                    onClick={onCloseSurpriseMessage}
                >
                    <div className="relative bg-gradient-to-r from-red-600 via-amber-500 to-red-600 px-8 py-5 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.8)] border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform">
                        {/* Sparkles */}
                        <div className="absolute -top-2 -left-2 text-2xl animate-ping">✨</div>
                        <div className="absolute -top-2 -right-2 text-2xl animate-ping" style={{ animationDelay: '0.3s' }}>✨</div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xl animate-bounce">🎉</div>

                        {/* Message - READABLE FONT */}
                        <div className="text-2xl md:text-3xl text-white text-center font-bold drop-shadow-lg" style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                            {surpriseMessage}
                        </div>
                    </div>
                </div>
            )}

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

                {/* ===== HEADER - Compact for mobile ===== */}
                <header className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto w-full max-w-sm md:max-w-lg px-3">
                    <div className="relative bg-black/40 backdrop-blur-sm rounded-xl py-2 px-4 md:py-3 md:px-6">
                        <h1
                            className="text-lg sm:text-xl md:text-3xl font-vibes text-center"
                            style={{
                                color: '#fbbf24',
                                textShadow: '0 0 15px rgba(251,191,36,0.5), 1px 1px 2px rgba(0,0,0,0.5)'
                            }}
                        >
                            Gửi TRÂN Yêu Thương
                        </h1>
                        <p className="text-center mt-1 text-[10px] md:text-xs text-amber-100/80" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            ✨ Tết 2026 dành riêng cho em ✨
                        </p>
                    </div>
                </header>

                {/* ===== CTA - Interactive Cards (moved up for mobile) ===== */}
                <div className="absolute top-20 md:top-28 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
                    <div className="text-center mb-1">
                        <span className="text-amber-200/80 text-[10px] md:text-xs bg-black/40 px-2 py-0.5 rounded-full">
                            🎁 Nhấn thẻ để nhận quà
                        </span>
                    </div>
                    <InteractiveLuckyCards onReveal={(msg) => console.log('Revealed:', msg)} />
                </div>

                {/* Gallery Button */}
                {!showPanel && (
                    <button
                        onClick={() => setShowPanel(true)}
                        className="fixed top-16 md:top-20 right-3 md:right-6 z-30 pointer-events-auto bg-gradient-to-r from-red-600/90 to-amber-600/90 hover:from-red-500 hover:to-amber-500 text-white font-vibes text-sm md:text-base px-3 md:px-5 py-1.5 md:py-2 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-110 flex items-center gap-1.5 border border-white/20 touch-manipulation backdrop-blur-sm"
                    >
                        <span className="text-lg md:text-xl">📷</span>
                        <span className="hidden sm:inline">Gallery</span>
                    </button>
                )}

                {/* Lantern Message Popup */}
                {lanternMessage && (
                    <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
                        <div
                            onClick={onCloseLanternMessage}
                            className="bg-gradient-to-r from-red-700 to-amber-600 px-8 py-6 rounded-2xl shadow-[0_0_50px_rgba(251,191,36,0.7)] border-2 border-amber-400/50 cursor-pointer"
                        >
                            <div className="font-vibes text-xl md:text-2xl text-white text-center drop-shadow-lg">
                                {lanternMessage}
                            </div>
                        </div>
                    </div>
                )}

                {/* Love Envelope - Center of screen */}
                {showEnvelope && (
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[50] pointer-events-auto">
                        <LoveEnvelope
                            isOpen={envelopeOpen}
                            onOpen={handleEnvelopeOpen}
                            message={envelopeMessage}
                        />
                    </div>
                )}

                {/* Main Content - Spacer */}
                <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
                    <div className="hidden md:flex flex-1 items-end p-8">
                        <div className="text-amber-200/40 text-sm font-light italic animate-pulse">
                            * Click đèn lồng để xem lời chúc! 🏮
                            <br />
                            * Click lì xì để nhận may mắn! 🧧
                            <br />
                            * Khám phá các bất ngờ ẩn trên màn hình!
                        </div>
                    </div>

                    {/* Backdrop */}
                    {showPanel && (
                        <div
                            onClick={() => setShowPanel(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 animate-[fadeIn_0.3s_ease-out]"
                        />
                    )}

                    {/* Right Panel */}
                    <div
                        className={`fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 pointer-events-auto z-30 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showPanel ? 'translate-x-0' : 'translate-x-full'
                            }`}
                    >
                        <div className="h-full overflow-y-auto pr-2 custom-scrollbar bg-gradient-to-b from-red-950/95 via-red-900/95 to-amber-950/95 backdrop-blur-xl border-l-2 border-amber-600/30 shadow-[0_0_50px_rgba(251,191,36,0.3)]">
                            {/* Panel Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-red-800/50 to-amber-800/50 backdrop-blur-md border-b border-amber-600/30 p-3 md:p-4 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl md:text-2xl animate-pulse">🧧</span>
                                        <h2 className="text-base md:text-xl font-vibes text-white">Kỷ niệm Tết</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowPanel(false)}
                                        className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-xl md:text-lg flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 touch-manipulation"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 md:p-4">
                                {/* AI Wish Generator */}
                                <div className="mb-4 md:mb-6 bg-gradient-to-r from-red-950/50 to-amber-950/50 rounded-lg md:rounded-xl p-4 md:p-6 border-2 border-amber-600/30 group hover:border-amber-500/60 transition-all duration-300 shadow-lg">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl md:text-3xl animate-pulse">✨</span>
                                            <span className="text-amber-200 font-vibes text-lg md:text-2xl">Lời chúc Tết từ AI</span>
                                        </div>
                                        <button
                                            onClick={onGenerateWish}
                                            disabled={wishState.loading}
                                            className="w-full md:w-auto bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-vibes text-sm md:text-base px-4 md:px-6 py-2 md:py-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation border-2 border-white/20"
                                        >
                                            {wishState.loading ? '⏳ Đang tạo...' : '🧧 Tạo lời chúc'}
                                        </button>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-3 md:p-4 min-h-[60px] md:min-h-[80px] flex items-center">
                                        <p className="text-sm md:text-base text-white leading-relaxed">
                                            {wishState.text || (
                                                <span className="text-gray-400 italic">
                                                    💡 Bấm nút để AI tạo lời chúc Tết đặc biệt!
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Gallery Carousel */}
                                <div className="mb-4">
                                    <h2 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                                        📷 Kỷ niệm yêu thương
                                    </h2>
                                    <div className="grid grid-cols-2 gap-2">
                                        {galleryImages.slice(0, 6).map((image) => (
                                            <div
                                                key={image.id}
                                                onClick={() => onSelectGalleryImage(image)}
                                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={image.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                                                    <span className="text-white text-xs font-vibes truncate">{image.title}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Music Player Footer */}
                <footer className="w-full bg-gradient-to-t from-red-950 via-red-950/80 to-transparent p-2 md:p-4 pointer-events-auto z-20">
                    <div className="max-w-md mx-auto flex items-center justify-between gap-2 md:gap-4 bg-red-900/30 backdrop-blur-md rounded-full px-3 md:px-4 py-2 border border-amber-500/20 shadow-lg">
                        <button
                            onClick={onToggleMusic}
                            className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 touch-manipulation ${musicState.playing
                                ? 'bg-amber-600 scale-110 shadow-[0_0_20px_#f59e0b]'
                                : 'bg-gray-700 hover:bg-gray-600 hover:scale-110'
                                }`}
                        >
                            {musicState.playing ? (
                                <div className="flex items-end gap-[2px] h-4">
                                    <div className="w-1 bg-white animate-[bounce_0.5s_infinite] h-2"></div>
                                    <div className="w-1 bg-white animate-[bounce_0.7s_infinite] h-4"></div>
                                    <div className="w-1 bg-white animate-[bounce_0.6s_infinite] h-3"></div>
                                </div>
                            ) : (
                                <span className="text-sm md:text-base">▶</span>
                            )}
                        </button>

                        <div className="flex-1 text-center min-w-0">
                            <p className={`text-[10px] md:text-xs text-amber-200 truncate ${musicState.playing ? 'animate-pulse' : ''}`}>
                                🎵 Nhạc Xuân Tết
                            </p>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={musicState.volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="w-16 md:w-24 accent-amber-500"
                        />
                    </div>
                </footer>
            </div>

            {/* Gallery Lightbox */}
            {selectedGalleryImage && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]"
                    onClick={onCloseGalleryImage}
                >
                    <div
                        className="relative bg-gradient-to-br from-red-900/95 to-amber-900/95 p-4 md:p-6 rounded-2xl shadow-[0_0_60px_rgba(251,191,36,0.5)] max-w-2xl w-full border-2 border-amber-500/50 animate-[popIn_0.4s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onCloseGalleryImage}
                            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-600/80 hover:bg-red-600 text-white text-2xl flex items-center justify-center z-10"
                        >
                            ×
                        </button>
                        <img
                            src={selectedGalleryImage.url}
                            alt={selectedGalleryImage.title}
                            className="w-full max-h-[60vh] object-contain rounded-lg mb-4"
                        />
                        <h3 className="font-vibes text-xl md:text-2xl text-white mb-2">{selectedGalleryImage.title}</h3>
                        <p className="text-amber-200 text-sm md:text-base">{selectedGalleryImage.message}</p>
                    </div>
                </div>
            )}

            {/* COUNTDOWN OVERLAY - Xuất hiện khi còn < 5 phút */}
            <TetCountdownOverlay />
        </>
    );
};

export default TetOverlay;
