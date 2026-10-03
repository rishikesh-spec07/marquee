import React, { useEffect, useRef, useState } from 'react';

interface MarqueeMovingLogoProps {
  themeColor?: string;
  isPlaying?: boolean;
  showText?: boolean;
  className?: string;
  maxHeight?: number | string;
}

export const MarqueeMovingLogo: React.FC<MarqueeMovingLogoProps> = ({
  themeColor = '#1DB954',
  isPlaying = true,
  showText = true,
  className = '',
  maxHeight = 'auto'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/marquee-emblem.png';
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !imageLoaded || !imgRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const img = imgRef.current;
    const srcW = img.naturalWidth || 826;
    const srcH = img.naturalHeight || 265;

    let startTime = performance.now();

    const padY = 14;

    const resizeAndRender = (currentTime: number) => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(10, Math.round(rect.width));
      const height = Math.max(10, Math.round(rect.height));
      const renderH = height + padY * 2;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== renderH * dpr) {
        canvas.width = width * dpr;
        canvas.height = renderH * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, renderH);

      const elapsed = (currentTime - startTime) * 0.001;
      const step = 1.5; // Smooth sub-pixel slice resolution
      const midY = renderH / 2;

      for (let x = 0; x < width; x += step) {
        const u = x / width;
        const sx = u * srcW;
        const sw = Math.max(1, (step / width) * srcW);

        let scaleY = 1.0;
        let dy = 0;

        if (isPlaying) {
          if (u < 0.38) {
            // Left soundwave frequency bars & nodes
            const factor = Math.cos((u / 0.38) * (Math.PI / 2));
            const w1 = Math.sin(elapsed * 4.8 - u * 24) * 0.38;
            const w2 = Math.sin(elapsed * 7.8 + u * 40) * 0.18;
            scaleY = 1.0 + (w1 + w2) * factor;
            dy = (Math.sin(elapsed * 4.2 - u * 18) * 4.0 + Math.cos(elapsed * 6.5 + u * 28) * 1.8) * factor;
          } else if (u > 0.62) {
            // Right soundwave frequency bars & nodes
            const r_u = (u - 0.62) / 0.38;
            const factor = Math.sin(r_u * (Math.PI / 2));
            const w1 = Math.sin(elapsed * 5.0 + r_u * 26) * 0.38;
            const w2 = Math.cos(elapsed * 8.2 - r_u * 40) * 0.18;
            scaleY = 1.0 + (w1 + w2) * factor;
            dy = (Math.cos(elapsed * 4.4 + r_u * 20) * 4.0 + Math.sin(elapsed * 6.8 - r_u * 30) * 1.8) * factor;
          } else {
            // Center sculpted 3D "M" emblem
            scaleY = 1.0 + Math.sin(elapsed * 2.2) * 0.035;
            dy = Math.sin(elapsed * 2.5) * 1.5;
          }
        } else {
          // Gentle ambient wave
          if (u < 0.38) {
            const factor = Math.cos((u / 0.38) * (Math.PI / 2));
            scaleY = 1.0 + Math.sin(elapsed * 2.0 - u * 14) * 0.18 * factor;
            dy = Math.sin(elapsed * 1.8 - u * 10) * 1.8 * factor;
          } else if (u > 0.62) {
            const r_u = (u - 0.62) / 0.38;
            const factor = Math.sin(r_u * (Math.PI / 2));
            scaleY = 1.0 + Math.sin(elapsed * 2.0 + r_u * 14) * 0.18 * factor;
            dy = Math.cos(elapsed * 1.8 + r_u * 10) * 1.8 * factor;
          } else {
            scaleY = 1.0 + Math.sin(elapsed * 1.4) * 0.02;
            dy = Math.sin(elapsed * 1.6) * 1.0;
          }
        }

        const sliceH = height * scaleY;
        const sliceY = midY - sliceH / 2 + dy;

        ctx.drawImage(img, sx, 0, sw, srcH, x, sliceY, step + 0.5, sliceH);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(resizeAndRender);
    };

    animationFrameId = requestAnimationFrame(resizeAndRender);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [imageLoaded, isPlaying]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none w-full ${className}`}
      style={{ maxHeight }}
    >
      <style>{`
        @keyframes vinylSpinSmooth {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(0.85); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.25); filter: drop-shadow(0 0 6px rgba(255,255,255,0.9)); }
        }
        .anim-vinyl-spin {
          animation: vinylSpinSmooth 3.6s linear infinite;
        }
        .anim-star-twinkle {
          animation: starTwinkle 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* TOP EMBLEM: High-Res Sculpted Soundwaves & 3D "M" Emblem with Fluid Waves */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[826/265] max-w-[560px] overflow-visible filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
      >
        {/* Soft Ambient Radial Halo behind Emblem (deep plum & violet shade from image) */}
        <div
          className="absolute -inset-8 rounded-full blur-3xl pointer-events-none transition-opacity duration-700"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(107, 33, 168, 0.15) 50%, transparent 75%)',
            opacity: isPlaying ? 0.85 : 0.4
          }}
        />

        {/* Fallback Static Emblem while loading */}
        {!imageLoaded && (
          <img
            src="/marquee-emblem.png"
            alt="Marquee Emblem"
            className="w-full h-full object-contain"
          />
        )}

        {/* 60FPS Continuous Mathematical Wave Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: '-14px',
            left: 0,
            width: '100%',
            height: 'calc(100% + 28px)'
          }}
          className={`block transition-opacity duration-300 pointer-events-none ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* BOTTOM TYPOGRAPHY: 3D "Marquee" with Silky Spinning Turntable Disc & Star */}
      {showText && (
        <div className="relative w-full max-w-[560px] aspect-[888/220] mt-3 filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.9)]">
          {/* Base Typography Image */}
          <img
            src="/marquee-text.png"
            alt="Marquee"
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Silky Smooth Spinning Vinyl Disc Overlay over the turntable 'o' */}
          <div
            className={`absolute pointer-events-none rounded-full overflow-hidden ${
              isPlaying ? 'anim-vinyl-spin' : ''
            }`}
            style={{
              left: '71.17%',
              top: '44.55%',
              width: '12.6%',
              height: '50.9%',
              transform: 'translate(-50%, -50%)',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))'
            }}
          >
            <img
              src="/marquee-vinyl.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* Twinkling 4-Point Diamond Star Sparkle at Bottom Right (from image) */}
          <div
            className="absolute pointer-events-none anim-star-twinkle"
            style={{
              left: '94.48%',
              top: '81.36%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white/95 drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]"
            >
              <path
                d="M 12 0 Q 12 12 24 12 Q 12 12 12 24 Q 12 12 0 12 Q 12 12 12 0 Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
