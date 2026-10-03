// searchStorage.ts - IndexedDB persistence for recent searches (last 30 deduped)
import type { Song } from '../types';

export interface RecentSearchItem {
  id: string; // song id or playlist/artist key
  type: 'song' | 'playlist' | 'artist';
  title: string;
  subtitle: string;
  thumbnail?: string;
  songData?: Song;
  timestamp: number;
}

const DB_NAME = 'marquee_search_recents_db';
const DB_VERSION = 1;
const STORE_RECENTS = 'recents';
const MAX_RECENTS = 30;

class SearchStorage {
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
          if (!db.objectStoreNames.contains(STORE_RECENTS)) {
            db.createObjectStore(STORE_RECENTS, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return this.dbPromise;
  }

  public async getRecentSearches(): Promise<RecentSearchItem[]> {
    try {
      const db = await this.getDB();
      return new Promise<RecentSearchItem[]>((resolve) => {
        const tx = db.transaction(STORE_RECENTS, 'readonly');
        const store = tx.objectStore(STORE_RECENTS);
        const req = store.getAll();
        req.onsuccess = () => {
          const items: RecentSearchItem[] = req.result || [];
          items.sort((a, b) => b.timestamp - a.timestamp);
          resolve(items.slice(0, MAX_RECENTS));
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async addRecentSearch(item: Omit<RecentSearchItem, 'timestamp'>): Promise<RecentSearchItem[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_RECENTS, 'readwrite');
      const store = tx.objectStore(STORE_RECENTS);
      const entry: RecentSearchItem = {
        ...item,
        timestamp: Date.now()
      };
      store.put(entry);

      // Trim exceeding entries if needed
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > MAX_RECENTS) {
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            const list: RecentSearchItem[] = allReq.result || [];
            list.sort((a, b) => b.timestamp - a.timestamp);
            const toRemove = list.slice(MAX_RECENTS);
            toRemove.forEach((r) => store.delete(r.id));
          };
        }
      };

      return this.getRecentSearches();
    } catch (e) {
      console.warn('[SearchStorage] Error saving recent search:', e);
      return [];
    }
  }

  public async removeRecentSearch(id: string): Promise<RecentSearchItem[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_RECENTS, 'readwrite');
      const store = tx.objectStore(STORE_RECENTS);
      store.delete(id);
      return this.getRecentSearches();
    } catch {
      return [];
    }
  }

  public async clearRecentSearches(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_RECENTS, 'readwrite');
      const store = tx.objectStore(STORE_RECENTS);
      store.clear();
    } catch {}
  }
}

export const searchStorage = new SearchStorage();
