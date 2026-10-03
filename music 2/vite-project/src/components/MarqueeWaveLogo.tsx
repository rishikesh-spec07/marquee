import React, { useEffect, useRef, useState } from 'react';

interface MarqueeWaveLogoProps {
  themeColor?: string;
  isPlaying?: boolean;
  className?: string;
  height?: number; // e.g. 28, 30, 32
  showTitle?: boolean;
}

export const MarqueeWaveLogo: React.FC<MarqueeWaveLogoProps> = ({
  isPlaying = false,
  className = '',
  height = 30,
  showTitle = false
}) => {
  // Proportional aspect ratio of /marquee-emblem.png (826 x 265)
  const width = Math.round(height * (826 / 265));
  
  // Extra vertical headroom (padding) so oscillating waves never clip at canvas bounds
  const padY = 10;
  const renderHeight = height + padY * 2;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load the authentic original emblem artwork (pure white & platinum silver)
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
    if (!canvas || !imageLoaded || !imgRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const img = imgRef.current;
    const srcW = img.naturalWidth || 826;
    const srcH = img.naturalHeight || 265;

    // Retina / High-DPI display scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = renderHeight * dpr;
    ctx.scale(dpr, dpr);

    let startTime = performance.now();

    const render = (currentTime: number) => {
      const elapsed = (currentTime - startTime) * 0.001; // seconds
      ctx.clearRect(0, 0, width, renderHeight);

      const step = 1;
      const midY = renderHeight / 2;

      // Render vertical slices with continuous fluid soundwave frequency displacement
      for (let x = 0; x < width; x += step) {
        const u = x / width; // 0.0 to 1.0
        const sx = u * srcW;
        const sw = Math.max(1, (step / width) * srcW);

        let scaleY = 1.0;
        let dy = 0;

        if (isPlaying) {
          // Dynamic high-energy equalizer beats during playback
          if (u < 0.38) {
            // Left soundwave frequency bars & nodes
            const factor = Math.cos((u / 0.38) * (Math.PI / 2));
            const w1 = Math.sin(elapsed * 5.0 - u * 24) * 0.45;
            const w2 = Math.sin(elapsed * 8.0 + u * 40) * 0.22;
            scaleY = 1.0 + (w1 + w2) * factor;
            dy = (Math.sin(elapsed * 4.4 - u * 20) * 3.8 + Math.cos(elapsed * 6.8 + u * 30) * 1.8) * factor;
          } else if (u > 0.62) {
            // Right soundwave frequency bars & nodes
            const r_u = (u - 0.62) / 0.38;
            const factor = Math.sin(r_u * (Math.PI / 2));
            const w1 = Math.sin(elapsed * 5.2 + r_u * 26) * 0.45;
            const w2 = Math.cos(elapsed * 8.5 - r_u * 40) * 0.22;
            scaleY = 1.0 + (w1 + w2) * factor;
            dy = (Math.cos(elapsed * 4.6 + r_u * 20) * 3.8 + Math.sin(elapsed * 7.0 - r_u * 30) * 1.8) * factor;
          } else {
            // Center sculpted 3D "M" emblem (stable, elegant harmonic floating breath)
            scaleY = 1.0 + Math.sin(elapsed * 2.2) * 0.04;
            dy = Math.sin(elapsed * 2.5) * 1.2;
          }
        } else {
          // Ambient fluid wave motion (ALWAYS ACTIVE & CLEARLY MOVING!)
          if (u < 0.38) {
            const factor = Math.cos((u / 0.38) * (Math.PI / 2));
            const w1 = Math.sin(elapsed * 3.4 - u * 18) * 0.32;
            const w2 = Math.sin(elapsed * 5.6 + u * 30) * 0.16;
            scaleY = 1.0 + (w1 + w2) * factor;
            dy = (Math.sin(elapsed * 3.2 - u * 14) * 3.0 + Math.cos(elapsed * 5.0 + u * 22) * 1.4) * factor;
          } else if (u > 0.62) {
            const r_u = (u - 0.62) / 0.38;
            const factor = Math.sin(r_u * (Math.PI / 2));
            const w1 = Math.sin(elapsed * 3.6 + r_u * 20) * 0.32;
            const w2 = Math.cos(elapsed * 5.8 - r_u * 32) * 0.16;
            scaleY = 1.0 + (w1 + w2) * factor;
            dy = (Math.cos(elapsed * 3.4 + r_u * 16) * 3.0 + Math.sin(elapsed * 5.2 - r_u * 24) * 1.4) * factor;
          } else {
            scaleY = 1.0 + Math.sin(elapsed * 1.8) * 0.03;
            dy = Math.sin(elapsed * 2.0) * 1.0;
          }
        }

        // Draw vertical slice centered at midY with slight subpixel overlap to prevent seams
        const sliceH = height * scaleY;
        const sliceY = midY - sliceH / 2 + dy;

        ctx.drawImage(img, sx, 0, sw, srcH, x, sliceY, step + 0.5, sliceH);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [imageLoaded, isPlaying, width, height, renderHeight]);

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* 3D Moving Waves Emblem Container */}
      <div
        className="relative overflow-visible shrink-0 filter drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]"
        style={{ height: `${height}px`, width: `${width}px` }}
      >
        {/* Soft Dark Plum & Violet Ambient Underglow matching reference shade (#140c20) */}
        <div
          className="absolute -inset-2.5 rounded-full blur-md pointer-events-none transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, rgba(216, 180, 254, 0.35) 0%, rgba(147, 51, 234, 0.20) 45%, rgba(20, 12, 32, 0.4) 75%, transparent 85%)',
            opacity: isPlaying ? 0.9 : 0.6
          }}
        />

        {/* Fallback Static Emblem while loading */}
        {!imageLoaded && (
          <img
            src="/marquee-emblem.png"
            alt="Marquee"
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
          />
        )}

        {/* 60FPS Fluid Wave Canvas (offset vertically by padY so waves expand freely without clipping) */}
        <canvas
          ref={canvasRef}
          style={{
            width: `${width}px`,
            height: `${renderHeight}px`,
            position: 'absolute',
            top: `-${padY}px`,
            left: 0
          }}
          className={`block transition-opacity duration-300 pointer-events-none ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {showTitle && (
        <span
          className="text-xs font-black tracking-wider uppercase text-white"
          style={{
            textShadow: '0 0 10px rgba(255, 255, 255, 0.6), 0 0 20px rgba(168, 85, 247, 0.4)'
          }}
        >
          Marquee
        </span>
      )}
    </div>
  );
};
