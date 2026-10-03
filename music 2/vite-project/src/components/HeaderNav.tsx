import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Music,
  Sparkles,
  ChevronDown,
  Bookmark,
  Play,
  Pause,
  Heart,
  Loader2,
  User,
  Settings,
  ArrowRight,
  Menu,
  Film,
  Disc,
  Mic,
  ListMusic,
  LayoutGrid
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { searchTracks } from '../services/musicService';
import type { Category, Song } from '../types';
import { MarqueeWaveLogo } from './MarqueeWaveLogo';

export const HeaderNav: React.FC = () => {
  const {
    currentCategory,
    setCategory,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    openSearchModal,
    activeView,
    setActiveView,
    userProfile,
    isAuthenticated,
    openAuthModal,
    appSettings,
    isPlayingAudio,
    songsCatalog,
    playSong,
    activeTrack,
    togglePlay,
    favoriteSongs,
    toggleSongFavorite,
    showToast,
    activeSubTab,
    isScrolled
  } = useMusicStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownHovered, setIsDropdownHovered] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [apiRecommendations, setApiRecommendations] = useState<Song[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close mobile menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keep local search synced with global state
  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  // Expands when cursor moves on it, when dropdown is hovered, or when focused/typing
  const isExpanded = isHovered || isFocused || isDropdownHovered || localSearch.trim().length > 0;

  const categories: Category[] = ['Movies', 'Music', 'Animation', 'My Library'];

  // Handle outside click to blur and close recommendation dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
        setIsDropdownHovered(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure user is on the main songs page as soon as searching begins
  const ensureMainSongPage = () => {
    if (activeView !== 'home' || viewMode !== 'music' || currentCategory !== 'Music') {
      setActiveView('home');
      setViewMode('music');
      setCategory('Music');
    }
  };

  const cleanQ = localSearch.trim().toLowerCase();

  // Instant local catalog matches (0ms latency immediate recommendation)
  const localMatches = useMemo(() => {
    if (!cleanQ) return [];
    return songsCatalog
      .filter((song) => {
        const matchTitle = song.title.toLowerCase().includes(cleanQ);
        const matchArtist = song.artist.toLowerCase().includes(cleanQ);
        const matchAlbum = song.album ? song.album.toLowerCase().includes(cleanQ) : false;
        const matchGenre = Boolean(song.genre && song.genre.toLowerCase().includes(cleanQ));
        return matchTitle || matchArtist || matchAlbum || matchGenre;
      })
      .slice(0, 6);
  }, [cleanQ, songsCatalog]);

  // Combined immediate recommendations (local matches first for 0ms speed, then live API results)
  const recommendedSongs = useMemo(() => {
    if (!cleanQ) {
      // If search bar is focused but empty, show quick picks from catalog
      return songsCatalog.slice(0, 5);
    }
    const localIds = new Set(localMatches.map((s) => s.id));
    const uniqueApi = apiRecommendations.filter((s) => !localIds.has(s.id));
    return [...localMatches, ...uniqueApi].slice(0, 8);
  }, [cleanQ, localMatches, apiRecommendations, songsCatalog]);

  // Real-time synchronization & debounced live tracks fetching
  useEffect(() => {
    const q = localSearch.trim();
    setSelectedIndex(0);

    if (!q) {
      setApiRecommendations([]);
      setIsLoadingApi(false);
      return;
    }

    // Instantly sync query to global store so main song page displays results
    const syncTimer = setTimeout(() => {
      setSearchQuery(q);
    }, 100);

    // Fetch supplemental live API tracks from online catalog
    const apiTimer = setTimeout(async () => {
      setIsLoadingApi(true);
      try {
        const results = await searchTracks(q, 8);
        setApiRecommendations(results);
      } catch (err) {
        console.warn('API recommendation notice:', err);
      } finally {
        setIsLoadingApi(false);
      }
    }, 150);

    return () => {
      clearTimeout(syncTimer);
      clearTimeout(apiTimer);
    };
  }, [localSearch, setSearchQuery]);

  const handleCategoryClick = (cat: Category) => {
    setCategory(cat);
    if (cat === 'Music') {
      setActiveView('home');
      setViewMode('music');
    } else if (cat === 'My Library') {
      setActiveView('favorite-music');
      setViewMode('music');
    } else {
      setActiveView('home');
      setViewMode('movie');
    }
  };

  const handleClearSearch = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalSearch('');
    setSearchQuery('');
    setApiRecommendations([]);
    setIsFocused(false);
    setIsDropdownHovered(false);
    searchInputRef.current?.blur();
  };

  const handleToggleSong = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrent = activeTrack?.id === song.id || activeTrack?.canonicalTrackId === song.id;
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song);
      showToast(`Playing "${song.title}"`, 'music');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    } else if (e.key === 'ArrowDown') {
      if (recommendedSongs.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % recommendedSongs.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (recommendedSongs.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + recommendedSongs.length) % recommendedSongs.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (recommendedSongs.length > 0 && selectedIndex >= 0 && selectedIndex < recommendedSongs.length) {
        const selected = recommendedSongs[selectedIndex];
        playSong(selected);
        showToast(`Playing "${selected.title}"`, 'music');
      } else if (localSearch.trim()) {
        setSearchQuery(localSearch.trim());
        openSearchModal();
      }
    }
  };

  const handleMobileNav = (action: string) => {
    setIsMobileMenuOpen(false);
    if (action === 'profile') {
      if (isAuthenticated) {
        setActiveView('profile');
      } else {
        openAuthModal();
      }
    } else if (action === 'music-3d') {
      setViewMode('music');
      setActiveView('home');
      setCategory('Music');
      useMusicStore.getState().setActiveSubTab('split');
    } else if (action === 'categories') {
      setViewMode('music');
      setActiveView('categories');
    } else if (action === 'favorite-music') {
      setViewMode('music');
      setActiveView('favorite-music');
    } else if (action === 'lyrics') {
      setViewMode('music');
      setActiveView('home');
      useMusicStore.getState().setActiveSubTab('lyrics');
    } else if (action === 'queue') {
      useMusicStore.getState().toggleQueueModal();
    } else if (action === 'movies') {
      setViewMode('movie');
      setActiveView('home');
      setCategory('Movies');
    } else if (action === 'settings') {
      setActiveView('settings');
    }
  };

  const isDropdownOpen = (isFocused || isDropdownHovered || (isHovered && localSearch.trim().length > 0)) && isExpanded;

  return (
    <>
      {/* =========================================================================
          MOBILE TOP NAVIGATION HEADER (< 768px) - TRANSPARENT OVER HERO
          ========================================================================= */}
      <div
        className={`md:hidden w-full sticky top-0 z-40 select-none pt-[env(safe-area-inset-top,0px)] transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0c0d12]/95 backdrop-blur-md border-b border-white/10 shadow-lg'
            : 'bg-gradient-to-b from-[#0c0d12]/85 via-[#0c0d12]/35 to-transparent border-b border-transparent'
        }`}
      >
        {/* Top bar: Profile (left), Logo & Name (center), Search (right) */}
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Left: 44px Circular Profile button */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                setActiveView('profile');
              } else {
                openAuthModal();
              }
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition active:scale-95 shadow-md cursor-pointer shrink-0 overflow-hidden"
            aria-label="User Profile"
            title={isAuthenticated ? userProfile.name : 'Sign In / Profile'}
          >
            {isAuthenticated && userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white/90" />
            )}
          </button>

          {/* Center: Brand Logo and MARQUEE Name */}
          <div
            onClick={() => {
              setActiveView('home');
              setViewMode('music');
              setCategory('Music');
              useMusicStore.getState().setActiveSubTab('grid');
            }}
            className="flex items-center gap-2 cursor-pointer active:scale-95 transition"
            title="MARQUEE Home"
          >
            <MarqueeWaveLogo
              themeColor={appSettings?.artistThemeColor || '#1DB954'}
              isPlaying={isPlayingAudio}
              height={26}
            />
            <span className="font-extrabold text-base tracking-wider text-white font-sans uppercase">
              MARQUEE
            </span>
          </div>

          {/* Right: Balanced 44px Search button */}
          <div className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-end shrink-0">
            <button
              onClick={() => openSearchModal()}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-white/70 hover:text-white transition active:scale-95 cursor-pointer"
              aria-label="Search"
              title="Search songs, artists, albums"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pill Tab Switcher: Directly under the header (like Home | New in reference) */}
        <div className="w-full px-4 pb-2.5 pt-0.5 flex items-center justify-start overflow-x-auto scrollbar-none snap-x">
          <div className="inline-flex items-center p-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 gap-1 shrink-0 shadow-lg">
            {[
              { id: 'home', label: 'Home' },
              { id: 'new', label: 'New' },
              { id: 'movies', label: 'Movies' },
              { id: 'animation', label: 'Animation' },
              { id: 'library', label: 'My Library' }
            ].map((tab) => {
              const currentActiveTab =
                activeView === 'favorite-music'
                  ? 'library'
                  : viewMode === 'movie'
                  ? currentCategory === 'Animation'
                    ? 'animation'
                    : 'movies'
                  : activeView === 'home' && viewMode === 'music' && activeSubTab === 'split'
                  ? 'new'
                  : 'home';

              const isActive = currentActiveTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'home') {
                      setActiveView('home');
                      setViewMode('music');
                      setCategory('Music');
                      useMusicStore.getState().setActiveSubTab('grid');
                    } else if (tab.id === 'new') {
                      setActiveView('home');
                      setViewMode('music');
                      setCategory('Music');
                      useMusicStore.getState().setActiveSubTab('split');
                    } else if (tab.id === 'movies') {
                      setActiveView('home');
                      setViewMode('movie');
                      setCategory('Movies');
                    } else if (tab.id === 'animation') {
                      setActiveView('home');
                      setViewMode('movie');
                      setCategory('Animation');
                    } else if (tab.id === 'library') {
                      setActiveView('favorite-music');
                    }
                  }}
                  className={`h-8 px-4 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP FLOATING PILL NAVBAR (>= 768px)
          ========================================================================= */}
      <header className="hidden md:flex items-center justify-between gap-4 w-full relative px-5 py-2.5 rounded-full bg-[#10121a]/75 backdrop-blur-2xl border border-white/15 shadow-[0_16px_45px_rgba(0,0,0,0.65)] ring-1 ring-white/10 transition-all duration-300">
      {/* Brand Animated M Wave Logo */}
      <div
        onClick={() => {
          setActiveView('home');
          setViewMode('music');
        }}
        className="flex items-center gap-2 cursor-pointer select-none shrink-0 hover:scale-105 transition-all duration-300 ease-out"
        title="Marquee Home"
      >
        <MarqueeWaveLogo
          themeColor={appSettings?.artistThemeColor || '#1DB954'}
          isPlaying={isPlayingAudio}
          height={32}
        />
      </div>

      {/* 3D Expandable Search Bar: Expands when cursor moves on it, small otherwise */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          ensureMainSongPage();
          searchInputRef.current?.focus();
        }}
        className={`relative group select-none shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded ? 'w-60 sm:w-80 md:w-96' : 'w-10 sm:w-28 md:w-32'
        }`}
        title={isExpanded ? undefined : 'Search music, artists, soundtracks (Hover to expand or press Ctrl+K)'}
      >
        {/* Ambient Bloom Glow: Subtle when small, vibrant and luminous when enlarged */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-fuchsia-500/35 via-purple-500/25 to-blue-500/40 blur-md pointer-events-none transition-all duration-500 ${
            isExpanded
              ? 'opacity-100 scale-100'
              : 'opacity-40 group-hover:opacity-90 scale-95 group-hover:scale-105'
          }`}
        />

        {/* Dynamic Light Blooms visible when expanded */}
        {isExpanded && (
          <>
            <div className="absolute -left-2 -top-1.5 -bottom-1.5 w-28 bg-gradient-to-r from-fuchsia-500/40 via-purple-600/25 to-transparent rounded-full blur-md opacity-85 pointer-events-none transition-opacity duration-300" />
            <div className="absolute -right-2 -top-1.5 -bottom-1.5 w-28 bg-gradient-to-l from-blue-500/45 via-indigo-600/30 to-transparent rounded-full blur-md opacity-85 pointer-events-none transition-opacity duration-300" />
          </>
        )}

        {/* 3D Outer Rim with Light-Refracting Edge */}
        <div
          className={`relative p-[1.5px] rounded-2xl bg-gradient-to-r from-fuchsia-400/60 via-white/30 to-blue-400/60 transition-all duration-300 ${
            isExpanded
              ? 'shadow-[0_10px_25px_-3px_rgba(0,0,0,0.85),0_0_20px_rgba(59,130,246,0.35)]'
              : 'shadow-[0_4px_16px_rgba(0,0,0,0.85)] group-hover:shadow-[0_6px_22px_rgba(59,130,246,0.45)]'
          }`}
        >
          {/* 3D Inset Pill */}
          <div
            className="relative flex items-center justify-between h-10 px-3 rounded-[14.5px] bg-gradient-to-b from-[#242131] via-[#191723] to-[#100f17] group-hover:from-[#2d2940] transition-colors duration-300 overflow-hidden"
            style={{
              boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.22), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.75)'
            }}
          >
            {/* Search Icon & Input */}
            <div className="flex items-center gap-2 flex-1 min-w-0 h-full">
              <Search
                className="w-4 h-4 text-blue-300 group-hover:text-white drop-shadow-[0_0_6px_rgba(59,130,246,0.6)] shrink-0 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  ensureMainSongPage();
                  searchInputRef.current?.focus();
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={localSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSearch(val);
                  if (val.trim()) {
                    ensureMainSongPage();
                  }
                }}
                onFocus={() => {
                  setIsFocused(true);
                  ensureMainSongPage();
                }}
                onBlur={() => {
                  // Slight delay so clicks inside dropdown can register
                  setTimeout(() => {
                    if (!isDropdownHovered) {
                      setIsFocused(false);
                    }
                  }, 180);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={isExpanded ? 'Search music, artists, soundtracks...' : 'Search'}
                className={`w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-all duration-300 ${
                  !isExpanded ? 'cursor-pointer select-none hidden sm:block' : 'cursor-text'
                }`}
              />
            </div>

            {/* Collapsed Mode Shortcut Badge (visible only when small on medium+ screens) */}
            {!isExpanded && (
              <kbd className="hidden md:inline-block text-[10px] font-mono text-white/40 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 shrink-0 pointer-events-none ml-1">
                ⌘K
              </kbd>
            )}

            {/* Expanded Action Controls */}
            {isExpanded && (
              <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                {localSearch.trim() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      ensureMainSongPage();
                      setSearchQuery(localSearch.trim());
                      openSearchModal();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/40 text-blue-100 text-xs font-medium transition shadow-sm"
                  >
                    Search
                  </button>
                )}
                {(isFocused || localSearch) && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
                    title="Close / Clear (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Immediate Song Recommendations Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            onMouseEnter={() => setIsDropdownHovered(true)}
            onMouseLeave={() => setIsDropdownHovered(false)}
            className="absolute top-full left-0 mt-2.5 w-[calc(100vw-3rem)] max-w-[440px] sm:w-[440px] rounded-2xl bg-[#12131d]/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(59,130,246,0.25)] ring-1 ring-white/10 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 select-none overflow-hidden"
          >
            {/* Header: Title and Live Search Status */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>
                  {cleanQ ? `Immediate Recommendations (${recommendedSongs.length})` : 'Recommended For You'}
                </span>
              </div>
              {isLoadingApi ? (
                <div className="flex items-center gap-1 text-[11px] text-blue-300">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Searching online...</span>
                </div>
              ) : (
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                  Instant Match
                </span>
              )}
            </div>

            {/* Song Recommendations List */}
            {recommendedSongs.length > 0 ? (
              <div className="space-y-1 max-h-[330px] overflow-y-auto pr-1">
                {recommendedSongs.map((song, idx) => {
                  const isCurrent = activeTrack?.id === song.id || activeTrack?.canonicalTrackId === song.id;
                  const isPlayingThis = isCurrent && isPlayingAudio;
                  const isFav = favoriteSongs.has(song.id);
                  const isSelected = idx === selectedIndex;
                  const artwork = song.albumArt || '';

                  return (
                    <div
                      key={song.canonicalTrackId || song.id}
                      onClick={(e) => handleToggleSong(song, e)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group/item flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-500/25 border border-blue-400/50 shadow-sm text-white'
                          : isCurrent
                          ? 'bg-blue-500/15 border border-blue-400/30 text-white'
                          : 'hover:bg-white/[0.08] text-white/80 hover:text-white border border-transparent'
                      }`}
                    >
                      {/* Left: Artwork, Title & Artist */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-md bg-black/40">
                          {artwork ? (
                            <img
                              src={artwork}
                              alt={song.title}
                              className={`w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110 ${
                                isPlayingThis ? 'scale-105 brightness-90' : ''
                              }`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/40">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                          {/* Play/Pause Overlay */}
                          <div
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                              isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
                            }`}
                          >
                            {isPlayingThis ? (
                              <Pause className="w-4 h-4 text-white fill-white" />
                            ) : (
                              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col min-w-0 pr-2">
                          <span
                            className={`text-xs font-semibold truncate transition-colors ${
                              isCurrent ? 'text-blue-300 font-bold' : 'group-hover/item:text-white'
                            }`}
                          >
                            {song.title}
                          </span>
                          <span className="text-[11px] text-white/50 truncate group-hover/item:text-white/70">
                            {song.artist} {song.album ? `• ${song.album}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Genre pill & Favorite Button */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {song.genre && (
                          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/5">
                            {song.genre}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSongFavorite(song.id);
                            showToast(
                              isFav ? `Removed "${song.title}" from favorites` : `Added "${song.title}" to favorites`,
                              'music'
                            );
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            isFav
                              ? 'text-rose-400 hover:text-rose-300'
                              : 'text-white/30 hover:text-white/70 hover:bg-white/10'
                          }`}
                          title={isFav ? 'Remove Favorite' : 'Save to Favorites'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-white/50">
                {isLoadingApi ? 'Searching online catalog...' : `No immediate matches for "${cleanQ}". Press Enter to search everywhere.`}
              </div>
            )}

            {/* Footer with hint & View All Results button */}
            <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between px-1">
              <span className="text-[10px] text-white/40">
                Use ↑ ↓ arrows & click to play
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (cleanQ) setSearchQuery(cleanQ);
                  openSearchModal();
                }}
                className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
              >
                <span>View all results</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <nav className="flex items-center gap-1 bg-black/30 border border-white/10 p-1 rounded-full text-xs font-medium text-white/70 backdrop-blur-md shadow-inner">
        {categories.map((cat) => {
          const isActive = (viewMode === 'music' && cat === 'Music') || (viewMode === 'movie' && currentCategory === cat);
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white/20 text-white font-bold shadow-[0_2px_12px_rgba(255,255,255,0.15)] border border-white/20'
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'Music' && <Music className="w-3.5 h-3.5 text-amber-400" />}
              {cat === 'My Library' && <Bookmark className="w-3.5 h-3.5 text-amber-400" />}
              {cat}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveView('settings')}
          className={`p-2 border rounded-full transition relative group ${
            activeView === 'settings'
              ? 'text-black font-bold border-white/40 shadow-md ring-2 ring-white/30'
              : 'bg-white/[0.08] border-white/15 text-white/70 hover:text-white hover:bg-white/20'
          }`}
          style={{
            backgroundColor: activeView === 'settings' ? (appSettings?.artistThemeColor || '#1DB954') : undefined
          }}
          title="Artist Settings & Theme"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (viewMode === 'movie') {
              setViewMode('music');
              setCategory('Music');
            } else {
              setViewMode('movie');
              setCategory(currentCategory === 'Animation' ? 'Animation' : 'Movies');
            }
          }}
          className="px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/20 border border-white/15 rounded-full text-xs font-semibold text-white/90 transition flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Mode: {viewMode === 'music' ? 'Music 3D' : currentCategory === 'Animation' ? 'Animation' : 'Movie'}
        </button>

        <div
          onClick={() => {
            if (isAuthenticated) {
              setActiveView('profile');
            } else {
              openAuthModal();
            }
          }}
          className={`flex items-center gap-2.5 border pl-1.5 pr-3 py-1 rounded-full cursor-pointer transition group ${
            activeView === 'profile'
              ? 'bg-emerald-500/20 border-emerald-400/80 ring-2 ring-emerald-400/50 shadow-sm'
              : 'bg-white/[0.08] border-white/15 hover:bg-white/20 shadow-sm'
          }`}
          title={isAuthenticated ? 'Open User & Artist Profile' : 'Sign in to Account'}
        >
          {isAuthenticated ? (
            <>
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20"
              />
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight group-hover:text-amber-300 transition">
                  {userProfile.name}
                </span>
                <span className="text-[10px] text-white/50 leading-tight">
                  {userProfile.role}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight group-hover:text-amber-300 transition">
                  Sign In
                </span>
                <span className="text-[10px] text-white/50 leading-tight">
                  Guest
                </span>
              </div>
            </>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-white/40 ml-1" />
        </div>
      </div>
    </header>
    </>
  );
};
