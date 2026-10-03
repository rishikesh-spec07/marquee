// IndexedDB High-Performance Storage with LRU Eviction & Quota Protection (storage.ts)
import type { PlayHistoryEntry, TasteProfile, CollaborativePair, SavedPlaybackState } from './types';

const DB_NAME = 'soundsphere_db';
const DB_VERSION = 1;

const STORES = {
  PLAY_HISTORY: 'play_history',
  CACHED_LYRICS: 'cached_lyrics',
  COLLABORATIVE_PAIRS: 'collaborative_pairs',
  APP_STATE: 'app_state'
} as const;

const MAX_HISTORY_ENTRIES = 500;
const MAX_LYRICS_ENTRIES = 200;

class RecommendationsStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Play history store with timestamp index
        if (!db.objectStoreNames.contains(STORES.PLAY_HISTORY)) {
          const historyStore = db.createObjectStore(STORES.PLAY_HISTORY, { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('trackId', 'trackId', { unique: false });
        }

        // Cached lyrics store with timestamp index for LRU
        if (!db.objectStoreNames.contains(STORES.CACHED_LYRICS)) {
          const lyricsStore = db.createObjectStore(STORES.CACHED_LYRICS, { keyPath: 'trackId' });
          lyricsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // Collaborative co-occurrence pairs
        if (!db.objectStoreNames.contains(STORES.COLLABORATIVE_PAIRS)) {
          const pairsStore = db.createObjectStore(STORES.COLLABORATIVE_PAIRS, { keyPath: 'id' });
          pairsStore.createIndex('trackA', 'trackA', { unique: false });
          pairsStore.createIndex('count', 'count', { unique: false });
        }

        // Key-value store for taste profile & continue-where-you-left-off
        if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
          db.createObjectStore(STORES.APP_STATE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Safe execution with QuotaExceededError handling.
   * If storage exceeds quota, automatically evicts oldest entries and retries.
   */
  private async safeExecute<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
    try {
      const db = await this.getDB();
      return await fn(db);
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        console.warn('[IndexedDB] QuotaExceededError encountered. Evicting oldest LRU entries...');
        await this.purgeOldestEntries();
        const db = await this.getDB();
        return await fn(db);
      }
      throw err;
    }
  }

  // ======================== PLAY HISTORY (Max 500) ========================

  public async recordPlay(entry: PlayHistoryEntry): Promise<void> {
    try {
      await this.safeExecute(async (db) => {
        const tx = db.transaction([STORES.PLAY_HISTORY], 'readwrite');
        const store = tx.objectStore(STORES.PLAY_HISTORY);
        store.put(entry);

        // Check if count exceeds limit and trim oldest
        const countReq = store.count();
        countReq.onsuccess = () => {
          if (countReq.result > MAX_HISTORY_ENTRIES) {
            const index = store.index('timestamp');
            const deleteCount = countReq.result - MAX_HISTORY_ENTRIES;
            let deleted = 0;
            const cursorReq = index.openCursor();
            cursorReq.onsuccess = () => {
              const cursor = cursorReq.result;
              if (cursor && deleted < deleteCount) {
                cursor.delete();
                deleted++;
                cursor.continue();
              }
            };
          }
        };

        return new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      });
    } catch (e) {
      console.warn('[IndexedDB] Error recording play:', e);
    }
  }

  public async getRecentPlays(limit: number = 100): Promise<PlayHistoryEntry[]> {
    try {
      return await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.PLAY_HISTORY, 'readonly');
        const store = tx.objectStore(STORES.PLAY_HISTORY);
        const index = store.index('timestamp');
        const results: PlayHistoryEntry[] = [];

        return new Promise<PlayHistoryEntry[]>((resolve) => {
          const req = index.openCursor(null, 'prev'); // Most recent first
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor && results.length < limit) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve(results);
            }
          };
          req.onerror = () => resolve([]);
        });
      });
    } catch (e) {
      return [];
    }
  }

  public async getHistoryCount(): Promise<number> {
    try {
      return await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.PLAY_HISTORY, 'readonly');
        const store = tx.objectStore(STORES.PLAY_HISTORY);
        return new Promise<number>((resolve) => {
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(0);
        });
      });
    } catch (e) {
      return 0;
    }
  }

  public async clearHistory(): Promise<void> {
    try {
      await this.safeExecute(async (db) => {
        const tx = db.transaction([STORES.PLAY_HISTORY, STORES.COLLABORATIVE_PAIRS], 'readwrite');
        tx.objectStore(STORES.PLAY_HISTORY).clear();
        tx.objectStore(STORES.COLLABORATIVE_PAIRS).clear();
        return new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      });
    } catch (e) {
      console.warn('[IndexedDB] Clear history error:', e);
    }
  }

  // ==================== COLLABORATIVE CO-OCCURRENCE ====================

  /**
   * Tracks songs played together in sequence or within the same session/playlist
   */
  public async recordCoOccurrence(trackA: string, trackB: string): Promise<void> {
    if (!trackA || !trackB || trackA === trackB) return;
    const pairId = [trackA, trackB].sort().join(':::');

    try {
      await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.COLLABORATIVE_PAIRS, 'readwrite');
        const store = tx.objectStore(STORES.COLLABORATIVE_PAIRS);

        const getReq = store.get(pairId);
        getReq.onsuccess = () => {
          const existing: CollaborativePair | undefined = getReq.result;
          const updated: CollaborativePair = {
            id: pairId,
            trackA: existing ? existing.trackA : trackA,
            trackB: existing ? existing.trackB : trackB,
            count: (existing?.count || 0) + 1,
            lastCoOccurred: Date.now()
          } as any;
          store.put(updated);
        };

        return new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      });
    } catch (e) {}
  }

  public async getCoOccurringTracks(trackId: string, limit: number = 10): Promise<string[]> {
    try {
      return await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.COLLABORATIVE_PAIRS, 'readonly');
        const store = tx.objectStore(STORES.COLLABORATIVE_PAIRS);
        const pairs: CollaborativePair[] = [];

        return new Promise<string[]>((resolve) => {
          const req = store.openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              const val = cursor.value as CollaborativePair;
              if (val.trackA === trackId || val.trackB === trackId) {
                pairs.push(val);
              }
              cursor.continue();
            } else {
              pairs.sort((a, b) => b.count - a.count);
              const relatedIds = pairs.slice(0, limit).map((p) => (p.trackA === trackId ? p.trackB : p.trackA));
              resolve(relatedIds);
            }
          };
          req.onerror = () => resolve([]);
        });
      });
    } catch (e) {
      return [];
    }
  }

  // ========================= TASTE PROFILE =========================

  public async getTasteProfile(): Promise<TasteProfile | null> {
    try {
      return await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.APP_STATE, 'readonly');
        const store = tx.objectStore(STORES.APP_STATE);
        return new Promise<TasteProfile | null>((resolve) => {
          const req = store.get('taste_profile');
          req.onsuccess = () => resolve(req.result?.value || null);
          req.onerror = () => resolve(null);
        });
      });
    } catch (e) {
      return null;
    }
  }

  public async saveTasteProfile(profile: TasteProfile): Promise<void> {
    try {
      await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.APP_STATE, 'readwrite');
        tx.objectStore(STORES.APP_STATE).put({ key: 'taste_profile', value: profile });
        return new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      });
    } catch (e) {}
  }

  public async resetTasteProfile(): Promise<void> {
    try {
      await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.APP_STATE, 'readwrite');
        tx.objectStore(STORES.APP_STATE).delete('taste_profile');
        return new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      });
    } catch (e) {}
  }

  // ================= CONTINUE WHERE YOU LEFT OFF =================

  public async savePlaybackState(state: SavedPlaybackState): Promise<void> {
    try {
      await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.APP_STATE, 'readwrite');
        tx.objectStore(STORES.APP_STATE).put({ key: 'last_playback_state', value: state });
        return new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      });
    } catch (e) {}
  }

  public async getLastPlaybackState(): Promise<SavedPlaybackState | null> {
    try {
      return await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.APP_STATE, 'readonly');
        const store = tx.objectStore(STORES.APP_STATE);
        return new Promise<SavedPlaybackState | null>((resolve) => {
          const req = store.get('last_playback_state');
          req.onsuccess = () => resolve(req.result?.value || null);
          req.onerror = () => resolve(null);
        });
      });
    } catch (e) {
      return null;
    }
  }

  // ======================== CACHED LYRICS ========================

  public async cacheLyrics(trackId: string, lyrics: any): Promise<void> {
    try {
      await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.CACHED_LYRICS, 'readwrite');
        const store = tx.objectStore(STORES.CACHED_LYRICS);
        store.put({ trackId, lyrics, cachedAt: Date.now() });

        // Cap to MAX_LYRICS_ENTRIES
        const countReq = store.count();
        countReq.onsuccess = () => {
          if (countReq.result > MAX_LYRICS_ENTRIES) {
            const index = store.index('cachedAt');
            const deleteCount = countReq.result - MAX_LYRICS_ENTRIES;
            let del = 0;
            const cursorReq = index.openCursor();
            cursorReq.onsuccess = () => {
              const cursor = cursorReq.result;
              if (cursor && del < deleteCount) {
                cursor.delete();
                del++;
                cursor.continue();
              }
            };
          }
        };

        return new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      });
    } catch (e) {}
  }

  public async getCachedLyrics(trackId: string): Promise<any | null> {
    try {
      return await this.safeExecute(async (db) => {
        const tx = db.transaction(STORES.CACHED_LYRICS, 'readonly');
        const store = tx.objectStore(STORES.CACHED_LYRICS);
        return new Promise<any | null>((resolve) => {
          const req = store.get(trackId);
          req.onsuccess = () => resolve(req.result?.lyrics || null);
          req.onerror = () => resolve(null);
        });
      });
    } catch (e) {
      return null;
    }
  }

  // =================== QUOTA SAFE EVICTION ===================

  private async purgeOldestEntries(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction([STORES.PLAY_HISTORY, STORES.CACHED_LYRICS], 'readwrite');

      // Purge oldest 30% of history
      const historyStore = tx.objectStore(STORES.PLAY_HISTORY);
      const hIndex = historyStore.index('timestamp');
      let hCount = 0;
      const hReq = hIndex.openCursor();
      hReq.onsuccess = () => {
        const cursor = hReq.result;
        if (cursor && hCount < 100) {
          cursor.delete();
          hCount++;
          cursor.continue();
        }
      };

      // Purge oldest 40% of lyrics
      const lyricsStore = tx.objectStore(STORES.CACHED_LYRICS);
      const lIndex = lyricsStore.index('cachedAt');
      let lCount = 0;
      const lReq = lIndex.openCursor();
      lReq.onsuccess = () => {
        const cursor = lReq.result;
        if (cursor && lCount < 50) {
          cursor.delete();
          lCount++;
          cursor.continue();
        }
      };

      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {
      console.warn('[IndexedDB] Purge entries error:', e);
    }
  }
}

export const recommendationsStorage = new RecommendationsStorage();
