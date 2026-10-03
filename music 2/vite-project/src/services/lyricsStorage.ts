// lyricsStorage.ts - IndexedDB persistence for lyrics and per-song sync offsets
import type { TrackLyrics } from './lyricsService';

const DB_NAME = 'marquee_lyrics_db';
const DB_VERSION = 1;
const STORE_LYRICS = 'lyrics_cache';
const STORE_OFFSETS = 'lyrics_offsets';
const MAX_CACHE_ENTRIES = 200;

interface CachedLyricsEntry {
  id: string; // videoId or canonicalTrackId
  lyrics: TrackLyrics;
  cachedAt: number;
  expiresAt: number;
  isCustom?: boolean;
}

interface OffsetEntry {
  id: string; // videoId or canonicalTrackId
  offset: number;
  updatedAt: number;
}

class LyricsStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_LYRICS)) {
            db.createObjectStore(STORE_LYRICS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_OFFSETS)) {
            db.createObjectStore(STORE_OFFSETS, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return this.dbPromise;
  }

  /**
   * Retrieves cached lyrics for a track ID, checking TTL
   */
  public async getCachedLyrics(id: string): Promise<TrackLyrics | null> {
    try {
      const db = await this.getDB();
      return new Promise<TrackLyrics | null>((resolve) => {
        const tx = db.transaction(STORE_LYRICS, 'readonly');
        const store = tx.objectStore(STORE_LYRICS);
        const req = store.get(id);
        req.onsuccess = () => {
          const result: CachedLyricsEntry | undefined = req.result;
          if (!result) return resolve(null);

          // Custom user-added lyrics never expire
          if (result.isCustom) {
            return resolve(result.lyrics);
          }

          // Check TTL expiration
          if (result.expiresAt && Date.now() > result.expiresAt) {
            // Delete expired entry in background
            try {
              const delTx = db.transaction(STORE_LYRICS, 'readwrite');
              delTx.objectStore(STORE_LYRICS).delete(id);
            } catch (e) {}
            return resolve(null);
          }

          resolve(result.lyrics || null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Saves lyrics in cache with LRU cleanup and TTL
   */
  public async saveCachedLyrics(id: string, lyrics: TrackLyrics, ttlMs: number = 7 * 86400 * 1000, isCustom = false): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_LYRICS, 'readwrite');
      const store = tx.objectStore(STORE_LYRICS);

      const entry: CachedLyricsEntry = {
        id,
        lyrics,
        cachedAt: Date.now(),
        expiresAt: isCustom ? Infinity : Date.now() + ttlMs,
        isCustom
      };
      store.put(entry);

      // Clean up old entries if exceeding cache capacity
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > MAX_CACHE_ENTRIES) {
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            const list: CachedLyricsEntry[] = allReq.result || [];
            list.sort((a, b) => a.cachedAt - b.cachedAt);
            const toRemove = list.slice(0, list.length - MAX_CACHE_ENTRIES);
            toRemove.forEach((item) => store.delete(item.id));
          };
        }
      };
    } catch (e) {
      console.warn('[LyricsStorage] Error saving lyrics cache:', e);
    }
  }

  /**
   * Saves custom lyrics pasted by user
   */
  public async saveCustomLyrics(id: string, lyrics: TrackLyrics): Promise<void> {
    return this.saveCachedLyrics(id, lyrics, Infinity, true);
  }

  /**
   * Deletes cached lyrics for a track ID (used for Retry action)
   */
  public async deleteCachedLyrics(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_LYRICS, 'readwrite');
      tx.objectStore(STORE_LYRICS).delete(id);
    } catch (e) {}
  }

  /**
   * Gets saved per-song sync offset (in seconds)
   */
  public async getSongOffset(id: string): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise<number>((resolve) => {
        const tx = db.transaction(STORE_OFFSETS, 'readonly');
        const store = tx.objectStore(STORE_OFFSETS);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && typeof req.result.offset === 'number') {
            resolve(req.result.offset);
          } else {
            resolve(0);
          }
        };
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Saves per-song sync offset (range ±10s)
   */
  public async saveSongOffset(id: string, offset: number): Promise<void> {
    try {
      const clamped = Math.max(-10, Math.min(10, Math.round(offset * 100) / 100));
      const db = await this.getDB();
      const tx = db.transaction(STORE_OFFSETS, 'readwrite');
      const store = tx.objectStore(STORE_OFFSETS);
      const entry: OffsetEntry = {
        id,
        offset: clamped,
        updatedAt: Date.now()
      };
      store.put(entry);
    } catch (e) {
      console.warn('[LyricsStorage] Error saving song offset:', e);
    }
  }
}

export const lyricsStorage = new LyricsStorage();
