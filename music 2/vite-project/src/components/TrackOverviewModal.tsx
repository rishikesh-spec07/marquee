import React, { useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Mic,
  ListMusic,
  Heart,
  MoreHorizontal
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { LyricsEngine } from './LyricsEngine';
import { formatTime, musicPlayer } from '../services/playerCore';

export const TrackOverviewModal: React.FC = () => {
  const {
    activeTrack,
    songsCatalog,
    activeSongIndex,
    isPlayingAudio,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    duration,
    favoriteSongs,
    togglePlay,
    playNext,
    playPrev,
    setVolume,
    toggleMute,
    setRepeatMode,
    toggleShuffle,
    toggleSongFavorite,
    showFullPlayerModal,
    toggleFullPlayerModal,
    togglePlaylistsModal,
    toggleQueueModal
  } = useMusicStore();

  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);

  // Direct DOM refs for 60fps clock without re-rendering modal
  const s1TimeRef = useRef<HTMLSpanElement>(null);
  const s1InputRef = useRef<HTMLInputElement>(null);
  const s2TimeRef = useRef<HTMLSpanElement>(null);
  const deskTimeRef = useRef<HTMLSpanElement>(null);
  const deskInputRef = useRef<HTMLInputElement>(null);
  const isScrubbingRef = useRef<boolean>(false);

  const scrollToLyrics = () => {
    section2Ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPlayer = () => {
    section1Ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Lock body & document scroll while modal is open
  useEffect(() => {
    if (showFullPlayerModal) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [showFullPlayerModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullPlayerModal) {
        toggleFullPlayerModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullPlayerModal, toggleFullPlayerModal]);

  const currentSong = activeTrack || songsCatalog[activeSongIndex];

  // Subscribe to Isolated Playback Clock for 60fps progress & timer updates
  useEffect(() => {
    if (!showFullPlayerModal || !currentSong) return;

    return musicPlayer.subscribeClock((clock) => {
      const totalSecs = (duration && Number.isFinite(duration) && duration > 0)
        ? duration
        : (currentSong?.duration || clock.duration || 0);

      const cur = clock.currentTime;
      const pct = totalSecs > 0 ? Math.min(100, Math.max(0, (cur / totalSecs) * 100)) : 0;
      const timeStr = formatTime(cur);

      if (s1TimeRef.current) s1TimeRef.current.textContent = timeStr;
      if (s2TimeRef.current) s2TimeRef.current.textContent = `${timeStr} / ${formatTime(totalSecs)}`;
      if (deskTimeRef.current) deskTimeRef.current.textContent = timeStr;

      if (!isScrubbingRef.current) {
        if (s1InputRef.current) s1InputRef.current.value = String(pct);
        if (deskInputRef.current) deskInputRef.current.value = String(pct);
      }
    });
  }, [showFullPlayerModal, duration, currentSong]);

  if (!showFullPlayerModal || !currentSong) return null;

  const isFav = favoriteSongs.has(currentSong.id);
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    musicPlayer.seek(val);
  };

  const ambientColor = currentSong.themeColor || '#818cf8';
  const totalSecs = (duration && Number.isFinite(duration) && duration > 0) ? duration : (currentSong?.duration || 0);

  return (
    <div
      className="fixed inset-0 w-full h-[100vh] h-[100svh] min-h-[100svh] z-[100] flex items-center justify-center p-0 lg:p-12 overflow-hidden select-none bg-[#0a0b10] transition-all duration-300 animate-slide-up box-border"
    >
      {/* 1. Fully Opaque Solid Base Layer - Guarantees 0% bleed-through */}
      <div className="absolute inset-0 bg-[#0a0b10] z-0 pointer-events-none" />

      {/* 2. Glowing Animated Ambient Radial Gradient (GPU accelerated opacity & transform) */}
      <div
        className="absolute inset-0 z-[1] transition-opacity duration-1000 animate-ambient-breath pointer-events-none overflow-hidden opacity-70 will-change-transform"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${ambientColor}99 0%, ${ambientColor}44 40%, transparent 75%)`
        }}
      />

      {/* 3. Pre-computed Ambient Artwork Gradient (Eliminates expensive 80px live filter overdraw) */}
      <div
        className="absolute inset-0 z-[1] transition-opacity duration-1000 pointer-events-none opacity-40 will-change-transform"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${ambientColor}aa 0%, #0a0b10 75%)`
        }}
      />

      {/* 4. Subtle Vignette for Text Contrast */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-black/35 to-black/55 pointer-events-none" />

      {/* =========================================================================
          MOBILE / TABLET CONTAINER (< 1024px): 2-Section Snap-Scroll Experience
          ========================================================================= */}
      <div
        className="lg:hidden relative w-full h-full min-h-[100svh] overflow-y-auto overflow-x-hidden snap-y snap-mandatory z-10 custom-scrollbar box-border"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
      >
        {/* ---------------- SECTION 1: NOW PLAYING SCREEN ---------------- */}
        <section
          ref={section1Ref}
          className="w-full h-[100svh] min-h-[100svh] flex flex-col justify-between snap-start box-border px-5 py-3 relative overflow-hidden"
          style={{
            paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
            paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))'
          }}
        >
          {/* Top Bar: Close Chevron on Left, Add & More on Right */}
          <div className="flex items-center justify-between w-full shrink-0 z-20">
            <button
              onClick={toggleFullPlayerModal}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full frosted-pill-btn flex items-center justify-center text-white transition active:scale-95 shadow-lg cursor-pointer shrink-0"
              title="Close Full Player"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Now Playing</span>

            <div className="flex items-center gap-2">
              <button
                onClick={togglePlaylistsModal}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full frosted-pill-btn flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer active:scale-95 shrink-0"
                title="Add to Playlist"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full frosted-pill-btn flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer active:scale-95 shrink-0"
                title="More Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Artwork Frame */}
          <div className="flex-1 w-full flex items-center justify-center py-1 min-h-0 overflow-hidden shrink">
            <div className="mobile-player-art relative w-full max-w-[min(100%,46svh)] aspect-square max-h-[360px] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-white/20 bg-black/60 shrink">
              <img
                src={currentSong.albumArt}
                alt={currentSong.title}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>

          {/* Track Meta Row */}
          <div className="flex items-center justify-between w-full min-w-0 pt-1 shrink-0">
            <div className="flex flex-col min-w-0 pr-3 flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight tracking-tight drop-shadow-md">
                {currentSong.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 font-semibold truncate leading-tight mt-0.5">
                {currentSong.artist}
              </p>
            </div>

            <button
              onClick={() => toggleSongFavorite(currentSong.id)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full frosted-pill-btn flex items-center justify-center text-white/80 hover:text-rose-400 active:scale-95 transition cursor-pointer shrink-0"
              title="Favorite Track"
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Progress Row: [Current Time] [Scrub Bar flex:1] [Total Time] */}
          <div className="flex items-center gap-3 w-full min-w-0 py-1 shrink-0">
            <span ref={s1TimeRef} className="text-xs text-white/60 font-mono tabular-nums shrink-0 w-10">
              0:00
            </span>
            <div className="relative flex-1 min-w-0 flex items-center">
              <input
                ref={s1InputRef}
                type="range"
                min="0"
                max="100"
                step="0.1"
                defaultValue="0"
                onMouseDown={() => { isScrubbingRef.current = true; }}
                onTouchStart={() => { isScrubbingRef.current = true; }}
                onMouseUp={() => { isScrubbingRef.current = false; }}
                onTouchEnd={() => { isScrubbingRef.current = false; }}
                onChange={handleScrub}
                className="w-full accent-white h-1.5 bg-white/20 rounded-full cursor-pointer shadow-inner"
              />
            </div>
            <span className="text-xs text-white/60 font-mono tabular-nums shrink-0 w-10 text-right">
              {formatTime(totalSecs)}
            </span>
          </div>

          {/* Controls Pill: Shuffle / Prev / Play-Pause (64px) / Next / Repeat */}
          <div className="flex items-center justify-between w-full p-2 rounded-3xl frosted-pill-btn shrink-0 my-1">
            <button
              onClick={toggleShuffle}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition cursor-pointer active:scale-95 ${
                isShuffle ? 'text-amber-300 bg-white/20' : 'text-white/60 hover:text-white'
              }`}
              title="Shuffle Mode"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={playPrev}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-6 h-6 fill-white" />
            </button>

            {/* Glowing Pure White Play/Pause Button (64px) */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-white text-black flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              style={{
                boxShadow: '0 0 28px rgba(255, 255, 255, 0.65), 0 0 50px rgba(255, 255, 255, 0.25)'
              }}
              title={isPlayingAudio ? 'Pause' : 'Play'}
            >
              {isPlayingAudio ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-1" />
              )}
            </button>

            <button
              onClick={playNext}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white hover:scale-110 active:scale-95 transition cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-6 h-6 fill-white" />
            </button>

            <button
              onClick={() => {
                if (repeatMode === 'off') setRepeatMode('all');
                else if (repeatMode === 'all') setRepeatMode('one');
                else setRepeatMode('off');
              }}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition cursor-pointer active:scale-95 ${
                repeatMode !== 'off' ? 'text-amber-300 bg-white/20' : 'text-white/60 hover:text-white'
              }`}
              title="Repeat Mode"
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Row: Volume Slider on Left | Sing Lyrics & Queue on Right */}
          <div className="flex items-center justify-between w-full min-w-0 pt-2 border-t border-white/10 gap-2 shrink-0">
            {/* Volume Icon + Slider */}
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[170px] sm:max-w-[200px]">
              <button onClick={toggleMute} className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer shrink-0">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-white h-1 bg-white/20 rounded-full cursor-pointer min-w-0"
              />
            </div>

            {/* Right: Sing Lyrics pill + Queue */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={scrollToLyrics}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-lg border border-white/20 bg-white/20 text-white hover:bg-white/30 shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
                title="Scroll down to Lyrics"
              >
                <Mic className="w-3.5 h-3.5 text-amber-300" />
                <span>Sing Lyrics</span>
              </button>

              <button
                onClick={toggleQueueModal}
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer shrink-0"
                title="Queue"
              >
                <ListMusic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Animated "Scroll for Lyrics" Hint */}
          <div className="flex items-center justify-center w-full pt-1 shrink-0">
            <button
              onClick={scrollToLyrics}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-[11px] font-bold tracking-wider uppercase transition cursor-pointer py-1"
              aria-label="Scroll down for Lyrics"
            >
              <span>Lyrics</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* ---------------- SECTION 2: LYRICS SCREEN ON SCROLL ---------------- */}
        <section
          ref={section2Ref}
          className="w-full min-h-[100svh] flex flex-col justify-between snap-start box-border px-5 py-4 relative"
          style={{
            paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
          }}
        >
          {/* Section 2 Header */}
          <div className="flex items-center justify-between w-full pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={scrollToPlayer}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full frosted-pill-btn flex items-center justify-center text-white transition active:scale-95 shadow-md cursor-pointer shrink-0"
                title="Back to Now Playing"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <div className="flex flex-col min-w-0">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-amber-300" />
                  Lyrics
                </h3>
                <p className="text-[11px] text-white/60 truncate max-w-[200px]">
                  {currentSong.title} • {currentSong.artist}
                </p>
              </div>
            </div>

            <button
              onClick={toggleFullPlayerModal}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full frosted-pill-btn flex items-center justify-center text-white transition active:scale-95 shadow-md cursor-pointer shrink-0"
              title="Close Full Player"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Lyrics Content Display */}
          <div className="flex-1 w-full py-4 min-h-[360px] overflow-hidden flex flex-col">
            <LyricsEngine onSeekTime={(t) => musicPlayer.seekTo(t)} />
          </div>

          {/* Slim Sticky Playback Bar at the bottom of Section 2 */}
          <div className="sticky bottom-0 left-0 right-0 w-full mt-2 shrink-0 bg-[#12141c]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 px-3.5 shadow-2xl flex items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <img
                src={currentSong.albumArt}
                alt=""
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/20"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight">{currentSong.title}</span>
                <span ref={s2TimeRef} className="text-[10px] text-white/60 truncate leading-tight mt-0.5 font-mono">
                  0:00 / {formatTime(totalSecs)}
                </span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={playPrev}
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-white/70 hover:text-white transition active:scale-95 cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4 fill-white" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white text-black flex items-center justify-center transition active:scale-95 shadow-lg cursor-pointer"
                style={{ boxShadow: '0 0 16px rgba(255, 255, 255, 0.5)' }}
                title={isPlayingAudio ? 'Pause' : 'Play'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4 fill-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center text-white/70 hover:text-white transition active:scale-95 cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4 fill-white" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================================================
          DESKTOP CONTAINER (>= 1024px): 100% Unchanged Desktop Experience
          ========================================================================= */}
      <div
        className="hidden lg:flex relative w-full h-full max-w-[1480px] h-[92vh] max-h-[900px] flex-col justify-between z-10 overflow-hidden box-border"
        style={{
          padding: 'max(16px, env(safe-area-inset-top, 16px)) 20px max(16px, env(safe-area-inset-bottom, 16px))'
        }}
      >
        {/* Top Navigation Row: Collapse Button on Left, Add & More on Right */}
        <div className="flex items-center justify-between w-full shrink-0 z-20">
          <button
            onClick={toggleFullPlayerModal}
            className="w-11 h-11 rounded-full frosted-pill-btn flex items-center justify-center text-white transition hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            title="Collapse Player"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold uppercase tracking-widest text-white/70">Now Playing</span>

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlaylistsModal}
              className="w-11 h-11 rounded-full frosted-pill-btn flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer hover:scale-105"
              title="Add to Playlist"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              className="w-11 h-11 rounded-full frosted-pill-btn flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer hover:scale-105"
              title="More Options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Split: Left Column (Cover Artwork + Meta + Playback Controls) vs Right Column (Synced Lyrics) */}
        <div className="grid grid-cols-12 gap-8 items-center flex-1 my-auto w-full min-h-0">
          {/* Left Column: Artwork + Song Details + Controls */}
          <div className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center gap-4 h-full">
            {/* 1:1 Large Square Album Artwork */}
            <div className="relative w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.85)] border border-white/20 bg-black/60 group">
              <img
                src={currentSong.albumArt}
                alt={currentSong.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Song Title & Artist + Favorite Heart */}
            <div className="flex items-center justify-between w-full max-w-[360px] pt-1">
              <div className="flex flex-col min-w-0 pr-2">
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white truncate leading-tight drop-shadow-lg tracking-tight">
                  {currentSong.title}
                </h2>
                <p className="text-sm text-white/75 font-semibold truncate leading-tight mt-1">
                  {currentSong.artist}
                </p>
              </div>

              <button
                onClick={() => toggleSongFavorite(currentSong.id)}
                className="w-10 h-10 rounded-full frosted-pill-btn flex items-center justify-center text-white/80 hover:text-rose-400 transition cursor-pointer flex-shrink-0"
                title="Favorite Track"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            {/* Progress Scrubber */}
            <div className="flex flex-col gap-2 w-full max-w-[360px]">
              <div className="flex items-center gap-3 w-full">
                <span ref={deskTimeRef} className="text-xs text-white/60 font-mono w-10">
                  0:00
                </span>
                <div className="relative flex-1 flex items-center">
                  <input
                    ref={deskInputRef}
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue="0"
                    onMouseDown={() => { isScrubbingRef.current = true; }}
                    onTouchStart={() => { isScrubbingRef.current = true; }}
                    onMouseUp={() => { isScrubbingRef.current = false; }}
                    onTouchEnd={() => { isScrubbingRef.current = false; }}
                    onChange={handleScrub}
                    className="w-full accent-white h-1.5 bg-white/20 rounded-full cursor-pointer shadow-inner"
                  />
                </div>
                <span className="text-xs text-white/60 font-mono w-10 text-right">{formatTime(totalSecs)}</span>
              </div>
            </div>

            {/* Sleek Frosted-Glass Media Playback Controls Row */}
            <div className="flex items-center justify-between w-full max-w-[360px] p-2 rounded-3xl frosted-pill-btn">
              <button
                onClick={toggleShuffle}
                className={`p-2.5 rounded-full transition cursor-pointer ${isShuffle ? 'text-amber-300 bg-white/20' : 'text-white/60 hover:text-white'}`}
                title="Shuffle Mode"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={playPrev}
                className="p-2 text-white/80 hover:text-white hover:scale-110 transition cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-6 h-6 fill-white" />
              </button>

              {/* Glowing Pure White Circle Play/Pause Button */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95"
                style={{
                  boxShadow: '0 0 28px rgba(255, 255, 255, 0.65), 0 0 50px rgba(255, 255, 255, 0.25)'
                }}
                title={isPlayingAudio ? 'Pause' : 'Play'}
              >
                {isPlayingAudio ? (
                  <Pause className="w-6 h-6 fill-black" />
                ) : (
                  <Play className="w-6 h-6 fill-black ml-1" />
                )}
              </button>

              <button
                onClick={playNext}
                className="p-2 text-white/80 hover:text-white hover:scale-110 transition cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-6 h-6 fill-white" />
              </button>

              <button
                onClick={() => {
                  if (repeatMode === 'off') setRepeatMode('all');
                  else if (repeatMode === 'all') setRepeatMode('one');
                  else setRepeatMode('off');
                }}
                className={`p-2.5 rounded-full transition cursor-pointer ${repeatMode !== 'off' ? 'text-amber-300 bg-white/20' : 'text-white/60 hover:text-white'}`}
                title="Repeat Mode"
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Utility Bar */}
            <div className="flex items-center justify-between w-full max-w-[360px] pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white/60 hover:text-white transition cursor-pointer">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-white h-1 bg-white/20 rounded-full cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg border border-white/20"
                  title="Live Synced Lyrics"
                >
                  <Mic className="w-3.5 h-3.5 text-amber-300" /> Sing Lyrics
                </button>
                <button
                  onClick={toggleQueueModal}
                  className="p-2 text-white/60 hover:text-white transition cursor-pointer"
                  title="Queue"
                >
                  <ListMusic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Synced Lyrics */}
          <div className="col-span-12 lg:col-span-7 flex flex-col justify-center h-full max-h-[660px] overflow-hidden pr-2">
            <LyricsEngine onSeekTime={(t) => musicPlayer.seekTo(t)} />
          </div>
        </div>
      </div>
    </div>
  );
};
