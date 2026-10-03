import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Film,
  Play,
  Bookmark,
  ImageOff,
  Star,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import {
  getMediaByCategory,
  type MovieItem
} from '../services/mediaService';
import type { Movie } from '../types';

interface MovieCardProps {
  movie: MovieItem;
  isSelected: boolean;
  isFav: boolean;
  onPlay: (movie: MovieItem) => void;
  onHover: (movie: MovieItem) => void;
  onLeave: () => void;
  onToggleFavorite: (id: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isSelected,
  isFav,
  onPlay,
  onHover,
  onLeave,
  onToggleFavorite
}) => {
  const [imgError, setImgError] = useState(false);
  const ratingNum = movie.vote_average
    ? movie.vote_average.toFixed(1)
    : movie.rating
    ? movie.rating.replace('★', '').trim()
    : 'N/A';

  return (
    <div
      onClick={() => onPlay(movie)}
      onMouseEnter={() => onHover(movie)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(movie)}
      tabIndex={0}
      className={`group cursor-pointer flex flex-col transition-all duration-300 outline-none select-none ${
        isSelected ? 'scale-[1.03]' : 'hover:scale-[1.03]'
      }`}
    >
      {/* 2:3 Vertical Poster Container */}
      <div
        className={`relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border transition-all duration-300 shadow-md ${
          isSelected
            ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
            : 'border-white/10 group-hover:border-white/30'
        }`}
      >
        {movie.posterUrl && !imgError ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-95"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/30 p-2 text-center gap-1">
            <ImageOff className="w-8 h-8 text-white/20" />
            <span className="text-[10px] font-medium">No Artwork</span>
          </div>
        )}

        {/* Top-Right Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(movie.id.toString());
          }}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:text-amber-400 hover:bg-black/80 hover:scale-110 transition shadow-md z-10"
          title="Save to Library"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>

        {/* Bottom Rating Badge (e.g. 7.8, 8.1, 5.9) */}
        {ratingNum !== 'N/A' && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-black font-extrabold text-[11px] shadow-lg flex items-center gap-0.5 z-10">
            <span>{ratingNum}</span>
          </div>
        )}

        {/* Hover Dark Overlay with Play Icon */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
          <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition">
            <Play className="w-4 h-4 fill-black ml-0.5" />
          </div>
        </div>
      </div>

      {/* Title & Year Below Poster */}
      <div className="mt-2 px-0.5">
        <h4 className="text-xs md:text-sm font-bold text-white truncate leading-tight group-hover:text-amber-300 transition">
          {movie.title}
        </h4>
        <span className="text-[11px] text-white/50 leading-tight block mt-0.5">
          {movie.year || '2024'}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Section-scoped search helpers (Movies / Animation windows only)     */
/* ------------------------------------------------------------------ */

const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h per-query cache
const SEARCH_CACHE_PREFIX = 'marquee_section_search_v1_';
const MAX_RECENTS = 8;

// Case-insensitive, diacritic-tolerant normalizer
function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Loose Hindi/Roman spelling variants (e.g. "dil" ~ "dill", "ishq" ~ "ishk", "aa" ~ "a")
function romanVariant(str: string): string {
  return str
    .replace(/aa/g, 'a')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/z/g, 'j')
    .replace(/(.)\1+/g, '$1');
}

function matchesQuery(item: MovieItem, q: string): boolean {
  if (!q) return true;
  const hay = normalizeText(`${item.title} ${item.year || ''} ${item.overview || ''}`);
  if (hay.includes(q)) return true;
  return romanVariant(hay).includes(romanVariant(q));
}

function readSearchCache(key: string): MovieItem[] | null {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t: number; r: MovieItem[] };
    if (Date.now() - parsed.t > SEARCH_CACHE_TTL_MS) {
      localStorage.removeItem(SEARCH_CACHE_PREFIX + key);
      return null;
    }
    return parsed.r;
  } catch {
    return null;
  }
}

function writeSearchCache(key: string, results: MovieItem[]) {
  try {
    localStorage.setItem(SEARCH_CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), r: results.slice(0, 40) }));
  } catch {
    // Storage full: ignore, in-memory results still render
  }
}

function readRecents(section: string): string[] {
  try {
    const saved = localStorage.getItem(`marquee_recent_${section}`);
    return saved ? (JSON.parse(saved) as string[]).slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

// Survives unmount when the user opens a title (watch view) and comes back.
// Cleared when switching to another tab.
const sectionSearchMemory: { category: string | null; query: string; external: MovieItem[] } = {
  category: null,
  query: '',
  external: []
};

export const SoundtrackExplorer: React.FC = () => {
  const { currentCategory, activeView, searchQuery, favorites, toggleMovieFavorite, openVideo, showToast } = useMusicStore();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [activePreview, setActivePreview] = useState<MovieItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hoverTimerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  const isAnimation = currentCategory === 'Animation';
  const isTVSeries = currentCategory === 'TV Series';
  const isMystery = currentCategory === 'Mystery';
  const sectionLabel = isAnimation ? 'Animation' : isTVSeries ? 'TV Series' : isMystery ? 'Mystery' : 'Movies';

  /* ---------------- Section search state ---------------- */
  const restoring = sectionSearchMemory.category === currentCategory;
  const [sectionQuery, setSectionQuery] = useState<string>(restoring ? sectionSearchMemory.query : '');
  const [externalResults, setExternalResults] = useState<MovieItem[]>(restoring ? sectionSearchMemory.external : []);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => readRecents(sectionLabel));
  const [keyboardInset, setKeyboardInset] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const prevCategoryRef = useRef(currentCategory);

  // Keep memory in sync so the query/results survive opening a title
  useEffect(() => {
    sectionSearchMemory.category = currentCategory;
    sectionSearchMemory.query = sectionQuery;
    sectionSearchMemory.external = externalResults;
  }, [currentCategory, sectionQuery, externalResults]);

  // Clear memory on unmount unless the user is opening a title (watch view)
  useEffect(() => {
    return () => {
      if (useMusicStore.getState().activeView !== 'watch') {
        sectionSearchMemory.category = null;
        sectionSearchMemory.query = '';
        sectionSearchMemory.external = [];
      }
      searchAbortRef.current?.abort();
    };
  }, []);

  // Switching between Movies <-> Animation tabs clears the search
  useEffect(() => {
    if (prevCategoryRef.current === currentCategory) return;
    prevCategoryRef.current = currentCategory;
    searchAbortRef.current?.abort();
    setSectionQuery('');
    setExternalResults([]);
    setIsSearchingExternal(false);
    setRecents(readRecents(sectionLabel));
  }, [currentCategory, sectionLabel]);

  // visualViewport: keep results above the on-screen keyboard
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    const update = () => setKeyboardInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const saveRecent = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (clean.length < 2) return;
      setRecents((prev) => {
        const next = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENTS);
        try {
          localStorage.setItem(`marquee_recent_${sectionLabel}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [sectionLabel]
  );

  const removeRecent = (term: string) => {
    setRecents((prev) => {
      const next = prev.filter((t) => t !== term);
      try {
        localStorage.setItem(`marquee_recent_${sectionLabel}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Remote lookup scoped to this window's data source (TMDB category endpoint),
  // debounced, cancellable and cached per query for 24h.
  const runSectionFetch = useCallback(
    async (term: string) => {
      const q = term.trim();
      if (q.length < 2) return;
      const cacheKey = `${currentCategory}_${normalizeText(q)}`;

      const cached = readSearchCache(cacheKey);
      if (cached) {
        setExternalResults(cached);
        return;
      }

      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      setIsSearchingExternal(true);

      try {
        const raw = await getMediaByCategory(currentCategory, q, controller.signal);
        if (controller.signal.aborted) return;
        const nq = normalizeText(q);
        const scoped = raw.filter((item) => {
          // Section rules: Movies never shows animation, Animation only animation
          if (currentCategory === 'Movies' && (item.mediaType === 'animation' || item.genre_ids?.includes(16))) return false;
          if (currentCategory === 'Animation' && item.mediaType !== 'animation' && !item.genre_ids?.includes(16)) return false;
          // Guard against unfiltered fallback lists
          return matchesQuery(item, nq) || Boolean(item.poster_path);
        });
        writeSearchCache(cacheKey, scoped);
        setExternalResults(scoped);
      } catch (err: any) {
        if (err?.name !== 'AbortError') setExternalResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearchingExternal(false);
      }
    },
    [currentCategory]
  );

  // Fetch after 3+ chars and a 500ms pause
  useEffect(() => {
    const q = sectionQuery.trim();
    if (q.length < 3) {
      searchAbortRef.current?.abort();
      setIsSearchingExternal(false);
      if (!q) setExternalResults([]);
      return;
    }
    const timer = setTimeout(() => {
      runSectionFetch(q);
      saveRecent(q);
    }, 500);
    return () => clearTimeout(timer);
  }, [sectionQuery, runSectionFetch, saveRecent]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = sectionQuery.trim();
      if (q) {
        saveRecent(q);
        runSectionFetch(q);
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setSectionQuery('');
      setExternalResults([]);
    }
  };

  const clearSectionSearch = () => {
    searchAbortRef.current?.abort();
    setSectionQuery('');
    setExternalResults([]);
    setIsSearchingExternal(false);
  };

  useEffect(() => {
    // 300ms search debounce and AbortController request cancellation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await getMediaByCategory(currentCategory, searchQuery, controller.signal);

        if (!controller.signal.aborted) {
          setMovies(results);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setMovies([]);
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [currentCategory, searchQuery]);

  // Default preview to the first real TMDB result whenever movies change
  useEffect(() => {
    if (movies.length > 0) {
      setActivePreview(movies[0]);
    } else {
      setActivePreview(null);
    }
  }, [movies]);

  // Lightweight 180ms hover debounce to update the cinematic preview
  const handleCardHover = useCallback((item: MovieItem) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = setTimeout(() => {
      setActivePreview(item);
    }, 180);
  }, []);

  const handleCardLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
  }, []);

  const trimmedSectionQuery = sectionQuery.trim();
  const isSectionSearching = trimmedSectionQuery.length > 0;

  let displayItems = movies;
  if (isSectionSearching) {
    // 1) Instant local filter of this section's already-loaded items
    const nq = normalizeText(trimmedSectionQuery);
    const local = movies.filter((m) => matchesQuery(m, nq));
    // 2) Merge remote section results without duplicates
    const seen = new Set(local.map((m) => m.id));
    const remote = externalResults.filter((m) => !seen.has(m.id));
    displayItems = [...local, ...remote];
  }
  if (activeView === 'favorites') {
    displayItems = displayItems.filter((m) => favorites.has(m.id.toString()));
  }

  const handleWatchMovie = useCallback((item: MovieItem) => {
    const isAnim = item.mediaType === 'animation' || isAnimation;
    const isTv = item.mediaType === 'tv' || isTVSeries;

    // Transform strictly to Movie object without invoking any music playback
    const movie: Movie = {
      id: `tmdb-${item.id}`,
      tmdbId: item.id,
      mediaType: isAnim ? 'animation' : 'movie',
      isTv,
      category: isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Movies',
      title: item.title,
      description: item.overview,
      posterImg: item.posterUrl || undefined,
      bannerImg: item.backdropUrl || item.posterUrl || undefined,
      poster: item.posterUrl || undefined,
      year: item.year,
      rating: item.rating,
      quality: '4K HDR',
      duration: isTv ? 'Series' : '2h 10m',
      genre: isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Cinema',
      tags: ['TMDB 4K', isAnim ? 'Animation' : isTv ? 'TV Series' : isMystery ? 'Mystery' : 'Cinema'],
      subTags: [isAnim ? 'Animation' : isTv ? 'TV Series' : 'Movie', item.rating]
    };

    openVideo(movie);
    showToast(`Opening "${item.title}"`, 'video');
  }, [isAnimation, isTVSeries, isMystery, openVideo, showToast]);

  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -300, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: 300, behavior: 'smooth' });
    }
  };

  const sectionTitle =
    activeView === 'favorites'
      ? 'Saved Library Favorites'
      : isAnimation
      ? 'Popular Animation & Anime'
      : isTVSeries
      ? 'Trending TV Series'
      : isMystery
      ? 'Mystery Universe'
      : 'Popular Movies & Cinema';

  const previewBackdrop = activePreview?.backdropUrl || activePreview?.posterUrl;
  const activeRating = activePreview?.vote_average
    ? activePreview.vote_average.toFixed(1)
    : activePreview?.rating
    ? activePreview.rating.replace('★', '').trim()
    : 'N/A';

  const showRecents = isInputFocused && !sectionQuery && recents.length > 0;

  /* Section search field (same dark-glass style as the site's inputs) */
  const sectionSearchField = (
    <div className="w-full max-w-xl mx-auto relative">
      <div className="relative flex items-center h-12 min-h-[48px] px-4 rounded-full bg-[#12131a]/80 border border-white/15 focus-within:border-white/35 backdrop-blur-md shadow-lg transition-colors">
        <Search className="w-4 h-4 text-white/55 shrink-0 mr-3" />
        <input
          id={`section-search-${sectionLabel.toLowerCase().replace(/\s+/g, '-')}`}
          ref={searchInputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={sectionQuery}
          onChange={(e) => setSectionQuery(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setTimeout(() => setIsInputFocused(false), 180)}
          onKeyDown={handleSearchKeyDown}
          placeholder={isAnimation ? 'Search animation' : `Search ${sectionLabel.toLowerCase()}`}
          aria-label={isAnimation ? 'Search animation' : `Search ${sectionLabel.toLowerCase()}`}
          className="flex-1 bg-transparent text-white placeholder-white/45 text-sm font-medium focus:outline-none min-w-0 [&::-webkit-search-cancel-button]:hidden"
        />
        {isSearchingExternal && <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0 ml-2" />}
        {sectionQuery && (
          <button
            type="button"
            onClick={() => {
              clearSectionSearch();
              searchInputRef.current?.focus();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-3 rounded-full flex items-center justify-center text-white/55 hover:text-white transition shrink-0 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recent searches for this window (shown when focused & empty) */}
      {showRecents && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 p-3 rounded-2xl bg-[#12131a]/95 border border-white/10 shadow-2xl animate-in fade-in duration-150">
          <span className="block text-[10px] uppercase font-bold tracking-wider text-white/45 mb-2 px-1">
            Recent in {sectionLabel}
          </span>
          <div className="flex flex-wrap gap-2">
            {recents.map((term) => (
              <div
                key={term}
                className="flex items-center min-h-[44px] pl-3.5 rounded-full bg-white/10 border border-white/10 text-xs text-white/85"
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSectionQuery(term);
                    runSectionFetch(term);
                  }}
                  className="cursor-pointer py-2"
                >
                  {term}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => removeRecent(term)}
                  className="w-10 h-10 min-w-[40px] rounded-full flex items-center justify-center text-white/45 hover:text-white cursor-pointer"
                  aria-label={`Remove ${term}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full overflow-y-auto relative custom-scrollbar scroll-smooth snap-y snap-proximity"
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'y proximity'
      }}
    >
      {/* Section search bar: floats under the tabs at the top of the page content and scrolls with the page */}
      <div className="absolute left-0 right-0 z-20 px-4 md:px-16 top-[calc(112px+env(safe-area-inset-top,0px))] md:top-[96px]">
        {sectionSearchField}
      </div>

      {/* PAGE 1: FULL SCREEN CINEMATIC HERO COVER (hidden while a section search is active) */}
      {activePreview && !isSectionSearching && (
        <section
          style={{
            contain: 'layout style',
            minHeight: '100vh'
          }}
          className="relative w-full flex flex-col justify-between items-center text-center px-4 select-none shrink-0 snap-start min-h-[100vh] min-h-[100svh] min-h-[100dvh] h-[100svh] pt-[calc(172px+env(safe-area-inset-top,0px))] pb-[calc(135px+env(safe-area-inset-bottom,16px))] md:min-h-[calc(min(92vh,940px))] md:h-[calc(min(92vh,940px))] md:px-16 md:pt-[160px] md:pb-6"
        >
          {/* Hero Ambient Cover Backdrop stretched across 100% of Page 1 */}
          {previewBackdrop && (
            <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
              <img
                key={activePreview?.id}
                src={previewBackdrop}
                alt={activePreview?.title || ''}
                className="w-full h-full object-cover object-center brightness-[0.6] transition-all duration-700 animate-in fade-in scale-105"
              />
              {/* Multi-layer ambient vignettes: top darkening for header buttons, bottom darkening for clean finish */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d12] via-black/25 to-black/85" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/85" />
            </div>
          )}

          {/* Invisible spacer to balance vertical flex centering */}
          <div className="w-full h-2" />

          {/* Centered Hero Content */}
          <div className="max-w-4xl flex flex-col items-center my-auto animate-in fade-in duration-300 w-full px-2">
            {/* Title */}
            <h1 className="text-[clamp(2rem,8vw,3rem)] md:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] text-center mb-2.5 leading-tight">
              {activePreview.title}
            </h1>

            {/* Metadata Line */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs sm:text-sm md:text-base text-white/90 font-medium mb-3 max-w-full">
              <span className="font-semibold text-white/95">{isAnimation ? 'Animation' : isTVSeries ? 'TV Series' : isMystery ? 'Mystery' : 'Movie'}</span>
              {activeRating !== 'N/A' && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                    {activeRating}
                  </span>
                </>
              )}
              {activePreview.year && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="flex items-center gap-1.5 text-white/80">
                    <Calendar className="w-4 h-4 text-white/60 shrink-0" />
                    {activePreview.year}
                  </span>
                </>
              )}
            </div>

            {/* Centered Short Description */}
            <p className="max-w-2xl text-center text-xs sm:text-sm md:text-base text-white/85 leading-relaxed font-normal mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] line-clamp-2 md:line-clamp-4">
              {activePreview.overview || 'No overview available for this title.'}
            </p>

            {/* Centered Buttons: Row with flex-1, height 48px, whitespace-nowrap */}
            <div className="flex flex-row items-center justify-center gap-3 w-full max-w-md">
              <button
                onClick={() => handleWatchMovie(activePreview)}
                className="flex-1 h-12 min-h-[48px] px-4 rounded-xl bg-white text-black font-extrabold text-sm md:text-base flex items-center justify-center gap-2 hover:bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.8)] active:scale-95 transition cursor-pointer whitespace-nowrap"
                title="Play Now"
              >
                <Play className="w-4 h-4 fill-black shrink-0" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => handleWatchMovie(activePreview)}
                className="flex-1 h-12 min-h-[48px] px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition backdrop-blur-md cursor-pointer whitespace-nowrap"
                title="Details"
              >
                <span>Details</span>
                <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
              </button>
            </div>
          </div>

          {/* Bottom of First Cover: subtle scroll indicator stretching to the bottom edge of page 1 */}
          <button
            onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition duration-300 group cursor-pointer pb-4 z-10"
            title="Explore titles below"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 group-hover:text-white/80 transition">
              Explore Titles
            </span>
            <ChevronDown className="w-4 h-4 animate-bounce text-amber-400/80 group-hover:text-amber-400" />
          </button>
        </section>
      )}

      {/* CATALOG SECTION: POSITIONED DIRECTLY BELOW PAGE 1 */}
      <section
        ref={catalogRef}
        className={`px-6 md:px-8 py-8 relative z-10 bg-[#0c0d12]/80 backdrop-blur-md ${
          isSectionSearching || !activePreview ? 'pt-[calc(184px+env(safe-area-inset-top,0px))] md:pt-[168px] min-h-full' : ''
        }`}
        style={isSectionSearching ? { paddingBottom: `calc(160px + ${keyboardInset}px)` } : undefined}
      >
        <div className="flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="font-bold text-sm md:text-base text-white drop-shadow truncate">
              {isSectionSearching ? `Results in ${sectionLabel}` : sectionTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-white/60">
              {isSectionSearching
                ? `${displayItems.length} ${displayItems.length === 1 ? 'result' : 'results'}`
                : `${displayItems.length} Titles`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleScrollLeft}
                className="w-7 h-7 rounded-lg bg-black/40 border border-white/15 backdrop-blur-md hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition shadow"
                title="Scroll Up"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleScrollRight}
                className="w-7 h-7 rounded-lg bg-black/40 border border-white/15 backdrop-blur-md hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition shadow"
                title="Scroll Down"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cards Grid: 2:3 Vertical Posters with Bookmark & Rating */}
        {isLoading || (isSectionSearching && isSearchingExternal && displayItems.length === 0) ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(isSectionSearching ? 6 : 12)].map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse border border-white/5 p-3 flex flex-col justify-between"
              >
                <div className="flex justify-end">
                  <div className="w-7 h-7 rounded-full bg-white/10" />
                </div>
                <div className="w-8 h-4 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="h-64 rounded-3xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-6">
            <Film className="w-10 h-10 text-white/20 mb-3" />
            {isSectionSearching ? (
              <>
                <h3 className="text-sm font-semibold text-white/80">
                  No results for '{trimmedSectionQuery}' in {sectionLabel}
                </h3>
                <button
                  onClick={clearSectionSearch}
                  className="mt-4 min-h-[44px] px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-white/80">No titles found</h3>
                <p className="text-xs text-white/40 mt-1 max-w-sm">
                  {searchQuery
                    ? `No titles matching "${searchQuery}". Try a different search term.`
                    : 'Unable to load titles right now. Please verify your connection or TMDB API key.'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-12">
            {displayItems.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isSelected={activePreview?.id === movie.id}
                isFav={favorites.has(movie.id.toString())}
                onPlay={handleWatchMovie}
                onHover={handleCardHover}
                onLeave={handleCardLeave}
                onToggleFavorite={toggleMovieFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
