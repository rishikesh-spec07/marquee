// Song Radio & Related-Song Autoplay Engine without deprecated relatedToVideoId (songRadioService.ts)
// Orders sources by cost: Channel Uploads (1u) -> Cached Artist Songs (7d) -> Local Co-occurrence -> Trending Pool -> Seed Search
import { youtubeDataService } from './youtubeDataService';
import { recommendationsStorage } from '../recommendations/storage';
import { recommendationEngine } from '../recommendations/engine';
import { CURATED_YOUTUBE_CHANNELS } from '../config/youtubeChannels';
import type { Song } from '../types';

class SongRadioService {
  private radioPool: Song[] = [];
  private seedTrack: Song | null = null;
  private artistSearchCache = new Map<string, { songs: Song[]; expiresAt: number }>();

  /**
   * Builds an initial 20-track Song Radio queue for a seed track.
   */
  public async generateRadioForTrack(seed: Song, catalog: Song[]): Promise<Song[]> {
    this.seedTrack = seed;
    const candidates: Song[] = [];
    const seenIds = new Set<string>();

    const seedId = seed.canonicalTrackId || seed.id;
    seenIds.add(seedId);

    const seedArtist = seed.artist.toLowerCase();
    const seedLang = seed.language || 'hindi';

    // 1. CHEAPEST SOURCE: Channel Uploads (1 unit)
    const matchingChannel = CURATED_YOUTUBE_CHANNELS.find(
      (c) => c.name.toLowerCase().includes(seedArtist) || seed.album?.toLowerCase().includes(c.name.toLowerCase())
    );
    if (matchingChannel) {
      try {
        const channelTracks = await youtubeDataService.getChannelUploads(matchingChannel, 20);
        for (const t of channelTracks) {
          const id = t.canonicalTrackId || t.id;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            candidates.push(t);
          }
        }
      } catch (e) {}
    }

    // 2. CHEAP CACHED ARTIST SONGS (1 search reused for 7 days)
    if (candidates.length < 15 && seed.artist && seed.artist !== 'Unknown Artist') {
      const artistTracks = await this.getCachedArtistSongs(seed.artist);
      for (const t of artistTracks) {
        const id = t.canonicalTrackId || t.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          candidates.push(t);
        }
      }
    }

    // 3. ZERO-COST: Local Co-occurrence from User History & Playlists
    const coOccurringIds = await recommendationsStorage.getCoOccurringTracks(seedId, 15);
    for (const trackId of coOccurringIds) {
      const match = catalog.find((s) => (s.canonicalTrackId || s.id) === trackId);
      if (match && !seenIds.has(trackId)) {
        seenIds.add(trackId);
        candidates.push(match);
      }
    }

    // 4. ZERO-COST: Matching Language/Region Trending Pool
    const trendingMatches = catalog.filter((s) => s.language === seedLang || (!s.language && seedLang === 'hindi'));
    for (const t of trendingMatches) {
      const id = t.canonicalTrackId || t.id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        candidates.push(t);
      }
    }

    // 5. EXPENSIVE FALLBACK (100 units): Seed search query ONLY if < 20 candidates
    if (candidates.length < 15) {
      const query = `${seed.artist} ${seed.title}`.trim();
      const searchResults = await youtubeDataService.searchTracks(query, 15);
      for (const t of searchResults) {
        const id = t.canonicalTrackId || t.id;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          candidates.push(t);
        }
      }
    }

    // Score, rank, and apply diversity constraints
    const scored = await this.scoreAndDiversifyCandidates(candidates, seed);
    this.radioPool = scored;
    return this.radioPool.slice(0, 20);
  }

  /**
   * Refills the radio queue when remaining items fall below 5.
   */
  public async refillRadioQueue(catalog: Song[]): Promise<Song[]> {
    if (!this.seedTrack) return [];
    if (this.radioPool.length < 10) {
      // Re-generate using cached sources
      const more = await this.generateRadioForTrack(this.seedTrack, catalog);
      this.radioPool = [...this.radioPool, ...more];
    }
    return this.radioPool;
  }

  /**
   * Scores candidates by language consistency (~80%), artist similarity, view count & taste profile.
   */
  private async scoreAndDiversifyCandidates(candidates: Song[], seed: Song): Promise<Song[]> {
    const recentPlays = await recommendationsStorage.getRecentPlays(20);
    const recentIds = new Set(recentPlays.map((p) => p.trackId));
    const tasteProfile = await recommendationsStorage.getTasteProfile();

    const seedLang = seed.language || 'hindi';
    const seedArtist = seed.artist.toLowerCase();

    const scored = candidates.map((song) => {
      let score = 1.0;

      // 1. Language consistency (~80% target)
      if (song.language === seedLang) {
        score += 2.5;
      }

      // 2. Same Artist boost
      if (song.artist.toLowerCase() === seedArtist) {
        score += 2.0;
      }

      // 3. User taste preference boost
      if (tasteProfile) {
        const artistWeight = tasteProfile.artistWeights[song.artist.toLowerCase()] || 0;
        const genreWeight = tasteProfile.genreWeights[(song.genre || 'pop').toLowerCase()] || 0;
        score += (artistWeight * 0.3) + (genreWeight * 0.2);
      }

      // 4. View count / Popularity (log scaled)
      const views = (song as any).viewCount || 100000;
      score += Math.log10(Math.max(1, views)) * 0.2;

      // 5. Penalty for recently played tracks
      const id = song.canonicalTrackId || song.id;
      if (recentIds.has(id)) {
        score *= 0.4;
      }

      return { song, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply Diversity Filter: Limit to 2 consecutive songs by the same artist
    const diversified: Song[] = [];
    const artistCounts: Record<string, number> = {};
    let lastArtist = '';

    for (const item of scored) {
      const artist = item.song.artist;
      if (artist === lastArtist && (artistCounts[artist] || 0) >= 2) {
        continue;
      }

      diversified.push(item.song);
      artistCounts[artist] = artist === lastArtist ? (artistCounts[artist] || 1) + 1 : 1;
      lastArtist = artist;
    }

    return diversified;
  }

  /**
   * Cached artist track lookup (cached for 7 days).
   */
  private async getCachedArtistSongs(artist: string): Promise<Song[]> {
    const key = artist.toLowerCase().trim();
    const cached = this.artistSearchCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.songs;
    }

    try {
      const songs = await youtubeDataService.searchTracks(`${artist} official video songs`, 12);
      this.artistSearchCache.set(key, { songs, expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) });
      return songs;
    } catch (e) {
      return [];
    }
  }
}

export const songRadioService = new SongRadioService();
