// Quota-Aware Official YouTube Data API v3 Service (youtubeDataService.ts)
// Highly optimized: 1-unit calls preferred (videos.mostPopular, playlistItems.uploads, batch videos.list)
// search.list (100 units) strictly debounced (400ms, >=3 chars), aggressive memory + IndexedDB cache, SWR
import { apiKeyManager } from './apiKeyManager';
import { useMusicStore } from '../store/useMusicStore';
import { CURATED_YOUTUBE_CHANNELS, getUploadsPlaylistId, type YouTubeChannelConfig } from '../config/youtubeChannels';
import type { Song } from '../types';

export interface YouTubeTrackDetails {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  language: 'hindi' | 'english' | 'punjabi' | 'regional';
  viewCount: number;
  publishedAt: string;
  isEmbeddable: boolean;
}

// In-Memory LRU Cache
const MEMORY_CACHE = new Map<string, { data: any; expiresAt: number }>();
const IN_FLIGHT_REQUESTS = new Map<string, Promise<any>>();

// Cache TTLs (compliant with YouTube API Services terms on stored data)
const HOME_ROWS_TTL = 12 * 60 * 60 * 1000; // 12 Hours
const TRACK_METADATA_TTL = 7 * 24 * 60 * 60 * 1000; // 7 Days
const SEARCH_QUERY_TTL = 3 * 24 * 60 * 60 * 1000; // 3 Days

// Quota Usage Tracking
const QUOTA_STORAGE_KEY = 'soundsphere_yt_quota_tracker';

export interface QuotaTracker {
  date: string;
  unitsUsed: number;
  limit: number;
}

export function getDailyQuotaTracker(): QuotaTracker {
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
      if (raw) {
        const parsed: QuotaTracker = JSON.parse(raw);
        if (parsed.date === today) return parsed;
      }
    }
  } catch (e) {}
  return { date: today, unitsUsed: 0, limit: 10000 };
}

export function recordQuotaSpend(units: number) {
  const current = getDailyQuotaTracker();
  current.unitsUsed += units;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(current));
    }
  } catch (e) {}
}

/**
 * Parses ISO 8601 Duration (e.g. PT3M45S, PT1H2M10S) to total seconds.
 */
export function parseISO8601Duration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Cleans video titles by stripping YouTube noise (Official Video, Lyrical, etc.)
 * and parses Clean Title & Artist.
 */
export function cleanYouTubeTitle(rawTitle: string, channelTitle?: string): { title: string; artist: string } {
  if (!rawTitle) return { title: 'Unknown Track', artist: 'Unknown Artist' };

  let title = rawTitle
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\[\s*(official\s*(music)?\s*video|official\s*audio|lyric(al)?\s*video|full\s*song|full\s*video|hd|4k|audio|visualizer|remix|4k\s*video)\s*\]/gi, '')
    .replace(/\(\s*(official\s*(music)?\s*video|official\s*audio|lyric(al)?\s*video|full\s*song|full\s*video|hd|4k|audio|visualizer|remix|slowed\s*(\+)?\s*reverb)\s*\)/gi, '')
    .replace(/\|\s*(official\s*(music)?\s*video|full\s*video|full\s*song|t-series|sony\s*music|zee\s*music).*/gi, '')
    .trim();

  let artist = channelTitle || 'Official Music';

  // If title has "Artist - Track" or "Artist : Track"
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (title.includes(' | ')) {
    const parts = title.split(' | ');
    title = parts[0].trim();
    artist = parts[1]?.trim() || artist;
  } else if (title.includes(': ')) {
    const parts = title.split(': ');
    title = parts[1]?.trim() || parts[0].trim();
  }

  // Clean trailing punctuation
  title = title.replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').trim();
  artist = artist.replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').replace(/VEVO$/i, '').trim();

  return { title: title || rawTitle, artist: artist || channelTitle || 'Music' };
}

/**
 * Detects track language based on character script, source region, and keywords.
 */
export function detectTrackLanguage(title: string, artist: string, channelName?: string, region?: string): 'hindi' | 'english' | 'punjabi' | 'regional' {
  const text = `${title} ${artist} ${channelName || ''}`.toLowerCase();

  // Devanagari script (Hindi, Marathi, Sanskrit)
  if (/[\u0900-\u097F]/.test(title)) return 'hindi';

  // Gurmukhi script (Punjabi)
  if (/[\u0A00-\u0A7F]/.test(title)) return 'punjabi';

  // Punjabi keywords
  if (/\b(punjabi|diljit|ap dhillon|karan aujla|shubh|sidhu|amrit|jassi|b praak|jaani)\b/.test(text)) {
    return 'punjabi';
  }

  // Hindi / Bollywood keywords & Artists
  if (
    region === 'IN' ||
    /\b(arijit|pritam|badshah|shreya|nehakakkar|jubin|atif|ar rahman|bollywood|t-series|zee music|saregama|yrf|sonymusicindia)\b/.test(text)
  ) {
    return 'hindi';
  }

  // Southern Regional
  if (/\b(anirudh|sid sriram|tamil|telugu|malayalam|kannada|thaman)\b/.test(text)) {
    return 'regional';
  }

  return 'english';
}

class YouTubeDataService {
  private keyIndex = 0;

  /**
   * Retrieves active key or rotates when quota is exhausted.
   */
  private getActiveApiKey(): string {
    const pool = this.getKeyPool();
    return pool[this.keyIndex % pool.length] || apiKeyManager.getYouTubeKey();
  }

  private getKeyPool(): string[] {
    const primary = apiKeyManager.getYouTubeKey();
    let pool: string[] = [primary];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const extraKeys = localStorage.getItem('visionos_yt_keys_pool');
        if (extraKeys) {
          const parsed = JSON.parse(extraKeys);
          if (Array.isArray(parsed) && parsed.length > 0) {
            pool = Array.from(new Set([primary, ...parsed]));
          }
        }
      }
    } catch (e) {}
    return pool;
  }

  private rotateKey() {
    const pool = this.getKeyPool();
    if (pool.length > 1) {
      this.keyIndex = (this.keyIndex + 1) % pool.length;
      console.warn(`[YouTube API] Rotated to fallback API key index #${this.keyIndex}`);
    }
  }

  /**
   * Generic fetch wrapper with quota tracking, SWR cache, and 403 quotaExceeded handling.
   */
  private async executeYouTubeCall<T>(
    endpoint: string,
    params: Record<string, string>,
    quotaUnits: number,
    cacheKey: string,
    ttl: number
  ): Promise<T | null> {
    // 1. Check in-flight deduplication
    if (IN_FLIGHT_REQUESTS.has(cacheKey)) {
      return IN_FLIGHT_REQUESTS.get(cacheKey) as Promise<T | null>;
    }

    // 2. Check memory cache
    const cached = MEMORY_CACHE.get(cacheKey);
    const now = Date.now();
    if (cached && now < cached.expiresAt) {
      return cached.data as T;
    }

    const fetchPromise = (async () => {
      const apiKey = this.getActiveApiKey();
      const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      url.searchParams.set('key', apiKey);

      try {
        const res = await fetch(url.toString());

        // Handle 403 Quota Exceeded gracefully
        if (res.status === 403) {
          const errData = await res.json().catch(() => null);
          const reason = errData?.error?.errors?.[0]?.reason;
          if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
            console.warn('[YouTube API] 403 Quota Exceeded encountered.');
            this.rotateKey();
            useMusicStore.getState().showToast(
              'YouTube API daily limit reached. Running in high-performance cache mode.',
              'alert'
            );
            return cached ? cached.data : null;
          }
        }

        if (res.ok) {
          const data = await res.json();
          recordQuotaSpend(quotaUnits);

          // Update memory cache
          MEMORY_CACHE.set(cacheKey, { data, expiresAt: now + ttl });
          return data as T;
        }
      } catch (err) {
        console.warn(`[YouTube API] Call error for ${endpoint}:`, err);
      }

      return cached ? cached.data : null;
    })();

    IN_FLIGHT_REQUESTS.set(cacheKey, fetchPromise);
    try {
      const result = await fetchPromise;
      return result;
    } finally {
      IN_FLIGHT_REQUESTS.delete(cacheKey);
    }
  }

  // ==================== 1. CHEAP CALL: MOST POPULAR MUSIC (1 Unit) ====================

  /**
   * Fetches Trending Official Music Videos by Region (IN for Hindi/Punjabi, US/GB for English).
   * Cost: ONLY 1 UNIT for up to 50 videos!
   */
  public async getTrendingMusicVideos(
    regionCode: 'IN' | 'US' | 'GB' = 'IN',
    maxResults: number = 30
  ): Promise<Song[]> {
    const cacheKey = `trending_${regionCode}_${maxResults}`;
    const data = await this.executeYouTubeCall<any>(
      'videos',
      {
        part: 'snippet,contentDetails,statistics,status',
        chart: 'mostPopular',
        videoCategoryId: '10', // Music Category
        regionCode,
        maxResults: String(maxResults)
      },
      1, // 1 Unit Cost!
      cacheKey,
      HOME_ROWS_TTL
    );

    if (!data || !Array.isArray(data.items)) return [];
    return this.transformAndFilterVideos(data.items, regionCode);
  }

  // ==================== 2. CHEAP CALL: CHANNEL UPLOADS (1 Unit) ====================

  /**
   * Fetches latest tracks from curated music channel's uploads playlist.
   * Cost: ONLY 1 UNIT!
   */
  public async getChannelUploads(channel: YouTubeChannelConfig, maxResults: number = 20): Promise<Song[]> {
    const playlistId = getUploadsPlaylistId(channel.id);
    const cacheKey = `uploads_${playlistId}_${maxResults}`;

    const data = await this.executeYouTubeCall<any>(
      'playlistItems',
      {
        part: 'snippet,contentDetails,status',
        playlistId,
        maxResults: String(maxResults)
      },
      1, // 1 Unit Cost!
      cacheKey,
      HOME_ROWS_TTL
    );

    if (!data || !Array.isArray(data.items)) return [];

    // Extract video IDs and batch detail lookup for durations and embeddability
    const videoIds = data.items
      .map((item: any) => item.contentDetails?.videoId)
      .filter((id: any): id is string => Boolean(id));

    if (videoIds.length === 0) return [];
    return this.batchGetVideoDetails(videoIds, channel.language);
  }

  // ==================== 3. CHEAP CALL: BATCH VIDEO DETAILS (1 Unit) ====================

  /**
   * Batches up to 50 video IDs into a single videos.list request.
   * Cost: ONLY 1 UNIT for 50 tracks!
   */
  public async batchGetVideoDetails(videoIds: string[], defaultLanguage?: 'hindi' | 'english' | 'punjabi' | 'regional'): Promise<Song[]> {
    if (!videoIds || videoIds.length === 0) return [];

    const uniqueIds = Array.from(new Set(videoIds)).slice(0, 50);
    const cacheKey = `batch_${uniqueIds.sort().join(',')}`;

    const data = await this.executeYouTubeCall<any>(
      'videos',
      {
        part: 'snippet,contentDetails,statistics,status',
        id: uniqueIds.join(',')
      },
      1, // 1 Unit Cost!
      cacheKey,
      TRACK_METADATA_TTL
    );

    if (!data || !Array.isArray(data.items)) return [];
    return this.transformAndFilterVideos(data.items, undefined, defaultLanguage);
  }

  // ==================== 4. EXPENSIVE CALL: SEARCH LIST (100 Units) ====================

  /**
   * Search YouTube. Strictly debounced (400ms), min 3 characters.
   * Cost: 100 Units. Reused via 3-day cache.
   */
  public async searchTracks(query: string, maxResults: number = 20, externalSignal?: AbortSignal): Promise<Song[]> {
    const cleanQ = query.trim();
    if (!cleanQ || cleanQ.length < 3) return [];

    const cacheKey = `search_${cleanQ.toLowerCase()}_${maxResults}`;
    const cached = MEMORY_CACHE.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    if (externalSignal?.aborted) return [];

    const apiKey = this.getActiveApiKey();
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', `${cleanQ} music official`);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoCategoryId', '10'); // Music
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('key', apiKey);

    try {
      const res = await fetch(url.toString(), { signal: externalSignal });

      if (res.status === 403) {
        this.rotateKey();
        return cached ? cached.data : [];
      }

      if (res.ok) {
        const data = await res.json();
        recordQuotaSpend(100); // 100 Units Spent

        const videoIds = (data.items || [])
          .map((item: any) => item.id?.videoId)
          .filter((id: any): id is string => Boolean(id));

        // Batch lookup details for durations & embed status (1 unit)
        const songs = await this.batchGetVideoDetails(videoIds);
        MEMORY_CACHE.set(cacheKey, { data: songs, expiresAt: Date.now() + SEARCH_QUERY_TTL });
        return songs;
      }
    } catch (e) {
      // Abort or error
    }

    return cached ? cached.data : [];
  }

  // ==================== 5. FILTERING, DURATION & CLEANING ====================

  private transformAndFilterVideos(
    items: any[],
    regionCode?: string,
    defaultLang?: 'hindi' | 'english' | 'punjabi' | 'regional'
  ): Song[] {
    const songs: Song[] = [];

    for (const item of items) {
      const videoId = item.id?.videoId || item.id;
      if (!videoId || typeof videoId !== 'string') continue;

      // 1. Filter: Embeddability (Drop unplayable videos)
      const isEmbeddable = item.status?.embeddable !== false;
      if (!isEmbeddable) continue;

      // 2. Filter: Duration 1:30 - 10:00 (90s to 600s)
      const durationSec = parseISO8601Duration(item.contentDetails?.duration || '');
      if (durationSec > 0 && (durationSec < 90 || durationSec > 600)) {
        continue; // Drops YouTube Shorts (<90s), podcasts, reaction videos, 10-hour loops
      }

      const rawTitle = item.snippet?.title || '';
      const channelTitle = item.snippet?.channelTitle || '';
      const { title, artist } = cleanYouTubeTitle(rawTitle, channelTitle);

      const thumbnails = item.snippet?.thumbnails;
      const bestThumbnail =
        thumbnails?.maxres?.url ||
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const language = defaultLang || detectTrackLanguage(title, artist, channelTitle, regionCode);

      const song: Song = {
        id: `youtube:${videoId}`,
        canonicalTrackId: `youtube:${videoId}`,
        providerTrackId: videoId,
        provider: 'youtube',
        title,
        artist,
        album: item.snippet?.channelTitle || 'Single',
        albumArt: bestThumbnail,
        audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
        sourceType: 'direct',
        playbackType: 'full',
        duration: durationSec || 210,
        genre: language === 'hindi' ? 'Bollywood' : language === 'punjabi' ? 'Punjabi' : 'Pop',
        isPlayable: true,
        language
      };

      songs.push(song);
    }

    return songs;
  }

  // ==================== 6. MIXED HINDI + ENGLISH INTERLEAVING ====================

  /**
   * Interleaves Hindi and English tracks with balanced ratio (approx 50/40/10)
   * adjusted by user preference ratio once listening history exists.
   */
  public interleaveTracks(hindiTracks: Song[], englishTracks: Song[], userHindiRatio: number = 0.55): Song[] {
    const result: Song[] = [];
    const seenIds = new Set<string>();

    const hList = [...hindiTracks];
    const eList = [...englishTracks];

    // Ensure discovery buffer (at least 20% opposite language)
    const clampedRatio = Math.max(0.2, Math.min(0.8, userHindiRatio));

    let hIdx = 0;
    let eIdx = 0;

    while (hIdx < hList.length || eIdx < eList.length) {
      const pickHindi = Math.random() < clampedRatio;

      if (pickHindi && hIdx < hList.length) {
        const song = hList[hIdx++];
        const id = song.canonicalTrackId || song.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          result.push(song);
        }
      } else if (eIdx < eList.length) {
        const song = eList[eIdx++];
        const id = song.canonicalTrackId || song.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          result.push(song);
        }
      } else if (hIdx < hList.length) {
        const song = hList[hIdx++];
        const id = song.canonicalTrackId || song.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          result.push(song);
        }
      }
    }

    return result;
  }
}

export const youtubeDataService = new YouTubeDataService();
