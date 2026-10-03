import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Mic,
  Sliders,
  ListMusic
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { musicPlayer, formatTime } from '../services/playerCore';
import { PlayerDebugPanel } from './PlayerDebugPanel';
import { MarqueeWaveLogo } from './MarqueeWaveLogo';

export const AudioPlayer: React.FC = () => {
  const {
    appSettings,
    activeTrack,
    songsCatalog,
    activeSongIndex,
    isPlayingAudio,
    hasPlaybackStarted,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    duration,
    audioState,
    loadingTrack,
    favoriteSongs,
    togglePlay,
    playNext,
    playPrev,
    setVolume,
    toggleMute,
    setRepeatMode,
    toggleShuffle,
    toggleSongFavorite,
    toggleLyricsPanel,
    toggleQueueModal,
    toggleEqualizer,
    openFullPlayerModal,
    showFullPlayerModal
  } = useMusicStore();

  const mobileBarRef = useRef<HTMLDivElement>(null);
  const desktopBarInputRef = useRef<HTMLInputElement>(null);
  const curTimeLabelRef = useRef<HTMLSpanElement>(null);
  const isUserScrubbingRef = useRef<boolean>(false);

  const hasStarted = hasPlaybackStarted || isPlayingAudio;
  const currentSong = activeTrack || songsCatalog[activeSongIndex];

  // Subscribe directly to Authoritative Clock without re-rendering AudioPlayer
  useEffect(() => {
    return musicPlayer.subscribeClock((clock) => {
      const totalSecs = (duration && Number.isFinite(duration) && duration > 0)
        ? duration
        : (currentSong?.duration || clock.duration || 0);

      const cur = clock.currentTime;
      const pct = totalSecs > 0 ? Math.min(100, Math.max(0, (cur / totalSecs) * 100)) : 0;

      if (mobileBarRef.current) {
        mobileBarRef.current.style.width = `${pct}%`;
      }
      if (curTimeLabelRef.current) {
        curTimeLabelRef.current.textContent = formatTime(cur);
      }
      if (desktopBarInputRef.current && !isUserScrubbingRef.current) {
        desktopBarInputRef.current.value = String(pct);
      }
    });
  }, [duration, currentSong]);

  if (!hasStarted || !currentSong || showFullPlayerModal) return null;

  const isFav = favoriteSongs.has(currentSong.id);
  const totalSecs = (duration && Number.isFinite(duration) && duration > 0) ? duration : (currentSong.duration || 0);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    musicPlayer.seek(val);
  };

  return (
    <div className="fixed bottom-[calc(58px+max(12px,env(safe-area-inset-bottom,12px))+10px)] left-4 right-4 z-40 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-[95%] md:max-w-[1440px] animate-in fade-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
      <PlayerDebugPanel />

      <div
        className="relative bg-[#12131a]/96 backdrop-blur-2xl border border-white/12 md:border md:border-white/5 rounded-[22px] md:rounded-full px-3.5 py-2 md:px-6 md:py-3 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3 md:gap-4 overflow-hidden h-[68px] md:h-auto min-h-[68px] md:min-h-0 box-border cursor-pointer select-none"
        onClick={openFullPlayerModal}
      >
        {/* Top Progress Line on Mobile - Direct DOM updated via Isolated Clock */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-[2.5px] bg-white/10 pointer-events-none">
          <div
            ref={mobileBarRef}
            className="h-full bg-amber-400 transition-[width] duration-75"
            style={{ width: '0%' }}
          />
        </div>

        {/* Ambient multi-color glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-rose-900/5 to-transparent pointer-events-none -z-10" />

        {/* Track Thumbnail & Metadata Info - Tapping opens full player */}
        <div
          className="flex items-center gap-3 min-w-0 flex-1 group select-none"
          title="Click to view Immersive Player & Synced Lyrics"
        >
          {/* Round artwork with slow rotation while playing */}
          <div className="relative w-12 h-12 md:w-12 md:h-12 rounded-full aspect-square overflow-hidden shadow-lg border border-white/15 group-hover:scale-105 transition flex-shrink-0 bg-black/40">
            <img
              src={currentSong.albumArt}
              alt={currentSong.title}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover ${isPlayingAudio ? 'animate-spin-slow' : ''}`}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
              }}
            />
            {(audioState === 'buffering' || Boolean(loadingTrack)) && (
              <div className="absolute inset-0 bg-black/75 rounded-full flex items-center justify-center p-1 backdrop-blur-xs">
                <MarqueeWaveLogo isPlaying={true} height={14} />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1 pr-1">
            <h4 className="text-sm font-bold text-white truncate leading-tight group-hover:text-amber-300 transition">
              {currentSong.title}
            </h4>
            <span className="text-xs text-white/60 truncate leading-tight whitespace-nowrap mt-0.5 group-hover:text-white/80 transition">
              {currentSong.artist}
            </span>
          </div>
        </div>

        {/* Desktop Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSongFavorite(currentSong.id);
          }}
          className="hidden md:block text-white/50 hover:text-rose-400 transition"
          title="Toggle Favorite"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Mobile Quick Action Buttons (Layout: Heart | Play/Pause with Glow | Next - All >= 44px tap targets) */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSongFavorite(currentSong.id);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/60 hover:text-rose-400 active:scale-90 transition shrink-0"
            title="Toggle Favorite"
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full text-black flex items-center justify-center shadow-lg active:scale-95 transition bg-white shrink-0 cursor-pointer"
            style={{
              boxShadow: '0 0 16px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.25)'
            }}
            title={isPlayingAudio ? 'Pause' : 'Play'}
          >
            {audioState === 'buffering' || Boolean(loadingTrack) ? (
              <div className="flex items-center justify-center scale-90">
                <MarqueeWaveLogo isPlaying={true} height={12} />
              </div>
            ) : isPlayingAudio ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition shrink-0 cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Music M Moving Waves Logo inside the Player Bar - Desktop only */}
        <div
          onClick={openFullPlayerModal}
          className="hidden md:flex items-center justify-center px-2 shrink-0 cursor-pointer group hover:scale-105 transition-transform"
          title="Marquee Live Audio Engine"
        >
          <MarqueeWaveLogo
            themeColor={appSettings?.artistThemeColor || '#1DB954'}
            isPlaying={isPlayingAudio}
            height={26}
          />
        </div>

        {/* Center Controls & Progress Scrub Bar - Desktop */}
        <div className="hidden md:flex flex-col items-center flex-1 max-w-xl gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 rounded-full transition ${isShuffle ? 'text-amber-400 bg-white/10' : 'text-white/50 hover:text-white'}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={playPrev} className="text-white/70 hover:text-white transition" title="Previous Track">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full text-black flex items-center justify-center shadow-lg hover:scale-105 transition relative bg-white"
              title={isPlayingAudio ? 'Pause' : 'Play'}
            >
              {audioState === 'buffering' || Boolean(loadingTrack) ? (
                <div className="flex items-center justify-center scale-90">
                  <MarqueeWaveLogo isPlaying={true} height={14} />
                </div>
              ) : isPlayingAudio ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>
            <button onClick={playNext} className="text-white/70 hover:text-white transition" title="Next Track">
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (repeatMode === 'off') setRepeatMode('all');
                else if (repeatMode === 'all') setRepeatMode('one');
                else setRepeatMode('off');
              }}
              className={`p-1.5 rounded-full transition ${repeatMode !== 'off' ? 'text-amber-400 bg-white/10' : 'text-white/50 hover:text-white'}`}
              title="Repeat Mode"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full">
            <span ref={curTimeLabelRef} className="text-[10px] text-white/50 font-mono w-9 text-right">
              0:00
            </span>
            <input
              ref={desktopBarInputRef}
              type="range"
              min="0"
              max="100"
              step="0.1"
              defaultValue="0"
              onMouseDown={() => { isUserScrubbingRef.current = true; }}
              onTouchStart={() => { isUserScrubbingRef.current = true; }}
              onMouseUp={() => { isUserScrubbingRef.current = false; }}
              onTouchEnd={() => { isUserScrubbingRef.current = false; }}
              onChange={handleScrub}
              className="flex-1 accent-white h-1 bg-white/20 rounded-full cursor-pointer"
            />
            <span className="text-[10px] text-white/50 font-mono w-9">{formatTime(totalSecs)}</span>
          </div>
        </div>

        {/* Right Tools & Volume - Desktop */}
        <div className="hidden md:flex items-center gap-3 w-64 justify-end">
          <button onClick={toggleLyricsPanel} className="text-white/60 hover:text-white transition" title="Toggle Lyrics">
            <Mic className="w-4 h-4" />
          </button>
          <button onClick={toggleEqualizer} className="text-white/60 hover:text-white transition" title="Spatial EQ">
            <Sliders className="w-4 h-4" />
          </button>
          <button onClick={toggleQueueModal} className="text-white/60 hover:text-white transition" title="Queue">
            <ListMusic className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 border-l border-white/15 pl-3">
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition" title="Mute/Unmute">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 accent-white h-1 bg-white/20 rounded-full cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
