import type { Song, LyricLine } from '../types';
import { lyricsStorage } from './lyricsStorage';

export interface TrackLyrics {
  canonicalTrackId: string;
  type: 'synced' | 'plain';
  lines: LyricLine[];
  duration?: number;
  isVersionMismatch?: boolean;
}

export interface ParsedLyrics {
  type: 'synced' | 'plain';
  lines: LyricLine[];
  firstLineTime?: number;
}

/**
 * Extracts first artist from composite string (e.g. "Arijit Singh & Shreya Ghoshal" -> "Arijit Singh")
 */
export function extractFirstArtist(artist: string): string {
  if (!artist) return '';
  const parts = artist.split(/\s*(?:&|,|\band\b|\bfeat\.?\b|\bft\.?\b|\bwith\b|\/)\s*/i);
  return (parts[0] || '').replace(/- Topic$/i, '').replace(/VEVO$/i, '').trim();
}

/**
 * Replaces '&' and 'and' with comma for multi-artist strings
 */
export function formatCommaArtist(artist: string): string {
  if (!artist) return '';
  return artist
    .replace(/\s*&\s*/g, ', ')
    .replace(/\s+and\s+/gi, ', ')
    .replace(/\s+feat\.?\s+/gi, ', ')
    .replace(/\s+ft\.?\s+/gi, ', ')
    .replace(/- Topic$/gi, '')
    .replace(/VEVO$/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Robust title cleaner for YouTube music tracks (Hindi, English, Regional).
 * Strips bracketed/parenthesized suffixes:
 * "From ...", "Official", "Lyrical", "Video", "Audio", "Remix", "feat./ft."
 * Retains original title variant and handles bilingual titles.
 */
export function sanitizeMusicMetadata(rawTitle: string, rawArtist: string): {
  cleanTitle: string;
  firstArtist: string;
  commaArtist: string;
  titleVariants: string[];
} {
  let title = rawTitle || '';
  let artist = rawArtist || '';

  // Extract from "Artist - Title" format if artist is missing or generic
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    if (!artist || artist === 'Artist' || artist.includes('Topic') || artist.includes('VEVO')) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }

  // Strip pipe separators like "Song Title | Movie Name | Singer"
  let primaryTitle = title;
  if (title.includes('|')) {
    primaryTitle = title.split('|')[0].trim();
  }

  // Strip bracketed/parenthesized suffixes including From, Official, Lyrical, Video, Audio, Remix
  const cleaned = primaryTitle
    .replace(/\s*[\(\[](?:from|From)\s+["']?.*?["']?[\)\]]/gi, '')
    .replace(/\s*[\(\[](?:official|Official)\s*(?:video|audio|music video|lyric video|lyrics|4k|hd|visualizer)?[\)\]]/gi, '')
    .replace(/\s*[\(\[](?:lyric\s*video|lyrics|audio|video|visualizer)[\)\]]/gi, '')
    .replace(/\s*[\(\[](?:full\s*(?:video|song|audio)?)[\)\]]/gi, '')
    .replace(/\s*[\(\[](?:feat\.?|ft\.?).*?[\)\]]/gi, '')
    .replace(/\s*[\(\[](?:with\s+.*?)[\)\]]/gi, '')
    .replace(/\b(?:4K|HD|1080p|60fps|Remastered|Official)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const variants: string[] = [cleaned];

  // Keep original title as fallback variant
  if (rawTitle && rawTitle !== cleaned && !variants.includes(rawTitle)) {
    variants.push(rawTitle);
  }

  // Bilingual titles (e.g. "रात भर / Raat Bhar" or "Raat Bhar : Heropanti")
  if (cleaned.includes('/')) {
    cleaned.split('/').forEach((part) => {
      const p = part.trim();
      if (p.length > 2 && !variants.includes(p)) variants.push(p);
    });
  }
  if (cleaned.includes(':')) {
    const p = cleaned.split(':')[0].trim();
    if (p.length > 2 && !variants.includes(p)) variants.push(p);
  }

  return {
    cleanTitle: cleaned || rawTitle,
    firstArtist: extractFirstArtist(artist) || artist,
    commaArtist: formatCommaArtist(artist) || artist,
    titleVariants: variants
  };
}

/**
 * Universal Specification-Compliant LRC Parser.
 * Accurately parses standard LRC timestamps [mm:ss.xx] into seconds.
 * Preserves instrumental interludes without fabricating filler text.
 */
export function parseLrcLyrics(lrcText: string): ParsedLyrics {
  if (!lrcText || typeof lrcText !== 'string') {
    return { type: 'plain', lines: [] };
  }

  const rawLines = lrcText.split(/\r?\n/);
  const timedLines: LyricLine[] = [];
  const untimedLines: string[] = [];

  const timestampRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const metadataRegex = /^\s*\[(ar|ti|al|by|re|offset|length|tool|ve|hash|encoded_by):.*\]\s*$/i;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line || metadataRegex.test(line)) continue;

    const matches = Array.from(line.matchAll(timestampRegex));

    if (matches.length > 0) {
      const text = line.replace(timestampRegex, '').trim();

      for (const m of matches) {
        const mins = parseInt(m[1], 10);
        const secs = parseInt(m[2], 10);
        let fraction = 0;
        if (m[3]) {
          fraction = parseFloat(`0.${m[3]}`);
          if (isNaN(fraction)) fraction = 0;
        }

        const totalSeconds = Number((mins * 60 + secs + fraction).toFixed(3));
        timedLines.push({
          time: totalSeconds,
          text: text || '♪'
        });
      }
    } else {
      const clean = line.replace(/^\[[^\]]*\]$/, '').trim();
      if (clean.length > 0) {
        untimedLines.push(clean);
      }
    }
  }

  if (timedLines.length > 0) {
    timedLines.sort((a, b) => a.time - b.time);
    return {
      type: 'synced',
      lines: timedLines,
      firstLineTime: timedLines[0]?.time || 0
    };
  }

  if (untimedLines.length > 0) {
    return {
      type: 'plain',
      lines: untimedLines.map((text, idx) => ({
        time: idx,
        text
      }))
    };
  }

  return { type: 'plain', lines: [] };
}

let activeLyricsRequestId = 0;
let activeAbortController: AbortController | null = null;

export function cancelLyricsFetch() {
  activeLyricsRequestId++;
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

/**
 * Fetch LRCLIB synced or plain lyrics for a track object.
 * Robust lookup chain:
 * 1. Clean title: remove suffixes, keep original variant.
 * 2. Clean artist: first artist only ("Arijit Singh"), full string with commas.
 * 3. GET /api/get with track_name, artist_name, album_name, duration.
 * 4. Fallback: GET /api/search?q=<title artist> and ?track_name=<title>, match duration within ±10s.
 * 5. Prefer syncedLyrics; otherwise plainLyrics; otherwise null.
 * 6. TTL: 7 days for found lyrics, 1 hour max for not-found entries.
 */
export async function fetchLyricsForTrack(track: Song, forceRefresh = false): Promise<TrackLyrics | null> {
  if (!track || !track.title) return null;

  const requestId = ++activeLyricsRequestId;
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  const controller = new AbortController();
  activeAbortController = controller;

  const trackId = track.canonicalTrackId || track.id;
  const targetDuration = track.duration || 0;

  // 1. Check IndexedDB cache first if not forced refresh
  if (!forceRefresh) {
    const cached = await lyricsStorage.getCachedLyrics(trackId);
    if (cached) {
      if (cached.lines && cached.lines.length > 0) {
        return cached;
      }
      // Cached negative result (empty) within 1 hour -> return null
      return null;
    }
  } else {
    await lyricsStorage.deleteCachedLyrics(trackId);
  }

  // 2. Embedded track lyrics check
  if (track.lyrics) {
    if (Array.isArray(track.lyrics) && track.lyrics.length > 0) {
      const result: TrackLyrics = { canonicalTrackId: trackId, type: 'synced', lines: track.lyrics };
      lyricsStorage.saveCachedLyrics(trackId, result);
      return result;
    }
    if (
      typeof track.lyrics === 'object' &&
      !Array.isArray(track.lyrics) &&
      Array.isArray(track.lyrics.lines) &&
      track.lyrics.lines.length > 0
    ) {
      const result: TrackLyrics = {
        canonicalTrackId: trackId,
        type: track.lyrics.type || 'synced',
        lines: track.lyrics.lines
      };
      lyricsStorage.saveCachedLyrics(trackId, result);
      return result;
    }
  }

  const { cleanTitle, firstArtist, commaArtist, titleVariants } = sanitizeMusicMetadata(track.title, track.artist);

  // Helper to process LRCLIB item
  const processLrcItem = (item: any): TrackLyrics | null => {
    if (!item) return null;
    const itemDuration = item.duration || 0;
    const durationDiff = targetDuration > 0 && itemDuration > 0 ? Math.abs(targetDuration - itemDuration) : 0;
    const isDurationMismatch = targetDuration > 0 && itemDuration > 0 && durationDiff > 8;

    if (item.syncedLyrics) {
      const parsed = parseLrcLyrics(item.syncedLyrics);
      if (parsed.lines.length > 0) {
        const firstLineDelay = parsed.firstLineTime || 0;
        const isIntroMismatch = firstLineDelay > 20;

        return {
          canonicalTrackId: trackId,
          type: 'synced',
          lines: parsed.lines,
          duration: itemDuration,
          isVersionMismatch: isDurationMismatch || isIntroMismatch
        };
      }
    }

    if (item.plainLyrics) {
      const parsed = parseLrcLyrics(item.plainLyrics);
      if (parsed.lines.length > 0) {
        return {
          canonicalTrackId: trackId,
          type: 'plain',
          lines: parsed.lines,
          duration: itemDuration,
          isVersionMismatch: isDurationMismatch
        };
      }
    }

    return null;
  };

  const artistsToTry = [firstArtist, commaArtist].filter(Boolean);

  // 3. Step 1 & 2: GET /api/get with first artist, then comma-separated artist
  for (const art of artistsToTry) {
    if (requestId !== activeLyricsRequestId) return null;

    try {
      const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(art)}`;
      const res = await fetch(getUrl, { signal: controller.signal });

      if (requestId !== activeLyricsRequestId) return null;

      if (res.ok) {
        const data = await res.json();
        const processed = processLrcItem(data);
        if (processed) {
          lyricsStorage.saveCachedLyrics(trackId, processed, 7 * 86400 * 1000);
          return processed;
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return null;
    }
  }

  // 4. Step 3 & 4: Search API fallback
  try {
    for (const titleVariant of titleVariants) {
      if (requestId !== activeLyricsRequestId) return null;

      const searchQueries = [
        `https://lrclib.net/api/search?q=${encodeURIComponent(titleVariant + ' ' + firstArtist)}`,
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(titleVariant)}`,
        `https://lrclib.net/api/search?q=${encodeURIComponent(titleVariant)}`
      ];

      for (const searchUrl of searchQueries) {
        if (requestId !== activeLyricsRequestId) return null;

        try {
          const searchRes = await fetch(searchUrl, { signal: controller.signal });
          if (requestId !== activeLyricsRequestId) return null;

          if (searchRes.ok) {
            const list = await searchRes.json();
            if (Array.isArray(list) && list.length > 0) {
              // Pick best match by:
              // 1. Synced lyrics within ±10s duration
              let bestMatch = list.find((item: any) => {
                if (!item.syncedLyrics) return false;
                if (targetDuration <= 0) return true;
                return Math.abs(item.duration - targetDuration) <= 10;
              });

              // 2. Synced lyrics with artist match even if duration is slightly off
              if (!bestMatch) {
                const lowerArt = firstArtist.toLowerCase();
                bestMatch = list.find((item: any) => {
                  if (!item.syncedLyrics) return false;
                  return item.artistName?.toLowerCase().includes(lowerArt);
                });
              }

              // 3. Fallback to any plain lyrics within ±10s
              if (!bestMatch) {
                bestMatch = list.find((item: any) => {
                  if (!item.plainLyrics) return false;
                  if (targetDuration <= 0) return true;
                  return Math.abs(item.duration - targetDuration) <= 10;
                });
              }

              // 4. Fallback to any synced lyrics result
              if (!bestMatch && list[0]?.syncedLyrics) {
                bestMatch = list[0];
              }

              if (bestMatch) {
                const processed = processLrcItem(bestMatch);
                if (processed) {
                  lyricsStorage.saveCachedLyrics(trackId, processed, 7 * 86400 * 1000);
                  return processed;
                }
              }
            }
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') return null;
        }
      }
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') return null;
  }

  // 5. Store not-found result in cache for at most 1 hour (so subsequent renders don't keep hammering LRCLIB)
  lyricsStorage.saveCachedLyrics(
    trackId,
    { canonicalTrackId: trackId, type: 'plain', lines: [] },
    3600 * 1000 // 1 hour max TTL for negative result
  );

  return null;
}

