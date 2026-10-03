import React from 'react';

interface MarqueeAnimatedLogoProps {
  themeColor?: string;
  size?: number; // scale multiplier or width
  animated?: boolean;
}

export const MarqueeAnimatedLogo: React.FC<MarqueeAnimatedLogoProps> = ({
  size = 540,
  animated = true
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Soft Ambient Dark Plum / Violet Atmosphere Halo */}
      <div
        className="absolute -inset-16 rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.22) 0%, rgba(88, 28, 135, 0.12) 50%, transparent 75%)'
        }}
      />

      {/* 3D EMBLEM: Stylized Musical M with Real Animated Moving Waves */}
      <svg
        viewBox="0 0 600 240"
        className="w-full max-w-[540px] h-auto overflow-visible filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 3D Pure White & Platinum Gradients (Matching uploaded color shade) */}
          <linearGradient id="mWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f8fafc" />
            <stop offset="75%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          <linearGradient id="mBevelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <linearGradient id="waveBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f1f5f9" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.75" />
          </linearGradient>

          {/* Platinum / Chrome Radial Gradient for Vinyl Record */}
          <radialGradient id="vinylMetallicGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#e2e8f0" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="70%" stopColor="#334155" />
            <stop offset="90%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* 3D Drop Shadow Filter */}
          <filter id="shadow3D" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.9" />
            <feDropShadow dx="1" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.7" />
          </filter>

          <filter id="whiteGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Wave animation style */}
          <style>{`
            @keyframes movingWave1 {
              0%, 100% { transform: scaleY(0.45); }
              50% { transform: scaleY(1.15); }
            }
            @keyframes movingWave2 {
              0%, 100% { transform: scaleY(0.85); }
              50% { transform: scaleY(0.35); }
            }
            @keyframes movingWave3 {
              0%, 100% { transform: scaleY(0.55); }
              50% { transform: scaleY(1.25); }
            }
            @keyframes movingWave4 {
              0%, 100% { transform: scaleY(0.9); }
              50% { transform: scaleY(0.4); }
            }
            @keyframes noteFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes vinylSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes starGleam {
              0%, 100% { opacity: 0.45; transform: scale(0.85); }
              50% { opacity: 1; transform: scale(1.25); filter: drop-shadow(0 0 8px rgba(255,255,255,0.9)); }
            }
            .wave-bar-1 { transform-origin: center; animation: movingWave1 1.4s ease-in-out infinite; }
            .wave-bar-2 { transform-origin: center; animation: movingWave2 1.6s ease-in-out infinite 0.2s; }
            .wave-bar-3 { transform-origin: center; animation: movingWave3 1.3s ease-in-out infinite 0.4s; }
            .wave-bar-4 { transform-origin: center; animation: movingWave4 1.7s ease-in-out infinite 0.1s; }
            .note-floating { animation: noteFloat 2s ease-in-out infinite; }
            .disc-spinning { transform-origin: 472px 64px; animation: vinylSpin 3.6s linear infinite; }
            .star-gleam { transform-origin: center; animation: starGleam 2.4s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* ======================================================== */}
        {/* BACKGROUND SOUNDWAVE BARS (ANIMATING MOVING FREQUENCIES) */}
        {/* ======================================================== */}
        <g id="movingSoundwaves" filter="url(#shadow3D)">
          {/* Far Left Nodes */}
          <circle cx="50" cy="120" r="6" fill="#ffffff" opacity="0.75" className={animated ? 'wave-bar-1' : ''} />
          <circle cx="70" cy="120" r="10" fill="#ffffff" opacity="0.85" className={animated ? 'wave-bar-3' : ''} />
          <circle cx="95" cy="120" r="7" fill="#ffffff" opacity="0.8" className={animated ? 'wave-bar-2' : ''} />

          {/* Left Vertical Equalizer Frequency Bars */}
          <rect x="114" y="60" width="13" height="120" rx="6.5" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-1' : ''} />
          <rect x="138" y="85" width="12" height="70" rx="6" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-2' : ''} />
          <rect x="160" y="45" width="13" height="150" rx="6.5" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-3' : ''} />
          <rect x="184" y="70" width="13" height="100" rx="6.5" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-4' : ''} />
          <rect x="208" y="90" width="12" height="60" rx="6" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-1' : ''} />

          {/* Right Vertical Equalizer Frequency Bars */}
          <rect x="382" y="85" width="12" height="70" rx="6" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-2' : ''} />
          <rect x="404" y="50" width="13" height="140" rx="6.5" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-3' : ''} />
          <rect x="428" y="75" width="13" height="90" rx="6.5" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-1' : ''} />
          <rect x="452" y="30" width="14" height="180" rx="7" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-4' : ''} />
          <rect x="476" y="55" width="13" height="130" rx="6.5" fill="url(#waveBgGrad)" className={animated ? 'wave-bar-2' : ''} />

          {/* Far Right Nodes */}
          <circle cx="505" cy="120" r="7" fill="#ffffff" opacity="0.8" className={animated ? 'wave-bar-3' : ''} />
          <circle cx="530" cy="120" r="10" fill="#ffffff" opacity="0.85" className={animated ? 'wave-bar-1' : ''} />
          <circle cx="555" cy="120" r="6" fill="#ffffff" opacity="0.75" className={animated ? 'wave-bar-2' : ''} />
        </g>

        {/* ======================================================== */}
        {/* FOREGROUND 3D SCULPTED "M" + MUSIC NOTES EMBLEM RIBBON */}
        {/* ======================================================== */}
        <g id="foregroundM" filter="url(#shadow3D)">
          {/* Connecting Wave Line Left */}
          <path
            d="M 135,120 H 175 V 100 H 195 V 140 H 220"
            fill="none"
            stroke="url(#mWhiteGrad)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main 3D "M" Structure with Integrated Music Notes */}
          {/* Note 1 (Left Note Head & Stem) */}
          <g className={animated ? 'note-floating' : ''}>
            {/* Note 1 Head */}
            <ellipse cx="250" cy="180" rx="22" ry="17" fill="url(#mWhiteGrad)" transform="rotate(-20 250 180)" />
            <circle cx="248" cy="180" r="7" fill="#0c0d12" opacity="0.65" />
            <circle cx="253" cy="188" r="4" fill="#0c0d12" opacity="0.5" />
          </g>

          {/* Note 2 (Center Note Head) */}
          <g className={animated ? 'note-floating' : ''}>
            <ellipse cx="328" cy="172" rx="19" ry="15" fill="url(#mWhiteGrad)" transform="rotate(-18 328 172)" />
            <circle cx="326" cy="172" r="5" fill="#0c0d12" opacity="0.6" />
          </g>

          {/* 3D "M" Body Extrusion / Darker Under-Bevel */}
          <path
            d="M 235,180 
               V 70 
               Q 235,45 258,45
               L 300,125 
               L 342,45 
               Q 365,45 365,70
               V 160
               Q 365,188 385,188
               Q 405,188 405,160
               V 100
               Q 405,75 425,75
               H 440"
            fill="none"
            stroke="#18181b"
            strokeWidth="19"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main 3D "M" High-Res Pure White Ribbon */}
          <path
            d="M 235,180 
               V 70 
               Q 235,45 258,45
               L 300,125 
               L 342,45 
               Q 365,45 365,70
               V 160
               Q 365,188 385,188
               Q 405,188 405,160
               V 100
               Q 405,75 425,75
               H 440"
            fill="none"
            stroke="url(#mWhiteGrad)"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Specular Light Reflection Top Highlight */}
          <path
            d="M 233,165 
               V 70 
               Q 233,48 258,48
               L 300,123 
               L 342,48 
               Q 363,48 363,70
               V 155"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        </g>
      </svg>

      {/* ======================================================== */}
      {/* 3D "MARQUEE" TYPOGRAPHY WITH TURNTABLE VINYL DISC FOR 'o' */}
      {/* ======================================================== */}
      <div className="relative flex items-baseline justify-center font-sans tracking-tight filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.85)] -mt-4 z-10">
        {/* Letter M */}
        <span
          className="text-6xl sm:text-7xl md:text-8xl font-light tracking-tighter"
          style={{
            color: '#ffffff',
            textShadow: `0 4px 18px rgba(0,0,0,0.9), 0 0 25px rgba(255,255,255,0.35)`
          }}
        >
          M
        </span>

        {/* Letters arqu */}
        <span
          className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-tight -ml-1"
          style={{
            color: '#ffffff',
            textShadow: `0 4px 18px rgba(0,0,0,0.9), 0 0 22px rgba(255,255,255,0.3)`
          }}
        >
          arqu
        </span>

        {/* Stylized Spinning Vinyl Record Disc for 'o' */}
        <div className="relative inline-flex items-center justify-center mx-1.5 self-center">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-slate-300 shadow-[0_6px_20px_rgba(0,0,0,0.95),0_0_12px_rgba(255,255,255,0.2)] relative flex items-center justify-center overflow-hidden ${
              animated ? 'disc-spinning' : ''
            }`}
            style={{
              background: `radial-gradient(circle, #f8fafc 0%, #cbd5e1 22%, #64748b 48%, #1e293b 72%, #09090b 100%)`
            }}
          >
            {/* Concentric Grooves */}
            <div className="absolute inset-1 rounded-full border border-white/30" />
            <div className="absolute inset-2 rounded-full border border-black/50" />
            <div className="absolute inset-3 rounded-full border border-white/20" />
            <div className="absolute inset-4 rounded-full border border-black/60" />
            {/* Center Vinyl Label & Spindle */}
            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shadow-inner border border-white/40">
              <div className="w-1.5 h-1.5 rounded-full bg-black" />
            </div>
          </div>

          {/* Miniature Tonearm Needle */}
          <div
            className="absolute -right-2 top-0 w-5 h-7 border-r-2 border-t-2 border-slate-300 rounded-tr-sm pointer-events-none transform rotate-12"
            style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.85))' }}
          >
            <div className="absolute right-0 bottom-0 w-1.5 h-2.5 bg-black rounded-xs" />
          </div>
        </div>

        {/* Letter e */}
        <span
          className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-tight"
          style={{
            color: '#ffffff',
            textShadow: `0 4px 18px rgba(0,0,0,0.9), 0 0 25px rgba(255,255,255,0.35)`
          }}
        >
          e
        </span>

        {/* 4-Point Diamond Star Sparkle (Bottom Right from uploaded image) */}
        <div className="absolute -right-6 -bottom-1 star-gleam pointer-events-none">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
            <path
              d="M 12 0 Q 12 12 24 12 Q 12 12 12 24 Q 12 12 0 12 Q 12 12 12 0 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
