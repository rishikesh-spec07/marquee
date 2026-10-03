import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

export const CoverFlow: React.FC = () => {
  const { activeTrack, songsCatalog, activeSongIndex, playSong, playSongAtIndex } = useMusicStore();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!songsCatalog || songsCatalog.length === 0) return null;

  const currentSong = activeTrack || songsCatalog[activeSongIndex];

  return (
    <div className="relative w-full h-[360px] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/15 p-6 glass-panel">
      {/* Dynamic Ambient Background Shift based on active song gradient */}
      <div
        className="absolute inset-0 transition-all duration-700 -z-10 opacity-60"
        style={{
          background: currentSong?.themeGradient || 'radial-gradient(circle at 50% 40%, #524536 0%, #363b48 60%, #252833 100%)'
        }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md -z-10" />

      {/* Header Info */}
      <div className="text-center mb-4 z-10">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-400 bg-black/40 border border-white/10 px-3 py-1 rounded-full">
          3D Spatial CoverFlow
        </span>
        <h2 className="text-xl font-bold text-white mt-1.5 leading-tight drop-shadow-md">
          {currentSong?.title || 'Select Track'}
        </h2>
        <p className="text-xs text-white/70 font-medium">
          {currentSong?.artist} • {currentSong?.album}
        </p>
      </div>

      {/* 3D CoverFlow Carousel Cards */}
      <div className="relative flex items-center justify-center w-full h-[210px] perspective-1000">
        {songsCatalog.map((song, index) => {
          const offset = index - activeSongIndex;
          const absOffset = Math.abs(offset);
          if (absOffset > 3) return null; // render active item + 3 on each side

          const rotateY = offset * -25;
          const translateX = offset * 110;
          const translateZ = -absOffset * 100;
          const scale = 1 - absOffset * 0.15;
          const opacity = 1 - absOffset * 0.25;

          const isActive = (activeTrack?.canonicalTrackId || activeTrack?.id) === (song.canonicalTrackId || song.id);

          return (
            <div
              key={song.canonicalTrackId || song.id}
              onClick={() => playSong(song)}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              className="absolute cursor-pointer transition-all duration-500 transform-gpu flex flex-col items-center group"
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity: opacity,
                zIndex: 100 - absOffset
              }}
            >
              <div
                className={`relative w-40 h-40 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border ${
                  isActive ? 'border-amber-400 ring-4 ring-amber-400/40 scale-105' : 'border-white/20'
                } transition-all duration-300`}
              >
                <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Reflection Effect */}
              <div
                className="w-40 h-10 mt-1 opacity-20 transform scale-y-[-1] blur-[1px] pointer-events-none overflow-hidden rounded-b-2xl"
                style={{
                  backgroundImage: `url(${song.albumArt})`,
                  backgroundSize: 'cover',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), transparent)'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between w-full px-6 absolute top-1/2 -translate-y-1/2 pointer-events-none">
        <button
          onClick={() => playSongAtIndex(Math.max(0, activeSongIndex - 1))}
          className="pointer-events-auto w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition shadow-xl"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => playSongAtIndex(Math.min(songsCatalog.length - 1, activeSongIndex + 1))}
          className="pointer-events-auto w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition shadow-xl"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
