// Offline-First IndexedDB Playlists Engine (playlistStorage.ts)
// Independent of YouTube account auth. Supports full CRUD, reordering, Liked Songs sync, and public playlist import.
import type { Song } from '../types';
import { youtubeDataService } from './youtubeDataService';

export interface LocalPlaylist {
  id: string;
  name: string;
  description?: string;
  coverArt?: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = 'soundsphere_playlists_db';
const DB_VERSION = 1;
const STORE_NAME = 'playlists';

class PlaylistStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  public async getAllPlaylists(): Promise<LocalPlaylist[]> {
    try {
      const db = await this.getDB();
      return new Promise<LocalPlaylist[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: LocalPlaylist[] = req.result || [];
          resolve(list.sort((a, b) => b.updatedAt - a.updatedAt));
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  public async createPlaylist(name: string, description?: string): Promise<LocalPlaylist> {
    const newPlaylist: LocalPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || 'Untitled Playlist',
      description: description || 'Created on MARQUEE Vision',
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(newPlaylist);
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch (e) {}

    return newPlaylist;
  }

  public async renamePlaylist(id: string, newName: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          req.result.name = newName.trim();
          req.result.updatedAt = Date.now();
          store.put(req.result);
        }
      };
    } catch (e) {}
  }

  public async deletePlaylist(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
    } catch (e) {}
  }

  public async addSongToPlaylist(playlistId: string, song: Song): Promise<boolean> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(playlistId);

      return new Promise<boolean>((resolve) => {
        req.onsuccess = () => {
          if (!req.result) return resolve(false);
          const pl = req.result as LocalPlaylist;
          const trackId = song.canonicalTrackId || song.id;

          // Avoid duplicates
          const exists = pl.songs.some((s) => (s.canonicalTrackId || s.id) === trackId);
          if (!exists) {
            pl.songs.push(song);
            if (!pl.coverArt) pl.coverArt = song.albumArt;
            pl.updatedAt = Date.now();
            store.put(pl);
            resolve(true);
          } else {
            resolve(false);
          }
        };
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  }

  public async removeSongFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(playlistId);
      req.onsuccess = () => {
        if (req.result) {
          const pl = req.result as LocalPlaylist;
          pl.songs = pl.songs.filter((s) => (s.canonicalTrackId || s.id) !== trackId);
          pl.coverArt = pl.songs[0]?.albumArt || undefined;
          pl.updatedAt = Date.now();
          store.put(pl);
        }
      };
    } catch (e) {}
  }

  public async reorderPlaylistSongs(playlistId: string, songs: Song[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(playlistId);
      req.onsuccess = () => {
        if (req.result) {
          const pl = req.result as LocalPlaylist;
          pl.songs = songs;
          pl.updatedAt = Date.now();
          store.put(pl);
        }
      };
    } catch (e) {}
  }

  /**
   * Import Public YouTube Playlist by URL or ID (cost: 1 unit per 50 videos).
   */
  public async importPublicYouTubePlaylist(urlOrId: string): Promise<LocalPlaylist | null> {
    let playlistId = urlOrId.trim();
    if (playlistId.includes('list=')) {
      const match = playlistId.match(/[?&]list=([^&#]+)/);
      if (match) playlistId = match[1];
    }

    try {
      const playlistSongs = await youtubeDataService.getChannelUploads({
        id: playlistId,
        uploadsPlaylistId: playlistId,
        name: 'Imported Playlist',
        language: 'hindi',
        genre: 'Various',
        priority: 1
      }, 50);

      if (playlistSongs.length === 0) return null;

      const newPl = await this.createPlaylist(`Imported Playlist (${playlistSongs.length} Tracks)`);
      for (const song of playlistSongs) {
        await this.addSongToPlaylist(newPl.id, song);
      }
      newPl.songs = playlistSongs;
      newPl.coverArt = playlistSongs[0]?.albumArt;
      return newPl;
    } catch (e) {
      return null;
    }
  }
}

export const playlistStorage = new PlaylistStorage();
