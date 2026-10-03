// Centralized VisionOS API Key & Engine Manager

const DEFAULT_TMDB_KEY = '39ea30f20b74f5aeb5d059eaf1d79f29';
const DEFAULT_MUSIC_KEY = 'AIzaSyBxAbW2nVq-uMfoQMU6rhrMvSHVYLLcnKE';
const DEFAULT_YT_KEY = 'AIzaSyBxAbW2nVq-uMfoQMU6rhrMvSHVYLLcnKE';

function sanitizeKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  return key.trim().replace(/^['"]|['"]$/g, '');
}

export const apiKeyManager = {
  getTMDBKey(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = localStorage.getItem('visionos_tmdb_key');
        if (key) {
          const cleaned = sanitizeKey(key);
          if (cleaned && cleaned !== '2fed16d92c2a48ff905e0a24759febc3') {
            return cleaned;
          }
        }
      }
    } catch (e) {}
    return DEFAULT_TMDB_KEY;
  },

  setTMDBKey(key: string): void {
    const cleanKey = sanitizeKey(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (!cleanKey) {
          localStorage.removeItem('visionos_tmdb_key');
        } else {
          localStorage.setItem('visionos_tmdb_key', cleanKey);
        }
      }
    } catch (e) {}
  },

  getMusicApiKey(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = localStorage.getItem('visionos_music_key');
        return key ? sanitizeKey(key) : DEFAULT_MUSIC_KEY;
      }
    } catch (e) {}
    return DEFAULT_MUSIC_KEY;
  },

  setMusicApiKey(key: string): void {
    const cleanKey = sanitizeKey(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (!cleanKey) {
          localStorage.removeItem('visionos_music_key');
        } else {
          localStorage.setItem('visionos_music_key', cleanKey);
        }
      }
    } catch (e) {}
  },

  getYouTubeKey(): string {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = localStorage.getItem('visionos_yt_key');
        return key ? sanitizeKey(key) : DEFAULT_YT_KEY;
      }
    } catch (e) {}
    return DEFAULT_YT_KEY;
  },

  setYouTubeKey(key: string): void {
    const cleanKey = sanitizeKey(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (!cleanKey) {
          localStorage.removeItem('visionos_yt_key');
        } else {
          localStorage.setItem('visionos_yt_key', cleanKey);
        }
      }
    } catch (e) {}
  },

  isOfflineMode(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('visionos_offline_mode') === 'true';
      }
    } catch (e) {}
    return false;
  },

  setOfflineMode(enabled: boolean): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('visionos_offline_mode', enabled ? 'true' : 'false');
      }
    } catch (e) {}
  },

  async testTMDBKey(keyToTest?: string): Promise<{ success: boolean; message: string }> {
    const rawKey = keyToTest !== undefined ? keyToTest : this.getTMDBKey();
    const key = sanitizeKey(rawKey);

    if (!key) {
      return { success: false, message: 'Please enter a TMDB API key to test' };
    }

    const endpoints = [
      `https://api.tmdb.org/3/configuration?api_key=${encodeURIComponent(key)}`,
      `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(key)}`
    ];

    for (const url of endpoints) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          return { success: true, message: 'TMDB API Key verified successfully!' };
        } else if (res.status === 401) {
          return { success: false, message: 'TMDB Key invalid. Live Fallback Engine active.' };
        } else if (res.status === 429) {
          return { success: false, message: 'TMDB API Rate limit (429). Live Fallback Engine active.' };
        } else {
          return { success: false, message: `TMDB API status: ${res.status}. Live Fallback Engine active.` };
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        // Continue to fallback endpoint if network timeout or error
      }
    }

    return { success: false, message: 'TMDB API unreachable. Built-in fallback catalog active.' };
  },

  async testYouTubeKey(keyToTest?: string): Promise<{ success: boolean; message: string }> {
    const rawKey = keyToTest !== undefined ? keyToTest : this.getYouTubeKey();
    const key = sanitizeKey(rawKey);

    if (!key) {
      return { success: false, message: 'Please enter a YouTube API key to test' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=music&key=${encodeURIComponent(key)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { success: true, message: 'YouTube API Key verified successfully!' };
      } else if (res.status === 400 || res.status === 403) {
        return { success: false, message: 'Invalid or restricted YouTube API Key (400/403). Using built-in fallback audio engine.' };
      } else {
        return { success: false, message: `YouTube API status: ${res.status}. Built-in fallback audio engine active.` };
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: 'YouTube API connection timed out. Built-in fallback audio engine active.' };
      }
      return { success: false, message: 'YouTube API network error. Built-in fallback audio engine active.' };
    }
  },

  resetToDefaults(): void {
    localStorage.removeItem('visionos_tmdb_key');
    localStorage.removeItem('visionos_music_key');
    localStorage.removeItem('visionos_yt_key');
    localStorage.removeItem('visionos_offline_mode');
  }
};

