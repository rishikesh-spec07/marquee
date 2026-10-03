// Resilient Music Search, All-Time Charts & Metadata Service (musicService.ts)
import type { Song } from '../types';
import { SONGS_CATALOG } from '../data/songsData';

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

export const FALLBACK_SONGS_CATALOG: Song[] = SONGS_CATALOG;

function getGenreTheme(genre: string = 'Pop'): { gradient: string; color: string } {
  const g = genre.toLowerCase();
  if (g.includes('bollywood') || g.includes('hindi') || g.includes('indian')) {
    return {
      gradient: 'radial-gradient(circle at 50% 40%, #d97706 0%, #78350f 60%, #09090b 100%)',
      color: '#f59e0b'
    };
  }
  if (g.includes('rock') || g.includes('metal')) {
    return {
      gradient: 'radial-gradient(circle at 50% 40%, #dc2626 0%, #450a0a 60%, #09090b 100%)',
      color: '#ef4444'
    };
  }
  if (g.includes('hip') || g.includes('rap')) {
    return {
      gradient: 'radial-gradient(circle at 50% 40%, #2563eb 0%, #1e3a8a 60%, #09090b 100%)',
      color: '#3b82f6'
    };
  }
  if (g.includes('r&b') || g.includes('soul')) {
    return {
      gradient: 'radial-gradient(circle at 50% 40%, #db2777 0%, #831843 60%, #09090b 100%)',
      color: '#ec4899'
    };
  }
  if (g.includes('dance') || g.includes('electronic') || g.includes('edm')) {
    return {
      gradient: 'radial-gradient(circle at 50% 40%, #06b6d4 0%, #083344 60%, #09090b 100%)',
      color: '#06b6d4'
    };
  }
  return {
    gradient: 'radial-gradient(circle at 50% 40%, #4338ca 0%, #1e1b4b 60%, #09090b 100%)',
    color: '#6366f1'
  };
}

let cachedAllTimeSongs: Song[] = [];
let lastSearchRequestId = 0;

export function getTrackFallbackArtwork(title: string = 'Track', artist: string = 'Artist'): string {
  const seed = `${title} - ${artist}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 45) % 360;
  const initials = `${(title || 'T').trim().charAt(0)}${(artist || 'A').trim().charAt(0)}`.toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 75%, 45%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 85%, 20%)" />
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#bg)" />
    <circle cx="300" cy="300" r="160" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>
    <text x="300" y="325" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="76" font-weight="900" text-anchor="middle" letter-spacing="4">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Parses iTunes RSS Top Songs JSON entry into canonical Song object.
 */
function parseRssEntryToSong(entry: any): Song | null {
  try {
    const rawId = entry?.id?.attributes?.['im:id'] || entry?.id?.label;
    const titleRaw = entry?.['im:name']?.label || entry?.title?.label || '';
    const artistRaw = entry?.['im:artist']?.label || '';
    if (!titleRaw) return null;

    const providerTrackId = String(rawId || Math.abs(titleRaw.length * 999));
    const canonicalId = `itunes:${providerTrackId}`;

    const images = entry?.['im:image'];
    let coverUrl = '';
    if (Array.isArray(images) && images.length > 0) {
      const highestImg = images[images.length - 1]?.label;
      if (highestImg) {
        coverUrl = highestImg.replace(/\/\d+x\d+bb\./, '/600x600bb.');
      }
    }
    if (!coverUrl) {
      coverUrl = getTrackFallbackArtwork(titleRaw, artistRaw);
    }

    const links = entry?.link;
    let previewAudio = '';
    if (Array.isArray(links)) {
      const audioLink = links.find((l: any) => l.attributes?.['im:assetType'] === 'preview' || l.attributes?.rel === 'enclosure');
      if (audioLink?.attributes?.href) previewAudio = audioLink.attributes.href;
    } else if (links?.attributes?.href) {
      previewAudio = links.attributes.href;
    }

    const album = entry?.['im:collection']?.['im:name']?.label || 'Single';
    const genre = entry?.category?.attributes?.label || 'Pop';
    const theme = getGenreTheme(genre);

    return {
      id: canonicalId,
      canonicalTrackId: canonicalId,
      providerTrackId,
      provider: 'itunes',
      title: decodeHtmlEntities(titleRaw),
      artist: decodeHtmlEntities(artistRaw),
      album: decodeHtmlEntities(album),
      albumArt: coverUrl,
      audioUrl: previewAudio,
      sourceType: 'direct',
      playbackType: 'full',
      duration: 0,
      isPlayable: true,
      themeGradient: theme.gradient,
      themeColor: theme.color,
      genre
    };
  } catch (e) {
    return null;
  }
}

/**
 * Fetches all-time & top charts songs across global & Indian feeds.
 */
export async function fetchAllTimeSongs(): Promise<Song[]> {
  if (cachedAllTimeSongs.length > 0) {
    return cachedAllTimeSongs;
  }

  const results: Song[] = [];
  const existingIds = new Set<string>();

  // Add baseline catalog first to ensure immediate playback availability
  for (const song of FALLBACK_SONGS_CATALOG) {
    results.push(song);
    existingIds.add(song.canonicalTrackId || song.id);
  }

  const feedUrls = [
    'https://itunes.apple.com/us/rss/topsongs/limit=50/json',
    'https://itunes.apple.com/in/rss/topsongs/limit=50/json'
  ];

  try {
    const fetchPromises = feedUrls.map(async (url) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const entries = data?.feed?.entry;
          if (Array.isArray(entries)) {
            return entries.map(parseRssEntryToSong).filter((s): s is Song => Boolean(s));
          }
        }
      } catch (err) {
        console.warn(`[AllTime API] Feed notice for ${url}:`, err);
      } finally {
        clearTimeout(timeout);
      }
      return [];
    });

    const feedResults = await Promise.all(fetchPromises);
    for (const songs of feedResults) {
      for (const s of songs) {
        const key = `${s.title.toLowerCase()} - ${s.artist.toLowerCase()}`;
        if (!existingIds.has(s.id) && !existingIds.has(key)) {
          results.push(s);
          existingIds.add(s.id);
          existingIds.add(key);
        }
      }
    }
  } catch (e) {
    console.warn('[AllTime API] Notice fetching top songs:', e);
  }

  if (results.length > 0) {
    cachedAllTimeSongs = results;
  }

  return results.length > 0 ? results : FALLBACK_SONGS_CATALOG;
}

/**
 * Fetch dedicated category / genre songs (e.g. Punjabi, Tamil, Rock, Hip-Hop, K-Pop, Dance, etc.)
 */
export async function fetchCategorySongs(category: string, limit: number = 24): Promise<Song[]> {
  const cleanCat = (category || '').trim();
  if (!cleanCat || cleanCat.toLowerCase() === 'charts' || cleanCat.toLowerCase() === 'top') {
    return fetchAllTimeSongs();
  }

  // Keyword mapping for rich queries
  let searchTerm = cleanCat;
  if (cleanCat.toLowerCase() === 'bollywood') searchTerm = 'Bollywood Hindi Hits';
  else if (cleanCat.toLowerCase() === 'pop') searchTerm = 'Top Pop Hits';
  else if (cleanCat.toLowerCase() === 'punjabi') searchTerm = 'Punjabi Hits Diljit';
  else if (cleanCat.toLowerCase() === 'tamil') searchTerm = 'Tamil Top Hits Anirudh';
  else if (cleanCat.toLowerCase() === 'telugu') searchTerm = 'Telugu Superhits';
  else if (cleanCat.toLowerCase() === 'hip-hop/rap' || cleanCat.toLowerCase() === 'hip-hop') searchTerm = 'Hip Hop Rap Hits';
  else if (cleanCat.toLowerCase() === 'k-pop') searchTerm = 'K-Pop Top Hits BTS Blackpink';
  else if (cleanCat.toLowerCase() === 'dance') searchTerm = 'EDM Dance Club Hits';
  else if (cleanCat.toLowerCase() === 'love') searchTerm = 'Romantic Love Songs';
  else if (cleanCat.toLowerCase() === 'heartbreak') searchTerm = 'Sad Songs Heartbreak';

  return searchTracks(searchTerm, limit);
}

const searchCache = new Map<string, Song[]>();

/**
 * Searches tracks via iTunes API to return exact song metadata and full-length audio stream.
 */
export async function searchTracks(query: string = '', limit: number = 24, externalSignal?: AbortSignal): Promise<Song[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.toLowerCase() === 'all time' || cleanQuery.toLowerCase() === 'alltime' || cleanQuery.toLowerCase() === 'all songs' || cleanQuery.toLowerCase() === 'top' || cleanQuery.toLowerCase() === 'charts') {
    return fetchAllTimeSongs();
  }

  const cacheKey = `${cleanQuery.toLowerCase()}_${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeout);
      return [];
    }
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=${limit}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {

        const searchSongs: Song[] = data.results
          .filter((item: any) => item.trackName)
          .map((item: any): Song => {
            const providerTrackId = String(item.trackId);
            const canonicalId = `itunes:${providerTrackId}`;
            const coverUrl = item.artworkUrl100
              ? item.artworkUrl100.replace('100x100bb', '600x600bb')
              : getTrackFallbackArtwork(item.trackName, item.artistName);

            const authenticDuration = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 210;
            const genre = item.primaryGenreName || 'Pop';
            const theme = getGenreTheme(genre);

            return {
              id: canonicalId,
              canonicalTrackId: canonicalId,
              providerTrackId,
              provider: 'itunes',
              title: decodeHtmlEntities(item.trackName),
              artist: decodeHtmlEntities(item.artistName),
              album: item.collectionName ? decodeHtmlEntities(item.collectionName) : 'Single',
              albumArt: coverUrl,
              audioUrl: item.previewUrl,
              sourceType: 'direct',
              playbackType: 'full',
              duration: authenticDuration || 0,
              trackTimeMillis: item.trackTimeMillis,
              isPlayable: true,
              themeGradient: theme.gradient,
              themeColor: theme.color,
              genre
            };
          });

        if (searchSongs.length > 0) {
          searchCache.set(cacheKey, searchSongs);
          return searchSongs;
        }
      }
    }
  } catch (iTunesErr) {
    console.warn('[Search] iTunes search notice:', iTunesErr);
  } finally {
    clearTimeout(timeout);
  }

  const localMatches = FALLBACK_SONGS_CATALOG.filter(
    (s) =>
      s.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      s.album.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      (s.genre && s.genre.toLowerCase().includes(cleanQuery.toLowerCase()))
  );

  return localMatches.length > 0 ? localMatches : FALLBACK_SONGS_CATALOG;
}

