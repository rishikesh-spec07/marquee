import { apiKeyManager } from './apiKeyManager';
import { HERO_MOVIES, RECOMMENDATIONS, CATEGORY_MOVIES_MAP } from '../data/moviesData';
import type { Movie } from '../types';

// TMDB Endpoints with primary and fallback domains
// api.tmdb.org is the fast, unblocked modern API endpoint
// api.themoviedb.org is the legacy fallback
const TMDB_PRIMARY_BASE = 'https://api.tmdb.org/3';
const TMDB_FALLBACK_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

export interface MovieItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  // Derived helper fields (always strictly bound to this exact movie)
  posterUrl: string | null;
  backdropUrl: string | null;
  year: string;
  rating: string;
  mediaType?: 'movie' | 'animation' | 'tv';
  category?: string;
}

interface TMDBRawItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  media_type?: string;
}

function normalizeMovieItem(raw: TMDBRawItem, defaultMediaType: 'movie' | 'animation' | 'tv' = 'movie'): MovieItem {
  const title = raw.title || raw.name || 'Untitled';
  const releaseDate = raw.release_date || raw.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : '2024';
  const rating = raw.vote_average ? `${raw.vote_average.toFixed(1)} ★` : 'N/A';
  const posterUrl = raw.poster_path ? `${TMDB_IMAGE_BASE}${raw.poster_path}` : null;
  const backdropUrl = raw.backdrop_path ? `${TMDB_BACKDROP_BASE}${raw.backdrop_path}` : null;
  const isAnim = raw.genre_ids?.includes(16) || defaultMediaType === 'animation';
  const isTv = defaultMediaType === 'tv' || raw.media_type === 'tv' || Boolean(raw.first_air_date && !raw.release_date);

  return {
    id: raw.id,
    title,
    overview: raw.overview || 'No overview available.',
    poster_path: raw.poster_path || null,
    backdrop_path: raw.backdrop_path || null,
    release_date: releaseDate,
    vote_average: raw.vote_average || 0,
    genre_ids: raw.genre_ids || [],
    posterUrl,
    backdropUrl,
    year,
    rating,
    mediaType: isAnim ? 'animation' : isTv ? 'tv' : 'movie'
  };
}

// Convert local Movie type from moviesData to MovieItem format for seamless offline/fallback support
function movieToMovieItem(m: Movie): MovieItem {
  const numericId = m.tmdbId || parseInt(m.id.replace(/\D/g, ''), 10) || Math.floor(Math.random() * 100000);
  const ratingClean = m.rating ? m.rating.replace('★', '').trim() : '4.8';
  const ratingNum = parseFloat(ratingClean);
  const isAnim = m.mediaType === 'animation' || m.category === 'Animation' || m.genre === 'Animation';
  const isTv = m.category === 'TV Series' || m.isTv;

  return {
    id: numericId,
    title: m.title,
    overview: m.description || 'No overview available.',
    poster_path: null,
    backdrop_path: null,
    release_date: m.year ? `${m.year}-01-01` : '2024-01-01',
    vote_average: !isNaN(ratingNum) ? (ratingNum <= 5 ? ratingNum * 2 : ratingNum) : 8.5,
    genre_ids: isAnim ? [16] : isTv ? [18] : [],
    posterUrl: m.posterImg || m.poster || null,
    backdropUrl: m.bannerImg || m.posterImg || m.poster || null,
    year: m.year || '2024',
    rating: m.rating || '4.8 ★',
    mediaType: isAnim ? 'animation' : isTv ? 'tv' : 'movie',
    category: m.category || (isAnim ? 'Animation' : isTv ? 'TV Series' : 'Movies')
  };
}

/**
 * Get built-in fallback items when TMDB is unavailable, offline, or returns 0 results
 */
function getFallbackCatalog(category: string = 'Movies', query?: string): MovieItem[] {
  let list: Movie[] = [];
  if (category === 'Animation') {
    list = CATEGORY_MOVIES_MAP['Animation'] || [];
  } else if (category === 'TV Series') {
    list = CATEGORY_MOVIES_MAP['TV Series'] || [];
  } else if (category === 'Mystery') {
    list = CATEGORY_MOVIES_MAP['Mystery'] || [];
  } else {
    list = [...HERO_MOVIES, ...RECOMMENDATIONS];
  }

  // If list is empty for any category, use all recommendations
  if (list.length === 0) {
    list = [...HERO_MOVIES, ...RECOMMENDATIONS];
  }

  // Filter if query is provided
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    const filtered = list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genre?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
    if (filtered.length > 0) {
      list = filtered;
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const uniqueItems: MovieItem[] = [];
  for (const m of list) {
    if (!seen.has(m.title.toLowerCase())) {
      seen.add(m.title.toLowerCase());
      uniqueItems.push(movieToMovieItem(m));
    }
  }

  return uniqueItems;
}

// In-Memory Fast Cache
const mediaCache = new Map<string, MovieItem[]>();

/**
 * Robust fetch helper that queries primary (api.tmdb.org) first,
 * with fast failover to fallback (api.themoviedb.org)
 */
async function fetchTMDB(endpoint: string, signal?: AbortSignal): Promise<any> {
  const apiKey = apiKeyManager.getTMDBKey();
  if (!apiKey) return null;

  const sep = endpoint.includes('?') ? '&' : '?';
  const urls = [
    `${TMDB_PRIMARY_BASE}${endpoint}${sep}api_key=${apiKey}`,
    `${TMDB_FALLBACK_BASE}${endpoint}${sep}api_key=${apiKey}`
  ];

  for (const url of urls) {
    if (signal?.aborted) return null;
    try {
      const res = await fetch(url, { signal });
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      // Network/DNS error, try next mirror
    }
  }
  return null;
}

/**
 * Fetch popular movies from TMDB with built-in catalog fallback
 */
export async function getPopularMovies(signal?: AbortSignal): Promise<MovieItem[]> {
  const cacheKey = 'popular_movies';
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB('/movie/popular', signal);
    if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
      const items = data.results.map((r: TMDBRawItem) => normalizeMovieItem(r, 'movie'));
      mediaCache.set(cacheKey, items);
      return items;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] getPopularMovies error, using fallback catalog:', err);
  }

  return getFallbackCatalog('Movies');
}

/**
 * Search movies from TMDB with fallback
 */
export async function searchMovies(query: string, signal?: AbortSignal): Promise<MovieItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return getPopularMovies(signal);

  const cacheKey = `search_movies_${trimmed.toLowerCase()}`;
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(trimmed)}`, signal);
    if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
      const items = data.results.map((r: TMDBRawItem) => normalizeMovieItem(r, 'movie'));
      mediaCache.set(cacheKey, items);
      return items;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] searchMovies error, using fallback catalog:', err);
  }

  return getFallbackCatalog('Movies', trimmed);
}

/**
 * Fetch popular animation titles from TMDB (genre ID 16 = Animation)
 */
export async function getPopularAnimation(signal?: AbortSignal): Promise<MovieItem[]> {
  const cacheKey = 'popular_animation';
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB('/discover/movie?with_genres=16&sort_by=popularity.desc', signal);
    if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
      const items = data.results.map((r: TMDBRawItem) => normalizeMovieItem(r, 'animation'));
      mediaCache.set(cacheKey, items);
      return items;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] getPopularAnimation error, using fallback catalog:', err);
  }

  return getFallbackCatalog('Animation');
}

/**
 * Search animation titles from TMDB (filtered to genre ID 16 = Animation)
 */
export async function searchAnimation(query: string, signal?: AbortSignal): Promise<MovieItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return getPopularAnimation(signal);

  const cacheKey = `search_animation_${trimmed.toLowerCase()}`;
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(trimmed)}`, signal);
    if (data?.results && Array.isArray(data.results)) {
      const animationItems = data.results
        .filter((raw: TMDBRawItem) => raw.genre_ids && raw.genre_ids.includes(16))
        .map((r: TMDBRawItem) => normalizeMovieItem(r, 'animation'));

      if (animationItems.length > 0) {
        mediaCache.set(cacheKey, animationItems);
        return animationItems;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] searchAnimation error, using fallback catalog:', err);
  }

  return getFallbackCatalog('Animation', trimmed);
}

/**
 * Fetch popular TV Series from TMDB
 */
export async function getPopularTVSeries(signal?: AbortSignal): Promise<MovieItem[]> {
  const cacheKey = 'popular_tv_series';
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB('/tv/popular', signal);
    if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
      const items = data.results.map((r: TMDBRawItem) => normalizeMovieItem(r, 'tv'));
      mediaCache.set(cacheKey, items);
      return items;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] getPopularTVSeries error, using fallback catalog:', err);
  }

  return getFallbackCatalog('TV Series');
}

/**
 * Search TV Series from TMDB
 */
export async function searchTVSeries(query: string, signal?: AbortSignal): Promise<MovieItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return getPopularTVSeries(signal);

  const cacheKey = `search_tv_${trimmed.toLowerCase()}`;
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB(`/search/tv?query=${encodeURIComponent(trimmed)}`, signal);
    if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
      const items = data.results.map((r: TMDBRawItem) => normalizeMovieItem(r, 'tv'));
      mediaCache.set(cacheKey, items);
      return items;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] searchTVSeries error, using fallback catalog:', err);
  }

  return getFallbackCatalog('TV Series', trimmed);
}

/**
 * Fetch popular Mystery titles from TMDB (genre ID 9648 = Mystery)
 */
export async function getPopularMystery(signal?: AbortSignal): Promise<MovieItem[]> {
  const cacheKey = 'popular_mystery';
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB('/discover/movie?with_genres=9648&sort_by=popularity.desc', signal);
    if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
      const items = data.results.map((r: TMDBRawItem) => normalizeMovieItem(r, 'movie'));
      mediaCache.set(cacheKey, items);
      return items;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] getPopularMystery error, using fallback catalog:', err);
  }

  return getFallbackCatalog('Mystery');
}

/**
 * Search Mystery titles from TMDB (filtered to genre ID 9648)
 */
export async function searchMystery(query: string, signal?: AbortSignal): Promise<MovieItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return getPopularMystery(signal);

  const cacheKey = `search_mystery_${trimmed.toLowerCase()}`;
  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  try {
    const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(trimmed)}`, signal);
    if (data?.results && Array.isArray(data.results)) {
      const mysteryItems = data.results
        .filter((raw: TMDBRawItem) => raw.genre_ids && raw.genre_ids.includes(9648))
        .map((r: TMDBRawItem) => normalizeMovieItem(r, 'movie'));

      if (mysteryItems.length > 0) {
        mediaCache.set(cacheKey, mysteryItems);
        return mysteryItems;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[mediaService] searchMystery error, using fallback catalog:', err);
  }

  return getFallbackCatalog('Mystery', trimmed);
}

/**
 * Unified category dispatcher: routes to the right media query based on active category
 */
export async function getMediaByCategory(
  category: string = 'Movies',
  query?: string,
  signal?: AbortSignal
): Promise<MovieItem[]> {
  const trimmed = (query || '').trim();
  switch (category) {
    case 'Animation':
      return trimmed ? searchAnimation(trimmed, signal) : getPopularAnimation(signal);
    case 'TV Series':
      return trimmed ? searchTVSeries(trimmed, signal) : getPopularTVSeries(signal);
    case 'Mystery':
      return trimmed ? searchMystery(trimmed, signal) : getPopularMystery(signal);
    case 'Movies':
    default:
      return trimmed ? searchMovies(trimmed, signal) : getPopularMovies(signal);
  }
}

/**
 * Resolves a playable video trailer for a movie or TV item.
 * 1. Checks TMDB /movie/{id}/videos or /tv/{id}/videos for official YouTube trailers/teasers.
 * 2. Checks local presets in HERO_MOVIES & RECOMMENDATIONS for known titles.
 * 3. Searches YouTube Data API strictly with type=video.
 * 4. Falls back to a reliable cinematic trailer video ID.
 */
export async function resolveMovieTrailer(movie: {
  id?: number | string;
  tmdbId?: number;
  title?: string;
  category?: string;
  mediaType?: string;
  isTv?: boolean;
}): Promise<string | null> {
  const rawId = movie.tmdbId || (typeof movie.id === 'number' ? movie.id : parseInt(String(movie.id).replace(/\D/g, ''), 10));
  const isTv = movie.isTv || movie.category === 'TV Series' || movie.mediaType === 'tv';

  // 1. Try TMDB /videos endpoint (tries movie endpoint first, then tv endpoint if needed)
  if (rawId && !isNaN(rawId)) {
    try {
      const endpoints = isTv
        ? [`/tv/${rawId}/videos`, `/movie/${rawId}/videos`]
        : [`/movie/${rawId}/videos`, `/tv/${rawId}/videos`];

      for (const ep of endpoints) {
        const data = await fetchTMDB(ep);
        if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
          const ytVideos = data.results.filter(
            (v: any) => v.site === 'YouTube' && v.key && typeof v.key === 'string'
          );

          if (ytVideos.length > 0) {
            // Priority order: Official Trailer > Any Trailer > Teaser > Clip > Any
            const officialTrailer = ytVideos.find((v: any) => v.official && v.type === 'Trailer');
            if (officialTrailer) return officialTrailer.key;

            const anyTrailer = ytVideos.find((v: any) => v.type === 'Trailer');
            if (anyTrailer) return anyTrailer.key;

            const teaser = ytVideos.find((v: any) => v.type === 'Teaser');
            if (teaser) return teaser.key;

            return ytVideos[0].key;
          }
        }
      }
    } catch (err) {
      console.warn('[mediaService] TMDB videos fetch error:', err);
    }
  }

  // 2. Check local catalog preset trailers
  if (movie.title) {
    const cleanSearchTitle = movie.title.toLowerCase().trim();
    const preset = [...HERO_MOVIES, ...RECOMMENDATIONS].find(
      (m) => m.title.toLowerCase().trim() === cleanSearchTitle || cleanSearchTitle.includes(m.title.toLowerCase().trim())
    );
    if (preset?.videoId) {
      return preset.videoId;
    }
  }

  // 3. YouTube Search API with strict type=video
  const ytKey = apiKeyManager.getYouTubeKey();
  if (ytKey && movie.title) {
    try {
      const query = `${movie.title} official trailer`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(
        query
      )}&key=${ytKey}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          if (item?.id?.kind === 'youtube#video' && item?.id?.videoId) {
            return item.id.videoId;
          }
        }
      }
    } catch (err) {
      console.warn('[mediaService] YouTube search error:', err);
    }
  }

  // 4. Default high-quality cinematic trailer fallback
  return 'cqGjhVJWtEg';
}
