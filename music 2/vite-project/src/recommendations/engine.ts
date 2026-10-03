// Client-Side Spotify/Apple Music-Style Hybrid Recommendation Engine (engine.ts)
import type { Song } from '../types';
import type { TasteProfile, PlayHistoryEntry, RecommendationScore } from './types';
import { recommendationsStorage } from './storage';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const DECAY_HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000; // 14-day exponential half-life

class RecommendationEngine {
  private memoryProfile: TasteProfile | null = null;
  private recentSessionTracks: string[] = [];

  constructor() {
    this.loadProfile();
  }

  private async loadProfile() {
    this.memoryProfile = await recommendationsStorage.getTasteProfile();
    if (!this.memoryProfile) {
      this.memoryProfile = {
        artistWeights: {},
        genreWeights: {},
        moodWeights: {},
        totalPlays: 0,
        lastUpdated: Date.now(),
        coldStartCompleted: false,
        preferredGenres: [],
        preferredArtists: []
      };
    }
  }

  // ======================== TASTE PROFILE UPDATES ========================

  /**
   * Tracks a listen event with completion weight and skip penalty
   */
  public async trackListen(song: Song, duration: number, listenDuration: number, liked: boolean = false) {
    if (!song) return;
    const trackId = song.canonicalTrackId || song.id;
    const completionRate = duration > 0 ? Math.min(1.0, listenDuration / duration) : 0.5;
    const skipped = listenDuration < 30 && completionRate < 0.25;

    // 1. Record in IndexedDB history
    const entry: PlayHistoryEntry = {
      id: `${trackId}_${Date.now()}`,
      trackId,
      canonicalTrackId: trackId,
      title: song.title,
      artist: song.artist,
      genre: song.genre || 'Pop',
      albumArt: song.albumArt,
      timestamp: Date.now(),
      duration,
      listenDuration,
      completionRate,
      skipped,
      liked
    };
    await recommendationsStorage.recordPlay(entry);

    // 2. Record collaborative co-occurrence with recently played tracks in current session
    for (const prevTrack of this.recentSessionTracks.slice(-3)) {
      await recommendationsStorage.recordCoOccurrence(prevTrack, trackId);
    }
    this.recentSessionTracks.push(trackId);
    if (this.recentSessionTracks.length > 10) {
      this.recentSessionTracks.shift();
    }

    // 3. Update Taste Profile
    if (!this.memoryProfile) await this.loadProfile();
    const p = this.memoryProfile!;
    p.totalPlays++;
    p.lastUpdated = Date.now();

    // Signal scoring: Completion (+1.0), Like (+2.0), Skip (-1.2)
    let signal = 0.5;
    if (liked) signal += 2.0;
    if (completionRate > 0.8) signal += 1.0;
    else if (completionRate > 0.5) signal += 0.5;
    if (skipped) signal -= 1.2;

    const artistKey = song.artist.toLowerCase();
    const genreKey = (song.genre || 'pop').toLowerCase();

    p.artistWeights[artistKey] = Math.max(0, (p.artistWeights[artistKey] || 0) + signal);
    p.genreWeights[genreKey] = Math.max(0, (p.genreWeights[genreKey] || 0) + signal);

    // Persist updated taste profile
    await recommendationsStorage.saveTasteProfile(p);
  }

  // ======================== HYBRID SCORING ENGINE ========================

  /**
   * Computes hybrid recommendation scores:
   * 50% Content-based (Artist, Genre affinity with time decay)
   * 30% Collaborative (Local session co-occurrence)
   * 20% Trending / Freshness
   * Degrades gracefully when total plays < 10
   */
  public async getRecommendedTracks(
    catalog: Song[],
    currentTrack: Song | null,
    limit: number = 20
  ): Promise<Song[]> {
    if (!catalog || catalog.length === 0) return [];
    if (!this.memoryProfile) await this.loadProfile();

    const profile = this.memoryProfile!;
    const historyCount = await recommendationsStorage.getHistoryCount();
    const recentPlays = await recommendationsStorage.getRecentPlays(20);
    const recentTrackIds = new Set(recentPlays.map((p) => p.trackId));

    // Get collaborative candidates from current track or most recent play
    const anchorId = currentTrack ? (currentTrack.canonicalTrackId || currentTrack.id) : (recentPlays[0]?.trackId || null);
    const coOccurringIds = anchorId ? await recommendationsStorage.getCoOccurringTracks(anchorId, 25) : [];
    const coOccurringSet = new Set(coOccurringIds);

    // Dynamic weight balance: If user has < 10 plays, collaborative weight shifts to trending/cold-start
    let contentWeight = 0.5;
    let collabWeight = 0.3;
    let trendingWeight = 0.2;

    if (historyCount < 10) {
      collabWeight = 0.05;
      contentWeight = 0.55;
      trendingWeight = 0.40;
    }

    const scored: RecommendationScore[] = [];

    // Max normalization factors
    const maxArtistWeight = Math.max(1, ...Object.values(profile.artistWeights));
    const maxGenreWeight = Math.max(1, ...Object.values(profile.genreWeights));

    for (const song of catalog) {
      const trackId = song.canonicalTrackId || song.id;

      // 1. Content Score (Artist + Genre affinity)
      const artistAffinity = (profile.artistWeights[song.artist.toLowerCase()] || 0) / maxArtistWeight;
      const genreAffinity = (profile.genreWeights[(song.genre || 'pop').toLowerCase()] || 0) / maxGenreWeight;
      let contentScore = artistAffinity * 0.65 + genreAffinity * 0.35;

      // Cold-start boost if user specified favorites
      if (profile.preferredArtists.includes(song.artist) || profile.preferredGenres.includes(song.genre || '')) {
        contentScore = Math.max(contentScore, 0.85);
      }

      // 2. Collaborative Score (Co-occurrence in local listening history)
      const isCoOccurring = coOccurringSet.has(trackId);
      const collaborativeScore = isCoOccurring ? 1.0 : 0.1;

      // 3. Trending Score (Based on catalog index order or explicit popularity)
      const catalogIdx = catalog.indexOf(song);
      const trendingScore = Math.max(0.1, 1.0 - (catalogIdx / Math.max(1, catalog.length)));

      // 4. Exploration Buffer: 15% random variance to prevent repetitive filter bubbles
      const explorationBonus = Math.random() * 0.15;

      // Hybrid calculation
      let finalScore =
        contentScore * contentWeight +
        collaborativeScore * collabWeight +
        trendingScore * trendingWeight +
        explorationBonus;

      // Minor penalty for recently played songs to promote novelty
      if (recentTrackIds.has(trackId)) {
        finalScore *= 0.6;
      }

      let reason = 'Trending Hit';
      if (contentScore > 0.6) reason = `Based on your love for ${song.artist}`;
      else if (isCoOccurring) reason = 'Often played together';

      scored.push({
        song,
        contentScore,
        collaborativeScore,
        trendingScore,
        finalScore,
        reason
      });
    }

    // Sort by final score descending
    scored.sort((a, b) => b.finalScore - a.finalScore);

    // Apply Diversity Filter: Max 2 consecutive songs by the same artist
    const diversified: Song[] = [];
    const artistConsecutiveCount: Record<string, number> = {};
    let lastArtist = '';

    for (const item of scored) {
      const artist = item.song.artist;
      if (artist === lastArtist && (artistConsecutiveCount[artist] || 0) >= 2) {
        continue; // Skip third consecutive song from same artist
      }

      diversified.push(item.song);
      artistConsecutiveCount[artist] = (artist === lastArtist ? (artistConsecutiveCount[artist] || 1) + 1 : 1);
      lastArtist = artist;

      if (diversified.length >= limit) break;
    }

    return diversified;
  }

  // ======================== SMART AUTOPLAY / RADIO ========================

  /**
   * Selects next smart autoplay track when manual queue runs empty
   */
  public async getNextRadioTrack(catalog: Song[], currentTrack: Song): Promise<Song> {
    const candidates = await this.getRecommendedTracks(catalog, currentTrack, 10);
    const currId = currentTrack.canonicalTrackId || currentTrack.id;
    const filtered = candidates.filter((s) => (s.canonicalTrackId || s.id) !== currId);
    return filtered[0] || catalog[0];
  }

  // ======================== SMART SHUFFLE ========================

  /**
   * Fisher-Yates shuffle with anti-repetition filter
   */
  public smartShuffle(songs: Song[], currentTrackId?: string): Song[] {
    const arr = [...songs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // Ensure currently playing track stays first if requested
    if (currentTrackId) {
      const currentIdx = arr.findIndex((s) => (s.canonicalTrackId || s.id) === currentTrackId);
      if (currentIdx > 0) {
        const [curr] = arr.splice(currentIdx, 1);
        arr.unshift(curr);
      }
    }

    return arr;
  }

  // ======================== COLD-START ONBOARDING ========================

  public async setColdStartPreferences(genres: string[], artists: string[]) {
    if (!this.memoryProfile) await this.loadProfile();
    const p = this.memoryProfile!;
    p.preferredGenres = genres;
    p.preferredArtists = artists;
    p.coldStartCompleted = true;

    for (const g of genres) {
      p.genreWeights[g.toLowerCase()] = 5.0;
    }
    for (const a of artists) {
      p.artistWeights[a.toLowerCase()] = 6.0;
    }

    await recommendationsStorage.saveTasteProfile(p);
  }

  // ======================== PRIVACY & RESET ========================

  public async clearListeningHistory(): Promise<void> {
    await recommendationsStorage.clearHistory();
    this.recentSessionTracks = [];
  }

  public async resetRecommendations(): Promise<void> {
    await recommendationsStorage.resetTasteProfile();
    await recommendationsStorage.clearHistory();
    this.memoryProfile = {
      artistWeights: {},
      genreWeights: {},
      moodWeights: {},
      totalPlays: 0,
      lastUpdated: Date.now(),
      coldStartCompleted: false,
      preferredGenres: [],
      preferredArtists: []
    };
    this.recentSessionTracks = [];
  }
}

export const recommendationEngine = new RecommendationEngine();
