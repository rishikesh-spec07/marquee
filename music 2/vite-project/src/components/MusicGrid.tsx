import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search,
  Grid,
  Disc,
  Mic,
  Play,
  Pause,
  Heart,
  Activity,
  Layout,
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Flame,
  Music
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { searchTracks, getTrackFallbackArtwork } from '../services/musicService';
import { recommendationEngine } from '../recommendations/engine';
import { recommendationsStorage } from '../recommendations/storage';
import { CoverFlow } from './CoverFlow';
import { LyricsEngine } from './LyricsEngine';
import { VisualizerCanvas } from './VisualizerCanvas';
import { playerCore } from '../services/playerCore';
import { MarqueeWaveLogo } from './MarqueeWaveLogo';
import type { Song } from '../types';

export const MusicGrid: React.FC = () => {
  const {
    activeTrack,
    songsCatalog,
    activeSongIndex,
    playSong,
    favoriteSongs,
    toggleSongFavorite,
    searchQuery,
    setSearchQuery,
    visualizerMode,
    setVisualizerMode,
    openSearchModal,
    activeSubTab,
    setActiveSubTab,
    isPlayingAudio
  } = useMusicStore();

  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendedSongs, setRecommendedSongs] = useState<Song[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [expandedShelf, setExpandedShelf] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const rAFScrollRef = useRef<number | null>(null);

  // Load client recommendations based on listening history
  useEffect(() => {
    let mounted = true;
    async function updateRecommendations() {
      try {
        const count = await recommendationsStorage.getHistoryCount();
        if (!mounted) return;
        setHistoryCount(count);

        const recs = await recommendationEngine.getRecommendedTracks(songsCatalog, activeTrack, 12);
        if (!mounted) return;
        setRecommendedSongs(recs);
      } catch (e) {}
    }
    updateRecommendations();
    return () => {
      mounted = false;
    };
  }, [songsCatalog, activeTrack]);

  // Auto-scroll to top when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  // Debounced search with 250ms delay and AbortController
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTracks(q, 24, abortController.signal);
        if (!abortController.signal.aborted) {
          setSearchResults(results);
        }
      } catch (e) {
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  // Combine matching catalog songs with live API results
  let filteredSongs: Song[] = songsCatalog;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const localMatches = songsCatalog.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q)
    );

    const existingIds = new Set(localMatches.map((s) => s.id));
    const uniqueApiResults = searchResults.filter((s) => !existingIds.has(s.id));
    filteredSongs = [...localMatches, ...uniqueApiResults];
  }

  const handlePlayCard = (song: Song) => {
    playSong(song);
  };

  // Opens the existing track details/overview modal for the featured track (no auto-play)
  const handleOpenDetails = () => {
    if (!useMusicStore.getState().showFullPlayerModal) {
      useMusicStore.getState().toggleFullPlayerModal();
    }
  };

  const activePreview = activeTrack || (filteredSongs.length > 0 ? filteredSongs[0] : null);

  // Passive, rAF-batched scroll listener
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (rAFScrollRef.current !== null) return;

    rAFScrollRef.current = requestAnimationFrame(() => {
      if (scrollTop > 50 && !useMusicStore.getState().isScrolled) {
        useMusicStore.setState({ isScrolled: true });
      } else if (scrollTop <= 50 && useMusicStore.getState().isScrolled) {
        useMusicStore.setState({ isScrolled: false });
      }
      rAFScrollRef.current = null;
    });
  }, []);

  // Mobile shelves partitions (mixed Hindi & English)
  const hindiKeywords = [
    'arijit',
    'shreya',
    'pritam',
    'sachin',
    'jigar',
    'atif',
    'kesariya',
    'apna',
    'raat bhar',
    'tum hi ho',
    'dil diyan',
    'bollywood'
  ];

  const topHindiSongs = useMemo(() => {
    return songsCatalog.filter((s) => {
      const full = `${s.title} ${s.artist} ${s.genre || ''}`.toLowerCase();
      return hindiKeywords.some((k) => full.includes(k));
    });
  }, [songsCatalog]);

  const topEnglishSongs = useMemo(() => {
    return songsCatalog.filter((s) => {
      const full = `${s.title} ${s.artist} ${s.genre || ''}`.toLowerCase();
      return !hindiKeywords.some((k) => full.includes(k));
    });
  }, [songsCatalog]);

  const madeForYouSongs = useMemo(() => {
    if (recommendedSongs.length >= 4) return recommendedSongs;
    return songsCatalog.slice(0, 8);
  }, [recommendedSongs, songsCatalog]);

  const trendingSongs = useMemo(() => {
    const list: Song[] = [];
    const maxLen = Math.max(topHindiSongs.length, topEnglishSongs.length);
    for (let i = 0; i < maxLen; i++) {
      if (topHindiSongs[i]) list.push(topHindiSongs[i]);
      if (topEnglishSongs[i]) list.push(topEnglishSongs[i]);
    }
    return list.slice(0, 10);
  }, [topHindiSongs, topEnglishSongs]);

  const newReleasesSongs = useMemo(() => {
    return [...songsCatalog].reverse().slice(0, 8);
  }, [songsCatalog]);

  const becauseYouPlayedSongs = useMemo(() => {
    const curArtist = activeTrack?.artist?.split(/&|,/)[0]?.trim().toLowerCase();
    if (curArtist) {
      const related = songsCatalog.filter(
        (s) => s.id !== activeTrack?.id && s.artist.toLowerCase().includes(curArtist)
      );
      if (related.length >= 2) return related;
    }
    return songsCatalog.slice(2, 10);
  }, [activeTrack, songsCatalog]);

  // Mobile Quick Access 6 compact tiles
  const quickAccessItems = useMemo(() => {
    return [
      {
        id: 'liked-songs',
        type: 'liked',
        title: 'Liked Songs',
        isGradient: true,
        action: () => useMusicStore.getState().setActiveView('favorite-music')
      },
      {
        id: 'playlist-top',
        type: 'playlist',
        title: 'Bollywood Hits',
        art: topHindiSongs[0]?.albumArt || songsCatalog[0]?.albumArt,
        action: () => {
          if (topHindiSongs[0]) playSong(topHindiSongs[0]);
        }
      },
      {
        id: 'qa-track-1',
        type: 'song',
        title: songsCatalog[0]?.title || 'Blinding Lights',
        art: songsCatalog[0]?.albumArt,
        action: () => {
          if (songsCatalog[0]) playSong(songsCatalog[0]);
        }
      },
      {
        id: 'qa-track-2',
        type: 'song',
        title: topHindiSongs[0]?.title || 'Kesariya',
        art: topHindiSongs[0]?.albumArt,
        action: () => {
          if (topHindiSongs[0]) playSong(topHindiSongs[0]);
        }
      },
      {
        id: 'qa-track-3',
        type: 'song',
        title: topEnglishSongs[1]?.title || 'Starboy',
        art: topEnglishSongs[1]?.albumArt,
        action: () => {
          if (topEnglishSongs[1]) playSong(topEnglishSongs[1]);
        }
      },
      {
        id: 'qa-track-4',
        type: 'song',
        title: topHindiSongs[1]?.title || 'Raat Bhar',
        art: topHindiSongs[1]?.albumArt,
        action: () => {
          if (topHindiSongs[1]) playSong(topHindiSongs[1]);
        }
      }
    ];
  }, [songsCatalog, topHindiSongs, topEnglishSongs, playSong]);

  // Shelves configuration for mobile view
  const mobileShelves = [
    {
      id: 'made-for-you',
      title: 'Made For You',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />,
      songs: madeForYouSongs
    },
    {
      id: 'trending-popular',
      title: 'Trending & Popular',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      songs: trendingSongs
    },
    {
      id: 'new-releases',
      title: 'New Releases',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      songs: newReleasesSongs
    },
    {
      id: 'top-hindi',
      title: 'Top Hindi',
      icon: <Music className="w-4 h-4 text-amber-400" />,
      songs: topHindiSongs
    },
    {
      id: 'top-english',
      title: 'Top English',
      icon: <Disc className="w-4 h-4 text-blue-400" />,
      songs: topEnglishSongs
    },
    {
      id: 'because-you-played',
      title: 'Because You Played',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      songs: becauseYouPlayedSongs
    }
  ];

  // Helper to render a 140-160px shelf song card on mobile
  const renderMobileShelfCard = (song: Song) => {
    const isActive =
      activeTrack &&
      (activeTrack.id === song.id || activeTrack.canonicalTrackId === song.canonicalTrackId);
    const isFav = favoriteSongs.has(song.id);

    return (
      <div
        key={song.id || song.canonicalTrackId}
        onClick={() => handlePlayCard(song)}
        className={`w-[145px] min-w-[145px] max-w-[155px] snap-start shrink-0 flex flex-col group cursor-pointer transition-transform duration-200 active:scale-95 select-none relative ${
          isActive ? 'scale-[1.02]' : ''
        }`}
        style={{ contentVisibility: 'auto' }}
      >
        <div
          className={`relative aspect-square w-full rounded-2xl overflow-hidden mb-2 shadow-lg border bg-black/40 ${
            isActive
              ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20'
              : 'border-white/10 group-hover:border-white/20'
          }`}
        >
          <img
            src={song.albumArt}
            alt={song.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = getTrackFallbackArtwork(song.title, song.artist);
            }}
          />

          {/* Heart Favorite Action Button */}
          <div className="absolute top-2 right-2 pointer-events-none z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSongFavorite(song.id);
              }}
              className="pointer-events-auto w-7 h-7 min-w-[28px] min-h-[28px] rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 active:scale-90 transition shadow-md cursor-pointer"
              aria-label="Favorite track"
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Playing indicator */}
          {isActive && isPlayingAudio && (
            <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/40 flex items-center gap-1.5 shadow-md">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[9px] font-black uppercase text-amber-300">Playing</span>
            </div>
          )}
        </div>

        <span className="text-xs font-bold text-white truncate leading-snug group-hover:text-amber-300 transition-colors">
          {song.title}
        </span>
        <span className="text-[11px] text-white/50 truncate font-medium leading-tight mt-0.5">
          {song.artist}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 h-full overflow-y-auto relative custom-scrollbar scroll-smooth snap-y snap-proximity scroll-pt-[104px] md:scroll-pt-24"
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'y proximity'
      }}
    >
      {/* PAGE 1: FULL SCREEN CINEMATIC HERO COVER */}
      {!searchQuery.trim() && activePreview && (
        <>
          {/* MOBILE HERO (max-width: 767px) - RESTORED FULL-SCREEN LAYOUT MATCHING SCREENSHOT 2 */}
          <section className="mobile-hero md:hidden relative w-full flex flex-col justify-between items-center text-center px-4 select-none shrink-0 snap-start min-h-[100vh] min-h-[100svh] min-h-[100dvh] h-[100svh] pt-[calc(110px+env(safe-area-inset-top,0px))] pb-[calc(146px+max(12px,env(safe-area-inset-bottom,12px)))] overflow-hidden">
            {/* Full-bleed background: featured track's artwork covering entire hero */}
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
              <img
                src={activePreview.albumArt}
                alt=""
                className="w-full h-full object-cover object-center scale-105"
                onError={(e) => {
                  e.currentTarget.src = getTrackFallbackArtwork(activePreview.title, activePreview.artist);
                }}
              />
              {/* Darkened with gradient overlay (dark at top and bottom, slightly lighter in middle) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-black/35 to-black/85" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#0c0d12]" />
              <div className="absolute inset-0 bg-black/25" />
            </div>

            {/* Spacer to balance vertical alignment */}
            <div className="w-full h-2" />

            {/* Centered Content Block */}
            <div className="max-w-xl flex flex-col items-center my-auto animate-in fade-in duration-300 w-full px-2">
              {/* Title: very large and bold, clamp(2rem, 9vw, 3.25rem) */}
              <h1 className="mobile-hero-title text-[clamp(2.25rem,10vw,3.25rem)] font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] text-center mb-2 leading-tight line-clamp-2 max-w-sm">
                {activePreview.title}
              </h1>

              {/* Meta line: Song • Artist • Album */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm text-white/90 font-medium mb-3 max-w-full">
                <span className="font-normal text-white/70">Song</span>
                <span className="text-white/40">•</span>
                <span className="font-semibold text-white truncate max-w-[140px]">{activePreview.artist}</span>
                <span className="text-white/40">•</span>
                <span className="font-normal text-white/60 truncate max-w-[130px]">{activePreview.album}</span>
              </div>

              {/* Description: 2 lines maximum, centered, muted white */}
              <p className="mobile-hero-desc max-w-xs sm:max-w-md text-center text-xs sm:text-sm text-white/80 leading-relaxed font-normal mb-5 sm:mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] line-clamp-2">
                Enjoy this amazing track by {activePreview.artist}. Add it to your favorites and explore more music!
              </p>

              {/* Buttons row: white Play Now pill (flex: 1.2) + Details outlined glass pill (flex: 1), both 52px tall */}
              <div className="flex flex-row items-center justify-center gap-3 w-full px-6 max-w-md">
                <button
                  onClick={() => handlePlayCard(activePreview)}
                  className="flex-[1.2] h-[52px] min-h-[52px] px-5 rounded-full bg-white text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.8)] active:scale-95 transition cursor-pointer whitespace-nowrap"
                  title="Play Now"
                >
                  <Play className="w-4 h-4 fill-black shrink-0" />
                  <span>Play Now</span>
                </button>

                <button
                  onClick={handleOpenDetails}
                  className="flex-1 h-[52px] min-h-[52px] px-5 rounded-full bg-black/40 hover:bg-black/60 border border-white/25 text-white font-semibold text-sm flex items-center justify-center gap-1.5 shadow-xl active:scale-95 transition backdrop-blur-md cursor-pointer whitespace-nowrap"
                  title="Details"
                >
                  <span>Details</span>
                  <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
                </button>
              </div>
            </div>

            {/* Bottom EXPLORE TITLES with animated chevron positioned above mini-player & bottom nav */}
            <button
              onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition duration-300 group cursor-pointer pb-2 z-10"
              title="Explore collection below"
            >
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 group-hover:text-white/80 transition">
                EXPLORE TITLES
              </span>
              <ChevronDown className="w-4 h-4 animate-bounce text-amber-400/80 group-hover:text-amber-400" />
            </button>
          </section>

          {/* DESKTOP & TABLET HERO (hidden md:flex) - UNCHANGED ORIGINAL CINEMATIC LAYOUT */}
          <section className="hidden md:flex relative w-full h-[100svh] min-h-[100svh] flex-col justify-between p-6 md:p-12 snap-start overflow-hidden pt-28 select-none">
            <div
              className="absolute inset-0 z-0 transition-all duration-1000 scale-105"
              style={{
                background:
                  activePreview.themeGradient ||
                  'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #09090b 100%)'
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-[#0c0d12]/40 to-transparent z-0" />

            {/* Hero Content Center */}
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 my-auto w-full max-w-6xl mx-auto">
              <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-xl">
                <span className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-extrabold text-amber-300 uppercase tracking-widest backdrop-blur-md mb-3 shadow-lg">
                  Featured Anthem
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                  {activePreview.title}
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-white/80 font-medium mb-6 drop-shadow-md">
                  {activePreview.artist} • {activePreview.album}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePlayCard(activePreview)}
                    className="px-6 py-3 rounded-full bg-white text-black font-extrabold text-sm flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Play Now</span>
                  </button>
                  <button
                    onClick={() => toggleSongFavorite(activePreview.id)}
                    className={`p-3 rounded-full border transition cursor-pointer backdrop-blur-md ${
                      favoriteSongs.has(activePreview.id)
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                    aria-label="Favorite Anthem"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favoriteSongs.has(activePreview.id) ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="relative group shrink-0">
                <img
                  src={activePreview.albumArt}
                  alt={activePreview.title}
                  className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-3xl object-cover shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/20 transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Animated Scroll Down Indicator to Page 2 */}
            <div
              onClick={() => {
                const el = catalogRef.current;
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center gap-1 cursor-pointer group pb-2 shrink-0 z-10"
            >
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 group-hover:text-white transition">
                Explore Collection
              </span>
              <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-y-1 transition duration-300 animate-bounce" />
            </div>
          </section>
        </>
      )}

      {/* PAGE 2: MAIN CATALOG CONTAINER */}
      <section
        ref={catalogRef}
        className={`w-full flex flex-col px-3 sm:px-4 md:px-8 lg:px-12 snap-start scroll-mt-24 md:scroll-mt-20 ${
          searchQuery.trim() ? 'pt-28 md:pt-24' : 'pt-20 md:pt-6'
        } pb-[calc(180px+env(safe-area-inset-bottom,16px))] md:pb-32 min-h-screen`}
      >
        {/* ========================================================================= */}
        {/* MOBILE LAYOUT (max-width: 767px, SPOTIFY/APPLE MUSIC SHELVES)             */}
        {/* ========================================================================= */}
        {!searchQuery.trim() && (
          <div className="md:hidden flex flex-col gap-6 w-full">
            {/* 1. TOP: QUICK ACCESS 2-COLUMN GRID (6 COMPACT TILES, ~56px TALL) */}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-black text-white tracking-tight px-1">Good Day</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {quickAccessItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={item.action}
                    className="h-14 min-h-[56px] rounded-2xl bg-white/[0.07] active:bg-white/[0.12] border border-white/10 flex items-center overflow-hidden transition active:scale-[0.98] cursor-pointer shadow-md group"
                  >
                    {item.isGradient ? (
                      <div className="w-14 h-14 min-w-[56px] min-h-[56px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow-inner">
                        <Heart className="w-6 h-6 fill-white text-white drop-shadow" />
                      </div>
                    ) : (
                      <img
                        src={item.art || '/icons/default-album.png'}
                        alt=""
                        loading="lazy"
                        className="w-14 h-14 min-w-[56px] min-h-[56px] object-cover shrink-0"
                      />
                    )}
                    <span className="text-xs font-bold text-white px-2.5 truncate leading-snug line-clamp-2">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. HORIZONTAL SCROLLING SHELVES (2.3 CARDS PEEK, SCROLL-SNAP, 140-160px CARDS) */}
            <div className="flex flex-col gap-6">
              {mobileShelves.map((shelf) => (
                <div key={shelf.id} className="flex flex-col">
                  {/* Shelf Title Row with 'See all' Action */}
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                      {shelf.icon}
                      <span>{shelf.title}</span>
                    </h3>
                    <button
                      onClick={() => setExpandedShelf(expandedShelf === shelf.id ? null : shelf.id)}
                      className="min-h-[36px] px-2 text-xs font-bold text-amber-400 active:text-amber-300 flex items-center gap-1 cursor-pointer transition active:scale-95"
                    >
                      <span>{expandedShelf === shelf.id ? 'Show less' : 'See all'}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          expandedShelf === shelf.id ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Horizontal Scroll Shelf OR Expanded Vertical 2-Col Grid */}
                  {expandedShelf === shelf.id ? (
                    <div className="grid grid-cols-2 gap-3 pb-2 animate-in fade-in duration-200">
                      {shelf.songs.map((song) => renderMobileShelfCard(song))}
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2.5 pt-0.5 px-4 -mx-3 sm:-mx-4 scrollbar-none scroll-smooth">
                      {shelf.songs.map((song) => renderMobileShelfCard(song))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DESKTOP & TABLET VIEW (hidden md:block, UNCHANGED ORIGINAL LAYOUT)        */}
        {/* ========================================================================= */}
        <div className={`w-full ${!searchQuery.trim() ? 'hidden md:block' : 'block'}`}>
          {/* Dynamic Personalization Header Banner */}
          {!searchQuery.trim() && (
            <div className="mb-6 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {historyCount >= 10 ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                        Made For You
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase ml-1">
                        Personalized
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                        Trending & Popular
                      </h2>
                    </>
                  )}
                </div>
                <span className="text-xs text-white/50 font-medium hidden sm:inline">
                  {historyCount >= 10
                    ? 'Tuned to your taste signals'
                    : 'Play 10 songs to unlock personalized mixes'}
                </span>
              </div>
            </div>
          )}

          {/* View Mode Switching: Split View vs Lyrics View vs Music Grid */}
          {activeSubTab === 'split' ? (
            <div className="grid grid-cols-12 gap-5 flex-1 min-h-[500px]">
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-5 overflow-hidden">
                <CoverFlow />

                <div className="flex-1 bg-white/10 border border-white/15 rounded-3xl p-4 flex flex-col justify-between overflow-hidden relative">
                  <div className="flex items-center justify-between z-10 mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                      <Activity className="w-4 h-4 text-emerald-400" /> Web Audio Spectrum Visualizer
                    </span>
                    <div className="flex gap-1.5">
                      {(['bars', 'circular', 'particles'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setVisualizerMode(mode)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition cursor-pointer ${
                            visualizerMode === mode
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full h-[180px] relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 p-2">
                    <VisualizerCanvas />
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 bg-white/10 border border-white/15 rounded-3xl p-5 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                    <Mic className="w-4 h-4 text-amber-300" /> Live Karaoke Synced Lyrics
                  </span>
                  <span className="text-[10px] text-white/50">Line Jumping</span>
                </div>

                <LyricsEngine onSeekTime={(t) => playerCore.seekTo(t)} />
              </div>
            </div>
          ) : activeSubTab === 'lyrics' ? (
            <div className="flex-1 bg-white/10 border border-white/15 rounded-3xl p-6 overflow-hidden">
              <LyricsEngine onSeekTime={(t) => playerCore.seekTo(t)} />
            </div>
          ) : filteredSongs.length === 0 && !isSearching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 glass-panel rounded-3xl border border-white/15 text-center my-auto min-h-[360px]">
              <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 shadow-xl backdrop-blur-md">
                <MarqueeWaveLogo isPlaying={true} height={32} />
              </div>
              <h3 className="text-base font-bold text-white mb-1">No songs found for "{searchQuery}"</h3>
              <p className="text-xs text-white/60 max-w-sm mb-5">
                Try searching for another song title, artist, or clear the search filter to view your full music collection.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2 rounded-full bg-amber-400 text-black font-extrabold text-xs shadow-lg hover:bg-amber-300 transition cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            /* High-Performance Contained Music Grid (2-Col Mobile / 4-Col Desktop) */
            <div className="flex-1 w-full min-w-full overflow-y-auto pr-1">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 pb-48 md:pb-20">
                {filteredSongs.map((song) => {
                  const actualIndex = songsCatalog.findIndex(
                    (s) => (s.canonicalTrackId || s.id) === (song.canonicalTrackId || song.id)
                  );
                  const isActive =
                    (activeTrack &&
                      (activeTrack.id === song.id ||
                        activeTrack.canonicalTrackId === song.canonicalTrackId)) ||
                    (actualIndex >= 0 && actualIndex === activeSongIndex);
                  const isFav = favoriteSongs.has(song.id);

                  return (
                    <div
                      key={song.canonicalTrackId || song.id}
                      onClick={() => handlePlayCard(song)}
                      className={`card-contain group relative rounded-3xl overflow-hidden p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] shadow-xl border ${
                        isActive
                          ? 'border-emerald-500/90 ring-1 ring-emerald-500/50 bg-emerald-950/20 shadow-emerald-500/10'
                          : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25'
                      }`}
                    >
                      {/* Clean 1:1 Square Artwork Frame */}
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2.5 shadow-lg border border-white/10 bg-black/50">
                        <img
                          src={song.albumArt}
                          alt={song.title}
                          loading="lazy"
                          decoding="async"
                          className="relative w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 z-0"
                          onError={(e) => {
                            e.currentTarget.src = getTrackFallbackArtwork(song.title, song.artist);
                          }}
                        />

                        {/* Top Right Heart Favorite Action */}
                        <div className="absolute top-2 right-2 pointer-events-none z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSongFavorite(song.id);
                            }}
                            className="pointer-events-auto w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 hover:text-rose-400 hover:bg-black/75 hover:scale-110 transition shadow-md cursor-pointer"
                            title="Favorite Track"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                        </div>

                        {/* Center Play Button Overlay on Hover */}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                          <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-80 group-hover:scale-100 transition duration-300">
                            <Play className="w-4 h-4 fill-black ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Song Meta Details (Title & Artist) */}
                      <div className="flex flex-col min-w-0 px-1 pb-0.5">
                        <h4 className="text-xs font-bold text-white truncate leading-snug group-hover:text-amber-300 transition-colors drop-shadow-sm">
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-white/60 truncate font-medium leading-tight mt-0.5">
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
