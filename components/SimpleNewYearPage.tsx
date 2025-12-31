import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

const WISHES = [
  "An Khang Thịnh Vượng",
  "Vạn Sự Như Ý",
  "Tấn Tài Tấn Lộc",
  "Sức Khỏe Dồi Dào",
  "Tình Duyên Phơi Phới",
  "Tiền Vô Như Nước"
];

const SimpleNewYearPage: React.FC = () => {
  const { name } = useParams();
  const displayName = name ? decodeURIComponent(name) : "Các Tình Iu";

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Rotating content state
  const [currentWishIndex, setCurrentWishIndex] = useState(0);

  // Tilt effect state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Wish rotation
    const interval = setInterval(() => {
      setCurrentWishIndex((prev) => (prev + 1) % WISHES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-play music if possible
    const playMusic = async () => {
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          setHasInteracted(true);
        } catch (err) {
          console.log("Auto-play prevented", err);
        }
      }
    };
    playMusic();
  }, []);

  // Fireworks Animation Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: ContentParticle[] = [];

    class ContentParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.color = color;
        this.size = Math.random() * 3 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // Gravity
        this.life -= 0.02;
        this.size *= 0.95;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    const fireworkColors = ['#ff0044', '#ffff00', '#00ff44', '#0044ff', '#ff00ff'];

    const createFirework = (x: number, y: number) => {
      const color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
      for (let i = 0; i < 50; i++) {
        particles.push(new ContentParticle(x, y, color));
      }
    };

    // Auto launch fireworks
    const fwInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        createFirework(
          Math.random() * width,
          Math.random() * height * 0.5
        );
      }
    }, 800);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) particles.splice(i, 1);
      }
      requestAnimationFrame(render);
    };

    const resizeHandler = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resizeHandler);
    render();

    return () => {
      clearInterval(fwInterval);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  const handleInteraction = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setHasInteracted(true);
      } catch (err) {
        setHasInteracted(true);
      }
    } else {
      setHasInteracted(true);
    }
  };



  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left - width / 2) / 25; // Sensitivity
    const y = (clientY - top - height / 2) / 25;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  if (!hasInteracted) {
    return (
      <div
        onClick={handleInteraction}
        className="fixed inset-0 z-50 bg-red-950 flex flex-col items-center justify-center cursor-pointer"
      >
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-4">🎁</div>
          <h1 className="text-3xl text-yellow-400 font-script mb-2">Bạn có một món quà!</h1>
          <p className="text-white/80">Chạm vào màn hình để mở</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-900 flex flex-col items-center justify-center overflow-hidden relative">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-amber-900 animate-pulse z-[-1]"></div>

      {/* Main Content Card with 3D Tilt */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="z-10 relative perspective-1000"
      >
        <div
          className="text-center p-10 bg-black/40 backdrop-blur-md rounded-3xl border-2 border-yellow-500/50 shadow-[0_0_100px_rgba(234,179,8,0.6)] transition-transform duration-100 ease-out"
          style={{
            transform: `rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          <h1 className="font-script text-5xl md:text-7xl mb-6 animate-float-up transform translate-z-10">
            <span className="block text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)] animate-pulse-slow">
              Chúc Mừng Năm Mới
            </span>
            <br />
            <span className="gold-text text-8xl md:text-9xl font-vibes mt-6 block filter drop-shadow-2xl scale-110">
              2026
            </span>
          </h1>

          <p className="font-script text-3xl md:text-5xl text-pink-300 mt-8 neon-text animate-bounce-slow">
            {displayName} ❤️
          </p>


        </div>
      </div>

      {/* Decorative Falling Elements */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-fall pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.6
          }}
        >
          🌸
        </div>
      ))}
      {[...Array(10)].map((_, i) => (
        <div
          key={`coin-${i}`}
          className="absolute text-2xl animate-fall pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            animationDuration: `${Math.random() * 4 + 4}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.8
          }}
        >
          💰
        </div>
      ))}

      <audio ref={audioRef} loop preload="auto" src="/happynewyear.mp3" />

      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
        
        .gold-text {
          background: linear-gradient(to bottom, #fef08a 0%, #ca8a04 50%, #fef08a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-size: 200% auto;
          animation: shine 3s linear infinite;
          text-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }

        .neon-text {
          color: #f9a8d4;
          text-shadow: 
            0 0 5px #f9a8d4,
            0 0 10px #f9a8d4,
            0 0 20px #db2777,
            0 0 40px #db2777;
          animation: neon-pulse 1.5s ease-in-out infinite alternate;
        }

        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }

        @keyframes neon-pulse {
          from { opacity: 0.8; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1.05); }
        }

        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes bounce-slow {
            0%, 100% {
                transform: translateY(-5%);
                animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
            }
            50% {
                transform: translateY(0);
                animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
            }
        }
        .animate-bounce-slow {
            animation: bounce-slow 2s infinite;
        }

        .perspective-1000 {
            perspective: 1000px;
        }
        
        .translate-z-10 {
            transform: translateZ(30px);
        }
      `}</style>
    </div>
  );
};
export default SimpleNewYearPage;
