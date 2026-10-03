import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Play,
  Pause,
  Plus,
  Check,
  ChevronLeft,
  Sparkles,
  Flame,
  TrendingUp,
  Disc,
  Loader2,
  ListMusic
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { searchTracks } from '../services/musicService';
import { searchStorage, RecentSearchItem } from '../services/searchStorage';
import { SEARCH_TRENDING_CHIPS } from '../config/searchChips';
import { VirtualList } from './VirtualList';
import type { Song } from '../types';

export const SearchModal: React.FC = () => {
  const {
    showSearchModal,
    closeSearchModal,
    searchQuery,
    setSearchQuery,
    songsCatalog,
    playSong,
    togglePlay,
    activeTrack,
    isPlayingAudio,
    favoriteSongs,
    toggleSongFavorite,
    playlists,
    addSongToPlaylist,
    removeSongFromPlaylist,
    showToast
  } = useMusicStore();

  const [inputVal, setInputVal] = useState(searchQuery);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'playlists'>('all');
  const [apiResults, setApiResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recents, setRecents] = useState<RecentSearchItem[]>([]);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Playlist bottom sheet selector state
  const [playlistSongTarget, setPlaylistSongTarget] = useState<Song | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync external search query and load recents when modal opens
  useEffect(() => {
    if (showSearchModal) {
      setInputVal(searchQuery);
      setTimeout(() => {
        mobileInputRef.current?.focus();
        inputRef.current?.focus();
      }, 80);

      searchStorage.getRecentSearches().then((items) => {
        setRecents(items);
      });
    }
  }, [showSearchModal, searchQuery]);

  // visualViewport handling for mobile virtual keyboard
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };
    window.visualViewport.addEventListener('resize', updateHeight);
    window.visualViewport.addEventListener('scroll', updateHeight);
    updateHeight();
    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('scroll', updateHeight);
    };
  }, []);

  // Global shortcut to open modal (Cmd+K, Ctrl+K, or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useMusicStore.getState().toggleSearchModal();
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        useMusicStore.getState().openSearchModal();
      } else if (e.key === 'Escape' && showSearchModal) {
        closeSearchModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchModal, closeSearchModal]);

  // Debounced search query (400ms, 3+ characters)
  useEffect(() => {
    const q = inputVal.trim();
    if (q.length < 3) {
      setApiResults([]);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchTracks(q, 24, abortController.signal);
        if (!abortController.signal.aborted) {
          setApiResults(results);
        }
      } catch (err) {
        // Abort or network notice
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [inputVal]);

  if (!showSearchModal) return null;

  const q = inputVal.trim().toLowerCase();

  // Filter catalog and API results based on query and filter mode
  const filterMatches = (songs: Song[]) => {
    if (!q) return songs;
    return songs.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchArtist = s.artist.toLowerCase().includes(q);
      const matchAlbum = s.album.toLowerCase().includes(q);
      const matchGenre = Boolean(s.genre && s.genre.toLowerCase().includes(q));

      if (activeFilter === 'artists') return matchArtist;
      if (activeFilter === 'songs') return matchTitle;
      return matchTitle || matchArtist || matchAlbum || matchGenre;
    });
  };

  const localMatches = q ? filterMatches(songsCatalog) : [];
  const existingIds = new Set(localMatches.map((s) => s.id));
  const uniqueApi = filterMatches(apiResults).filter((s) => !existingIds.has(s.id));
  const allResults = [...localMatches, ...uniqueApi];

  // Top result card for active search
  const topResult = allResults.length > 0 ? allResults[0] : null;

  // Filtered playlists when activeFilter is 'playlists' or 'all'
  const matchingPlaylists = playlists.filter((pl) => pl.name.toLowerCase().includes(q));

  // Quick picks when query is empty: mixed Hindi + English pool from catalog
  const quickPicks = songsCatalog.slice(0, 8);

  const handlePlaySong = (song: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Add to recents
    searchStorage
      .addRecentSearch({
        id: song.id,
        type: 'song',
        title: song.title,
        subtitle: song.artist,
        thumbnail: song.albumArt,
        songData: song
      })
      .then((updated) => setRecents(updated));

    const isCurrent = activeTrack?.id === song.id || activeTrack?.canonicalTrackId === song.id;
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  const handleRemoveRecent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await searchStorage.removeRecentSearch(id);
    setRecents(updated);
  };

  const handleClearRecents = async () => {
    await searchStorage.clearRecentSearches();
    setRecents([]);
  };

  const isSongSaved = (songId: string): boolean => {
    if (favoriteSongs.has(songId)) return true;
    return playlists.some((pl) => pl.songs.includes(songId));
  };

  const handleToggleAddSong = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylistSongTarget(song);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE FULL-SCREEN SPOTIFY-STYLE LAYOUT (max-width: 767px)                */}
      {/* ========================================================================= */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-[#0c0d12] flex flex-col text-white overflow-hidden animate-in fade-in duration-200"
        style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
      >
        {/* Top Search Bar */}
        <div className="pt-[max(12px,env(safe-area-inset-top,12px))] px-3 pb-2.5 border-b border-white/10 shrink-0 bg-[#0c0d12]/95 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            {/* Back Button */}
            <button
              onClick={closeSearchModal}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-white/80 active:text-white transition active:scale-95 cursor-pointer shrink-0"
              aria-label="Back"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            {/* Rounded Search Input Field */}
            <div className="flex-1 flex items-center gap-2 px-3.5 h-11 rounded-full bg-white/10 border border-white/15 focus-within:border-white/30 focus-within:bg-white/15 transition">
              <Search className="w-4 h-4 text-white/50 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="What do you want to listen to?"
                autoFocus
                className="flex-1 bg-transparent text-white placeholder-white/40 text-sm font-medium focus:outline-none min-w-0"
              />
              {isSearching && <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />}
              {inputVal && !isSearching && (
                <button
                  onClick={() => {
                    setInputVal('');
                    mobileInputRef.current?.focus();
                  }}
                  className="w-7 h-7 min-w-[28px] min-h-[28px] rounded-full flex items-center justify-center text-white/50 hover:text-white transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills (Below search field) */}
          <div className="flex items-center gap-2 mt-2.5 px-1 overflow-x-auto scrollbar-none">
            {(['all', 'songs', 'artists', 'playlists'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-bold capitalize transition shrink-0 cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/10 text-white/70 active:bg-white/20'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-32 scrollbar-none">
          {/* EMPTY FIELD STATE */}
          {!q && (
            <div className="flex flex-col gap-5">
              {/* Recents list if available */}
              {recents.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-extrabold text-white tracking-tight px-1">Recents</h3>

                  <div className="flex flex-col">
                    {recents.map((item) => {
                      const isCurrent =
                        item.songData &&
                        (activeTrack?.id === item.songData.id ||
                          activeTrack?.canonicalTrackId === item.songData.id);
                      const isSaved = item.songData ? isSongSaved(item.songData.id) : false;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.songData) {
                              handlePlaySong(item.songData);
                            } else if (item.type === 'playlist') {
                              // Open category or toast
                              showToast(`Opened ${item.title}`);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-2xl active:bg-white/10 transition group cursor-pointer ${
                            isCurrent ? 'bg-white/10' : ''
                          }`}
                        >
                          {/* 56px Rounded Thumbnail + Meta */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <img
                              src={item.thumbnail || '/icons/default-album.png'}
                              alt=""
                              loading="lazy"
                              className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl object-cover shadow-md bg-white/5 shrink-0"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-bold text-white truncate leading-tight">
                                {item.title}
                              </span>
                              <span className="text-xs text-white/50 truncate leading-tight mt-1">
                                {item.type === 'song' ? `Song • ${item.subtitle}` : item.subtitle || item.type}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons: Circled + / Check & Remove X */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {item.songData && (
                              <button
                                onClick={(e) => handleToggleAddSong(item.songData!, e)}
                                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition active:scale-90 text-white/70 hover:text-white cursor-pointer"
                                aria-label="Add to playlist"
                              >
                                <div
                                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                                    isSaved
                                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                                      : 'border-white/30 bg-white/5 text-white/80'
                                  }`}
                                >
                                  {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                              </button>
                            )}

                            <button
                              onClick={(e) => handleRemoveRecent(item.id, e)}
                              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-white/40 hover:text-white transition active:scale-90 cursor-pointer"
                              aria-label="Remove recent item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clear recent searches link */}
                  <div className="pt-3 pb-6 flex justify-center">
                    <button
                      onClick={handleClearRecents}
                      className="min-h-[44px] px-4 text-xs font-semibold text-white/50 hover:text-white transition underline underline-offset-4 cursor-pointer flex items-center"
                    >
                      Clear recent searches
                    </button>
                  </div>
                </div>
              ) : (
                /* Quick Picks when no recents exist (New user) */
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/50 px-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Trending Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SEARCH_TRENDING_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setInputVal(chip)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 active:bg-white/15 active:text-white transition flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/50 px-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Quick Picks
                    </div>
                    <div className="flex flex-col">
                      {quickPicks.map((song) => {
                        const isCurrent = activeTrack?.id === song.id || activeTrack?.canonicalTrackId === song.id;
                        const isSaved = isSongSaved(song.id);

                        return (
                          <div
                            key={song.id}
                            onClick={() => handlePlaySong(song)}
                            className={`flex items-center justify-between p-2 rounded-2xl active:bg-white/10 transition cursor-pointer ${
                              isCurrent ? 'bg-white/10' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <img
                                src={song.albumArt}
                                alt=""
                                loading="lazy"
                                className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl object-cover shadow-md bg-white/5 shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-bold text-white truncate leading-tight">
                                  {song.title}
                                </span>
                                <span className="text-xs text-white/50 truncate leading-tight mt-1">
                                  Song • {song.artist}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleToggleAddSong(song, e)}
                              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition active:scale-90 text-white/70 hover:text-white cursor-pointer"
                              aria-label="Add to playlist"
                            >
                              <div
                                className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                                  isSaved
                                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                                    : 'border-white/30 bg-white/5 text-white/80'
                                }`}
                              >
                                {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE TYPING RESULTS */}
          {q && (
            <div className="flex flex-col gap-4">
              {/* TOP RESULT CARD */}
              {topResult && activeFilter !== 'playlists' && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 px-1">
                    Top Result
                  </span>
                  <div
                    onClick={() => handlePlaySong(topResult)}
                    className="p-4 rounded-3xl bg-white/[0.08] border border-white/15 flex items-center justify-between gap-3 active:scale-[0.99] transition cursor-pointer shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <img
                        src={topResult.albumArt}
                        alt=""
                        className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-2xl object-cover shadow-lg shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-base font-extrabold text-white truncate leading-tight">
                          {topResult.title}
                        </span>
                        <span className="text-xs text-white/60 truncate leading-tight mt-1">
                          Song • {topResult.artist}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handlePlaySong(topResult, e)}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl active:scale-95 transition cursor-pointer shrink-0"
                      aria-label="Play top result"
                    >
                      {activeTrack?.id === topResult.id && isPlayingAudio ? (
                        <Pause className="w-5 h-5 fill-black" />
                      ) : (
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* LIST OF MATCHING SONGS */}
              {activeFilter !== 'playlists' && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 px-1 mb-1">
                    Songs
                  </span>
                  {allResults.map((song) => {
                    const isCurrent = activeTrack?.id === song.id || activeTrack?.canonicalTrackId === song.id;
                    const isSaved = isSongSaved(song.id);

                    return (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song)}
                        className={`flex items-center justify-between p-2 rounded-2xl active:bg-white/10 transition cursor-pointer ${
                          isCurrent ? 'bg-white/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <img
                            src={song.albumArt}
                            alt=""
                            loading="lazy"
                            className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl object-cover shadow-md bg-white/5 shrink-0"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-white truncate leading-tight">
                              {song.title}
                            </span>
                            <span className="text-xs text-white/50 truncate leading-tight mt-1">
                              Song • {song.artist}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleToggleAddSong(song, e)}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition active:scale-90 text-white/70 hover:text-white cursor-pointer shrink-0"
                          aria-label="Add to playlist"
                        >
                          <div
                            className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                              isSaved
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400'
                                : 'border-white/30 bg-white/5 text-white/80'
                            }`}
                          >
                            {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LIST OF MATCHING PLAYLISTS */}
              {(activeFilter === 'playlists' || activeFilter === 'all') && matchingPlaylists.length > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 px-1 mb-1">
                    Playlists
                  </span>
                  {matchingPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => {
                        searchStorage.addRecentSearch({
                          id: pl.id,
                          type: 'playlist',
                          title: pl.name,
                          subtitle: `${pl.songs.length} tracks`,
                          thumbnail: '/icons/default-playlist.png'
                        });
                        showToast(`Opened playlist ${pl.name}`);
                      }}
                      className="flex items-center justify-between p-2 rounded-2xl active:bg-white/10 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                          <ListMusic className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-bold text-white truncate leading-tight">
                            {pl.name}
                          </span>
                          <span className="text-xs text-white/50 truncate leading-tight mt-1">
                            Playlist • {pl.songs.length} tracks
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state when no matches */}
              {allResults.length === 0 && matchingPlaylists.length === 0 && !isSearching && (
                <div className="py-16 flex flex-col items-center justify-center text-center text-white/50">
                  <Disc className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-bold text-white/80">No results found for "{q}"</p>
                  <p className="text-xs text-white/40 mt-1 max-w-xs">
                    Please try another song title, artist, or soundtrack.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP & TABLET MODAL (md:flex, UNCHANGED LAYOUT & STYLING)              */}
      {/* ========================================================================= */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-start justify-center pt-12 md:pt-20 px-3 md:px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={closeSearchModal}
      >
        <div
          className="w-full max-w-2xl bg-[#12131a]/95 border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header Input Field */}
          <div className="p-4 md:p-5 border-b border-white/[0.08] flex items-center gap-3 relative">
            <Search className="w-5 h-5 text-white/50 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search songs, artists, albums, or soundtracks..."
              className="flex-1 bg-transparent text-white placeholder-white/40 text-base md:text-lg font-medium focus:outline-none"
            />

            {isSearching && <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />}

            {inputVal && !isSearching && (
              <button
                onClick={() => {
                  setInputVal('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-white/40 hover:text-white transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={closeSearchModal}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-semibold transition shrink-0 ml-1 cursor-pointer"
            >
              ESC
            </button>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02] flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {(['all', 'songs', 'artists', 'playlists'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition shrink-0 cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Modal Body / Results */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-2 custom-scrollbar">
            {/* STATE 1: Empty Query Display */}
            {!q && (
              <div className="flex flex-col gap-5 py-2">
                {/* Trending Discovery Tags */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/50">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> Trending Searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SEARCH_TRENDING_CHIPS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setInputVal(tag)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Picks */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/50">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Quick Picks For You
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {quickPicks.map((song) => {
                      const isCurrent = activeTrack?.id === song.id || activeTrack?.canonicalTrackId === song.id;
                      const isSaved = isSongSaved(song.id);
                      return (
                        <div
                          key={song.id}
                          onClick={() => handlePlaySong(song)}
                          className={`flex items-center justify-between p-2.5 px-3 rounded-2xl cursor-pointer transition group border ${
                            isCurrent
                              ? 'bg-white/15 border-white/20 shadow-md'
                              : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={song.albumArt}
                              alt={song.title}
                              loading="lazy"
                              decoding="async"
                              className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0 group-hover:scale-105 transition"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-white group-hover:text-amber-300 truncate transition leading-tight">
                                {song.title}
                              </span>
                              <span className="text-xs text-white/60 truncate leading-tight mt-1 flex items-center gap-2">
                                <span>{song.artist}</span>
                                <span className="text-white/30">•</span>
                                <span>{song.album}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <button
                              onClick={(e) => handleToggleAddSong(song, e)}
                              className={`p-2 rounded-full transition cursor-pointer ${
                                isSaved ? 'text-emerald-400' : 'text-white/40 hover:text-white'
                              }`}
                            >
                              {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={(e) => handlePlaySong(song, e)}
                              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-105 transition cursor-pointer"
                              title={isCurrent && isPlayingAudio ? 'Pause' : 'Play'}
                            >
                              {isCurrent && isPlayingAudio ? (
                                <Pause className="w-4 h-4 fill-black text-black" />
                              ) : (
                                <Play className="w-4 h-4 fill-black ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: Active Results Display */}
            {q && (
              <div className="flex flex-col flex-1 h-[420px] min-h-[380px]">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/40 shrink-0 mb-1">
                  <span>SEARCH RESULTS</span>
                  <span>{allResults.length} FOUND</span>
                </div>

                {allResults.length > 0 ? (
                  <VirtualList
                    items={allResults}
                    itemHeight={68}
                    buffer={5}
                    renderItem={(song) => {
                      const isCurrent = activeTrack?.id === song.id || activeTrack?.canonicalTrackId === song.id;
                      const isSaved = isSongSaved(song.id);
                      return (
                        <div
                          onClick={() => handlePlaySong(song)}
                          className={`flex items-center justify-between p-2 px-3 rounded-2xl cursor-pointer transition group border mb-1.5 h-[62px] ${
                            isCurrent
                              ? 'bg-white/15 border-white/30 shadow-lg ring-1 ring-white/15'
                              : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              <img
                                src={song.albumArt}
                                alt={song.title}
                                loading="lazy"
                                decoding="async"
                                className="w-11 h-11 rounded-xl object-cover shadow-md group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Play className="w-3.5 h-3.5 fill-white text-white" />
                              </div>
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-bold text-white group-hover:text-amber-300 truncate transition leading-tight">
                                {song.title}
                              </span>
                              <span className="text-xs text-white/60 truncate leading-tight mt-0.5 flex items-center gap-2">
                                <span>{song.artist}</span>
                                <span className="text-white/30">•</span>
                                <span className="truncate">{song.album}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <button
                              onClick={(e) => handleToggleAddSong(song, e)}
                              className={`p-2 rounded-full transition cursor-pointer ${
                                isSaved ? 'text-emerald-400' : 'text-white/40 hover:text-white'
                              }`}
                            >
                              {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={(e) => handlePlaySong(song, e)}
                              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-105 transition cursor-pointer"
                              title={isCurrent && isPlayingAudio ? 'Pause' : 'Play'}
                            >
                              {isCurrent && isPlayingAudio ? (
                                <Pause className="w-4 h-4 fill-black text-black" />
                              ) : (
                                <Play className="w-4 h-4 fill-black ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    }}
                  />
                ) : !isSearching ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center text-white/50">
                    <Disc className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-bold text-white/80">No tracks found for "{q}"</p>
                    <p className="text-xs text-white/40 mt-1 max-w-xs">
                      Try searching by artist name, movie soundtrack, or genre.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Modal Footer Keyboard Shortcuts */}
          <div className="px-5 py-3 border-t border-white/[0.08] bg-black/30 flex items-center justify-between text-[11px] text-white/50">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">↵</kbd>
                <span>Play</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">ESC</kbd>
                <span>Close</span>
              </span>
            </div>

            <span className="text-[10px] text-white/30 hidden sm:inline">Wavelength Spatial Search</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PLAYLIST SELECTOR BOTTOM SHEET / MODAL                                    */}
      {/* ========================================================================= */}
      {playlistSongTarget && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
          onClick={() => setPlaylistSongTarget(null)}
        >
          <div
            className="w-full md:max-w-md bg-[#161824] border border-white/20 rounded-t-3xl md:rounded-3xl p-5 shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={playlistSongTarget.albumArt}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{playlistSongTarget.title}</h4>
                  <p className="text-[11px] text-white/50 truncate">{playlistSongTarget.artist}</p>
                </div>
              </div>
              <button
                onClick={() => setPlaylistSongTarget(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wider">Save to Playlist</p>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[45vh] pr-1">
              {/* Liked Songs option */}
              <button
                onClick={() => {
                  toggleSongFavorite(playlistSongTarget.id);
                  showToast(
                    favoriteSongs.has(playlistSongTarget.id)
                      ? 'Removed from Liked Songs'
                      : 'Saved to Liked Songs'
                  );
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Check className={`w-4 h-4 ${favoriteSongs.has(playlistSongTarget.id) ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <span className="text-sm font-bold text-white">Liked Songs</span>
                </div>
                <span className="text-xs text-white/40">
                  {favoriteSongs.has(playlistSongTarget.id) ? 'Added' : 'Add'}
                </span>
              </button>

              {/* User Playlists */}
              {playlists.map((pl) => {
                const inPl = pl.songs.includes(playlistSongTarget.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      if (inPl) {
                        removeSongFromPlaylist(pl.id, playlistSongTarget.id);
                        showToast(`Removed from ${pl.name}`);
                      } else {
                        addSongToPlaylist(pl.id, playlistSongTarget.id);
                        showToast(`Added to ${pl.name}`);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          inPl ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/30'
                        }`}
                      >
                        <Check className={`w-4 h-4 ${inPl ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-sm font-bold text-white">{pl.name}</span>
                    </div>
                    <span className="text-xs text-white/40">{inPl ? 'Added' : 'Add'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
