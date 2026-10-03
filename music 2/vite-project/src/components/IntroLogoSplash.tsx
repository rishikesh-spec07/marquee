import React, { useState, useEffect } from 'react';
import { useMusicStore } from '../store/useMusicStore';
import { MarqueeMovingLogo } from './MarqueeMovingLogo';

interface IntroLogoSplashProps {
  onFinish?: () => void;
}

export const IntroLogoSplash: React.FC<IntroLogoSplashProps> = ({ onFinish }) => {
  const { appSettings } = useMusicStore();
  const themeColor = appSettings?.artistThemeColor || '#1DB954';

  // Immediately visible upon page load/refresh (0ms start delay)
  const [stage, setStage] = useState<'pop' | 'exit' | 'done'>('pop');

  useEffect(() => {
    // Exactly 1 second total duration:
    // 0ms - 750ms: Fully visible with active 60FPS fluid waves & spinning vinyl turntable
    // 750ms - 1000ms: Smooth fast dissolve transition into the website
    // 1000ms (1.0s): Completely unmounts
    const exitTimer = setTimeout(() => {
      setStage('exit');
    }, 750);

    const doneTimer = setTimeout(() => {
      setStage('done');
      if (onFinish) onFinish();
    }, 1000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  const handleInstantEnter = () => {
    setStage('exit');
    setTimeout(() => {
      setStage('done');
      if (onFinish) onFinish();
    }, 120);
  };

  if (stage === 'done') return null;

  return (
    <div
      onClick={handleInstantEnter}
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-b from-[#160c22] via-[#0d0714] to-[#08030c] cursor-pointer select-none transition-all duration-250 ease-out overflow-hidden ${
        stage === 'exit'
          ? 'opacity-0 scale-105 pointer-events-none blur-[2px]'
          : 'opacity-100 scale-100'
      }`}
      title="Click anywhere to skip intro"
    >
      {/* Concentric Sonic Wave Ripple Rings in Pure Silver & Soft Violet */}
      <div
        className={`absolute rounded-full border border-white/20 transition-all duration-700 ease-out pointer-events-none shadow-[0_0_30px_rgba(255,255,255,0.1)] ${
          stage === 'pop' ? 'w-[520px] h-[520px] opacity-40 scale-100' : 'w-24 h-24 opacity-0 scale-50'
        }`}
      />
      <div
        className={`absolute rounded-full border border-purple-500/25 transition-all duration-800 delay-100 ease-out pointer-events-none shadow-[0_0_40px_rgba(168,85,247,0.15)] ${
          stage === 'pop' ? 'w-[760px] h-[760px] opacity-25 scale-100' : 'w-36 h-36 opacity-0 scale-50'
        }`}
      />

      {/* Atmospheric Dark Plum & Violet Radial Ambient Glow (matching uploaded reference logo) */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(168, 85, 247, 0.28) 40%, rgba(88, 28, 135, 0.18) 65%, transparent 80%)',
          opacity: stage === 'pop' ? 0.95 : 0
        }}
      />

      {/* 3D Animated Logo with Moving Soundwaves & Spinning Turntable Disc */}
      <div
        className="relative z-10 flex flex-col items-center justify-center transition-all duration-250 ease-out px-4 w-full max-w-[560px]"
        style={{
          transform: stage === 'exit' ? 'scale(1.06) translateY(-4px)' : 'scale(1) translateY(0)',
          opacity: stage === 'exit' ? 0 : 1
        }}
      >
        <MarqueeMovingLogo
          themeColor={themeColor}
          isPlaying={true}
          showText={true}
        />
      </div>
    </div>
  );
};
